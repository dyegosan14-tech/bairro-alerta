import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'O nome deve ter no mínimo 2 caracteres').max(100),
  email: z.string().email('E-mail inválido').toLowerCase().trim(),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
  neighborhood: z.string().max(150).optional(),
  city: z.string().max(100).default('São Paulo'),
});

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido').toLowerCase().trim(),
  password: z.string().min(1, 'A senha é obrigatória'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
