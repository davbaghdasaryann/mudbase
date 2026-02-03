# Multi-Domain Deployment Guide

This guide explains how to run both mudbase.am (production) and new.mudbase.am on the same AWS EC2 instance.

## Architecture Overview

**Production (mudbase.am):**
- Backend: Port 7787 → nginx proxy on port 8007
- Frontend: `/srv/mudbase/frontend/build`
- Config: `config-mudbase.yaml`
- PM2 app: `mudbase-prod`

**New Domain (new.mudbase.am):**
- Backend: Port 7788 → nginx proxy
- Frontend: `/srv/mudbase-new/frontend/build`
- Config: `config-new-mudbase.yaml`
- PM2 app: `mudbase-new`

## Prerequisites

1. DNS A record for `new.mudbase.am` pointing to your EC2 instance IP
2. SSL certificate for `new.mudbase.am` (see SSL Setup section below)
3. Backend and frontend code changes committed and ready to deploy

## Deployment Steps

### 1. Update Backend Config Loader (Already Done Locally)

The backend [config.ts](backend/src/config.ts:59) now supports the `CONFIG_FILE` environment variable:

```typescript
configFile = process.env.CONFIG_FILE || 'config-mudbase.yaml';
```

### 2. Prepare Server Directories

SSH into your EC2 instance:

```bash
ssh your-ec2-instance

# Create new deployment directory
sudo mkdir -p /srv/mudbase-new/backend
sudo mkdir -p /srv/mudbase-new/frontend
sudo chown -R $USER:$USER /srv/mudbase-new
```

### 3. Deploy Code

**Option A: Clone from repository (recommended)**

```bash
# If you have changes in a branch
cd /srv/mudbase-new
git clone <your-repo-url> .
git checkout <your-branch>

# Install dependencies
cd backend
npm install
npm run build

cd ../frontend
npm install
npm run build
```

**Option B: Copy from existing deployment**

```bash
# Copy from production and update
sudo rsync -av --exclude 'node_modules' --exclude 'build' /srv/mudbase/ /srv/mudbase-new/
cd /srv/mudbase-new/backend
npm install
npm run build

cd /srv/mudbase-new/frontend
npm install
npm run build
```

### 4. Create Config Files on Server

**IMPORTANT:** Config files with secrets are NOT in git (only templates are tracked).

On your **local machine**, create the config file with actual secrets:

```bash
# Copy from template
cp backend/config/config-new-mudbase-template.yaml backend/config/config-new-mudbase.yaml

# Edit and fill in all <> placeholders with actual values:
# - Database credentials
# - Auth secret
# - Email/Mailgun settings
# - Any other secrets
```

Then copy to server:

```bash
# From your local machine
scp backend/config/config-new-mudbase.yaml your-ec2:/srv/mudbase-new/backend/config/
scp backend/ecosystem-multi.config.yaml your-ec2:/srv/mudbase/backend/
```

**Or create directly on server:**

```bash
# SSH into server
ssh your-ec2-instance

# Create from template
cd /srv/mudbase-new/backend/config
cp config-new-mudbase-template.yaml config-new-mudbase.yaml

# Edit with actual secrets
nano config-new-mudbase.yaml
# Fill in all <> placeholders
```

### 5. SSL Certificate Setup

```bash
# SSH into server
ssh your-ec2-instance

# Install certbot if not already installed
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Generate SSL certificate for new.mudbase.am
sudo certbot certonly --nginx -d new.mudbase.am -d www.new.mudbase.am

# Certificates will be created at:
# /etc/letsencrypt/live/new.mudbase.am/fullchain.pem
# /etc/letsencrypt/live/new.mudbase.am/privkey.pem
```

### 6. Configure Nginx

```bash
# Copy the new nginx config
sudo cp /srv/mudbase-new/doc/nginx/new.mudbase.conf /etc/nginx/sites-available/

# Create symlink to enable the site
sudo ln -s /etc/nginx/sites-available/new.mudbase.conf /etc/nginx/sites-enabled/

# Test nginx configuration
sudo nginx -t

# If test passes, reload nginx
sudo systemctl reload nginx
```

### 7. Update PM2 Configuration

```bash
cd /srv/mudbase/backend

# Stop current PM2 processes
pm2 stop all

# Delete old configuration
pm2 delete all

# Start both instances with new config
pm2 start ecosystem-multi.config.yaml

# Save PM2 configuration
pm2 save

# Ensure PM2 starts on server reboot
pm2 startup
# Follow the command it outputs
```

### 8. Verify Deployment

**Check PM2 processes:**
```bash
pm2 status
# You should see:
# mudbase-prod - port 7787
# mudbase-new  - port 7788

pm2 logs mudbase-new
```

**Check backend responses:**
```bash
# Test production backend
curl http://localhost:7787/api/v1/ping

# Test new backend
curl http://localhost:7788/api/v1/ping
```

**Check websites:**
- Production: https://mudbase.am
- New: https://new.mudbase.am

### 9. Monitor Logs

```bash
# View all logs
pm2 logs

# View specific app logs
pm2 logs mudbase-prod
pm2 logs mudbase-new

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

## Configuration Differences

### Backend Ports
- Production: 7787
- New: 7788

### Frontend URLs
- Production: https://mudbase.am
- New: https://new.mudbase.am

### Log Directories
- Production: `/srv/mudbase/backend/logs`
- New: `/srv/mudbase-new/backend/logs-new`

### Static Files
- Production: `/srv/mudbase/backend/static`
- New: `/srv/mudbase-new/backend/static-new`

## Shared Resources

Both instances share:
- Same MongoDB database (same host/port/credentials)
- Same MySQL session database (same host/port/credentials)
- Same email configuration (Mailgun)

**IMPORTANT:** If you want separate databases for testing, update the `db` and `auth.sessdb` sections in your config file.

**SECURITY NOTE:**
- Config files with actual secrets (`config-mudbase.yaml`, `config-new-mudbase.yaml`) are in `.gitignore`
- Only template files (`*-template.yaml`) are tracked in git
- Never commit files with actual API keys, passwords, or secrets

## Troubleshooting

### Port Already in Use
```bash
# Check what's using port 7788
sudo lsof -i :7788

# Kill process if needed
sudo kill -9 <PID>
```

### PM2 Process Won't Start
```bash
# Check logs
pm2 logs mudbase-new --lines 100

# Common issues:
# - Config file not found: Check CONFIG_FILE env var
# - Port in use: Change port in config
# - Database connection: Verify credentials
```

### Nginx 502 Bad Gateway
```bash
# Check if backend is running
pm2 status
curl http://localhost:7788/api/v1/ping

# Check nginx config
sudo nginx -t

# Check nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### SSL Certificate Issues
```bash
# Renew certificates
sudo certbot renew

# Test renewal
sudo certbot renew --dry-run
```

## Rolling Back

If you need to roll back:

```bash
# Stop the new instance
pm2 stop mudbase-new
pm2 delete mudbase-new

# Disable nginx site
sudo rm /etc/nginx/sites-enabled/new.mudbase.conf
sudo systemctl reload nginx

# Keep production running
pm2 restart mudbase-prod
```

## Updating Production Config

If you need to use the old single-instance config:

```bash
cd /srv/mudbase/backend
pm2 stop all
pm2 delete all
pm2 start ecosystem.config.yaml  # Original config
pm2 save
```

## Environment Variables Reference

### mudbase-prod
- `NODE_ENV=production`
- `NEXTAUTH_URL=https://mudbase.am`
- `CONFIG_FILE=config-mudbase.yaml`

### mudbase-new
- `NODE_ENV=production`
- `NEXTAUTH_URL=https://new.mudbase.am`
- `CONFIG_FILE=config-new-mudbase.yaml`

## Local Development

To test the new config locally:

```bash
cd backend
export CONFIG_FILE=config-new-mudbase.yaml
npm start
```

## Notes

1. Both instances use the same codebase but different ports and configs
2. Frontend builds are separate to allow different versions if needed
3. Consider using separate databases for new.mudbase.am if you're testing major changes
4. Monitor resource usage (CPU, memory) when running both instances
5. Set up monitoring/alerting for both domains
