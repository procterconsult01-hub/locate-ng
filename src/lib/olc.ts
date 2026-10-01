import { OpenLocationCode } from 'open-location-code';
import type { CodeArea } from 'open-location-code';

/**
 * @types/open-location-code declares static methods, but the published
 * package exposes instance methods. Use a narrow adapter interface.
 */
interface OlcApi {
  encode(lat: number, lng: number, codeLength?: number): string;
  decode(code: string): CodeArea;
  isValid(code: string): boolean;
  isShort(code: string): boolean;
  isFull(code: string): boolean;
  recoverNearest(shortCode: string, refLat: number, refLng: number): string;
  shorten(code: string, lat: number, lng: number): string;
}

const olc = new OpenLocationCode() as unknown as OlcApi;

/** ~14 m precision — good for building-level pins */
export const CODE_LENGTH = 10;

export function encodePlusCode(lat: number, lng: number, length = CODE_LENGTH): string {
  return olc.encode(lat, lng, length);
}

export function decodePlusCode(code: string): { lat: number; lng: number } | null {
  try {
    const normalized = code.trim().toUpperCase();
    if (!olc.isValid(normalized)) return null;
    let full = normalized;
    if (olc.isShort(normalized)) {
      full = olc.recoverNearest(normalized, 9.082, 8.675);
    }
    const d = olc.decode(full);
    return { lat: d.latitudeCenter, lng: d.longitudeCenter };
  } catch {
    return null;
  }
}

export function isValidPlusCode(code: string): boolean {
  try {
    return olc.isValid(code.trim().toUpperCase());
  } catch {
    return false;
  }
}

/** Compact form without + for embedding in friendly codes */
export function plusToCompact(plusCode: string): string {
  return plusCode.replace('+', '').toUpperCase();
}

/** Restore + after 8 characters (standard OLC layout for length ≥ 8) */
export function compactToPlus(compact: string): string {
  const c = compact.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  if (c.length < 8) return c;
  return `${c.slice(0, 8)}+${c.slice(8)}`;
}

/** Short display like 6FR5+G9 when a locality name is available */
export function shortPlusDisplay(plusCode: string, locality?: string): string {
  try {
    const full = plusCode.toUpperCase();
    const [head, tail] = full.split('+');
    const display = `${head.slice(-4)}+${(tail || '').slice(0, 2)}`;
    if (locality) return `${display} ${locality}`;
    try {
      const short = olc.shorten(plusCode, 9.082, 8.675);
      if (short && short.length < full.length) return short;
    } catch {
      /* shorten can fail far from reference */
    }
    return full;
  } catch {
    return plusCode;
  }
}
