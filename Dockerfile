FROM ghcr.io/puppeteer/puppeteer:21.0.3

ENV NODE_ENV production

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci

COPY . .
CMD ["node", "index.js"]