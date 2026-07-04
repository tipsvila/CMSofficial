@echo off
echo ========================================
echo   INTAEROBASE Git Push
echo ========================================
echo.
echo Select account:
echo   1. hfaisalfarooq (Vercel connected)
echo   2. atibapk
echo.
set /p choice=Enter choice (1 or 2):

if "%choice%"=="1" (
    echo.
    echo Switching to tipsvila...
    git config user.name "tipsvila"
    git config user.email "tipsvila@gmail.com"
    git remote set-url origin https://github.com/tipsvila/cmsofficial.git
    set REPO_NAME=cmsofficial
) else if "%choice%"=="2" (
    echo.
    echo Switching to hfaisalfarooq...
    git config user.name "hfaisalfarooq"
    git config user.email "hfaisalfarooq@gmail.com"
    git remote set-url origin https://github.com/hfaisalfarooq/IABofficial.git
    set REPO_NAME=IABofficial
) else if "%choice%"=="2" (
    echo.
    echo Switching to atibapk...
    git config user.name "atibapk-3401"
    git config user.email "atibapk@gmail.com"
    git remote set-url origin https://github.com/atibapk/IABoficial.git
    set REPO_NAME=IABoficial
) else (
    echo Invalid choice!
    pause
    exit /b
)

echo.
echo Current config:
git config user.name
git config user.email
echo.
echo ========================================
echo.
echo Adding files...
git add -A
echo.
echo Enter commit message:
set /p msg=
if "%msg%"=="" set msg=Update
echo Committing: %msg%
git commit -m "%msg%"
echo.
echo Pushing to %REPO_NAME%...
git push origin main
echo.
echo ========================================
echo Done! Pushed to %REPO_NAME%
echo ========================================
pause