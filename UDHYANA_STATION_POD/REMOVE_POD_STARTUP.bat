@echo off
title Remove Station Pod Auto-Start
color 0C

set STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
set LINK_PATH=%STARTUP_DIR%\UdhyanaStationPod.lnk

echo ================================================================
echo             REMOVE STATION POD AUTO-START SHORTCUT
echo ================================================================
echo.
if exist "%LINK_PATH%" (
    del /f /q "%LINK_PATH%"
    echo [SUCCESS] Auto-start kiosk shortcut has been removed.
    echo The tablet will now boot normally into Windows desktop.
) else (
    echo [INFO] No auto-start shortcut was found in Startup folder.
)
echo.
pause
