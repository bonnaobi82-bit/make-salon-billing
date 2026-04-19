@echo off
title Ma-Ke Salon - Running
color 0A

set ROOT=%~dp0
cd /d "%ROOT%"

:: Check if setup was done
if not exist "runtime\python\python.exe" (
    echo ERROR: Please run SETUP-FIRST-TIME.bat first!
    pause
    exit /b 1
)

echo =========================================================
echo   Ma-Ke Salon - Starting...
echo =========================================================
echo.

:: Create data directory if not exists
if not exist "data\db" mkdir data\db
if not exist "logs" mkdir logs

:: ============ Start MongoDB ============
echo [1/3] Starting Database...
start /b "" "runtime\mongodb\bin\mongod.exe" --dbpath "%ROOT%data\db" --port 27017 --logpath "%ROOT%logs\mongodb.log" --logappend
timeout /t 3 /nobreak >nul
echo     Database started!

:: ============ Start Backend ============
echo [2/3] Starting Backend Server...
cd /d "%ROOT%app\backend"

:: Set environment variables
set MONGO_URL=mongodb://localhost:27017
set DB_NAME=salon_billing_db
set CORS_ORIGINS=*
set JWT_SECRET=salon-billing-secret-key-change-in-production
set RESEND_API_KEY=
set SENDER_EMAIL=onboarding@resend.dev
set TWILIO_ACCOUNT_SID=
set TWILIO_AUTH_TOKEN=
set TWILIO_PHONE_NUMBER=
set EMERGENT_LLM_KEY=
set WA_PHONE_NUMBER_ID=1166802419838950
set WA_BUSINESS_ACCOUNT_ID=281365598898076
set WA_ACCESS_TOKEN=EAASA49K8D8EBRNNZAO4eZCz9fYofbtLX84VTiDvQobZCnfEBjHMirK9fOhwyHuszkRMPgs2KvxqSORYRPKQyeQTyUERcUFxOuFYwgO2Ccts3QjvD3Ab7QTp9aISwpp1eEeNM3XwCHLmyJNKMCr1rfSjJk4gMKfvfCm2vqhr1k9Sda3hQ2r4SA0dPtmzJREmNbO6TLRHmsE5hOkm0ZB4kZA2niDn7fbw0sABjyPw7hCE8ZBEb6BrGKxLFIhoeuyE7IlOQqqgW4pl78o6jEIvEIg7Okx

start /b "" "%ROOT%runtime\python\python.exe" -m uvicorn server:app --host 0.0.0.0 --port 8001 > "%ROOT%logs\backend.log" 2>&1
timeout /t 3 /nobreak >nul
echo     Backend started!

:: ============ Start Frontend ============
echo [3/3] Starting Frontend...
cd /d "%ROOT%app\frontend\build"
start /b "" "%ROOT%runtime\python\python.exe" serve.py > "%ROOT%logs\frontend.log" 2>&1
timeout /t 2 /nobreak >nul
echo     Frontend started!

:: ============ Seed Database ============
cd /d "%ROOT%app\backend"
"%ROOT%runtime\python\python.exe" seed_data.py > "%ROOT%logs\seed.log" 2>&1

cd /d "%ROOT%"

echo.
echo =========================================================
echo   Ma-Ke Salon is RUNNING!
echo =========================================================
echo.
echo   Open your browser and go to:
echo   http://localhost:3000
echo.
echo   Login: admin@salon.com / admin123
echo.
echo   DO NOT CLOSE THIS WINDOW while using the software.
echo   To stop, close this window or press Ctrl+C
echo.
echo =========================================================

:: Open browser
start http://localhost:3000

:: Keep window open
echo.
echo Press any key to STOP the software...
pause >nul

:: Cleanup - kill processes
echo.
echo Stopping services...
taskkill /f /im mongod.exe >nul 2>&1
taskkill /f /im python.exe >nul 2>&1
echo Software stopped. Your data is saved.
timeout /t 2 /nobreak >nul
