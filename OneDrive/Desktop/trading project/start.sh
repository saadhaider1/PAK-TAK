#!/bin/bash

echo "Starting Trading App..."
echo ""

# Start backend
cd backend
echo "[Install] Installing backend dependencies..."
npm install
echo "[Backend] Starting server on port 5000..."
node server.js &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend
cd ../frontend
echo "[Install] Installing frontend dependencies..."
npm install
echo "[Frontend] Starting app on port 3000..."
npm start
