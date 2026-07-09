@echo off
echo ==========================================
echo   CMS OFFICIAL
echo   SAM.gov Aviation Compliance System
echo ==========================================
echo.
echo   [Using stable Webpack - no Turbopack HMR errors]
echo   [Auto-cache clear enabled - .next wiped on dev start]
echo.
echo   1. Dev Server (port 3000)
echo   2. Dev Server (port 3005)
echo   3. Dev Server (port 3002)
echo   4. Build + Production Server
echo   5. Clear Cache Only
echo   6. Exit
echo.
set /p choice=Select (1-6):

if "%choice%"=="1" (
    echo.
    echo Clearing cache and starting dev server on http://localhost:3000 ...
    pnpm dev
) else if "%choice%"=="2" (
    echo.
    echo Clearing cache and starting dev server on http://localhost:3005 ...
    pnpm dev:3005
) else if "%choice%"=="3" (
    echo.
    echo Clearing cache and starting dev server on http://localhost:3002 ...
    pnpm dev -p 3002
) else if "%choice%"=="4" (
    echo.
    echo Building for production...
    pnpm build
    if %errorlevel% neq 0 (
        echo Build failed!
        pause
        exit /b 1
    )
    echo.
    echo Starting production server on http://localhost:3000 ...
    pnpm start
) else if "%choice%"=="5" (
    echo.
    echo Clearing .next cache...
    pnpm clean
    echo Cache cleared!
    pause
) else if "%choice%"=="6" (
    exit /b
) else (
    echo Invalid choice!
)
pause
