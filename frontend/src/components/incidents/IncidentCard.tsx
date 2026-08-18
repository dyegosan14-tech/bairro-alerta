import React from 'react';
import { Incident } from '../../types/index.js';
import { ThumbsUp, MapPin, Clock, MessageSquare, AlertCircle } from 'lucide-react';

interface IncidentCardProps {
  incident: Incident;
  onClick: () => void;
  onVote: (e: React.MouseEvent) => void;
}

export const IncidentCard: React.FC<IncidentCardProps> = ({ incident, onClick, onVote }) => {
  const statusStyles: Record<string, { label: string; bg: string; text: string; dot: string }> = {
    PENDING: { label: 'Em Triagem', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
    APPROVED: { label: 'Validado', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
    IN_PROGRESS: { label: 'Em Manutenção', bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
    RESOLVED: { label: 'Resolvido', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    REJECTED: { label: 'Arquivado', bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500' },
  };

  const status = statusStyles[incident.status] || statusStyles.PENDING;
  const imageUrl = incident.images && incident.images.length > 0 ? incident.images[0].file_url : null;

  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-2xl border border-slate-200/80 p-4 hover:border-brand-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Cabeçalho do Card: Categoria, Urgência e Status */}
        <div className="flex items-center justify-between mb-2">
          <span
            className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border flex items-center gap-1"
            style={{
              borderColor: `${incident.category_color}40`,
              backgroundColor: `${incident.category_color}15`,
              color: incident.category_color,
            }}
          >
            {incident.category_name}
          </span>

          <div className="flex items-center space-x-1.5">
            {incident.priority === 'URGENT' && (
              <span className="flex items-center text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                <AlertCircle className="w-3 h-3 mr-0.5 text-rose-600 animate-pulse" /> Urgente
              </span>
            )}
            <span className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full ${status.bg} ${status.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${status.dot}`}></span>
              {status.label}
            </span>
          </div>
        </div>

        {/* Título e Imagem */}
        <div className="flex gap-3 my-2">
          {imageUrl && (
            <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-100">
              <img
                src={imageUrl}
                alt={incident.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-slate-800 line-clamp-2 group-hover:text-brand-600 transition-colors leading-snug">
              {incident.title}
            </h3>
            <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
              {incident.description}
            </p>
          </div>
        </div>

        {/* Endereço e Bairro */}
        <div className="flex items-center text-xs text-slate-500 mt-2 gap-1 truncate">
          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <span className="truncate font-medium text-slate-600">{incident.address_text}</span>
          <span className="text-slate-400">•</span>
          <span className="truncate font-semibold text-slate-700">{incident.neighborhood}</span>
        </div>
      </div>

      {/* Rodapé: Votos, Distância e Comentários */}
      <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-xs text-slate-500">
        <div className="flex items-center space-x-3">
          <button
            onClick={onVote}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg font-medium transition-all active:scale-90 ${
              incident.has_voted
                ? 'bg-brand-50 text-brand-600 font-bold border border-brand-200'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
            }`}
          >
            <ThumbsUp className={`w-3.5 h-3.5 ${incident.has_voted ? 'fill-brand-600' : ''}`} />
            <span>{incident.upvotes_count || 0}</span>
          </button>

          {incident.comments && incident.comments.length > 0 && (
            <div className="flex items-center space-x-1 text-slate-400">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{incident.comments.length}</span>
            </div>
          )}
        </div>

        {incident.distance_meters !== undefined && (
          <span className="text-[11px] font-semibold text-sky-600 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
            {incident.distance_meters < 1000
              ? `${incident.distance_meters}m de você`
              : `${(incident.distance_meters / 1000).toFixed(1)}km`}
          </span>
        )}
      </div>
    </div>
  );
};
