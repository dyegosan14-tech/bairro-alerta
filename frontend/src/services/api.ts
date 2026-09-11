import axios from 'axios';
import type { AxiosError } from 'axios';
import { Incident, Category, DashboardMetrics, AuditLog } from '../types/index.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Interceptor para injetar o token JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('@voz_do_bairro:token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * O backend inclui um `requestId` (request.id do Fastify) em toda resposta de erro, para
 * correlacionar o que o usuário vê com a linha correspondente no log do servidor. Sem
 * isso, um usuário reportando "deu erro" para o suporte não tinha nenhuma referência que
 * ajudasse a achar o evento certo nos logs.
 */
function appendRequestIdRef(message: string, requestId?: string): string {
  return requestId ? `${message} (ref: ${requestId})` : message;
}

/**
 * Extrai uma mensagem de erro amigável de uma falha de API, para ser exibida ao usuário.
 * NUNCA mascare o erro devolvendo dado fictício no lugar — 401/403/422/500/timeout devem
 * sempre chegar visíveis a quem chamou (ver histórico de auditoria: o comportamento
 * anterior fingia sucesso mesmo em falha de autenticação/permissão/servidor).
 */
export function getApiErrorMessage(
  err: unknown,
  fallback = 'Não foi possível completar a ação. Tente novamente.'
): string {
  if (axios.isAxiosError(err)) {
    const axiosErr = err as AxiosError<{ message?: string; requestId?: string }>;
    if (axiosErr.response) {
      const status = axiosErr.response.status;
      const serverMessage = axiosErr.response.data?.message;
      const requestId = axiosErr.response.data?.requestId;
      if (status === 401)
        return appendRequestIdRef(
          serverMessage || 'Sua sessão expirou. Faça login novamente.',
          requestId
        );
      if (status === 403)
        return appendRequestIdRef(
          serverMessage || 'Você não tem permissão para realizar esta ação.',
          requestId
        );
      if (status === 404)
        return appendRequestIdRef(serverMessage || 'Recurso não encontrado.', requestId);
      if (status === 429)
        return appendRequestIdRef(
          serverMessage || 'Muitas tentativas. Aguarde um instante e tente novamente.',
          requestId
        );
      return appendRequestIdRef(serverMessage || fallback, requestId);
    }
    if (axiosErr.code === 'ECONNABORTED')
      return 'A API demorou demais para responder. Tente novamente.';
    return 'Não foi possível conectar à API. Verifique sua conexão ou tente novamente mais tarde.';
  }
  return fallback;
}

// =============================================================================
// Métodos da API — chamam o backend real. Nenhum destes métodos tem fallback
// silencioso para dados fictícios: em caso de erro, a Promise rejeita e quem
// chamou deve tratar/exibir o erro (ver getApiErrorMessage acima).
// =============================================================================

export const IncidentsAPI = {
  async list(params?: any): Promise<{ data: Incident[]; total: number }> {
    const res = await api.get('/incidents', { params });
    return res.data;
  },

  async getById(id: string): Promise<Incident> {
    const res = await api.get(`/incidents/${id}`);
    return res.data.incident;
  },

  async create(data: any): Promise<Incident> {
    const res = await api.post('/incidents', data);
    return res.data.incident;
  },

  async toggleVote(id: string): Promise<{ voted: boolean; totalUpvotes: number }> {
    const res = await api.post(`/incidents/${id}/vote`);
    return res.data;
  },

  async addComment(id: string, content: string): Promise<any> {
    const res = await api.post(`/incidents/${id}/comments`, { content });
    return res.data.comment;
  },
};

export const CategoriesAPI = {
  async list(): Promise<Category[]> {
    const res = await api.get('/categories');
    return res.data.categories;
  },
};

export const ModerationAPI = {
  async updateStatus(
    id: string,
    data: { status: string; priority?: string; moderator_notes?: string }
  ): Promise<Incident> {
    const res = await api.patch(`/moderation/incidents/${id}/status`, data);
    return res.data.incident;
  },
};

export const MetricsAPI = {
  async getDashboard(): Promise<DashboardMetrics> {
    const res = await api.get('/metrics/dashboard');
    return res.data;
  },
};

export const AuditAPI = {
  async list(params?: any): Promise<{ data: AuditLog[]; total: number }> {
    const res = await api.get('/audit', { params });
    return res.data;
  },
};

export const UploadsAPI = {
  async uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/uploads', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.file.url;
  },
};
