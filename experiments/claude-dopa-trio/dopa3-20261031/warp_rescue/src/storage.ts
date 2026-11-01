// Game-local persistence. Only touches this game's own fixed keys; never enumerates other keys.
export const STORAGE_NAMESPACE = 'web-mini-arcade:v1:ct3:warp_rescue';
export const BEST_KEY = `${STORAGE_NAMESPACE}:best:rules1`;
export const SETTINGS_KEY = `${STORAGE_NAMESPACE}:settings`;

const memory = new Map<string, string>();
let persistent = true;

function read(key: string): string | null {
  try { return window.localStorage.getItem(key); } catch { persistent = false; return memory.get(key) ?? null; }
}
function write(key: string, value: string) {
  memory.set(key, value);
  try { window.localStorage.setItem(key, value); } catch { persistent = false; }
}

export function isPersistent() { read(SETTINGS_KEY); return persistent; }

export interface BestRecord { score: number; rank: string; at: string }
export function loadBest(): BestRecord | null {
  const raw = read(BEST_KEY);
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as BestRecord;
    return Number.isFinite(v.score) && v.score >= 0 ? v : null;
  } catch { return null; }
}
export function saveBestIfHigher(rec: BestRecord): boolean {
  const cur = loadBest();
  if (cur && cur.score >= rec.score) return false;
  write(BEST_KEY, JSON.stringify(rec));
  return true;
}

export interface Settings { muted: boolean; reducedMotion: boolean }
export function loadSettings(): Settings {
  const fallback = { muted: false, reducedMotion: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false };
  const raw = read(SETTINGS_KEY);
  if (!raw) return fallback;
  try { return { ...fallback, ...(JSON.parse(raw) as Partial<Settings>) }; } catch { return fallback; }
}
export function saveSettings(s: Settings) { write(SETTINGS_KEY, JSON.stringify(s)); }
