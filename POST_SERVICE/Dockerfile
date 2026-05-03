FROM node:18-alpine

WORKDIR /usr/local/app

COPY package*.json ./

RUN npm ci

COPY src ./src

COPY tsconfig.json .

RUN npm run build

EXPOSE 3003

CMD [ "node","dist/server.js" ]