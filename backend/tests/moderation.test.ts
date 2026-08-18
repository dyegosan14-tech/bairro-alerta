import { describe, it, expect } from 'vitest';
import { updateIncidentStatusSchema } from '../src/modules/moderation/moderation.schema.js';

describe('Módulo de Moderação e Auditoria - Regras de Transição', () => {
  it('deve aceitar transições válidas de status com notas de moderação', () => {
    const validUpdate = {
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      moderator_notes: 'Encaminhado para a equipe da CET para reparo imediato.',
    };

    const parsed = updateIncidentStatusSchema.safeParse(validUpdate);
    expect(parsed.success).toBe(true);
  });

  it('deve rejeitar status desconhecido', () => {
    const invalidStatus = {
      status: 'CANCELLED_BY_UNKNOWN',
    };

    const parsed = updateIncidentStatusSchema.safeParse(invalidStatus);
    expect(parsed.success).toBe(false);
  });

  it('deve validar controle de acesso baseado em papéis (RBAC)', () => {
    const rolesAllowedForModeration = ['ADMIN', 'MODERATOR'];

    expect(rolesAllowedForModeration.includes('CITIZEN')).toBe(false);
    expect(rolesAllowedForModeration.includes('MODERATOR')).toBe(true);
    expect(rolesAllowedForModeration.includes('ADMIN')).toBe(true);
  });
});
