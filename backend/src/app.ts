import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import path from 'path';
import fs from 'fs';

import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { errorHandler } from './middlewares/error-handler.middleware.js';

import { authRoutes } from './modules/auth/auth.routes.js';
import { usersRoutes } from './modules/users/users.routes.js';
import { categoriesRoutes } from './modules/categories/categories.routes.js';
import { incidentsRoutes } from './modules/incidents/incidents.routes.js';
import { moderationRoutes } from './modules/moderation/moderation.routes.js';
import { metricsRoutes } from './modules/metrics/metrics.routes.js';
import { auditRoutes } from './modules/audit/audit.routes.js';
import { uploadsRoutes } from './modules/uploads/uploads.routes.js';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: false, // Usamos nosso logger customizado do Pino
    trustProxy: true,
  });

  // 1. Tratamento Global de Erros
  app.setErrorHandler(errorHandler);

  // 2. Segurança - Helmet
  await app.register(helmet, {
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  });

  // 3. CORS
  await app.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // 4. Rate Limiting Global
  await app.register(rateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_TIME_WINDOW,
  });

  // 5. Autenticação JWT
  await app.register(jwt, {
    secret: env.JWT_SECRET,
    sign: {
      expiresIn: env.JWT_EXPIRES_IN,
    },
  });

  // 6. Upload de Arquivos Multipart
  await app.register(multipart, {
    limits: {
      fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024,
      files: 5,
    },
  });

  // 7. Servir arquivos estáticos de uploads
  const uploadDir = path.resolve(process.cwd(), env.UPLOAD_DIR);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  await app.register(fastifyStatic, {
    root: uploadDir,
    prefix: '/uploads/',
  });

  // 8. Documentação OpenAPI / Swagger
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Voz do Bairro API',
        description: 'API Geoespacial de Zeladoria Urbana e Alertas Comunitários com PostGIS e Fastify',
        version: '1.0.0',
      },
      servers: [
        {
          url: `http://localhost:${env.PORT}`,
          description: 'Servidor Local de Desenvolvimento',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
    staticCSP: true,
  });

  // 9. Endpoint de Health Check
  app.get('/health', async (_req, reply) => {
    return reply.send({
      status: 'ok',
      service: 'voz-do-bairro-api',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // 10. Registro dos Módulos da API v1
  await app.register(
    async (api) => {
      api.register(authRoutes, { prefix: '/auth' });
      api.register(usersRoutes, { prefix: '/users' });
      api.register(categoriesRoutes, { prefix: '/categories' });
      api.register(incidentsRoutes, { prefix: '/incidents' });
      api.register(moderationRoutes, { prefix: '/moderation' });
      api.register(metricsRoutes, { prefix: '/metrics' });
      api.register(auditRoutes, { prefix: '/audit' });
      api.register(uploadsRoutes, { prefix: '/uploads' });
    },
    { prefix: '/api/v1' }
  );

  return app;
}
