import { RULES_VERSION, type Snapshot, validateSnapshot } from './Klondike';
export interface Stats { clears: number; dailyClears: string[] }
export interface Saved { game_id: 'game022'; rules_version: typeof RULES_VERSION; snapshot: Snapshot | null; stats: Stats }
const KEY = 'web-mini-arcade:v1:game022:session';
const empty = (): Saved => ({ game_id: 'game022', rules_version: RULES_VERSION, snapshot: null, stats: { clears: 0, dailyClears: [] } });
function valid(value: unknown): value is Saved {
 if (!value || typeof value !== 'object') return false;
 const s = value as Saved;
 return s.game_id === 'game022' && s.rules_version === RULES_VERSION && (s.snapshot === null || validateSnapshot(s.snapshot)) && !!s.stats && Number.isInteger(s.stats.clears) && s.stats.clears >= 0 && s.stats.clears <= 1000000000 && Array.isArray(s.stats.dailyClears) && s.stats.dailyClears.length <= 40000 && s.stats.dailyClears.every(k => typeof k === 'string' && /^\d{4}-\d{2}-\d{2}\|klondike-v1\|draw[13]$/.test(k)) && new Set(s.stats.dailyClears).size === s.stats.dailyClears.length;
}
/** Snapshot, reported flag and clear ledger are committed in one JSON write. */
export class SolitaireStore {
 private memory: Saved;
 private backend?: Pick<Storage, 'getItem' | 'setItem'>;
 persistent = true;
 constructor(backend?: Pick<Storage, 'getItem' | 'setItem'>) {
  this.memory = empty();
  try { this.backend = backend ?? window.localStorage; const raw = this.backend.getItem(KEY); if (raw && raw.length <= 20000000) { const parsed: unknown = JSON.parse(raw); if (valid(parsed)) this.memory = parsed; } }
  catch { this.persistent = false; }
 }
 read(): Saved { return structuredClone(this.memory); }
 save(snapshot: Snapshot | null, stats = this.memory.stats): void {
  const next: Saved = { game_id: 'game022', rules_version: RULES_VERSION, snapshot, stats: structuredClone(stats) };
  if (!valid(next)) return;
  this.memory = structuredClone(next);
  try { this.backend?.setItem(KEY, JSON.stringify(next)); } catch { this.persistent = false; }
 }
 reportClear(snapshot: Snapshot, stats: Stats): { snapshot: Snapshot; stats: Stats; added: boolean } {
  if (!snapshot.position.foundations.every(f => f.length === 13) || snapshot.reported) return { snapshot, stats, added: false };
  const added = snapshot.mode !== 'daily' || !stats.dailyClears.includes(snapshot.seed);
  const next = structuredClone(snapshot); next.reported = true;
  const nextStats = { clears: stats.clears + Number(added), dailyClears: [...stats.dailyClears] };
  if (added && snapshot.mode === 'daily') nextStats.dailyClears.push(snapshot.seed);
  this.save(next, nextStats);
  return { snapshot: next, stats: nextStats, added };
 }
}
