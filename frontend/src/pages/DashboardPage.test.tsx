import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { DashboardPage } from './DashboardPage.js';
import type { DashboardMetrics } from '../types/index.js';

const { mockAxiosInstance } = vi.hoisted(() => {
  const instance = {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    interceptors: { request: { use: vi.fn() } },
  };
  return { mockAxiosInstance: instance };
});

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => mockAxiosInstance),
    isAxiosError: (err: any) => !!err?.isAxiosError,
  },
}));

const metrics: DashboardMetrics = {
  summary: {
    total_incidents: 10,
    pending_count: 2,
    in_progress_count: 3,
    resolved_count: 4,
    rejected_count: 1,
    resolution_rate_percentage: 40,
    total_upvotes: 25,
    avg_resolution_hours: 12,
  },
  by_category: [
    { category_id: 'c1', category_name: 'Iluminação', category_color: '#EAB308', count: 5 },
  ],
  by_status: [{ status: 'RESOLVED', count: 4 }],
  top_neighborhoods: [{ neighborhood: 'Centro', total: 5, resolved: 2 }],
  recent_trend: [{ date: '01/01', count: 3 }],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('DashboardPage', () => {
  it('mostra estado de carregamento e depois os KPIs reais', async () => {
    mockAxiosInstance.get.mockResolvedValueOnce({ data: metrics });
    render(<DashboardPage />);

    expect(screen.getByText(/Carregando painel/i)).toBeInTheDocument();

    await waitFor(() => expect(screen.getByText('10')).toBeInTheDocument());
    expect(screen.getAllByText('40%').length).toBeGreaterThanOrEqual(1);
  });

  it('mostra mensagem de erro em vez de travar em "Carregando" para sempre quando a API falha', async () => {
    // Regressão: antes o erro só ia pro console.error e a tela ficava sem feedback nenhum
    // para o usuário além do "Carregando..." (nem sucesso nem erro visível).
    mockAxiosInstance.get.mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 500, data: { message: 'Falha ao calcular métricas' } },
    });
    render(<DashboardPage />);

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByRole('alert')).toHaveTextContent('Falha ao calcular métricas');
  });
});
