# ==============================================================================
# Dockerfile Multi-Stage para o Backend Fastify
# ==============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# Stage de Produção
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist
COPY src/database/init.sql ./dist/database/init.sql

# Criar pasta para uploads de fotos
RUN mkdir -p uploads && chown -R node:node uploads

USER node

EXPOSE 3001

CMD ["node", "dist/server.js"]
