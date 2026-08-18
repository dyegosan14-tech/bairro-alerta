import { query } from '../../database/pool.js';
import { Incident } from '../../types/index.js';
import { UpdateIncidentStatusInput } from './moderation.schema.js';
import { AuditService } from '../audit/audit.service.js';
import { IncidentsService } from '../incidents/incidents.service.js';

export class ModerationService {
  static async updateStatus(
    incidentId: string,
    input: UpdateIncidentStatusInput,
    moderatorId: string,
    moderatorEmail: string,
    moderatorRole: string,
    ipAddress?: string
  ): Promise<Incident> {
    const existing = await IncidentsService.findById(incidentId);
    if (!existing) {
      const error: any = new Error('Ocorrência não encontrada.');
      error.statusCode = 404;
      throw error;
    }

    const isResolved = input.status === 'RESOLVED';
    const finalPriority = input.priority || existing.priority;
    const finalNotes = input.moderator_notes !== undefined ? input.moderator_notes : existing.moderator_notes;

    const res = await query(`
      UPDATE incidents
      SET 
        status = $1,
        priority = $2,
        moderator_notes = $3,
        moderated_by = $4,
        moderated_at = CURRENT_TIMESTAMP,
        resolved_at = CASE WHEN $1 = 'RESOLVED' THEN CURRENT_TIMESTAMP ELSE NULL END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING id
    `, [input.status, finalPriority, finalNotes, moderatorId, incidentId]);

    // Registrar log de auditoria imutável
    await AuditService.record({
      actor_id: moderatorId,
      actor_email: moderatorEmail,
      actor_role: moderatorRole,
      action: 'INCIDENT_STATUS_CHANGE',
      entity_type: 'INCIDENT',
      entity_id: incidentId,
      old_values: {
        status: existing.status,
        priority: existing.priority,
        moderator_notes: existing.moderator_notes,
      },
      new_values: {
        status: input.status,
        priority: finalPriority,
        moderator_notes: finalNotes,
      },
      ip_address: ipAddress,
    });

    // Se houver nota do moderador, adicionar como resposta oficial nos comentários
    if (input.moderator_notes && input.moderator_notes.trim().length > 0) {
      await query(`
        INSERT INTO incident_comments (incident_id, user_id, content, is_official_response)
        VALUES ($1, $2, $3, true)
      `, [incidentId, moderatorId, `[Atualização de Moderação]: ${input.moderator_notes}`]);
    }

    return await IncidentsService.findById(incidentId) as Incident;
  }
}
