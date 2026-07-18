from sqlalchemy import Column, Integer, String, Float, Boolean
from backend.app.core.database import Base

class Bank(Base):
    __tablename__ = "banks"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    status = Column(String, default="offline")  # online, offline
    transaction_count = Column(Integer, default=0)
    fraud_count = Column(Integer, default=0)
    local_accuracy = Column(Float, default=0.0)
    current_trust_score = Column(Float, default=1.0)
