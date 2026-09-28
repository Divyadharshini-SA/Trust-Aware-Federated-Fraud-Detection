import os
from pathlib import Path

# Load environment variables
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
UPLOAD_DIR = DATA_DIR / "uploads"

# Server Host / Port configuration
BACKEND_HOST = os.getenv("BACKEND_HOST", "0.0.0.0")
BACKEND_PORT = int(os.getenv("BACKEND_PORT", "8000"))
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*")

# Ensure directories exist
DATA_DIR.mkdir(exist_ok=True, parents=True)
UPLOAD_DIR.mkdir(exist_ok=True, parents=True)

# Database
DATABASE_URL = f"sqlite:///{DATA_DIR / 'fraud_detection.db'}"

# Federated Learning Settings
DEFAULT_NUM_BANKS = 5
DEFAULT_ROUNDS = 50
DEFAULT_FRAUD_RATIO = 0.035  # Realistic fraud ratio matching IEEE-CIS

# Client names mapping
BANK_NAMES = {
    1: "Apex Bank",
    2: "Nova Credit Union",
    3: "Sentinel Trust",
    4: "Summit Financial",
    5: "Vanguard Bancorp"
}
