@echo off
REM SamayGen Setup Script for Windows
echo 🚀 Setting up SamayGen - Academic Timetable Generator
echo ==================================================

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed. Please install Python 3.8 or higher.
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js 16 or higher.
    pause
    exit /b 1
)

echo ✅ Prerequisites check passed!

REM Setup Backend
echo.
echo 📦 Setting up backend...
cd backend

if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Installing Python dependencies...
pip install -r requirements.txt

echo ✅ Backend setup complete!

REM Setup Frontend
echo.
echo 📦 Setting up frontend...
cd ../frontend

echo Installing Node.js dependencies...
npm install

echo ✅ Frontend setup complete!

echo.
echo 🎉 Setup complete! You can now run SamayGen:
echo.
echo Backend (Terminal 1):
echo   cd backend && venv\Scripts\activate.bat && python -m app.main
echo.
echo Frontend (Terminal 2):
echo   cd frontend && ng serve
echo.
echo 🌐 Access the application at: http://localhost:4200
echo 📚 API documentation available at: http://localhost:8000/docs
echo.
pause
