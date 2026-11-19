@echo off
cd /d "%~dp0"
title Academic Risk Monitor - Launcher

echo ============================================================
echo   Academic Risk Monitor: Early Warning System (EWS)
echo ============================================================
echo.
echo [1/3] Clearing any lingering processes on ports 8000 and 5173...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1

echo [2/3] Starting Backend (FastAPI on http://127.0.0.1:8000)...
start "EWS Backend (FastAPI)" cmd /k "python server.py"

timeout /t 3 /nobreak > nul

echo [3/3] Starting Frontend (Vite on http://localhost:5173)...
start "EWS Frontend (Vite)" cmd /k "cd frontend && npm run dev"

timeout /t 2 /nobreak > nul

echo.
echo ============================================================
echo   All systems active!
echo   - Frontend: http://localhost:5173
echo   - API Docs: http://127.0.0.1:8000/docs
echo   - Health:   http://127.0.0.1:8000/health
echo ============================================================
echo.
echo Opening browser to dashboard...
start http://localhost:5173
pause
