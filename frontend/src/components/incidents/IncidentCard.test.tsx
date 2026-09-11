import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { IncidentCard } from './IncidentCard.js';
import type { Incident } from '../../types/index.js';

const incident: Incident = {
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
  priority: 'URGENT',
  upvotes_count: 3,
  has_voted: false,
  distance_meters: 450,
  created_at: new Date(0).toISOString(),
  updated_at: new Date(0).toISOString(),
};

describe('IncidentCard', () => {
  it('exibe título, bairro e badge de urgência', () => {
    render(<IncidentCard incident={incident} onClick={() => {}} onVote={() => {}} />);
    expect(screen.getByText('Poste apagado')).toBeInTheDocument();
    expect(screen.getByText('Centro')).toBeInTheDocument();
    expect(screen.getByText('Urgente')).toBeInTheDocument();
  });

  it('formata distância em metros quando < 1000m', () => {
    render(<IncidentCard incident={incident} onClick={() => {}} onVote={() => {}} />);
    expect(screen.getByText('450m de você')).toBeInTheDocument();
  });

  it('formata distância em km quando >= 1000m', () => {
    render(
      <IncidentCard
        incident={{ ...incident, distance_meters: 2500 }}
        onClick={() => {}}
        onVote={() => {}}
      />
    );
    expect(screen.getByText('2.5km')).toBeInTheDocument();
  });

  it('chama onClick ao clicar no card', () => {
    const onClick = vi.fn();
    const { container } = render(
      <IncidentCard incident={incident} onClick={onClick} onVote={() => {}} />
    );
    fireEvent.click(container.firstChild as Element);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('chama onVote ao clicar no botão de apoiar, repassando o evento (para o chamador poder stopPropagation)', () => {
    const onVote = vi.fn();
    render(<IncidentCard incident={incident} onClick={() => {}} onVote={onVote} />);
    fireEvent.click(screen.getByText('3').closest('button')!);
    expect(onVote).toHaveBeenCalledTimes(1);
    expect(onVote.mock.calls[0][0]).toHaveProperty('type', 'click');
  });
});
