import { describe, it, expect } from 'vitest';
import { parseCorsOrigin } from '../src/utils/cors.js';

describe('parseCorsOrigin — CORS_ORIGIN passa a ser respeitado pelo app (antes era ignorado)', () => {
  it("'*' libera qualquer origem e desativa credenciais (nunca combine wildcard com credentials)", () => {
    expect(parseCorsOrigin('*')).toEqual({ origin: true, credentials: false });
  });

  it('string vazia se comporta como coringa (mesmo default seguro)', () => {
    expect(parseCorsOrigin('')).toEqual({ origin: true, credentials: false });
  });

  it('uma origem específica habilita credenciais', () => {
    expect(parseCorsOrigin('https://vozdobairro.example.com')).toEqual({
      origin: ['https://vozdobairro.example.com'],
      credentials: true,
    });
  });

  it('múltiplas origens separadas por vírgula viram uma lista, com espaços aparados', () => {
    expect(parseCorsOrigin('https://a.example.com, https://b.example.com')).toEqual({
      origin: ['https://a.example.com', 'https://b.example.com'],
      credentials: true,
    });
  });
});
