/** Approximate bounding boxes for Nigerian states (MVP — coarse, deterministic). */

export interface NgState {
  code: string;
  name: string;
  /** [south, west, north, east] */
  bbox: [number, number, number, number];
}

/**
 * Coarse state boxes for Nigeria. Overlaps resolved by smallest area match.
 * Not cadastral — good enough for friendly codes like NG-LA-….
 */
export const NG_STATES: NgState[] = [
  { code: 'AB', name: 'Abia', bbox: [4.8, 7.0, 6.0, 7.8] },
  { code: 'AD', name: 'Adamawa', bbox: [7.3, 11.4, 11.0, 13.8] },
  { code: 'AK', name: 'Akwa Ibom', bbox: [4.4, 7.4, 5.5, 8.4] },
  { code: 'AN', name: 'Anambra', bbox: [5.7, 6.5, 6.8, 7.4] },
  { code: 'BA', name: 'Bauchi', bbox: [9.3, 8.7, 12.5, 11.5] },
  { code: 'BY', name: 'Bayelsa', bbox: [4.2, 5.3, 5.4, 6.8] },
  { code: 'BE', name: 'Benue', bbox: [6.4, 7.5, 8.2, 10.0] },
  { code: 'BO', name: 'Borno', bbox: [10.0, 11.5, 13.7, 14.7] },
  { code: 'CR', name: 'Cross River', bbox: [4.7, 7.8, 6.9, 9.5] },
  { code: 'DE', name: 'Delta', bbox: [5.0, 5.0, 6.5, 6.8] },
  { code: 'EB', name: 'Ebonyi', bbox: [5.7, 7.5, 6.8, 8.5] },
  { code: 'ED', name: 'Edo', bbox: [5.7, 5.0, 7.6, 6.7] },
  { code: 'EK', name: 'Ekiti', bbox: [7.3, 4.9, 8.1, 5.9] },
  { code: 'EN', name: 'Enugu', bbox: [5.9, 6.8, 7.1, 7.9] },
  { code: 'FC', name: 'FCT', bbox: [8.4, 6.8, 9.3, 7.8] },
  { code: 'GO', name: 'Gombe', bbox: [9.5, 10.5, 11.5, 11.8] },
  { code: 'IM', name: 'Imo', bbox: [5.2, 6.6, 5.9, 7.4] },
  { code: 'JI', name: 'Jigawa', bbox: [11.0, 8.0, 13.0, 10.7] },
  { code: 'KD', name: 'Kaduna', bbox: [9.0, 6.0, 11.5, 8.8] },
  { code: 'KN', name: 'Kano', bbox: [10.8, 7.8, 12.6, 9.5] },
  { code: 'KT', name: 'Katsina', bbox: [11.5, 6.8, 13.3, 9.0] },
  { code: 'KE', name: 'Kebbi', bbox: [10.0, 3.5, 13.5, 6.5] },
  { code: 'KO', name: 'Kogi', bbox: [6.7, 5.5, 8.7, 7.9] },
  { code: 'KW', name: 'Kwara', bbox: [8.0, 2.7, 10.2, 6.2] },
  { code: 'LA', name: 'Lagos', bbox: [6.35, 2.7, 6.75, 4.4] },
  { code: 'NA', name: 'Nasarawa', bbox: [7.7, 6.8, 9.3, 9.5] },
  { code: 'NI', name: 'Niger', bbox: [8.2, 3.5, 11.2, 7.5] },
  { code: 'OG', name: 'Ogun', bbox: [6.3, 2.6, 7.9, 4.9] },
  { code: 'ON', name: 'Ondo', bbox: [5.8, 4.3, 7.6, 6.1] },
  { code: 'OS', name: 'Osun', bbox: [7.2, 4.0, 8.1, 5.1] },
  { code: 'OY', name: 'Oyo', bbox: [7.0, 2.7, 9.2, 4.6] },
  { code: 'PL', name: 'Plateau', bbox: [8.3, 8.5, 10.4, 10.6] },
  { code: 'RI', name: 'Rivers', bbox: [4.3, 6.3, 5.7, 7.6] },
  { code: 'SO', name: 'Sokoto', bbox: [11.5, 4.0, 13.9, 6.8] },
  { code: 'TA', name: 'Taraba', bbox: [6.5, 9.0, 9.6, 12.0] },
  { code: 'YO', name: 'Yobe', bbox: [10.5, 9.5, 13.4, 12.5] },
  { code: 'ZA', name: 'Zamfara', bbox: [10.5, 5.5, 13.2, 7.8] },
];

const NG_BBOX = { south: 4.0, west: 2.5, north: 14.0, east: 15.0 };

export function isInNigeria(lat: number, lng: number): boolean {
  return (
    lat >= NG_BBOX.south &&
    lat <= NG_BBOX.north &&
    lng >= NG_BBOX.west &&
    lng <= NG_BBOX.east
  );
}

function area(bbox: [number, number, number, number]): number {
  return (bbox[2] - bbox[0]) * (bbox[3] - bbox[1]);
}

export function stateFromLatLng(
  lat: number,
  lng: number,
): NgState | null {
  const hits = NG_STATES.filter(
    (s) =>
      lat >= s.bbox[0] &&
      lat <= s.bbox[2] &&
      lng >= s.bbox[1] &&
      lng <= s.bbox[3],
  );
  if (hits.length === 0) {
    if (isInNigeria(lat, lng)) {
      return { code: 'NG', name: 'Nigeria', bbox: [4, 2.5, 14, 15] };
    }
    return null;
  }
  hits.sort((a, b) => area(a.bbox) - area(b.bbox));
  return hits[0];
}

export function stateByCode(code: string): NgState | undefined {
  return NG_STATES.find((s) => s.code === code.toUpperCase());
}

/** Nigeria map defaults */
export const NIGERIA_CENTER: [number, number] = [9.082, 8.675];
export const LAGOS_CENTER: [number, number] = [6.5244, 3.3792];
export const DEFAULT_ZOOM = 12;
