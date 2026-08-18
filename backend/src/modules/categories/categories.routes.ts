import { FastifyInstance } from 'fastify';
import { CategoriesController } from './categories.controller.js';
import { authenticate, requireRole } from '../../middlewares/auth.middleware.js';

export async function categoriesRoutes(app: FastifyInstance) {
  app.get(
    '/',
    {
      schema: {
        tags: ['Categorias'],
        summary: 'Listar todas as categorias urbanas ativas',
      },
    },
    CategoriesController.list
  );

  app.post(
    '/',
    {
      preHandler: [authenticate, requireRole(['ADMIN'])],
      schema: {
        tags: ['Categorias'],
        summary: 'Criar nova categoria urbana (Apenas Admin)',
      },
    },
    CategoriesController.create
  );
}
