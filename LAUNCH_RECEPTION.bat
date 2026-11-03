@echo off
title Udhyana Reception Desk
color 0A
set ELECTRON_RUN_AS_NODE=
start "" "%~dp0node_modules\electron\dist\electron.exe" "%~dp0."

