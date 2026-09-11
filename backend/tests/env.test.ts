import { describe, it, expect } from 'vitest';
import {
  getInsecureProductionIssues,
  DEV_ONLY_JWT_SECRET,
  DEV_ONLY_DB_PASSWORD,
  Env,
} from '../src/config/env.schema.js';

function baseEnv(overrides: Partial<Env> = {}): Env {
  return {
    NODE_ENV: 'production',
    PORT: 3001,
    HOST: '0.0.0.0',
    DATABASE_URL: 'postgresql://voz_user:uma_senha_forte_e_unica@db.internal:5432/voz_do_bairro',
    JWT_SECRET: 'a'.repeat(40),
    JWT_EXPIRES_IN: '7d',
    CORS_ORIGIN: 'https://vozdobairro.example.com',
    RATE_LIMIT_MAX: 100,
    RATE_LIMIT_TIME_WINDOW: 60000,
    UPLOAD_DIR: './uploads',
    MAX_FILE_SIZE_MB: 5,
    ...overrides,
  };
}

describe('getInsecureProductionIssues — bloqueio de segredos fracos em produção', () => {
  it('não reporta problemas fora de produção, mesmo com segredo de exemplo', () => {
    const issues = getInsecureProductionIssues(
      baseEnv({ NODE_ENV: 'development', JWT_SECRET: DEV_ONLY_JWT_SECRET })
    );
    expect(issues).toHaveLength(0);
  });

  it('não reporta problemas em produção com um segredo forte e senha customizada', () => {
    const issues = getInsecureProductionIssues(baseEnv());
    expect(issues).toHaveLength(0);
  });

  it('reporta problema quando JWT_SECRET é o valor de exemplo do repositório em produção', () => {
    const issues = getInsecureProductionIssues(baseEnv({ JWT_SECRET: DEV_ONLY_JWT_SECRET }));
    expect(issues.some((i) => i.includes('JWT_SECRET'))).toBe(true);
  });

  it('reporta problema quando JWT_SECRET é curto demais em produção', () => {
    const issues = getInsecureProductionIssues(baseEnv({ JWT_SECRET: 'curto123' }));
    expect(issues.some((i) => i.includes('JWT_SECRET'))).toBe(true);
  });

  it('reporta problema quando DATABASE_URL usa a senha de exemplo do repositório', () => {
    const issues = getInsecureProductionIssues(
      baseEnv({
        DATABASE_URL: `postgresql://voz_user:${DEV_ONLY_DB_PASSWORD}@db.internal:5432/voz_do_bairro`,
      })
    );
    expect(issues.some((i) => i.includes('DATABASE_URL'))).toBe(true);
  });
});
