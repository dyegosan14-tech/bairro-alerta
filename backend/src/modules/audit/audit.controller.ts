import { FastifyRequest, FastifyReply } from 'fastify';
import { AuditService } from './audit.service.js';
import { z } from 'zod';

const listAuditQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
  entity_type: z.string().optional(),
});

export class AuditController {
  static async list(request: FastifyRequest, reply: FastifyReply) {
    const parsed = listAuditQuerySchema.parse(request.query);
    const result = await AuditService.list(parsed.limit, parsed.offset, parsed.entity_type);
    return reply.send(result);
  }
}
