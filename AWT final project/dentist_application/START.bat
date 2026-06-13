@echo off
REM DentalCare Application Startup Script for Windows

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║          🦷 DentalCare Application Startup Script 🦷           ║
echo ║         Full-Stack Dental Management Application               ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

echo [1/5] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed. Please install Node.js first.
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)
echo ✓ Node.js found
echo.

echo [2/5] Checking MongoDB...
cls
echo Checking MongoDB connection...
echo.
echo MongoDB is required. Make sure:
echo - MongoDB is installed and running, OR
echo - MongoDB Atlas cloud instance connection string is set in .env
echo.
echo Current MONGODB_URI in .env:
findstr "MONGODB_URI" .env
echo.
echo [Press Enter to continue...]
pause

echo.
echo [3/5] Installing dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo ✓ Dependencies installed
echo.

echo [4/5] Starting Backend Server...
echo.
echo Starting Express server on port 5000...
echo API: http://localhost:5000
echo.
echo Press Ctrl+C to stop the server
echo.
timeout /t 3 /nobreak

start cmd /k "npm start"

echo.
echo [5/5] Frontend Setup...
echo.
echo ✓ Backend server started in new window
echo.
echo To view the application:
echo 1. Option A: Open frontend\index.html in your browser directly
echo 2. Option B: Use VS Code Live Server extension on frontend\index.html
echo 3. Option C: Use any local web server pointing to the frontend folder
echo.
echo ═══════════════════════════════════════════════════════════════
echo  Frontend: Open frontend/index.html in your browser
echo  Backend:  Running on http://localhost:5000
echo  Database: MongoDB on localhost:27017 (or Atlas)
echo ═══════════════════════════════════════════════════════════════
echo.
echo Useful Commands:
echo   npm start          - Start backend server
echo   npm run dev        - Start with auto-reload (requires nodemon)
echo   npm test           - Run tests
echo.
echo Available Routes:
echo   GET  /             - API info
echo   POST /api/auth/register
echo   POST /api/auth/login
echo   GET  /api/doctors
echo   GET  /api/appointments/user/appointments
echo   POST /api/appointments
echo.
echo Test Accounts:
echo   Patient: patient@example.com / password123
echo   Doctor:  doctor@example.com / password123
echo.
echo For more information, read:
echo   - .env           (Configuration)
echo   - README.md      (Documentation)
echo   - STARTUP_GUIDE.md (Detailed setup)
echo   - PROJECT_COMPLETE.md (Complete overview)
echo.
echo Press Enter to open the application folder...
pause

REM Open the project folder
start explorer .

echo.
echo Application is ready! 
echo Backend running in the other window.
echo Frontend: Open frontend/index.html
echo.
pause
