import { FastifyInstance } from 'fastify';
import { AuthController } from './auth.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

export async function authRoutes(app: FastifyInstance) {
  // Rate limiting extra restrito para rotas de auth
  const authRateLimit = {
    max: 15,
    timeWindow: '1 minute',
  };

  app.post(
    '/register',
    {
      config: { rateLimit: authRateLimit },
      schema: {
        tags: ['Autenticação'],
        summary: 'Cadastrar novo cidadão',
        body: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: { type: 'string', minLength: 2 },
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 6 },
            neighborhood: { type: 'string' },
            city: { type: 'string', default: 'São Paulo' },
          },
        },
      },
    },
    AuthController.register
  );

  app.post(
    '/login',
    {
      config: { rateLimit: authRateLimit },
      schema: {
        tags: ['Autenticação'],
        summary: 'Realizar login e obter JWT',
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' },
          },
        },
      },
    },
    AuthController.login
  );

  app.get(
    '/me',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['Autenticação'],
        summary: 'Obter dados do usuário autenticado no token atual',
      },
    },
    AuthController.me
  );
}
