import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuditPage } from './AuditPage.js';
import type { AuditLog } from '../types/index.js';

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

const logs: AuditLog[] = [
  {
    id: 'log-1',
    actor_email: 'admin@example.com',
    actor_role: 'ADMIN',
    action: 'USER_ROLE_UPDATE',
    entity_type: 'USER',
    entity_id: 'u1',
    old_values: { role: 'CITIZEN' },
    new_values: { role: 'MODERATOR' },
    created_at: new Date(0).toISOString(),
  },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe('AuditPage', () => {
  it('lista os eventos de auditoria carregados', async () => {
    mockAxiosInstance.get.mockResolvedValueOnce({ data: { data: logs, total: 1 } });
    render(<AuditPage />);

    await waitFor(() => expect(screen.getByText('USER_ROLE_UPDATE')).toBeInTheDocument());
    expect(screen.getByText('admin@example.com')).toBeInTheDocument();
  });

  it('mostra old_values/new_values ao selecionar um log', async () => {
    mockAxiosInstance.get.mockResolvedValueOnce({ data: { data: logs, total: 1 } });
    render(<AuditPage />);

    await waitFor(() => screen.getByText('USER_ROLE_UPDATE'));
    fireEvent.click(screen.getByText('USER_ROLE_UPDATE'));

    expect(screen.getByText(/"role": "CITIZEN"/)).toBeInTheDocument();
    expect(screen.getByText(/"role": "MODERATOR"/)).toBeInTheDocument();
  });

  it('mostra erro visível quando a API falha (antes só ia pro console)', async () => {
    mockAxiosInstance.get.mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 403, data: { message: 'Você não tem permissão para essa ação.' } },
    });
    render(<AuditPage />);

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByRole('alert')).toHaveTextContent('Você não tem permissão para essa ação.');
  });
});
