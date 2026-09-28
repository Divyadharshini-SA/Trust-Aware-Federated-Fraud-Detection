import os
os.environ["PYTHONNOUSERSITE"] = "1"

import threading
import time
import torch
from torch.utils.data import DataLoader, TensorDataset
import pandas as pd
import numpy as np
import flwr as fl
import joblib
from collections import OrderedDict
from typing import Dict, Optional, Tuple
from sqlalchemy.orm import Session
from sklearn.model_selection import train_test_split
from backend.app.core.config import DATA_DIR, DEFAULT_NUM_BANKS
from backend.app.core.database import SessionLocal
from backend.app.models.trust import RoundMetric, TrainingLog
from backend.app.models.bank import Bank
from backend.app.services.aggregation import TrustWeightedFedAvg
from backend.app.services.trust_score import TrustScoreService
from backend.clients.bank_client import FlowerBankClient, FraudMLP, evaluate_local_model, train_local_model

class FederatedLearnerService:
    # State tracking
    is_training = False
    current_round = 0
    total_rounds = 0
    aggregation_method = "Trust-FL"  # "Trust-FL" or "FedAvg"
    _stop_requested = False
    _thread: Optional[threading.Thread] = None

    # Global active clients store
    _active_ws = set()

    @classmethod
    def register_websocket(cls, ws):
        cls._active_ws.add(ws)

    @classmethod
    def unregister_websocket(cls, ws):
        if ws in cls._active_ws:
            cls._active_ws.remove(ws)

    @classmethod
    async def broadcast_status(cls, data: dict):
        """Sends updates to all connected WebSockets for real-time frontend visualization."""
        import json
        closed_ws = []
        for ws in list(cls._active_ws):
            try:
                await ws.send_json(data)
            except Exception:
                closed_ws.append(ws)
        for ws in closed_ws:
            cls.unregister_websocket(ws)

    @classmethod
    def get_status(cls):
        return {
            "is_training": cls.is_training,
            "current_round": cls.current_round,
            "total_rounds": cls.total_rounds,
            "aggregation_method": cls.aggregation_method
        }

    @classmethod
    def stop_training(cls):
        if cls.is_training:
            cls._stop_requested = True
            db = SessionLocal()
            log = TrainingLog(level="WARNING", message="Training stop requested by user.")
            db.add(log)
            db.commit()
            db.close()
            return True
        return False

    @classmethod
    def run_training_in_background(cls, rounds: int, method: str):
        """
        Launches the Flower simulation in a separate thread.
        """
        if cls.is_training:
            return False

        cls.is_training = True
        cls._stop_requested = False
        cls.current_round = 0
        cls.total_rounds = rounds
        cls.aggregation_method = method

        # Reset trust score cache
        TrustScoreService.clear_cache()

        cls._thread = threading.Thread(
            target=cls._execute_simulation,
            args=(rounds, method),
            daemon=True
        )
        cls._thread.start()
        return True

    @classmethod
    def _execute_simulation(cls, rounds: int, method: str):
        # Allow the FastAPI HTTP response to finish and close the socket
        # before Ray spawns child processes (which could inherit the socket on Windows).
        time.sleep(2.0)
        
        db = SessionLocal()
        try:
            log = TrainingLog(level="INFO", message=f"Starting Federated Learning simulation ({method}) for {rounds} rounds.")
            db.add(log)
            db.commit()

            # Set all banks to online
            banks = db.query(Bank).all()
            for bank in banks:
                bank.status = "online"
            db.commit()

            # 1. Combine bank datasets to create a Centralized validation set for global evaluation
            # This enables us to evaluate the global model on the exact same unseen validation set
            val_features = []
            val_targets = []
            
            for i in range(1, DEFAULT_NUM_BANKS + 1):
                balanced_file = DATA_DIR / f"bank_{i}_balanced.csv"
                if not balanced_file.exists():
                    from backend.app.services.smote_handler import SmoteHandlerService
                    SmoteHandlerService.balance_bank_data(i)

                df = pd.read_csv(balanced_file)
                X = df.drop(columns=['TransactionID', 'isFraud']).values.astype(np.float32)
                y = df['isFraud'].values.astype(np.float32).reshape(-1, 1)
                
                # Split and get validation slice (20%)
                _, X_val, _, y_val = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
                val_features.append(X_val)
                val_targets.append(y_val)

            global_X_val = np.concatenate(val_features, axis=0)
            global_y_val = np.concatenate(val_targets, axis=0)
            input_dim = global_X_val.shape[1]

            val_dataset = TensorDataset(torch.tensor(global_X_val), torch.tensor(global_y_val))
            global_val_loader = DataLoader(val_dataset, batch_size=64, shuffle=False)

            # Define evaluate function
            def get_eval_fn():
                device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
                model = FraudMLP(input_dim).to(device)

                def evaluate(
                    server_round: int,
                    parameters: fl.common.NDArrays,
                    config: Dict[str, fl.common.Scalar]
                ) -> Optional[Tuple[float, Dict[str, fl.common.Scalar]]]:
                    
                    if cls._stop_requested:
                        # Throw exception to force Flower to stop simulation
                        raise KeyboardInterrupt("Stop requested by user.")

                    cls.current_round = server_round
                    
                    # Update parameters
                    params_dict = zip(model.state_dict().keys(), parameters)
                    state_dict = OrderedDict({k: torch.tensor(v) for k, v in params_dict})
                    model.load_state_dict(state_dict, strict=True)

                    # Evaluate global model
                    loss, acc, prec, rec, f1, auc = evaluate_local_model(model, global_val_loader, device)

                    # Save global model
                    torch.save(model.state_dict(), DATA_DIR / f"global_mlp_{method.lower()}.pth")

                    # Log to DB
                    db_round = SessionLocal()
                    round_metric = RoundMetric(
                        round=server_round,
                        method=method,
                        accuracy=acc,
                        precision=prec,
                        recall=rec,
                        f1=f1,
                        auc_roc=auc
                    )
                    db_round.add(round_metric)

                    log_msg = TrainingLog(
                        level="INFO",
                        message=f"Round {server_round} complete. Global Model ({method}) -> Acc: {acc:.4f}, Prec: {prec:.4f}, Rec: {rec:.4f}, F1: {f1:.4f}, AUC: {auc:.4f}"
                    )
                    db_round.add(log_msg)
                    db_round.commit()
                    db_round.close()

                    # Trigger async broadcast using helper event loop
                    import asyncio
                    # Use run_coroutine_threadsafe if loop is running or make a simple task
                    try:
                        # Retrieve current bank trust scores to broadcast
                        db_bank = SessionLocal()
                        banks_data = db_bank.query(Bank).all()
                        banks_list = [
                            {
                                "id": b.id,
                                "name": b.name,
                                "status": b.status,
                                "transaction_count": b.transaction_count,
                                "fraud_count": b.fraud_count,
                                "local_accuracy": b.local_accuracy,
                                "current_trust_score": b.current_trust_score
                            }
                            for b in banks_data
                        ]
                        db_bank.close()

                        loop = asyncio.get_event_loop()
                    except RuntimeError:
                        loop = asyncio.new_event_loop()
                        asyncio.set_event_loop(loop)

                    status_update = {
                        "type": "training_update",
                        "round": server_round,
                        "total_rounds": rounds,
                        "method": method,
                        "accuracy": acc,
                        "loss": loss,
                        "precision": prec,
                        "recall": rec,
                        "f1": f1,
                        "auc_roc": auc,
                        "banks": banks_list
                    }
                    
                    if loop.is_running():
                        asyncio.run_coroutine_threadsafe(cls.broadcast_status(status_update), loop)
                    else:
                        loop.run_until_complete(cls.broadcast_status(status_update))

                    return loss, {"accuracy": acc, "f1": f1}
                return evaluate

            # Client generator function
            def client_fn(cid: str) -> fl.client.Client:
                bank_id = int(cid) + 1  # cids are "0", "1", "2", etc.
                # Create and return numpy client wrapper
                # We train 1 epoch locally per round to make training realistic and fast
                return FlowerBankClient(bank_id=bank_id, epochs=1, batch_size=32).to_client()

            # Set up aggregation strategy
            strategy = TrustWeightedFedAvg(
                use_trust_weighting=(method == "Trust-FL"),
                fraction_fit=1.0,
                fraction_evaluate=1.0,
                min_fit_clients=DEFAULT_NUM_BANKS,
                min_evaluate_clients=DEFAULT_NUM_BANKS,
                min_available_clients=DEFAULT_NUM_BANKS,
                evaluate_fn=get_eval_fn()
            )

            # Start Flower simulation
            fl.simulation.start_simulation(
                client_fn=client_fn,
                num_clients=DEFAULT_NUM_BANKS,
                config=fl.server.ServerConfig(num_rounds=rounds),
                strategy=strategy
            )

            # Normal termination
            cls.is_training = False
            log_end = TrainingLog(level="INFO", message=f"Federated Learning simulation ({method}) finished successfully.")
            db.add(log_end)
            db.commit()

        except KeyboardInterrupt:
            cls.is_training = False
            cls._stop_requested = False
            print("Federated Learning simulation stopped gracefully by user request.")
        except Exception as e:
            cls.is_training = False
            cls._stop_requested = False
            print(f"Error in Federated Learning simulation: {e}")
            log_err = TrainingLog(level="ERROR", message=f"Federated Learning simulation failed: {str(e)}")
            db.add(log_err)
            db.commit()
        finally:
            db.close()
            # Set all banks to offline
            db_off = SessionLocal()
            try:
                banks = db_off.query(Bank).all()
                for bank in banks:
                    bank.status = "offline"
                db_off.commit()
                
                # Broadcast final termination state
                import asyncio
                loop = asyncio.get_event_loop()
                end_update = {"type": "training_finished", "method": method}
                if loop.is_running():
                    asyncio.run_coroutine_threadsafe(cls.broadcast_status(end_update), loop)
                else:
                    loop.run_until_complete(cls.broadcast_status(end_update))
            except Exception:
                pass
            finally:
                db_off.close()

    @classmethod
    def train_centralized_mlp(cls) -> dict:
        """
        Trains a PyTorch MLP on the combined balanced dataset (centralized neural network)
        to act as a baseline comparison model.
        """
        combined_df = pd.concat([pd.read_csv(DATA_DIR / f"bank_{i}_balanced.csv") for i in range(1, DEFAULT_NUM_BANKS + 1)], ignore_index=True)
        
        X = combined_df.drop(columns=['TransactionID', 'isFraud']).values.astype(np.float32)
        y = combined_df['isFraud'].values.astype(np.float32).reshape(-1, 1)

        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
        
        train_dataset = TensorDataset(torch.tensor(X_train), torch.tensor(y_train))
        test_dataset = TensorDataset(torch.tensor(X_test), torch.tensor(y_test))
        
        train_loader = DataLoader(train_dataset, batch_size=64, shuffle=True)
        test_loader = DataLoader(test_dataset, batch_size=64, shuffle=False)

        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        model = FraudMLP(X.shape[1]).to(device)

        print("Training Centralized MLP model...")
        # Train for 5 epochs for speed and fair comparison with FL rounds
        train_local_model(model, train_loader, epochs=5, lr=0.002, device=device)

        loss, acc, prec, rec, f1, auc = evaluate_local_model(model, test_loader, device)

        torch.save(model.state_dict(), DATA_DIR / "mlp_centralized.pth")
        print(f"Centralized MLP training complete. Acc: {acc:.4f}, F1: {f1:.4f}")

        metrics = {
            "method": "Centralized MLP",
            "accuracy": float(acc),
            "precision": float(prec),
            "recall": float(rec),
            "f1": float(f1),
            "auc_roc": float(auc)
        }
        
        joblib.dump(metrics, DATA_DIR / "metrics_centralized_mlp.joblib")
        return metrics
