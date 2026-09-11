import { z } from 'zod';

// Valores de exemplo/desenvolvimento. NUNCA devem chegar a um ambiente de produção —
// ver `getInsecureProductionIssues` abaixo, que bloqueia a inicialização se isso acontecer.
export const DEV_ONLY_JWT_SECRET = 'dev_only_insecure_default_jwt_secret_do_not_use_in_production';
export const DEV_ONLY_DB_PASSWORD = 'voz_secret_password';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3001),
  HOST: z.string().default('0.0.0.0'),
  // Única fonte de verdade da conexão com o banco. DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME
  // foram removidas por não serem lidas em nenhum lugar do código (config morta/enganosa).
  DATABASE_URL: z
    .string()
    .default(`postgresql://voz_user:${DEV_ONLY_DB_PASSWORD}@localhost:5432/voz_do_bairro`),
  JWT_SECRET: z.string().min(16).default(DEV_ONLY_JWT_SECRET),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('*'),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  RATE_LIMIT_TIME_WINDOW: z.coerce.number().default(60000),
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_SIZE_MB: z.coerce.number().default(5),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Retorna a lista de problemas de segurança que impedem subir em produção com
 * segredos/credenciais de exemplo. Função pura (sem process.exit) para ser testável.
 */
export function getInsecureProductionIssues(candidate: Env): string[] {
  if (candidate.NODE_ENV !== 'production') return [];

  const issues: string[] = [];
  if (candidate.JWT_SECRET === DEV_ONLY_JWT_SECRET || candidate.JWT_SECRET.length < 32) {
    issues.push(
      'JWT_SECRET está ausente, é o valor de exemplo do repositório ou é curto demais (mínimo 32 caracteres) para produção.'
    );
  }
  if (candidate.DATABASE_URL.includes(DEV_ONLY_DB_PASSWORD)) {
    issues.push(
      'DATABASE_URL contém a senha de exemplo do repositório — troque por uma credencial forte e exclusiva.'
    );
  }
  return issues;
}
