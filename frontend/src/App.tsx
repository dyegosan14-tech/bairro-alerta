import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext.js';
import { Incident, Category } from './types/index.js';
import { IncidentsAPI, CategoriesAPI, ModerationAPI, getApiErrorMessage } from './services/api.js';

import { Navbar } from './components/layout/Navbar.js';
import { Footer } from './components/layout/Footer.js';
import { HomePage } from './pages/HomePage.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { ModerationPage } from './pages/ModerationPage.js';
import { AuditPage } from './pages/AuditPage.js';
import { IncidentDetailModal } from './components/incidents/IncidentDetailModal.js';
import { NewIncidentModal } from './components/incidents/NewIncidentModal.js';
import { AuthModal } from './pages/AuthModal.js';

const MainApp: React.FC = () => {
  const { user } = useAuth();
  const initialHash = window.location.hash.replace('#', '');
  const [currentTab, setCurrentTab] = useState<'map' | 'dashboard' | 'moderation' | 'audit'>(
    ['map', 'dashboard', 'moderation', 'audit'].includes(initialHash)
      ? (initialHash as 'map' | 'dashboard' | 'moderation' | 'audit')
      : 'map'
  );
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [isLoadingIncidents, setIsLoadingIncidents] = useState(true);
  const categoriesLoadedRef = useRef(false);
  const latestIncidentRequestRef = useRef(0);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };
  const selectTab = (tab: 'map' | 'dashboard' | 'moderation' | 'audit') => {
    setCurrentTab(tab);
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}${window.location.search}#${tab}`
    );
  };

  const loadData = useCallback(async (params: Record<string, unknown> = {}) => {
    const requestNumber = ++latestIncidentRequestRef.current;
    try {
      setIsLoadingIncidents(true);
      const requests: Promise<unknown>[] = [IncidentsAPI.list({ limit: 50, ...params })];
      if (!categoriesLoadedRef.current) requests.unshift(CategoriesAPI.list());
      const results = await Promise.all(requests);
      const incs = results[results.length - 1] as { data: Incident[] };
      if (results.length === 2) {
        setCategories(results[0] as Category[]);
        categoriesLoadedRef.current = true;
      }
      if (requestNumber === latestIncidentRequestRef.current) setIncidents(incs.data);
    } catch (err) {
      // Erro visível: antes disso era só um console.error, e o usuário via a tela
      // simplesmente vazia sem entender se a API estava fora do ar ou não havia dados.
      showToast(getApiErrorMessage(err, 'Não foi possível carregar as ocorrências.'), 'error');
    } finally {
      if (requestNumber === latestIncidentRequestRef.current) setIsLoadingIncidents(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleVote = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await IncidentsAPI.toggleVote(id);
      setIncidents((prev) =>
        prev.map((i) =>
          i.id === id ? { ...i, upvotes_count: res.totalUpvotes, has_voted: res.voted } : i
        )
      );
      if (selectedIncident && selectedIncident.id === id) {
        setSelectedIncident((prev) =>
          prev ? { ...prev, upvotes_count: res.totalUpvotes, has_voted: res.voted } : null
        );
      }
      showToast(res.voted ? 'Apoio registrado!' : 'Apoio removido.');
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Não foi possível registrar seu apoio.'), 'error');
    }
  };

  const handleAddComment = async (id: string, text: string) => {
    try {
      const comment = await IncidentsAPI.addComment(id, text);
      setIncidents((prev) =>
        prev.map((i) => (i.id === id ? { ...i, comments: [...(i.comments || []), comment] } : i))
      );
      if (selectedIncident && selectedIncident.id === id) {
        setSelectedIncident((prev) =>
          prev ? { ...prev, comments: [...(prev.comments || []), comment] } : null
        );
      }
      showToast('Comentário publicado com sucesso!');
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Não foi possível publicar seu comentário.'), 'error');
    }
  };

  const handleCreateIncident = async (data: any) => {
    try {
      const created = await IncidentsAPI.create(data);
      setIncidents((prev) => [created, ...prev]);
      showToast('Ocorrência enviada com sucesso para a moderação!');
      setSelectedIncident(created);
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Não foi possível registrar a ocorrência.'), 'error');
      // Propaga o erro para o NewIncidentModal, que mantém o formulário aberto (em vez de
      // fechar como se tivesse dado certo) para o usuário poder tentar de novo.
      throw err;
    }
  };

  const handleUpdateStatus = async (
    id: string,
    data: { status: string; priority?: string; moderator_notes?: string }
  ) => {
    try {
      const updated = await ModerationAPI.updateStatus(id, data);
      setIncidents((prev) => prev.map((i) => (i.id === id ? { ...i, ...updated } : i)));
      if (selectedIncident && selectedIncident.id === id) {
        setSelectedIncident((prev) => (prev ? { ...prev, ...updated } : null));
      }
      showToast(`Status atualizado para ${data.status} e log gravado!`);
    } catch (err) {
      showToast(
        getApiErrorMessage(err, 'Não foi possível atualizar o status da ocorrência.'),
        'error'
      );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Toast Notification */}
      {toast && (
        <div
          role={toast.type === 'error' ? 'alert' : 'status'}
          className={`fixed bottom-5 right-5 z-50 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-xl border animate-in fade-in slide-in-from-bottom-2 flex items-center space-x-2 ${
            toast.type === 'error' ? 'bg-rose-700 border-rose-800' : 'bg-slate-900 border-slate-800'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${toast.type === 'error' ? 'bg-rose-300' : 'bg-emerald-400'}`}
          ></span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Barra de Navegação */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={selectTab}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Conteúdo da Aba Ativa */}
      <main className="flex-1 flex flex-col">
        {currentTab === 'map' && (
          <HomePage
            incidents={incidents}
            categories={categories}
            selectedIncident={selectedIncident}
            onSelectIncident={setSelectedIncident}
            onVote={handleVote}
            onOpenReportModal={() => setIsReportModalOpen(true)}
            isLoading={isLoadingIncidents}
            onQueryChange={loadData}
          />
        )}

        {currentTab === 'dashboard' && <DashboardPage />}

        {currentTab === 'moderation' && (
          <ModerationPage
            incidents={incidents}
            onSelectIncident={setSelectedIncident}
            onUpdateStatus={handleUpdateStatus}
          />
        )}

        {currentTab === 'audit' && <AuditPage />}
      </main>

      {/* Rodapé */}
      <Footer />

      {/* Modais */}
      <IncidentDetailModal
        incident={selectedIncident}
        onClose={() => setSelectedIncident(null)}
        onVote={(id) => handleVote(id)}
        onAddComment={handleAddComment}
        onUpdateStatus={handleUpdateStatus}
      />

      <NewIncidentModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        categories={categories}
        onSubmit={handleCreateIncident}
      />

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};

export default App;
