import { Race, RULES, type GameMode, type Move } from './model';
export type Stats = { matches: number; wins: number; reported: string[] };
export type Saved = { save_version:1; game_id:'game026'; rules_version:string; mode:GameMode; history:Move[]; pending:number|null; lastDie:number|null; resultId:string; runId:string|null; reported:boolean };
export type Envelope = { save_version:1; stats:Stats; active:Saved|null };
const id = (value: unknown): value is string => typeof value === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value);
const count = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 100000000;
export function snapshot(race: Race, resultId: string, runId: string|null, reported: boolean): Saved {
  return {save_version:1,game_id:'game026',rules_version:RULES,mode:race.mode,history:race.history.map(m => ({...m})),pending:race.pending,lastDie:race.lastDie,resultId,runId,reported};
}
export function restore(value: unknown): {envelope:Envelope; race:Race|null} | null {
  try {
    const e = value as Envelope;
    if (e.save_version !== 1 || !e.stats || !count(e.stats.matches) || !count(e.stats.wins) || e.stats.wins > e.stats.matches || !Array.isArray(e.stats.reported) || e.stats.reported.length > 100 || !e.stats.reported.every(id) || new Set(e.stats.reported).size !== e.stats.reported.length || e.stats.reported.length > e.stats.matches) return null;
    if (e.active === null) return {envelope:e,race:null};
    const s = e.active;
    if (s.save_version !== 1 || s.game_id !== 'game026' || s.rules_version !== RULES || !id(s.resultId) || s.runId !== null && !id(s.runId) || typeof s.reported !== 'boolean' || !Array.isArray(s.history) || s.history.length > 100000) return null;
    const race = new Race(s.mode);
    for (const move of s.history) {
      if (!move || !race.prepare(move.die) || JSON.stringify(race.settle()) !== JSON.stringify(move)) return null;
    }
    if (s.pending !== null && !race.prepare(s.pending)) return null;
    if (s.lastDie !== race.lastDie || s.reported !== race.complete || s.reported !== e.stats.reported.includes(s.resultId)) return null;
    return {envelope:e,race};
  } catch { return null; }
}
/** Result accounting is local gameplay state, independent of nullable Analytics observer IDs. */
export function reportResult(race: Race, resultId:string, stats:Stats): Stats {
  if (!race.complete || !id(resultId) || stats.reported.includes(resultId)) return stats;
  return {matches:stats.matches+1,wins:stats.wins+(race.players[0].rank === 1 ? 1 : 0),reported:[...stats.reported,resultId].slice(-100)};
}
export class SaveStore {
  readonly key = 'web-mini-arcade:v1:game026:snapshot';
  private memory:Envelope|null = null;
  private memoryOnly = false;
  constructor(private readonly backend:Pick<Storage,'getItem'|'setItem'>|null = (() => {try{return localStorage;}catch{return null;}})()) {}
  read(): ReturnType<typeof restore> {
    if (this.memoryOnly) return this.memory ? restore(this.memory) : null;
    try {
      const raw=this.backend?.getItem(this.key);
      if(raw){
        const loaded=raw.length<=20000000?restore(JSON.parse(raw)):null;
        if(loaded)return loaded;
        this.memoryOnly=true;
      }
    } catch {this.memoryOnly=true;}
    return this.memory ? restore(this.memory) : null;
  }
  write(value:Envelope): void {
    this.memory=JSON.parse(JSON.stringify(value)) as Envelope;
    if(this.memoryOnly)return;
    try {if(this.backend)this.backend.setItem(this.key,JSON.stringify(value));else this.memoryOnly=true;}catch{this.memoryOnly=true;}
  }
}
