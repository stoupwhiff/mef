FROM ghcr.io/puppeteer/puppeteer:21.0.3

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true \
    PUPPETEER_EXECUTABLE_PATH /usr/bin/chromium-browser \
    NODE_ENV production

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci
COPY . .
CMD ["node", "index.js"]