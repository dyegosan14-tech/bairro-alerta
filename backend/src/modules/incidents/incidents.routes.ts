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
        querystring: {
          type: 'object',
          properties: {
            lat: { type: 'number', description: 'Latitude central para busca por raio' },
            lng: { type: 'number', description: 'Longitude central para busca por raio' },
            radius_km: { type: 'number', description: 'Raio de busca em quilômetros' },
            status: { type: 'string', enum: ['PENDING', 'APPROVED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED', 'ALL'] },
            category_id: { type: 'string' },
            neighborhood: { type: 'string' },
            search: { type: 'string' },
            limit: { type: 'number', default: 50 },
            offset: { type: 'number', default: 0 },
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
        body: {
          type: 'object',
          required: ['title', 'description', 'category_id', 'latitude', 'longitude', 'address_text', 'neighborhood'],
          properties: {
            title: { type: 'string', minLength: 5 },
            description: { type: 'string', minLength: 10 },
            category_id: { type: 'string' },
            latitude: { type: 'number' },
            longitude: { type: 'number' },
            address_text: { type: 'string' },
            neighborhood: { type: 'string' },
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
        body: {
          type: 'object',
          required: ['content'],
          properties: {
            content: { type: 'string', minLength: 2 },
          },
        },
      },
    },
    IncidentsController.addComment
  );
}
