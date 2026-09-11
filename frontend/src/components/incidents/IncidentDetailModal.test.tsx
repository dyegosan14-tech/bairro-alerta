import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { axe } from 'jest-axe';
import { IncidentDetailModal } from './IncidentDetailModal.js';
import { AuthProvider } from '../../contexts/AuthContext.js';
import { AXE_WCAG_CONFIG } from '../../test/setup.js';
import type { Incident } from '../../types/index.js';

const sampleIncident: Incident = {
  id: 'inc-1',
  user_id: 'user-1',
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
};

function renderModal(incident: Incident | null) {
  return render(
    <AuthProvider>
      <IncidentDetailModal
        incident={incident}
        onClose={() => {}}
        onVote={() => {}}
        onAddComment={() => {}}
        onUpdateStatus={() => {}}
      />
    </AuthProvider>
  );
}

describe('IncidentDetailModal — regressão do bug de hooks condicionais', () => {
  // Antes da correção, o componente fazia `if (!incident) return null` ANTES de chamar
  // useAuth()/useState. App.tsx sempre mantém este componente montado (só a prop
  // `incident` muda entre null e um objeto), então ir de 0 hooks chamados para ~5 hooks
  // no mesmo componente montado fazia o React lançar "Rendered more hooks than during
  // the previous render" — quebrando a SPA inteira ao selecionar qualquer ocorrência.

  it('não lança ao re-renderizar de incident=null para um incident real (mesmo componente montado)', () => {
    const { rerender } = render(
      <AuthProvider>
        <IncidentDetailModal
          incident={null}
          onClose={() => {}}
          onVote={() => {}}
          onAddComment={() => {}}
          onUpdateStatus={() => {}}
        />
      </AuthProvider>
    );

    expect(() =>
      rerender(
        <AuthProvider>
          <IncidentDetailModal
            incident={sampleIncident}
            onClose={() => {}}
            onVote={() => {}}
            onAddComment={() => {}}
            onUpdateStatus={() => {}}
          />
        </AuthProvider>
      )
    ).not.toThrow();
  });

  it('renderiza null quando não há ocorrência selecionada', () => {
    const { container } = renderModal(null);
    expect(container).toBeEmptyDOMElement();
  });

  it('exibe o título da ocorrência quando uma é selecionada', () => {
    const { getByText } = renderModal(sampleIncident);
    expect(getByText('Poste apagado')).toBeInTheDocument();
  });

  it('expõe role="dialog" e um botão de fechar com nome acessível', () => {
    const { getByRole } = renderModal(sampleIncident);
    expect(getByRole('dialog')).toBeInTheDocument();
    expect(getByRole('button', { name: 'Fechar' })).toBeInTheDocument();
  });

  it('fecha ao pressionar Esc', () => {
    const onClose = vi.fn();
    render(
      <AuthProvider>
        <IncidentDetailModal
          incident={sampleIncident}
          onClose={onClose}
          onVote={() => {}}
          onAddComment={() => {}}
          onUpdateStatus={() => {}}
        />
      </AuthProvider>
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('não tem violações de acessibilidade detectáveis automaticamente (axe-core)', async () => {
    const { container } = renderModal(sampleIncident);
    expect(await axe(container, AXE_WCAG_CONFIG)).toHaveNoViolations();
  });
});
