import axios from 'axios';
import { Incident, Category, DashboardMetrics, AuditLog, User } from '../types/index.js';

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

// =============================================================================
// Mock Data para Fallback Instantâneo (Demonstração Rica Offline)
// =============================================================================
export const MOCK_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Iluminação Pública', slug: 'iluminacao-publica', icon: 'Lightbulb', color_hex: '#EAB308', description: 'Postes apagados ou fiação exposta', is_active: true },
  { id: 'cat-2', name: 'Buracos e Pavimentação', slug: 'buracos-pavimentacao', icon: 'AlertTriangle', color_hex: '#EF4444', description: 'Crateras e calçadas danificadas', is_active: true },
  { id: 'cat-3', name: 'Lixo e Entulho', slug: 'lixo-entulho', icon: 'Trash2', color_hex: '#10B981', description: 'Descarte irregular de lixo e entulho', is_active: true },
  { id: 'cat-4', name: 'Focos de Dengue', slug: 'focos-dengue', icon: 'Bug', color_hex: '#8B5CF6', description: 'Água parada e recipientes com mosquitos', is_active: true },
  { id: 'cat-5', name: 'Sinalização e Trânsito', slug: 'sinalizacao-transito', icon: 'ShieldAlert', color_hex: '#F97316', description: 'Semáforos e placas avariadas', is_active: true },
  { id: 'cat-6', name: 'Árvores e Praças', slug: 'arvores-pracas', icon: 'Trees', color_hex: '#14B8A6', description: 'Galhos em risco de queda', is_active: true },
  { id: 'cat-7', name: 'Água e Saneamento', slug: 'agua-saneamento', icon: 'Droplets', color_hex: '#06B6D4', description: 'Vazamentos de água potável ou esgoto', is_active: true },
];

export let MOCK_INCIDENTS: Incident[] = [
  {
    id: 'inc-1',
    user_id: 'usr-cit-1',
    user_name: 'Carlos Cidadão',
    category_id: 'cat-1',
    category_name: 'Iluminação Pública',
    category_icon: 'Lightbulb',
    category_color: '#EAB308',
    title: 'Poste com lâmpada piscando e apagada há 5 noites',
    description: 'A rua fica completamente escura à noite, trazendo insegurança para os pedestres que voltam do metrô.',
    latitude: -23.5852,
    longitude: -46.6388,
    address_text: 'Rua Domingos de Morais, 1240',
    neighborhood: 'Vila Mariana',
    city: 'São Paulo',
    state: 'SP',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    upvotes_count: 14,
    has_voted: false,
    distance_meters: 450,
    moderator_notes: 'Equipe da concessionária de iluminação já acionada sob o protocolo ILUM-2026-881.',
    moderated_at: '2026-08-16T14:30:00Z',
    images: [{ id: 'img-1', incident_id: 'inc-1', file_url: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&auto=format&fit=crop&q=80', created_at: '2026-08-15T10:00:00Z' }],
    comments: [
      { id: 'c-1', incident_id: 'inc-1', user_id: 'usr-mod-1', user_name: 'Lucas Moderador', user_role: 'MODERATOR', content: 'Equipe técnica foi mobilizada e está no local atendendo a solicitação.', is_official_response: true, created_at: '2026-08-16T15:00:00Z' }
    ],
    created_at: '2026-08-15T10:00:00Z',
    updated_at: '2026-08-16T15:00:00Z',
  },
  {
    id: 'inc-2',
    user_id: 'usr-cit-2',
    user_name: 'Maria Silva',
    category_id: 'cat-2',
    category_name: 'Buracos e Pavimentação',
    category_icon: 'AlertTriangle',
    category_color: '#EF4444',
    title: 'Cratera profunda na faixa de ônibus após chuvas',
    description: 'Buraco com mais de 1 metro de diâmetro na faixa da direita. Vários carros já tiveram pneus furados.',
    latitude: -23.5615,
    longitude: -46.6912,
    address_text: 'Av. Brigadeiro Faria Lima, 2100',
    neighborhood: 'Pinheiros',
    city: 'São Paulo',
    state: 'SP',
    status: 'APPROVED',
    priority: 'URGENT',
    upvotes_count: 38,
    has_voted: true,
    distance_meters: 1200,
    moderator_notes: 'Ocorrência validada. Encaminhada à Secretaria Municipal de Infraestrutura Urbana.',
    moderated_at: '2026-08-16T11:20:00Z',
    images: [{ id: 'img-2', incident_id: 'inc-2', file_url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80', created_at: '2026-08-16T09:15:00Z' }],
    comments: [],
    created_at: '2026-08-16T09:15:00Z',
    updated_at: '2026-08-16T11:20:00Z',
  },
  {
    id: 'inc-3',
    user_id: 'usr-cit-1',
    user_name: 'Carlos Cidadão',
    category_id: 'cat-3',
    category_name: 'Lixo e Entulho',
    category_icon: 'Trash2',
    category_color: '#10B981',
    title: 'Acúmulo de entulho e sofás velhos na calçada',
    description: 'Moradores não conseguem transitar pela calçada e pedestres precisam desviar pela rua movimentada.',
    latitude: -23.5587,
    longitude: -46.6499,
    address_text: 'Rua Treze de Maio, 550',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    status: 'RESOLVED',
    priority: 'MEDIUM',
    upvotes_count: 9,
    has_voted: false,
    distance_meters: 800,
    moderator_notes: 'Equipe de limpeza urbana concluiu o recolhimento com caminhão cata-bagulho.',
    moderated_at: '2026-08-14T08:00:00Z',
    resolved_at: '2026-08-15T16:00:00Z',
    images: [{ id: 'img-3', incident_id: 'inc-3', file_url: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=800&auto=format&fit=crop&q=80', created_at: '2026-08-13T14:20:00Z' }],
    comments: [
      { id: 'c-2', incident_id: 'inc-3', user_id: 'usr-mod-1', user_name: 'Lucas Moderador', user_role: 'MODERATOR', content: 'Coleta especial efetuada pela Prefeitura.', is_official_response: true, created_at: '2026-08-15T16:05:00Z' }
    ],
    created_at: '2026-08-13T14:20:00Z',
    updated_at: '2026-08-15T16:05:00Z',
  },
  {
    id: 'inc-4',
    user_id: 'usr-cit-2',
    user_name: 'Maria Silva',
    category_id: 'cat-4',
    category_name: 'Focos de Dengue',
    category_icon: 'Bug',
    category_color: '#8B5CF6',
    title: 'Terreno abandonado com piscina suja e recipientes abertos',
    description: 'Local com grande acúmulo de água parada, forte cheiro e muitos mosquitos na vizinhança.',
    latitude: -23.6025,
    longitude: -46.6622,
    address_text: 'Alameda dos Maracatins, 890',
    neighborhood: 'Moema',
    city: 'São Paulo',
    state: 'SP',
    status: 'PENDING',
    priority: 'HIGH',
    upvotes_count: 22,
    has_voted: false,
    distance_meters: 2100,
    images: [{ id: 'img-4', incident_id: 'inc-4', file_url: 'https://images.unsplash.com/photo-1584467735815-f778f274e296?w=800&auto=format&fit=crop&q=80', created_at: '2026-08-17T08:00:00Z' }],
    comments: [],
    created_at: '2026-08-17T08:00:00Z',
    updated_at: '2026-08-17T08:00:00Z',
  },
  {
    id: 'inc-5',
    user_id: 'usr-cit-1',
    user_name: 'Carlos Cidadão',
    category_id: 'cat-5',
    category_name: 'Sinalização e Trânsito',
    category_icon: 'ShieldAlert',
    category_color: '#F97316',
    title: 'Semáforo de pedestres quebrado em frente à escola',
    description: 'O botão de travessia está solto e o sinal não fica vermelho para os veículos, pondo crianças em perigo.',
    latitude: -23.5833,
    longitude: -46.6800,
    address_text: 'Rua Tabapuã, 410',
    neighborhood: 'Itaim Bibi',
    city: 'São Paulo',
    state: 'SP',
    status: 'RESOLVED',
    priority: 'URGENT',
    upvotes_count: 45,
    has_voted: true,
    distance_meters: 1500,
    moderator_notes: 'Manutenção semafórica concluída pela CET.',
    resolved_at: '2026-08-14T11:00:00Z',
    images: [{ id: 'img-5', incident_id: 'inc-5', file_url: 'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=800&auto=format&fit=crop&q=80', created_at: '2026-08-12T16:00:00Z' }],
    comments: [],
    created_at: '2026-08-12T16:00:00Z',
    updated_at: '2026-08-14T11:00:00Z',
  },
  {
    id: 'inc-6',
    user_id: 'usr-cit-2',
    user_name: 'Maria Silva',
    category_id: 'cat-6',
    category_name: 'Árvores e Praças',
    category_icon: 'Trees',
    category_color: '#14B8A6',
    title: 'Galho de grande porte apoiado sobre fiação de média tensão',
    description: 'Após a tempestade de ontem, o galho cedeu e está tensionando os cabos elétricos.',
    latitude: -23.5350,
    longitude: -46.6720,
    address_text: 'Rua Monte Alegre, 980',
    neighborhood: 'Perdizes',
    city: 'São Paulo',
    state: 'SP',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    upvotes_count: 19,
    has_voted: false,
    distance_meters: 3400,
    moderator_notes: 'Poda emergencial agendada para hoje.',
    images: [{ id: 'img-6', incident_id: 'inc-6', file_url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&auto=format&fit=crop&q=80', created_at: '2026-08-17T06:30:00Z' }],
    comments: [],
    created_at: '2026-08-17T06:30:00Z',
    updated_at: '2026-08-17T07:15:00Z',
  }
];

export const MOCK_METRICS: DashboardMetrics = {
  summary: {
    total_incidents: 124,
    pending_count: 18,
    in_progress_count: 32,
    resolved_count: 70,
    rejected_count: 4,
    resolution_rate_percentage: 56,
    total_upvotes: 489,
    avg_resolution_hours: 28.4,
  },
  by_category: [
    { category_id: 'cat-2', category_name: 'Buracos e Pavimentação', category_color: '#EF4444', count: 42 },
    { category_id: 'cat-1', category_name: 'Iluminação Pública', category_color: '#EAB308', count: 31 },
    { category_id: 'cat-3', category_name: 'Lixo e Entulho', category_color: '#10B981', count: 24 },
    { category_id: 'cat-4', category_name: 'Focos de Dengue', category_color: '#8B5CF6', count: 14 },
    { category_id: 'cat-5', category_name: 'Sinalização e Trânsito', category_color: '#F97316', count: 8 },
    { category_id: 'cat-6', category_name: 'Árvores e Praças', category_color: '#14B8A6', count: 5 },
  ],
  by_status: [
    { status: 'RESOLVED', count: 70 },
    { status: 'IN_PROGRESS', count: 32 },
    { status: 'PENDING', count: 18 },
    { status: 'REJECTED', count: 4 },
  ],
  top_neighborhoods: [
    { neighborhood: 'Pinheiros', total: 28, resolved: 18 },
    { neighborhood: 'Vila Mariana', total: 22, resolved: 14 },
    { neighborhood: 'Bela Vista', total: 19, resolved: 12 },
    { neighborhood: 'Moema', total: 16, resolved: 8 },
    { neighborhood: 'Itaim Bibi', total: 15, resolved: 9 },
    { neighborhood: 'Perdizes', total: 14, resolved: 5 },
    { neighborhood: 'Santana', total: 10, resolved: 4 },
  ],
  recent_trend: [
    { date: '11/08', count: 12 },
    { date: '12/08', count: 19 },
    { date: '13/08', count: 15 },
    { date: '14/08', count: 22 },
    { date: '15/08', count: 18 },
    { date: '16/08', count: 25 },
    { date: '17/08', count: 13 },
  ],
};

export const MOCK_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud-1',
    actor_email: 'moderador@vozdebairro.com.br',
    actor_role: 'MODERATOR',
    action: 'INCIDENT_STATUS_CHANGE',
    entity_type: 'INCIDENT',
    entity_id: 'inc-1',
    old_values: { status: 'PENDING' },
    new_values: { status: 'IN_PROGRESS', priority: 'HIGH' },
    ip_address: '189.40.22.11',
    created_at: '2026-08-16T14:30:00Z',
  },
  {
    id: 'aud-2',
    actor_email: 'admin@vozdebairro.com.br',
    actor_role: 'ADMIN',
    action: 'USER_ROLE_UPDATE',
    entity_type: 'USER',
    entity_id: 'usr-mod-1',
    old_values: { role: 'CITIZEN' },
    new_values: { role: 'MODERATOR' },
    ip_address: '177.18.90.4',
    created_at: '2026-08-15T18:00:00Z',
  },
  {
    id: 'aud-3',
    actor_email: 'moderador@vozdebairro.com.br',
    actor_role: 'MODERATOR',
    action: 'INCIDENT_STATUS_CHANGE',
    entity_type: 'INCIDENT',
    entity_id: 'inc-3',
    old_values: { status: 'IN_PROGRESS' },
    new_values: { status: 'RESOLVED' },
    ip_address: '189.40.22.11',
    created_at: '2026-08-15T16:00:00Z',
  }
];

// =============================================================================
// Métodos Unificados da API (com suporte a fallback gracioso)
// =============================================================================

export const IncidentsAPI = {
  async list(params?: any): Promise<{ data: Incident[]; total: number }> {
    try {
      const res = await api.get('/incidents', { params });
      return res.data;
    } catch {
      let filtered = [...MOCK_INCIDENTS];
      if (params?.status && params.status !== 'ALL') {
        filtered = filtered.filter(i => i.status === params.status);
      }
      if (params?.category_id) {
        filtered = filtered.filter(i => i.category_id === params.category_id);
      }
      if (params?.search) {
        const s = params.search.toLowerCase();
        filtered = filtered.filter(i => i.title.toLowerCase().includes(s) || i.neighborhood.toLowerCase().includes(s));
      }
      return { data: filtered, total: filtered.length };
    }
  },

  async getById(id: string): Promise<Incident> {
    try {
      const res = await api.get(`/incidents/${id}`);
      return res.data.incident;
    } catch {
      const found = MOCK_INCIDENTS.find(i => i.id === id);
      if (!found) throw new Error('Ocorrência não encontrada');
      return found;
    }
  },

  async create(data: any): Promise<Incident> {
    try {
      const res = await api.post('/incidents', data);
      return res.data.incident;
    } catch {
      const cat = MOCK_CATEGORIES.find(c => c.id === data.category_id) || MOCK_CATEGORIES[0];
      const newInc: Incident = {
        id: `inc-${Date.now()}`,
        user_id: 'usr-cit-1',
        user_name: 'Usuário Ativo',
        category_id: cat.id,
        category_name: cat.name,
        category_icon: cat.icon,
        category_color: cat.color_hex,
        title: data.title,
        description: data.description,
        latitude: data.latitude,
        longitude: data.longitude,
        address_text: data.address_text,
        neighborhood: data.neighborhood,
        city: data.city || 'São Paulo',
        state: data.state || 'SP',
        status: 'PENDING',
        priority: data.priority || 'MEDIUM',
        upvotes_count: 0,
        has_voted: false,
        distance_meters: 100,
        images: data.image_urls?.map((url: string, i: number) => ({ id: `img-${i}`, incident_id: '', file_url: url, created_at: new Date().toISOString() })) || [],
        comments: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      MOCK_INCIDENTS.unshift(newInc);
      return newInc;
    }
  },

  async toggleVote(id: string): Promise<{ voted: boolean; totalUpvotes: number }> {
    try {
      const res = await api.post(`/incidents/${id}/vote`);
      return res.data;
    } catch {
      const inc = MOCK_INCIDENTS.find(i => i.id === id);
      if (inc) {
        inc.has_voted = !inc.has_voted;
        inc.upvotes_count = inc.has_voted ? inc.upvotes_count + 1 : Math.max(0, inc.upvotes_count - 1);
        return { voted: !!inc.has_voted, totalUpvotes: inc.upvotes_count };
      }
      return { voted: true, totalUpvotes: 1 };
    }
  },

  async addComment(id: string, content: string): Promise<any> {
    try {
      const res = await api.post(`/incidents/${id}/comments`, { content });
      return res.data.comment;
    } catch {
      const newComment = {
        id: `c-${Date.now()}`,
        incident_id: id,
        user_id: 'usr-1',
        user_name: 'Você',
        user_role: 'CITIZEN' as const,
        content,
        is_official_response: false,
        created_at: new Date().toISOString(),
      };
      const inc = MOCK_INCIDENTS.find(i => i.id === id);
      if (inc) {
        if (!inc.comments) inc.comments = [];
        inc.comments.push(newComment);
      }
      return newComment;
    }
  },
};

export const CategoriesAPI = {
  async list(): Promise<Category[]> {
    try {
      const res = await api.get('/categories');
      return res.data.categories;
    } catch {
      return MOCK_CATEGORIES;
    }
  },
};

export const ModerationAPI = {
  async updateStatus(id: string, data: { status: string; priority?: string; moderator_notes?: string }): Promise<Incident> {
    try {
      const res = await api.patch(`/moderation/incidents/${id}/status`, data);
      return res.data.incident;
    } catch {
      const inc = MOCK_INCIDENTS.find(i => i.id === id);
      if (inc) {
        inc.status = data.status as any;
        if (data.priority) inc.priority = data.priority as any;
        if (data.moderator_notes) {
          inc.moderator_notes = data.moderator_notes;
          if (!inc.comments) inc.comments = [];
          inc.comments.push({
            id: `c-${Date.now()}`,
            incident_id: id,
            user_id: 'mod-1',
            user_name: 'Equipe de Moderação',
            user_role: 'MODERATOR',
            content: `[Nota Oficial]: ${data.moderator_notes}`,
            is_official_response: true,
            created_at: new Date().toISOString(),
          });
        }
        if (data.status === 'RESOLVED') inc.resolved_at = new Date().toISOString();
        return inc;
      }
      throw new Error('Ocorrência não encontrada');
    }
  },
};

export const MetricsAPI = {
  async getDashboard(): Promise<DashboardMetrics> {
    try {
      const res = await api.get('/metrics/dashboard');
      return res.data;
    } catch {
      return MOCK_METRICS;
    }
  },
};

export const AuditAPI = {
  async list(params?: any): Promise<{ data: AuditLog[]; total: number }> {
    try {
      const res = await api.get('/audit', { params });
      return res.data;
    } catch {
      return { data: MOCK_AUDIT_LOGS, total: MOCK_AUDIT_LOGS.length };
    }
  },
};

export const UploadsAPI = {
  async uploadImage(file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data.file.url;
    } catch {
      // Retorna URL de blob local simulado se backend não estiver respondendo
      return URL.createObjectURL(file);
    }
  },
};
