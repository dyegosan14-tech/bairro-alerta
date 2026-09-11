import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext.js';
import { UserRole } from '../types/index.js';
import { getApiErrorMessage } from '../services/api.js';
import { useEscapeToClose } from '../hooks/useEscapeToClose.js';
import { useModalAccessibility } from '../hooks/useModalAccessibility.js';
import { X, LogIn, UserPlus, Shield, User, Award, Sparkles, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  // IMPORTANTE: mesmo bug de hooks condicionais encontrado em IncidentDetailModal e
  // NewIncidentModal — `return null` antes de useAuth/useState fazia este componente
  // (sempre montado por App.tsx, só a prop `isOpen` muda) ir de 0 para ~8 hooks na
  // primeira vez que o modal de login fosse aberto, derrubando a SPA inteira.
  const { login, register, quickDemoLogin } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [neighborhood, setNeighborhood] = useState('Vila Mariana');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEscapeToClose(isOpen, onClose);
  useModalAccessibility(isOpen, dialogRef, closeButtonRef);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (tab === 'login') {
        await login(email, password);
      } else {
        await register({ name, email, password, neighborhood, city: 'São Paulo' });
      }
      onClose();
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          'Não foi possível autenticar. Verifique seus dados e tente novamente.'
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (nextTab: 'login' | 'register') => {
    setTab(nextTab);
    setError(null);
  };

  const handleDemo = (role: UserRole) => {
    quickDemoLogin(role);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <h3 id="auth-modal-title" className="font-bold text-slate-800 text-base">
              {tab === 'login' ? 'Acessar o Voz do Bairro' : 'Criar Nova Conta'}
            </h3>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Fechar"
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1-Click Demo Profiles Banner */}
        <div className="bg-brand-50/70 p-4 border-b border-brand-100 space-y-2">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-brand-900">
            <Sparkles className="w-4 h-4 text-brand-600" />
            <span>Acesso Rápido de Demonstração (1 Clique):</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleDemo('CITIZEN')}
              className="bg-white hover:bg-brand-100/50 border border-brand-200 text-brand-900 py-1.5 px-2 rounded-xl text-[11px] font-semibold text-center transition-colors shadow-2xs"
            >
              👤 Cidadão
            </button>
            <button
              onClick={() => handleDemo('MODERATOR')}
              className="bg-white hover:bg-amber-100/50 border border-amber-200 text-amber-900 py-1.5 px-2 rounded-xl text-[11px] font-semibold text-center transition-colors shadow-2xs"
            >
              🛡️ Moderador
            </button>
            <button
              onClick={() => handleDemo('ADMIN')}
              className="bg-white hover:bg-purple-100/50 border border-purple-200 text-purple-900 py-1.5 px-2 rounded-xl text-[11px] font-semibold text-center transition-colors shadow-2xs"
            >
              👑 Admin
            </button>
          </div>
        </div>

        {/* Formulário Tradicional */}
        <div className="p-6 space-y-4 text-xs">
          {/* Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => handleTabChange('login')}
              className={`flex-1 py-1.5 font-bold rounded-lg transition-all ${
                tab === 'login'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Entrar
            </button>
            <button
              onClick={() => handleTabChange('register')}
              className={`flex-1 py-1.5 font-bold rounded-lg transition-all ${
                tab === 'register'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Criar Conta
            </button>
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start space-x-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-3 py-2.5"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {tab === 'register' && (
              <div>
                <label htmlFor="auth-name" className="block font-bold text-slate-700 mb-1">
                  Nome Completo
                </label>
                <input
                  id="auth-name"
                  type="text"
                  required
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500 focus:bg-white outline-hidden"
                />
              </div>
            )}

            <div>
              <label htmlFor="auth-email" className="block font-bold text-slate-700 mb-1">
                E-mail
              </label>
              <input
                id="auth-email"
                type="email"
                required
                placeholder="seu.email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500 focus:bg-white outline-hidden"
              />
            </div>

            <div>
              <label htmlFor="auth-password" className="block font-bold text-slate-700 mb-1">
                Senha
              </label>
              <input
                id="auth-password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500 focus:bg-white outline-hidden"
              />
            </div>

            {tab === 'register' && (
              <div>
                <label htmlFor="auth-neighborhood" className="block font-bold text-slate-700 mb-1">
                  Bairro de Residência
                </label>
                <input
                  id="auth-neighborhood"
                  type="text"
                  placeholder="Ex: Pinheiros, Moema, Centro..."
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500 focus:bg-white outline-hidden"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl shadow-xs transition-colors mt-2"
            >
              {loading
                ? 'Processando...'
                : tab === 'login'
                  ? 'Entrar no Sistema'
                  : 'Finalizar Cadastro'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
