import React, { useState, useMemo, useEffect } from 'react';
import { Incident, Category } from '../types/index.js';
import { IncidentMap } from '../components/map/IncidentMap.js';
import { IncidentCard } from '../components/incidents/IncidentCard.js';
import { RadiusSlider } from '../components/map/RadiusSlider.js';
import { haversineDistanceMeters } from '../utils/geo.js';
import { Search, LocateFixed } from 'lucide-react';
import { EmptyState } from '../components/ui/EmptyState.js';
import { Skeleton } from '../components/ui/Skeleton.js';

interface HomePageProps {
  incidents: Incident[];
  categories: Category[];
  selectedIncident: Incident | null;
  onSelectIncident: (inc: Incident) => void;
  onVote: (id: string, e: React.MouseEvent) => void;
  onOpenReportModal: () => void;
  isLoading?: boolean;
  onQueryChange?: (params: Record<string, unknown>) => void;
}

const noop = () => undefined;

export const HomePage: React.FC<HomePageProps> = ({
  incidents,
  categories,
  selectedIncident,
  onSelectIncident,
  onVote,
  onOpenReportModal,
  isLoading = false,
  onQueryChange = noop,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [radiusKm, setRadiusKm] = useState<number>(5);
  const [userCoords, setUserCoords] = useState<[number, number]>([-23.5615, -46.6559]); // SP Centro
  const [locationState, setLocationState] = useState<'idle' | 'loading' | 'denied'>('idle');

  useEffect(() => {
    const timer = window.setTimeout(
      () => {
        onQueryChange({
          lat: userCoords[0],
          lng: userCoords[1],
          radius_km: radiusKm,
          search: searchQuery || undefined,
          category_id: selectedCategory === 'ALL' ? undefined : selectedCategory,
          status: selectedStatus,
        });
      },
      searchQuery ? 350 : 0
    );
    return () => window.clearTimeout(timer);
  }, [userCoords, radiusKm, searchQuery, selectedCategory, selectedStatus, onQueryChange]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('busca', searchQuery);
    if (selectedCategory !== 'ALL') params.set('categoria', selectedCategory);
    if (selectedStatus !== 'ALL') params.set('status', selectedStatus);
    params.set('raio', String(radiusKm));
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}?${params.toString()}${window.location.hash}`
    );
  }, [searchQuery, selectedCategory, selectedStatus, radiusKm]);

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationState('denied');
      return;
    }
    setLocationState('loading');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUserCoords([coords.latitude, coords.longitude]);
        setLocationState('idle');
      },
      () => setLocationState('denied'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('ALL');
    setSelectedStatus('ALL');
    setRadiusKm(5);
  };

  // Normaliza a distância e restringe as ocorrências ao raio selecionado
  const incidentsWithinRadius = useMemo(
    () =>
      incidents
        .map((inc) => ({
          ...inc,
          distance_meters: Math.round(
            haversineDistanceMeters(userCoords[0], userCoords[1], inc.latitude, inc.longitude)
          ),
        }))
        .filter((inc) => inc.distance_meters <= radiusKm * 1000),
    [incidents, userCoords, radiusKm]
  );

  const filteredIncidents = useMemo(() => {
    return incidentsWithinRadius
      .filter((inc) => {
        // Busca de texto
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matchesTitle = inc.title.toLowerCase().includes(q);
          const matchesDesc = inc.description.toLowerCase().includes(q);
          const matchesNeigh = inc.neighborhood.toLowerCase().includes(q);
          const matchesAddr = inc.address_text.toLowerCase().includes(q);
          if (!matchesTitle && !matchesDesc && !matchesNeigh && !matchesAddr) return false;
        }

        // Categoria
        if (selectedCategory !== 'ALL' && inc.category_id !== selectedCategory) {
          return false;
        }

        // Status
        if (selectedStatus !== 'ALL' && inc.status !== selectedStatus) {
          return false;
        }

        return true;
      })
      .sort((a, b) => a.distance_meters - b.distance_meters);
  }, [incidentsWithinRadius, searchQuery, selectedCategory, selectedStatus]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col space-y-6">
      {/* Barra de Filtros Rápidos e Busca */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Input de Busca */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por rua, bairro, tipo de problema ou descrição..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-brand-500 focus:bg-white outline-hidden"
            />
          </div>

          {/* Filtro de Status Toggle */}
          <div className="flex items-center space-x-1 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {[
              { key: 'ALL', label: 'Todos' },
              { key: 'PENDING', label: 'Triagem' },
              { key: 'APPROVED', label: 'Validados' },
              { key: 'IN_PROGRESS', label: 'Em Andamento' },
              { key: 'RESOLVED', label: 'Resolvidos' },
            ].map((st) => (
              <button
                key={st.key}
                onClick={() => setSelectedStatus(st.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedStatus === st.key
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chips de Categorias */}
        <div className="flex items-center space-x-2 overflow-x-auto pt-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${
              selectedCategory === 'ALL'
                ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            }`}
          >
            Todas as Categorias ({incidentsWithinRadius.length})
          </button>
          {categories.map((cat) => {
            const count = incidentsWithinRadius.filter((i) => i.category_id === cat.id).length;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap border flex items-center space-x-1.5 transition-all ${
                  isSelected
                    ? 'font-bold shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
                style={
                  isSelected
                    ? {
                        backgroundColor: `${cat.color_hex}15`,
                        borderColor: cat.color_hex,
                        color: cat.color_hex,
                      }
                    : undefined
                }
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color_hex }} />
                <span>{cat.name}</span>
                <span className="text-[10px] opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid Principal: Mapa e Lista de Ocorrências */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start">
        {/* Coluna Esquerda / Mapa Geoespacial com PostGIS (7 colunas) */}
        <div className="lg:col-span-7 flex flex-col space-y-3">
          <div className="h-[420px] sm:h-[500px] w-full relative">
            <IncidentMap
              incidents={filteredIncidents}
              center={userCoords}
              zoom={13}
              radiusKm={radiusKm}
              selectedIncident={selectedIncident}
              onSelectIncident={onSelectIncident}
            />
          </div>

          {/* Controle de Raio PostGIS */}
          <RadiusSlider radiusKm={radiusKm} onChange={setRadiusKm} />
        </div>

        {/* Coluna Direita / Feed de Ocorrências Próximas (5 colunas) */}
        <div className="lg:col-span-5 flex flex-col space-y-3">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Ocorrências na Região ({filteredIncidents.length})
              </h2>
              <p className="text-xs text-slate-500">
                Mostrando problemas em até {radiusKm} km da área selecionada
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={useMyLocation}
                disabled={locationState === 'loading'}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
              >
                <LocateFixed className="h-3.5 w-3.5 text-brand-600" />{' '}
                {locationState === 'loading' ? 'Localizando' : 'Minha localização'}
              </button>
              <button
                onClick={onOpenReportModal}
                className="text-xs font-bold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100/80 px-2.5 py-1.5 rounded-lg border border-brand-200 transition-colors"
              >
                + Reportar
              </button>
            </div>
          </div>
          {locationState === 'denied' && (
            <p role="status" className="text-xs text-amber-700">
              Não foi possível acessar sua localização. Você pode continuar usando a área padrão ou
              marcar um ponto no mapa.
            </p>
          )}

          {/* Lista com Rolagem */}
          <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-40 w-full" />
              ))
            ) : filteredIncidents.length > 0 ? (
              filteredIncidents.map((inc) => (
                <IncidentCard
                  key={inc.id}
                  incident={inc}
                  onClick={() => onSelectIncident(inc)}
                  onVote={(e) => onVote(inc.id, e)}
                />
              ))
            ) : (
              <EmptyState
                title="Nenhuma ocorrência encontrada"
                description="Tente ampliar o raio ou rever seus filtros."
                action={
                  <button
                    onClick={clearFilters}
                    className="rounded-xl bg-brand-600 px-3 py-2 text-xs font-bold text-white"
                  >
                    Limpar filtros
                  </button>
                }
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
