@echo off
rem Commit any changes and push them to GitHub.
cd /d "%~dp0"

git add -A

git diff --cached --quiet
if not errorlevel 1 (
    echo No changes to commit.
    goto push
)

echo Changes to commit:
git status --short
echo.
set "MSG="
set /p "MSG=Commit message (leave blank for a default): "
if "%MSG%"=="" set "MSG=Update wiki %date% %time:~0,5%"

git commit -m "%MSG%"
if errorlevel 1 (
    echo Commit failed.
    pause
    exit /b 1
)

:push
echo.
echo Pushing to GitHub...
git pull --rebase
if errorlevel 1 (
    echo.
    echo Pulling remote changes failed. Sort out the conflict with git, then run finish.bat again.
    pause
    exit /b 1
)
git push
if errorlevel 1 (
    echo Push failed.
    pause
    exit /b 1
)

echo.
echo Done. Everything is on GitHub.
pause
