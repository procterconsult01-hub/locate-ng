/**
 * Client-only community pin store (localStorage).
 *
 * v1 limitation: pins are device-scoped. Other users on locate-ng.com will not
 * see your hazards/artisans until a shared backend (e.g. Supabase / Firebase /
 * JSON API) is added. Export/import helpers can move data between devices.
 */

import {
  refreshPinStatuses,
  type ArtisanAvailability,
  type ArtisanPin,
  type ArtisanTrade,
  type CommunityPin,
  type HazardPin,
  type HazardSeverity,
  type HazardType,
  DEFAULT_ARTISAN_TTL_MS,
  DEFAULT_HAZARD_TTL_MS,
  ARTISAN_RENEW_MS,
  STILL_THERE_EXTEND_MS,
  REPORT_HIDE_THRESHOLD,
  newId,
  isPinVisible,
  normalizePhoneForWa,
} from './pins';
import { codesFromLatLng } from './codes';

const PINS_KEY = 'locate-ng:community-pins';
const DEVICE_KEY = 'locate-ng:device-id';

export function getDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = newId();
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return 'anon';
  }
}

function readRaw(): CommunityPin[] {
  try {
    const raw = localStorage.getItem(PINS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CommunityPin[];
    if (!Array.isArray(parsed)) return [];
    return refreshPinStatuses(parsed);
  } catch {
    return [];
  }
}

function writeAll(pins: CommunityPin[]): void {
  localStorage.setItem(PINS_KEY, JSON.stringify(pins));
}

export function loadPins(): CommunityPin[] {
  const pins = readRaw();
  writeAll(pins);
  return pins;
}

export function loadVisiblePins(layers?: CommunityPin['layer'][]): CommunityPin[] {
  const pins = loadPins().filter((p) => isPinVisible(p));
  if (!layers || layers.length === 0) return [];
  return pins.filter((p) => layers.includes(p.layer));
}

export function getPinById(id: string): CommunityPin | undefined {
  return loadPins().find((p) => p.id === id);
}

function baseFromLatLng(
  lat: number,
  lng: number,
  input: {
    title: string;
    body?: string;
    landmark?: string;
    phone?: string;
    accuracyM?: number;
  },
  ttlMs: number,
  layer: 'hazard' | 'artisan',
) {
  const now = Date.now();
  const codes = codesFromLatLng(lat, lng);
  const phone = input.phone?.trim() || undefined;
  return {
    id: newId(),
    layer,
    title: input.title.trim().slice(0, 80),
    code: codes.friendlyCode,
    lat,
    lng,
    accuracyM: input.accuracyM,
    state: codes.stateName !== 'Nigeria' ? codes.stateName : undefined,
    landmark: input.landmark?.trim() || undefined,
    phone,
    whatsapp: phone ? normalizePhoneForWa(phone) : undefined,
    body: input.body?.trim().slice(0, 500) || undefined,
    createdAt: new Date(now).toISOString(),
    updatedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + ttlMs).toISOString(),
    status: 'active' as const,
    reportCount: 0,
    createdBy: getDeviceId(),
    source: 'app' as const,
  };
}

export interface CreateHazardInput {
  title: string;
  body?: string;
  landmark?: string;
  phone?: string;
  lat: number;
  lng: number;
  accuracyM?: number;
  hazardType: HazardType;
  severity: HazardSeverity;
  directionHint?: string;
  ttlMs?: number;
}

export function createHazardPin(input: CreateHazardInput): HazardPin {
  const pin: HazardPin = {
    ...baseFromLatLng(input.lat, input.lng, input, input.ttlMs ?? DEFAULT_HAZARD_TTL_MS, 'hazard'),
    layer: 'hazard',
    hazardType: input.hazardType,
    severity: input.severity,
    directionHint: input.directionHint?.trim() || undefined,
    stillThere: 'unknown',
    confirmedCount: 0,
  };
  const all = loadPins().filter((p) => p.id !== pin.id);
  all.unshift(pin);
  writeAll(all);
  return pin;
}

export interface CreateArtisanInput {
  title: string;
  body?: string;
  landmark?: string;
  phone?: string;
  lat: number;
  lng: number;
  accuracyM?: number;
  trade: ArtisanTrade;
  tradesOther?: string;
  yearsExperience?: number;
  serviceRadiusKm?: number;
  areasServed?: string[];
  availability: ArtisanAvailability;
  availabilityNote?: string;
  priceHint?: string;
  ttlMs?: number;
}

export function createArtisanPin(input: CreateArtisanInput): ArtisanPin {
  const pin: ArtisanPin = {
    ...baseFromLatLng(
      input.lat,
      input.lng,
      input,
      input.ttlMs ?? DEFAULT_ARTISAN_TTL_MS,
      'artisan',
    ),
    layer: 'artisan',
    trade: input.trade,
    tradesOther: input.tradesOther?.trim() || undefined,
    yearsExperience: input.yearsExperience,
    serviceRadiusKm: input.serviceRadiusKm,
    areasServed: input.areasServed?.length ? input.areasServed : undefined,
    availability: input.availability,
    availabilityNote: input.availabilityNote?.trim() || undefined,
    priceHint: input.priceHint?.trim() || undefined,
    verifiedHint: false,
  };
  const all = loadPins().filter((p) => p.id !== pin.id);
  all.unshift(pin);
  writeAll(all);
  return pin;
}

export function reportPin(id: string): CommunityPin | undefined {
  const all = loadPins();
  const idx = all.findIndex((p) => p.id === id);
  if (idx < 0) return undefined;
  const pin = { ...all[idx] };
  pin.reportCount = (pin.reportCount || 0) + 1;
  pin.updatedAt = new Date().toISOString();
  if (pin.reportCount >= REPORT_HIDE_THRESHOLD) {
    pin.status = 'hidden';
  }
  all[idx] = pin;
  writeAll(all);
  return pin;
}

export function confirmStillThere(id: string): CommunityPin | undefined {
  const all = loadPins();
  const idx = all.findIndex((p) => p.id === id);
  if (idx < 0) return undefined;
  const existing = all[idx];
  if (existing.layer !== 'hazard') return existing;
  const pin: HazardPin = { ...existing };
  const now = Date.now();
  const currentExpiry = pin.expiresAt ? new Date(pin.expiresAt).getTime() : now;
  const base = Math.max(currentExpiry, now);
  pin.expiresAt = new Date(base + STILL_THERE_EXTEND_MS).toISOString();
  pin.stillThere = true;
  pin.confirmedCount = (pin.confirmedCount || 0) + 1;
  pin.status = 'active';
  pin.updatedAt = new Date(now).toISOString();
  all[idx] = pin;
  writeAll(all);
  return pin;
}

export function renewArtisanPin(id: string): CommunityPin | undefined {
  const all = loadPins();
  const idx = all.findIndex((p) => p.id === id);
  if (idx < 0) return undefined;
  const existing = all[idx];
  if (existing.layer !== 'artisan') return existing;
  const now = Date.now();
  const pin: ArtisanPin = {
    ...existing,
    expiresAt: new Date(now + ARTISAN_RENEW_MS).toISOString(),
    status: 'active',
    updatedAt: new Date(now).toISOString(),
  };
  all[idx] = pin;
  writeAll(all);
  return pin;
}

export function exportPinsJson(): string {
  return JSON.stringify(loadPins(), null, 2);
}

export function importPinsJson(json: string): number {
  const parsed = JSON.parse(json) as CommunityPin[];
  if (!Array.isArray(parsed)) throw new Error('Expected JSON array of pins');
  const existing = loadPins();
  const byId = new Map(existing.map((p) => [p.id, p]));
  let added = 0;
  for (const p of parsed) {
    if (!p?.id || !p.layer) continue;
    if (!byId.has(p.id)) {
      byId.set(p.id, p);
      added += 1;
    }
  }
  writeAll(refreshPinStatuses([...byId.values()]));
  return added;
}
