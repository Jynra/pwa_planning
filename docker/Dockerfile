# Dockerfile pour Planning de Travail PWA
FROM nginx:alpine

# Copie SEULEMENT la configuration nginx
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Crée les répertoires pour les volumes
RUN mkdir -p /usr/share/nginx/html/assets/css \
    && mkdir -p /usr/share/nginx/html/assets/js \
    && mkdir -p /usr/share/nginx/html/assets/icons

# Expose le port 80 (sera mappé vers un port externe)
EXPOSE 80

# Démarre nginx
CMD ["nginx", "-g", "daemon off;"]