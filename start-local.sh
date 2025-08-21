#!/bin/bash

echo "🚀 Starting MediRota Development Environment (Local)"

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Port $1 is already in use"
        return 1
    else
        return 0
    fi
}

# Function to stop Docker services if running
stop_docker_services() {
    echo "🛑 Stopping Docker services to free up ports..."
    cd deploy && docker-compose down
    cd ..
    sleep 2
}

# Check if Docker services are running and stop them
if docker-compose -f deploy/docker-compose.yml ps | grep -q "Up"; then
    echo "🐳 Docker services detected, stopping them..."
    stop_docker_services
fi

# Check ports after stopping Docker
echo "🔍 Checking ports..."
check_port 8080 || echo "❌ Port 8080 still in use. Please stop any running backend services."
check_port 8090 || echo "❌ Port 8090 still in use. Please stop any running solver services."
check_port 5173 || echo "❌ Port 5173 still in use. Please stop any running UI services."

echo "✅ All ports available"

# Start Backend (NestJS)
echo "🔧 Starting Backend..."
cd backend && npm run start:dev &
BACKEND_PID=$!

# Start Solver (Python/FastAPI)
echo "🧮 Starting Solver..."
cd ../solver && uvicorn app.main:app --reload --port 8090 &
SOLVER_PID=$!

# Wait a moment for services to start
sleep 3

# Start UI (React)
echo "🎨 Starting UI..."
cd ../ui && npm run dev &
UI_PID=$!

echo ""
echo "✅ All services started!"
echo "🔧 Backend: http://localhost:8080"
echo "🧮 Solver: http://localhost:8090"
echo "🎨 UI: http://localhost:5173"
echo "🗄️  Database: localhost:5432"
echo ""
echo "Process IDs:"
echo "  Backend: $BACKEND_PID"
echo "  Solver: $SOLVER_PID"
echo "  UI: $UI_PID"
echo ""
echo "To stop all services, run: kill $BACKEND_PID $SOLVER_PID $UI_PID"
