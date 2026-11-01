export const SAVE_KEY = 'game100garage:game040:save:v2';
export const RULES_VERSION = 2;
export interface StorageLike { getItem(key: string): string|null; setItem(key: string, value: string): void; }
export interface GameSave {
  rulesVersion: 2;
  best: number;
  bestChain: number;
  plays: number;
  volume: number;
  muted: boolean;
  light: boolean;
  reducedEffects: boolean;
  completedRunIds: string[];
}
export interface SaveResult {
  runId: string;
  mode: 'run'|'practice'|'debug';
  reason: 'clear'|'time'|'life'|'quit'|'practice';
  score: number;
  maxChain: number;
  fullShots: number;
  absorbed: number;
}
const integer = (x: unknown, limit = 1_000_000_000): number => typeof x === 'number' && Number.isSafeInteger(x) && x >= 0 ? Math.min(x,limit) : 0;
const defaultSave = ():GameSave => ({ rulesVersion: 2, best: 0, bestChain: 0, plays: 0, volume: .55, muted: false, light: false, reducedEffects: false, completedRunIds: [] });
function browserStorage(): StorageLike|null { try { return typeof localStorage === 'undefined' ? null : localStorage; } catch { return null; } }
export function loadSave(storage: StorageLike|null = browserStorage()): GameSave {
  const save = defaultSave();
  try {
    const text = storage?.getItem(SAVE_KEY); if (!text) return save;
    const value: unknown = JSON.parse(text);
    if (!value || typeof value !== 'object') return save;
    const v = value as Record<string, unknown>;
    if (v.rulesVersion !== RULES_VERSION) return save;
    save.best=integer(v.best);save.bestChain=integer(v.bestChain,10000);save.plays=integer(v.plays,1000000);
    if (typeof v.volume === 'number' && Number.isFinite(v.volume)) save.volume=Math.min(1,Math.max(0,v.volume));
    for (const key of ['muted','light','reducedEffects'] as const) if (typeof v[key] === 'boolean') save[key]=v[key];
    if (Array.isArray(v.completedRunIds)) save.completedRunIds=[...new Set(v.completedRunIds.filter((id):id is string=>typeof id==='string'&&id.length>0&&id.length<=100))].slice(-32);
  } catch { /* Corrupt/denied persistence never prevents a run. */ }
  return save;
}
export function persistSave(save:GameSave,storage:StorageLike|null = browserStorage()):boolean {
  try { if (!storage) return false;storage.setItem(SAVE_KEY,JSON.stringify(save));return true; } catch { return false; }
}
/** Formal final run results only. Duplicate render/help/retry callbacks cannot add plays. */
export function recordResult(save:GameSave,result:SaveResult):boolean {
  if (result.mode!=='run'||!['clear','time','life'].includes(result.reason)||typeof result.runId!=='string'||!result.runId||result.runId.length>100||save.completedRunIds.includes(result.runId)) return false;
  if (![result.score,result.maxChain,result.fullShots,result.absorbed].every(x=>Number.isSafeInteger(x)&&x>=0)) return false;
  save.best=Math.max(save.best,integer(result.score));save.bestChain=Math.max(save.bestChain,integer(result.maxChain,10000));save.plays=Math.min(save.plays+1,1000000);
  save.completedRunIds.push(result.runId);save.completedRunIds=save.completedRunIds.slice(-32);return true;
}
