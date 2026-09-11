import dotenv from 'dotenv';
import { envSchema, getInsecureProductionIssues } from './env.schema.js';

export {
  DEV_ONLY_JWT_SECRET,
  DEV_ONLY_DB_PASSWORD,
  getInsecureProductionIssues,
} from './env.schema.js';
export type { Env } from './env.schema.js';

dotenv.config();

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Configuração inválida de variáveis de ambiente:', _env.error.format());
  process.exit(1);
}

const insecureProductionIssues = getInsecureProductionIssues(_env.data);
if (insecureProductionIssues.length > 0) {
  console.error('❌ Configuração insegura para produção detectada:');
  for (const issue of insecureProductionIssues) {
    console.error(`   - ${issue}`);
  }
  process.exit(1);
}

export const env = _env.data;
