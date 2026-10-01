import type { LocationCodes } from './codes';

const KEY = 'locate-ng:saved';

export interface SavedPin extends LocationCodes {
  address?: string;
  savedAt: number;
}

export function loadSaved(): SavedPin[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedPin[];
  } catch {
    return [];
  }
}

export function savePin(pin: Omit<SavedPin, 'savedAt'> & { savedAt?: number }): SavedPin[] {
  const list = loadSaved().filter(
    (p) => p.friendlyCode !== pin.friendlyCode && p.plusCode !== pin.plusCode,
  );
  list.unshift({ ...pin, savedAt: pin.savedAt ?? Date.now() });
  const trimmed = list.slice(0, 50);
  localStorage.setItem(KEY, JSON.stringify(trimmed));
  return trimmed;
}

export function findSavedByCode(code: string): SavedPin | undefined {
  const u = code.trim().toUpperCase();
  return loadSaved().find(
    (p) =>
      p.friendlyCode.toUpperCase() === u ||
      p.plusCode.toUpperCase() === u ||
      p.plusCode.replace('+', '').toUpperCase() === u.replace(/[^A-Z0-9]/g, ''),
  );
}
