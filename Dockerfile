FROM ghcr.io/puppeteer/puppeteer:21.0.3

ENV NODE_ENV production

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci

# Install necessary dependencies for Puppeteer
# RUN apt-get update \
#    && apt-get install -y wget gnupg \
#    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
#    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
#    && apt-get update \
#    && apt-get install -y google-chrome-stable libxss1 \
#    libx11-xcb1 \
#    libxtst6 \
#    libnss3 \
#    libxss1 \
#    libasound2 \
#    libatk-bridge2.0-0 \
#    libgtk-3-0 \
#    --no-install-recommends \
#    && rm -rf /var/lib/apt/lists/*

COPY . .
CMD ["node", "index.js"]