@echo off
echo ============================================================
echo   Academic Risk Monitor: Early Warning System (EWS)
echo ============================================================
echo Starting Backend (FastAPI on http://127.0.0.1:8000)...
start cmd /k "python server.py"

timeout /t 3 /nobreak > nul

echo Starting Frontend (Vite on http://localhost:5173)...
start cmd /k "cd frontend && npm run dev"

echo.
echo Both servers started!
echo Frontend Dashboard: http://localhost:5173
echo API Documentation:  http://127.0.0.1:8000/docs
echo Health Check:       http://127.0.0.1:8000/health
echo ============================================================
pause
