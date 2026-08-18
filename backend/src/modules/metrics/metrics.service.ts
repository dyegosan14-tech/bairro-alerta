import { query } from '../../database/pool.js';

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

export class MetricsService {
  static async getDashboardMetrics(): Promise<DashboardMetrics> {
    // 1. Resumo Geral
    const summaryRes = await query(`
      SELECT 
        COUNT(*) as total_incidents,
        COUNT(*) FILTER (WHERE status = 'PENDING') as pending_count,
        COUNT(*) FILTER (WHERE status = 'IN_PROGRESS' OR status = 'APPROVED') as in_progress_count,
        COUNT(*) FILTER (WHERE status = 'RESOLVED') as resolved_count,
        COUNT(*) FILTER (WHERE status = 'REJECTED') as rejected_count,
        COALESCE(SUM(upvotes_count), 0) as total_upvotes,
        COALESCE(
          AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600) FILTER (WHERE resolved_at IS NOT NULL),
          0
        ) as avg_resolution_hours
      FROM incidents
    `);

    const summaryRow = summaryRes.rows[0] || {};
    const total = parseInt(summaryRow.total_incidents || '0', 10);
    const resolved = parseInt(summaryRow.resolved_count || '0', 10);
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    // 2. Por Categoria
    const categoryRes = await query(`
      SELECT 
        c.id as category_id,
        c.name as category_name,
        c.color_hex as category_color,
        COUNT(i.id)::int as count
      FROM categories c
      LEFT JOIN incidents i ON i.category_id = c.id
      GROUP BY c.id, c.name, c.color_hex
      ORDER BY count DESC
    `);

    // 3. Por Status
    const statusRes = await query(`
      SELECT status, COUNT(*)::int as count
      FROM incidents
      GROUP BY status
    `);

    // 4. Bairros com maior número de ocorrências (Hotspots)
    const neighborhoodRes = await query(`
      SELECT 
        neighborhood,
        COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE status = 'RESOLVED')::int as resolved
      FROM incidents
      WHERE neighborhood IS NOT NULL AND neighborhood != ''
      GROUP BY neighborhood
      ORDER BY total DESC
      LIMIT 8
    `);

    // 5. Tendência dos últimos 7 dias
    const trendRes = await query(`
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM-DD') as date,
        COUNT(*)::int as count
      FROM incidents
      WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
      ORDER BY date ASC
    `);

    return {
      summary: {
        total_incidents: total,
        pending_count: parseInt(summaryRow.pending_count || '0', 10),
        in_progress_count: parseInt(summaryRow.in_progress_count || '0', 10),
        resolved_count: resolved,
        rejected_count: parseInt(summaryRow.rejected_count || '0', 10),
        resolution_rate_percentage: resolutionRate,
        total_upvotes: parseInt(summaryRow.total_upvotes || '0', 10),
        avg_resolution_hours: Math.round(parseFloat(summaryRow.avg_resolution_hours || '0') * 10) / 10,
      },
      by_category: categoryRes.rows,
      by_status: statusRes.rows,
      top_neighborhoods: neighborhoodRes.rows,
      recent_trend: trendRes.rows,
    };
  }
}
