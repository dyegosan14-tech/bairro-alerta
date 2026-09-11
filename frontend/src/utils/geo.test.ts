import { describe, it, expect } from 'vitest';
import { haversineDistanceMeters } from './geo.js';

describe('haversineDistanceMeters', () => {
  it('retorna 0 para o mesmo ponto', () => {
    expect(haversineDistanceMeters(-23.5505, -46.6333, -23.5505, -46.6333)).toBeCloseTo(0, 3);
  });

  it('calcula ~2.5km entre a Sé e a Av. Paulista (mesma referência usada em incidents.test.ts do backend)', () => {
    const seLat = -23.5505;
    const seLng = -46.6333;
    const paulistaLat = -23.5615;
    const paulistaLng = -46.6559;
    const distanceKm = haversineDistanceMeters(seLat, seLng, paulistaLat, paulistaLng) / 1000;
    expect(distanceKm).toBeGreaterThan(2.0);
    expect(distanceKm).toBeLessThan(3.0);
  });

  it('é simétrica (distância de A->B é igual a B->A)', () => {
    const d1 = haversineDistanceMeters(-23.55, -46.63, -23.6, -46.68);
    const d2 = haversineDistanceMeters(-23.6, -46.68, -23.55, -46.63);
    expect(d1).toBeCloseTo(d2, 6);
  });
});
