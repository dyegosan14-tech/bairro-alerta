import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock do axios ANTES de importar api.ts, que chama axios.create() no top-level do módulo.
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

const { IncidentsAPI, ModerationAPI, CategoriesAPI, getApiErrorMessage } = await import('./api.js');

function axiosErrorLike(status: number, message?: string, requestId?: string) {
  return {
    isAxiosError: true,
    response: { status, data: message || requestId ? { message, requestId } : undefined },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('IncidentsAPI / CategoriesAPI / ModerationAPI — sem fallback silencioso para mock', () => {
  // Regressão do achado crítico: antes, QUALQUER erro (401/403/422/500/rede) era engolido
  // e a API devolvia dados fictícios como se a chamada tivesse funcionado — inclusive em
  // escritas (criar ocorrência, votar, comentar, moderar). Agora o erro deve sempre propagar.

  it('list() propaga um erro 500 do servidor em vez de devolver dados fictícios', async () => {
    mockAxiosInstance.get.mockRejectedValueOnce(axiosErrorLike(500, 'Erro interno no servidor'));
    await expect(IncidentsAPI.list()).rejects.toBeTruthy();
  });

  it('create() propaga um erro 401 (sessão expirada) em vez de fingir sucesso', async () => {
    mockAxiosInstance.post.mockRejectedValueOnce(axiosErrorLike(401));
    await expect(IncidentsAPI.create({ title: 'x' })).rejects.toBeTruthy();
  });

  it('ModerationAPI.updateStatus() propaga um erro 403 em vez de aplicar a mudança só localmente', async () => {
    mockAxiosInstance.patch.mockRejectedValueOnce(axiosErrorLike(403));
    await expect(ModerationAPI.updateStatus('inc-1', { status: 'APPROVED' })).rejects.toBeTruthy();
  });

  it('CategoriesAPI.list() propaga erro de rede em vez de devolver categorias fictícias', async () => {
    mockAxiosInstance.get.mockRejectedValueOnce({ isAxiosError: true, code: 'ECONNABORTED' });
    await expect(CategoriesAPI.list()).rejects.toBeTruthy();
  });

  it('chamada bem-sucedida continua retornando os dados reais normalmente', async () => {
    mockAxiosInstance.get.mockResolvedValueOnce({ data: { categories: [{ id: 'c1' }] } });
    await expect(CategoriesAPI.list()).resolves.toEqual([{ id: 'c1' }]);
  });
});

describe('getApiErrorMessage', () => {
  it('traduz 401 para uma mensagem de sessão expirada', () => {
    expect(getApiErrorMessage(axiosErrorLike(401))).toMatch(/sessão expirou/i);
  });

  it('traduz 403 para uma mensagem de permissão', () => {
    expect(getApiErrorMessage(axiosErrorLike(403))).toMatch(/permissão/i);
  });

  it('usa a mensagem do servidor quando disponível', () => {
    expect(getApiErrorMessage(axiosErrorLike(400, 'Categoria inexistente'))).toBe(
      'Categoria inexistente'
    );
  });

  it('anexa o requestId como referência, para o usuário poder repassar ao suporte', () => {
    expect(getApiErrorMessage(axiosErrorLike(500, 'Erro interno no servidor', 'req-42'))).toBe(
      'Erro interno no servidor (ref: req-42)'
    );
  });

  it('não anexa referência quando o backend não enviou requestId (ex.: erro de rede antes de chegar lá)', () => {
    expect(getApiErrorMessage(axiosErrorLike(400, 'Categoria inexistente'))).not.toMatch(/ref:/);
  });

  it('usa uma mensagem padrão para erros que não são do axios', () => {
    expect(getApiErrorMessage(new Error('boom'), 'Falhou.')).toBe('Falhou.');
  });
});
