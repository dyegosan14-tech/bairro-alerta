import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ModerationPage } from './ModerationPage.js';
import type { Incident } from '../types/index.js';

function makeIncident(overrides: Partial<Incident>): Incident {
  return {
    id: 'inc-1',
    user_id: 'u1',
    category_id: 'cat-1',
    category_name: 'Iluminação Pública',
    category_color: '#EAB308',
    title: 'Poste apagado',
    description: 'Rua sem iluminação há dias.',
    latitude: -23.55,
    longitude: -46.63,
    address_text: 'Rua Teste, 100',
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    status: 'PENDING',
    priority: 'MEDIUM',
    upvotes_count: 0,
    created_at: new Date(0).toISOString(),
    updated_at: new Date(0).toISOString(),
    ...overrides,
  };
}

describe('ModerationPage', () => {
  it('filtra por status ao trocar de aba (padrão: PENDING)', () => {
    const incidents = [
      makeIncident({ id: 'p1', status: 'PENDING' }),
      makeIncident({ id: 'r1', title: 'Já resolvido', status: 'RESOLVED' }),
    ];
    render(
      <ModerationPage incidents={incidents} onSelectIncident={() => {}} onUpdateStatus={() => {}} />
    );

    expect(screen.getByText('Poste apagado')).toBeInTheDocument();
    expect(screen.queryByText('Já resolvido')).not.toBeInTheDocument();
  });

  it('mostra ações de Aprovar/Rejeitar para ocorrências PENDING e chama onUpdateStatus com o status certo', () => {
    const onUpdateStatus = vi.fn();
    const incidents = [makeIncident({ id: 'p1', status: 'PENDING' })];
    render(
      <ModerationPage
        incidents={incidents}
        onSelectIncident={() => {}}
        onUpdateStatus={onUpdateStatus}
      />
    );

    fireEvent.click(screen.getByText('Aprovar'));
    expect(onUpdateStatus).toHaveBeenCalledWith(
      'p1',
      expect.objectContaining({ status: 'APPROVED' })
    );
  });

  it('mostra "Iniciar Reparo" (não Aprovar/Rejeitar) para ocorrências já APPROVED', () => {
    const incidents = [makeIncident({ id: 'a1', status: 'APPROVED' })];
    render(
      <ModerationPage incidents={incidents} onSelectIncident={() => {}} onUpdateStatus={() => {}} />
    );

    fireEvent.click(screen.getByText(/Validados/));
    expect(screen.getByText('Iniciar Reparo')).toBeInTheDocument();
    expect(screen.queryByText('Aprovar')).not.toBeInTheDocument();
  });
});
