import React, { useState, useEffect } from 'react';
import { AuditLog } from '../types/index.js';
import { AuditAPI, getApiErrorMessage } from '../services/api.js';
import { History, ShieldAlert, Terminal, Clock, User, ArrowRight, Database } from 'lucide-react';

export const AuditPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    AuditAPI.list()
      .then((res) => setLogs(res.data))
      .catch((err) =>
        setError(getApiErrorMessage(err, 'Não foi possível carregar a trilha de auditoria.'))
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in">
      {/* Cabeçalho */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
          <History className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            Trilha de Auditoria & Compliance (LGPD)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Registro criptográfico e imutável de todas as ações administrativas, alterações de dados
            e moderações.
          </p>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl px-4 py-3 text-sm"
        >
          {error}
        </div>
      )}

      {/* Grid de Logs e Detalhes do JSON Diff */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Tabela de Eventos (7 colunas) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <span className="font-bold text-xs text-slate-700 uppercase tracking-wider">
              Eventos do Sistema
            </span>
            <span className="text-xs text-slate-400 font-mono">{logs.length} registros</span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {logs.map((log) => {
              const isSelected = selectedLog?.id === log.id;
              return (
                <button
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className={`w-full p-4 text-left hover:bg-slate-50 transition-colors text-xs ${
                    isSelected ? 'bg-purple-50/70 border-l-4 border-purple-600' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                      {log.action}
                    </span>
                    <span className="text-slate-400 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {new Date(log.created_at).toLocaleString('pt-BR')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-2 text-slate-600">
                    <span className="flex items-center">
                      <User className="w-3 h-3 mr-1 text-purple-600" />
                      {log.actor_email || 'Sistema'}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      IP: {log.ip_address || '127.0.0.1'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Painel do JSON Diff Visual (5 colunas) */}
        <div className="lg:col-span-5 bg-slate-950 text-slate-200 rounded-2xl border border-slate-800 p-5 font-mono text-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="font-bold text-sky-400 flex items-center">
                <Terminal className="w-4 h-4 mr-1.5" /> Payload Inspector (Diff)
              </span>
              {selectedLog && (
                <span className="text-[10px] text-slate-500">ID: {selectedLog.id.slice(0, 8)}</span>
              )}
            </div>

            {selectedLog ? (
              <div className="space-y-4 mt-4 overflow-y-auto max-h-[480px]">
                {selectedLog.old_values && (
                  <div>
                    <span className="text-rose-400 font-bold block mb-1 text-[11px]">
                      - Estado Anterior (old_values):
                    </span>
                    <pre className="bg-slate-900 p-3 rounded-xl overflow-x-auto text-[11px] text-rose-300 border border-rose-950">
                      {JSON.stringify(selectedLog.old_values, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.new_values && (
                  <div>
                    <span className="text-emerald-400 font-bold block mb-1 text-[11px]">
                      + Novo Estado (new_values):
                    </span>
                    <pre className="bg-slate-900 p-3 rounded-xl overflow-x-auto text-[11px] text-emerald-300 border border-emerald-950">
                      {JSON.stringify(selectedLog.new_values, null, 2)}
                    </pre>
                  </div>
                )}

                {!selectedLog.old_values && !selectedLog.new_values && (
                  <p className="text-slate-500 italic">
                    Nenhum payload de alteração de estado para este evento.
                  </p>
                )}
              </div>
            ) : (
              <div className="py-24 text-center text-slate-500">
                <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>
                  Selecione um log ao lado para inspecionar os deltas e alterações brutas de dados.
                </p>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-900 text-[10px] text-slate-500">
            Trilha compatível com LGPD / GDPR para integridade judicial.
          </div>
        </div>
      </div>
    </div>
  );
};
