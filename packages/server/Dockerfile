# Stage 1: Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Copy root workspace and server manifests
COPY package*.json ./
COPY packages/server/package*.json ./packages/server/

# Install dependencies
RUN npm install

# Copy server source code
COPY packages/server ./packages/server

# Build TypeScript
WORKDIR /app/packages/server
RUN npm run build

# Stage 2: Production runtime stage
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=10000
ENV HOST=0.0.0.0

# Install curl for Render healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# Copy package manifests and production dependencies
COPY package*.json ./
COPY packages/server/package*.json ./packages/server/
RUN npm install --omit=dev

# Copy compiled dist from builder
COPY --from=builder /app/packages/server/dist ./packages/server/dist

WORKDIR /app/packages/server

EXPOSE 10000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:10000/healthz || exit 1

CMD ["node", "dist/index.js"]
