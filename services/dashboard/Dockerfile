FROM node:18.18.2-alpine as builder

WORKDIR /app

ARG DASHBOARD_API_URL
ARG DASHBOARD_ORY_URL
ENV VITE_API_SERVER_URL=${DASHBOARD_API_URL}
ENV VITE_ORY_URL=${DASHBOARD_ORY_URL}

COPY package.json ./
COPY yarn.lock ./
COPY nx.json ./
COPY tsconfig.*.json ./
COPY jest.preset.js ./
COPY jest.config.ts ./

# IMPORTANT: Copy internal libraries
COPY packages packages

COPY services/dashboard/package.json services/dashboard/package.json
COPY services/dashboard/yarn.lock services/dashboard/yarn.lock
RUN yarn install --frozen-lockfile

COPY services/dashboard services/dashboard

RUN npx nx build dashboard --verbose

# Use NGINX as base for the production stage
FROM nginx:alpine AS production

# Copy the built files from the previous stage to NGINX html directory
COPY --from=builder /app/services/dashboard/dist /usr/share/nginx/html
COPY --from=builder /app/services/dashboard/nginx.conf /etc/nginx/conf.d/default.conf

# Expose the port that NGINX will listen on
EXPOSE 80

# Start NGINX when the container starts
CMD ["nginx", "-g", "daemon off;"]