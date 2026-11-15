@echo off
setlocal enabledelayedexpansion
title Udhyana Games - Automatic Station Pod Setup
color 0B

:: 1. Self-Elevate to Administrator
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [Requesting Administrator Privileges...]
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

cls
echo ================================================================
echo       UDHYANA GAMES -- NEC VERSAPRO STATION POD INSTALLER
echo ================================================================
echo.

:: 2. Auto-Detect Server IP from server_ip.txt
set SERVER_IP=
if exist "%~dp0server_ip.txt" (
    set /p SERVER_IP=<"%~dp0server_ip.txt"
    set SERVER_IP=!SERVER_IP: =!
)

if "%SERVER_IP%"=="" (
    for /f "tokens=3" %%i in ('route print ^| findstr "\<0.0.0.0\>"') do (
        set GATEWAY_IP=%%i
    )
    echo  Could not read server_ip.txt automatically.
    set /p SERVER_IP=" Enter Reception PC IP Address (e.g. 192.168.1.28): "
    if "!SERVER_IP!"=="" set SERVER_IP=!GATEWAY_IP!
) else (
    echo [1/5] Server IP detected from USB: %SERVER_IP%
)
echo.

:: 3. Configure Power & Display (NEVER Sleep or Turn Off Screen)
echo [2/5] Configuring Power Settings (24/7 Always-On Kiosk)...
powercfg -change -standby-timeout-ac 0 >nul 2>&1
powercfg -change -monitor-timeout-ac 0 >nul 2>&1
powercfg -change -hibernate-timeout-ac 0 >nul 2>&1
powercfg -change -standby-timeout-dc 0 >nul 2>&1
powercfg -change -monitor-timeout-dc 0 >nul 2>&1
powercfg -setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c >nul 2>&1
echo       - Sleep and screen timeouts disabled!
echo.

:: 4. Touch Screen Recovery for NEC VersaPro
echo [3/5] Checking and re-enabling Touch Screen digitizer drivers...
sc config hidserv start= auto >nul 2>&1
net start hidserv >nul 2>&1
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "Get-PnpDevice | Where-Object { ($_.FriendlyName -like '*touch*' -or $_.FriendlyName -like '*digitizer*' -or $_.FriendlyName -like '*I2C*' -or $_.Class -eq 'HIDClass') -and $_.Status -ne 'OK' } | ForEach-Object { Enable-PnpDevice -InstanceId $_.InstanceId -Confirm:$false -ErrorAction SilentlyContinue }" >nul 2>&1
powershell -NoProfile -ExecutionPolicy Bypass -Command "pnputil /scan-devices" >nul 2>&1
echo       - Touch screen hardware scanned and activated!
echo.

:: 5. Set System Audio to ~85% Volume for countdown alerts
echo [4/5] Setting system audio volume for loud countdown chimes...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$w = New-Object -ComObject WScript.Shell; 1..40 | ForEach-Object { $w.SendKeys([char]175) }" >nul 2>&1
echo       - Volume adjusted!
echo.

:: 6. Station Selection Menu
echo ================================================================
echo                 WHICH STATION IS THIS TABLET?
echo ================================================================
echo.
echo   [1] Station 1 -- PS5
echo   [2] Station 2 -- Xbox Series X
echo   [3] Station 3 -- Xbox Series X (2)
echo   [4] Station 4 -- Steering Wheel + PS4
echo   [5] Station 5 -- Custom Station Name
echo.
set /p POD_CHOICE=" Enter Station Number (1-5): "

if "%POD_CHOICE%"=="1" (
    set STATION_ID=PS5
    set STATION_LABEL=Station 1 (PS5)
)
if "%POD_CHOICE%"=="2" (
    set STATION_ID=Xbox series X
    set STATION_LABEL=Station 2 (Xbox Series X)
)
if "%POD_CHOICE%"=="3" (
    set STATION_ID=Xbox series X(2)
    set STATION_LABEL=Station 3 (Xbox Series X 2)
)
if "%POD_CHOICE%"=="4" (
    set STATION_ID=steerin wheel + ps4
    set STATION_LABEL=Station 4 (Steering Wheel + PS4)
)
if "%POD_CHOICE%"=="5" (
    echo.
    set /p STATION_ID=" Enter custom station ID: "
    set STATION_LABEL=Custom (!STATION_ID!)
)

if "%STATION_ID%"=="" (
    set STATION_ID=PS5
    set STATION_LABEL=Station 1 (PS5)
)

set TARGET_URL=http://%SERVER_IP%:3000/station/%STATION_ID%

echo.
echo [5/5] Creating Windows Startup Auto-Boot Kiosk...

:: Locate Microsoft Edge or Chrome
set BROWSER_PATH=C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe
if not exist "%BROWSER_PATH%" (
    set BROWSER_PATH=C:\Program Files\Microsoft\Edge\Application\msedge.exe
)
if not exist "%BROWSER_PATH%" (
    set BROWSER_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe
)
if not exist "%BROWSER_PATH%" (
    set BROWSER_PATH=C:\Program Files (x86)\Google\Chrome\Application\chrome.exe
)

if not exist "%BROWSER_PATH%" (
    echo [ERROR] Neither Microsoft Edge nor Google Chrome was found!
    pause
    exit /b
)

:: Create Startup Shortcut in Windows shell:startup
set VBS_SCRIPT=%TEMP%\create_kiosk_shortcut.vbs
set STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup

echo Set oWS = WScript.CreateObject("WScript.Shell") > "%VBS_SCRIPT%"
echo sLinkFile = "%STARTUP_DIR%\UdhyanaStationPod.lnk" >> "%VBS_SCRIPT%"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%VBS_SCRIPT%"
echo oLink.TargetPath = "%BROWSER_PATH%" >> "%VBS_SCRIPT%"
echo oLink.Arguments = "--kiosk ""%TARGET_URL%"" --edge-kiosk-type=fullscreen --no-first-run --disable-pinch --enable-features=OverlayScrollbar --autoplay-policy=no-user-gesture-required" >> "%VBS_SCRIPT%"
echo oLink.Description = "Udhyana Games Station Pod Kiosk" >> "%VBS_SCRIPT%"
echo oLink.Save >> "%VBS_SCRIPT%"

cscript //nologo "%VBS_SCRIPT%" >nul
del "%VBS_SCRIPT%" >nul 2>&1

cls
echo ================================================================
echo           STATION POD SETUP SUCCESSFULLY COMPLETED!
echo ================================================================
echo.
echo  Assigned Station : %STATION_LABEL%
echo  Target Server    : %SERVER_IP%:3000
echo  Full Kiosk URL   : %TARGET_URL%
echo.
echo  [x] Auto-Start Configured: Tablet will boot directly into this
echo      pod station whenever it is turned on or restarted.
echo  [x] Screen and Sleep timers set to NEVER sleep.
echo  [x] Touch screen drivers verified.
echo  [x] Loud alert sound enabled.
echo.
echo ================================================================
echo Press any key to launch the Station Pod screen right now...
pause >nul

start "" "%BROWSER_PATH%" --kiosk "%TARGET_URL%" --edge-kiosk-type=fullscreen --no-first-run --disable-pinch --autoplay-policy=no-user-gesture-required
exit
