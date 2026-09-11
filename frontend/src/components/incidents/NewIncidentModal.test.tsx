import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { axe } from 'jest-axe';
import { NewIncidentModal } from './NewIncidentModal.js';
import { AXE_WCAG_CONFIG } from '../../test/setup.js';
import type { Category } from '../../types/index.js';

// Leaflet depende de geometria real de DOM (getBoundingClientRect etc.) que o jsdom não
// fornece de verdade. Como o que este teste verifica é a contagem de hooks do modal (não
// o comportamento do mapa), o Leaflet é substituído por um stub encadeável (.addTo(),
// .on(), .remove()... sempre retornam o próprio stub) para o teste ficar determinístico
// e não depender de nenhuma capacidade real de renderização de mapa.
function chainable(): any {
  let proxy: any;
  proxy = new Proxy(
    {},
    {
      get: (_t, prop) => (prop === 'then' ? undefined : (..._args: any[]) => proxy),
    }
  );
  return proxy;
}

vi.mock('leaflet', () => ({
  default: {
    map: vi.fn(() => chainable()),
    tileLayer: vi.fn(() => chainable()),
    layerGroup: vi.fn(() => chainable()),
    marker: vi.fn(() => chainable()),
    circle: vi.fn(() => chainable()),
    divIcon: vi.fn(() => ({})),
  },
}));

const categories: Category[] = [
  {
    id: 'cat-1',
    name: 'Iluminação Pública',
    slug: 'iluminacao',
    icon: 'Lightbulb',
    color_hex: '#EAB308',
    description: null,
    is_active: true,
  },
];

function renderModal(isOpen: boolean) {
  return render(
    <NewIncidentModal
      isOpen={isOpen}
      onClose={() => {}}
      categories={categories}
      onSubmit={async () => {}}
    />
  );
}

describe('NewIncidentModal — regressão do bug de hooks condicionais', () => {
  // Antes da correção, o componente fazia `if (!isOpen) return null` ANTES de chamar os
  // useState do formulário. App.tsx sempre mantém este componente montado (só a prop
  // `isOpen` muda), então abrir o modal pela primeira vez fazia o React ir de 0 hooks
  // chamados para ~8 hooks no mesmo componente montado, lançando "Rendered more hooks
  // than during the previous render" — quebrando a SPA inteira ao clicar em "Reportar".

  it('não lança ao re-renderizar de isOpen=false para isOpen=true (mesmo componente montado)', () => {
    const { rerender } = render(
      <NewIncidentModal
        isOpen={false}
        onClose={() => {}}
        categories={categories}
        onSubmit={async () => {}}
      />
    );

    expect(() =>
      rerender(
        <NewIncidentModal
          isOpen={true}
          onClose={() => {}}
          categories={categories}
          onSubmit={async () => {}}
        />
      )
    ).not.toThrow();
  });

  it('renderiza null quando fechado', () => {
    const { container } = renderModal(false);
    expect(container).toBeEmptyDOMElement();
  });

  it('exibe o formulário quando aberto', () => {
    const { getByPlaceholderText } = renderModal(true);
    expect(getByPlaceholderText(/poste apagado na esquina/i)).toBeInTheDocument();
  });

  it('expõe role="dialog" e um botão de fechar com nome acessível', () => {
    const { getByRole } = renderModal(true);
    expect(getByRole('dialog')).toBeInTheDocument();
    expect(getByRole('button', { name: 'Fechar' })).toBeInTheDocument();
  });

  it('fecha ao pressionar Esc', () => {
    const onClose = vi.fn();
    render(
      <NewIncidentModal
        isOpen={true}
        onClose={onClose}
        categories={categories}
        onSubmit={async () => {}}
      />
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('não tem violações de acessibilidade detectáveis automaticamente (axe-core)', async () => {
    const { container } = renderModal(true);
    expect(await axe(container, AXE_WCAG_CONFIG)).toHaveNoViolations();
  });
});
