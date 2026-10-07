import { DIRECTIONS, opposite, type SnakeState, type Speed } from './model';
export const SAVE_KEY = 'web-mini-arcade:v1:game024:state';
export interface SavedGame {
  game_id: 'game024'; rules_version: '1'; speed: Speed;
  snapshot: SnakeState | null; clock: { remainder: number; elapsed: number };
  run: { id: string | null; active: boolean; reported: boolean; freshFoods: number };
  stats: { best: Record<Speed,number>; runs: number; clears: number };
}
export function blankSave(): SavedGame { return {game_id:'game024',rules_version:'1',speed:4,snapshot:null,clock:{remainder:0,elapsed:0},run:{id:null,active:false,reported:true,freshFoods:0},stats:{best:{4:0,6:0,8:0},runs:0,clears:0}}; }
const integer = (v: unknown, min: number, max: number): v is number => typeof v === 'number' && Number.isInteger(v) && v>=min && v<=max;
const finite = (v: unknown, max: number): v is number => typeof v === 'number' && Number.isFinite(v) && v>=0 && v<=max;
export function validateSave(value: unknown): SavedGame | null {
  try {
    const v = value as SavedGame;
    if (!v || v.game_id !== 'game024' || v.rules_version !== '1' || ![4,6,8].includes(v.speed)) return null;
    if (!finite(v.clock.remainder,1000/v.speed) || v.clock.remainder >= 1000/v.speed || !finite(v.clock.elapsed,1e12)) return null;
    if (!integer(v.stats.runs,0,1e9) || !integer(v.stats.clears,0,v.stats.runs) || ![4,6,8].every(s=>integer(v.stats.best[s as Speed],0,397))) return null;
    if (typeof v.run.active !== 'boolean' || typeof v.run.reported !== 'boolean' || !integer(v.run.freshFoods,0,397) || !(v.run.id === null || typeof v.run.id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v.run.id))) return null;
    const s = v.snapshot;
    if (!s) return !v.run.active && v.run.reported ? structuredClone(v) : null;
    if (s.size !== 20 || !integer(s.seed,0,0xffffffff) || !integer(s.foods,0,397) || !integer(s.ticks,s.foods,1e9) || !Array.isArray(s.body) || s.body.length !== 3+s.foods || !DIRECTIONS.includes(s.direction) || !Array.isArray(s.queue) || s.queue.length>2 || !['playing','wall','self','clear'].includes(s.outcome)) return null;
    const cell = (p: {x:number;y:number}) => p && integer(p.x,0,19) && integer(p.y,0,19);
    if (!s.body.every(cell) || new Set(s.body.map(p=>p.y*20+p.x)).size !== s.body.length) return null;
    if (s.body.some((p,i)=>i>0 && Math.abs(p.x-s.body[i-1].x)+Math.abs(p.y-s.body[i-1].y)!==1)) return null;
    if (s.outcome==='playing' || s.outcome==='clear') {
      const vectors = {up:[0,-1],right:[1,0],down:[0,1],left:[-1,0]};
      const [dx,dy]=vectors[s.direction];
      if(s.body[0].x-s.body[1].x!==dx || s.body[0].y-s.body[1].y!==dy)return null;
    }
    let last = s.direction;
    for (const d of s.queue) { if (!DIRECTIONS.includes(d) || d===last || opposite(last,d)) return null; last=d; }
    if (s.outcome==='clear' ? s.body.length!==400 || s.food!==null : !s.food || !cell(s.food) || s.body.some(p=>p.x===s.food!.x && p.y===s.food!.y)) return null;
    if (v.run.freshFoods>s.foods || v.run.active !== (s.outcome==='playing') || v.run.active === v.run.reported) return null;
    return structuredClone(v);
  } catch { return null; }
}
/** A late pagehide must not reactivate an explicitly abandoned snapshot. */
export function captureSave(saved: SavedGame, snake: SnakeState, speed: Speed, clock: {remainder:number;elapsed:number}): SavedGame {
  return {...saved,speed,snapshot:!saved.run.active && snake.outcome==='playing' ? null : snake,clock:{...clock,remainder:snake.outcome==='playing' ? clock.remainder : 0}};
}
/** Statistics and report flag share one replacement JSON with the snapshot. */
export class SnakeSaveStore {
  private memory: string | null = null;
  private denied = false;
  constructor(private backend?: Pick<Storage,'getItem'|'setItem'>) { try { this.backend ??= window.localStorage; } catch { this.denied=true; } }
  read(): SavedGame {
    try { const raw = this.memory ?? (this.denied ? null : this.backend?.getItem(SAVE_KEY)); return raw && raw.length < 100000 ? validateSave(JSON.parse(raw)) ?? blankSave() : blankSave(); } catch { return blankSave(); }
  }
  write(value: SavedGame): void { this.memory=JSON.stringify(value); if (!this.denied) try { this.backend?.setItem(SAVE_KEY,this.memory); } catch { this.denied=true; } }
}
