/**
 * LocateNG short "zip" codes — 5 characters, Nigeria grid.
 *
 * Tradeoff: shorter code ⇒ larger cell. Five Crockford-style base-32
 * digits over the Nigeria bbox (~4–14°N, 2.5–15°E) give ~215 m cells.
 * Use Plus Codes (~14 m) when you need building-level precision.
 *
 * Alphabet omits I, L, O, U (easy to confuse when spoken). On decode,
 * O→0, I/L→1, U→V so people can type the look-alikes.
 */

const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // 32 chars, Crockford-ish
const BASE = ALPHABET.length;
export const SHORT_CODE_LENGTH = 5;
const CAPACITY = BASE ** SHORT_CODE_LENGTH; // 33_554_432

/** Same envelope as states.ts NG_BBOX */
export const SHORT_BBOX = { south: 4.0, west: 2.5, north: 14.0, east: 15.0 };

const LAT_SPAN = SHORT_BBOX.north - SHORT_BBOX.south; // 10°
const LNG_SPAN = SHORT_BBOX.east - SHORT_BBOX.west; // 12.5°

/** Prefer nearly square cells; fill as much of CAPACITY as possible. */
const ROWS = Math.floor(Math.sqrt(CAPACITY * (LAT_SPAN / LNG_SPAN))); // ~5181
const COLS = Math.floor(CAPACITY / ROWS); // ~6476
const CELL_LAT = LAT_SPAN / ROWS; // ≈ 0.00193° ≈ 215 m
const CELL_LNG = LNG_SPAN / COLS; // ≈ 0.00193° ≈ 215 m

/** Approximate cell size in metres (Nigeria latitudes). */
export const SHORT_CELL_METRES = 215;

function encodeIndex(n: number): string {
  let x = n;
  let out = '';
  for (let i = 0; i < SHORT_CODE_LENGTH; i++) {
    out = ALPHABET[x % BASE] + out;
    x = Math.floor(x / BASE);
  }
  return out;
}

function decodeIndex(code: string): number | null {
  let n = 0;
  for (const ch of code) {
    const v = ALPHABET.indexOf(ch);
    if (v < 0) return null;
    n = n * BASE + v;
  }
  return n;
}

/** Normalize spoken confusions before decode. */
export function normalizeShortCode(input: string): string {
  return input
    .trim()
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, '')
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1')
    .replace(/U/g, 'V');
}

export function isInShortGrid(lat: number, lng: number): boolean {
  return (
    lat >= SHORT_BBOX.south &&
    lat <= SHORT_BBOX.north &&
    lng >= SHORT_BBOX.west &&
    lng <= SHORT_BBOX.east
  );
}

/**
 * Encode lat/lng to a 5-char short code, or null if outside the Nigeria grid.
 * Deterministic: same cell → same code.
 */
export function encodeShortCode(lat: number, lng: number): string | null {
  if (!isInShortGrid(lat, lng)) return null;

  let row = Math.floor((lat - SHORT_BBOX.south) / CELL_LAT);
  let col = Math.floor((lng - SHORT_BBOX.west) / CELL_LNG);
  // Clamp north/east edges (lat/lng === max map to last cell)
  if (row >= ROWS) row = ROWS - 1;
  if (col >= COLS) col = COLS - 1;
  if (row < 0 || col < 0) return null;

  const index = row * COLS + col;
  if (index < 0 || index >= ROWS * COLS) return null;
  return encodeIndex(index);
}

/**
 * Decode a 5-char short code to the cell center.
 */
export function decodeShortCode(input: string): { lat: number; lng: number } | null {
  const code = normalizeShortCode(input);
  if (code.length !== SHORT_CODE_LENGTH) return null;
  const index = decodeIndex(code);
  if (index === null || index < 0 || index >= ROWS * COLS) return null;

  const row = Math.floor(index / COLS);
  const col = index % COLS;
  const lat = SHORT_BBOX.south + (row + 0.5) * CELL_LAT;
  const lng = SHORT_BBOX.west + (col + 0.5) * CELL_LNG;
  return { lat, lng };
}

export function isShortCode(input: string): boolean {
  const code = normalizeShortCode(input);
  if (code.length !== SHORT_CODE_LENGTH) return false;
  return decodeShortCode(code) !== null;
}
