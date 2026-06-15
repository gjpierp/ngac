FROM node:18.17.0-alpine

# Definir directorio de trabajo
WORKDIR /usr/src/app

# Instalar dependencias necesarias para oracledb en Alpine, Python 3, netcat y pandas
RUN apk update && \
    apk add --no-cache libaio gcompat python3 py3-pip netcat-openbsd && \
    pip3 install --no-cache-dir pandas openpyxl && \
    rm -rf /var/cache/apk/*

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar las dependencias (producción y desarrollo para tsc)
RUN npm install

# Copiar el resto del código
COPY . .

# Copiar scripts de carga y entrypoint
COPY scripts/ ./scripts/
COPY entrypoint.sh ./entrypoint.sh

# Dar permisos de ejecución al entrypoint
RUN chmod +x ./entrypoint.sh

# Compilar TypeScript
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3200

# Puerto expuesto
EXPOSE 3200

# Comando para iniciar la aplicación usando el entrypoint
CMD ["./entrypoint.sh"]
