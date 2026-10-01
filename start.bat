@echo off
title NEXO Platform
echo ===================================================
echo   NEXO - Plataforma de E-Learning e Comunidade
echo ===================================================

set "PATH=C:\Users\pedro\.nodejs\node-v20.18.0-win-x64;%PATH%"

echo [1/2] A iniciar Backend (API + WebSockets) na porta 5000...
start "NEXO Backend" cmd /k "cd /d "%~dp0backend" && npm run dev"

timeout /t 3 /nobreak > nul

echo [2/2] A iniciar Frontend na porta 5173...
start "NEXO Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

timeout /t 3 /nobreak > nul

echo A abrir o browser em http://localhost:5173 ...
start http://localhost:5173

echo.
echo ===================================================
echo   NEXO esta a correr!
echo.
echo   Frontend : http://localhost:5173
echo   Backend  : http://localhost:5000
echo   Health   : http://localhost:5000/api/health
echo.
echo   Contas de demonstracao (password: password123)
echo     Aluno  : aluno@nexo.pt
echo     Criador: sarah@nexo.pt
echo     Admin  : alex@nexo.pt
echo ===================================================
echo.
pause
