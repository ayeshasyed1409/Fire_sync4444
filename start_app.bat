@echo off
echo ========================================================
echo Starting India Fire Intelligence System
echo ========================================================
echo.

echo 1. Starting Backend API server on http://127.0.0.1:8000 ...
start "Fire Backend Server" cmd /k "python backend\server.py"

echo 2. Starting Frontend Web Application on http://localhost:3000 ...
cd frontend
start "Fire Frontend Vite" cmd /k "npm run dev"

echo.
echo Application started! Open http://localhost:3000 in your browser.

