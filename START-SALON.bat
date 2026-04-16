@echo off
echo ========================================
echo   Ma-Ke Salon - Starting Software...
echo ========================================
echo.
docker-compose up -d
echo.
echo Software is starting... Please wait 2 minutes.
echo.
echo Then open your browser and go to:
echo   http://localhost:3000
echo.
echo Login: admin@salon.com / admin123
echo.
echo Press any key to open the app in your browser...
pause >nul
start http://localhost:3000
