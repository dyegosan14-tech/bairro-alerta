import { UserRole } from '../../types/index.js';

/**
 * Regra de autorização para visualizar o perfil de um usuário: o próprio usuário,
 * ou um ADMIN/MODERATOR. Extraída como função pura para ser testável sem banco/HTTP.
 */
export function canAccessUserProfile(
  actorId: string,
  actorRole: UserRole,
  targetUserId: string
): boolean {
  if (actorId === targetUserId) return true;
  return actorRole === 'ADMIN' || actorRole === 'MODERATOR';
}
