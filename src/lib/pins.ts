/** Community map pin model (shared + hazard + artisan). Schema-ready for other layers. */

export type PinLayer = 'hazard' | 'artisan' | 'housing' | 'centre' | 'urgent';
export type PinStatus = 'active' | 'expired' | 'hidden' | 'taken';
export type PinSource = 'app' | 'import' | 'admin';

export type HazardType =
  | 'flood'
  | 'road_cut'
  | 'pothole'
  | 'drain'
  | 'accident'
  | 'other';

export type HazardSeverity = 'low' | 'medium' | 'high';

export type ArtisanTrade =
  | 'plumber'
  | 'electrician'
  | 'ac'
  | 'carpenter'
  | 'painter'
  | 'welder'
  | 'other';

export type ArtisanAvailability = 'weekdays' | 'weekends' | 'anytime' | 'custom';

export interface SharedPinFields {
  id: string;
  layer: PinLayer;
  title: string;
  slug?: string;
  code: string;
  lat: number;
  lng: number;
  accuracyM?: number;
  state?: string;
  lga?: string;
  landmark?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  body?: string;
  photoUrls?: string[];
  tags?: string[];
  language?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
  status: PinStatus;
  reportCount: number;
  createdBy?: string;
  source?: PinSource;
}

export interface HazardFields {
  hazardType: HazardType;
  severity: HazardSeverity;
  directionHint?: string;
  stillThere?: boolean | 'unknown';
  confirmedCount: number;
}

export interface ArtisanFields {
  trade: ArtisanTrade;
  tradesOther?: string;
  yearsExperience?: number;
  serviceRadiusKm?: number;
  areasServed?: string[];
  availability: ArtisanAvailability;
  availabilityNote?: string;
  priceHint?: string;
  verifiedHint?: boolean;
}

export type HazardPin = SharedPinFields & { layer: 'hazard' } & HazardFields;
export type ArtisanPin = SharedPinFields & { layer: 'artisan' } & ArtisanFields;

/** Union for shipped layers; housing/centre/urgent stay schema-ready only. */
export type CommunityPin = HazardPin | ArtisanPin;

export const HAZARD_TYPES: { value: HazardType; label: string }[] = [
  { value: 'flood', label: 'Flood' },
  { value: 'road_cut', label: 'Road cut / blocked' },
  { value: 'pothole', label: 'Pothole' },
  { value: 'drain', label: 'Open drain' },
  { value: 'accident', label: 'Accident' },
  { value: 'other', label: 'Other' },
];

export const HAZARD_SEVERITIES: { value: HazardSeverity; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

export const ARTISAN_TRADES: { value: ArtisanTrade; label: string }[] = [
  { value: 'plumber', label: 'Plumber' },
  { value: 'electrician', label: 'Electrician' },
  { value: 'ac', label: 'AC technician' },
  { value: 'carpenter', label: 'Carpenter' },
  { value: 'painter', label: 'Painter' },
  { value: 'welder', label: 'Welder' },
  { value: 'other', label: 'Other' },
];

export const ARTISAN_AVAILABILITIES: { value: ArtisanAvailability; label: string }[] = [
  { value: 'weekdays', label: 'Weekdays' },
  { value: 'weekends', label: 'Weekends' },
  { value: 'anytime', label: 'Anytime' },
  { value: 'custom', label: 'Custom' },
];

export const HAZARD_COLOUR = '#c62828';
export const ARTISAN_COLOUR = '#1565c0';
export const DEFAULT_HAZARD_TTL_MS = 72 * 60 * 60 * 1000; // 72h
export const STILL_THERE_EXTEND_MS = 24 * 60 * 60 * 1000; // +24h
export const DEFAULT_ARTISAN_TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 days
export const ARTISAN_RENEW_MS = 90 * 24 * 60 * 60 * 1000;
export const REPORT_HIDE_THRESHOLD = 3;

export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function hazardTypeLabel(t: HazardType): string {
  return HAZARD_TYPES.find((x) => x.value === t)?.label ?? t;
}

export function artisanTradeLabel(t: ArtisanTrade, other?: string): string {
  if (t === 'other' && other?.trim()) return other.trim();
  return ARTISAN_TRADES.find((x) => x.value === t)?.label ?? t;
}

export function isPinVisible(pin: CommunityPin, now = Date.now()): boolean {
  if (pin.status === 'hidden' || pin.status === 'taken') return false;
  if (pin.reportCount >= REPORT_HIDE_THRESHOLD) return false;
  if (pin.expiresAt && new Date(pin.expiresAt).getTime() <= now) return false;
  if (pin.status === 'expired') return false;
  return pin.status === 'active';
}

/** Mark expired / auto-hidden pins. */
export function refreshPinStatuses(pins: CommunityPin[], now = Date.now()): CommunityPin[] {
  return pins.map((pin) => {
    if (pin.status === 'hidden' || pin.status === 'taken') return pin;
    if (pin.reportCount >= REPORT_HIDE_THRESHOLD) {
      return { ...pin, status: 'hidden' as const, updatedAt: new Date(now).toISOString() };
    }
    if (pin.expiresAt && new Date(pin.expiresAt).getTime() <= now && pin.status === 'active') {
      return { ...pin, status: 'expired' as const, updatedAt: new Date(now).toISOString() };
    }
    return pin;
  });
}

export function pinDeepLink(pin: CommunityPin): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const basePath = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
  const q = new URLSearchParams();
  q.set('layer', pin.layer);
  q.set('pin', pin.id);
  return `${origin}${basePath}/#/c/${encodeURIComponent(pin.code)}?${q.toString()}`;
}

export function formatExpiresIn(expiresAt: string | null, now = Date.now()): string {
  if (!expiresAt) return 'No expiry';
  const ms = new Date(expiresAt).getTime() - now;
  if (ms <= 0) return 'Expired';
  const h = Math.floor(ms / (60 * 60 * 1000));
  if (h < 1) {
    const m = Math.max(1, Math.floor(ms / (60 * 1000)));
    return `${m}m left`;
  }
  if (h < 48) return `${h}h left`;
  const d = Math.floor(h / 24);
  return `${d}d left`;
}

export function normalizePhoneForWa(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('234')) return digits;
  if (digits.startsWith('0')) return `234${digits.slice(1)}`;
  return digits;
}
