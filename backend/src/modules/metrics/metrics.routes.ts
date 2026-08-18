import { FastifyInstance } from 'fastify';
import { MetricsController } from './metrics.controller.js';

export async function metricsRoutes(app: FastifyInstance) {
  app.get(
    '/dashboard',
    {
      schema: {
        tags: ['Métricas'],
        summary: 'Obter indicadores consolidados de atendimento e desempenho do município',
      },
    },
    MetricsController.getDashboard
  );
}
