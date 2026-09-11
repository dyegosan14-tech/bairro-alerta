/**
 * Converte a variável de ambiente CORS_ORIGIN em uma configuração válida para @fastify/cors.
 * '*' (ou vazio) libera qualquer origem SEM credenciais (não é seguro combinar '*' com
 * credentials:true - o próprio navegador rejeita essa combinação). Uma lista separada por
 * vírgula habilita múltiplas origens específicas com credenciais permitidas.
 */
export function parseCorsOrigin(value: string): {
  origin: boolean | string[];
  credentials: boolean;
} {
  const trimmed = value.trim();
  if (trimmed === '' || trimmed === '*') {
    return { origin: true, credentials: false };
  }
  const origins = trimmed
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  return { origin: origins, credentials: true };
}
