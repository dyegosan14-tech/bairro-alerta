import React, { useState } from 'react';
import { Incident } from '../types/index.js';
import { 
  ShieldCheck, 
  Check, 
  X, 
  Clock, 
  Wrench, 
  CheckCircle, 
  AlertCircle, 
  MapPin,
  Eye,
  Filter
} from 'lucide-react';

interface ModerationPageProps {
  incidents: Incident[];
  onSelectIncident: (inc: Incident) => void;
  onUpdateStatus: (id: string, data: { status: string; priority?: string; moderator_notes?: string }) => void;
}

export const ModerationPage: React.FC<ModerationPageProps> = ({
  incidents,
  onSelectIncident,
  onUpdateStatus,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('PENDING');

  const filtered = incidents.filter((i) => {
    if (filterStatus === 'ALL') return true;
    return i.status === filterStatus;
  });

  const pendingCount = incidents.filter((i) => i.status === 'PENDING').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in">
      
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-amber-100 text-amber-800 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-slate-900">
              Painel de Triagem & Moderação
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Validação de chamados, direcionamento às secretarias municipais e auditoria de ações.
          </p>
        </div>

        {/* Badge de Pendências */}
        {pendingCount > 0 && (
          <div className="flex items-center space-x-2 bg-amber-50 text-amber-800 border border-amber-200 px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-xs">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
            <span>{pendingCount} ocorrências aguardando triagem</span>
          </div>
        )}
      </div>

      {/* Barra de Filtros por Status */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-3 overflow-x-auto text-xs">
        {[
          { key: 'PENDING', label: `Triagem (${pendingCount})` },
          { key: 'APPROVED', label: `Validados (${incidents.filter(i => i.status === 'APPROVED').length})` },
          { key: 'IN_PROGRESS', label: `Em Andamento (${incidents.filter(i => i.status === 'IN_PROGRESS').length})` },
          { key: 'RESOLVED', label: `Resolvidos (${incidents.filter(i => i.status === 'RESOLVED').length})` },
          { key: 'ALL', label: `Todos (${incidents.length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterStatus(tab.key)}
            className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
              filterStatus === tab.key
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Lista / Tabela de Triagem */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((inc) => (
          <div
            key={inc.id}
            className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                  style={{
                    backgroundColor: `${inc.category_color}15`,
                    color: inc.category_color,
                  }}
                >
                  {inc.category_name}
                </span>

                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  inc.priority === 'URGENT' ? 'bg-rose-100 text-rose-800 animate-pulse' :
                  inc.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                  'bg-slate-100 text-slate-700'
                }`}>
                  Prioridade: {inc.priority}
                </span>
              </div>

              <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{inc.title}</h3>
              <p className="text-xs text-slate-500 line-clamp-2 mt-1">{inc.description}</p>

              <div className="flex items-center text-[11px] text-slate-400 mt-2">
                <MapPin className="w-3 h-3 mr-1 text-slate-400" />
                <span className="truncate">{inc.address_text}, {inc.neighborhood}</span>
              </div>
            </div>

            {/* Ações Rápidas de Moderação */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-1 text-xs">
              <button
                onClick={() => onSelectIncident(inc)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                title="Inspecionar Ocorrência"
              >
                <Eye className="w-4 h-4" />
              </button>

              <div className="flex items-center space-x-1.5">
                {inc.status === 'PENDING' && (
                  <>
                    <button
                      onClick={() => onUpdateStatus(inc.id, { status: 'APPROVED', moderator_notes: 'Ocorrência validada e enviada à secretaria competente.' })}
                      className="inline-flex items-center space-x-1 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold px-2.5 py-1 rounded-lg transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Aprovar</span>
                    </button>
                    <button
                      onClick={() => onUpdateStatus(inc.id, { status: 'REJECTED', moderator_notes: 'Ocorrência rejeitada por falta de informações ou duplicidade.' })}
                      className="inline-flex items-center space-x-1 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold px-2 py-1 rounded-lg transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Rejeitar</span>
                    </button>
                  </>
                )}

                {inc.status === 'APPROVED' && (
                  <button
                    onClick={() => onUpdateStatus(inc.id, { status: 'IN_PROGRESS', moderator_notes: 'Equipe de manutenção alocada no local.' })}
                    className="inline-flex items-center space-x-1 bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold px-2.5 py-1 rounded-lg transition-colors"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Iniciar Reparo</span>
                  </button>
                )}

                {inc.status === 'IN_PROGRESS' && (
                  <button
                    onClick={() => onUpdateStatus(inc.id, { status: 'RESOLVED', moderator_notes: 'Serviço de manutenção urbana concluído com sucesso.' })}
                    className="inline-flex items-center space-x-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold px-2.5 py-1 rounded-lg transition-colors"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Concluir</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
