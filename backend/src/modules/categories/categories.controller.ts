import { FastifyRequest, FastifyReply } from 'fastify';
import { CategoriesService } from './categories.service.js';
import { z } from 'zod';

const createCategorySchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(100),
  description: z.string().optional(),
  icon: z.string().min(1),
  color_hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor hexadecimal inválida (#RRGGBB)'),
});

export class CategoriesController {
  static async list(_request: FastifyRequest, reply: FastifyReply) {
    const categories = await CategoriesService.list();
    return reply.send({ categories });
  }

  static async create(request: FastifyRequest, reply: FastifyReply) {
    const body = createCategorySchema.parse(request.body);
    const category = await CategoriesService.create(body);
    return reply.status(201).send({ category });
  }
}
