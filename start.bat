@echo off
setlocal
chcp 65001 > nul
title NEXO
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start.ps1" %*
set "NEXO_EXIT=%ERRORLEVEL%"
if not "%NEXO_EXIT%"=="0" if "%~1"=="" pause
exit /b %NEXO_EXIT%
