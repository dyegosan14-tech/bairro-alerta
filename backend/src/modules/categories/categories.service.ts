import { query } from '../../database/pool.js';
import { Category } from '../../types/index.js';

export class CategoriesService {
  static async list(): Promise<Category[]> {
    const res = await query<Category>(`
      SELECT id, name, slug, description, icon, color_hex, is_active, created_at
      FROM categories
      WHERE is_active = true
      ORDER BY name ASC
    `);
    return res.rows;
  }

  static async create(data: { name: string; slug: string; description?: string; icon: string; color_hex: string }): Promise<Category> {
    const res = await query<Category>(`
      INSERT INTO categories (name, slug, description, icon, color_hex)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, slug, description, icon, color_hex, is_active, created_at
    `, [data.name, data.slug, data.description || null, data.icon, data.color_hex]);

    return res.rows[0];
  }
}
