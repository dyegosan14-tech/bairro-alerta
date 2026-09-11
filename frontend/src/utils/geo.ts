const EARTH_RADIUS_METERS = 6371000;

/**
 * Distância em metros entre duas coordenadas (fórmula de Haversine), usada para calcular
 * o raio de busca no cliente. O backend já faz o cálculo equivalente via PostGIS
 * (ST_Distance/ST_DWithin em geography) quando lat/lng/radius_km são enviados na consulta
 * — esta função replica isso no frontend para o slider de raio da Home, que hoje busca a
 * lista completa (sem filtro geoespacial no backend) e refina localmente.
 */
export function haversineDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}
