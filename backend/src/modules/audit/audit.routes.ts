import { FastifyInstance } from 'fastify';
import { AuditController } from './audit.controller.js';
import { authenticate, requireRole } from '../../middlewares/auth.middleware.js';

export async function auditRoutes(app: FastifyInstance) {
  app.get(
    '/',
    {
      preHandler: [authenticate, requireRole(['ADMIN'])],
      schema: {
        tags: ['Auditoria'],
        summary: 'Lista histórico de logs de auditoria (Apenas Admin)',
        description:
          'Retorna trilha imutável de ações executadas no sistema com dados antes/depois.',
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'number', minimum: 1, maximum: 100, default: 50 },
            offset: { type: 'number', minimum: 0, default: 0 },
            entity_type: { type: 'string' },
          },
        },
      },
    },
    AuditController.list
  );
}
