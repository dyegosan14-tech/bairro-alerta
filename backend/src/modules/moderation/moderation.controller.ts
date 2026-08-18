import { FastifyRequest, FastifyReply } from 'fastify';
import { ModerationService } from './moderation.service.js';
import { updateIncidentStatusSchema } from './moderation.schema.js';

export class ModerationController {
  static async updateStatus(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const input = updateIncidentStatusSchema.parse(request.body);
    const user = request.user!;

    const updatedIncident = await ModerationService.updateStatus(
      id,
      input,
      user.id,
      user.email,
      user.role,
      request.ip
    );

    return reply.send({
      message: `Status da ocorrência atualizado para ${input.status}`,
      incident: updatedIncident,
    });
  }
}
