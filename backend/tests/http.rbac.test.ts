import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';

// A camada de banco é mockada por completo: este arquivo testa o encanamento HTTP
// (autenticação, RBAC, roteamento, error handler) sem depender de um Postgres real —
// algo que a suíte de testes anterior nunca cobria (só testava schemas Zod isolados).
vi.mock('../src/database/pool.js', () => ({
  query: vi.fn(),
  withTransaction: vi.fn(async (fn: any) => fn({ query: vi.fn() })),
  pool: { connect: vi.fn(), end: vi.fn(), on: vi.fn() },
  testDbConnection: vi.fn().mockResolvedValue(true),
}));

const { query } = await import('../src/database/pool.js');
const { buildApp } = await import('../src/app.js');

const mockedQuery = vi.mocked(query);

// IDs em formato de UUID de verdade: as rotas com :id agora validam o formato via JSON
// Schema (correção aplicada nesta rodada), então qualquer ID de teste precisa ser um UUID
// sintaticamente válido para exercitar o comportamento além da própria validação de forma.
const CITIZEN_ID = '11111111-1111-1111-1111-111111111111';
const MODERATOR_ID = '22222222-2222-2222-2222-222222222222';
const ADMIN_ID = '33333333-3333-3333-3333-333333333333';
const OTHER_USER_ID = '44444444-4444-4444-4444-444444444444';
const INCIDENT_ID = '55555555-5555-5555-5555-555555555555';
const NONEXISTENT_INCIDENT_ID = '00000000-0000-0000-0000-000000000000';

function mockUserLookup(role: 'CITIZEN' | 'MODERATOR' | 'ADMIN', isActive = true) {
  // authenticate() relê o papel/status do usuário no banco a cada request — é essa
  // query que precisa ser mockada para simular cada cenário de RBAC.
  mockedQuery.mockResolvedValueOnce({ rows: [{ role, is_active: isActive }], rowCount: 1 } as any);
}

function emptyRows() {
  return { rows: [], rowCount: 0 } as any;
}

let app: FastifyInstance;
let citizenToken: string;
let moderatorToken: string;
let adminToken: string;

beforeAll(async () => {
  app = await buildApp();
  citizenToken = app.jwt.sign({
    id: CITIZEN_ID,
    name: 'Cidadão',
    email: 'citizen@example.com',
    role: 'CITIZEN',
  });
  moderatorToken = app.jwt.sign({
    id: MODERATOR_ID,
    name: 'Moderador',
    email: 'mod@example.com',
    role: 'MODERATOR',
  });
  adminToken = app.jwt.sign({
    id: ADMIN_ID,
    name: 'Admin',
    email: 'admin@example.com',
    role: 'ADMIN',
  });
});

afterAll(async () => {
  await app.close();
});

beforeEach(() => {
  mockedQuery.mockReset();
});

describe('GET /health — não exige autenticação nem banco', () => {
  it('responde 200 mesmo sem qualquer mock de banco configurado', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ status: 'ok' });
  });
});

describe('Autenticação — token ausente/inválido/usuário inativo', () => {
  it('bloqueia rota protegida sem token com 401', async () => {
    // Payload precisa passar na validação de schema do Fastify (que roda antes do
    // preHandler de autenticação) para este teste isolar de fato o comportamento de auth.
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/incidents',
      payload: {
        title: 'Poste apagado na rua principal',
        description: 'Rua sem iluminação há dias, moradores relatam insegurança.',
        category_id: OTHER_USER_ID,
        latitude: -23.55,
        longitude: -46.63,
        address_text: 'Rua Exemplo, 100',
        neighborhood: 'Centro',
      },
    });
    expect(res.statusCode).toBe(401);
  });

  it('bloqueia token de assinatura inválida com 401', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: { authorization: 'Bearer token-forjado-invalido' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('bloqueia com 401 quando o usuário do token foi desativado (is_active=false)', async () => {
    mockUserLookup('CITIZEN', false);
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/users/${CITIZEN_ID}`,
      headers: { authorization: `Bearer ${citizenToken}` },
    });
    expect(res.statusCode).toBe(401);
  });
});

describe('Validação de formato dos parâmetros :id (antes viravam 500 vindo do Postgres)', () => {
  it('POST /incidents/:id/vote com ID que não é UUID responde 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/incidents/nao-e-um-uuid/vote',
      headers: { authorization: `Bearer ${citizenToken}` },
    });
    expect(res.statusCode).toBe(400);
  });

  it('PATCH /moderation/incidents/:id/status com ID que não é UUID responde 400', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/moderation/incidents/nao-e-um-uuid/status',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { status: 'APPROVED' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('GET /users/:id com ID que não é UUID responde 400', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/users/nao-e-um-uuid',
      headers: { authorization: `Bearer ${citizenToken}` },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe('RBAC — CITIZEN bloqueado em rotas de moderação/administração', () => {
  it('CITIZEN recebe 403 ao tentar moderar uma ocorrência', async () => {
    mockUserLookup('CITIZEN');
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/moderation/incidents/${INCIDENT_ID}/status`,
      headers: { authorization: `Bearer ${citizenToken}` },
      payload: { status: 'APPROVED' },
    });
    expect(res.statusCode).toBe(403);
  });

  it('CITIZEN recebe 403 ao tentar alterar o papel de um usuário', async () => {
    mockUserLookup('CITIZEN');
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/users/${OTHER_USER_ID}/role`,
      headers: { authorization: `Bearer ${citizenToken}` },
      payload: { role: 'ADMIN' },
    });
    expect(res.statusCode).toBe(403);
  });

  it('CITIZEN recebe 403 ao tentar acessar a trilha de auditoria', async () => {
    mockUserLookup('CITIZEN');
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/audit',
      headers: { authorization: `Bearer ${citizenToken}` },
    });
    expect(res.statusCode).toBe(403);
  });
});

describe('RBAC — MODERATOR bloqueado em rotas exclusivas de ADMIN', () => {
  it('MODERATOR recebe 403 em GET /audit (só ADMIN)', async () => {
    mockUserLookup('MODERATOR');
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/audit',
      headers: { authorization: `Bearer ${moderatorToken}` },
    });
    expect(res.statusCode).toBe(403);
  });

  it('MODERATOR recebe 403 ao tentar alterar o papel de um usuário (só ADMIN)', async () => {
    mockUserLookup('MODERATOR');
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/users/${OTHER_USER_ID}/role`,
      headers: { authorization: `Bearer ${moderatorToken}` },
      payload: { role: 'ADMIN' },
    });
    expect(res.statusCode).toBe(403);
  });

  it('MODERATOR consegue moderar uma ocorrência normalmente (200)', async () => {
    mockUserLookup('MODERATOR'); // 1) authenticate relendo o papel no banco
    mockedQuery
      // ModerationService busca a ocorrência ANTES de validar a transição (findById #1:
      // SELECT principal + imagens + comentários)
      .mockResolvedValueOnce({
        rows: [{ id: INCIDENT_ID, status: 'PENDING', priority: 'MEDIUM', moderator_notes: null }],
        rowCount: 1,
      } as any)
      .mockResolvedValueOnce(emptyRows())
      .mockResolvedValueOnce(emptyRows())
      // AuditService.record (INSERT em audit_logs; retorno não é lido pelo código)
      .mockResolvedValueOnce(emptyRows())
      // ModerationService busca a ocorrência de novo para devolver na resposta (findById #2)
      .mockResolvedValueOnce({
        rows: [{ id: INCIDENT_ID, status: 'APPROVED', priority: 'MEDIUM', moderator_notes: null }],
        rowCount: 1,
      } as any)
      .mockResolvedValueOnce(emptyRows())
      .mockResolvedValueOnce(emptyRows());

    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/moderation/incidents/${INCIDENT_ID}/status`,
      headers: { authorization: `Bearer ${moderatorToken}` },
      payload: { status: 'APPROVED' },
    });
    expect(res.statusCode).toBe(200);
  });
});

describe('GET /users/:id — correção de IDOR (self ou ADMIN/MODERATOR apenas)', () => {
  it('bloqueia CITIZEN tentando ver o perfil de outro usuário (403)', async () => {
    mockUserLookup('CITIZEN');
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/users/${OTHER_USER_ID}`,
      headers: { authorization: `Bearer ${citizenToken}` },
    });
    expect(res.statusCode).toBe(403);
  });

  it('permite CITIZEN ver o próprio perfil (200)', async () => {
    mockUserLookup('CITIZEN');
    mockedQuery.mockResolvedValueOnce({
      rows: [{ id: CITIZEN_ID, role: 'CITIZEN' }],
      rowCount: 1,
    } as any);
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/users/${CITIZEN_ID}`,
      headers: { authorization: `Bearer ${citizenToken}` },
    });
    expect(res.statusCode).toBe(200);
  });

  it('permite ADMIN ver o perfil de qualquer usuário (200)', async () => {
    mockUserLookup('ADMIN');
    mockedQuery.mockResolvedValueOnce({
      rows: [{ id: OTHER_USER_ID, role: 'CITIZEN' }],
      rowCount: 1,
    } as any);
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/users/${OTHER_USER_ID}`,
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(res.statusCode).toBe(200);
  });
});

describe('Rotas públicas continuam acessíveis sem token', () => {
  it('GET /categories responde 200 sem autenticação', async () => {
    mockedQuery.mockResolvedValueOnce({
      rows: [{ id: 'cat-1', name: 'Iluminação' }],
      rowCount: 1,
    } as any);
    const res = await app.inject({ method: 'GET', url: '/api/v1/categories' });
    expect(res.statusCode).toBe(200);
  });

  it('GET /incidents/:id inexistente (mas com formato de UUID válido) responde 404 com corpo consistente e requestId rastreável', async () => {
    mockedQuery.mockResolvedValueOnce(emptyRows());
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/incidents/${NONEXISTENT_INCIDENT_ID}`,
    });
    expect(res.statusCode).toBe(404);
    const body = res.json();
    expect(body).toMatchObject({ statusCode: 404 });
    expect(typeof body.requestId).toBe('string');
    expect(body.requestId.length).toBeGreaterThan(0);
  });

  it('GET /incidents/:id com ID que não é um UUID responde 400 (antes seria um 500 vindo do Postgres)', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/incidents/nao-e-um-uuid' });
    expect(res.statusCode).toBe(400);
  });
});

describe('Moderação — transição de status inválida (máquina de estados)', () => {
  it('rejeita RESOLVED -> PENDING com 409', async () => {
    mockUserLookup('ADMIN');
    mockedQuery
      .mockResolvedValueOnce({
        rows: [{ id: INCIDENT_ID, status: 'RESOLVED', priority: 'MEDIUM', moderator_notes: null }],
        rowCount: 1,
      } as any)
      .mockResolvedValueOnce(emptyRows())
      .mockResolvedValueOnce(emptyRows());

    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/moderation/incidents/${INCIDENT_ID}/status`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { status: 'PENDING' },
    });
    expect(res.statusCode).toBe(409);
  });
});
