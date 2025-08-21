#!/bin/bash

# MediRota Deployment Fix Script
# This script will diagnose and fix the Docker networking issue

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

print_status "🔍 Diagnosing MediRota deployment issues..."

# Check if we're in the right directory
if [ ! -f "docker-compose.prod.yml" ]; then
    print_error "Please run this script from the /opt/MediRota/deploy directory"
    exit 1
fi

# Check Docker network
print_status "Checking Docker network..."
docker network ls | grep medirota || print_warning "MediRota network not found"

# Check if containers are running
print_status "Checking container status..."
docker ps | grep medirota || print_warning "No MediRota containers running"

# Check backend container
print_status "Checking backend container..."
if docker ps | grep -q medirota-backend; then
    print_success "Backend container is running"
    
    # Check if backend is accessible internally
    print_status "Testing backend health endpoint..."
    if docker exec medirota-backend curl -f http://localhost:3000/healthz > /dev/null 2>&1; then
        print_success "Backend health endpoint is working"
    else
        print_error "Backend health endpoint is not responding"
    fi
else
    print_error "Backend container is not running"
fi

# Check nginx container
print_status "Checking nginx container..."
if docker ps | grep -q medirota-nginx; then
    print_success "Nginx container is running"
    
    # Check if nginx can reach backend
    print_status "Testing nginx to backend connectivity..."
    if docker exec medirota-nginx ping -c 1 backend > /dev/null 2>&1; then
        print_success "Nginx can reach backend"
    else
        print_error "Nginx cannot reach backend - this is the problem!"
    fi
else
    print_error "Nginx container is not running"
fi

# Check environment file
print_status "Checking environment file..."
if [ -f ".env.production" ]; then
    print_success "Environment file exists"
    if grep -q "POSTGRES_PASSWORD" .env.production; then
        print_success "POSTGRES_PASSWORD is set"
    else
        print_warning "POSTGRES_PASSWORD is not set"
    fi
else
    print_error "Environment file missing"
fi

print_status "🔧 Attempting to fix networking issues..."

# Stop all services
print_status "Stopping all services..."
docker-compose -f docker-compose.prod.yml --env-file .env.production down

# Remove any existing network
print_status "Cleaning up Docker network..."
docker network rm deploy_medirota-network 2>/dev/null || true

# Start services fresh
print_status "Starting services with fresh network..."
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 20

# Test connectivity
print_status "Testing connectivity..."
if docker exec medirota-nginx ping -c 1 backend > /dev/null 2>&1; then
    print_success "Nginx can now reach backend!"
else
    print_error "Nginx still cannot reach backend"
fi

# Test health endpoints
print_status "Testing health endpoints..."
if curl -f http://localhost/health > /dev/null 2>&1; then
    print_success "Nginx health check passed"
else
    print_warning "Nginx health check failed"
fi

if curl -f http://localhost/api/healthz > /dev/null 2>&1; then
    print_success "Backend health check passed"
else
    print_warning "Backend health check failed"
fi

print_status "🎉 Fix attempt completed!"
print_status "Your application should be accessible at: http://srv965201.hstgr.cloud"
