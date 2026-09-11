import { FastifyRequest, FastifyReply } from 'fastify';
import { IncidentsService } from './incidents.service.js';
import {
  createIncidentSchema,
  listIncidentsQuerySchema,
  addCommentSchema,
} from './incidents.schema.js';

export class IncidentsController {
  static async create(request: FastifyRequest, reply: FastifyReply) {
    const input = createIncidentSchema.parse(request.body);
    const user = request.user!;

    const incident = await IncidentsService.create(
      user.id,
      user.email,
      user.role,
      input,
      request.ip
    );

    return reply.status(201).send({
      message: 'Ocorrência registrada com sucesso! Ela passará por triagem.',
      incident,
    });
  }

  static async list(request: FastifyRequest, reply: FastifyReply) {
    const query = listIncidentsQuerySchema.parse(request.query);
    const currentUserId = request.user?.id;

    const result = await IncidentsService.list(query, currentUserId);
    return reply.send(result);
  }

  static async getById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const currentUserId = request.user?.id;

    const incident = await IncidentsService.findById(id, currentUserId);
    if (!incident) {
      return reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: 'Ocorrência não encontrada.',
        requestId: request.id,
      });
    }

    return reply.send({ incident });
  }

  static async toggleVote(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const userId = request.user!.id;

    const result = await IncidentsService.toggleVote(id, userId);

    return reply.send({
      message: result.voted ? 'Apoio registrado com sucesso!' : 'Apoio removido.',
      ...result,
    });
  }

  static async addComment(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const body = addCommentSchema.parse(request.body);
    const user = request.user!;

    const isOfficial = user.role === 'ADMIN' || user.role === 'MODERATOR';
    const comment = await IncidentsService.addComment(id, user.id, body.content, isOfficial);

    return reply.status(201).send({
      message: 'Comentário publicado!',
      comment,
    });
  }
}
