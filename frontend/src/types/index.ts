export type UserRole = 'CITIZEN' | 'MODERATOR' | 'ADMIN';

export type IncidentStatus = 'PENDING' | 'APPROVED' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';

export type IncidentPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar_url?: string | null;
  neighborhood?: string | null;
  city: string;
  is_active: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  color_hex: string;
  is_active: boolean;
}

export interface IncidentImage {
  id: string;
  incident_id: string;
  file_url: string;
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
  created_at: string;
}

export interface DashboardMetrics {
  summary: {
    total_incidents: number;
    pending_count: number;
    in_progress_count: number;
    resolved_count: number;
    rejected_count: number;
    resolution_rate_percentage: number;
    total_upvotes: number;
    avg_resolution_hours: number;
  };
  by_category: Array<{
    category_id: string;
    category_name: string;
    category_color: string;
    count: number;
  }>;
  by_status: Array<{
    status: string;
    count: number;
  }>;
  top_neighborhoods: Array<{
    neighborhood: string;
    total: number;
    resolved: number;
  }>;
  recent_trend: Array<{
    date: string;
    count: number;
  }>;
}
