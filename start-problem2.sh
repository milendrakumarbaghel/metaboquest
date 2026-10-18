#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=========================================================="
echo " Starting Problem 2: Steer Science Studio (End-to-End)"
echo "=========================================================="

# Check if ports 8080 or 5173 are already running
if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️ Port 8080 is already in use (Backend is running)."
else
    echo "🚀 Starting Spring Boot Backend on http://localhost:8080..."
    (cd "$DIR/problem2/backend" && ./mvnw spring-boot:run) &
    BACKEND_PID=$!
fi

# Wait for backend health
echo "⏳ Waiting for Backend to be healthy..."
until curl -s http://localhost:8080/actuator/health | grep -q "UP"; do
    sleep 2
done
echo "✅ Backend is healthy and accepting traffic on port 8080."

if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️ Port 5173 is already in use (Frontend is running)."
else
    echo "🚀 Starting Vite Frontend on http://localhost:5173..."
    (cd "$DIR/problem2/frontend" && npm run dev) &
    FRONTEND_PID=$!
fi

echo "=========================================================="
echo "🎉 Steer Science Studio is ready at: http://localhost:5173/"
echo "=========================================================="

cleanup() {
    echo ""
    echo "Shutting down Problem 2 services..."
    if [ -n "$BACKEND_PID" ]; then kill "$BACKEND_PID" 2>/dev/null || true; fi
    if [ -n "$FRONTEND_PID" ]; then kill "$FRONTEND_PID" 2>/dev/null || true; fi
    exit 0
}

trap cleanup INT TERM

# Keep script running
wait

