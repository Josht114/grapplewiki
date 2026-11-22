@echo off
rem Start the GrappleWiki server only (no git pull). Close this window or press Ctrl+C to stop it.
cd /d "%~dp0"

echo Starting server at http://localhost:8417  (close this window or press Ctrl+C to stop)
start "" http://localhost:8417
node server.js
pause
