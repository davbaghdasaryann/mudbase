# Quick Deployment Checklist for new.mudbase.am

## 1. Pre-deployment (Local)
- [x] Update backend config loader to support CONFIG_FILE env var
- [x] Create `config-new-mudbase.yaml` with port 7788
- [x] Create `ecosystem-multi.config.yaml` for PM2
- [x] Create nginx config for new.mudbase.am
- [ ] Test locally with `export CONFIG_FILE=config-new-mudbase.yaml && npm start`
- [ ] Commit and push changes

## 2. Server Setup
```bash
# DNS: Point new.mudbase.am to EC2 IP
# Then on server:
sudo mkdir -p /srv/mudbase-new/{backend,frontend}
sudo chown -R $USER:$USER /srv/mudbase-new
```

## 3. SSL Certificate
```bash
sudo certbot certonly --nginx -d new.mudbase.am -d www.new.mudbase.am
```

## 4. Deploy Code
```bash
cd /srv/mudbase-new
git clone <repo> .
# OR
sudo rsync -av --exclude 'node_modules' --exclude 'build' /srv/mudbase/ /srv/mudbase-new/

# Build
cd backend && npm install && npm run build
cd ../frontend && npm install && npm run build
```

## 5. Create & Copy Configs
```bash
# LOCALLY: Create config from template (not in git)
cp backend/config/config-new-mudbase-template.yaml backend/config/config-new-mudbase.yaml
# Edit config-new-mudbase.yaml and fill in all <> placeholders with actual secrets

# Copy to server:
scp backend/config/config-new-mudbase.yaml user@ec2:/srv/mudbase-new/backend/config/
scp backend/ecosystem-multi.config.yaml user@ec2:/srv/mudbase/backend/
scp doc/nginx/new.mudbase.conf user@ec2:/tmp/
```

## 6. Configure Nginx
```bash
sudo mv /tmp/new.mudbase.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/new.mudbase.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

## 7. Start PM2
```bash
cd /srv/mudbase/backend
pm2 stop all && pm2 delete all
pm2 start ecosystem-multi.config.yaml
pm2 save
```

## 8. Verify
```bash
pm2 status
curl http://localhost:7787/api/v1/ping  # Production
curl http://localhost:7788/api/v1/ping  # New
```

**Visit:**
- https://mudbase.am (production)
- https://new.mudbase.am (new)

## Key Changes Made

1. **Backend Config Loader** ([backend/src/config.ts:59](backend/src/config.ts#L59))
   - Now reads `CONFIG_FILE` env var
   - Falls back to `config-mudbase.yaml`

2. **New Config Template** ([backend/config/config-new-mudbase-template.yaml](backend/config/config-new-mudbase-template.yaml))
   - Port: 7788
   - Frontend URL: https://new.mudbase.am
   - Separate logs/static directories

3. **PM2 Config** ([backend/ecosystem-multi.config.yaml](backend/ecosystem-multi.config.yaml))
   - Two apps: `mudbase-prod` and `mudbase-new`
   - Different ports and config files

4. **Nginx Config** ([doc/nginx/new.mudbase.conf](doc/nginx/new.mudbase.conf))
   - Serves from `/srv/mudbase-new/frontend/build`
   - Proxies to backend on port 7788

## Rollback Plan

```bash
pm2 stop mudbase-new && pm2 delete mudbase-new
sudo rm /etc/nginx/sites-enabled/new.mudbase.conf
sudo systemctl reload nginx
pm2 restart mudbase-prod
```
