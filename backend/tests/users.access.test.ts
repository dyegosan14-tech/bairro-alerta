import { describe, it, expect } from 'vitest';
import { canAccessUserProfile } from '../src/modules/users/users.access.js';

describe('canAccessUserProfile — RBAC de GET /users/:id (correção de IDOR)', () => {
  const selfId = 'user-1';
  const otherId = 'user-2';

  it('permite o próprio usuário ver seu perfil', () => {
    expect(canAccessUserProfile(selfId, 'CITIZEN', selfId)).toBe(true);
  });

  it('bloqueia um CITIZEN de ver o perfil de outro usuário (era o IDOR reportado)', () => {
    expect(canAccessUserProfile(selfId, 'CITIZEN', otherId)).toBe(false);
  });

  it('permite MODERATOR ver o perfil de qualquer usuário', () => {
    expect(canAccessUserProfile(selfId, 'MODERATOR', otherId)).toBe(true);
  });

  it('permite ADMIN ver o perfil de qualquer usuário', () => {
    expect(canAccessUserProfile(selfId, 'ADMIN', otherId)).toBe(true);
  });
});
