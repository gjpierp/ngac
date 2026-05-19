FROM node:20-slim

WORKDIR /usr/src/app

# Instalar dependencias (oracledb v6+ usa modo Thin por defecto,
# no requiere Oracle Instant Client instalado en el sistema)
COPY package*.json ./
RUN npm install --omit=dev

# Copiar el código fuente
COPY index.js .
COPY src/ ./src/

EXPOSE 3100

CMD ["node", "index.js"]
