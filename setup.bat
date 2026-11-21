@echo off
rem Pull the latest changes from GitHub, then start the GrappleWiki server.
cd /d "%~dp0"

echo Pulling latest changes from GitHub...
git pull --ff-only
if errorlevel 1 (
    echo.
    echo git pull failed. You may have local changes that clash with GitHub.
    echo Run finish.bat to commit them, or sort it out with git, then try again.
    pause
    exit /b 1
)

echo.
echo Starting server at http://localhost:8417  (close this window or press Ctrl+C to stop)
start "" http://localhost:8417
node server.js
pause
