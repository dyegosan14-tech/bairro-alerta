import { query, withTransaction } from '../../database/pool.js';
import { Incident, IncidentImage, IncidentComment } from '../../types/index.js';
import { CreateIncidentInput, ListIncidentsQuery } from './incidents.schema.js';
import { AuditService } from '../audit/audit.service.js';
import { escapeLikePattern } from '../../utils/sql.js';

export class IncidentsService {
  static async create(
    userId: string,
    userEmail: string,
    userRole: string,
    input: CreateIncidentInput,
    ipAddress?: string
  ): Promise<Incident> {
    // A ocorrência e suas imagens precisam ser gravadas atomicamente: se a inserção de
    // uma imagem falhar no meio do caminho, a ocorrência não deve ficar criada "pela metade".
    const newIncident = await withTransaction(async (client) => {
      // 1. Inserir ocorrência com geometria PostGIS (Longitude, Latitude)
      const res = await client.query(
        `
        INSERT INTO incidents (
          user_id, category_id, title, description,
          location, address_text, neighborhood, city, state,
          priority, status
        ) VALUES (
          $1, $2, $3, $4,
          ST_SetSRID(ST_MakePoint($5, $6), 4326),
          $7, $8, $9, $10,
          $11, 'PENDING'
        )
        RETURNING
          id, user_id, category_id, title, description,
          ST_Y(location::geometry) as latitude,
          ST_X(location::geometry) as longitude,
          address_text, neighborhood, city, state,
          status, priority, upvotes_count, created_at, updated_at
      `,
        [
          userId,
          input.category_id,
          input.title,
          input.description,
          input.longitude,
          input.latitude,
          input.address_text,
          input.neighborhood,
          input.city,
          input.state,
          input.priority,
        ]
      );

      const created = res.rows[0];

      // 2. Inserir imagens associadas se houver
      if (input.image_urls && input.image_urls.length > 0) {
        for (const url of input.image_urls) {
          await client.query(
            `
            INSERT INTO incident_images (incident_id, file_url)
            VALUES ($1, $2)
          `,
            [created.id, url]
          );
        }
      }

      return created;
    });

    // Log de Auditoria fica fora da transação de negócio de propósito: AuditService.record
    // já engole e loga falhas internamente para nunca bloquear a criação da ocorrência.
    await AuditService.record({
      actor_id: userId,
      actor_email: userEmail,
      actor_role: userRole,
      action: 'INCIDENT_CREATE',
      entity_type: 'INCIDENT',
      entity_id: newIncident.id,
      new_values: {
        title: input.title,
        neighborhood: input.neighborhood,
        coordinates: [input.longitude, input.latitude],
      },
      ip_address: ipAddress,
    });

    return (await this.findById(newIncident.id)) as Incident;
  }

  static async list(
    params: ListIncidentsQuery,
    currentUserId?: string
  ): Promise<{ data: Incident[]; total: number }> {
    const conditions: string[] = [];
    const values: any[] = [];

    // Filtro por Coordenadas e Raio Geoespacial via PostGIS (ST_DWithin)
    let distanceSelect = '0 as distance_meters';
    let orderByClause = 'i.created_at DESC';

    if (params.lat !== undefined && params.lng !== undefined && params.radius_km !== undefined) {
      const radiusMeters = params.radius_km * 1000;
      values.push(params.lng, params.lat, radiusMeters);
      const lngParam = values.length - 2;
      const latParam = values.length - 1;
      const radiusParam = values.length;

      conditions.push(`
        ST_DWithin(
          i.location::geography,
          ST_SetSRID(ST_MakePoint($${lngParam}, $${latParam}), 4326)::geography,
          $${radiusParam}
        )
      `);

      distanceSelect = `
        ROUND(
          ST_Distance(
            i.location::geography,
            ST_SetSRID(ST_MakePoint($${lngParam}, $${latParam}), 4326)::geography
          )::numeric, 0
        ) as distance_meters
      `;

      orderByClause = 'distance_meters ASC, i.created_at DESC';
    }

    // Filtro por Status
    if (params.status && params.status !== 'ALL') {
      values.push(params.status);
      conditions.push(`i.status = $${values.length}`);
    }

    // Filtro por Categoria
    if (params.category_id) {
      values.push(params.category_id);
      conditions.push(`i.category_id = $${values.length}`);
    }

    // Filtro por Usuário Criador
    if (params.user_id) {
      values.push(params.user_id);
      conditions.push(`i.user_id = $${values.length}`);
    }

    // Filtro por Bairro
    if (params.neighborhood) {
      // Escapa % e _ do usuário para não serem interpretados como curinga do ILIKE.
      values.push(`%${escapeLikePattern(params.neighborhood)}%`);
      conditions.push(`i.neighborhood ILIKE $${values.length}`);
    }

    // Busca textual no título ou descrição
    if (params.search) {
      values.push(`%${escapeLikePattern(params.search)}%`);
      conditions.push(
        `(i.title ILIKE $${values.length} OR i.description ILIKE $${values.length} OR i.address_text ILIKE $${values.length})`
      );
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Contagem total
    const countRes = await query(
      `
      SELECT COUNT(*) as total
      FROM incidents i
      ${whereClause}
    `,
      values
    );
    const total = parseInt(countRes.rows[0]?.total || '0', 10);

    // Consulta paginada com JOINs
    const queryParams = [...values, params.limit, params.offset];
    const limitParam = queryParams.length - 1;
    const offsetParam = queryParams.length;

    let hasVotedSelect = 'false as has_voted';
    let userVoteJoin = '';
    if (currentUserId) {
      values.push(currentUserId);
      const userVoteParam = values.length;
      userVoteJoin = `LEFT JOIN incident_votes iv ON iv.incident_id = i.id AND iv.user_id = $${userVoteParam}`;
      hasVotedSelect = 'CASE WHEN iv.id IS NOT NULL THEN true ELSE false END as has_voted';
    }

    const sql = `
      SELECT 
        i.id, i.user_id, u.name as user_name,
        i.category_id, c.name as category_name, c.icon as category_icon, c.color_hex as category_color,
        i.title, i.description,
        ST_Y(i.location::geometry) as latitude,
        ST_X(i.location::geometry) as longitude,
        i.address_text, i.neighborhood, i.city, i.state,
        i.status, i.priority, i.upvotes_count,
        i.moderator_notes, i.moderated_at, i.resolved_at,
        i.created_at, i.updated_at,
        ${distanceSelect},
        ${hasVotedSelect},
        COALESCE(
          json_agg(DISTINCT jsonb_build_object(
            'id', img.id,
            'file_url', img.file_url,
            'created_at', img.created_at
          )) FILTER (WHERE img.id IS NOT NULL), '[]'
        ) as images
      FROM incidents i
      INNER JOIN users u ON u.id = i.user_id
      INNER JOIN categories c ON c.id = i.category_id
      LEFT JOIN incident_images img ON img.incident_id = i.id
      ${userVoteJoin}
      ${whereClause}
      GROUP BY i.id, u.name, c.name, c.icon, c.color_hex ${userVoteJoin ? ', iv.id' : ''}
      ORDER BY ${orderByClause}
      LIMIT $${limitParam} OFFSET $${offsetParam}
    `;

    const dataRes = await query(sql, queryParams);

    return {
      data: dataRes.rows,
      total,
    };
  }

  static async findById(id: string, currentUserId?: string): Promise<Incident | null> {
    let hasVotedSelect = 'false as has_voted';
    const params: any[] = [id];

    if (currentUserId) {
      params.push(currentUserId);
      hasVotedSelect = `EXISTS(SELECT 1 FROM incident_votes WHERE incident_id = i.id AND user_id = $2) as has_voted`;
    }

    const res = await query(
      `
      SELECT 
        i.id, i.user_id, u.name as user_name,
        i.category_id, c.name as category_name, c.icon as category_icon, c.color_hex as category_color,
        i.title, i.description,
        ST_Y(i.location::geometry) as latitude,
        ST_X(i.location::geometry) as longitude,
        i.address_text, i.neighborhood, i.city, i.state,
        i.status, i.priority, i.upvotes_count,
        i.moderator_notes, i.moderated_at, i.resolved_at,
        i.created_at, i.updated_at,
        ${hasVotedSelect}
      FROM incidents i
      INNER JOIN users u ON u.id = i.user_id
      INNER JOIN categories c ON c.id = i.category_id
      WHERE i.id = $1
    `,
      params
    );

    const incident = res.rows[0];
    if (!incident) return null;

    // Buscar imagens
    const imagesRes = await query<IncidentImage>(
      `
      SELECT id, incident_id, file_url, original_name, mime_type, created_at
      FROM incident_images
      WHERE incident_id = $1
      ORDER BY created_at ASC
    `,
      [id]
    );

    // Buscar comentários
    const commentsRes = await query<IncidentComment>(
      `
      SELECT 
        ic.id, ic.incident_id, ic.user_id, u.name as user_name, u.role as user_role,
        ic.content, ic.is_official_response, ic.created_at
      FROM incident_comments ic
      INNER JOIN users u ON u.id = ic.user_id
      WHERE ic.incident_id = $1
      ORDER BY ic.created_at ASC
    `,
      [id]
    );

    incident.images = imagesRes.rows;
    incident.comments = commentsRes.rows;

    return incident;
  }

  static async toggleVote(
    incidentId: string,
    userId: string
  ): Promise<{ voted: boolean; totalUpvotes: number }> {
    // Toda a operação (checar, alternar o voto e atualizar o contador) roda em uma única
    // transação para evitar a condição de corrida do padrão "check-then-act": dois cliques
    // simultâneos do mesmo usuário não devem conseguir duplicar/perder o voto ou o contador.
    return withTransaction(async (client) => {
      const deleted = await client.query(
        `DELETE FROM incident_votes WHERE incident_id = $1 AND user_id = $2 RETURNING id`,
        [incidentId, userId]
      );

      let voted: boolean;

      if ((deleted.rowCount ?? 0) > 0) {
        await client.query(
          `UPDATE incidents SET upvotes_count = GREATEST(0, upvotes_count - 1) WHERE id = $1`,
          [incidentId]
        );
        voted = false;
      } else {
        // SAVEPOINT é necessário aqui: no Postgres, uma vez que uma query falha dentro de
        // uma transação, TODA a transação fica "abortada" (mesmo capturando a exceção em
        // JS) até um ROLLBACK — sem o savepoint, o SELECT final abaixo falharia também.
        await client.query('SAVEPOINT vote_insert');
        try {
          await client.query(`INSERT INTO incident_votes (incident_id, user_id) VALUES ($1, $2)`, [
            incidentId,
            userId,
          ]);
          await client.query(
            `UPDATE incidents SET upvotes_count = upvotes_count + 1 WHERE id = $1`,
            [incidentId]
          );
          voted = true;
        } catch (error: any) {
          // Corrida rara: outra requisição concorrente do mesmo usuário já inseriu o voto
          // entre o DELETE (0 linhas) e este INSERT. Trata como "já votado" em vez de 500.
          if (error?.code === '23505') {
            await client.query('ROLLBACK TO SAVEPOINT vote_insert');
            voted = true;
          } else {
            throw error;
          }
        }
      }

      const countRes = await client.query(`SELECT upvotes_count FROM incidents WHERE id = $1`, [
        incidentId,
      ]);
      return {
        voted,
        totalUpvotes: countRes.rows[0]?.upvotes_count || 0,
      };
    });
  }

  static async addComment(
    incidentId: string,
    userId: string,
    content: string,
    isOfficial = false
  ): Promise<IncidentComment> {
    const res = await query(
      `
      INSERT INTO incident_comments (incident_id, user_id, content, is_official_response)
      VALUES ($1, $2, $3, $4)
      RETURNING id, incident_id, user_id, content, is_official_response, created_at
    `,
      [incidentId, userId, content, isOfficial]
    );

    const userRes = await query(`SELECT name, role FROM users WHERE id = $1`, [userId]);

    return {
      ...res.rows[0],
      user_name: userRes.rows[0]?.name,
      user_role: userRes.rows[0]?.role,
    };
  }
}
