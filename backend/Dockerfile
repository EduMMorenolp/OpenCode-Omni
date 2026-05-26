FROM node:22-alpine

RUN apk add --no-cache tzdata

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY src ./src

EXPOSE 3000

CMD ["node", "src/index.js"]
