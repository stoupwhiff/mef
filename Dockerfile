FROM ghcr.io/puppeteer/puppeteer:21.0.3

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true \
    PUPPETEER_EXECUTABLE_PATH /usr/bin/google-chrome-stable

WORKDIR /

COPY package.json yarn.lock ./

RUN npm ci
COPY . .
CMD ["node", "index.js"]