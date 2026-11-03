@echo off
title Udhyana Games - Update Reception App
color 0A
cls

echo =================================================================
echo             UDHYANA GAMES - RECEPTION APP UPDATER
echo =================================================================
echo.
echo [1/3] Syncing latest offline stations, games, and pricing...
node scripts/sync-offline-data.mjs
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo [ERROR] Synchronization failed!
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/3] Building latest Windows executable...
call npm run package:exe
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo [ERROR] Build failed!
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [3/3] Updating Udhyana Reception.exe in website folder...
node scripts/post-build-copy.mjs

echo.
echo =================================================================
echo [SUCCESS] Done! Your app is updated.
echo Double-click "Udhyana Reception.exe" in this folder anytime!
echo =================================================================
echo.
pause
