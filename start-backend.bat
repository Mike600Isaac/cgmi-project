@echo off
echo ============================================
echo  Ministry Web App - Starting Backend API
echo ============================================
cd /d "%~dp0backend"

REM Activate virtual environment if it exists
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
)

echo Starting Flask development server on http://localhost:5000
echo Press Ctrl+C to stop
python run.py
pause
