@echo off
chcp 65001 > nul
title NEXO - Trabalho Pratico PW
echo ===================================================
echo   NEXO - Plataforma de E-Learning e Comunidade
echo ===================================================
echo.

if exist "C:\Program Files\nodejs" (
  set "PATH=C:\Program Files\nodejs;%PATH%"
)

if not exist "%~dp0backend\.env" (
  if exist "%~dp0backend\.env.example" (
    copy "%~dp0backend\.env.example" "%~dp0backend\.env" > nul
  )
)

if not exist "%~dp0backend\node_modules" (
  echo [ Setup ] A instalar dependencias do Backend...
  pushd "%~dp0backend"
  call npm.cmd install
  popd
)

if not exist "%~dp0frontend\node_modules" (
  echo [ Setup ] A instalar dependencias do Frontend...
  pushd "%~dp0frontend"
  call npm.cmd install
  popd
)

echo [1/2] A iniciar Backend na porta 5000...
start "NEXO Backend" cmd /k "cd /d "%~dp0backend" && npm.cmd run dev"

timeout /t 3 /nobreak > nul

echo [2/2] A iniciar Frontend na porta 5173...
start "NEXO Frontend" cmd /k "cd /d "%~dp0frontend" && npm.cmd run dev"

timeout /t 3 /nobreak > nul

echo A abrir o browser em http://localhost:5173 ...
start http://localhost:5173

echo.
echo ===================================================
echo   Servidores iniciados!
echo.
echo   Frontend : http://localhost:5173
echo   Backend  : http://localhost:5000
echo.
echo   Sem contas predefinidas. Consulte README.md para criar o administrador.
echo ===================================================
echo.
pause
