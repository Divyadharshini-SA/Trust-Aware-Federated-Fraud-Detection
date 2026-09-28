import os
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.preprocessing import StandardScaler, LabelEncoder
from backend.app.core.config import DATA_DIR, UPLOAD_DIR, BANK_NAMES, DEFAULT_NUM_BANKS, DEFAULT_FRAUD_RATIO
from backend.app.core.database import SessionLocal
from backend.app.models.bank import Bank

class DataLoaderService:
    def __init__(self):
        self.raw_data_path = DATA_DIR / "ieee_cis_fraud.csv"
        self.scaler = StandardScaler()
        self.label_encoders = {}

    def generate_synthetic_data(self, n_samples=10000) -> pd.DataFrame:
        """
        Generates a synthetic dataset resembling the IEEE-CIS Fraud Detection dataset.
        Includes typical columns and non-IID triggers like card1-card6, C1-C14, D1-D15, and isFraud.
        """
        print(f"Generating {n_samples} synthetic IEEE-CIS fraud detection transactions...")
        np.random.seed(42)

        # Generate Transaction IDs and timestamps
        transaction_id = np.arange(100000, 100000 + n_samples)
        transaction_dt = np.random.randint(86400, 86400 * 30, size=n_samples)  # 30 days of timestamps
        transaction_amt = np.random.exponential(scale=135.0, size=n_samples) + 1.0  # IEEE-CIS mean ~135
        
        # ProductCD: categorical
        product_cds = ['W', 'H', 'C', 'S', 'R']
        product_cd = np.random.choice(product_cds, size=n_samples, p=[0.75, 0.05, 0.12, 0.03, 0.05])
        
        # card1: bank/card issuer ID (used to create non-IID bank splits)
        # We simulate 5 bank ranges
        card1 = np.random.randint(1000, 18000, size=n_samples)
        
        # card4: card network (visa, mastercard, american express, discover)
        card4_options = ['visa', 'mastercard', 'american express', 'discover']
        card4 = np.random.choice(card4_options, size=n_samples, p=[0.65, 0.30, 0.03, 0.02])
        
        # card6: card type (debit, credit)
        card6_options = ['debit', 'credit']
        card6 = np.random.choice(card6_options, size=n_samples, p=[0.70, 0.30])
        
        # email domains
        emails = ['gmail.com', 'yahoo.com', 'outlook.com', 'anonymous.com', 'aol.com', None]
        p_email = np.random.choice(emails, size=n_samples, p=[0.55, 0.20, 0.10, 0.05, 0.02, 0.08])
        
        # C columns (counts of cards, emails, ip addresses, etc. in a timeframe)
        # Often skewed and highly correlated
        c1 = np.random.poisson(lam=1.5, size=n_samples) + 1
        c2 = np.random.poisson(lam=1.2, size=n_samples) + 1
        c13 = np.random.poisson(lam=15.0, size=n_samples) + 1
        
        # D columns (timedelta from previous transactions)
        d1 = np.random.exponential(scale=50.0, size=n_samples)
        d2 = np.random.exponential(scale=30.0, size=n_samples)
        
        # V columns (V1 to V30: visual match / transaction details)
        v_cols = {f"V{i}": np.random.normal(loc=0.0, scale=1.0, size=n_samples) for i in range(1, 31)}
        
        # Target: isFraud
        # Base probability of fraud
        fraud_prob = np.zeros(n_samples) + DEFAULT_FRAUD_RATIO
        
        # Make it dependent on card1 and TransactionAmt to simulate logical fraud pattern (non-IID)
        # Bank 1: card1 in [1000, 4000] -> Fraud ratio ~1.5% (Low fraud)
        # Bank 2: card1 in [4000, 7000] -> Fraud ratio ~5.5% (High fraud)
        # Bank 3: card1 in [7000, 10000] -> Fraud ratio ~2.2% (Medium-low fraud)
        # Bank 4: card1 in [10000, 13000] -> Fraud ratio ~6.5% (Very high fraud)
        # Bank 5: card1 in [13000, 18000] -> Fraud ratio ~3.0% (Medium fraud)
        
        mask_b1 = (card1 >= 1000) & (card1 < 4000)
        mask_b2 = (card1 >= 4000) & (card1 < 7000)
        mask_b3 = (card1 >= 7000) & (card1 < 10000)
        mask_b4 = (card1 >= 10000) & (card1 < 13000)
        mask_b5 = (card1 >= 13000)
        
        fraud_prob[mask_b1] = 0.015
        fraud_prob[mask_b2] = 0.055
        fraud_prob[mask_b3] = 0.022
        fraud_prob[mask_b4] = 0.065
        fraud_prob[mask_b5] = 0.030
        
        # Increase fraud probability for large transactions and high card counts
        fraud_prob += np.where(transaction_amt > 500.0, 0.15, 0.0)
        fraud_prob += np.where(c13 > 40, 0.05, 0.0)
        
        # Clip probabilities to [0.0, 0.9]
        fraud_prob = np.clip(fraud_prob, 0.0, 0.9)
        
        # Draw target labels
        is_fraud = np.random.binomial(1, fraud_prob)
        
        # Add random nulls to represent IEEE-CIS missingness
        # e.g., d2 and p_email have missing values
        d2_missing_mask = np.random.choice([True, False], size=n_samples, p=[0.3, 0.7])
        d2[d2_missing_mask] = np.nan
        
        df_dict = {
            'TransactionID': transaction_id,
            'TransactionDT': transaction_dt,
            'TransactionAmt': transaction_amt,
            'ProductCD': product_cd,
            'card1': card1,
            'card4': card4,
            'card6': card6,
            'P_emaildomain': p_email,
            'C1': c1,
            'C2': c2,
            'C13': c13,
            'D1': d1,
            'D2': d2,
            'isFraud': is_fraud
        }
        
        # Add V columns
        df_dict.update(v_cols)
        
        df = pd.DataFrame(df_dict)
        df.to_csv(self.raw_data_path, index=False)
        print(f"Synthetic dataset saved to {self.raw_data_path}")
        return df

    def load_and_preprocess(self, file_path=None) -> pd.DataFrame:
        """
        Loads the dataset (from file_path or default path), handles missing values,
        encodes categorical features, scales numerical features, and returns the preprocessed DataFrame.
        """
        if file_path is None:
            file_path = self.raw_data_path

        if not os.path.exists(file_path):
            if file_path == self.raw_data_path:
                self.generate_synthetic_data()
            else:
                raise FileNotFoundError(f"Requested dataset file {file_path} not found.")

        df = pd.read_csv(file_path)

        # 1. Handle missing values
        # Fill numeric missing values with median
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        if 'TransactionID' in numeric_cols:
            numeric_cols.remove('TransactionID')
        if 'isFraud' in numeric_cols:
            numeric_cols.remove('isFraud')

        for col in numeric_cols:
            if df[col].isnull().any():
                df[col] = df[col].fillna(df[col].median())

        # Fill categorical missing values with mode or 'Unknown'
        categorical_cols = df.select_dtypes(include=['object']).columns.tolist()
        for col in categorical_cols:
            df[col] = df[col].fillna('Unknown')

        # 2. Encode categorical variables
        self.label_encoders = {}
        for col in categorical_cols:
            le = LabelEncoder()
            df[col] = le.fit_transform(df[col].astype(str))
            self.label_encoders[col] = le

        # 3. Normalize numerical features using StandardScaler
        # Exclude metadata like TransactionID and targets
        features_to_scale = [c for c in numeric_cols if c not in ['card1']] # We keep card1 as is for splitting, scale later
        if features_to_scale:
            df[features_to_scale] = self.scaler.fit_transform(df[features_to_scale])

        # scale card1 under a different name if needed, but let's keep it as an integer bank router for splits
        import joblib
        joblib.dump(self.scaler, DATA_DIR / "scaler.joblib")
        joblib.dump(self.label_encoders, DATA_DIR / "encoders.joblib")
        return df

    def split_non_iid_banks(self, df: pd.DataFrame, num_banks=DEFAULT_NUM_BANKS):
        """
        Splits preprocessed data into bank-specific datasets using 'card1' features
        to simulate non-IID bank distributions. Updates details in database.
        """
        print(f"Splitting dataset into {num_banks} non-IID bank clients...")
        
        # Sort values by card1 to group similar card ranges into the same banks (non-IID)
        df_sorted = df.sort_values(by='card1').copy()
        
        # Let's scale card1 now so it's a normalized feature for training
        # We store the original values in a temporary column if needed, or we just split first, then scale card1
        card1_raw = df_sorted['card1'].values
        card1_mean = float(card1_raw.mean())
        card1_std = float(card1_raw.std()) if len(card1_raw) > 1 else 1.0
        import joblib
        joblib.dump({"mean": card1_mean, "std": card1_std}, DATA_DIR / "card1_meta.joblib")
        df_sorted['card1'] = (df_sorted['card1'] - card1_mean) / card1_std
        
        # Split sorted dataset into equal chunks (or slightly unequal to represent real banks)
        # Bank sizes could be slightly different
        total_samples = len(df_sorted)
        split_sizes = [int(total_samples / num_banks)] * num_banks
        # Distribute remainder
        for i in range(total_samples % num_banks):
            split_sizes[i] += 1
            
        indices = np.cumsum([0] + split_sizes)
        
        db = SessionLocal()
        try:
            # Clear previous bank listings
            db.query(Bank).delete()
            db.commit()

            for i in range(num_banks):
                bank_id = i + 1
                bank_df = df_sorted.iloc[indices[i]:indices[i+1]].copy()
                
                # Save client bank file
                bank_file = DATA_DIR / f"bank_{bank_id}.csv"
                bank_df.to_csv(bank_file, index=False)
                
                # Bank details
                bank_name = BANK_NAMES.get(bank_id, f"Bank {bank_id}")
                tx_count = len(bank_df)
                fraud_count = int(bank_df['isFraud'].sum())
                
                bank_db = Bank(
                    id=bank_id,
                    name=bank_name,
                    status="online",
                    transaction_count=tx_count,
                    fraud_count=fraud_count,
                    local_accuracy=0.0,
                    current_trust_score=1.0
                )
                db.add(bank_db)
                print(f"Bank {bank_id} ({bank_name}) dataset created: {tx_count} samples, {fraud_count} fraud ({fraud_count/tx_count*100:.2f}%)")

            db.commit()
        except Exception as e:
            db.rollback()
            print(f"Error during bank data splitting: {e}")
            raise e
        finally:
            db.close()
            
        print("Data splitting and Bank initialization completed successfully.")
