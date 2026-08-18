import pg from 'pg';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  logger.error({ err }, 'Erro inesperado no pool do PostgreSQL');
});

/**
 * Executa uma query no PostgreSQL. Se falhar por falta de conexão, loga aviso.
 */
export async function query<T extends pg.QueryResultRow = any>(text: string, params?: any[]): Promise<pg.QueryResult<T>> {
  const start = Date.now();
  try {
    const res = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    if (env.NODE_ENV === 'development') {
      logger.debug({ text, duration, rows: res.rowCount }, 'Executou query SQL');
    }
    return res;
  } catch (error) {
    logger.error({ error, text, params }, 'Falha na execução da query SQL');
    throw error;
  }
}

/**
 * Testa e verifica a conectividade com o PostgreSQL e PostGIS
 */
export async function testDbConnection(): Promise<boolean> {
  try {
    const res = await pool.query('SELECT postgis_full_version() AS postgis_version;');
    logger.info({ version: res.rows[0]?.postgis_version }, '🐘 PostgreSQL + PostGIS conectado com sucesso!');
    return true;
  } catch (err: any) {
    logger.warn({ message: err.message }, '⚠️ Não foi possível conectar ao PostgreSQL/PostGIS. Verifique o Docker Compose ou a DATABASE_URL.');
    return false;
  }
}
