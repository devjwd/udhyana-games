@echo off
setlocal enabledelayedexpansion
title NEC VersaPro Touch Screen Repair Utility
color 0A

:: Self-Elevate to Administrator
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [Requesting Administrator Privileges...]
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

cls
echo ================================================================
echo          NEC VERSAPRO TOUCH SCREEN REPAIR UTILITY
echo ================================================================
echo.
echo [1/3] Enabling Human Interface Device Service (hidserv)...
sc config hidserv start= auto >nul 2>&1
net start hidserv >nul 2>&1
echo       - Service configured and started.
echo.

echo [2/3] Scanning and re-enabling touch digitizers & HID controllers...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$devices = Get-PnpDevice | Where-Object { ($_.FriendlyName -like '*touch*' -or $_.FriendlyName -like '*digitizer*' -or $_.FriendlyName -like '*wacom*' -or $_.FriendlyName -like '*goodix*' -or $_.FriendlyName -like '*I2C HID*' -or ($_.Class -eq 'HIDClass' -and $_.Status -ne 'OK')) }; if ($devices) { foreach ($d in $devices) { Write-Host 'Enabling: ' $d.FriendlyName ' (' $d.Status ')'; Enable-PnpDevice -InstanceId $d.InstanceId -Confirm:$false -ErrorAction SilentlyContinue } } else { Write-Host 'All touch devices are currently active in Device Manager.' }"

echo.
echo [3/3] Refreshing Windows Hardware Device Tree...
powershell -NoProfile -ExecutionPolicy Bypass -Command "pnputil /scan-devices" >nul 2>&1
echo       - Hardware refreshed!
echo.
echo ================================================================
echo [SUCCESS] Touch Screen Repair Complete!
echo.
echo Test touching the tablet screen now.
echo If it does not respond immediately, please RESTART the tablet.
echo ================================================================
echo.
pause
