import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext.js';
import { Incident, Category } from './types/index.js';
import { IncidentsAPI, CategoriesAPI, ModerationAPI } from './services/api.js';

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
  const [currentTab, setCurrentTab] = useState<'map' | 'dashboard' | 'moderation' | 'audit'>('map');
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = async () => {
    try {
      const [cats, incs] = await Promise.all([
        CategoriesAPI.list(),
        IncidentsAPI.list({ limit: 100 }),
      ]);
      setCategories(cats);
      setIncidents(incs.data);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
      console.error('Erro ao votar:', err);
    }
  };

  const handleAddComment = async (id: string, text: string) => {
    try {
      const comment = await IncidentsAPI.addComment(id, text);
      setIncidents((prev) =>
        prev.map((i) =>
          i.id === id ? { ...i, comments: [...(i.comments || []), comment] } : i
        )
      );
      if (selectedIncident && selectedIncident.id === id) {
        setSelectedIncident((prev) =>
          prev ? { ...prev, comments: [...(prev.comments || []), comment] } : null
        );
      }
      showToast('Comentário publicado com sucesso!');
    } catch (err) {
      console.error('Erro ao comentar:', err);
    }
  };

  const handleCreateIncident = async (data: any) => {
    try {
      const created = await IncidentsAPI.create(data);
      setIncidents((prev) => [created, ...prev]);
      showToast('Ocorrência enviada com sucesso para a moderação!');
      setSelectedIncident(created);
    } catch (err) {
      console.error('Erro ao criar ocorrência:', err);
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
      console.error('Erro ao moderar:', err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-xl border border-slate-800 animate-in fade-in slide-in-from-bottom-2 flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Barra de Navegação */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
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

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

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
