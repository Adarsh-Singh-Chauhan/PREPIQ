@echo off
title PrepIQ - Starting...
color 0A
echo.
echo  ============================================
echo   PrepIQ - AI Career Preparation Platform
echo   "Know where you're going. Practice until
echo    you get there."
echo  ============================================
echo.
echo  [1/2] Installing dependencies...
echo.
call npm install
if errorlevel 1 (
    echo.
    echo  ERROR: npm install failed!
    echo  Make sure Node.js is installed.
    echo  Download from: https://nodejs.org
    pause
    exit /b 1
)
echo.
echo  ============================================
echo  [2/2] Starting development server...
echo  ============================================
echo.
echo  Open http://localhost:3000 in your browser
echo.
call npm run dev
pause
