FROM node:22-alpine

RUN apk add --no-cache tzdata

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY src ./src

EXPOSE 3021

CMD ["node", "src/index.js"]
