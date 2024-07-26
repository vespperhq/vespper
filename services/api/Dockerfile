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
COPY services/api services/api

RUN yarn install --frozen-lockfile --network-timeout 100000

RUN npx nx build api --verbose

WORKDIR /app/services/api/dist

# Run server
CMD ["node", "src/server.js"]