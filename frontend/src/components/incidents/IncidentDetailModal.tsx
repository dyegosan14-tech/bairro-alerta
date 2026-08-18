import React, { useState } from 'react';
import { Incident } from '../../types/index.js';
import { useAuth } from '../../contexts/AuthContext.js';
import { 
  X, 
  MapPin, 
  Clock, 
  ThumbsUp, 
  Send, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle,
  MessageSquare,
  Sparkles
} from 'lucide-react';

interface IncidentDetailModalProps {
  incident: Incident | null;
  onClose: () => void;
  onVote: (id: string) => void;
  onAddComment: (id: string, text: string) => void;
  onUpdateStatus?: (id: string, data: { status: string; priority?: string; moderator_notes?: string }) => void;
}

export const IncidentDetailModal: React.FC<IncidentDetailModalProps> = ({
  incident,
  onClose,
  onVote,
  onAddComment,
  onUpdateStatus,
}) => {
  if (!incident) return null;

  const { user } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [modStatus, setModStatus] = useState(incident.status);
  const [modPriority, setModPriority] = useState(incident.priority);
  const [modNotes, setModNotes] = useState(incident.moderator_notes || '');
  const [isUpdatingMod, setIsUpdatingMod] = useState(false);

  const canModerate = user && (user.role === 'MODERATOR' || user.role === 'ADMIN');

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(incident.id, commentText);
    setCommentText('');
  };

  const handleModerationSubmit = () => {
    if (!onUpdateStatus) return;
    setIsUpdatingMod(true);
    onUpdateStatus(incident.id, {
      status: modStatus,
      priority: modPriority,
      moderator_notes: modNotes,
    });
    setTimeout(() => setIsUpdatingMod(false), 500);
  };

  const statusSteps = [
    { key: 'PENDING', label: 'Recebido' },
    { key: 'APPROVED', label: 'Validado' },
    { key: 'IN_PROGRESS', label: 'Em Manutenção' },
    { key: 'RESOLVED', label: 'Concluído' },
  ];

  const currentStepIndex = statusSteps.findIndex((s) => s.key === incident.status);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header do Modal */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <span
              className="text-xs font-bold px-3 py-1 rounded-full border"
              style={{
                borderColor: `${incident.category_color}40`,
                backgroundColor: `${incident.category_color}15`,
                color: incident.category_color,
              }}
            >
              {incident.category_name}
            </span>
            <span className="text-xs text-slate-400">• Protocolo #{incident.id.slice(0, 8)}</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo com Scroll */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Título e Info Básica */}
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
              {incident.title}
            </h2>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
              <span className="flex items-center font-medium text-slate-700">
                <MapPin className="w-3.5 h-3.5 mr-1 text-brand-600" />
                {incident.address_text}, {incident.neighborhood} - {incident.city}/{incident.state}
              </span>
              <span>•</span>
              <span className="flex items-center">
                <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                Reportado por {incident.user_name || 'Cidadão'} em {new Date(incident.created_at).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>

          {/* Galeria de Fotos */}
          {incident.images && incident.images.length > 0 && (
            <div className="rounded-2xl overflow-hidden bg-slate-900 border border-slate-100 max-h-72 flex items-center justify-center">
              <img
                src={incident.images[0].file_url}
                alt={incident.title}
                className="w-full h-full object-cover max-h-72"
              />
            </div>
          )}

          {/* Descrição Detalhada */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-sm text-slate-700 leading-relaxed">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-1">Descrição do Cidadão</h4>
            {incident.description}
          </div>

          {/* Linha do Tempo / Status do Chamado */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-4">Progresso do Atendimento</h4>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              {statusSteps.map((step, idx) => {
                const isPassed = currentStepIndex >= idx;
                const isCurrent = currentStepIndex === idx;
                return (
                  <div key={step.key} className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isPassed
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-400'
                      } ${isCurrent ? 'ring-4 ring-emerald-100 scale-110' : ''}`}
                    >
                      {idx + 1}
                    </div>
                    <span className={`mt-2 font-medium text-[11px] ${isPassed ? 'text-slate-800' : 'text-slate-400'}`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Nota do Moderador / Órgão Público se houver */}
          {incident.moderator_notes && (
            <div className="bg-sky-50 border border-sky-200 p-4 rounded-2xl flex items-start space-x-3 text-sky-900 text-sm">
              <ShieldCheck className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
              <div>
                <h5 className="font-bold text-xs uppercase tracking-wider text-sky-700">Resposta da Gestão Municipal</h5>
                <p className="mt-1 text-sky-950 font-medium">{incident.moderator_notes}</p>
              </div>
            </div>
          )}

          {/* Seção de Moderação / Ações de Gestão (Se usuário for MODERATOR ou ADMIN) */}
          {canModerate && (
            <div className="bg-amber-50/60 border border-amber-200 p-5 rounded-2xl space-y-4">
              <div className="flex items-center space-x-2 text-amber-900 font-bold text-sm">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>Painel de Moderação & Gestão Pública</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-amber-800 mb-1">Alterar Status</label>
                  <select
                    value={modStatus}
                    onChange={(e) => setModStatus(e.target.value as any)}
                    className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-hidden"
                  >
                    <option value="PENDING">Pendente (Em Triagem)</option>
                    <option value="APPROVED">Validado (Na Fila)</option>
                    <option value="IN_PROGRESS">Em Manutenção / Andamento</option>
                    <option value="RESOLVED">Resolvido / Concluído</option>
                    <option value="REJECTED">Rejeitado / Arquivado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-amber-800 mb-1">Prioridade</label>
                  <select
                    value={modPriority}
                    onChange={(e) => setModPriority(e.target.value as any)}
                    className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-hidden"
                  >
                    <option value="LOW">Baixa</option>
                    <option value="MEDIUM">Média</option>
                    <option value="HIGH">Alta</option>
                    <option value="URGENT">Urgente</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-amber-800 mb-1">Parecer / Nota Oficial para o Cidadão</label>
                <input
                  type="text"
                  placeholder="Ex: Equipe de zeladoria agendada para 18/08..."
                  value={modNotes}
                  onChange={(e) => setModNotes(e.target.value)}
                  className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 outline-hidden"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleModerationSubmit}
                  disabled={isUpdatingMod}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-xs"
                >
                  {isUpdatingMod ? 'Salvando...' : 'Aplicar Moderação & Auditoria'}
                </button>
              </div>
            </div>
          )}

          {/* Seção de Comentários e Comunidade */}
          <div className="space-y-3 pt-2">
            <h4 className="font-bold text-sm text-slate-800 flex items-center justify-between">
              <span className="flex items-center">
                <MessageSquare className="w-4 h-4 mr-1.5 text-brand-600" />
                Atualizações e Comentários ({incident.comments?.length || 0})
              </span>
              <button
                onClick={() => onVote(incident.id)}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  incident.has_voted
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-brand-50 hover:text-brand-600 text-slate-700'
                }`}
              >
                <ThumbsUp className={`w-3.5 h-3.5 ${incident.has_voted ? 'fill-white' : ''}`} />
                <span>Apoiar ({incident.upvotes_count || 0})</span>
              </button>
            </h4>

            {/* Lista de Comentários */}
            <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
              {incident.comments && incident.comments.length > 0 ? (
                incident.comments.map((c) => (
                  <div
                    key={c.id}
                    className={`p-3 rounded-xl text-xs ${
                      c.is_official_response
                        ? 'bg-sky-50 border border-sky-100 text-sky-950 font-medium'
                        : 'bg-slate-50 border border-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                      <span className="font-bold text-slate-700">
                        {c.user_name || 'Morador'} {c.is_official_response && '⭐ Resposta Oficial'}
                      </span>
                      <span>{new Date(c.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p>{c.content}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic py-2 text-center">
                  Nenhum comentário ainda. Seja o primeiro a comentar sobre este problema.
                </p>
              )}
            </div>

            {/* Input de Comentário */}
            <form onSubmit={handleCommentSubmit} className="flex gap-2 pt-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Escreva um comentário ou confirmação..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500 focus:bg-white outline-hidden"
              />
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white p-2 rounded-xl text-xs font-semibold flex items-center justify-center transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
};
