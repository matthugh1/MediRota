#!/bin/bash

# MediRota Production Deployment Script for Hostinger VPS
# Usage: ./deploy.sh [start|stop|restart|logs|status|update]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"
PROJECT_NAME="medirota"

# Function to print colored output
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

# Function to check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_warning "Docker Compose is not installed. Installing Docker Compose..."
        curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
        print_success "Docker Compose installed"
    fi
    
    # Start Docker if not running
    if ! systemctl is-active --quiet docker; then
        print_status "Starting Docker service..."
        systemctl start docker
        systemctl enable docker
    fi
    
    print_success "Docker and Docker Compose are ready"
}

# Function to check if .env file exists
check_env_file() {
    if [ ! -f "$ENV_FILE" ]; then
        print_warning "Environment file $ENV_FILE not found. Creating from example..."
        if [ -f "env.production.example" ]; then
            cp env.production.example "$ENV_FILE"
            print_warning "Please edit $ENV_FILE with your actual configuration values"
            print_warning "Then run this script again"
            exit 1
        else
            print_error "No environment file found. Please create $ENV_FILE"
            exit 1
        fi
    fi
}

# Function to create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    mkdir -p logs/{backend,solver,nginx}
    mkdir -p nginx/ssl
    print_success "Directories created"
}

# Function to start services
start_services() {
    print_status "Starting MediRota services..."
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d
    print_success "Services started successfully"
    
    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 10
    
    # Check service health
    check_health
}

# Function to stop services
stop_services() {
    print_status "Stopping MediRota services..."
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down
    print_success "Services stopped successfully"
}

# Function to restart services
restart_services() {
    print_status "Restarting MediRota services..."
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" restart
    print_success "Services restarted successfully"
}

# Function to show logs
show_logs() {
    print_status "Showing logs for all services..."
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" logs -f
}

# Function to show status
show_status() {
    print_status "Service status:"
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps
    
    echo ""
    print_status "Resource usage:"
    docker stats --no-stream
}

# Function to check health
check_health() {
    print_status "Checking service health..."
    
    # Check if containers are running
    if docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps | grep -q "Up"; then
        print_success "All containers are running"
    else
        print_error "Some containers are not running"
        docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps
        exit 1
    fi
    
    # Check API health
    if curl -f http://localhost/health > /dev/null 2>&1; then
        print_success "Nginx health check passed"
    else
        print_warning "Nginx health check failed"
    fi
    
    # Check backend health
    if curl -f http://localhost/api/healthz > /dev/null 2>&1; then
        print_success "Backend API health check passed"
    else
        print_warning "Backend API health check failed"
    fi
}

# Function to update services
update_services() {
    print_status "Updating MediRota services..."
    
    # Pull latest changes
    git pull origin master
    
    # Rebuild and restart services
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build --no-cache
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d
    
    print_success "Services updated successfully"
    
    # Check health after update
    sleep 10
    check_health
}

# Function to show help
show_help() {
    echo "MediRota Production Deployment Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start     Start all services"
    echo "  stop      Stop all services"
    echo "  restart   Restart all services"
    echo "  logs      Show logs for all services"
    echo "  status    Show service status and resource usage"
    echo "  update    Update services with latest code"
    echo "  health    Check service health"
    echo "  help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start"
    echo "  $0 status"
    echo "  $0 logs"
}

# Main script logic
case "${1:-help}" in
    start)
        check_docker
        check_env_file
        create_directories
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    logs)
        show_logs
        ;;
    status)
        show_status
        ;;
    health)
        check_health
        ;;
    update)
        check_docker
        check_env_file
        update_services
        ;;
    help|*)
        show_help
        ;;
esac
