FROM node:18.17.0-alpine

# Definir directorio de trabajo
WORKDIR /usr/src/app

# Instalar dependencias necesarias para oracledb en Alpine
RUN apk update && \
    apk add --no-cache libaio && \
    apk add --no-cache gcompat

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar las dependencias (producción y desarrollo para tsc)
RUN npm install

# Copiar el resto del código
COPY . .

# Compilar TypeScript
RUN npm run build

# Puerto expuesto
EXPOSE 3200

# Comando para iniciar la aplicación desde la carpeta de distribución
CMD ["npm", "start"]
