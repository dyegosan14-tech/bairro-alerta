import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, query } from './pool.js';
import { logger } from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations() {
  logger.info('🚀 Iniciando execução de migrations do banco de dados...');
  try {
    const sqlPath = path.join(__dirname, 'init.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    await query(sqlContent);
    logger.info('✅ Migrations executadas com sucesso! Extensões, tabelas e índices PostGIS criados.');
  } catch (error) {
    logger.error({ error }, '❌ Erro ao executar migrations');
    throw error;
  }
}

// Se executado diretamente via linha de comando
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations()
    .then(() => pool.end())
    .catch(() => process.exit(1));
}
