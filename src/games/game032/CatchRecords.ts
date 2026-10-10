import { FISH, SPOTS, type FishCatch, type FishId, type FishingMode } from './FishingModel';

/** Separate from the completed-outing BEST: a landed standard fish is saved immediately. */
export const FISH_RECORDS_KEY = 'web-mini-arcade:v1:game032:fish-records:r1';
export const FISH_HISTORY_LIMIT = 100;
export const FISH_RECORDS_RAW_LIMIT = 65_536;
export interface FishSpeciesRecord {
  readonly fishId: FishId;
  readonly name: string;
  readonly maxSizeCm: number;
  /** When this species' largest fish was caught. Equal sizes retain the first date. */
  readonly caughtAt: string;
  readonly latestCaughtAt: string;
  readonly count: number;
  readonly largestCatch: FishCatch;
}
export interface FishCatchRecord { readonly caughtAt: string; readonly catch: FishCatch; readonly ordinal: number; }
export interface FishRecordsSave {
  readonly schemaVersion: 1;
  readonly species: readonly FishSpeciesRecord[];
  readonly recent: readonly FishCatchRecord[];
}
export type FishRecordsStorageIssue = 'unavailable' | 'read_failed' | 'write_failed' | 'invalid_data';
type Backend = Pick<Storage, 'getItem' | 'setItem'>;
const EMPTY: FishRecordsSave = Object.freeze({schemaVersion:1, species:Object.freeze([]), recent:Object.freeze([])});
const fishById = new Map(FISH.map(f => [f.id, f]));
const spotIds = new Set(SPOTS.map(s => s.id));

function object(input: unknown, keys: readonly string[]): input is Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return false;
  const prototype = Object.getPrototypeOf(input);
  return (prototype === Object.prototype || prototype === null)
    && Object.keys(input).length === keys.length && keys.every(key => Object.hasOwn(input, key));
}
function timestamp(input: unknown): input is string {
  return typeof input === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(input)
    && Number.isFinite(Date.parse(input)) && new Date(input).toISOString() === input;
}
function validateCatch(input: unknown): FishCatch | null {
  if (!object(input, ['fishId','name','sizeCm','points','rare','big','spotId','distance','method'])) return null;
  const fish = fishById.get(input.fishId as FishId);
  if (!fish || input.name !== fish.name || typeof input.sizeCm !== 'number' || !Number.isFinite(input.sizeCm)
    || input.sizeCm < fish.minCm || input.sizeCm > fish.maxCm || Math.abs(input.sizeCm * 10 - Math.round(input.sizeCm * 10)) > 1e-6
    || typeof input.points !== 'number' || !Number.isSafeInteger(input.points) || input.points < 0 || input.points > 100_000
    || input.rare !== (fish.rareBonus > 0) || input.big !== ((input.sizeCm - fish.minCm) / (fish.maxCm - fish.minCm) >= .8)
    || !spotIds.has(input.spotId as FishCatch['spotId'])
    || !['near','medium','far'].includes(input.distance as string) || !['bait','lure'].includes(input.method as string)) return null;
  return Object.freeze({fishId:fish.id,name:fish.name,sizeCm:input.sizeCm,points:input.points,rare:input.rare as boolean,
    big:input.big as boolean,spotId:input.spotId as FishCatch['spotId'],distance:input.distance as FishCatch['distance'],method:input.method as FishCatch['method']});
}
function freezeSave(species: readonly FishSpeciesRecord[], recent: readonly FishCatchRecord[]): FishRecordsSave {
  return Object.freeze({schemaVersion:1,species:Object.freeze([...species]),recent:Object.freeze([...recent])});
}
/** Whole-envelope validation. Unknown fields/IDs and inconsistent metadata are not accepted. */
export function validateFishRecords(input: unknown): FishRecordsSave | null {
  if (!object(input, ['schemaVersion','species','recent']) || input.schemaVersion !== 1
    || !Array.isArray(input.species) || input.species.length > FISH.length
    || !Array.isArray(input.recent) || input.recent.length > FISH_HISTORY_LIMIT) return null;
  const species: FishSpeciesRecord[] = [], seen = new Set<FishId>();
  for (const entry of input.species) {
    if (!object(entry, ['fishId','name','maxSizeCm','caughtAt','latestCaughtAt','count','largestCatch'])) return null;
    const largest = validateCatch(entry.largestCatch);
    if (!largest || entry.fishId !== largest.fishId || entry.name !== largest.name || entry.maxSizeCm !== largest.sizeCm
      || seen.has(largest.fishId) || !timestamp(entry.caughtAt) || !timestamp(entry.latestCaughtAt) || entry.caughtAt > entry.latestCaughtAt
      || typeof entry.count !== 'number' || !Number.isSafeInteger(entry.count) || entry.count < 1) return null;
    seen.add(largest.fishId);
    species.push(Object.freeze({fishId:largest.fishId,name:largest.name,maxSizeCm:largest.sizeCm,caughtAt:entry.caughtAt,
      latestCaughtAt:entry.latestCaughtAt,count:entry.count,largestCatch:largest}));
  }
  const recent: FishCatchRecord[] = [], counts = new Map<FishId, number>();
  for (const entry of input.recent) {
    if (!object(entry, ['caughtAt','catch','ordinal']) || !timestamp(entry.caughtAt)) return null;
    const caught = validateCatch(entry.catch), record = species.find(s => s.fishId === caught?.fishId);
    if (!caught || !record || caught.sizeCm > record.maxSizeCm || entry.caughtAt > record.latestCaughtAt
      || typeof entry.ordinal !== 'number' || !Number.isSafeInteger(entry.ordinal) || entry.ordinal < 1 || entry.ordinal > record.count
      || recent.some(r => r.catch.fishId === caught.fishId && r.ordinal === entry.ordinal)) return null;
    counts.set(caught.fishId,(counts.get(caught.fishId) ?? 0) + 1);
    if (counts.get(caught.fishId)! > record.count) return null;
    recent.push(Object.freeze({caughtAt:entry.caughtAt,catch:caught,ordinal:entry.ordinal}));
  }
  return freezeSave(FISH.flatMap(f => species.filter(s => s.fishId === f.id)), recent);
}

/** Read before each mutation to preserve records written sequentially by another tab.
 * localStorage has no atomic compare-and-swap; truly simultaneous tab writes are not guaranteed. */
export class FishingCatchRecordsStore {
  private backend?: Backend;
  private memory: FishRecordsSave = EMPTY;
  private persistent = false;
  private issue: FishRecordsStorageIssue | null = null;
  constructor(backend?: Backend) {
    try { this.backend = backend ?? (typeof window !== 'undefined' ? window.localStorage : undefined); }
    catch { /* Denied storage remains page-memory only. */ }
    if (!this.backend) this.issue = 'unavailable';
    this.refresh();
  }
  get storageStatus(): 'persistent' | 'memory' { return this.persistent ? 'persistent' : 'memory'; }
  get storageIssue(): FishRecordsStorageIssue | null { return this.issue; }
  records(): readonly FishSpeciesRecord[] { this.refresh(); return this.memory.species; }
  recentCatches(): readonly FishCatchRecord[] { this.refresh(); return this.memory.recent; }
  galleryCatches(): readonly FishCatch[] { return Object.freeze(this.records().map(record => record.largestCatch)); }
  record(fish: FishCatch, mode: FishingMode, caughtAtISO = new Date().toISOString()): boolean {
    if (mode !== 'standard' || !timestamp(caughtAtISO)) return false;
    const caught = validateCatch(fish);
    if (!caught) return false;
    this.refresh();
    const previous = this.memory.species.find(s => s.fishId === caught.fishId);
    if (previous?.count === Number.MAX_SAFE_INTEGER) return false;
    const isLargest = !previous || caught.sizeCm > previous.maxSizeCm;
    const entry: FishSpeciesRecord = Object.freeze({fishId:caught.fishId,name:caught.name,
      maxSizeCm:isLargest ? caught.sizeCm : previous!.maxSizeCm,caughtAt:isLargest ? caughtAtISO : previous!.caughtAt,
      latestCaughtAt:previous && previous.latestCaughtAt > caughtAtISO ? previous.latestCaughtAt : caughtAtISO,
      count:(previous?.count ?? 0) + 1,largestCatch:isLargest ? caught : previous!.largestCatch});
    const records = this.memory.species.filter(s => s.fishId !== caught.fishId).concat(entry);
    const recent = this.memory.recent.concat(Object.freeze({caughtAt:caughtAtISO,catch:caught,ordinal:entry.count})).slice(-FISH_HISTORY_LIMIT);
    this.memory = freezeSave(FISH.flatMap(f => records.filter(s => s.fishId === f.id)),recent);
    this.persistent = false;
    try {
      if (this.backend) { this.backend.setItem(FISH_RECORDS_KEY,JSON.stringify(this.memory)); this.persistent = true; this.issue = null; }
    } catch { this.issue = 'write_failed'; }
    return true;
  }
  private refresh(): void {
    if (!this.backend) return;
    try {
      const raw = this.backend.getItem(FISH_RECORDS_KEY);
      if (raw === null) { this.persistent = this.memory.species.length === 0; if (this.persistent) this.issue = null; return; }
      const saved = raw.length <= FISH_RECORDS_RAW_LIMIT ? validateFishRecords(JSON.parse(raw)) : null;
      if (!saved) { this.persistent = false; this.issue = 'invalid_data'; return; }
      if (this.memory.species.length === 0 || JSON.stringify(saved) === JSON.stringify(this.memory)) {
        this.memory = saved; this.persistent = true; this.issue = null; return;
      }
      const records = FISH.flatMap(fish => {
        const local = this.memory.species.find(s => s.fishId === fish.id), disk = saved.species.find(s => s.fishId === fish.id);
        if (!local) return disk ? [disk] : [];
        if (!disk) return [local];
        const largest = disk.maxSizeCm > local.maxSizeCm || (disk.maxSizeCm === local.maxSizeCm && disk.caughtAt < local.caughtAt) ? disk : local;
        return [Object.freeze({...largest,count:Math.max(local.count,disk.count),latestCaughtAt:local.latestCaughtAt > disk.latestCaughtAt ? local.latestCaughtAt : disk.latestCaughtAt})];
      });
      const unique = new Map<string,FishCatchRecord>();
      for (const entry of [...saved.recent,...this.memory.recent]) unique.set(`${entry.catch.fishId}:${entry.ordinal}`,entry);
      const recent = [...unique.values()].sort((a,b) => a.caughtAt.localeCompare(b.caughtAt)).slice(-FISH_HISTORY_LIMIT);
      this.memory = freezeSave(records,recent);
      this.persistent = JSON.stringify(this.memory) === JSON.stringify(saved);
      if (this.persistent) this.issue = null;
    } catch { this.persistent = false; this.issue = 'read_failed'; }
  }
}
