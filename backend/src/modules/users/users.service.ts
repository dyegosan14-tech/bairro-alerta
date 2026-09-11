import { query } from '../../database/pool.js';
import { User, UserRole } from '../../types/index.js';
import { AuditService } from '../audit/audit.service.js';

export class UsersService {
  static async listUsers(role?: UserRole): Promise<Omit<User, 'password_hash'>[]> {
    let sql = `
      SELECT id, name, email, role, avatar_url, neighborhood, city, is_active, created_at, updated_at
      FROM users
    `;
    const params: any[] = [];

    if (role) {
      params.push(role);
      sql += ' WHERE role = $1';
    }

    sql += ' ORDER BY created_at DESC';

    const res = await query<User>(sql, params);
    return res.rows;
  }

  static async findById(id: string): Promise<Omit<User, 'password_hash'> | null> {
    const res = await query<User>(
      `
      SELECT id, name, email, role, avatar_url, neighborhood, city, is_active, created_at, updated_at
      FROM users WHERE id = $1
    `,
      [id]
    );

    return res.rows[0] || null;
  }

  static async updateUserRole(
    targetUserId: string,
    newRole: UserRole,
    actorId: string,
    actorEmail: string,
    actorRole: UserRole,
    ipAddress?: string
  ): Promise<Omit<User, 'password_hash'>> {
    const oldUser = await this.findById(targetUserId);
    if (!oldUser) {
      const error: any = new Error('Usuário não encontrado.');
      error.statusCode = 404;
      throw error;
    }

    // Impede remover o papel do último ADMIN ativo do sistema (inclusive auto-rebaixamento):
    // sem isso, um ADMIN sozinho poderia se rebaixar (ou rebaixar o único outro admin) e
    // travar toda a administração — ninguém mais conseguiria gerenciar papéis ou acessar
    // rotas exclusivas de ADMIN (auditoria, etc.).
    if (oldUser.role === 'ADMIN' && newRole !== 'ADMIN') {
      const remainingAdmins = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM users WHERE role = 'ADMIN' AND is_active = true AND id != $1`,
        [targetUserId]
      );
      const otherActiveAdmins = parseInt(remainingAdmins.rows[0]?.count || '0', 10);
      if (otherActiveAdmins === 0) {
        const error: any = new Error(
          'Não é possível remover o papel do último administrador ativo do sistema.'
        );
        error.statusCode = 409;
        throw error;
      }
    }

    const res = await query<User>(
      `
      UPDATE users
      SET role = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, name, email, role, avatar_url, neighborhood, city, is_active, created_at, updated_at
    `,
      [newRole, targetUserId]
    );

    const updated = res.rows[0];

    await AuditService.record({
      actor_id: actorId,
      actor_email: actorEmail,
      // Antes vinha hardcoded como 'ADMIN' (funcionava só porque a rota já é
      // ADMIN-only, mas era um valor mágico desalinhado do ator real).
      actor_role: actorRole,
      action: 'USER_ROLE_UPDATE',
      entity_type: 'USER',
      entity_id: targetUserId,
      old_values: { role: oldUser.role },
      new_values: { role: newRole },
      ip_address: ipAddress,
    });

    return updated;
  }
}
