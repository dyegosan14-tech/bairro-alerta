import { FastifyInstance } from 'fastify';
import { IncidentsController } from './incidents.controller.js';
import { authenticate, optionalAuthenticate } from '../../middlewares/auth.middleware.js';

export async function incidentsRoutes(app: FastifyInstance) {
  app.get(
    '/',
    {
      preHandler: [optionalAuthenticate],
      schema: {
        tags: ['Ocorrências'],
        summary: 'Listar ocorrências com filtros espaciais (raio PostGIS), status ou categoria',
        // Limites alinhados com incidents.schema.ts (listIncidentsQuerySchema) — este JSON
        // Schema também define o contrato documentado no Swagger, então precisa refletir
        // as mesmas regras que o Zod realmente aplica no controller.
        querystring: {
          type: 'object',
          properties: {
            lat: {
              type: 'number',
              minimum: -90,
              maximum: 90,
              description: 'Latitude central para busca por raio',
            },
            lng: {
              type: 'number',
              minimum: -180,
              maximum: 180,
              description: 'Longitude central para busca por raio',
            },
            radius_km: {
              type: 'number',
              exclusiveMinimum: 0,
              maximum: 100,
              description: 'Raio de busca em quilômetros (máx. 100km)',
            },
            status: {
              type: 'string',
              enum: ['PENDING', 'APPROVED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED', 'ALL'],
            },
            category_id: { type: 'string', format: 'uuid' },
            user_id: { type: 'string', format: 'uuid' },
            neighborhood: { type: 'string' },
            search: { type: 'string' },
            limit: { type: 'number', minimum: 1, maximum: 100, default: 50 },
            offset: { type: 'number', minimum: 0, default: 0 },
          },
        },
      },
    },
    IncidentsController.list
  );

  app.get(
    '/:id',
    {
      preHandler: [optionalAuthenticate],
      schema: {
        tags: ['Ocorrências'],
        summary: 'Obter detalhes de uma ocorrência por ID (com fotos e comentários)',
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
        },
      },
    },
    IncidentsController.getById
  );

  app.post(
    '/',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['Ocorrências'],
        summary: 'Criar nova ocorrência com coordenadas geográficas',
        // Limites alinhados com incidents.schema.ts (createIncidentSchema).
        body: {
          type: 'object',
          required: [
            'title',
            'description',
            'category_id',
            'latitude',
            'longitude',
            'address_text',
            'neighborhood',
          ],
          properties: {
            title: { type: 'string', minLength: 5, maxLength: 200 },
            description: { type: 'string', minLength: 10 },
            category_id: { type: 'string', format: 'uuid' },
            latitude: { type: 'number', minimum: -90, maximum: 90 },
            longitude: { type: 'number', minimum: -180, maximum: 180 },
            address_text: { type: 'string', minLength: 3, maxLength: 255 },
            neighborhood: { type: 'string', minLength: 2, maxLength: 150 },
            city: { type: 'string', maxLength: 100 },
            state: { type: 'string', maxLength: 50 },
            priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
            image_urls: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    },
    IncidentsController.create
  );

  app.post(
    '/:id/vote',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['Ocorrências'],
        summary: 'Apoiar/Desapoiar (upvote) uma ocorrência comunitária',
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
        },
      },
    },
    IncidentsController.toggleVote
  );

  app.post(
    '/:id/comments',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['Ocorrências'],
        summary: 'Adicionar comentário ou atualização pública na ocorrência',
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
        },
        body: {
          type: 'object',
          required: ['content'],
          properties: {
            content: { type: 'string', minLength: 2, maxLength: 1000 },
          },
        },
      },
    },
    IncidentsController.addComment
  );
}
