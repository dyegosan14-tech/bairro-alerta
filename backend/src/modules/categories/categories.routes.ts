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
        // Antes não havia nenhum body schema aqui — o Swagger não documentava o payload
        // esperado, apesar do controller já validar com createCategorySchema (Zod).
        body: {
          type: 'object',
          required: ['name', 'slug', 'icon', 'color_hex'],
          properties: {
            name: { type: 'string', minLength: 2, maxLength: 100 },
            slug: { type: 'string', minLength: 2, maxLength: 100 },
            description: { type: 'string' },
            icon: { type: 'string', minLength: 1 },
            color_hex: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
          },
        },
      },
    },
    CategoriesController.create
  );
}
