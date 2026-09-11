import { describe, it, expect } from 'vitest';
import { isValidStatusTransition } from '../src/modules/moderation/moderation.transitions.js';

describe('isValidStatusTransition — máquina de estados da ocorrência', () => {
  it('permite o fluxo feliz completo: PENDING -> APPROVED -> IN_PROGRESS -> RESOLVED', () => {
    expect(isValidStatusTransition('PENDING', 'APPROVED')).toBe(true);
    expect(isValidStatusTransition('APPROVED', 'IN_PROGRESS')).toBe(true);
    expect(isValidStatusTransition('IN_PROGRESS', 'RESOLVED')).toBe(true);
  });

  it('permite rejeitar a partir de PENDING ou APPROVED', () => {
    expect(isValidStatusTransition('PENDING', 'REJECTED')).toBe(true);
    expect(isValidStatusTransition('APPROVED', 'REJECTED')).toBe(true);
  });

  it('permite reabrir de IN_PROGRESS de volta para APPROVED', () => {
    expect(isValidStatusTransition('IN_PROGRESS', 'APPROVED')).toBe(true);
  });

  it('permite manter o mesmo status (atualização só de prioridade/nota)', () => {
    expect(isValidStatusTransition('PENDING', 'PENDING')).toBe(true);
    expect(isValidStatusTransition('APPROVED', 'APPROVED')).toBe(true);
  });

  it('rejeita reverter um status terminal (RESOLVED -> PENDING)', () => {
    expect(isValidStatusTransition('RESOLVED', 'PENDING')).toBe(false);
  });

  it('rejeita pular etapas (PENDING -> RESOLVED direto)', () => {
    expect(isValidStatusTransition('PENDING', 'RESOLVED')).toBe(false);
  });

  it('rejeita qualquer transição a partir de REJECTED (estado terminal)', () => {
    expect(isValidStatusTransition('REJECTED', 'PENDING')).toBe(false);
    expect(isValidStatusTransition('REJECTED', 'APPROVED')).toBe(false);
  });
});
