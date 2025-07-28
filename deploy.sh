#!/bin/bash
#this is just a file contains steps

set -e

#npm run build
#to start the application
#npm start

gcloud compute ssh samiksha-ai-instance --zone=us-central1-a

#Create a Directory for your React App:
sudo mkdir -p /var/www/samiksha-app
sudo chown -R $USER:$USER /var/www/samiksha-app

#install nginx
sudo apt update
sudo apt install nginx

#Start Nginx and Enable it on Boot:
sudo systemctl start nginx
sudo systemctl enable nginx



# From your LOCAL machine, in your React app's parent directory
gcloud compute scp --recurse ./dist samiksha-ai-instance:/var/www/samiksha-app --zone=us-central1-a

sudo nano /etc/nginx/sites-available/samiksha-app.conf

server {
    listen 80;
    server_name 34.63.198.88;

    # IMPORTANT: Change this line to point to the 'public' subfolder inside 'dist'
    root /var/www/samiksha-app/dist/public;
    index index.html index.htm;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to your Spring Boot backend
    location /api/ {
        proxy_pass http://localhost:8080/; # Assuming Spring Boot is on localhost:8080
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    access_log /var/log/nginx/samiksha-app_access.log;
    error_log /var/log/nginx/samiksha-app_error.log;
}

sudo nginx -t
sudo systemctl restart nginx