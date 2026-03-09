@echo off
echo Starting Trading App...
echo.

REM Install backend dependencies
cd backend
echo [Install] Installing backend dependencies...
call npm install
echo [Backend] Starting server on port 5000...
start /b node server.js

REM Wait for backend to start
timeout /t 3 /nobreak

REM Install frontend dependencies
cd ..\frontend
echo [Install] Installing frontend dependencies...
call npm install
echo [Frontend] Starting app on port 3000...
call npm start
