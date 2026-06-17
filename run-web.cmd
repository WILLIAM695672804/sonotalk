@echo off
set "PATH=C:\Program Files\nodejs;%PATH%"
set CI=1
set BROWSER=none
set EXPO_NO_TELEMETRY=1
call npm run web
