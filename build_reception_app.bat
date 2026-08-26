@echo off
title Udhyana Games - Reception Terminal EXE Builder
echo =======================================================
echo    UDHYANA GAMES - RECEPTION DESKTOP (.EXE) BUILDER
echo =======================================================
echo.
echo Packaging Standalone Reception POS into Windows Installer...
echo.
call npm run package:exe
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Packaging failed. Please check the log above.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo =======================================================
echo [SUCCESS] Windows Installer & Portable EXE Generated!
echo Location: %cd%\dist-electron\
echo.
echo Files ready for Reception PC:
echo  1. Udhyana Games Reception Setup.exe (Installer)
echo  2. Udhyana Games Reception.exe (Portable Standalone)
echo =======================================================
echo.
pause
