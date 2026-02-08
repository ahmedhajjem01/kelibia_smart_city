@echo off
echo Starting Kelibia Smart City Environment...

:: Start Backend
start "Kelibia Backend" cmd /k ".\.venv\Scripts\activate && python manage.py runserver"

:: Start Frontend
start "Kelibia Frontend" cmd /k "python run_frontend.py"

echo.
echo ==================================================
echo   Servers running!
echo   Backend API: http://127.0.0.1:8000
echo   Frontend UI: http://localhost:5500/index.html
echo ==================================================
echo.
pause
