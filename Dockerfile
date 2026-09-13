# OrderFAST Backend API Dockerfile (Monorepo-compatible for Railway)
FROM node:20-alpine

WORKDIR /app

# Copy monorepo configuration and lockfile
COPY package*.json ./
COPY turbo.json ./
COPY packages ./packages
COPY apps/api ./apps/api

# Install all dependencies across the monorepo (including workspace packages)
RUN npm ci

# Build the API service
RUN npm run build --workspace=apps/api

# Set runtime environment
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4000
ENV NODE_PATH=/app/node_modules:/app/apps/api/node_modules

EXPOSE 4000

CMD ["npm", "--workspace=apps/api", "run", "start"]

