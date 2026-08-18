import { FastifyInstance } from 'fastify';
import { ModerationController } from './moderation.controller.js';
import { authenticate, requireRole } from '../../middlewares/auth.middleware.js';

export async function moderationRoutes(app: FastifyInstance) {
  app.patch(
    '/incidents/:id/status',
    {
      preHandler: [authenticate, requireRole(['ADMIN', 'MODERATOR'])],
      schema: {
        tags: ['Moderação'],
        summary: 'Aprovar, rejeitar ou alterar status de ocorrência (Mod/Admin)',
        body: {
          type: 'object',
          required: ['status'],
          properties: {
            status: { type: 'string', enum: ['PENDING', 'APPROVED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'] },
            priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
            moderator_notes: { type: 'string' },
          },
        },
      },
    },
    ModerationController.updateStatus
  );
}
