import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { logger } from '../config/logger.js';

export function errorHandler(error: FastifyError, request: FastifyRequest, reply: FastifyReply) {
  logger.error({
    err: error,
    url: request.url,
    method: request.method,
    ip: request.ip,
  }, 'Erro durante o processamento da requisição');

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
    });
  }

  // Erro de Rate Limit
  if (error.statusCode === 429) {
    return reply.status(429).send({
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'Você atingiu o limite de requisições. Aguarde alguns instantes e tente novamente.',
    });
  }

  // Erro de Unicidade do PostgreSQL (Unique Constraint)
  if ((error as any).code === '23505') {
    return reply.status(409).send({
      statusCode: 409,
      error: 'Conflict',
      message: 'Já existe um registro com os mesmos dados únicos (ex: email ou slug duplicado).',
    });
  }

  // Status code explícito ou 500 padrão
  const statusCode = error.statusCode || 500;
  const message = statusCode === 500 ? 'Erro interno no servidor' : error.message;

  return reply.status(statusCode).send({
    statusCode,
    error: error.name || 'InternalServerError',
    message,
  });
}
