import os
import joblib
import torch
import numpy as np
import pandas as pd
from typing import Dict, Any, Optional
from fastapi import APIRouter, UploadFile, Depends, HTTPException, Form, BackgroundTasks, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from backend.app.core.database import get_db, SessionLocal
from backend.app.core.config import DATA_DIR, UPLOAD_DIR, DEFAULT_NUM_BANKS
from backend.app.models.bank import Bank
from backend.app.models.trust import TrustScoreHistory, RoundMetric, TrainingLog
from backend.app.services.data_loader import DataLoaderService
from backend.app.services.fraud_detector import FraudDetectorService
from backend.app.services.federated_learner import FederatedLearnerService
from backend.app.services.trust_score import TrustScoreService
from backend.clients.bank_client import FraudMLP

router = APIRouter()

# 1. Dataset Loading & Preprocessing
@router.post("/upload/dataset")
async def upload_dataset(
    file: Optional[UploadFile] = None, 
    num_banks: int = Form(DEFAULT_NUM_BANKS),
    db: Session = Depends(get_db)
):
    """
    Uploads a custom credit card dataset or triggers the synthetic IEEE-CIS dataset generator
    if no file is provided. Normalizes, splits non-IID into bank CSVs, and fits baselines.
    """
    loader = DataLoaderService()
    file_path = None

    try:
        # Clear existing logs
        db.query(TrainingLog).delete()
        db.query(RoundMetric).delete()
        db.query(TrustScoreHistory).delete()
        db.commit()

        if file:
            # Save uploaded CSV file
            file_path = UPLOAD_DIR / file.filename
            with open(file_path, "wb") as f:
                content = await file.read()
                f.write(content)
            
            log = TrainingLog(level="INFO", message=f"Dataset uploaded: {file.filename}")
            db.add(log)
            db.commit()
        else:
            log = TrainingLog(level="INFO", message="No dataset uploaded. Launching synthetic IEEE-CIS generator...")
            db.add(log)
            db.commit()

        # Load and preprocess
        df = loader.load_and_preprocess(file_path)
        
        # Split non-IID bank datasets
        loader.split_non_iid_banks(df, num_banks)

        # Generate SMOTE balanced datasets and distribution plots for all banks
        from backend.app.services.smote_handler import SmoteHandlerService
        for i in range(1, num_banks + 1):
            SmoteHandlerService.balance_bank_data(i)

        # Log completion
        log_comp = TrainingLog(level="INFO", message="Dataset preprocessing, multi-bank split, and SMOTE balancing completed.")
        db.add(log_comp)
        db.commit()

        # Run centralized baselines right away
        log_baselines = TrainingLog(level="INFO", message="Training centralized baseline models (XGBoost and PyTorch MLP)...")
        db.add(log_baselines)
        db.commit()

        xgb_metrics = FraudDetectorService.train_centralized_xgboost()
        mlp_metrics = FederatedLearnerService.train_centralized_mlp()

        log_baselines_done = TrainingLog(
            level="INFO", 
            message=f"Baselines ready! Centralized XGBoost Acc={xgb_metrics['accuracy']:.4f}, Centralized MLP Acc={mlp_metrics['accuracy']:.4f}"
        )
        db.add(log_baselines_done)
        db.commit()

        return {
            "status": "success",
            "message": "Dataset processed and split successfully. Centralized baseline models trained.",
            "baselines": {
                "xgboost": xgb_metrics,
                "mlp": mlp_metrics
            }
        }
    except Exception as e:
        log_err = TrainingLog(level="ERROR", message=f"Dataset load failed: {str(e)}")
        db.add(log_err)
        db.commit()
        raise HTTPException(status_code=500, detail=str(e))


# 2. Get Banks List
@router.get("/banks/list")
def list_banks(db: Session = Depends(get_db)):
    banks = db.query(Bank).all()
    return [
        {
            "id": b.id,
            "name": b.name,
            "status": b.status,
            "transaction_count": b.transaction_count,
            "fraud_count": b.fraud_count,
            "local_accuracy": b.local_accuracy,
            "current_trust_score": b.current_trust_score
        }
        for b in banks
    ]


# Reset Bank Trust Scores Back to Initial 1.000
@router.post("/banks/reset-trust")
def reset_bank_trust(db: Session = Depends(get_db)):
    """
    Resets all bank trust scores back to initial default 1.000,
    clears trust score history and internal consistency cache.
    """
    db.query(TrustScoreHistory).delete()
    banks = db.query(Bank).all()
    for b in banks:
        b.current_trust_score = 1.0
        b.local_accuracy = 0.0
    db.commit()
    TrustScoreService.clear_cache()
    return {
        "status": "success",
        "message": "All bank trust scores reset to initial state (1.000)."
    }


# 3. Get Specific Bank Trust Score History
@router.get("/bank/{id}/trust-score")
def bank_trust_score(id: int, db: Session = Depends(get_db)):
    bank = db.query(Bank).filter(Bank.id == id).first()
    if not bank:
        raise HTTPException(status_code=404, detail="Bank not found")

    history = db.query(TrustScoreHistory)\
        .filter(TrustScoreHistory.bank_id == id)\
        .order_by(TrustScoreHistory.round.asc())\
        .all()

    return {
        "bank_id": bank.id,
        "name": bank.name,
        "current_trust_score": bank.current_trust_score,
        "history": [
            {
                "round": h.round,
                "accuracy": h.accuracy,
                "consistency": h.consistency,
                "reliability": h.reliability,
                "trust_score": h.trust_score,
                "timestamp": h.timestamp
            }
            for h in history
        ]
    }


# 4. Trigger Federated Learning Training
@router.post("/train/federated")
def train_federated(config: Dict[str, Any], db: Session = Depends(get_db)):
    rounds = config.get("rounds", 10)
    method = config.get("method", "Trust-FL")  # 'Trust-FL' or 'FedAvg'

    if method not in ["Trust-FL", "FedAvg"]:
        raise HTTPException(status_code=400, detail="Invalid aggregation method. Use 'Trust-FL' or 'FedAvg'.")

    # Verify that local bank datasets exist
    for i in range(1, DEFAULT_NUM_BANKS + 1):
        bank_file = DATA_DIR / f"bank_{i}_balanced.csv"
        if not bank_file.exists():
            raise HTTPException(status_code=400, detail=f"Bank {i} balanced dataset not found. Please upload/generate dataset first.")

    success = FederatedLearnerService.run_training_in_background(rounds, method)
    if not success:
        return {"status": "error", "message": "Training is already in progress."}

    return {"status": "success", "message": f"Federated simulation ({method}) started in background."}


# 5. Stop Federated Learning Training
@router.post("/train/stop")
def stop_federated():
    stopped = FederatedLearnerService.stop_training()
    if not stopped:
        return {"status": "error", "message": "No active training session to stop."}
    return {"status": "success", "message": "Federated training session stopped."}


# 6. Global Model Accuracy history
@router.get("/model/global-accuracy")
def global_accuracy(db: Session = Depends(get_db)):
    metrics = db.query(RoundMetric).order_by(RoundMetric.round.asc()).all()
    return [
        {
            "round": m.round,
            "method": m.method,
            "accuracy": m.accuracy,
            "precision": m.precision,
            "recall": m.recall,
            "f1": m.f1,
            "auc_roc": m.auc_roc
        }
        for m in metrics
    ]


# 7. Get All Model Metrics (Centralized vs FedAvg vs Trust-FL)
@router.get("/metrics/all")
def get_all_metrics(db: Session = Depends(get_db)):
    # 1. Centralized XGBoost
    xgb_path = DATA_DIR / "metrics_centralized_xgboost.joblib"
    xgb_metrics = joblib.load(xgb_path) if xgb_path.exists() else None

    # 2. Centralized MLP
    mlp_path = DATA_DIR / "metrics_centralized_mlp.joblib"
    mlp_metrics = joblib.load(mlp_path) if mlp_path.exists() else None

    # 3. Federated FedAvg final round
    fedavg_metric = db.query(RoundMetric)\
        .filter(RoundMetric.method == "FedAvg")\
        .order_by(RoundMetric.round.desc())\
        .first()

    # 4. Federated Trust-FL final round
    trust_fl_metric = db.query(RoundMetric)\
        .filter(RoundMetric.method == "Trust-FL")\
        .order_by(RoundMetric.round.desc())\
        .first()

    return {
        "centralized_xgboost": xgb_metrics,
        "centralized_mlp": mlp_metrics,
        "fedavg": {
            "method": "FedAvg MLP",
            "accuracy": fedavg_metric.accuracy,
            "precision": fedavg_metric.precision,
            "recall": fedavg_metric.recall,
            "f1": fedavg_metric.f1,
            "auc_roc": fedavg_metric.auc_roc,
            "round": fedavg_metric.round
        } if fedavg_metric else None,
        "trust_fl": {
            "method": "Trust-FL MLP",
            "accuracy": trust_fl_metric.accuracy,
            "precision": trust_fl_metric.precision,
            "recall": trust_fl_metric.recall,
            "f1": trust_fl_metric.f1,
            "auc_roc": trust_fl_metric.auc_roc,
            "round": trust_fl_metric.round
        } if trust_fl_metric else None
    }


# 8. Training status and logs
@router.get("/training/status")
def training_status(db: Session = Depends(get_db)):
    status = FederatedLearnerService.get_status()
    logs = db.query(TrainingLog).order_by(TrainingLog.timestamp.desc()).limit(100).all()
    
    return {
        "status": status,
        "logs": [
            {
                "timestamp": l.timestamp.strftime("%Y-%m-%d %H:%M:%S") if l.timestamp else "",
                "level": l.level,
                "message": l.message
            }
            for l in logs
        ]
    }


# 9. Real-Time Fraud Predictor Endpoint
@router.post("/predict/fraud")
def predict_fraud(transaction: Dict[str, Any], model_type: str = "trust-fl"):
    """
    Accepts transaction details, normalizes numerical values, encodes categories,
    and runs the prediction against the requested model type ('xgboost', 'mlp_centralized', 'fedavg', 'trust-fl').
    """
    if model_type not in ["xgboost", "mlp_centralized", "fedavg", "trust-fl"]:
        raise HTTPException(status_code=400, detail="Invalid model type.")

    # Check model files
    if model_type == "xgboost":
        model_file = DATA_DIR / "xgboost_centralized.joblib"
    elif model_type == "mlp_centralized":
        model_file = DATA_DIR / "mlp_centralized.pth"
    else:  # fedavg or trust-fl
        model_file = DATA_DIR / f"global_mlp_{model_type}.pth"

    if not model_file.exists():
        raise HTTPException(status_code=400, detail=f"Selected model '{model_type}' is not trained. Please upload data or train FL first.")

    # Load preprocessing modules
    scaler_file = DATA_DIR / "scaler.joblib"
    encoders_file = DATA_DIR / "encoders.joblib"
    card1_meta_file = DATA_DIR / "card1_meta.joblib"

    if not scaler_file.exists() or not encoders_file.exists():
        raise HTTPException(status_code=400, detail="Preprocessor scaler not found. Please upload dataset first.")

    scaler = joblib.load(scaler_file)
    encoders = joblib.load(encoders_file)
    card1_meta = joblib.load(card1_meta_file) if card1_meta_file.exists() else None

    try:
        # Preprocess single record
        df = pd.DataFrame([transaction])

        # Fill missing features using defaults/medians (represented by 0.0 for safety)
        # Expected columns from synthetic generator
        expected_cols = [
            'TransactionDT', 'TransactionAmt', 'ProductCD', 'card1', 
            'card4', 'card6', 'P_emaildomain', 'C1', 'C2', 'C13', 'D1', 'D2'
        ] + [f"V{i}" for i in range(1, 31)]

        for c in expected_cols:
            if c not in df.columns:
                df[c] = 0.0

        # Encode categorical columns
        for col, le in encoders.items():
            val = str(df.loc[0, col])
            if val not in le.classes_:
                # Map to first class or a default if unknown
                df[col] = le.transform([le.classes_[0]])[0]
            else:
                df[col] = le.transform([val])[0]

        # Extract features for scaling
        numeric_features = [
            'TransactionDT', 'TransactionAmt', 'C1', 'C2', 'C13', 'D1', 'D2'
        ] + [f"V{i}" for i in range(1, 31)]

        # Scale features
        df[numeric_features] = scaler.transform(df[numeric_features])

        # Scale card1 feature
        if card1_meta:
            df['card1'] = (df['card1'] - card1_meta['mean']) / card1_meta['std']
        else:
            df['card1'] = (df['card1'] - 9500.0) / 4900.0

        # Drop ID / targets if any
        X_features = df.drop(columns=['TransactionID', 'isFraud'], errors='ignore')
        
        # Ensure correct column order matching scaling dimension
        X_array = X_features.values.astype(np.float32)

        if model_type == "xgboost":
            # Run XGBoost inference
            clf = joblib.load(model_file)
            prob = float(clf.predict_proba(X_array)[0, 1])
        else:
            # Run PyTorch MLP inference
            input_dim = X_array.shape[1]
            model = FraudMLP(input_dim)
            model.load_state_dict(torch.load(model_file, map_location=torch.device("cpu")))
            model.eval()
            
            with torch.no_grad():
                prob = float(model(torch.tensor(X_array)).numpy().flatten()[0])

        is_fraud = int(prob >= 0.5)
        confidence = prob if is_fraud == 1 else 1.0 - prob

        return {
            "model_type": model_type,
            "prediction": "Fraud" if is_fraud == 1 else "Non-Fraud",
            "is_fraud": is_fraud,
            "probability": float(prob * 100),
            "confidence": float(confidence * 100)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference failed: {str(e)}")


# 10. WebSocket Endpoint for progress monitoring
@router.websocket("/ws/training")
async def websocket_training(websocket: WebSocket):
    await websocket.accept()
    FederatedLearnerService.register_websocket(websocket)
    
    # Send initial status
    status = FederatedLearnerService.get_status()
    # Send current bank configurations
    db = SessionLocal()
    try:
        banks = db.query(Bank).all()
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
            for b in banks
        ]
        await websocket.send_json({
            "type": "connection_established",
            "status": status,
            "banks": banks_list
        })

        # Keep connection open
        while True:
            # We wait for messages (like ping) if any, but mostly we just push updates
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        FederatedLearnerService.unregister_websocket(websocket)
    except Exception:
        FederatedLearnerService.unregister_websocket(websocket)
    finally:
        db.close()
