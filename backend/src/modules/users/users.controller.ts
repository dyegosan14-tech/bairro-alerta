import { FastifyRequest, FastifyReply } from 'fastify';
import { UsersService } from './users.service.js';
import { z } from 'zod';
import { UserRole } from '../../types/index.js';

const updateRoleSchema = z.object({
  role: z.enum(['CITIZEN', 'MODERATOR', 'ADMIN']),
});

export class UsersController {
  static async list(request: FastifyRequest, reply: FastifyReply) {
    const roleQuery = (request.query as any)?.role as UserRole | undefined;
    const users = await UsersService.listUsers(roleQuery);
    return reply.send({ users });
  }

  static async getById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const user = await UsersService.findById(id);
    if (!user) {
      return reply.status(404).send({ statusCode: 404, message: 'Usuário não encontrado' });
    }
    return reply.send({ user });
  }

  static async updateRole(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const body = updateRoleSchema.parse(request.body);
    const actor = request.user!;

    const updated = await UsersService.updateUserRole(id, body.role, actor.id, actor.email, request.ip);

    return reply.send({
      message: `Papel do usuário atualizado com sucesso para ${body.role}`,
      user: updated,
    });
  }
}
