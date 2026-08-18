import React, { useState, useEffect } from 'react';
import { DashboardMetrics } from '../types/index.js';
import { MetricsAPI } from '../services/api.js';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ThumbsUp, 
  TrendingUp, 
  Building2,
  Download
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    MetricsAPI.getDashboard()
      .then((data) => setMetrics(data))
      .catch((err) => console.error('Erro ao carregar métricas:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !metrics) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-500">
        Carregando painel de indicadores municipais...
      </div>
    );
  }

  const { summary, by_category, top_neighborhoods, recent_trend } = metrics;

  const STATUS_COLORS: Record<string, string> = {
    RESOLVED: '#10B981',
    IN_PROGRESS: '#8B5CF6',
    PENDING: '#F59E0B',
    REJECTED: '#EF4444',
  };

  const statusPieData = metrics.by_status.map((item) => ({
    name: item.status === 'RESOLVED' ? 'Resolvidos' : item.status === 'IN_PROGRESS' ? 'Em Manutenção' : item.status === 'PENDING' ? 'Em Triagem' : 'Arquivados',
    value: item.count,
    color: STATUS_COLORS[item.status] || '#0284c7',
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in">
      
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Painel Executivo de Zeladoria & Métricas Urbanas
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Transparência e acompanhamento de indicadores de zeladoria pública em tempo real.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center space-x-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold px-4 py-2 rounded-xl border border-slate-200 shadow-xs text-xs transition-colors"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>Exportar Relatório</span>
        </button>
      </div>

      {/* Grid de KPIs / Métricas Principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total de Chamados */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total de Demandas</p>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{summary.total_incidents}</h3>
            <p className="text-[11px] text-brand-600 font-semibold mt-0.5 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" /> +14% vs mês anterior
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Taxa de Resolução */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Taxa de Resolução</p>
            <h3 className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">{summary.resolution_rate_percentage}%</h3>
            <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
              {summary.resolved_count} ocorrências concluídas
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Tempo Médio de Resposta */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tempo Médio Resolução</p>
            <h3 className="text-2xl sm:text-3xl font-black text-purple-600 mt-1">{summary.avg_resolution_hours}h</h3>
            <p className="text-[11px] text-purple-700 font-semibold mt-0.5">
              Da triagem ao reparo
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Apoios Comunitários */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Engajamento Cívico</p>
            <h3 className="text-2xl sm:text-3xl font-black text-amber-600 mt-1">{summary.total_upvotes}</h3>
            <p className="text-[11px] text-amber-700 font-semibold mt-0.5">
              Apoios de moradores
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <ThumbsUp className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Grid de Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Gráfico 1: Ocorrências por Categoria (Bar Chart - 7 colunas) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">Volume por Categoria Urbana</h3>
            <p className="text-xs text-slate-500">Distribuição absoluta de ocorrências abertas por tema</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={by_category} layout="vertical" margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="category_name" type="category" width={140} tick={{ fontSize: 11, fill: '#475569' }} />
                <Tooltip
                  formatter={(val: number) => [`${val} chamados`, 'Total']}
                  contentStyle={{ borderRadius: '0.75rem', fontSize: '12px' }}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {by_category.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.category_color || '#0284c7'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 2: Distribuição por Status (Donut Chart - 5 colunas) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">Distribuição de Status</h3>
            <p className="text-xs text-slate-500">Proporção atual do funil de resolução</p>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`status-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '0.75rem', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
            {statusPieData.map((item) => (
              <div key={item.name} className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-slate-600 truncate">{item.name}:</span>
                <span className="font-bold text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Seção Inferior: Tendência Temporal e Tabela de Hotspots por Bairro */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Gráfico 3: Tendência Semanal (Area Chart - 6 colunas) */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">Evolução de Novos Chamados (Últimos Dias)</h3>
            <p className="text-xs text-slate-500">Volume diário de novos alertas reportados por moradores</p>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={recent_trend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncidents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '0.75rem', fontSize: '12px' }} />
                <Area type="monotone" dataKey="count" stroke="#0284c7" strokeWidth={2.5} fillOpacity={1} fill="url(#colorIncidents)" name="Chamados" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabela de Hotspots por Bairro (6 colunas) */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">Bairros com Maior Demanda (Hotspots)</h3>
            <p className="text-xs text-slate-500">Mapeamento de concentração e efetividade por região</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 font-semibold">
                <tr>
                  <th className="py-2 px-3">Bairro</th>
                  <th className="py-2 px-3 text-center">Total</th>
                  <th className="py-2 px-3 text-center">Resolvidos</th>
                  <th className="py-2 px-3 text-right">Efetividade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {top_neighborhoods.map((neigh) => {
                  const rate = neigh.total > 0 ? Math.round((neigh.resolved / neigh.total) * 100) : 0;
                  return (
                    <tr key={neigh.neighborhood} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{neigh.neighborhood}</td>
                      <td className="py-2.5 px-3 text-center font-medium text-slate-600">{neigh.total}</td>
                      <td className="py-2.5 px-3 text-center font-medium text-emerald-600">{neigh.resolved}</td>
                      <td className="py-2.5 px-3 text-right">
                        <span className="font-bold text-slate-800">{rate}%</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};
