# MediRota Production Deployment Guide

This guide will help you deploy MediRota to your Hostinger VPS for production use.

## Prerequisites

- Hostinger VPS with Ubuntu 20.04+ or CentOS 8+
- SSH access to your VPS
- Domain name (optional but recommended)
- Basic knowledge of Linux command line

## Step 1: Set Up Your VPS

### 1.1 Connect to Your VPS
```bash
ssh root@your-vps-ip
```

### 1.2 Update System
```bash
# Ubuntu/Debian
apt update && apt upgrade -y

# CentOS/RHEL
yum update -y
```

### 1.3 Install Docker and Docker Compose
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Start and enable Docker
systemctl start docker
systemctl enable docker

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

### 1.4 Install Git
```bash
# Ubuntu/Debian
apt install git -y

# CentOS/RHEL
yum install git -y
```

## Step 2: Clone and Configure MediRota

### 2.1 Clone the Repository
```bash
cd /opt
git clone https://github.com/matthugh1/MediRota.git
cd MediRota/deploy
```

### 2.2 Configure Environment Variables
```bash
# Copy the example environment file
cp env.production.example .env.production

# Edit the environment file with your settings
nano .env.production
```

**Important**: Update these values in `.env.production`:

```bash
# Database Configuration
POSTGRES_PASSWORD=your_very_secure_database_password

# JWT Configuration  
JWT_SECRET=your_very_long_random_jwt_secret_at_least_32_characters

# API URLs (update with your VPS IP or domain)
VITE_API_URL=http://your-vps-ip-or-domain.com/api
VITE_SOLVER_URL=http://your-vps-ip-or-domain.com/solve

# Environment
NODE_ENV=production
```

### 2.3 Make Deployment Script Executable
```bash
chmod +x deploy.sh
```

## Step 3: Deploy MediRota

### 3.1 Start Services
```bash
./deploy.sh start
```

This will:
- Check Docker installation
- Create necessary directories
- Build and start all containers
- Perform health checks

### 3.2 Check Service Status
```bash
./deploy.sh status
```

### 3.3 View Logs
```bash
./deploy.sh logs
```

## Step 4: Configure Firewall

### 4.1 Open Required Ports
```bash
# Ubuntu/Debian (UFW)
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable

# CentOS/RHEL (firewalld)
firewall-cmd --permanent --add-port=22/tcp
firewall-cmd --permanent --add-port=80/tcp
firewall-cmd --permanent --add-port=443/tcp
firewall-cmd --reload
```

## Step 5: Set Up Domain (Optional)

### 5.1 Configure DNS
Point your domain to your VPS IP address:
- A record: `yourdomain.com` → `your-vps-ip`
- A record: `www.yourdomain.com` → `your-vps-ip`

### 5.2 Update Environment Variables
Update the API URLs in `.env.production`:
```bash
VITE_API_URL=http://yourdomain.com/api
VITE_SOLVER_URL=http://yourdomain.com/solve
```

### 5.3 Restart Services
```bash
./deploy.sh restart
```

## Step 6: SSL Certificate (Recommended)

### 6.1 Install Certbot
```bash
# Ubuntu/Debian
apt install certbot -y

# CentOS/RHEL
yum install certbot -y
```

### 6.2 Obtain SSL Certificate
```bash
certbot certonly --standalone -d yourdomain.com
```

### 6.3 Configure Nginx for HTTPS
Update the Nginx configuration to include SSL:
```bash
# Copy SSL certificates
cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem deploy/nginx/ssl/
cp /etc/letsencrypt/live/yourdomain.com/privkey.pem deploy/nginx/ssl/

# Restart services
./deploy.sh restart
```

## Step 7: Database Setup

### 7.1 Run Database Migrations
```bash
# Access the backend container
docker exec -it medirota-backend bash

# Run migrations
npx prisma migrate deploy

# Seed the database
npx prisma db seed

# Exit container
exit
```

### 7.2 Verify Database
```bash
# Check database connection
docker exec -it medirota-backend npx prisma studio --port 5555
```

## Step 8: Monitoring and Maintenance

### 8.1 Health Checks
```bash
# Check service health
./deploy.sh health

# Monitor resource usage
./deploy.sh status
```

### 8.2 Log Monitoring
```bash
# View real-time logs
./deploy.sh logs

# View specific service logs
docker logs medirota-backend -f
docker logs medirota-solver -f
docker logs medirota-ui -f
```

### 8.3 Backup Database
```bash
# Create backup script
cat > /opt/MediRota/deploy/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

docker exec medirota-postgres pg_dump -U medirota_user medirota > $BACKUP_DIR/medirota_$DATE.sql
gzip $BACKUP_DIR/medirota_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "medirota_*.sql.gz" -mtime +7 -delete

echo "Backup completed: medirota_$DATE.sql.gz"
EOF

chmod +x /opt/MediRota/deploy/backup.sh

# Add to crontab for daily backups
echo "0 2 * * * /opt/MediRota/deploy/backup.sh" | crontab -
```

## Step 9: Updates and Maintenance

### 9.1 Update Application
```bash
# Pull latest changes
cd /opt/MediRota
git pull origin master

# Update services
cd deploy
./deploy.sh update
```

### 9.2 Restart Services
```bash
./deploy.sh restart
```

### 9.3 Rollback (if needed)
```bash
# Stop services
./deploy.sh stop

# Checkout previous version
git checkout HEAD~1

# Restart services
./deploy.sh start
```

## Troubleshooting

### Common Issues

1. **Services not starting**
   ```bash
   # Check Docker status
   systemctl status docker
   
   # Check container logs
   docker logs medirota-backend
   docker logs medirota-solver
   docker logs medirota-ui
   ```

2. **Database connection issues**
   ```bash
   # Check database container
   docker exec -it medirota-postgres psql -U medirota_user -d medirota
   
   # Check database logs
   docker logs medirota-postgres
   ```

3. **Port conflicts**
   ```bash
   # Check what's using port 80
   netstat -tlnp | grep :80
   
   # Stop conflicting services
   systemctl stop apache2  # if Apache is running
   systemctl stop nginx    # if Nginx is running
   ```

4. **Memory issues**
   ```bash
   # Check system resources
   free -h
   df -h
   
   # Check container resource usage
   docker stats
   ```

### Performance Optimization

1. **Increase Docker memory limit** (if needed)
2. **Configure swap space** for low-memory VPS
3. **Optimize PostgreSQL settings** for your VPS specs
4. **Enable Docker build cache** for faster deployments

## Security Considerations

1. **Change default passwords** in `.env.production`
2. **Use strong JWT secrets** (at least 32 characters)
3. **Regular security updates** for the VPS
4. **Firewall configuration** to limit access
5. **SSL certificates** for HTTPS
6. **Regular backups** of database and configuration

## Support

If you encounter issues:
1. Check the logs: `./deploy.sh logs`
2. Verify configuration: `./deploy.sh health`
3. Check system resources: `./deploy.sh status`
4. Review this guide for common solutions

## Access Your Application

Once deployed, you can access:
- **Frontend UI**: `http://your-vps-ip-or-domain.com`
- **Backend API**: `http://your-vps-ip-or-domain.com/api`
- **Solver API**: `http://your-vps-ip-or-domain.com/solve`
- **Health Check**: `http://your-vps-ip-or-domain.com/health`

Congratulations! Your MediRota application is now running in production! 🎉
