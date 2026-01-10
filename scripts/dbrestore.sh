
mongorestore -v --host 3.75.127.170 --port 27017 --db mudbase \
  --username admin \
  --authenticationDatabase admin --authenticationMechanism SCRAM-SHA-256 \
  /home/andrei/srv/mudbase/backup/mudbase

