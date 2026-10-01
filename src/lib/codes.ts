import { encodePlusCode, decodePlusCode, plusToCompact, compactToPlus, isValidPlusCode } from './olc';
import { stateFromLatLng, stateByCode } from './states';

export interface LocationCodes {
  lat: number;
  lng: number;
  plusCode: string;
  friendlyCode: string;
  stateCode: string;
  stateName: string;
}

/**
 * Friendly format: NG-{STATE}-{COMPACT_PLUS}
 * Example: NG-LA-6FR5G9FHQM
 *
 * Deterministic from lat/lng:
 *   Plus Code (length 10) → strip "+" → prepend NG-{state}
 * Lookup of friendly code reconstructs Plus Code and decodes coordinates.
 */
export function codesFromLatLng(lat: number, lng: number): LocationCodes {
  const plusCode = encodePlusCode(lat, lng);
  const state = stateFromLatLng(lat, lng);
  const stateCode = state?.code ?? 'NG';
  const stateName = state?.name ?? 'Nigeria';
  const compact = plusToCompact(plusCode);
  const friendlyCode = `NG-${stateCode}-${compact}`;
  return { lat, lng, plusCode, friendlyCode, stateCode, stateName };
}

const FRIENDLY_RE = /^NG-([A-Z]{2})-([A-Z0-9]{8,})$/i;
const FRIENDLY_LOOSE = /^(?:NG-)?([A-Z]{2})-([A-Z0-9]{8,})$/i;

export function parseFriendlyCode(input: string): { stateCode: string; plusCode: string } | null {
  const raw = input.trim().toUpperCase().replace(/\s+/g, '');
  let m = raw.match(FRIENDLY_RE);
  if (!m) m = raw.match(FRIENDLY_LOOSE);
  if (!m) return null;
  const stateCode = m[1];
  const plusCode = compactToPlus(m[2]);
  if (!isValidPlusCode(plusCode)) return null;
  // Soft-check state exists (allow NG)
  if (stateCode !== 'NG' && !stateByCode(stateCode)) {
    // still accept — state is display-only for decode
  }
  return { stateCode, plusCode };
}

export type LookupResult =
  | { ok: true; lat: number; lng: number; plusCode: string; friendlyCode?: string; via: 'plus' | 'friendly' }
  | { ok: false; error: string };

export function lookupCode(input: string): LookupResult {
  const raw = input.trim();
  if (!raw) return { ok: false, error: 'Enter a LocateNG or Plus Code' };

  // Try friendly first
  const friendly = parseFriendlyCode(raw);
  if (friendly) {
    const coords = decodePlusCode(friendly.plusCode);
    if (!coords) return { ok: false, error: 'Could not decode that code' };
    const codes = codesFromLatLng(coords.lat, coords.lng);
    return {
      ok: true,
      lat: coords.lat,
      lng: coords.lng,
      plusCode: friendly.plusCode,
      friendlyCode: codes.friendlyCode,
      via: 'friendly',
    };
  }

  // Plus Code (full or short)
  if (isValidPlusCode(raw)) {
    const coords = decodePlusCode(raw);
    if (!coords) return { ok: false, error: 'Could not decode Plus Code' };
    const codes = codesFromLatLng(coords.lat, coords.lng);
    return {
      ok: true,
      lat: coords.lat,
      lng: coords.lng,
      plusCode: codes.plusCode,
      friendlyCode: codes.friendlyCode,
      via: 'plus',
    };
  }

  return {
    ok: false,
    error: 'Unrecognized code. Try NG-LA-6FR5G9FHQM or 6FR5G9FH+QM',
  };
}

export function sharePath(friendlyCode: string): string {
  // Hash-only path so share links work under GitHub Pages subpath base
  return `#/c/${friendlyCode}`;
}

export function shareUrl(friendlyCode: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  // Use Vite BASE_URL so share links work for both project Pages and custom-domain apex
  const basePath = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
  return `${origin}${basePath}/#/c/${friendlyCode}`;
}

export function googleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}
