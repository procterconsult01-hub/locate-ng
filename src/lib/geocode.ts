/** Nominatim (OpenStreetMap) geocoding — free, rate-limited. Be polite. */

const NOMINATIM = 'https://nominatim.openstreetmap.org';
const UA = 'LocateNG/1.0 (https://github.com/locate-ng; nigeria-location-codes)';

export interface GeoResult {
  lat: number;
  lng: number;
  displayName: string;
  type?: string;
}

export interface ReverseResult {
  displayName: string;
  city?: string;
  state?: string;
  suburb?: string;
}

let lastRequestAt = 0;
const MIN_INTERVAL_MS = 1100; // Nominatim asks ≤1 req/sec

async function throttle(): Promise<void> {
  const now = Date.now();
  const wait = MIN_INTERVAL_MS - (now - lastRequestAt);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastRequestAt = Date.now();
}

export async function searchNigeria(query: string, limit = 5): Promise<GeoResult[]> {
  if (!query.trim()) return [];
  await throttle();
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    addressdetails: '1',
    limit: String(limit),
    countrycodes: 'ng',
  });
  const res = await fetch(`${NOMINATIM}/search?${params}`, {
    headers: { Accept: 'application/json', 'User-Agent': UA },
  });
  if (!res.ok) throw new Error('Search failed');
  const data = (await res.json()) as Array<{
    lat: string;
    lon: string;
    display_name: string;
    type?: string;
  }>;
  return data.map((d) => ({
    lat: parseFloat(d.lat),
    lng: parseFloat(d.lon),
    displayName: d.display_name,
    type: d.type,
  }));
}

export async function reverseGeocode(lat: number, lng: number): Promise<ReverseResult | null> {
  await throttle();
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    format: 'json',
    addressdetails: '1',
    zoom: '18',
  });
  const res = await fetch(`${NOMINATIM}/reverse?${params}`, {
    headers: { Accept: 'application/json', 'User-Agent': UA },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    display_name?: string;
    address?: Record<string, string>;
    error?: string;
  };
  if (data.error || !data.display_name) return null;
  const a = data.address ?? {};
  return {
    displayName: data.display_name,
    city: a.city || a.town || a.village || a.municipality,
    state: a.state,
    suburb: a.suburb || a.neighbourhood || a.quarter,
  };
}
