@echo off
title Ma-Ke Salon - Stopping
color 0C
echo =========================================================
echo   Ma-Ke Salon - Stopping Software...
echo =========================================================
echo.
taskkill /f /im mongod.exe >nul 2>&1
taskkill /f /im python.exe >nul 2>&1
echo   All services stopped.
echo   Your data is safely saved.
echo.
pause
