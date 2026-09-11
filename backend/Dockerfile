# ==============================================================================
# Dockerfile Multi-Stage para o Backend Fastify
# ==============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# NOTA: este monorepo usa npm workspaces com um único package-lock.json na raiz, que não
# entra no contexto de build (context: ./backend). `npm ci` exige um lockfile presente e
# falharia aqui — por isso usamos `npm install`. Isso é menos reprodutível que `npm ci`;
# se quiser builds 100% determinísticos, gere um package-lock.json dedicado dentro de
# backend/ (ou mude o build context do compose para a raiz do monorepo) e volte para `npm ci`.
COPY package*.json ./
RUN npm install

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
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY src/database/init.sql ./dist/database/init.sql

# Criar pasta para uploads de fotos
RUN mkdir -p uploads && chown -R node:node uploads

USER node

EXPOSE 3001

CMD ["node", "dist/server.js"]
