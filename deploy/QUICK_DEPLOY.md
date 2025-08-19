# 🚀 Quick Deployment Checklist for Hostinger VPS

Since Docker is already installed on your Hostinger VPS, here's the streamlined deployment process:

## ✅ Pre-Flight Checklist

- [ ] VPS is running and accessible via SSH
- [ ] You have your VPS IP address or domain name
- [ ] You have SSH access to the VPS

## 🎯 Quick Deployment Steps

### 1. Connect to Your VPS
```bash
ssh root@your-vps-ip
```

### 2. Update System & Install Git
```bash
# Update system
apt update && apt upgrade -y

# Install Git (if not already installed)
apt install git -y
```

### 3. Clone and Deploy
```bash
# Clone the repository
cd /opt
git clone https://github.com/matthugh1/MediRota.git
cd MediRota/deploy

# Configure environment
cp env.production.example .env.production
nano .env.production  # Edit with your settings

# Deploy!
chmod +x deploy.sh
./deploy.sh start
```

### 4. Configure Firewall
```bash
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
```

### 5. Set Up Database
```bash
# Run migrations and seed data
docker exec -it medirota-backend npx prisma migrate deploy
docker exec -it medirota-backend npx prisma db seed
```

## 🔧 Environment Configuration

Edit `.env.production` with these values:

```bash
# Database Configuration
POSTGRES_PASSWORD=your_secure_password_here

# JWT Configuration
JWT_SECRET=your_very_long_random_secret_at_least_32_chars

# API URLs (update with your VPS IP or domain)
VITE_API_URL=http://your-vps-ip-or-domain.com/api
VITE_SOLVER_URL=http://your-vps-ip-or-domain.com/solve

# Environment
NODE_ENV=production
```

## 🎉 Access Your Application

Once deployed, access your application at:
- **Frontend**: `http://your-vps-ip-or-domain.com`
- **API Health**: `http://your-vps-ip-or-domain.com/health`

## 📋 Useful Commands

```bash
# Check status
./deploy.sh status

# View logs
./deploy.sh logs

# Restart services
./deploy.sh restart

# Update application
./deploy.sh update

# Health check
./deploy.sh health
```

## 🔍 Troubleshooting

If you encounter issues:

1. **Check Docker status**: `systemctl status docker`
2. **View service logs**: `./deploy.sh logs`
3. **Check container status**: `docker ps`
4. **Verify ports**: `netstat -tlnp | grep :80`

## 🎯 That's It!

Your MediRota application should now be running on your Hostinger VPS! 🏥📅
