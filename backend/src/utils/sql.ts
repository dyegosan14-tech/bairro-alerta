/**
 * Escapa os caracteres especiais do operador LIKE/ILIKE do PostgreSQL (%, _ e a própria
 * barra invertida) antes de embutir uma entrada do usuário num padrão de busca.
 *
 * Sem isso, um usuário buscando literalmente por "50%" ou "raio_x" (por exemplo) tem os
 * caracteres tratados como curinga em vez de texto literal — não é uma injeção de SQL (o
 * valor já era parametrizado via $n), mas produz resultados incorretos.
 */
export function escapeLikePattern(input: string): string {
  return input.replace(/[\\%_]/g, (match) => `\\${match}`);
}
