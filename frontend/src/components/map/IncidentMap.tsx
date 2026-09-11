import React, { useEffect, useRef } from 'react';
import { Incident } from '../../types/index.js';
import L from 'leaflet';

interface IncidentMapProps {
  incidents: Incident[];
  center: [number, number];
  zoom?: number;
  radiusKm?: number;
  selectedIncident?: Incident | null;
  onSelectIncident?: (incident: Incident) => void;
  isPickerMode?: boolean;
  pickerCoords?: [number, number] | null;
  onPickLocation?: (coords: [number, number]) => void;
}

export const IncidentMap: React.FC<IncidentMapProps> = ({
  incidents,
  center,
  zoom = 13,
  radiusKm,
  selectedIncident,
  onSelectIncident,
  isPickerMode = false,
  pickerCoords,
  onPickLocation,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const circleLayerRef = useRef<L.Circle | null>(null);
  const pickerMarkerRef = useRef<L.Marker | null>(null);

  // Inicializar o mapa Leaflet
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center,
      zoom,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    markersGroupRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (map) map.setView(center, map.getZoom(), { animate: true });
  }, [center]);

  // Evento de clique para o modo Seletor de Coordenadas
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleClick = (e: L.LeafletMouseEvent) => {
      if (isPickerMode && onPickLocation) {
        onPickLocation([e.latlng.lat, e.latlng.lng]);
      }
    };

    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [isPickerMode, onPickLocation]);

  // Atualizar marcador de localização escolhida no modo picker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (isPickerMode && pickerCoords) {
      if (!pickerMarkerRef.current) {
        const pickerIcon = L.divIcon({
          className: 'custom-picker-pin',
          html: `<div class="w-8 h-8 bg-rose-600 rounded-full border-4 border-white shadow-xl flex items-center justify-center text-white text-xs font-bold animate-bounce">📍</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
        });
        pickerMarkerRef.current = L.marker(pickerCoords, { icon: pickerIcon }).addTo(map);
      } else {
        pickerMarkerRef.current.setLatLng(pickerCoords);
      }
    } else if (pickerMarkerRef.current) {
      pickerMarkerRef.current.remove();
      pickerMarkerRef.current = null;
    }
  }, [isPickerMode, pickerCoords]);

  // Desenhar e atualizar o círculo de raio de busca PostGIS
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (circleLayerRef.current) {
      circleLayerRef.current.remove();
      circleLayerRef.current = null;
    }

    if (radiusKm && radiusKm > 0) {
      circleLayerRef.current = L.circle(center, {
        radius: radiusKm * 1000,
        color: '#0284c7',
        fillColor: '#38bdf8',
        fillOpacity: 0.12,
        weight: 1.5,
        dashArray: '4, 4',
      }).addTo(map);
    }
  }, [center, radiusKm]);

  // Renderizar pinos de ocorrências no mapa
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    if (typeof markersGroup.clearLayers === 'function') {
      markersGroup.clearLayers();
    }

    if (isPickerMode) return; // Não renderiza ocorrências se estiver apenas escolhendo local

    const statusColors: Record<string, string> = {
      PENDING: '#F59E0B',
      APPROVED: '#3B82F6',
      IN_PROGRESS: '#8B5CF6',
      RESOLVED: '#10B981',
      REJECTED: '#EF4444',
    };

    incidents.forEach((inc) => {
      const isSelected = selectedIncident?.id === inc.id;
      const color = statusColors[inc.status] || '#0284c7';

      const customIcon = L.divIcon({
        className: 'custom-incident-marker',
        html: `
          <div class="group relative flex items-center justify-center">
            <div class="w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white transition-all transform ${
              isSelected ? 'scale-125 ring-4 ring-brand-400' : 'hover:scale-110'
            }" style="background-color: ${color};">
              <span class="text-xs font-bold">${inc.upvotes_count || 0}</span>
            </div>
            ${
              inc.priority === 'URGENT'
                ? '<span class="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-white animate-ping"></span>'
                : ''
            }
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([inc.latitude, inc.longitude], { icon: customIcon });

      marker.on('click', () => {
        if (onSelectIncident) {
          onSelectIncident(inc);
        }
      });

      marker.bindTooltip(
        `<div class="font-semibold text-xs text-slate-800">${inc.title}</div>
         <div class="text-[10px] text-slate-500">${inc.neighborhood} • ${inc.category_name}</div>`,
        { direction: 'top', offset: [0, -16] }
      );

      markersGroup.addLayer(marker);
    });
  }, [incidents, selectedIncident, isPickerMode, onSelectIncident]);

  return (
    <div className="relative w-full h-full min-h-[350px] rounded-2xl overflow-hidden shadow-inner border border-slate-200">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Instrução flutuante quando em modo seletor */}
      {isPickerMode && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-slate-900/90 text-white text-xs font-medium px-4 py-2 rounded-full shadow-lg backdrop-blur-sm pointer-events-none flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
          <span>Clique no mapa para marcar a localização exata do problema</span>
        </div>
      )}
    </div>
  );
};
