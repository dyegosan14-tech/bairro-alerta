import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { logger } from '../config/logger.js';

export function errorHandler(error: FastifyError, request: FastifyRequest, reply: FastifyReply) {
  // request.id (gerado pelo Fastify por request) correlaciona esta entrada de log com o
  // requestId devolvido ao cliente abaixo — antes não havia como ligar um erro relatado
  // pelo usuário a uma linha específica do log do servidor.
  logger.error(
    {
      err: error,
      url: request.url,
      method: request.method,
      ip: request.ip,
      requestId: request.id,
    },
    'Erro durante o processamento da requisição'
  );

  // Ponto de integração para um APM/rastreador de erros (ex.: Sentry, OpenTelemetry): não
  // adicionamos o SDK agora por não haver um DSN/projeto configurado nem como validar a
  // integração neste ambiente, mas aqui é onde ela entraria — só para erros inesperados
  // (5xx), nunca para 4xx esperados (validação, permissão, etc.), para não afogar o
  // rastreador com "erros" que já são tratados normalmente pela aplicação:
  //
  //   if ((error.statusCode ?? 500) >= 500) {
  //     Sentry.captureException(error, { tags: { requestId: request.id } });
  //   }

  // Erro de Validação de Schema (Zod)
  if (error instanceof ZodError) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Falha na validação dos dados enviados',
      issues: error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
      requestId: request.id,
    });
  }

  // Erro de Rate Limit
  if (error.statusCode === 429) {
    return reply.status(429).send({
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'Você atingiu o limite de requisições. Aguarde alguns instantes e tente novamente.',
      requestId: request.id,
    });
  }

  // Erro de Unicidade do PostgreSQL (Unique Constraint)
  if ((error as any).code === '23505') {
    return reply.status(409).send({
      statusCode: 409,
      error: 'Conflict',
      message: 'Já existe um registro com os mesmos dados únicos (ex: email ou slug duplicado).',
      requestId: request.id,
    });
  }

  // Status code explícito ou 500 padrão
  const statusCode = error.statusCode || 500;
  const message = statusCode === 500 ? 'Erro interno no servidor' : error.message;

  return reply.status(statusCode).send({
    statusCode,
    error: error.name || 'InternalServerError',
    message,
    requestId: request.id,
  });
}
