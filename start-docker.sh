#!/bin/bash

echo "🚀 Starting MediRota Docker Services..."

# Navigate to deploy directory and start all services
cd deploy && docker-compose up -d

echo "✅ All Docker services started!"
echo "🔧 Backend: http://localhost:8080"
echo "🧮 Solver: http://localhost:8090"
echo "🗄️  Database: localhost:5432"
echo ""
echo "To start the UI, run: cd ui && npm run dev"
