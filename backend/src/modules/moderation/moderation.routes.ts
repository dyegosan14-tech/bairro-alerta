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
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
        },
        // Alinhado com moderation.schema.ts (updateIncidentStatusSchema); a transição de
        // status em si (ex.: RESOLVED -> PENDING) é validada à parte, na máquina de
        // estados de moderation.transitions.ts.
        body: {
          type: 'object',
          required: ['status'],
          properties: {
            status: {
              type: 'string',
              enum: ['PENDING', 'APPROVED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'],
            },
            priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
            moderator_notes: { type: 'string', maxLength: 1000 },
          },
        },
      },
    },
    ModerationController.updateStatus
  );
}
