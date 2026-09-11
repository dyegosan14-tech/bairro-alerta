import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/database/pool.js', () => ({
  query: vi.fn(),
}));

const { query } = await import('../src/database/pool.js');
const { MetricsService } = await import('../src/modules/metrics/metrics.service.js');

const mockedQuery = vi.mocked(query);

function mockFiveAggregationQueries() {
  mockedQuery
    .mockResolvedValueOnce({
      rows: [
        {
          total_incidents: '1',
          pending_count: '1',
          in_progress_count: '0',
          resolved_count: '0',
          rejected_count: '0',
          total_upvotes: '0',
          avg_resolution_hours: '0',
        },
      ],
    } as any)
    .mockResolvedValueOnce({ rows: [] } as any)
    .mockResolvedValueOnce({ rows: [] } as any)
    .mockResolvedValueOnce({ rows: [] } as any)
    .mockResolvedValueOnce({ rows: [] } as any);
}

beforeEach(() => {
  mockedQuery.mockReset();
  MetricsService.invalidateCache();
});

describe('MetricsService.getDashboardMetrics — cache em memória com TTL', () => {
  it('na primeira chamada, executa as 5 queries de agregação', async () => {
    mockFiveAggregationQueries();
    await MetricsService.getDashboardMetrics(0);
    expect(mockedQuery).toHaveBeenCalledTimes(5);
  });

  it('dentro do TTL, uma segunda chamada usa o cache e não bate no banco de novo', async () => {
    mockFiveAggregationQueries();
    const first = await MetricsService.getDashboardMetrics(0);
    const second = await MetricsService.getDashboardMetrics(10_000); // 10s depois, ainda dentro do TTL de 30s

    expect(mockedQuery).toHaveBeenCalledTimes(5); // não rodou de novo
    expect(second).toEqual(first);
  });

  it('depois do TTL expirar, recalcula (mais 5 queries)', async () => {
    mockFiveAggregationQueries();
    await MetricsService.getDashboardMetrics(0);

    mockFiveAggregationQueries();
    await MetricsService.getDashboardMetrics(31_000); // 31s depois, TTL de 30s já expirou

    expect(mockedQuery).toHaveBeenCalledTimes(10);
  });

  it('invalidateCache() força recálculo mesmo dentro do TTL', async () => {
    mockFiveAggregationQueries();
    await MetricsService.getDashboardMetrics(0);

    MetricsService.invalidateCache();

    mockFiveAggregationQueries();
    await MetricsService.getDashboardMetrics(1_000);

    expect(mockedQuery).toHaveBeenCalledTimes(10);
  });
});
