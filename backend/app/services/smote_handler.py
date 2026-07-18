import os
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend for server environments
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
import numpy as np
from imblearn.over_sampling import SMOTE
from backend.app.core.config import DATA_DIR

class SmoteHandlerService:
    @staticmethod
    def balance_bank_data(bank_id: int):
        """
        Loads the specified bank's dataset, applies SMOTE to balance fraud vs non-fraud cases,
        saves the balanced CSV, saves class distribution plots, and returns class distribution metrics.
        """
        bank_file = DATA_DIR / f"bank_{bank_id}.csv"
        if not os.path.exists(bank_file):
            raise FileNotFoundError(f"Dataset for Bank {bank_id} does not exist. Please split the data first.")

        df = pd.read_csv(bank_file)
        
        # Features and target
        X = df.drop(columns=['TransactionID', 'isFraud'])
        y = df['isFraud']

        # Get before counts
        before_counts = y.value_counts().to_dict()
        before_0 = int(before_counts.get(0, 0))
        before_1 = int(before_counts.get(1, 0))

        # Check if there is at least one fraud sample to perform SMOTE
        if before_1 < 2:
            raise ValueError(f"Bank {bank_id} has less than 2 fraud samples ({before_1}). Cannot apply SMOTE. Check data partitioning.")

        # Apply SMOTE
        # k_neighbors=min(5, fraud_count-1) to handle small class sizes safely
        k_neighbors = min(5, before_1 - 1)
        k_neighbors = max(1, k_neighbors)
        
        smote = SMOTE(random_state=42, k_neighbors=k_neighbors)
        X_res, y_res = smote.fit_resample(X, y)

        # Get after counts
        after_counts = pd.Series(y_res).value_counts().to_dict()
        after_0 = int(after_counts.get(0, 0))
        after_1 = int(after_counts.get(1, 0))

        # Combine resampled data
        resampled_df = pd.DataFrame(X_res, columns=X.columns)
        resampled_df['isFraud'] = y_res
        resampled_df['TransactionID'] = np.arange(len(resampled_df)) # Assign new pseudo-Transaction IDs

        # Save balanced dataset
        balanced_file = DATA_DIR / f"bank_{bank_id}_balanced.csv"
        resampled_df.to_csv(balanced_file, index=False)

        # Generate and save comparison plot
        plot_path = DATA_DIR / f"bank_{bank_id}_smote.png"
        SmoteHandlerService._generate_and_save_plot(
            before_0, before_1, after_0, after_1, bank_id, plot_path
        )

        return {
            "bank_id": bank_id,
            "before": {"non_fraud": before_0, "fraud": before_1},
            "after": {"non_fraud": after_0, "fraud": after_1},
            "plot_url": f"/static/bank_{bank_id}_smote.png"
        }

    @staticmethod
    def _generate_and_save_plot(before_0, before_1, after_0, after_1, bank_id, save_path):
        """
        Creates a bar chart visualizing before/after class distributions.
        """
        categories = ['Non-Fraud (0)', 'Fraud (1)']
        before = [before_0, before_1]
        after = [after_0, after_1]

        x = np.arange(len(categories))
        width = 0.35

        fig, ax = plt.subplots(figsize=(6, 4))
        rects1 = ax.bar(x - width/2, before, width, label='Before SMOTE', color='#f43f5e') # red/pink
        rects2 = ax.bar(x + width/2, after, width, label='After SMOTE', color='#10b981')  # emerald

        ax.set_ylabel('Number of Transactions')
        ax.set_title(f'Bank {bank_id} SMOTE Class Distribution')
        ax.set_xticks(x)
        ax.set_xticklabels(categories)
        ax.legend()

        # Add value labels
        ax.bar_label(rects1, padding=3)
        ax.bar_label(rects2, padding=3)

        fig.tight_layout()
        plt.savefig(save_path, dpi=150)
        plt.close()
