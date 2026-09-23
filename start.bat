@echo off
title LearnSpace Platform - Learn. Connect. Grow.
echo ===================================================
echo   Starting LearnSpace Full Stack Platform
echo   "Learn. Connect. Grow."
echo ===================================================

set "PATH=C:\Users\pedro\.nodejs\node-v20.18.0-win-x64;%PATH%"

echo [1/2] Starting LearnSpace Backend API & WebSockets Server on Port 5000...
start "LearnSpace Backend" cmd /k "cd server && node --experimental-sqlite src/index.js"

timeout /t 2 /nobreak > nul

echo [2/2] Starting LearnSpace Frontend on Port 5173...
start "LearnSpace Frontend" cmd /k "cd client && npm run dev"

timeout /t 2 /nobreak > nul
echo Opening LearnSpace in your browser: http://localhost:5173
start http://localhost:5173

echo.
echo LearnSpace is now running!
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:5000
echo Demo Persona Accounts:
echo  1. Student: pedro@learnspace.io / password123 (or 1-click in UI)
echo  2. Creator: sarah@learnspace.io / password123 (or 1-click in UI)
echo  3. Admin:   alex@learnspace.io  / password123 (or 1-click in UI)
echo.
pause
