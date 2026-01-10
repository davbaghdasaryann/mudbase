sudo systemctl stop nginx
sudo certbot certonly --standalone -d mudbase.am -d www.mudbase.am
sudo systemctl start nginx


