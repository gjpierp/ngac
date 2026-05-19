FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=builder /app/dist/ngac-admin-frontend/browser /usr/share/nginx/html
RUN printf 'server {\n  listen 80;\n  root /usr/share/nginx/html;\n  index index.html;\n\n  # Angular SPA — devolver index.html para todas las rutas del router\n  location / {\n    try_files $uri $uri/ /index.html;\n  }\n\n  # Deshabilitar logs de favicon\n  location = /favicon.ico { log_not_found off; access_log off; }\n}\n' > /etc/nginx/conf.d/default.conf
EXPOSE 80
