import { z } from 'zod';

export const updateIncidentStatusSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  moderator_notes: z.string().max(1000).optional(),
});

export type UpdateIncidentStatusInput = z.infer<typeof updateIncidentStatusSchema>;
