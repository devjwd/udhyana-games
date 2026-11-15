@echo off
setlocal enabledelayedexpansion
title Udhyana Games - Server & USB Package Creator
color 0A

:: Check for Administrator privileges
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [Requesting Administrator Elevation...]
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

cls
echo ================================================================
echo       UDHYANA GAMES -- MAIN SERVER & POD USB PREPARATION
echo ================================================================
echo.

:: 1. Open Windows Firewall Port 3000 so Pods can connect
echo [1/4] Ensuring Windows Firewall allows Pod connections on Port 3000...
netsh advfirewall firewall show rule name="Udhyana Lounge Port 3000" >nul 2>&1
if %errorlevel% neq 0 (
    netsh advfirewall firewall add rule name="Udhyana Lounge Port 3000" dir=in action=allow protocol=TCP localport=3000 profile=any >nul
    echo       - Firewall rule created successfully for Port 3000!
) else (
    echo       - Firewall rule already active.
)
echo.

:: 2. Auto-Detect Local IPv4 Address
echo [2/4] Detecting your Local Wi-Fi / LAN IP Address...
for /f "tokens=4" %%a in ('route print ^| findstr "0.0.0.0.*0.0.0.0"') do (
    set SERVER_IP=%%a
)

:: Fallback IP detection via PowerShell if needed
if "%SERVER_IP%"=="" (
    for /f %%a in ('powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike '*Loopback*' -and $_.IPAddress -notlike '169.254*' }).IPAddress[0]"') do set SERVER_IP=%%a
)

echo       - Detected Main Server IP: %SERVER_IP%
echo.

:: 3. Create and Sync the Dedicated Pod Folder
echo [3/4] Preparing Dedicated Pod Folder: UDHYANA_STATION_POD...
set POD_DIR=%~dp0UDHYANA_STATION_POD
if not exist "%POD_DIR%" mkdir "%POD_DIR%"

:: Save server IP into config file so pod script can read it with ZERO typing
echo %SERVER_IP%> "%POD_DIR%\server_ip.txt"

echo       - Folder ready at: %POD_DIR%
echo       - Server IP configured: %SERVER_IP%
echo.

:: 4. Check for USB Drives to auto-copy
echo [4/4] Checking for USB Flash Drive...
set USB_FOUND=0
for /f "tokens=1" %%d in ('powershell -NoProfile -Command "Get-Volume | Where-Object { $_.DriveType -eq 'Removable' -and $_.DriveLetter } | Select-Object -ExpandProperty DriveLetter"') do (
    if exist "%%d:\" (
        set USB_FOUND=1
        echo       - Removable USB Drive found at %%d:\
        echo       - Copying UDHYANA_STATION_POD folder to USB...
        xcopy "%POD_DIR%" "%%d:\UDHYANA_STATION_POD\" /E /I /Y >nul
        echo       - Done! Entire 'UDHYANA_STATION_POD' folder copied to USB (%%d:\)
    )
)

if %USB_FOUND%==0 (
    echo       - No USB drive currently inserted.
    echo       - You can copy the 'UDHYANA_STATION_POD' folder directly to any USB drive!
)

echo.
echo ================================================================
echo                  POD PACKAGE READY TO GO!
echo ================================================================
echo.
echo  1. Copy the 'UDHYANA_STATION_POD' folder to your USB drive.
echo  2. Plug that USB drive into each NEC VersaPro pod and double-click:
echo     1_SETUP_THIS_POD.bat
echo.
echo ================================================================
echo.
echo Starting Udhyana Games Server on http://%SERVER_IP%:3000 ...
echo.
pause
npm run dev
