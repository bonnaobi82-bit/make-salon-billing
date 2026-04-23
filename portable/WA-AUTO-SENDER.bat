@echo off
title Ma-Ke Salon - WhatsApp Auto-Sender
color 0A

set ROOT=%~dp0
cd /d "%ROOT%"

echo =========================================================
echo   Ma-Ke Salon - WhatsApp Auto-Sender
echo =========================================================
echo.
echo   STEP 1: Open Chrome/Edge browser
echo   STEP 2: Go to web.whatsapp.com
echo   STEP 3: Scan QR code with your salon's WhatsApp phone
echo   STEP 4: Come back here and press any key to start
echo.
echo   After starting, messages from salon software will be
echo   sent AUTOMATICALLY via WhatsApp! No clicking needed.
echo.
pause

:: Check if Python exists in portable runtime or system
if exist "runtime\python\python.exe" (
    echo Installing required package...
    runtime\python\python.exe -m pip install pyautogui --quiet --no-warn-script-location 2>nul
    echo Starting auto-sender...
    runtime\python\python.exe WA-AUTO-SENDER.py
) else (
    echo Installing required package...
    python -m pip install pyautogui --quiet --no-warn-script-location 2>nul
    echo Starting auto-sender...
    python WA-AUTO-SENDER.py
)

pause
