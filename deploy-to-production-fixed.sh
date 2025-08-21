#!/bin/bash

# MediRota Production Deployment Script (Fixed)
# This script will SSH into your VPS and deploy the latest version with fixes

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

VPS_HOST="srv965201.hstgr.cloud"
VPS_USER="root"

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_status "Starting production deployment to $VPS_HOST..."

# Check if we can connect to the VPS
print_status "Testing SSH connection..."
if ! ssh -o ConnectTimeout=10 -o BatchMode=yes $VPS_USER@$VPS_HOST exit 2>/dev/null; then
    print_error "Cannot connect to VPS. Please check your SSH connection."
    print_warning "Make sure you have SSH access to $VPS_USER@$VPS_HOST"
    exit 1
fi

print_success "SSH connection successful"

# Deploy commands
print_status "Deploying to production with fixes..."

ssh $VPS_USER@$VPS_HOST << 'EOF'
set -e

echo "🔄 Updating code from Git..."
cd /opt/MediRota
git pull origin master

echo "🔧 Updating production environment file..."
cd deploy
cat > .env.production << 'ENVEOF'
# Database Configuration
POSTGRES_PASSWORD=medirota123

# JWT Configuration
JWT_SECRET=7a0422b4a6e23c4195faca9e41552415d89b32fd42515f62d9a68ef6f773bff2

# API URLs (update with your VPS domain/IP)
VITE_API_URL=http://srv965201.hstgr.cloud/api
VITE_SOLVER_URL=http://srv965201.hstgr.cloud/solve

# Environment
NODE_ENV=production
ENVEOF

echo "🚀 Restarting services..."
./deploy.sh restart

echo "⏳ Waiting for services to be ready..."
sleep 15

echo "📊 Checking deployment status..."
./deploy.sh status

echo "🏥 Running database migrations..."
docker exec -it medirota-backend npx prisma migrate deploy

echo "🌱 Running database seed (with fixed script)..."
docker exec -it medirota-backend npx prisma db seed

echo "✅ Checking health..."
./deploy.sh health

echo "🎉 Deployment completed successfully!"
echo "🌐 Your application is available at: http://srv965201.hstgr.cloud"
echo "🔍 API Health: http://srv965201.hstgr.cloud/health"
echo "🧮 Solver Health: http://srv965201.hstgr.cloud/solve/healthz"
EOF

print_success "Production deployment completed!"
print_status "Your MediRota application is now live at: http://srv965201.hstgr.cloud"
