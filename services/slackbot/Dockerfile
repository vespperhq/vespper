FROM node:18.18.2-alpine as base

# Add package file
COPY package.json ./
COPY yarn.lock ./

# Install deps
RUN yarn install

# Copy source
COPY src ./src

# Run server
CMD ["npm", "start"]