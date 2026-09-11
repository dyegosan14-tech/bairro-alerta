import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { pool, query, withTransaction } from '../../src/database/pool.js';
import { runMigrations } from '../../src/database/migrate.js';

// Testes de integração REAIS contra Postgres/PostGIS — sem mocks. Diferente do resto da
// suíte (que mocka a camada de banco para testar lógica de RBAC/serviço isoladamente),
// aqui o objetivo é provar que ST_DWithin/ST_MakePoint/ST_Distance realmente se comportam
// como o código assume (ordem longitude/latitude, unidade metros vs km, pontos na borda
// do raio). Isso exige um Postgres com PostGIS de verdade acessível via DATABASE_URL.
//
// A checagem de conectividade roda aqui em cima do arquivo, com top-level await, ANTES de
// qualquer describe() ser registrado — describe.skipIf() precisa de um boolean já
// resolvido no momento da coleta dos testes, não de uma função/callback. Se passássemos
// uma arrow function para skipIf/runIf, ela seria sempre "truthy" (é um objeto função) e
// os testes tentariam rodar mesmo sem banco, falhando com erro de conexão em vez de
// simplesmente pular — que é exatamente o comportamento que este arquivo tem que evitar
// em ambientes sem Docker/Postgres (como o usado nesta própria auditoria).
// O pool compartilhado tem connectionTimeoutMillis de 5s (adequado para uso real da app),
// o que deixaria TODA a suíte de testes 5s mais lenta só para descobrir que não há banco
// disponível. Usa um prazo bem mais curto (800ms) apenas para esta sondagem inicial.
async function checkDbAvailable(): Promise<boolean> {
  const withShortTimeout = <T>(p: Promise<T>): Promise<T> => {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), 800)
    );
    // Se a query real perder a corrida contra o timeout, ela ainda vai settlear mais
    // tarde — o .catch aqui evita um "unhandled promise rejection" nesse caso.
    p.catch(() => {});
    return Promise.race([p, timeout]);
  };

  try {
    await withShortTimeout(pool.query('SELECT 1'));
    const ext = await withShortTimeout(
      pool.query("SELECT 1 FROM pg_extension WHERE extname = 'postgis'")
    );
    return (ext.rowCount ?? 0) > 0;
  } catch {
    return false;
  }
}

const dbAvailable = await checkDbAvailable();

if (!dbAvailable) {
  // eslint-disable-next-line no-console
  console.warn(
    '[postgis.integration.test.ts] Nenhum Postgres/PostGIS alcançável via DATABASE_URL — ' +
      'pulando os testes de integração geoespacial (isso é esperado fora do docker-compose/CI).'
  );
}

describe.skipIf(!dbAvailable)(
  'PostGIS — ST_DWithin / ST_MakePoint / ST_Distance (integração real)',
  () => {
    const TEST_CATEGORY_SLUG = 'audit-integration-test-category';
    // Praça da Sé, SP — mesmo ponto de referência usado no teste unitário de Haversine.
    const CENTER = { lat: -23.5505, lng: -46.6333 };
    let categoryId: string;
    let userId: string;
    const createdIncidentIds: string[] = [];

    beforeAll(async () => {
      await withTransaction(async (client) => {
        const cat = await client.query(
          `INSERT INTO categories (name, slug, icon, color_hex)
         VALUES ('Categoria de Teste de Auditoria', $1, 'Test', '#000000')
         ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
          [TEST_CATEGORY_SLUG]
        );
        categoryId = cat.rows[0].id;

        const user = await client.query(
          `INSERT INTO users (name, email, password_hash, role)
         VALUES ('Usuário de Teste de Auditoria', 'audit-integration-test@example.com', 'x', 'CITIZEN')
         ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`
        );
        userId = user.rows[0].id;
      });

      // Um ponto a ~1km do centro (dentro de um raio de 5km) e outro bem mais longe (fora).
      const NEAR_LAT = -23.5595; // ~1km ao sul da Sé
      const NEAR_LNG = -46.6333;
      const FAR_LAT = -24.0; // ~50km+ de distância
      const FAR_LNG = -46.6333;

      for (const [lat, lng, title] of [
        [NEAR_LAT, NEAR_LNG, 'Ocorrência de teste PERTO'],
        [FAR_LAT, FAR_LNG, 'Ocorrência de teste LONGE'],
      ] as const) {
        const res = await query(
          `INSERT INTO incidents (user_id, category_id, title, description, location, address_text, neighborhood, city, state, priority, status)
         VALUES ($1, $2, $3, 'Descrição de teste de integração com mais de dez caracteres.',
                 ST_SetSRID(ST_MakePoint($4, $5), 4326), 'Endereço de teste', 'Bairro de teste',
                 'São Paulo', 'SP', 'MEDIUM', 'APPROVED')
         RETURNING id`,
          [userId, categoryId, title, lng, lat]
        );
        createdIncidentIds.push(res.rows[0].id);
      }
    }, 15_000);

    afterAll(async () => {
      // Limpeza: os testes não devem deixar rastro no banco.
      for (const id of createdIncidentIds) {
        await query('DELETE FROM incidents WHERE id = $1', [id]).catch(() => {});
      }
      await query('DELETE FROM users WHERE id = $1', [userId]).catch(() => {});
      await query('DELETE FROM categories WHERE id = $1', [categoryId]).catch(() => {});
    });

    it('ST_DWithin em geography inclui pontos dentro do raio e exclui os de fora', async () => {
      const radiusMeters = 5000; // 5km
      const res = await query(
        `SELECT id, title FROM incidents
       WHERE category_id = $1
         AND ST_DWithin(location::geography, ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography, $4)`,
        [categoryId, CENTER.lng, CENTER.lat, radiusMeters]
      );

      const titles = res.rows.map((r: any) => r.title);
      expect(titles).toContain('Ocorrência de teste PERTO');
      expect(titles).not.toContain('Ocorrência de teste LONGE');
    });

    it('ST_Distance calcula a distância em metros consistente com a ordem longitude/latitude de ST_MakePoint', async () => {
      const res = await query(
        `SELECT title, ST_Distance(location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) as distance_meters
       FROM incidents
       WHERE category_id = $3 AND title = 'Ocorrência de teste PERTO'`,
        [CENTER.lng, CENTER.lat, categoryId]
      );

      const distanceMeters = parseFloat(res.rows[0].distance_meters);
      // O ponto foi construído a ~1km ao sul do centro — se a ordem lng/lat estivesse
      // trocada em algum lugar do código, essa distância sairia grosseiramente diferente
      // (tipicamente milhares de km, já que trocar lat/lng move o ponto para outro
      // continente/hemisfério).
      expect(distanceMeters).toBeGreaterThan(500);
      expect(distanceMeters).toBeLessThan(1500);
    });

    it('ST_X/ST_Y devolvem de volta a mesma longitude/latitude que foram gravadas (round-trip)', async () => {
      const res = await query(
        `SELECT ST_X(location::geometry) as longitude, ST_Y(location::geometry) as latitude
       FROM incidents
       WHERE category_id = $1 AND title = 'Ocorrência de teste PERTO'`,
        [categoryId]
      );

      expect(parseFloat(res.rows[0].longitude)).toBeCloseTo(-46.6333, 3);
      expect(parseFloat(res.rows[0].latitude)).toBeCloseTo(-23.5595, 3);
    });
  }
);

describe.skipIf(!dbAvailable)('Migrations idempotentes (integração real)', () => {
  it('rodar as migrations duas vezes seguidas não lança erro', async () => {
    await expect(runMigrations()).resolves.not.toThrow();
    await expect(runMigrations()).resolves.not.toThrow();
  });
});

// Encerra o pool só se este arquivo de fato usou uma conexão real — em ambientes sem
// banco, `pool` nunca chegou a abrir uma conexão de verdade (só falhou o SELECT 1 acima).
afterAll(async () => {
  if (dbAvailable) {
    await pool.end().catch(() => {});
  }
});
