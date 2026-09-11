import React from 'react';
import { useAuth } from '../../contexts/AuthContext.js';
import {
  MapPin,
  BarChart3,
  ShieldCheck,
  History,
  PlusCircle,
  LogIn,
  LogOut,
  Layers,
  Menu,
  X,
} from 'lucide-react';

interface NavbarProps {
  currentTab: 'map' | 'dashboard' | 'moderation' | 'audit';
  onSelectTab: (tab: 'map' | 'dashboard' | 'moderation' | 'audit') => void;
  onOpenReportModal: () => void;
  onOpenAuthModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenReportModal,
  onOpenAuthModal,
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const navigation = [
    { key: 'map' as const, label: 'Mapa & Alertas', icon: Layers },
    { key: 'dashboard' as const, label: 'Indicadores', icon: BarChart3 },
    ...(user && (user.role === 'MODERATOR' || user.role === 'ADMIN')
      ? [{ key: 'moderation' as const, label: 'Moderação', icon: ShieldCheck }]
      : []),
    ...(user?.role === 'ADMIN'
      ? [{ key: 'audit' as const, label: 'Auditoria', icon: History }]
      : []),
  ];

  const selectTab = (tab: NavbarProps['currentTab']) => {
    onSelectTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo e Nome */}
          <button
            aria-label="Ir para o mapa"
            className="flex items-center space-x-3 text-left"
            onClick={() => selectTab('map')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-sky-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <MapPin className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-brand-700 to-sky-600 bg-clip-text text-transparent">
                Voz do Bairro
              </span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-brand-50 text-brand-600 rounded-full border border-brand-200">
                PostGIS • Geo
              </span>
            </div>
          </button>

          {/* Navegação Principal */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => selectTab('map')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'map'
                  ? 'bg-brand-50 text-brand-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Mapa & Alertas</span>
            </button>

            <button
              onClick={() => selectTab('dashboard')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'dashboard'
                  ? 'bg-brand-50 text-brand-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            {/* Abas com restrição de papel */}
            {user && (user.role === 'MODERATOR' || user.role === 'ADMIN') && (
              <button
                onClick={() => selectTab('moderation')}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentTab === 'moderation'
                    ? 'bg-amber-50 text-amber-800 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>Moderação</span>
              </button>
            )}

            {user && user.role === 'ADMIN' && (
              <button
                onClick={() => selectTab('audit')}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentTab === 'audit'
                    ? 'bg-purple-50 text-purple-800 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <History className="w-4 h-4 text-purple-600" />
                <span>Auditoria</span>
              </button>
            )}
          </nav>

          {/* Botões de Ação e Usuário */}
          <div className="flex items-center space-x-3">
            {/* Botão de Novo Reporte */}
            <button
              onClick={onOpenReportModal}
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-brand-600 to-sky-600 hover:from-brand-700 hover:to-sky-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm hover:shadow transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Reportar</span>
            </button>

            {/* Perfil ou Botão de Login */}
            {isAuthenticated && user ? (
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
                <div className="hidden lg:flex flex-col text-right">
                  <span className="text-xs font-semibold text-slate-800 truncate max-w-[120px]">
                    {user.name}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider ${
                      user.role === 'ADMIN'
                        ? 'text-purple-600'
                        : user.role === 'MODERATOR'
                          ? 'text-amber-600'
                          : 'text-brand-600'
                    }`}
                  >
                    {user.role === 'ADMIN'
                      ? 'Admin'
                      : user.role === 'MODERATOR'
                        ? 'Moderador'
                        : 'Cidadão'}
                  </span>
                </div>
                <button
                  onClick={logout}
                  title="Sair da conta"
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={onOpenAuthModal}
                  className="inline-flex items-center space-x-1.5 px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Entrar</span>
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((open) => !open)}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-navigation"
              className="p-2 text-slate-700 hover:bg-slate-100 rounded-xl md:hidden"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              <span className="sr-only">Abrir navegação</span>
            </button>
          </div>
        </div>
        {isMobileMenuOpen && (
          <nav
            id="mobile-navigation"
            className="border-t border-slate-100 py-3 md:hidden"
            aria-label="Navegação móvel"
          >
            <div className="grid grid-cols-2 gap-2">
              {navigation.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => selectTab(key)}
                  className={`flex items-center gap-2 rounded-xl px-3 py-3 text-left text-sm font-semibold ${currentTab === key ? 'bg-brand-50 text-brand-700' : 'bg-slate-50 text-slate-700'}`}
                >
                  <Icon className="h-4 w-4" /> {label}
                </button>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};
