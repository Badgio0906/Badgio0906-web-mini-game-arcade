// Game037-only persistence: BEST (rules v1) and mute. Nothing else is read or written.
import {RUN_MAX_SCORE} from './model';

export const BEST_KEY = 'web-mini-arcade:v1:game037:best:rules1';
export const MUTE_KEY = 'web-mini-arcade:v1:game037:mute';

type Backend = Pick<Storage, 'getItem' | 'setItem'>;

export function parseBest(raw: string | null): number {
  if (raw === null || raw.length > 32) return 0;
  try {
    const v = JSON.parse(raw) as {best?: unknown};
    const best = v && typeof v === 'object' ? v.best : undefined;
    return typeof best === 'number' && Number.isInteger(best) && best >= 0 && best <= RUN_MAX_SCORE ? best : 0;
  } catch {
    return 0;
  }
}

/**
 * LocalStorage wrapper with a page-memory fallback. `persistent` turns false
 * as soon as any read/write is refused so the UI never claims a durable save.
 */
export class BentoStore {
  private backend: Backend | null = null;
  private memory = new Map<string, string>();
  persistent = true;

  constructor(backend?: Backend | null) {
    try {
      this.backend = backend === undefined ? window.localStorage : backend;
    } catch {
      this.backend = null;
    }
    if (!this.backend) this.persistent = false;
  }

  private get(key: string): string | null {
    if (this.memory.has(key)) return this.memory.get(key)!;
    if (!this.backend) return null;
    try {
      return this.backend.getItem(key);
    } catch {
      this.persistent = false;
      return null;
    }
  }

  private set(key: string, value: string): void {
    this.memory.set(key, value);
    if (!this.backend) return;
    try {
      this.backend.setItem(key, value);
    } catch {
      this.persistent = false;
    }
  }

  best(): number { return parseBest(this.get(BEST_KEY)); }

  /** Only call for a completed 6-stage production run. Returns true when BEST improved. */
  offerBest(total: number): boolean {
    if (!Number.isInteger(total) || total < 0 || total > RUN_MAX_SCORE || total <= this.best()) return false;
    this.set(BEST_KEY, JSON.stringify({best: total}));
    return true;
  }

  muted(): boolean { return this.get(MUTE_KEY) === '1'; }
  setMuted(m: boolean): void { this.set(MUTE_KEY, m ? '1' : '0'); }
}
