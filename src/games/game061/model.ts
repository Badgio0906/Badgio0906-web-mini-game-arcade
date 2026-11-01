// C22 SHIFT BURST — pure model. Integer-ms game time injected by the caller; no DOM, no randomness.

export const ROWS = 4;
export const COLS = 5;
export const RUN_MS = 50000;
export const START_AMMO = 12;
export const MOVE_LOCK_MS = 120;
export const BEAM_LOCK_MS = 350;
export const ROOM_SWITCH_MS = 400;
export const MOVE_COST = 20;
export const PRACTICE_AMMO = 3;

export interface Room { cores: readonly number[]; gears: readonly (readonly [number, number])[] }
/** Canonical data from the spec (top row → bottom row core column; gear pairs are mutual). */
export const ROOMS: readonly Room[] = [
  { cores: [1, 2, 3, 2], gears: [] },
  { cores: [0, 1, 4, 2], gears: [] },
  { cores: [4, 4, 1, 3], gears: [[0, 1]] },
  { cores: [1, 3, 0, 4], gears: [[2, 3]] },
  { cores: [2, 0, 3, 4], gears: [[0, 1], [2, 3]] },
  { cores: [4, 1, 3, 2], gears: [[0, 1], [2, 3]] },
];

export const mod5 = (v: number) => ((v % COLS) + COLS) % COLS;
export function partnerOf(room: Room, row: number): number | null {
  for (const [a, b] of room.gears) { if (a === row) return b; if (b === row) return a; }
  return null;
}
/** Applies a drag of `d` to `row`; its gear partner moves by -d. Returns a new array. */
export function shifted(cores: readonly number[], room: Room, row: number, d: number): number[] {
  const next = [...cores];
  next[row] = mod5(next[row] + d);
  const p = partnerOf(room, row);
  if (p !== null) next[p] = mod5(next[p] - d);
  return next;
}

/** BFS over ≤625 states with unit (±1) moves; returns min total steps to align all 4 cores. */
export function solveRoom(room: Room): { steps: number; target: number; moves: [number, number][] } {
  const key = (c: readonly number[]) => c.join('');
  const start = [...room.cores];
  const prev = new Map<string, { from: string; move: [number, number] } | null>([[key(start), null]]);
  const queue: number[][] = [start];
  while (queue.length) {
    const cur = queue.shift()!;
    if (new Set(cur).size === 1) {
      const moves: [number, number][] = [];
      let k = key(cur);
      for (let p = prev.get(k); p; p = prev.get(k)) { moves.unshift(p.move); k = p.from; }
      return { steps: moves.length, target: cur[0], moves };
    }
    for (let r = 0; r < ROWS; r++) for (const d of [-1, 1]) {
      const n = shifted(cur, room, r, d);
      if (!prev.has(key(n))) { prev.set(key(n), { from: key(cur), move: [r, d] }); queue.push(n); }
    }
  }
  return { steps: Infinity, target: -1, moves: [] };
}
export const MIN_STEPS = ROOMS.map(r => solveRoom(r).steps);
export const MIN_STEPS_TOTAL = MIN_STEPS.reduce((a, b) => a + b, 0);

export type Mode = 'run' | 'practice';
export type EndReason = 'clear' | 'ammo' | 'time' | 'practice-clear' | 'practice-ammo';
export type GameEvent =
  | { type: 'shift'; row: number; d: number; partner: number | null; at: number }
  | { type: 'fire'; col: number; broken: number[]; stoppedAt: number | null; points: number; at: number }
  | { type: 'room-clear'; room: number; onePierce: boolean; bonus: number; at: number }
  | { type: 'room-enter'; room: number; at: number }
  | { type: 'reject'; reason: 'locked' | 'ammo' | 'ended' | 'invalid'; at: number }
  | { type: 'end'; reason: EndReason; at: number };

export interface State {
  mode: Mode;
  t: number;
  roomIndex: number;
  cores: number[];
  broken: boolean[];
  cannon: number;
  ammo: number;
  lockUntil: number;
  lockKind: 'move' | 'beam' | 'room' | null;
  pendingRoom: number | null;
  shotsInRoom: number;
  shotsUsed: number;
  moveSteps: number;
  destroyPoints: number;
  bonusPoints: number;
  onePierceRooms: number;
  roomsCleared: number;
  oneShotRooms: number;
  ended: { reason: EndReason; at: number } | null;
  events: GameEvent[];
}

export function roomsFor(mode: Mode) { return mode === 'run' ? ROOMS.length : 1; }
export function room(s: State): Room { return ROOMS[s.mode === 'run' ? s.roomIndex : 0]; }

export function createState(mode: Mode = 'run'): State {
  return {
    mode, t: 0, roomIndex: 0, cores: [...ROOMS[0].cores], broken: [false, false, false, false], cannon: 2,
    ammo: mode === 'run' ? START_AMMO : PRACTICE_AMMO, lockUntil: 0, lockKind: null, pendingRoom: null,
    shotsInRoom: 0, shotsUsed: 0, moveSteps: 0, destroyPoints: 0, bonusPoints: 0, onePierceRooms: 0,
    roomsCleared: 0, oneShotRooms: 0, ended: null, events: [],
  };
}

/** One authoritative score: never negative, computed from totals (not per event). */
export function score(s: State) { return Math.max(0, s.destroyPoints + s.bonusPoints - MOVE_COST * s.moveSteps); }

export function advanceTo(s: State, t: number) {
  if (s.ended) return;
  if (s.pendingRoom !== null && t >= s.lockUntil) {
    const at = s.lockUntil;
    s.roomIndex = s.pendingRoom;
    s.pendingRoom = null;
    s.cores = [...ROOMS[s.roomIndex].cores];
    s.broken = [false, false, false, false];
    s.shotsInRoom = 0;
    s.events.push({ type: 'room-enter', room: s.roomIndex, at });
  }
  if (s.mode === 'run' && t >= RUN_MS) { s.t = RUN_MS; finish(s, 'time', RUN_MS); return; }
  if (t >= s.lockUntil) s.lockKind = null;
  s.t = Math.max(s.t, t);
}

function accept(s: State, t: number): boolean {
  advanceTo(s, t);
  if (s.ended || (s.mode === 'run' && t >= RUN_MS)) { s.events.push({ type: 'reject', reason: 'ended', at: t }); return false; }
  if (t < s.lockUntil) { s.events.push({ type: 'reject', reason: 'locked', at: t }); return false; }
  return true;
}

export function isLocked(s: State, t: number) { return t < s.lockUntil; }

/** Drag result: row moves by d (−2..2, wrap); gear partner moves by −d; cost is |d| once. */
export function shift(s: State, t: number, row: number, d: number): boolean {
  if (!Number.isInteger(d) || d === 0 || Math.abs(d) > 2 || row < 0 || row >= ROWS) { s.events.push({ type: 'reject', reason: 'invalid', at: t }); return false; }
  if (!accept(s, t)) return false;
  const rm = room(s);
  s.cores = shifted(s.cores, rm, row, d);
  s.moveSteps += Math.abs(d);
  s.lockUntil = t + MOVE_LOCK_MS; s.lockKind = 'move';
  s.events.push({ type: 'shift', row, d, partner: partnerOf(rm, row), at: t });
  return true;
}

/** Cannon selection is free and never locked. */
export function selectCannon(s: State, col: number) { if (!s.ended && col >= 0 && col < COLS) s.cannon = col; }

/** Beam travels bottom → top in the cannon column; breaks aligned cores, stops at first hard armor. */
export function beamResult(cores: readonly number[], broken: readonly boolean[], col: number) {
  const hits: number[] = [];
  for (let r = ROWS - 1; r >= 0; r--) {
    if (broken[r]) continue;
    if (cores[r] === col) hits.push(r); else return { hits, stoppedAt: r };
  }
  return { hits, stoppedAt: null as number | null };
}

export function fire(s: State, t: number): boolean {
  if (!accept(s, t)) return false;
  if (s.ammo <= 0) { s.events.push({ type: 'reject', reason: 'ammo', at: t }); return false; }
  s.ammo--; s.shotsUsed++; s.shotsInRoom++;
  const { hits, stoppedAt } = beamResult(s.cores, s.broken, s.cannon);
  for (const r of hits) s.broken[r] = true;
  const points = 100 * hits.length * hits.length;
  s.destroyPoints += points;
  s.lockUntil = t + BEAM_LOCK_MS; s.lockKind = 'beam';
  s.events.push({ type: 'fire', col: s.cannon, broken: hits, stoppedAt, points, at: t });
  if (s.broken.every(Boolean)) {
    const onePierce = s.shotsInRoom === 1 && hits.length === ROWS;
    const bonus = onePierce ? 400 : 100;
    s.bonusPoints += bonus;
    s.roomsCleared++;
    if (onePierce) s.onePierceRooms++;
    if (s.shotsInRoom === 1) s.oneShotRooms++;
    s.events.push({ type: 'room-clear', room: s.roomIndex, onePierce, bonus, at: t });
    if (s.roomsCleared >= roomsFor(s.mode)) {
      if (s.mode === 'run') s.bonusPoints += 1000 + s.ammo * 50 + Math.floor((RUN_MS - t) / 1000) * 50;
      finish(s, s.mode === 'run' ? 'clear' : 'practice-clear', t);
      return true;
    }
    if (s.ammo <= 0) { finish(s, s.mode === 'run' ? 'ammo' : 'practice-ammo', t); return true; }
    s.pendingRoom = s.roomIndex + 1;
    s.lockUntil = t + BEAM_LOCK_MS + ROOM_SWITCH_MS; s.lockKind = 'room';
  } else if (s.ammo <= 0) {
    finish(s, s.mode === 'run' ? 'ammo' : 'practice-ammo', t);
  }
  return true;
}

function finish(s: State, reason: EndReason, at: number) {
  if (s.ended) return;
  s.ended = { reason, at };
  s.events.push({ type: 'end', reason, at });
}

export function drainEvents(s: State): GameEvent[] { const e = s.events; s.events = []; return e; }

export interface Result { score: number; cleared: boolean; reason: EndReason; onePierceRooms: number; oneShotRooms: number; shotsUsed: number; moveSteps: number; clearMs: number | null; roomsCleared: number; rank: 'S' | 'A' | 'B' | 'C' }
export function result(s: State): Result {
  const cleared = s.ended?.reason === 'clear';
  const rank = !cleared ? 'C' : s.oneShotRooms === ROOMS.length && s.moveSteps <= MIN_STEPS_TOTAL + 6 ? 'S' : s.oneShotRooms >= 4 ? 'A' : 'B';
  return {
    score: score(s), cleared, reason: s.ended?.reason ?? 'time', onePierceRooms: s.onePierceRooms, oneShotRooms: s.oneShotRooms,
    shotsUsed: s.shotsUsed, moveSteps: s.moveSteps, clearMs: cleared ? s.ended!.at : null, roomsCleared: s.roomsCleared, rank,
  };
}
