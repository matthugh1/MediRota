#!/bin/bash

echo "Setting up environment files for MediRota..."

# Backend .env
cat > backend/.env << EOF
DATABASE_URL="postgresql://medirota:medirota@localhost:5432/medirota"
PORT=8080
NODE_ENV=development
EOF

# Solver .env
cat > solver/.env << EOF
SOLVER_HOST=0.0.0.0
SOLVER_PORT=8090
EOF

# UI .env
cat > ui/.env << EOF
VITE_API_URL=http://localhost:8080
VITE_SOLVER_URL=http://localhost:8090
EOF

echo "✅ Environment files created!"
echo "📝 Review and modify the .env files as needed for your setup."
