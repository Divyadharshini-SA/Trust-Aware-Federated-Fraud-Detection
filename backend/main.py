import sys
# Prevent Python from loading conflicting packages from the user's global site-packages
sys.path = [p for p in sys.path if not any(x in p for x in ["AppData\\Roaming\\Python", "AppData\\Local\\Python", ".local"])]

import os
os.environ["PYTHONNOUSERSITE"] = "1"

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.app.core.config import DATA_DIR, BACKEND_HOST, BACKEND_PORT, ALLOWED_ORIGINS
from backend.app.core.database import init_db
from backend.app.api.routes import router

app = FastAPI(
    title="Trust-Aware Federated Learning Fraud Detection API",
    description="Backend service for Privacy-Preserving Credit Card Fraud Detection using Flower and FastAPI",
    version="1.0.0"
)

# CORS configuration — must be first middleware
origins = [origin.strip() for origin in ALLOWED_ORIGINS.split(",")] if ALLOWED_ORIGINS != "*" else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes BEFORE static mount so /ws/training and other routes take priority
app.include_router(router)

# Mount static files BEFORE frontend root catch-all route
DATA_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=str(DATA_DIR)), name="static")
print(f"Static files mounted from: {DATA_DIR}")

@app.on_event("startup")
def startup_event():
    # Initialize Database Tables
    print("Initializing SQLite Database...")
    init_db()
    print("Database tables initialized successfully.")

    # Auto-open dashboard in the browser
    try:
        import webbrowser
        port = BACKEND_PORT or 8000
        webbrowser.open(f"http://localhost:{port}/")
        print(f"Dashboard opened in default browser at http://localhost:{port}/")
    except Exception as e:
        print(f"Failed to open browser automatically: {e}")

# Mount frontend static files
frontend_dist = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "dist")
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")
    print(f"Frontend dist mounted from: {frontend_dist}")
else:
    print(f"Frontend dist not found at: {frontend_dist}. Falling back to default root response.")
    @app.get("/")
    def read_root():
        return {
            "project": "Trust-Aware Federated Learning for Credit Card Fraud Detection",
            "phase": "Phase 1 (7th Semester)",
            "status": "online"
        }

if __name__ == "__main__":
    # Start server using host and port from config
    uvicorn.run("backend.main:app", host=BACKEND_HOST, port=BACKEND_PORT, reload=True)
