# SSH to server
ssh your-ec2-instance

# Navigate to new instance
cd /srv/mudbase-new

# Pull latest changes
git pull

# If you changed BACKEND code:
cd backend
sudo corepack yarn install  # Only if dependencies changed
sudo corepack yarn build
sudo chown -R ubuntu:ubuntu /srv/mudbase-new
pm2 restart mudbase-new

# If you changed FRONTEND code:
cd ../frontend
sudo corepack yarn install  # Only if dependencies changed
sudo corepack yarn build
sudo chown -R ubuntu:ubuntu /srv/mudbase-new

# Verify
pm2 logs mudbase-new --lines 20
