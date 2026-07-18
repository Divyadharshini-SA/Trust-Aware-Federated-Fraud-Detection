import numpy as np
from sqlalchemy.orm import Session
from backend.app.models.trust import TrustScoreHistory
from backend.app.models.bank import Bank

class TrustScoreService:
    # Memory store for previous updates of each bank client to compute consistency
    # Key: bank_id, Value: flat numpy array representing parameter updates
    _previous_updates = {}

    @classmethod
    def clear_cache(cls):
        """Resets the previous updates memory store when starting a new training session."""
        cls._previous_updates.clear()

    @classmethod
    def calculate_consistency(cls, bank_id: int, current_parameters: list, global_parameters: list) -> float:
        """
        Computes Consistency as the cosine similarity between the current round's
        weight update vector and the previous round's weight update vector.
        u_t = W_client_t - W_global_t-1
        """
        if not current_parameters or not global_parameters:
            return 1.0

        # Flatten and concatenate all parameter arrays
        curr_flat = np.concatenate([p.flatten() for p in current_parameters])
        glob_flat = np.concatenate([p.flatten() for p in global_parameters])

        # Current update vector
        current_update = curr_flat - glob_flat
        current_norm = np.linalg.norm(current_update)

        if current_norm == 0:
            return 1.0

        prev_update = cls._previous_updates.get(bank_id)

        if prev_update is None:
            # Store current update and return 1.0 for the first round
            cls._previous_updates[bank_id] = current_update
            return 1.0

        prev_norm = np.linalg.norm(prev_update)
        if prev_norm == 0:
            cls._previous_updates[bank_id] = current_update
            return 1.0

        # Compute cosine similarity
        cosine_sim = np.dot(current_update, prev_update) / (current_norm * prev_norm)
        
        # Save current update for the next round
        cls._previous_updates[bank_id] = current_update

        # Clip to [0, 1] range to avoid negative contributions
        return float(max(0.0, cosine_sim))

    @classmethod
    def calculate_reliability(cls, db: Session, bank_id: int, current_round: int, success: bool) -> float:
        """
        Computes Reliability as:
        R_t = 0.9 * R_t-1 + 0.1 * Success
        """
        if current_round <= 1:
            # First round defaults to 1.0
            return 1.0

        # Fetch the previous round's reliability from database
        prev_record = db.query(TrustScoreHistory)\
            .filter(TrustScoreHistory.bank_id == bank_id, TrustScoreHistory.round == current_round - 1)\
            .first()

        prev_reliability = prev_record.reliability if prev_record else 1.0
        success_val = 1.0 if success else 0.0

        reliability = 0.9 * prev_reliability + 0.1 * success_val
        return float(np.clip(reliability, 0.0, 1.0))

    @classmethod
    def update_bank_trust(cls, db: Session, bank_id: int, current_round: int, 
                           accuracy: float, consistency: float, reliability: float) -> float:
        """
        Computes the final trust score:
        Trust = 0.4 * Accuracy + 0.3 * Consistency + 0.3 * Reliability
        Saves record in history and updates the Bank model's current trust score.
        """
        trust_score = 0.4 * accuracy + 0.3 * consistency + 0.3 * reliability
        trust_score = float(np.clip(trust_score, 0.0, 1.0))

        # Add history record
        history = TrustScoreHistory(
            bank_id=bank_id,
            round=current_round,
            accuracy=accuracy,
            consistency=consistency,
            reliability=reliability,
            trust_score=trust_score
        )
        db.add(history)

        # Update Bank current state
        bank = db.query(Bank).filter(Bank.id == bank_id).first()
        if bank:
            bank.current_trust_score = trust_score
            bank.local_accuracy = accuracy
            # Set to online if they are successfully contributing
            bank.status = "online"

        db.commit()
        return trust_score
