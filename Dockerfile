# OrderFAST Backend API Dockerfile (Monorepo-compatible for Railway)
FROM node:20-alpine AS builder

WORKDIR /app

# Copy monorepo manifests and lockfile
COPY package*.json ./
COPY turbo.json ./
COPY packages ./packages
COPY apps/api ./apps/api

# Install dependencies for workspace packages
RUN npm ci

# Build the API service
RUN npm run build --workspace=apps/api

# Production Runner Stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4000

# Copy node_modules and built assets
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/api/dist ./apps/api/dist

EXPOSE 4000

CMD ["npm", "--workspace=apps/api", "run", "start"]
