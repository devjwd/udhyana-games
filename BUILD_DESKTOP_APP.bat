@echo off
title Udhyana Games - Desktop App Creator
color 0A
cls

echo =================================================================
echo             UDHYANA GAMES - DESKTOP APP CREATOR (.EXE)
echo =================================================================
echo.
echo [1/3] Synchronizing offline database, stations, games, and pricing...
node scripts/sync-offline-data.mjs
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo [ERROR] Offline database synchronization failed!
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/3] Compiling and packaging latest Windows Desktop App (.exe)...
echo       Please wait a moment while Electron packages the files...
echo.
call npm run package:exe
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo [ERROR] Desktop App build failed! Please inspect the logs above.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo =================================================================
echo [3/3] SUCCESS! Desktop App (.exe) updated successfully!
echo =================================================================
echo.
echo Your new offline executable files are in:
echo   dist-electron\
echo.
echo Opening dist-electron folder...
explorer dist-electron

echo.
pause

