FROM node:18.17.0-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --omit=dev

COPY index.js .

EXPOSE 8080

CMD ["node", "index.js"]
