@echo off
rem PATH : Node + cloudflared (aucun des deux n'est dans le PATH par defaut ici)
set "PATH=C:\Program Files\nodejs;%LOCALAPPDATA%\Programs\cloudflared;%PATH%"
set CI=1
set BROWSER=none
set EXPO_NO_TELEMETRY=1

rem Tunnel HTTPS Cloudflare dans une fenetre separee : permet de tester sur
rem telephone (le micro exige du HTTPS). L'URL https://xxxx.trycloudflare.com
rem s'affiche dans cette fenetre une fois le serveur web demarre.
start "SonoTalk - Tunnel HTTPS (telephone)" cmd /k npm run tunnel

rem Serveur web Expo au premier plan (http://localhost:8081)
call npm run web
