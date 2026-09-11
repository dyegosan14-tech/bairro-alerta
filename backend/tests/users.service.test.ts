import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/database/pool.js', () => ({
  query: vi.fn(),
}));

const { query } = await import('../src/database/pool.js');
const { UsersService } = await import('../src/modules/users/users.service.js');

const mockedQuery = vi.mocked(query);

function userRow(overrides: Record<string, any> = {}) {
  return {
    id: 'target-id',
    name: 'Alguém',
    email: 'alguem@example.com',
    role: 'ADMIN',
    is_active: true,
    city: 'São Paulo',
    created_at: new Date(0).toISOString(),
    updated_at: new Date(0).toISOString(),
    ...overrides,
  };
}

beforeEach(() => {
  mockedQuery.mockReset();
});

describe('UsersService.updateUserRole — guard contra remover o último ADMIN', () => {
  it('bloqueia rebaixar o último ADMIN ativo (statusCode 409)', async () => {
    mockedQuery
      .mockResolvedValueOnce({ rows: [userRow({ role: 'ADMIN' })], rowCount: 1 } as any) // findById
      .mockResolvedValueOnce({ rows: [{ count: '0' }], rowCount: 1 } as any); // contagem de outros admins

    await expect(
      UsersService.updateUserRole('target-id', 'CITIZEN', 'actor-id', 'actor@example.com', 'ADMIN')
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('permite rebaixar um ADMIN quando existe outro ADMIN ativo', async () => {
    mockedQuery
      .mockResolvedValueOnce({ rows: [userRow({ role: 'ADMIN' })], rowCount: 1 } as any) // findById
      .mockResolvedValueOnce({ rows: [{ count: '1' }], rowCount: 1 } as any) // outro admin existe
      .mockResolvedValueOnce({ rows: [userRow({ role: 'CITIZEN' })], rowCount: 1 } as any) // UPDATE ... RETURNING
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any); // AuditService.record (INSERT)

    const updated = await UsersService.updateUserRole(
      'target-id',
      'CITIZEN',
      'actor-id',
      'actor@example.com',
      'ADMIN'
    );
    expect(updated.role).toBe('CITIZEN');
  });

  it('não faz a checagem de "último admin" ao promover alguém (não é uma remoção de ADMIN)', async () => {
    mockedQuery
      .mockResolvedValueOnce({ rows: [userRow({ role: 'CITIZEN' })], rowCount: 1 } as any) // findById
      .mockResolvedValueOnce({ rows: [userRow({ role: 'MODERATOR' })], rowCount: 1 } as any) // UPDATE ... RETURNING
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any); // AuditService.record

    const updated = await UsersService.updateUserRole(
      'target-id',
      'MODERATOR',
      'actor-id',
      'actor@example.com',
      'ADMIN'
    );
    expect(updated.role).toBe('MODERATOR');
    // Só 3 chamadas a query() (findById + UPDATE + audit) — nenhuma contagem de admins.
    expect(mockedQuery).toHaveBeenCalledTimes(3);
  });

  it('permite ADMIN "trocar" para ADMIN de novo (sem checagem, pois newRole também é ADMIN)', async () => {
    mockedQuery
      .mockResolvedValueOnce({ rows: [userRow({ role: 'ADMIN' })], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [userRow({ role: 'ADMIN' })], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

    const updated = await UsersService.updateUserRole(
      'target-id',
      'ADMIN',
      'actor-id',
      'actor@example.com',
      'ADMIN'
    );
    expect(updated.role).toBe('ADMIN');
    expect(mockedQuery).toHaveBeenCalledTimes(3);
  });
});
