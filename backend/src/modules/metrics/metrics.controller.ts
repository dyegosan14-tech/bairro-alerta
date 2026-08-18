import { FastifyRequest, FastifyReply } from 'fastify';
import { MetricsService } from './metrics.service.js';

export class MetricsController {
  static async getDashboard(_request: FastifyRequest, reply: FastifyReply) {
    const metrics = await MetricsService.getDashboardMetrics();
    return reply.send(metrics);
  }
}
