import { describe, it, expect, vi } from 'vitest';
import bcrypt from 'bcryptjs';
import { registerSchema, loginSchema } from '../src/modules/auth/auth.schema.js';

describe('Módulo de Autenticação - Schemas e Regras', () => {
  it('deve validar com sucesso um payload de cadastro de cidadão válido', () => {
    const validData = {
      name: 'João da Silva',
      email: 'joao.silva@exemplo.com.br',
      password: 'senha_segura_123',
      neighborhood: 'Vila Mariana',
      city: 'São Paulo',
    };

    const parsed = registerSchema.safeParse(validData);
    expect(parsed.success).toBe(true);
  });

  it('deve rejeitar cadastro com e-mail inválido', () => {
    const invalidData = {
      name: 'João',
      email: 'email_invalido_sem_arroba',
      password: '123456_valida',
    };

    const parsed = registerSchema.safeParse(invalidData);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0].message).toContain('E-mail inválido');
    }
  });

  it('deve rejeitar senha com menos de 6 caracteres', () => {
    const invalidData = {
      name: 'João',
      email: 'joao@teste.com',
      password: '123',
    };

    const parsed = registerSchema.safeParse(invalidData);
    expect(parsed.success).toBe(false);
  });

  it('deve gerar e verificar hashes bcrypt de senhas com segurança', async () => {
    const password = 'MinhaSenhaForte@2026';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    expect(hash).not.toBe(password);
    const isMatch = await bcrypt.compare(password, hash);
    expect(isMatch).toBe(true);

    const isWrongMatch = await bcrypt.compare('OutraSenha', hash);
    expect(isWrongMatch).toBe(false);
  });
});
