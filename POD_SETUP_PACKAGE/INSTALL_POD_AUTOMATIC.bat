@echo off
setlocal enabledelayedexpansion
title Udhyana Games - Automatic Station Pod Setup
color 0B

:: 1. Self-Elevate to Administrator if not already running as Admin
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [Requesting Administrator Privileges...]
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

cls
echo ================================================================
echo       UDHYANA GAMES -- AUTOMATIC STATION POD INSTALLER
echo ================================================================
echo.

:: 2. Auto-Detect Server IP from server_ip.txt (if copied from USB)
set SERVER_IP=
if exist "%~dp0server_ip.txt" (
    set /p SERVER_IP=<"%~dp0server_ip.txt"
    set SERVER_IP=!SERVER_IP: =!
)

if "%SERVER_IP%"=="" (
    :: Fallback: Check Default Gateway (often router / main server)
    for /f "tokens=3" %%i in ('route print ^| findstr "\<0.0.0.0\>"') do (
        set GATEWAY_IP=%%i
    )
    echo  Could not find server_ip.txt on this drive.
    set /p SERVER_IP=" Enter Reception PC IP (default: !GATEWAY_IP!): "
    if "!SERVER_IP!"=="" set SERVER_IP=!GATEWAY_IP!
) else (
    echo [1/5] Auto-detected Server IP from USB config: %SERVER_IP%
)
echo.

:: 3. Hardware Tweaks: Disable Sleep & Screen Timeout
echo [2/5] Configuring Power & Display to NEVER Sleep (24/7 Kiosk)...
powercfg -change -standby-timeout-ac 0 >nul 2>&1
powercfg -change -monitor-timeout-ac 0 >nul 2>&1
powercfg -change -hibernate-timeout-ac 0 >nul 2>&1
powercfg -setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c >nul 2>&1
echo       - Sleep and screen timeouts disabled!
echo.

:: 4. Touch Screen Recovery: Auto-enable any disabled touch devices
echo [3/5] Checking and re-enabling Touch Screen digitizer drivers...
powershell -NoProfile -Command "Get-PnpDevice | Where-Object { ($_.FriendlyName -like '*touch*' -or $_.Class -eq 'HIDClass') -and $_.Status -ne 'OK' } | ForEach-Object { Enable-PnpDevice -InstanceId $_.InstanceId -Confirm:$false -ErrorAction SilentlyContinue }" >nul 2>&1
echo       - Touch screen hardware scanned and activated!
echo.

:: 5. Set System Audio to ~85% Volume for loud countdown chimes
echo [4/5] Setting system audio volume for chimes & alerts...
powershell -NoProfile -Command "$w = New-Object -ComObject WScript.Shell; 1..40 | ForEach-Object { $w.SendKeys([char]175) }" >nul 2>&1
echo       - Volume adjusted!
echo.

:: 6. Station Selection Menu
echo ================================================================
echo                 SELECT STATION FOR THIS TABLET
echo ================================================================
echo.
echo   [1] Station 1 (PS5)
echo   [2] Station 2 (Xbox Series X)
echo   [3] Station 3 (Xbox Series X 2)
echo   [4] Station 4 (Steering Wheel + PS4)
echo   [5] Station 5 (Custom Station)
echo.
set /p POD_CHOICE=" Enter choice (1-5): "

if "%POD_CHOICE%"=="1" set STATION_ID=PS5
if "%POD_CHOICE%"=="2" set STATION_ID=Xbox series X
if "%POD_CHOICE%"=="3" set STATION_ID=Xbox series X(2)
if "%POD_CHOICE%"=="4" set STATION_ID=steerin wheel + ps4
if "%POD_CHOICE%"=="5" (
    echo.
    set /p STATION_ID=" Enter custom station ID (e.g. Station 5): "
)

if "%STATION_ID%"=="" set STATION_ID=PS5

set TARGET_URL=http://%SERVER_IP%:3000/station/%STATION_ID%

echo.
echo [5/5] Creating Windows Startup Auto-Boot Kiosk...

:: Locate Microsoft Edge
set EDGE_PATH=C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe
if not exist "%EDGE_PATH%" (
    set EDGE_PATH=C:\Program Files\Microsoft\Edge\Application\msedge.exe
)

if not exist "%EDGE_PATH%" (
    echo [ERROR] Microsoft Edge was not found on this tablet.
    pause
    exit /b
)

:: Create Startup Shortcut in Windows shell:startup
set VBS_SCRIPT=%TEMP%\create_kiosk_shortcut.vbs
set STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup

echo Set oWS = WScript.CreateObject("WScript.Shell") > "%VBS_SCRIPT%"
echo sLinkFile = "%STARTUP_DIR%\UdhyanaStationPod.lnk" >> "%VBS_SCRIPT%"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%VBS_SCRIPT%"
echo oLink.TargetPath = "%EDGE_PATH%" >> "%VBS_SCRIPT%"
echo oLink.Arguments = "--kiosk ""%TARGET_URL%"" --edge-kiosk-type=fullscreen --no-first-run --disable-pinch --enable-features=OverlayScrollbar" >> "%VBS_SCRIPT%"
echo oLink.Description = "Udhyana Games Station Pod Kiosk" >> "%VBS_SCRIPT%"
echo oLink.Save >> "%VBS_SCRIPT%"

cscript //nologo "%VBS_SCRIPT%" >nul
del "%VBS_SCRIPT%" >nul 2>&1

cls
echo ================================================================
echo           STATION POD SETUP SUCCESSFULLY COMPLETED!
echo ================================================================
echo.
echo  Station Assigned : %STATION_ID%
echo  Target Server    : %SERVER_IP%
echo  Kiosk URL        : %TARGET_URL%
echo.
echo  - Auto-start configured: Whenever this tablet boots, it will
echo    launch directly into the Udhyana Station Pod screen!
echo  - Screen and sleep timers set to NEVER sleep.
echo  - Volume raised for alerts.
echo.
echo  Press any key to test launch the pod right now...
pause >nul

start "" "%EDGE_PATH%" --kiosk "%TARGET_URL%" --edge-kiosk-type=fullscreen --no-first-run --disable-pinch
exit
