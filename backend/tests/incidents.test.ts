import { describe, it, expect } from 'vitest';
import { createIncidentSchema, listIncidentsQuerySchema } from '../src/modules/incidents/incidents.schema.js';

describe('Módulo de Ocorrências - Validação Geoespacial e Schemas', () => {
  it('deve validar ocorrência com coordenadas válidas de latitude e longitude', () => {
    const validIncident = {
      title: 'Vazamento de água na calçada',
      description: 'Vazamento contínuo de água limpa há 3 dias na porta da escola.',
      category_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      latitude: -23.5505,
      longitude: -46.6333,
      address_text: 'Praça da Sé, 100',
      neighborhood: 'Sé',
      city: 'São Paulo',
      priority: 'HIGH',
      image_urls: ['/uploads/foto1.jpg'],
    };

    const parsed = createIncidentSchema.safeParse(validIncident);
    expect(parsed.success).toBe(true);
  });

  it('deve rejeitar latitude fora dos limites (-90 a +90)', () => {
    const invalidCoords = {
      title: 'Poste apagado na rua',
      description: 'Rua escura sem iluminação pública.',
      category_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      latitude: 95.0, // Inválido!
      longitude: -46.6333,
      address_text: 'Rua Augusta, 500',
      neighborhood: 'Consolação',
    };

    const parsed = createIncidentSchema.safeParse(invalidCoords);
    expect(parsed.success).toBe(false);
  });

  it('deve validar parâmetros de busca geoespacial por raio em km', () => {
    const geoQuery = {
      lat: -23.5615,
      lng: -46.6912,
      radius_km: 5,
      status: 'IN_PROGRESS',
      limit: 20,
    };

    const parsed = listIncidentsQuerySchema.safeParse(geoQuery);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.radius_km).toBe(5);
      expect(parsed.data.status).toBe('IN_PROGRESS');
    }
  });

  it('deve calcular distância esférica (fórmula Haversine / PostGIS) corretamente', () => {
    // Cálculo de distância entre dois pontos (Sé e Paulista em SP ~ 2.5 km)
    function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
      const R = 6371; // Raio da Terra em km
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    }

    const seLat = -23.5505;
    const seLng = -46.6333;
    const paulistaLat = -23.5615;
    const paulistaLng = -46.6559;

    const distance = calculateDistanceKm(seLat, seLng, paulistaLat, paulistaLng);
    expect(distance).toBeGreaterThan(2.0);
    expect(distance).toBeLessThan(3.0);
  });
});
