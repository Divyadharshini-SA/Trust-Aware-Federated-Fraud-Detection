import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset
import pandas as pd
import numpy as np
import flwr as fl
from collections import OrderedDict
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
from backend.app.core.config import DATA_DIR

# 1. PyTorch Multi-Layer Perceptron (MLP) for Fraud Detection
class FraudMLP(nn.Module):
    def __init__(self, input_dim):
        super(FraudMLP, self).__init__()
        self.network = nn.Sequential(
            nn.Linear(input_dim, 64),
            nn.ReLU(),
            nn.BatchNorm1d(64),
            nn.Dropout(0.3),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.BatchNorm1d(32),
            nn.Dropout(0.2),
            nn.Linear(32, 1),
            nn.Sigmoid()
        )

    def forward(self, x):
        return self.network(x)


# 2. Local Training Loop Helper
def train_local_model(model, train_loader, epochs, lr, device="cpu"):
    model.train()
    optimizer = torch.optim.Adam(model.parameters(), lr=lr, weight_decay=1e-4)
    criterion = nn.BCELoss()

    for epoch in range(epochs):
        for X_batch, y_batch in train_loader:
            X_batch, y_batch = X_batch.to(device), y_batch.to(device)
            optimizer.zero_grad()
            outputs = model(X_batch)
            loss = criterion(outputs, y_batch)
            loss.backward()
            optimizer.step()


# 3. Local Evaluation Helper
def evaluate_local_model(model, loader, device="cpu"):
    model.eval()
    criterion = nn.BCELoss()
    
    total_loss = 0.0
    all_preds = []
    all_probs = []
    all_targets = []

    with torch.no_grad():
        for X_batch, y_batch in loader:
            X_batch, y_batch = X_batch.to(device), y_batch.to(device)
            outputs = model(X_batch)
            loss = criterion(outputs, y_batch)
            total_loss += loss.item() * X_batch.size(0)
            
            probs = outputs.cpu().numpy()
            preds = (probs >= 0.5).astype(int)
            
            all_preds.extend(preds.flatten())
            all_probs.extend(probs.flatten())
            all_targets.extend(y_batch.cpu().numpy().flatten())

    n_samples = len(loader.dataset)
    avg_loss = total_loss / n_samples if n_samples > 0 else 0.0
    
    # Compute metrics safely
    all_preds = np.array(all_preds)
    all_probs = np.array(all_probs)
    all_targets = np.array(all_targets)

    if len(all_targets) == 0:
        return 0.0, 0.0, 0.0, 0.0, 0.0, 0.0

    acc = accuracy_score(all_targets, all_preds)
    prec = precision_score(all_targets, all_preds, zero_division=0)
    rec = recall_score(all_targets, all_preds, zero_division=0)
    f1 = f1_score(all_targets, all_preds, zero_division=0)
    
    try:
        auc = roc_auc_score(all_targets, all_probs)
    except ValueError:
        auc = 0.5  # Fallback if only one class is present in validation batch

    return avg_loss, acc, prec, rec, f1, auc


# 4. Flower Client Wrapper
class FlowerBankClient(fl.client.NumPyClient):
    def __init__(self, bank_id: int, epochs: int = 1, batch_size: int = 32, lr: float = 0.001):
        self.bank_id = bank_id
        self.epochs = epochs
        self.batch_size = batch_size
        self.lr = lr
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

        # Load bank data
        balanced_file = DATA_DIR / f"bank_{bank_id}_balanced.csv"
        if not balanced_file.exists():
            raise FileNotFoundError(f"Balanced data for bank {bank_id} not found at {balanced_file}")

        df = pd.read_csv(balanced_file)
        X = df.drop(columns=['TransactionID', 'isFraud']).values.astype(np.float32)
        y = df['isFraud'].values.astype(np.float32).reshape(-1, 1)

        # 80/20 train/validation split
        X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

        # PyTorch Data Loaders
        train_dataset = TensorDataset(torch.tensor(X_train), torch.tensor(y_train))
        val_dataset = TensorDataset(torch.tensor(X_val), torch.tensor(y_val))

        self.train_loader = DataLoader(train_dataset, batch_size=self.batch_size, shuffle=True)
        self.val_loader = DataLoader(val_dataset, batch_size=self.batch_size, shuffle=False)

        # Initialise Model
        self.input_dim = X.shape[1]
        self.model = FraudMLP(self.input_dim).to(self.device)

    def get_parameters(self, config) -> list:
        return [val.cpu().numpy() for _, val in self.model.state_dict().items()]

    def set_parameters(self, parameters: list):
        params_dict = zip(self.model.state_dict().keys(), parameters)
        state_dict = OrderedDict({k: torch.tensor(v) for k, v in params_dict})
        self.model.load_state_dict(state_dict, strict=True)

    def fit(self, parameters: list, config: dict) -> tuple:
        self.set_parameters(parameters)
        
        # Train locally
        train_local_model(self.model, self.train_loader, self.epochs, self.lr, self.device)
        
        # Evaluate local validation performance
        loss, acc, prec, rec, f1, auc = evaluate_local_model(self.model, self.val_loader, self.device)

        # Return parameters, dataset length, and metrics to Strategy
        metrics = {
            "accuracy": float(acc),
            "loss": float(loss),
            "precision": float(prec),
            "recall": float(rec),
            "f1": float(f1),
            "auc_roc": float(auc),
            "bank_id": int(self.bank_id)
        }
        return self.get_parameters(config={}), len(self.train_loader.dataset), metrics

    def evaluate(self, parameters: list, config: dict) -> tuple:
        self.set_parameters(parameters)
        loss, acc, prec, rec, f1, auc = evaluate_local_model(self.model, self.val_loader, self.device)
        return float(loss), len(self.val_loader.dataset), {
            "accuracy": float(acc),
            "precision": float(prec),
            "recall": float(rec),
            "f1": float(f1),
            "auc_roc": float(auc),
            "bank_id": int(self.bank_id)
        }
