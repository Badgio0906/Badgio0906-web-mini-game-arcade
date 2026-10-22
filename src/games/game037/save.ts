// Game037-only persistence. Rules v2 (growing boxes) uses new keys; the rules v1
// BEST key is left untouched and never read. Nothing outside game037 is touched.
import {BOARD_SIZES, RUN_MAX_SCORE, STAGES, STAGES_PER_SIZE, STAGE_MAX_SCORE, type StageResult} from './model';

export const BEST_KEY = 'web-mini-arcade:v1:game037:best:rules2';
export const CHECKPOINT_KEY = 'web-mini-arcade:v1:game037:checkpoint:rules2';
export const MUTE_KEY = 'web-mini-arcade:v1:game037:mute';
/** Rules v1 (4×4 only, 0..6000). Kept as-is for compatibility; not read by v2. */
export const LEGACY_BEST_KEY = 'web-mini-arcade:v1:game037:best:rules1';

type Backend = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export interface BestRecord {best: number; cleared: number}
/** Saved when a box is finished: continue from the first bento of the next box. */
export interface Checkpoint {sizeIndex: number; results: StageResult[]}

const int = (v: unknown, lo: number, hi: number): v is number => typeof v === 'number' && Number.isInteger(v) && v >= lo && v <= hi;

export function parseBest(raw: string | null): BestRecord {
  const none = {best: 0, cleared: 0};
  if (raw === null || raw.length > 64) return none;
  try {
    const v = JSON.parse(raw) as Partial<BestRecord>;
    return v && int(v.best, 0, RUN_MAX_SCORE) && int(v.cleared, 0, STAGES.length) && v.best <= v.cleared * STAGE_MAX_SCORE ? {best: v.best, cleared: v.cleared} : none;
  } catch {
    return none;
  }
}

export function parseCheckpoint(raw: string | null): Checkpoint | null {
  if (raw === null || raw.length > 20000) return null;
  try {
    const v = JSON.parse(raw) as Checkpoint;
    if (!v || !int(v.sizeIndex, 1, BOARD_SIZES.length - 1) || !Array.isArray(v.results) || v.results.length !== v.sizeIndex * STAGES_PER_SIZE) return null;
    const ok = v.results.every((r, i) => r && r.stageIndex === i && r.size === STAGES[i].size && int(r.score, 0, STAGE_MAX_SCORE) && int(r.rotates, 0, 1e6) && int(r.undos, 0, 1e6) && typeof r.activeMs === 'number' && Number.isFinite(r.activeMs) && r.activeMs >= 0);
    return ok ? {sizeIndex: v.sizeIndex, results: v.results.map(r => ({stageIndex: r.stageIndex, size: r.size, activeMs: r.activeMs, rotates: r.rotates, undos: r.undos, score: r.score}))} : null;
  } catch {
    return null;
  }
}

/**
 * LocalStorage wrapper with a page-memory fallback. `persistent` turns false
 * as soon as any read/write is refused so the UI never claims a durable save.
 */
export class BentoStore {
  private backend: Backend | null = null;
  private memory = new Map<string, string | null>();
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

  private set(key: string, value: string | null): void {
    this.memory.set(key, value);
    if (!this.backend) return;
    try {
      if (value === null) this.backend.removeItem(key); else this.backend.setItem(key, value);
    } catch {
      this.persistent = false;
    }
  }

  best(): BestRecord { return parseBest(this.get(BEST_KEY)); }

  /** Production run only: called after every cleared bento with the running total. True when BEST improved. */
  offerBest(total: number, cleared: number): boolean {
    if (!int(total, 0, RUN_MAX_SCORE) || !int(cleared, 1, STAGES.length) || total > cleared * STAGE_MAX_SCORE) return false;
    const cur = this.best();
    if (total < cur.best || (total === cur.best && cleared <= cur.cleared)) return false;
    this.set(BEST_KEY, JSON.stringify({best: total, cleared}));
    return total > cur.best;
  }

  checkpoint(): Checkpoint | null { return parseCheckpoint(this.get(CHECKPOINT_KEY)); }
  saveCheckpoint(c: Checkpoint | null): void { this.set(CHECKPOINT_KEY, c ? JSON.stringify(c) : null); }

  muted(): boolean { return this.get(MUTE_KEY) === '1'; }
  setMuted(m: boolean): void { this.set(MUTE_KEY, m ? '1' : '0'); }
}
