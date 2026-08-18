import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from './auth.service.js';
import { registerSchema, loginSchema } from './auth.schema.js';
import { AuditService } from '../audit/audit.service.js';

export class AuthController {
  static async register(request: FastifyRequest, reply: FastifyReply) {
    const input = registerSchema.parse(request.body);
    const { user } = await AuthService.register(input, request.ip);

    const token = request.server.jwt.sign({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    return reply.status(201).send({
      message: 'Usuário cadastrado com sucesso!',
      user,
      token,
    });
  }

  static async login(request: FastifyRequest, reply: FastifyReply) {
    const input = loginSchema.parse(request.body);
    const user = await AuthService.validateUser(input);

    const token = request.server.jwt.sign({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    await AuditService.record({
      actor_id: user.id,
      actor_email: user.email,
      actor_role: user.role,
      action: 'USER_LOGIN',
      entity_type: 'USER',
      entity_id: user.id,
      ip_address: request.ip,
      user_agent: request.headers['user-agent'],
    });

    const { password_hash, ...userWithoutPassword } = user;

    return reply.send({
      message: 'Login realizado com sucesso!',
      user: userWithoutPassword,
      token,
    });
  }

  static async me(request: FastifyRequest, reply: FastifyReply) {
    return reply.send({
      user: request.user,
    });
  }
}
