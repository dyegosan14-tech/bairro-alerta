import { FastifyRequest, FastifyReply } from 'fastify';
import { UserRole } from '../types/index.js';
import { query } from '../database/pool.js';

/**
 * Relê o papel/status do usuário diretamente do banco a cada request autenticada.
 * O JWT só garante *quem* assinou o token, não que o papel/estado nele contido ainda
 * é válido — sem isso, um usuário desativado ou rebaixado continuaria com acesso pleno
 * pelo token antigo até a expiração (JWT_EXPIRES_IN, hoje até 7 dias).
 */
async function fetchActiveUserRole(userId: string): Promise<UserRole | null> {
  const res = await query<{ role: UserRole; is_active: boolean }>(
    'SELECT role, is_active FROM users WHERE id = $1',
    [userId]
  );
  const user = res.rows[0];
  if (!user || !user.is_active) return null;
  return user.role;
}

/**
 * Middleware para garantir que o usuário está autenticado via JWT e que sua conta
 * continua ativa, com o papel (role) atualizado do banco — nunca confia apenas no
 * papel embutido no token.
 */
export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    return reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Token de autenticação ausente, inválido ou expirado.',
      requestId: request.id,
    });
  }

  const currentRole = await fetchActiveUserRole(request.user.id);
  if (!currentRole) {
    return reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Sessão inválida: usuário inativo ou não encontrado.',
      requestId: request.id,
    });
  }
  request.user.role = currentRole;
}

/**
 * Middleware opcional para anexar usuário se houver token, sem bloquear se for anônimo.
 * Também revalida is_active/role; um token de usuário desativado é tratado como anônimo.
 */
export async function optionalAuthenticate(request: FastifyRequest, _reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;
    if (authHeader) {
      await request.jwtVerify();
      const currentRole = await fetchActiveUserRole(request.user.id);
      if (!currentRole) {
        (request as any).user = undefined;
        return;
      }
      request.user.role = currentRole;
    }
  } catch {
    // Silencioso se anônimo ou token inválido
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
        requestId: request.id,
      });
    }

    if (!allowedRoles.includes(request.user.role)) {
      return reply.status(403).send({
        statusCode: 403,
        error: 'Forbidden',
        message: `Acesso negado. Esta ação requer um dos seguintes papéis: ${allowedRoles.join(', ')}`,
        requestId: request.id,
      });
    }
  };
}
