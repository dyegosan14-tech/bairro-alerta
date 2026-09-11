import { IncidentStatus } from '../../types/index.js';

/**
 * Máquina de estados explícita para o ciclo de vida de uma ocorrência. Antes desta
 * mudança, o endpoint de moderação aceitava qualquer status -> qualquer status (ex.:
 * RESOLVED -> PENDING), pois só validava se o valor pertencia ao enum, não a transição.
 *
 * Fluxo modelado a partir do que a UI de moderação já oferece (Aprovar/Rejeitar/Iniciar
 * Reparo/Concluir), com um caminho de volta de IN_PROGRESS -> APPROVED para reabrir um
 * caso reaprovado por engano. RESOLVED e REJECTED são estados terminais. Toda transição
 * "sem mudança" (para o próprio status atual) é permitida, para suportar atualizações que
 * só alteram prioridade/nota do moderador. Ajuste este mapa se o time de produto definir
 * um fluxo diferente.
 */
export const ALLOWED_STATUS_TRANSITIONS: Record<IncidentStatus, IncidentStatus[]> = {
  PENDING: ['PENDING', 'APPROVED', 'REJECTED'],
  APPROVED: ['APPROVED', 'IN_PROGRESS', 'REJECTED'],
  IN_PROGRESS: ['IN_PROGRESS', 'APPROVED', 'RESOLVED'],
  RESOLVED: ['RESOLVED'],
  REJECTED: ['REJECTED'],
};

export function isValidStatusTransition(from: IncidentStatus, to: IncidentStatus): boolean {
  return ALLOWED_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}
