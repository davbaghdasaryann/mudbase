# mongodump -v --host 3.131.168.134 --port 27017 --db mudbase

mongodump -v --host 3.75.127.170 --port 27017 --db mudbase \
  --username admin\
  --authenticationDatabase admin --authenticationMechanism SCRAM-SHA-256 \
  --out /home/andrei/srv/mudbase/backup

