import os
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import GridSearchCV, train_test_split
from xgboost import XGBClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix, classification_report
from backend.app.core.config import DATA_DIR, DEFAULT_NUM_BANKS

class FraudDetectorService:
    @staticmethod
    def get_combined_balanced_data():
        """
        Combines balanced datasets of all banks into a single centralized dataset.
        """
        dfs = []
        for i in range(1, DEFAULT_NUM_BANKS + 1):
            balanced_file = DATA_DIR / f"bank_{i}_balanced.csv"
            if not os.path.exists(balanced_file):
                # If balanced file is not found, balance it first
                from backend.app.services.smote_handler import SmoteHandlerService
                print(f"Balanced data not found for Bank {i}. Applying SMOTE first...")
                SmoteHandlerService.balance_bank_data(i)
            dfs.append(pd.read_csv(balanced_file))
        
        combined_df = pd.concat(dfs, ignore_index=True)
        return combined_df

    @staticmethod
    def train_centralized_xgboost():
        """
        Loads the combined balanced dataset, trains an XGBoost classifier with GridSearchCV,
        evaluates performance, saves the model, and returns performance metrics.
        """
        combined_df = FraudDetectorService.get_combined_balanced_data()
        
        X = combined_df.drop(columns=['TransactionID', 'isFraud'])
        y = combined_df['isFraud']

        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

        print("Training Centralized XGBoost with GridSearchCV hyperparameter tuning...")
        # Define a light grid search to ensure it runs quickly but achieves optimal parameters
        param_grid = {
            'max_depth': [3, 5],
            'learning_rate': [0.1, 0.2],
            'n_estimators': [50, 100]
        }

        xgb = XGBClassifier(eval_metric='logloss', random_state=42)
        grid_search = GridSearchCV(xgb, param_grid, cv=3, scoring='f1', n_jobs=-1)
        grid_search.fit(X_train, y_train)

        best_model = grid_search.best_estimator_
        print(f"GridSearchCV complete. Best parameters: {grid_search.best_params_}")

        # Predict
        y_pred = best_model.predict(X_test)
        y_prob = best_model.predict_proba(X_test)[:, 1]

        # Calculate metrics
        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred, zero_division=0)
        rec = recall_score(y_test, y_pred, zero_division=0)
        f1 = f1_score(y_test, y_pred, zero_division=0)
        auc = roc_auc_score(y_test, y_prob)
        cm = confusion_matrix(y_test, y_pred).tolist()

        print("\n--- Centralized XGBoost Evaluation ---")
        print(classification_report(y_test, y_pred))
        print(f"Accuracy: {acc:.4f}, Precision: {prec:.4f}, Recall: {rec:.4f}, F1: {f1:.4f}, AUC-ROC: {auc:.4f}")

        # Save model
        model_path = DATA_DIR / "xgboost_centralized.joblib"
        joblib.dump(best_model, model_path)
        print(f"Centralized XGBoost model saved to {model_path}")

        metrics = {
            "method": "Centralized XGBoost",
            "accuracy": float(acc),
            "precision": float(prec),
            "recall": float(rec),
            "f1": float(f1),
            "auc_roc": float(auc),
            "confusion_matrix": cm,
            "best_params": grid_search.best_params_
        }
        
        # Save metrics as a JSON file for comparison
        metrics_path = DATA_DIR / "metrics_centralized_xgboost.joblib"
        joblib.dump(metrics, metrics_path)

        return metrics
