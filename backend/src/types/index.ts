export type UserRole = 'CITIZEN' | 'MODERATOR' | 'ADMIN';

export type IncidentStatus = 'PENDING' | 'APPROVED' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';

export type IncidentPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface User {
  id: string;
  name: string;
  email: string;
  password_hash?: string;
  role: UserRole;
  avatar_url?: string | null;
  neighborhood?: string | null;
  city: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  color_hex: string;
  is_active: boolean;
  created_at: string;
}

export interface IncidentLocation {
  latitude: number;
  longitude: number;
}

export interface IncidentImage {
  id: string;
  incident_id: string;
  file_url: string;
  original_name?: string;
  mime_type?: string;
  file_size_bytes?: number;
  created_at: string;
}

export interface IncidentComment {
  id: string;
  incident_id: string;
  user_id: string;
  user_name?: string;
  user_role?: UserRole;
  content: string;
  is_official_response: boolean;
  created_at: string;
}

export interface Incident {
  id: string;
  user_id: string;
  user_name?: string;
  category_id: string;
  category_name?: string;
  category_icon?: string;
  category_color?: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  address_text: string;
  neighborhood: string;
  city: string;
  state: string;
  status: IncidentStatus;
  priority: IncidentPriority;
  upvotes_count: number;
  has_voted?: boolean;
  distance_meters?: number;
  moderator_notes?: string | null;
  moderated_by?: string | null;
  moderated_at?: string | null;
  resolved_at?: string | null;
  images?: IncidentImage[];
  comments?: IncidentComment[];
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  actor_id?: string | null;
  actor_email?: string | null;
  actor_role?: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  old_values?: Record<string, any> | null;
  new_values?: Record<string, any> | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
}

export interface JWTPayload {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JWTPayload;
    user: JWTPayload;
  }
}
