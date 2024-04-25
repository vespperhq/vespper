# First phase - install monorepo's dependencies
FROM node:18.18.2-alpine as dependencies

WORKDIR /app

COPY package.json ./
COPY yarn.lock ./
COPY nx.json ./
COPY tsconfig.*.json ./
COPY jest.preset.js ./
COPY jest.config.ts ./

# IMPORTANT: Copy internal libraries
COPY packages packages
COPY services/slackbot services/slackbot

RUN yarn install --frozen-lockfile

RUN npx nx build slackbot --verbose

WORKDIR /app/services/slackbot/dist

# Run server
CMD ["node", "app.js"]