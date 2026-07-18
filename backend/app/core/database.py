from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.app.core.config import DATABASE_URL

# Create database engine
# connect_args={"check_same_thread": False} is required for SQLite in multithreaded environments
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

# Create session maker
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Declarative base
Base = declarative_base()

# Dependency to get db session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    # Import models here to ensure they are registered on Base
    from backend.app.models.bank import Bank
    from backend.app.models.trust import TrustScoreHistory, RoundMetric, TrainingLog
    Base.metadata.create_all(bind=engine)
