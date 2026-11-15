@echo off
setlocal enabledelayedexpansion
title Udhyana Games - NEC Tablet Hardware Diagnostic Suite
color 0B

set SERVER_IP=
if exist "%~dp0server_ip.txt" (
    set /p SERVER_IP=<"%~dp0server_ip.txt"
    set SERVER_IP=!SERVER_IP: =!
)
if "%SERVER_IP%"=="" set SERVER_IP=192.168.1.28

echo ================================================================
echo        UDHYANA GAMES -- NEC VERSAPRO HARDWARE DIAGNOSTICS
echo ================================================================
echo.
echo Target Server: %SERVER_IP%:3000
echo Diagnostic URL: http://%SERVER_IP%:3000/station/test
echo.
echo Launching Interactive Diagnostics:
echo  [x] 24-Zone Touch Digitizer Calibration Grid
echo  [x] Web Audio Chimes & Speaker Volume Test
echo  [x] OLED Stealth Blackout & Color Uniformity Test
echo  [x] Live Network Ping & Staff Beacon Dispatch
echo  [x] Tablet Offline Cache Storage Verification
echo.
pause

set BROWSER_PATH=C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe
if not exist "%BROWSER_PATH%" set BROWSER_PATH=C:\Program Files\Microsoft\Edge\Application\msedge.exe
if not exist "%BROWSER_PATH%" set BROWSER_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe
if not exist "%BROWSER_PATH%" set BROWSER_PATH=C:\Program Files (x86)\Google\Chrome\Application\chrome.exe

start "" "%BROWSER_PATH%" --kiosk "http://%SERVER_IP%:3000/station/test" --edge-kiosk-type=fullscreen --no-first-run --disable-pinch --autoplay-policy=no-user-gesture-required
exit
