import numpy as np
import flwr as fl
from flwr.common import Parameters, Scalar, ndarrays_to_parameters, parameters_to_ndarrays
from typing import Dict, List, Optional, Tuple, Union
from sqlalchemy.orm import Session
from backend.app.core.database import SessionLocal
from backend.app.services.trust_score import TrustScoreService
from backend.app.models.trust import RoundMetric, TrainingLog, TrustScoreHistory

class TrustWeightedFedAvg(fl.server.strategy.FedAvg):
    def __init__(self, use_trust_weighting: bool = True, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.use_trust_weighting = use_trust_weighting
        self.current_global_parameters: Optional[List[np.ndarray]] = None

    def configure_fit(self, server_round: int, parameters: Parameters, client_manager) -> List[Tuple]:
        """
        Save the global parameters of the current round before sending them to clients,
        then delegate to parent class.
        """
        self.current_global_parameters = parameters_to_ndarrays(parameters)
        return super().configure_fit(server_round, parameters, client_manager)

    def aggregate_fit(
        self,
        server_round: int,
        results: List[Tuple[fl.server.client_proxy.ClientProxy, fl.common.FitRes]],
        failures: List[Union[Tuple[fl.server.client_proxy.ClientProxy, fl.common.FitRes], BaseException]],
    ) -> Tuple[Optional[Parameters], Dict[str, Scalar]]:
        """
        Computes Trust Scores for active clients, performs Trust-Weighted parameter
        aggregation, and records progress in the database.
        """
        if not results:
            return None, {}

        # 1. Update database connection
        db: Session = SessionLocal()
        
        try:
            # Keep track of individual client contributions
            weights_list = []
            sample_sizes = []
            trust_scores = []
            client_metrics = []

            # Track successful banks vs failed banks
            successful_bank_ids = set()

            for client_proxy, fit_res in results:
                # Retrieve client metrics
                metrics = fit_res.metrics
                accuracy = float(metrics.get("accuracy", 0.0))
                bank_id = int(metrics.get("bank_id", 0))
                num_samples = fit_res.num_examples

                if bank_id == 0:
                    continue

                successful_bank_ids.add(bank_id)
                client_w = parameters_to_ndarrays(fit_res.parameters)

                # Compute Trust Score Components
                consistency = TrustScoreService.calculate_consistency(
                    bank_id, client_w, self.current_global_parameters
                )
                reliability = TrustScoreService.calculate_reliability(
                    db, bank_id, server_round, success=True
                )
                
                # Update trust history and fetch final score
                trust = TrustScoreService.update_bank_trust(
                    db, bank_id, server_round, accuracy, consistency, reliability
                )

                # Log to DB
                log = TrainingLog(
                    level="INFO",
                    message=f"Round {server_round} - Bank {bank_id}: Trust={trust:.4f} (Acc={accuracy:.4f}, Cons={consistency:.4f}, Rel={reliability:.4f})"
                )
                db.add(log)

                # Store for aggregation
                weights_list.append(client_w)
                sample_sizes.append(num_samples)
                trust_scores.append(trust)
                client_metrics.append({
                    "bank_id": bank_id,
                    "accuracy": accuracy,
                    "trust": trust
                })

            # Check for failures and update reliability for failed banks
            # We assume banks that are not in results failed in this round
            for i in range(1, 6):  # 5 banks
                if i not in successful_bank_ids:
                    # Mark bank as offline
                    from backend.app.models.bank import Bank
                    bank = db.query(Bank).filter(Bank.id == i).first()
                    if bank:
                        bank.status = "offline"
                    
                    # Update reliability with failed status
                    reliability = TrustScoreService.calculate_reliability(
                        db, i, server_round, success=False
                    )
                    # Use last known accuracy/consistency
                    prev_history = db.query(TrustScoreHistory)\
                        .filter(TrustScoreHistory.bank_id == i, TrustScoreHistory.round == server_round - 1)\
                        .first()
                    acc = prev_history.accuracy if prev_history else 0.0
                    cons = prev_history.consistency if prev_history else 1.0

                    TrustScoreService.update_bank_trust(
                        db, i, server_round, acc, cons, reliability
                    )

                    log = TrainingLog(
                        level="WARNING",
                        message=f"Round {server_round} - Bank {i} failed to respond. Updated reliability to {reliability:.4f}."
                    )
                    db.add(log)

            db.commit()

            # 2. Aggregate parameters
            if not weights_list:
                return None, {}

            if self.use_trust_weighting:
                # Trust-Weighted Aggregation:
                # W_global = Sum(Trust_i * W_i) / Sum(Trust_i)
                sum_trust = sum(trust_scores)
                if sum_trust == 0:
                    # Fallback to simple average if all trust scores are 0
                    sum_trust = len(trust_scores)
                    trust_weights = [1.0 / sum_trust] * len(trust_scores)
                else:
                    trust_weights = [t / sum_trust for t in trust_scores]

                # Initialize aggregated weights container
                aggregated_weights = [np.zeros_like(w) for w in weights_list[0]]
                for client_w, weight in zip(weights_list, trust_weights):
                    for idx, layer in enumerate(client_w):
                        aggregated_weights[idx] += layer * weight
            else:
                # Standard FedAvg (weighted by sample sizes)
                total_samples = sum(sample_sizes)
                sample_weights = [n / total_samples for n in sample_sizes]

                aggregated_weights = [np.zeros_like(w) for w in weights_list[0]]
                for client_w, weight in zip(weights_list, sample_weights):
                    for idx, layer in enumerate(client_w):
                        aggregated_weights[idx] += layer * weight

            parameters_aggregated = ndarrays_to_parameters(aggregated_weights)
            
            # Call superclass aggregate_fit metrics hook (we will handle the main reporting ourselves)
            _, metrics_aggregated = super().aggregate_fit(server_round, results, failures)
            
            return parameters_aggregated, metrics_aggregated

        except Exception as e:
            db.rollback()
            print(f"Error in aggregate_fit: {e}")
            # Fallback to standard aggregation if anything fails
            return super().aggregate_fit(server_round, results, failures)
        finally:
            db.close()
