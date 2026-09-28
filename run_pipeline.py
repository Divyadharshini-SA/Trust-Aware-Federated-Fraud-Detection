"""
End-to-End Pipeline Validation Script
Trust-Aware Federated Fraud Detection System

Fully self-contained: copies MLP logic directly to avoid flwr/ray/protobuf conflicts.
Runs all 4 model types and prints actual numeric metrics.
"""
import sys
# Prevent Python from loading conflicting packages from the user's global site-packages
sys.path = [p for p in sys.path if not any(x in p for x in ["AppData\\Roaming\\Python", "AppData\\Local\\Python", ".local"])]

import os
import warnings
warnings.filterwarnings('ignore')

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# ── Suppress TF/oneDNN noise ─────────────────────────────────────────
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"

print("=" * 68)
print("  TRUST-FL: END-TO-END PIPELINE VALIDATION")
print("=" * 68)

# ── DB init (must happen before any ORM models load) ─────────────────
print("\n[INIT] Initializing SQLite database tables...")
from backend.app.core.database import init_db
init_db()
print("  [OK] Database initialized")

# ── STEP 0: Import check ─────────────────────────────────────────────
print("\n" + "=" * 68)
print("[STEP 0] Verifying critical imports")
print("=" * 68)

import sklearn, imblearn, xgboost
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import (accuracy_score, precision_score,
                             recall_score, f1_score, roc_auc_score)
from collections import OrderedDict

print(f"  scikit-learn    : {sklearn.__version__}")
print(f"  imbalanced-learn: {imblearn.__version__}")
print(f"  xgboost         : {xgboost.__version__}")
print(f"  torch           : {torch.__version__}")
print(f"  pandas          : {pd.__version__}")
print(f"  numpy           : {np.__version__}")
from imblearn.over_sampling import SMOTE
print("  SMOTE import    : [OK]")

# ── Inline PyTorch MLP (avoids importing flwr-contaminated bank_client) ──

class FraudMLP(nn.Module):
    """3-layer MLP: Input -> 64 -> 32 -> 1 (sigmoid)."""
    def __init__(self, input_dim):
        super().__init__()
        self.network = nn.Sequential(
            nn.Linear(input_dim, 64), nn.ReLU(),
            nn.BatchNorm1d(64), nn.Dropout(0.3),
            nn.Linear(64, 32), nn.ReLU(),
            nn.BatchNorm1d(32), nn.Dropout(0.2),
            nn.Linear(32, 1), nn.Sigmoid()
        )
    def forward(self, x):
        return self.network(x)


def train_local(model, loader, epochs=1, lr=0.001, device="cpu"):
    model.train()
    opt = torch.optim.Adam(model.parameters(), lr=lr, weight_decay=1e-4)
    crit = nn.BCELoss()
    for _ in range(epochs):
        for Xb, yb in loader:
            Xb, yb = Xb.to(device), yb.to(device)
            opt.zero_grad()
            crit(model(Xb), yb).backward()
            opt.step()


def evaluate(model, loader, device="cpu"):
    model.eval()
    crit = nn.BCELoss()
    total_loss, preds, probs, targets = 0.0, [], [], []
    with torch.no_grad():
        for Xb, yb in loader:
            Xb, yb = Xb.to(device), yb.to(device)
            out = model(Xb)
            total_loss += crit(out, yb).item() * Xb.size(0)
            p = out.cpu().numpy()
            probs.extend(p.flatten())
            preds.extend((p >= 0.5).astype(int).flatten())
            targets.extend(yb.cpu().numpy().flatten())
    n = len(loader.dataset)
    preds, probs, targets = np.array(preds), np.array(probs), np.array(targets)
    acc  = accuracy_score(targets, preds)
    prec = precision_score(targets, preds, zero_division=0)
    rec  = recall_score(targets, preds, zero_division=0)
    f1   = f1_score(targets, preds, zero_division=0)
    try:
        auc = roc_auc_score(targets, probs)
    except ValueError:
        auc = 0.5
    return total_loss / n, acc, prec, rec, f1, auc


def make_loader(X, y, batch_size=64, shuffle=False):
    ds = TensorDataset(torch.tensor(X.astype(np.float32)),
                       torch.tensor(y.astype(np.float32).reshape(-1, 1)))
    return DataLoader(ds, batch_size=batch_size, shuffle=shuffle)

# ── STEP 1: Data generation & preprocessing ──────────────────────────
print("\n" + "=" * 68)
print("[STEP 1] Dataset Generation & Preprocessing")
print("=" * 68)

from backend.app.services.data_loader import DataLoaderService
loader_svc = DataLoaderService()

print("\n  Generating 10,000 synthetic IEEE-CIS transactions...")
df_raw = loader_svc.generate_synthetic_data(n_samples=10000)
print(f"  Raw dataset   : {len(df_raw):,} rows x {len(df_raw.columns)} columns")
print(f"  Fraud count   : {df_raw['isFraud'].sum():,} ({df_raw['isFraud'].mean()*100:.2f}%)")

print("\n  Running preprocessing pipeline...")
df = loader_svc.load_and_preprocess()
print(f"  Preprocessed  : {len(df):,} rows x {len(df.columns)} columns")
print(f"  Remaining nulls: {df.isnull().sum().sum()}")

# ── STEP 2: Non-IID bank splitting ───────────────────────────────────
print("\n" + "=" * 68)
print("[STEP 2] Non-IID Bank Splitting")
print("=" * 68)

loader_svc.split_non_iid_banks(df, num_banks=5)

from backend.app.core.config import DATA_DIR
print()
total_tx, total_fraud = 0, 0
for i in range(1, 6):
    bdf = pd.read_csv(DATA_DIR / f"bank_{i}.csv")
    fraud = int(bdf['isFraud'].sum())
    total_tx += len(bdf); total_fraud += fraud
    print(f"  Bank {i}: {len(bdf):5,} tx  |  {fraud:4d} fraud ({fraud/len(bdf)*100:.2f}%)")
print(f"\n  TOTAL: {total_tx:,} tx  |  {total_fraud:,} fraud ({total_fraud/total_tx*100:.2f}%)")

# ── STEP 3: SMOTE balancing ──────────────────────────────────────────
print("\n" + "=" * 68)
print("[STEP 3] SMOTE Oversampling Per Bank Shard")
print("=" * 68)
print()

from backend.app.services.smote_handler import SmoteHandlerService

for i in range(1, 6):
    r = SmoteHandlerService.balance_bank_data(i)
    b, a = r['before'], r['after']
    print(f"  Bank {i}: [{b['non_fraud']:4d} legit | {b['fraud']:3d} fraud]"
          f"  ->  [{a['non_fraud']:4d} legit | {a['fraud']:4d} fraud]  balanced 50%")
print("\n  [OK] SMOTE complete for all 5 banks")

# ── STEP 4: Centralized XGBoost ──────────────────────────────────────
print("\n" + "=" * 68)
print("[STEP 4] Centralized XGBoost Baseline (GridSearchCV)")
print("=" * 68)
print()

from backend.app.services.fraud_detector import FraudDetectorService
xgb_m = FraudDetectorService.train_centralized_xgboost()

print()
print("  +--- Centralized XGBoost Results ---------------------------+")
print(f"  | Best params : {xgb_m.get('best_params',{})}")
print(f"  | Accuracy    : {xgb_m['accuracy']*100:.4f}%")
print(f"  | Precision   : {xgb_m['precision']*100:.4f}%")
print(f"  | Recall      : {xgb_m['recall']*100:.4f}%")
print(f"  | F1-Score    : {xgb_m['f1']*100:.4f}%")
print(f"  | AUC-ROC     : {xgb_m['auc_roc']:.6f}")
print("  +------------------------------------------------------------+")

# ── STEP 5: Centralized MLP ──────────────────────────────────────────
print("\n" + "=" * 68)
print("[STEP 5] Centralized MLP Baseline (PyTorch, 5 epochs)")
print("=" * 68)
print()

# Build combined balanced dataset
dfs = [pd.read_csv(DATA_DIR / f"bank_{i}_balanced.csv") for i in range(1, 6)]
combined = pd.concat(dfs, ignore_index=True)
X_all = combined.drop(columns=['TransactionID', 'isFraud']).values.astype(np.float32)
y_all = combined['isFraud'].values.astype(np.float32)

X_tr, X_te, y_tr, y_te = train_test_split(X_all, y_all, test_size=0.2,
                                           random_state=42, stratify=y_all)

train_loader = make_loader(X_tr, y_tr, batch_size=64, shuffle=True)
test_loader  = make_loader(X_te, y_te, batch_size=64, shuffle=False)

device = torch.device("cpu")
mlp_model = FraudMLP(X_all.shape[1]).to(device)

print("  Training Centralized MLP (5 epochs)...")
train_local(mlp_model, train_loader, epochs=5, lr=0.002, device=device)
_, acc, prec, rec, f1, auc = evaluate(mlp_model, test_loader, device)

torch.save(mlp_model.state_dict(), DATA_DIR / "mlp_centralized.pth")
mlp_m = dict(accuracy=acc, precision=prec, recall=rec, f1=f1, auc_roc=auc)

print()
print("  +--- Centralized MLP Results --------------------------------+")
print(f"  | Accuracy    : {acc*100:.4f}%")
print(f"  | Precision   : {prec*100:.4f}%")
print(f"  | Recall      : {rec*100:.4f}%")
print(f"  | F1-Score    : {f1*100:.4f}%")
print(f"  | AUC-ROC     : {auc:.6f}")
print("  +------------------------------------------------------------+")

# ── Federated Training: Manual In-Process Loop ───────────────────────

from backend.app.services.trust_score import TrustScoreService
from backend.app.core.database import SessionLocal
from backend.app.models.trust import TrustScoreHistory, TrainingLog
from backend.app.models.bank import Bank


def build_val_loader():
    val_X, val_y = [], []
    for i in range(1, 6):
        df_b = pd.read_csv(DATA_DIR / f"bank_{i}_balanced.csv")
        X = df_b.drop(columns=['TransactionID', 'isFraud']).values.astype(np.float32)
        y = df_b['isFraud'].values.astype(np.float32)
        _, Xv, _, yv = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
        val_X.append(Xv); val_y.append(yv)
    gX = np.concatenate(val_X); gy = np.concatenate(val_y)
    return make_loader(gX, gy, batch_size=64), gX.shape[1]


def load_bank_loaders():
    loaders, sizes = {}, {}
    for i in range(1, 6):
        df_b = pd.read_csv(DATA_DIR / f"bank_{i}_balanced.csv")
        X = df_b.drop(columns=['TransactionID', 'isFraud']).values.astype(np.float32)
        y = df_b['isFraud'].values.astype(np.float32)
        Xt, _, yt, _ = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
        loaders[i] = make_loader(Xt, yt, batch_size=32, shuffle=True)
        sizes[i] = len(Xt)
    return loaders, sizes


def run_federated(method, num_rounds):
    step_no = 6 if method == "FedAvg" else 7
    print(f"\n{'='*68}")
    print(f"[STEP {step_no}] Federated Learning: {method} ({num_rounds} rounds)")
    print(f"{'='*68}\n")

    TrustScoreService.clear_cache()
    val_loader, input_dim = build_val_loader()
    bank_loaders, bank_sizes = load_bank_loaders()

    # Initialize global model
    global_model = FraudMLP(input_dim).to(device)
    round_results = []
    trust_scores = {i: 1.0 for i in range(1, 6)}

    print(f"  {'Rnd':>3}  {'Accuracy':>9}  {'Precision':>9}  "
          f"{'Recall':>9}  {'F1':>9}  {'AUC-ROC':>9}")
    print(f"  {'-'*3}  {'-'*9}  {'-'*9}  {'-'*9}  {'-'*9}  {'-'*9}")

    db = SessionLocal()
    try:
        for rnd in range(1, num_rounds + 1):
            global_w = [v.cpu().numpy().astype(np.float32) for v in global_model.state_dict().values()]

            client_weights, client_sizes_list, client_trust, client_accs = [], [], [], []

            for bank_id in range(1, 6):
                # Initialise fresh local model from global weights
                local_model = FraudMLP(input_dim).to(device)
                sd = OrderedDict({k: torch.tensor(v.copy()).to(orig.dtype)
                                  for k, v, orig in zip(local_model.state_dict().keys(),
                                                         global_w,
                                                         local_model.state_dict().values())})
                local_model.load_state_dict(sd, strict=True)

                # Local train 1 epoch
                train_local(local_model, bank_loaders[bank_id], epochs=1, lr=0.001)

                # Local eval to get accuracy for trust
                _, local_acc, _, _, _, _ = evaluate(local_model, bank_loaders[bank_id])
                local_w = [v.cpu().numpy().astype(np.float32) for v in local_model.state_dict().values()]

                # Trust components
                cons = TrustScoreService.calculate_consistency(bank_id, local_w, global_w)
                rel  = TrustScoreService.calculate_reliability(db, bank_id, rnd, success=True)
                trust = TrustScoreService.update_bank_trust(db, bank_id, rnd,
                                                            local_acc, cons, rel)

                client_weights.append(local_w)
                client_sizes_list.append(bank_sizes[bank_id])
                client_trust.append(trust)
                client_accs.append(local_acc)
                trust_scores[bank_id] = trust

            # Aggregate
            if method == "Trust-FL":
                s = sum(client_trust) or 1.0
                w = [t / s for t in client_trust]
            else:
                total = sum(client_sizes_list)
                w = [n / total for n in client_sizes_list]

            agg_w = [np.zeros(lw.shape, dtype=np.float32) for lw in client_weights[0]]
            for cw, wi in zip(client_weights, w):
                for idx, layer in enumerate(cw):
                    agg_w[idx] += layer * wi

            # Update global model
            sd = OrderedDict({k: torch.tensor(v.copy()).to(orig.dtype)
                              for k, v, orig in zip(global_model.state_dict().keys(),
                                                     agg_w,
                                                     global_model.state_dict().values())})
            global_model.load_state_dict(sd, strict=True)

            # Global eval
            loss, acc, prec, rec, f1, auc = evaluate(global_model, val_loader)
            round_results.append(dict(round=rnd, accuracy=acc, precision=prec,
                                      recall=rec, f1=f1, auc_roc=auc))

            print(f"  {rnd:>3}  {acc*100:>8.2f}%  {prec*100:>8.2f}%  "
                  f"{rec*100:>8.2f}%  {f1*100:>8.2f}%  {auc:>9.4f}")

            db.add(TrainingLog(
                level="INFO",
                message=(f"[{method}] Round {rnd}: Acc={acc:.4f} F1={f1:.4f} AUC={auc:.4f} "
                         f"| Bank trust: {', '.join(f'B{k}={v:.3f}' for k,v in trust_scores.items())}")
            ))
            db.commit()

            torch.save(global_model.state_dict(),
                       DATA_DIR / f"global_mlp_{method.lower().replace('-','_')}.pth")

    finally:
        db.close()

    final = round_results[-1]
    print(f"\n  +--- {method} Final (Round {num_rounds}) --------------------------+")
    print(f"  | Accuracy    : {final['accuracy']*100:.4f}%")
    print(f"  | Precision   : {final['precision']*100:.4f}%")
    print(f"  | Recall      : {final['recall']*100:.4f}%")
    print(f"  | F1-Score    : {final['f1']*100:.4f}%")
    print(f"  | AUC-ROC     : {final['auc_roc']:.6f}")
    print(f"  +------------------------------------------------------------+")

    if method == "Trust-FL":
        bank_names = {1: "Apex Bank", 2: "Nova Credit",
                      3: "Sentinel Trust", 4: "Summit Financial", 5: "Vanguard Bancorp"}
        print(f"\n  Per-Bank Trust Scores (Final Round {num_rounds}):")
        for bid, score in sorted(trust_scores.items()):
            bar = "#" * int(score * 20)
            print(f"    Bank {bid} ({bank_names[bid]:<18}): {score:.4f}  [{bar:<20}]")

    return round_results


# ── STEPS 6 & 7 ─────────────────────────────────────────────────────
fedavg_res  = run_federated("FedAvg",   10)
trustfl_res = run_federated("Trust-FL", 10)

# ── FINAL COMPARISON TABLE ───────────────────────────────────────────
print("\n" + "=" * 68)
print("  FULL MODEL COMPARISON SUMMARY")
print("=" * 68)
print(f"\n  {'Model':<30} {'Accuracy':>9}  {'F1':>9}  {'AUC-ROC':>9}")
print(f"  {'-'*30} {'-'*9}  {'-'*9}  {'-'*9}")
print(f"  {'Centralized XGBoost':<30} {xgb_m['accuracy']*100:>8.2f}%  "
      f"{xgb_m['f1']*100:>8.2f}%  {xgb_m['auc_roc']:>9.4f}")
print(f"  {'Centralized MLP (5 epochs)':<30} {mlp_m['accuracy']*100:>8.2f}%  "
      f"{mlp_m['f1']*100:>8.2f}%  {mlp_m['auc_roc']:>9.4f}")
print(f"  {'FedAvg MLP (10 rounds)':<30} {fedavg_res[-1]['accuracy']*100:>8.2f}%  "
      f"{fedavg_res[-1]['f1']*100:>8.2f}%  {fedavg_res[-1]['auc_roc']:>9.4f}")
print(f"  {'Trust-FL MLP (10 rounds)':<30} {trustfl_res[-1]['accuracy']*100:>8.2f}%  "
      f"{trustfl_res[-1]['f1']*100:>8.2f}%  {trustfl_res[-1]['auc_roc']:>9.4f}")
print()
print("  [OK] Pipeline complete. All models saved to backend/data/")
print("=" * 68)
