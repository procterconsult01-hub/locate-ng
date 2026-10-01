/** Free routing via public OSRM / FOSSGIS endpoints — no API key. */

export type TravelMode = 'driving' | 'walking';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface RouteResult {
  mode: TravelMode;
  distanceM: number;
  durationS: number;
  /** [lat, lng] pairs for Leaflet */
  coordinates: [number, number][];
}

const OSRM_DRIVING = 'https://router.project-osrm.org/route/v1/driving';
/** FOSSGIS foot profile (public, no key) */
const OSRM_WALKING = 'https://routing.openstreetmap.de/routed-foot/route/v1/driving';

function endpoint(mode: TravelMode): string {
  return mode === 'walking' ? OSRM_WALKING : OSRM_DRIVING;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(meters < 10000 ? 1 : 0)} km`;
}

export function formatDuration(seconds: number): string {
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem ? `${h} h ${rem} min` : `${h} h`;
}

export async function fetchRoute(
  from: LatLng,
  to: LatLng,
  mode: TravelMode,
): Promise<RouteResult> {
  const path = `${from.lng},${from.lat};${to.lng},${to.lat}`;
  const url = `${endpoint(mode)}/${path}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Routing failed (${res.status})`);
  const data = (await res.json()) as {
    code?: string;
    routes?: Array<{
      distance: number;
      duration: number;
      geometry: { coordinates: [number, number][] };
    }>;
    message?: string;
  };
  if (data.code && data.code !== 'Ok') {
    throw new Error(data.message || data.code || 'No route');
  }
  const route = data.routes?.[0];
  if (!route) throw new Error('No route found');
  const coordinates: [number, number][] = route.geometry.coordinates.map(([lng, lat]) => [
    lat,
    lng,
  ]);
  return {
    mode,
    distanceM: route.distance,
    durationS: route.duration,
    coordinates,
  };
}

export function googleMapsDirectionsUrl(
  from: LatLng | null,
  to: LatLng,
  mode: TravelMode,
): string {
  const params = new URLSearchParams({
    api: '1',
    destination: `${to.lat},${to.lng}`,
    travelmode: mode,
  });
  if (from) params.set('origin', `${from.lat},${from.lng}`);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
