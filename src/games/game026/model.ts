/** Original UP & DOWN board and deterministic, transactional classic rules. */
export const RULES = '1';
export const PROMOTIONS: Readonly<Record<number, number>> = Object.freeze({3:19,12:36,25:44,37:58,46:65,61:79,73:92,82:96});
export const TRANSFERS: Readonly<Record<number, number>> = Object.freeze({18:6,33:15,48:27,57:41,70:52,86:66,94:76,99:84});
export type GameMode = 'cpu' | 'local2' | 'local3' | 'local4';
export type Player = { position: number; rank: number | null; cpu: boolean; promotions: number; transfers: number; turns: number };
export type Move = { player: number; die: number; from: number; landed: number; to: number; event: 'promotion' | 'transfer' | 'finish' | 'overrun' | 'move'; turn: number };
export function point(position: number): { x: number; y: number } {
  if (!Number.isInteger(position) || position < 1 || position > 100) throw new RangeError('cell');
  const row = Math.floor((position - 1) / 10), column = (position - 1) % 10;
  return { x: (row % 2 ? 9 - column : column) * 10 + 5, y: (9 - row) * 10 + 5 };
}
/** Marker geometry stays inside its cell, even the bottom row with four participants. */
export function marker(position:number,count:number,at:number):{x:number;y:number;size:number} {
  if(!Number.isInteger(count)||count<1||count>4||!Number.isInteger(at)||at<0||at>=count)throw new RangeError('marker');
  const q=point(position),size=count>1?1.45:1.85;
  return {x:q.x+(count>1?(at%2?2:-2):0),y:q.y+1.5+(count>1?(at<2?-1:2):0),size};
}
/** Rejection sampling removes uint32 modulo bias. Injected uint32 supplier is only a test boundary. */
export function dice(uint32: () => number = () => crypto.getRandomValues(new Uint32Array(1))[0]): number {
  const limit = 4294967292; // floor(2^32 / 6) * 6
  for (;;) { const value = uint32(); if (!Number.isInteger(value) || value < 0 || value > 4294967295) throw new RangeError('random uint32'); if (value < limit) return value % 6 + 1; }
}
export class Race {
  readonly players: Player[];
  history: Move[] = [];
  current = 0;
  pending: number | null = null;
  lastDie: number | null = null;
  constructor(readonly mode: GameMode) {
    if (!['cpu','local2','local3','local4'].includes(mode)) throw new RangeError('mode');
    const count = mode === 'local4' ? 4 : mode === 'local3' ? 3 : 2;
    this.players = Array.from({length:count}, (_,i) => ({position:1,rank:null,cpu:mode === 'cpu' && i === 1,promotions:0,transfers:0,turns:0}));
  }
  get complete(): boolean { return this.players.every(p => p.rank !== null); }
  get active(): Player { return this.players[this.current]; }
  /** Result is retained before any delay; another roll is refused until this one is settled. */
  prepare(die: number): boolean {
    if (this.complete || this.pending !== null || !Number.isInteger(die) || die < 1 || die > 6) return false;
    this.pending = die; this.lastDie = die; return true;
  }
  settle(): Move | null {
    if (this.pending === null || this.complete) return null;
    const die = this.pending, p = this.active, from = p.position;
    const landed = from + die <= 100 ? from + die : from;
    let to = landed, event: Move['event'] = landed === from ? 'overrun' : 'move';
    if (landed === 100) { event = 'finish'; p.rank = this.players.filter(q => q.rank !== null).length + 1; }
    else if (landed !== from && PROMOTIONS[landed] !== undefined) { to = PROMOTIONS[landed]; event = 'promotion'; p.promotions++; }
    else if (landed !== from && TRANSFERS[landed] !== undefined) { to = TRANSFERS[landed]; event = 'transfer'; p.transfers++; }
    p.position = to; p.turns++;
    const move: Move = {player:this.current,die,from,landed,to,event,turn:this.history.length + 1};
    this.history.push(move); this.pending = null;
    const remaining = this.players.filter(q => q.rank === null);
    // Once only one participant remains, its final place is decided, not an endless AI-only tail.
    if (remaining.length === 1) remaining[0].rank = this.players.length;
    if (!this.complete) do { this.current = (this.current + 1) % this.players.length; } while (this.active.rank !== null);
    return move;
  }
}
