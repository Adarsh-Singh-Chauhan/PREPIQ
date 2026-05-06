@echo off
title PrepIQ - Fix & Start
color 0B
echo.
echo  ============================================
echo   PrepIQ - AI Career Preparation Platform
echo   Fix All Issues ^& Start Fresh
echo  ============================================
echo.

echo  [1/5] Stopping all Node processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul
echo     Done.

echo  [2/5] Cleaning build cache (.next folder)...
if exist ".next" (
    rmdir /s /q ".next"
    echo     Deleted .next folder
) else (
    echo     .next folder already clean
)

echo  [3/5] Cleaning old node_modules...
if exist "node_modules" (
    rmdir /s /q "node_modules"
    echo     Deleted node_modules
) else (
    echo     node_modules already clean
)

echo  [4/5] Installing fresh dependencies...
echo     This may take 1-2 minutes...
call npm install --legacy-peer-deps
if errorlevel 1 (
    echo.
    echo  ERROR: npm install failed!
    echo  Make sure Node.js v18+ is installed.
    echo  Download from: https://nodejs.org
    pause
    exit /b 1
)
echo     Dependencies installed successfully!

echo.
echo  ============================================
echo  [5/5] Starting development server...
echo  ============================================
echo.
echo  Open http://localhost:3000 in your browser
echo  Press Ctrl+C to stop the server
echo.
call npm run dev
pause
