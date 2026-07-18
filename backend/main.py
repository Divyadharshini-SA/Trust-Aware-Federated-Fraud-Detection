import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.app.core.config import DATA_DIR
from backend.app.core.database import init_db
from backend.app.api.routes import router

app = FastAPI(
    title="Trust-Aware Federated Learning Fraud Detection API",
    description="Backend service for Privacy-Preserving Credit Card Fraud Detection using Flower and FastAPI",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount data folder as static directory for image serving (SMOTE distribution plots)
app.mount("/static", StaticFiles(directory=str(DATA_DIR)), name="static")

# Include api routes
app.include_router(router)

@app.on_event("startup")
def startup_event():
    # Initialize Database Tables
    print("Initializing SQLite Database...")
    init_db()
    print("Database tables initialized successfully.")

@app.get("/")
def read_root():
    return {
        "project": "Trust-Aware Federated Learning for Credit Card Fraud Detection",
        "phase": "Phase 1 (7th Semester)",
        "status": "online"
    }

if __name__ == "__main__":
    # Start server
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
