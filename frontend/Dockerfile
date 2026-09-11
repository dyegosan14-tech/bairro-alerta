# ==============================================================================
# Dockerfile Multi-Stage para o Frontend React + Vite + Nginx
# ==============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# NOTA: mesmo motivo do backend/Dockerfile — sem lockfile dedicado no contexto de build,
# `npm ci` falharia. Ver comentário lá para como restaurar builds 100% reprodutíveis.
COPY package*.json ./
RUN npm install

COPY tsconfig*.json vite.config.ts tailwind.config.js postcss.config.js index.html ./
COPY src ./src

RUN npm run build

# Stage de Produção com Nginx
FROM nginx:alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
