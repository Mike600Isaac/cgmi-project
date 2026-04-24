@echo off
echo ============================================
echo  Ministry Web App - Database Setup
echo ============================================
echo.
echo STEP 1: Make sure MySQL is running
echo STEP 2: Update backend\.env with your DB password
echo.
cd /d "%~dp0backend"

if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
)

echo Creating database tables and seeding defaults...
set FLASK_APP=run.py
python -c "from run import app; from app.extensions import db; app.app_context().__enter__(); db.create_all(); print('Tables created!')"
python -c "
from run import app, _seed_defaults
from app.extensions import db
with app.app_context():
    _seed_defaults()
    print('Default content seeded!')
"
echo.
echo Database setup complete!
echo You can now run start-backend.bat
pause
