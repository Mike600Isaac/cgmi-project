#!/usr/bin/env bash
# ---------------------------------------------------------------
# Ministry of the Word - dev launcher (Git Bash / Windows)
# Starts Flask backend (:5000) + Vite frontend (:5173),
# then opens the app in your default browser.
# ---------------------------------------------------------------
set -e

# Resolve project root = folder this script lives in
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"
FRONTEND_URL="http://localhost:5173"
BACKEND_URL="http://localhost:5000"

cleanup() {
  echo ""
  echo ">> Shutting down..."
  [ -n "$BACK_PID" ] && kill "$BACK_PID" 2>/dev/null || true
  [ -n "$FRONT_PID" ] && kill "$FRONT_PID" 2>/dev/null || true
  exit 0
}
trap cleanup INT TERM

# --- 1. Backend -------------------------------------------------
echo ">> Starting backend (Flask :5000)..."
cd "$BACKEND"
if [ ! -x "venv/Scripts/python.exe" ]; then
  echo "!! backend/venv not found. Run: python -m venv venv && venv/Scripts/pip install -r requirements.txt"
  exit 1
fi
venv/Scripts/python.exe run.py &
BACK_PID=$!

# --- 2. Frontend ------------------------------------------------
echo ">> Starting frontend (Vite :5173)..."
cd "$FRONTEND"
if [ ! -d "node_modules" ]; then
  echo ">> Installing frontend dependencies (first run)..."
  npm install
fi
npm run dev &
FRONT_PID=$!

# --- 3. Wait for the frontend, then open browser ----------------
echo ">> Waiting for frontend to come up..."
for i in $(seq 1 30); do
  if curl -s -o /dev/null "$FRONTEND_URL"; then
    break
  fi
  sleep 1
done

echo ">> Opening $FRONTEND_URL"
start "" "$FRONTEND_URL" 2>/dev/null || cmd //c start "" "$FRONTEND_URL"

echo ""
echo "==============================================="
echo "  Frontend : $FRONTEND_URL"
echo "  Backend  : $BACKEND_URL"
echo "  Press Ctrl+C to stop both servers."
echo "==============================================="

# Keep script alive so both servers keep running
wait
