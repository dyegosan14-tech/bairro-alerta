import { FastifyInstance } from 'fastify';
import { UsersController } from './users.controller.js';
import { authenticate, requireRole } from '../../middlewares/auth.middleware.js';

export async function usersRoutes(app: FastifyInstance) {
  app.get(
    '/',
    {
      preHandler: [authenticate, requireRole(['ADMIN', 'MODERATOR'])],
      schema: {
        tags: ['Usuários'],
        summary: 'Listar usuários do sistema (Admin/Mod)',
        querystring: {
          type: 'object',
          properties: {
            role: { type: 'string', enum: ['CITIZEN', 'MODERATOR', 'ADMIN'] },
          },
        },
      },
    },
    UsersController.list
  );

  app.get(
    '/:id',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['Usuários'],
        summary: 'Obter detalhes de um usuário por ID',
      },
    },
    UsersController.getById
  );

  app.patch(
    '/:id/role',
    {
      preHandler: [authenticate, requireRole(['ADMIN'])],
      schema: {
        tags: ['Usuários'],
        summary: 'Alterar papel/permissão de um usuário (Apenas Admin)',
        body: {
          type: 'object',
          required: ['role'],
          properties: {
            role: { type: 'string', enum: ['CITIZEN', 'MODERATOR', 'ADMIN'] },
          },
        },
      },
    },
    UsersController.updateRole
  );
}
