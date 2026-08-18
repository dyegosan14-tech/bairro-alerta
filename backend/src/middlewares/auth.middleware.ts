import { FastifyRequest, FastifyReply } from 'fastify';
import { UserRole } from '../types/index.js';

/**
 * Middleware para garantir que o usuário está autenticado via JWT
 */
export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    return reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Token de autenticação ausente, inválido ou expirado.',
    });
  }
}

/**
 * Middleware opcional para anexar usuário se houver token, sem bloquear se for anônimo
 */
export async function optionalAuthenticate(request: FastifyRequest, _reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;
    if (authHeader) {
      await request.jwtVerify();
    }
  } catch {
    // Silencioso se anônimo
  }
}

/**
 * Middleware para autorização baseada em papéis (RBAC)
 */
export function requireRole(allowedRoles: UserRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Usuário não autenticado.',
      });
    }

    if (!allowedRoles.includes(request.user.role)) {
      return reply.status(403).send({
        statusCode: 403,
        error: 'Forbidden',
        message: `Acesso negado. Esta ação requer um dos seguintes papéis: ${allowedRoles.join(', ')}`,
      });
    }
  };
}
