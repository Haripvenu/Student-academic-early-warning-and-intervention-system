@echo off
echo ============================================================
echo   EduGuard: Student Early Warning System (B.Tech ML Project)
echo ============================================================
echo Starting Backend (FastAPI on http://127.0.0.1:8000)...
start cmd /k "python server.py"

timeout /t 3 /nobreak > nul

echo Starting Frontend (Vite on http://localhost:5173)...
start cmd /k "cd frontend && npm run dev"

echo.
echo Both servers started!
echo Open your browser at: http://localhost:5173
echo API documentation at: http://127.0.0.1:8000/docs
echo ============================================================
pause
