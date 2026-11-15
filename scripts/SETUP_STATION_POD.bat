@echo off
title Udhyana Games - Station Pod Auto-Setup
color 0B

echo =======================================================
echo     UDHYANA GAMES -- STATION POD AUTO-INSTALLER
echo =======================================================
echo.

:: 1. Disable Windows Sleep when plugged in
echo [1/3] Setting Windows Power Plan to NEVER sleep...
powercfg -change -standby-timeout-ac 0
powercfg -change -monitor-timeout-ac 0
echo  - Power plan configured successfully!
echo.

:: 2. Prompt for Server IP
set /p SERVER_IP="Enter your Reception PC IP Address (e.g. 192.168.1.50): "
if "%SERVER_IP%"=="" set SERVER_IP=192.168.1.50

:: 3. Select Station
echo.
echo Select the Station for THIS tablet:
echo  [1] Station 1 (PS5)
echo  [2] Station 2 (Xbox series X)
echo  [3] Station 3 (Xbox series X 2)
echo  [4] Station 4 (Steering Wheel + PS4)
echo  [5] Custom Station Name
echo.
set /p CHOICE="Enter choice (1-5): "

if "%CHOICE%"=="1" set STATION_ID=PS5
if "%CHOICE%"=="2" set STATION_ID=Xbox series X
if "%CHOICE%"=="3" set STATION_ID=Xbox series X(2)
if "%CHOICE%"=="4" set STATION_ID=steerin wheel + ps4
if "%CHOICE%"=="5" (
    set /p STATION_ID="Enter custom station ID (e.g. Station 5): "
)

if "%STATION_ID%"=="" set STATION_ID=PS5

set TARGET_URL=http://%SERVER_IP%:3000/station/%STATION_ID%

echo.
echo [2/3] Target Station Pod URL: %TARGET_URL%
echo.

:: 4. Locate Microsoft Edge
set EDGE_PATH=C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe
if not exist "%EDGE_PATH%" (
    set EDGE_PATH=C:\Program Files\Microsoft\Edge\Application\msedge.exe
)

if not exist "%EDGE_PATH%" (
    echo [ERROR] Microsoft Edge was not found in standard paths.
    pause
    exit /b
)

:: 5. Create Startup Shortcut
echo [3/3] Creating Windows Auto-Start Kiosk Shortcut...
set SCRIPT_PATH=%TEMP%\create_kiosk_shortcut.vbs
set STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup

echo Set oWS = WScript.CreateObject("WScript.Shell") > "%SCRIPT_PATH%"
echo sLinkFile = "%STARTUP_DIR%\UdhyanaStationPod.lnk" >> "%SCRIPT_PATH%"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%SCRIPT_PATH%"
echo oLink.TargetPath = "%EDGE_PATH%" >> "%SCRIPT_PATH%"
echo oLink.Arguments = "--kiosk ""%TARGET_URL%"" --edge-kiosk-type=fullscreen --no-first-run --disable-pinch" >> "%SCRIPT_PATH%"
echo oLink.Description = "Udhyana Games Station Pod Kiosk" >> "%SCRIPT_PATH%"
echo oLink.Save >> "%SCRIPT_PATH%"

cscript //nologo "%SCRIPT_PATH%"
del "%SCRIPT_PATH%"

echo.
echo =======================================================
echo           SUCCESS! POD SETUP COMPLETE!
echo =======================================================
echo.
echo Station: %STATION_ID%
echo URL    : %TARGET_URL%
echo.
echo Whenever this tablet turns on or restarts, it will
echo automatically open the fullscreen Udhyana Station Pod!
echo.
echo Press any key to test launch the pod right now...
pause >nul

start "" "%EDGE_PATH%" --kiosk "%TARGET_URL%" --edge-kiosk-type=fullscreen --no-first-run --disable-pinch
exit

