import { describe, it, expect } from 'vitest';
import { escapeLikePattern } from '../src/utils/sql.js';

describe('escapeLikePattern — busca por bairro/texto não trata % e _ do usuário como curinga', () => {
  it('escapa % literal', () => {
    expect(escapeLikePattern('50% de desconto')).toBe('50\\% de desconto');
  });

  it('escapa _ literal', () => {
    expect(escapeLikePattern('raio_x')).toBe('raio\\_x');
  });

  it('escapa a própria barra invertida antes de tudo (evita escapar em dobro)', () => {
    expect(escapeLikePattern('C:\\pasta')).toBe('C:\\\\pasta');
  });

  it('não altera texto sem caracteres especiais de LIKE', () => {
    expect(escapeLikePattern('Vila Mariana')).toBe('Vila Mariana');
  });
});
