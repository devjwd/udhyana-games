@echo off
title Udhyana Games - Reception Desktop App
echo Starting Udhyana Games Reception Terminal...

:: Start Next.js local server in background if not already running
start /B npm run start

:: Wait a brief moment for server initialization
timeout /t 3 /nobreak >nul

:: Launch Electron Desktop App
npm run desktop:dev
