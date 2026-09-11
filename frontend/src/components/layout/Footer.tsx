import React from 'react';
import { Shield, Heart, MapPin, Database, Cpu } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 py-8 border-t border-slate-800 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-200 text-sm">Voz do Bairro</span>
            <p className="text-[11px] text-slate-500">
              Tecnologia cívica e zeladoria inteligente para cidades melhores.
            </p>
          </div>
        </div>

        {/* Badges de Stack Técnica */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            <Cpu className="w-3 h-3 mr-1 text-sky-400" /> Fastify & Node.js
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            <Database className="w-3 h-3 mr-1 text-emerald-400" /> PostgreSQL & PostGIS
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            <Shield className="w-3 h-3 mr-1 text-purple-400" /> RBAC & Auditoria
          </span>
        </div>

        <div className="text-center md:text-right text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} Voz do Bairro. Código aberto sob licença MIT.</p>
          <p className="flex items-center justify-center md:justify-end mt-0.5">
            Construído com <Heart className="w-3 h-3 mx-1 text-rose-500 fill-rose-500" /> para
            impacto urbano real.
          </p>
        </div>
      </div>
    </footer>
  );
};
