import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HomePage } from './HomePage.js';
import type { Category, Incident } from '../types/index.js';

// Mesmo stub de Leaflet usado nos testes dos modais — sem depender de geometria real de DOM.
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

function makeIncident(overrides: Partial<Incident>): Incident {
  return {
    id: 'inc-base',
    user_id: 'u1',
    category_id: 'cat-1',
    category_name: 'Iluminação Pública',
    category_color: '#EAB308',
    title: 'Ocorrência',
    description: 'Descrição de teste com mais de dez caracteres.',
    latitude: -23.5615,
    longitude: -46.6559,
    address_text: 'Endereço',
    neighborhood: 'Bairro',
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

// Centro padrão da Home é [-23.5615, -46.6559] (SP Centro/Paulista).
const NEARBY = makeIncident({
  id: 'inc-perto',
  title: 'Perto do centro',
  latitude: -23.5615,
  longitude: -46.6559,
});
// ~1000km ao sul — bem fora de qualquer raio do slider (máx. 25km).
const FAR_AWAY = makeIncident({
  id: 'inc-longe',
  title: 'Muito longe',
  latitude: -30.0,
  longitude: -51.2,
});

describe('HomePage — filtro de raio (antes era só decorativo)', () => {
  // Achado durante a evolução: mudar o slider de raio só redesenhava o círculo no mapa —
  // a lista de ocorrências nunca era filtrada por distância de verdade, e o texto "a até
  // Xkm calculados via PostGIS" era falso (a API é chamada uma única vez, sem
  // lat/lng/radius_km). Agora o filtro usa distância real (Haversine) a partir do centro.

  it('exclui ocorrências fora do raio selecionado', () => {
    render(
      <HomePage
        incidents={[NEARBY, FAR_AWAY]}
        categories={categories}
        selectedIncident={null}
        onSelectIncident={() => {}}
        onVote={() => {}}
        onOpenReportModal={() => {}}
      />
    );

    expect(screen.getByText('Perto do centro')).toBeInTheDocument();
    expect(screen.queryByText('Muito longe')).not.toBeInTheDocument();
  });

  it('o contador "Todas as Categorias" reflete o raio, não o total absoluto', () => {
    render(
      <HomePage
        incidents={[NEARBY, FAR_AWAY]}
        categories={categories}
        selectedIncident={null}
        onSelectIncident={() => {}}
        onVote={() => {}}
        onOpenReportModal={() => {}}
      />
    );

    expect(screen.getByText('Todas as Categorias (1)')).toBeInTheDocument();
  });
});
