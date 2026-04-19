@echo off
title Ma-Ke Salon - First Time Setup
color 0E
echo =========================================================
echo   Ma-Ke Salon - One Time Setup (Run this ONCE only)
echo =========================================================
echo.
echo This will download Python and MongoDB portable (~200MB)
echo Make sure you have internet connection.
echo.
pause

set ROOT=%~dp0
cd /d "%ROOT%"

:: Create directories
if not exist "runtime" mkdir runtime
if not exist "runtime\python" mkdir runtime\python
if not exist "runtime\mongodb" mkdir runtime\mongodb
if not exist "data\db" mkdir data\db
if not exist "logs" mkdir logs

:: ============ Download Python Embeddable ============
echo.
echo [1/4] Downloading Python 3.11 Embeddable...
if not exist "runtime\python\python.exe" (
    powershell -Command "Invoke-WebRequest -Uri 'https://www.python.org/ftp/python/3.11.9/python-3.11.9-embed-amd64.zip' -OutFile 'runtime\python.zip'"
    powershell -Command "Expand-Archive -Path 'runtime\python.zip' -DestinationPath 'runtime\python' -Force"
    del runtime\python.zip
    echo     Python downloaded successfully!
) else (
    echo     Python already exists, skipping.
)

:: ============ Enable pip in embeddable Python ============
echo.
echo [2/4] Setting up pip...
if not exist "runtime\python\Scripts\pip.exe" (
    :: Uncomment import site in python311._pth
    powershell -Command "(Get-Content 'runtime\python\python311._pth') -replace '#import site','import site' | Set-Content 'runtime\python\python311._pth'"
    
    :: Download get-pip.py
    powershell -Command "Invoke-WebRequest -Uri 'https://bootstrap.pypa.io/get-pip.py' -OutFile 'runtime\python\get-pip.py'"
    runtime\python\python.exe runtime\python\get-pip.py --no-warn-script-location
    echo     pip installed successfully!
) else (
    echo     pip already exists, skipping.
)

:: ============ Install Python Dependencies ============
echo.
echo [3/4] Installing Python packages (this may take a few minutes)...
runtime\python\python.exe -m pip install fastapi uvicorn motor pymongo pydantic email-validator python-dotenv python-multipart PyJWT bcrypt reportlab pillow python-jose --no-warn-script-location --quiet
echo     Python packages installed!

:: ============ Download MongoDB Portable ============
echo.
echo [4/4] Downloading MongoDB Portable...
if not exist "runtime\mongodb\bin\mongod.exe" (
    powershell -Command "Invoke-WebRequest -Uri 'https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-7.0.20-signed.msi' -OutFile 'runtime\mongodb.msi'"
    
    :: Extract MongoDB from MSI
    msiexec /a "runtime\mongodb.msi" /qb TARGETDIR="%ROOT%runtime\mongodb_temp"
    
    :: Copy bin files
    if not exist "runtime\mongodb\bin" mkdir runtime\mongodb\bin
    xcopy "runtime\mongodb_temp\MongoDB\Server\7.0\bin\mongod.exe" "runtime\mongodb\bin\" /Y >nul 2>&1
    xcopy "runtime\mongodb_temp\MongoDB\Server\7.0\bin\mongo*.exe" "runtime\mongodb\bin\" /Y >nul 2>&1
    
    :: Cleanup
    rmdir /s /q "runtime\mongodb_temp" >nul 2>&1
    del runtime\mongodb.msi >nul 2>&1
    echo     MongoDB downloaded successfully!
) else (
    echo     MongoDB already exists, skipping.
)

echo.
echo =========================================================
echo   Setup Complete!
echo =========================================================
echo.
echo   Now double-click START-SALON.bat to run the software.
echo.
pause
