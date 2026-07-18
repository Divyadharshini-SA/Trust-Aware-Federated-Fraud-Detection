from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from backend.app.core.database import Base

class TrustScoreHistory(Base):
    __tablename__ = "trust_score_history"

    id = Column(Integer, primary_key=True, index=True)
    bank_id = Column(Integer, ForeignKey("banks.id"), nullable=False)
    round = Column(Integer, nullable=False)
    accuracy = Column(Float, nullable=False)
    consistency = Column(Float, nullable=False)
    reliability = Column(Float, nullable=False)
    trust_score = Column(Float, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

class RoundMetric(Base):
    __tablename__ = "round_metrics"

    id = Column(Integer, primary_key=True, index=True)
    round = Column(Integer, nullable=False)
    method = Column(String, nullable=False)  # 'FedAvg' or 'Trust-FL'
    accuracy = Column(Float, nullable=False)
    precision = Column(Float, nullable=False)
    recall = Column(Float, nullable=False)
    f1 = Column(Float, nullable=False)
    auc_roc = Column(Float, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

class TrainingLog(Base):
    __tablename__ = "training_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    level = Column(String, default="INFO")  # INFO, WARNING, ERROR
    message = Column(String, nullable=False)
