FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy website files
COPY . /usr/share/nginx/html

# Remove unnecessary files from deployment
RUN rm -f /usr/share/nginx/html/Dockerfile \
  /usr/share/nginx/html/docker-compose.yml \
  /usr/share/nginx/html/.gitignore \
  /usr/share/nginx/html/README.md

# Set permissions
RUN chmod -R 755 /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
