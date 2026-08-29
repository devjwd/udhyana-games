@echo off
title Udhyana Games - Reception Terminal
echo ========================================================
echo   UDHYANA GAMES - RECEPTION DESK TERMINAL LAUNCHER
echo ========================================================
echo.

:: Check if server is already responding on port 3000
netstat -ano | findstr :3000 | findstr LISTENING >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [1/2] Starting Udhyana Games Local Backend Engine...
    start /min "Udhyana Backend Server" npm run start
    echo Waiting for backend engine to initialize...
    timeout /t 3 /nobreak >nul
) else (
    echo [1/2] Backend engine is already online!
)

echo [2/2] Launching Reception Desktop Terminal...
call npm run desktop:dev
