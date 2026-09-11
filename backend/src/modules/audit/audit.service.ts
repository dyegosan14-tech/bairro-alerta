import { query } from '../../database/pool.js';
import { AuditLog } from '../../types/index.js';
import { logger } from '../../config/logger.js';

export interface CreateAuditLogParams {
  actor_id?: string | null;
  actor_email?: string | null;
  actor_role?: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  old_values?: Record<string, any> | null;
  new_values?: Record<string, any> | null;
  ip_address?: string | null;
  user_agent?: string | null;
}

export class AuditService {
  static async record(params: CreateAuditLogParams): Promise<void> {
    try {
      await query(
        `
        INSERT INTO audit_logs (
          actor_id, actor_email, actor_role, action, entity_type,
          entity_id, old_values, new_values, ip_address, user_agent
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `,
        [
          params.actor_id || null,
          params.actor_email || null,
          params.actor_role || null,
          params.action,
          params.entity_type,
          params.entity_id,
          params.old_values ? JSON.stringify(params.old_values) : null,
          params.new_values ? JSON.stringify(params.new_values) : null,
          params.ip_address || null,
          params.user_agent || null,
        ]
      );
    } catch (error) {
      logger.error({ error, params }, 'Falha ao registrar log de auditoria');
    }
  }

  static async list(
    limit = 50,
    offset = 0,
    entityType?: string
  ): Promise<{ data: AuditLog[]; total: number }> {
    let whereClause = '';
    const params: any[] = [];

    if (entityType) {
      params.push(entityType);
      whereClause = `WHERE entity_type = $${params.length}`;
    }

    const countRes = await query(`SELECT COUNT(*) as total FROM audit_logs ${whereClause}`, params);
    const total = parseInt(countRes.rows[0]?.total || '0', 10);

    const listParams = [...params, limit, offset];
    const dataRes = await query(
      `
      SELECT 
        id, actor_id, actor_email, actor_role, action, entity_type,
        entity_id, old_values, new_values, ip_address, user_agent, created_at
      FROM audit_logs
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${listParams.length - 1} OFFSET $${listParams.length}
    `,
      listParams
    );

    return {
      data: dataRes.rows,
      total,
    };
  }
}
