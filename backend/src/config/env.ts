import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3001),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string().default('postgresql://voz_user:voz_secret_password@localhost:5432/voz_do_bairro'),
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().default(5432),
  DB_USER: z.string().default('voz_user'),
  DB_PASSWORD: z.string().default('voz_secret_password'),
  DB_NAME: z.string().default('voz_do_bairro'),
  JWT_SECRET: z.string().min(16).default('super_secret_jwt_key_voz_do_bairro_change_in_production_2026_xYz'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('*'),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  RATE_LIMIT_TIME_WINDOW: z.coerce.number().default(60000),
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_SIZE_MB: z.coerce.number().default(5),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Configuração inválida de variáveis de ambiente:', _env.error.format());
  process.exit(1);
}

export const env = _env.data;
