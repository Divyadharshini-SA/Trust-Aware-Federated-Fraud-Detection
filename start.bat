@echo off
TITLE Trust-FL Launcher

set PYTHONNOUSERSITE=1

echo.
echo =====================================
echo   Trust-FL: Federated Fraud Detection
echo =====================================
echo.

:: Automatically kill any zombie processes on port 8000 to prevent port conflicts
echo Cleaning up port 8000...
powershell -Command "Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"

echo Starting FastAPI Backend and opening Dashboard...
.venv\Scripts\python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload

echo.
echo Server stopped.
pause
