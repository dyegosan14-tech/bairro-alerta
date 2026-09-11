import { z } from 'zod';

export const createIncidentSchema = z.object({
  title: z.string().min(5, 'Título deve ter no mínimo 5 caracteres').max(200),
  description: z.string().min(10, 'Descrição detalhada deve ter no mínimo 10 caracteres'),
  category_id: z.string().uuid('ID de categoria inválido'),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  address_text: z.string().min(3).max(255),
  neighborhood: z.string().min(2).max(150),
  city: z.string().max(100).default('São Paulo'),
  state: z.string().max(50).default('SP'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  image_urls: z.array(z.string()).optional().default([]),
});

export const listIncidentsQuerySchema = z.object({
  // Parâmetros de busca geoespacial
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radius_km: z.coerce.number().positive().max(100).optional(), // Raio em km

  // Filtros convencionais
  status: z.enum(['PENDING', 'APPROVED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED', 'ALL']).optional(),
  category_id: z.string().uuid().optional(),
  neighborhood: z.string().optional(),
  search: z.string().optional(),
  user_id: z.string().uuid().optional(),

  // Paginação
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

export const addCommentSchema = z.object({
  content: z.string().min(2, 'O comentário não pode ficar vazio').max(1000),
});

export type CreateIncidentInput = z.infer<typeof createIncidentSchema>;
export type ListIncidentsQuery = z.infer<typeof listIncidentsQuerySchema>;
