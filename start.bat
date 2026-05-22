@echo off
echo ========================================
echo   AkShop Online - Development Startup
echo ========================================
echo.
echo Starting Django backend on port 9000...
start "Django API" cmd /k "cd backend && python manage.py runserver 9000"
echo.
echo Starting React frontend on port 5173...
start "React Dev" cmd /k "cd frontend && npm run dev"
echo.
echo ----------------------------------------
echo  Backend API:  http://localhost:9000/api/
echo  Frontend:     http://localhost:5173/
echo  Admin panel:  http://localhost:9000/admin/
echo  Admin login:  admin / admin1234
echo ----------------------------------------
echo.
echo Both servers are starting in separate windows.
pause
