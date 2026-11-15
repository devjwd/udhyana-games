@echo off
setlocal enabledelayedexpansion
title Udhyana Games - Test Station Pod
color 0E

set SERVER_IP=
if exist "%~dp0server_ip.txt" (
    set /p SERVER_IP=<"%~dp0server_ip.txt"
    set SERVER_IP=!SERVER_IP: =!
)
if "%SERVER_IP%"=="" set SERVER_IP=192.168.1.28

echo ================================================================
echo             TEST LAUNCH UDHYANA STATION POD
echo ================================================================
echo.
echo Server IP: %SERVER_IP%
echo.
echo Select Station to test:
echo   [1] Station 1 (PS5)
echo   [2] Station 2 (Xbox Series X)
echo   [3] Station 3 (Xbox Series X 2)
echo   [4] Station 4 (Steering Wheel + PS4)
echo.
set /p TEST_CHOICE=" Choose (1-4): "

if "%TEST_CHOICE%"=="1" set STATION_ID=PS5
if "%TEST_CHOICE%"=="2" set STATION_ID=Xbox series X
if "%TEST_CHOICE%"=="3" set STATION_ID=Xbox series X(2)
if "%TEST_CHOICE%"=="4" set STATION_ID=steerin wheel + ps4
if "%STATION_ID%"=="" set STATION_ID=PS5

set TARGET_URL=http://%SERVER_IP%:3000/station/%STATION_ID%

set BROWSER_PATH=C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe
if not exist "%BROWSER_PATH%" set BROWSER_PATH=C:\Program Files\Microsoft\Edge\Application\msedge.exe

echo.
echo Launching %TARGET_URL% in Kiosk mode...
start "" "%BROWSER_PATH%" --kiosk "%TARGET_URL%" --edge-kiosk-type=fullscreen --no-first-run --disable-pinch
exit
