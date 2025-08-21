#!/bin/bash

echo "🚀 Starting MediRota Development Environment..."

# Start database and backend services
echo "📦 Starting Docker services..."
cd deploy && docker-compose up -d postgres backend solver

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
sleep 5

# Start UI in development mode
echo "🎨 Starting UI development server..."
cd ../ui && npm run dev

echo "✅ All services started!"
echo "🌐 UI: http://localhost:5173"
echo "🔧 Backend: http://localhost:8080"
echo "🧮 Solver: http://localhost:8090"
echo "🗄️  Database: localhost:5432"
