import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';

const mockAxiosInstance = {
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  interceptors: { request: { use: vi.fn() } },
};

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => mockAxiosInstance),
    isAxiosError: (err: any) => !!err?.isAxiosError,
  },
}));

const { AuthProvider, useAuth } = await import('./AuthContext.js');

function LoginProbe() {
  const { user, login } = useAuth();
  return (
    <div>
      <span data-testid="user">{user ? user.role : 'anonymous'}</span>
      <button onClick={() => login('admin@example.com', 'senha-errada').catch(() => {})}>
        login
      </button>
    </div>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe('AuthContext.login — regressão do auto-login de demonstração em falha real', () => {
  // Antes da correção, QUALQUER falha de login (senha errada, backend fora do ar, etc.)
  // caía num catch que chamava quickDemoLogin adivinhando o papel pela substring do
  // e-mail — ou seja, digitar "admin@..." com senha errada logava como Administrador de
  // verdade. Agora a falha deve propagar como erro, sem autenticar ninguém.

  it('não autentica o usuário quando a chamada de login real falha, mesmo com e-mail contendo "admin"', async () => {
    mockAxiosInstance.post.mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 401, data: { message: 'Credenciais inválidas.' } },
    });

    render(
      <AuthProvider>
        <LoginProbe />
      </AuthProvider>
    );

    expect(screen.getByTestId('user').textContent).toBe('anonymous');

    await act(async () => {
      screen.getByText('login').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('anonymous');
    });
    expect(localStorage.getItem('@voz_do_bairro:token')).toBeNull();
  });

  it('autentica normalmente quando o login real tem sucesso', async () => {
    mockAxiosInstance.post.mockResolvedValueOnce({
      data: {
        user: {
          id: 'u1',
          role: 'CITIZEN',
          name: 'Fulano',
          email: 'a@a.com',
          city: 'SP',
          is_active: true,
          created_at: '',
        },
        token: 'jwt-real',
      },
    });

    render(
      <AuthProvider>
        <LoginProbe />
      </AuthProvider>
    );

    await act(async () => {
      screen.getByText('login').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('CITIZEN');
    });
    expect(localStorage.getItem('@voz_do_bairro:token')).toBe('jwt-real');
  });
});
