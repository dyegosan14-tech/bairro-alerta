-- =============================================================================
-- Voz do Bairro - Schema de Banco de Dados com PostgreSQL e PostGIS
-- =============================================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- -----------------------------------------------------------------------------
-- Tipos Enumerados (ENUMs)
-- -----------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('CITIZEN', 'MODERATOR', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE incident_status AS ENUM ('PENDING', 'APPROVED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE incident_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- -----------------------------------------------------------------------------
-- Tabela de Usuários (Users & RBAC)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'CITIZEN' NOT NULL,
    avatar_url TEXT,
    neighborhood VARCHAR(150),
    city VARCHAR(100) DEFAULT 'São Paulo',
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- -----------------------------------------------------------------------------
-- Tabela de Categorias Urbanas (Categories)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50) NOT NULL, -- nome do ícone Lucide
    color_hex VARCHAR(20) DEFAULT '#3B82F6' NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- -----------------------------------------------------------------------------
-- Tabela de Ocorrências (Incidents com PostGIS Geometry)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    
    -- Ponto Geográfico PostGIS (Longitude, Latitude) no sistema de referência WGS84 (SRID 4326)
    location GEOMETRY(Point, 4326) NOT NULL,
    
    address_text VARCHAR(255) NOT NULL,
    neighborhood VARCHAR(150) NOT NULL,
    city VARCHAR(100) DEFAULT 'São Paulo' NOT NULL,
    state VARCHAR(50) DEFAULT 'SP' NOT NULL,
    
    status incident_status DEFAULT 'PENDING' NOT NULL,
    priority incident_priority DEFAULT 'MEDIUM' NOT NULL,
    
    upvotes_count INTEGER DEFAULT 0 NOT NULL,
    moderator_notes TEXT,
    moderated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    moderated_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Índice Espacial GiST para consultas de raio e proximidade ultrarrápidas
CREATE INDEX IF NOT EXISTS idx_incidents_location ON incidents USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents (status);
CREATE INDEX IF NOT EXISTS idx_incidents_category_id ON incidents (category_id);
CREATE INDEX IF NOT EXISTS idx_incidents_user_id ON incidents (user_id);
CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON incidents (created_at DESC);

-- -----------------------------------------------------------------------------
-- Tabela de Imagens das Ocorrências (Incident Images)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS incident_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    original_name VARCHAR(255),
    mime_type VARCHAR(100),
    file_size_bytes INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_incident_images_incident_id ON incident_images (incident_id);

-- -----------------------------------------------------------------------------
-- Tabela de Votos / Apoios Comunitários (Incident Votes)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS incident_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT unique_user_incident_vote UNIQUE (incident_id, user_id)
);

-- -----------------------------------------------------------------------------
-- Tabela de Comentários / Atualizações Públicas (Incident Comments)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS incident_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_official_response BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_incident_comments_incident_id ON incident_comments (incident_id);

-- -----------------------------------------------------------------------------
-- Tabela de Logs de Auditoria (Audit Logs)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    actor_email VARCHAR(255),
    actor_role VARCHAR(50),
    action VARCHAR(100) NOT NULL, -- ex: 'INCIDENT_STATUS_CHANGE', 'INCIDENT_DELETE', 'USER_ROLE_UPDATE'
    entity_type VARCHAR(50) NOT NULL, -- ex: 'INCIDENT', 'USER', 'CATEGORY'
    entity_id UUID NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs (actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at DESC);
