import { withTransaction } from '../../database/pool.js';
import { Incident } from '../../types/index.js';
import { UpdateIncidentStatusInput } from './moderation.schema.js';
import { AuditService } from '../audit/audit.service.js';
import { IncidentsService } from '../incidents/incidents.service.js';
import { isValidStatusTransition } from './moderation.transitions.js';

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

    if (!isValidStatusTransition(existing.status, input.status)) {
      const error: any = new Error(
        `Transição de status inválida: ${existing.status} -> ${input.status}.`
      );
      error.statusCode = 409;
      throw error;
    }

    const finalPriority = input.priority || existing.priority;
    const finalNotes =
      input.moderator_notes !== undefined ? input.moderator_notes : existing.moderator_notes;

    // Atualização do incidente e o comentário oficial de moderação precisam ser
    // tudo-ou-nada: uma falha no meio do caminho não pode deixar o status mudado
    // sem o respectivo registro visível ao cidadão (ou vice-versa).
    await withTransaction(async (client) => {
      await client.query(
        `
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
      `,
        [input.status, finalPriority, finalNotes, moderatorId, incidentId]
      );

      if (input.moderator_notes && input.moderator_notes.trim().length > 0) {
        await client.query(
          `
          INSERT INTO incident_comments (incident_id, user_id, content, is_official_response)
          VALUES ($1, $2, $3, true)
        `,
          [incidentId, moderatorId, `[Atualização de Moderação]: ${input.moderator_notes}`]
        );
      }
    });

    // Log de auditoria fica fora da transação de negócio de propósito: AuditService.record
    // já engole e loga falhas internamente para nunca bloquear a operação principal.
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

    return (await IncidentsService.findById(incidentId)) as Incident;
  }
}
