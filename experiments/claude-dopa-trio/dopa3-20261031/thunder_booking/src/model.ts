// C21 THUNDER BOOKING — pure game model. Integer-ms game time is injected; no DOM, no randomness.
// Enemy positions are analytic functions of time, so a reservation is always evaluated at its exact
// impact time regardless of render frame rate.

export const LOGICAL = 480;
export const FIELD_TOP = 50;
export const FIELD_BOTTOM = 405;
export const BOX = { minX: 32, maxX: 448, minY: 64, maxY: 392 } as const;
export const RUN_MS = 54000;
export const FORMATION_MS = 5500;
export const FORMATION_ACTIVE_MS = 5000;
export const FORMATION_COUNT = 8;
export const BOSS_START_MS = FORMATION_MS * FORMATION_COUNT; // 44000
export const PENDING_MS = 900;
export const COOLDOWN_MS = 1200;
export const RESERVE_GAP_MS = 120;
export const BLAST_R = 68;
export const DRONE_R = 14;
export const BOSS_R = 28;
export const BOSS_HP = 3;
export const BOSS_SHIELD_MS = 800;
export const SLOT_COUNT = 3;
export const START_SHIELD = 3;
export const PRACTICE_ROUNDS = 3;

export interface Vec { x: number; y: number }
export interface DroneSpec { x0: number; y0: number; vx: number; vy: number }
export interface FormationSpec { name: string; drones: DroneSpec[] }

/** Builds a formation whose drones pass `offsets` around `center` at local second `meetS`. */
function converge(name: string, center: Vec, meetS: number, parts: { off: Vec; v: Vec }[]): FormationSpec {
  return {
    name,
    drones: parts.map(({ off, v }) => ({
      x0: center.x + off.x - v.x * meetS,
      y0: center.y + off.y - v.y * meetS,
      vx: v.x,
      vy: v.y,
    })),
  };
}

const six = [0, 1, 2, 3, 4, 5];
const ring = (r: number, i: number, phase = 0) => ({ x: Math.cos(phase + (i * Math.PI) / 3) * r, y: Math.sin(phase + (i * Math.PI) / 3) * r });

// Fixed trajectory tables. They never read player input.
export const FORMATIONS: readonly FormationSpec[] = [
  // Spec sample: x_i(t) = 180 + 24i + 64(t - 0.9), y = 160.
  converge('横流れ', { x: 240, y: 160 }, 0.9, six.map(i => ({ off: { x: -60 + 24 * i, y: 0 }, v: { x: 64, y: 0 } }))),
  converge('上下合流', { x: 250, y: 230 }, 1.8, six.map(i => ({ off: { x: -40 + 40 * (i % 3), y: 0 }, v: { x: -30, y: i < 3 ? 80 : -80 } }))),
  converge('交差', { x: 240, y: 230 }, 2.1, six.map(i => {
    const k = (i % 3) - 1;
    return i < 3 ? { off: { x: -16 * k, y: 24 * k }, v: { x: 90, y: 60 } } : { off: { x: 16 * k, y: 24 * k }, v: { x: -90, y: 60 } };
  })),
  converge('扇の収束', { x: 320, y: 280 }, 2.4, six.map(i => ({ off: { x: -30 + 12 * i, y: 0 }, v: { x: 60 + 10 * (i % 2), y: -45 + 18 * i } }))),
  converge('包囲', { x: 240, y: 228 }, 3.0, six.map(i => {
    const d = ring(1, i, Math.PI / 6);
    const o = ring(26, i, Math.PI / 6);
    return { off: o, v: { x: -d.x * 45, y: -d.y * 45 } };
  })),
  converge('急流', { x: 150, y: 300 }, 2.0, six.map(i => ({ off: { x: -50 + 20 * i, y: (i % 2) * 14 - 7 }, v: { x: -110, y: 0 } }))),
  converge('三方合流', { x: 300, y: 240 }, 1.6, six.map(i => {
    const dirs = [Math.PI / 2, (7 * Math.PI) / 6, (11 * Math.PI) / 6];
    const a = dirs[Math.floor(i / 2)];
    const side = i % 2 === 0 ? -1 : 1;
    return { off: { x: -Math.sin(a) * 18 * side, y: Math.cos(a) * 18 * side }, v: { x: Math.cos(a) * 100, y: Math.sin(a) * 100 } };
  })),
  converge('斜め急襲', { x: 360, y: 170 }, 3.2, six.map(i => ({ off: { x: -36 + 14 * i, y: 30 - 12 * i }, v: { x: 70, y: -40 + 6 * i } }))),
];

function fold(p: number, min: number, max: number): number {
  const span = max - min;
  let u = (p - min) % (2 * span);
  if (u < 0) u += 2 * span;
  return min + (u <= span ? u : 2 * span - u);
}

export function dronePos(d: DroneSpec, localMs: number): Vec {
  const s = localMs / 1000;
  return { x: fold(d.x0 + d.vx * s, BOX.minX, BOX.maxX), y: fold(d.y0 + d.vy * s, BOX.minY, BOX.maxY) };
}

export function bossPos(t: number): Vec {
  return { x: 240 + 100 * Math.sin((2 * Math.PI * (t - BOSS_START_MS)) / 4000), y: 160 };
}

export type Mode = 'run' | 'practice';
export type SlotState = 'ready' | 'pending' | 'cooldown';
export interface Slot { state: SlotState; until: number; reservationId: number | null }
export interface Reservation { id: number; x: number; y: number; at: number; impactAt: number; slot: number; resolved: boolean; kills: number; bossHit: boolean }
export interface Drone { formation: number; round: number; index: number; alive: boolean; killedAt: number | null; killedBy: number | null }
export interface FormationRun { formation: number; round: number; start: number; kills: number; evaluated: boolean; success: boolean | null }
export type EndReason = 'clear' | 'shield' | 'time' | 'practice';
export type GameEvent =
  | { type: 'reserve'; id: number; x: number; y: number; at: number }
  | { type: 'reject'; reason: 'no-slot' | 'gap' | 'ended' }
  | { type: 'impact'; id: number; x: number; y: number; at: number; kills: { round: number; index: number; x: number; y: number }[]; points: number; bossHit: boolean }
  | { type: 'formation'; round: number; success: boolean; kills: number; at: number }
  | { type: 'shield'; remaining: number; at: number }
  | { type: 'boss-hit'; hp: number; at: number }
  | { type: 'boss-down'; at: number }
  | { type: 'slot-ready'; slot: number; at: number }
  | { type: 'end'; reason: EndReason; at: number };

export interface Boss { hp: number; shieldUntil: number; defeated: boolean }
export interface Result {
  score: number; maxOneShot: number; thunderCount: number; formationSuccess: number; formationFail: number;
  sixShots: number; bossDefeated: boolean; cleared: boolean; shield: number; rank: 'S' | 'A' | 'B' | 'C'; reason: EndReason; endedAt: number;
}

export interface State {
  mode: Mode;
  t: number;
  slots: Slot[];
  reservations: Reservation[];
  drones: Drone[];
  runs: FormationRun[];
  shield: number;
  score: number;
  maxOneShot: number;
  sixShots: number;
  thunderCount: number;
  formationSuccess: number;
  formationFail: number;
  boss: Boss;
  lastReserveAt: number;
  nextId: number;
  ended: { reason: EndReason; at: number } | null;
  events: GameEvent[];
}

export function totalRounds(mode: Mode) { return mode === 'run' ? FORMATION_COUNT : PRACTICE_ROUNDS; }
export function formationOfRound(mode: Mode, round: number) { return mode === 'run' ? round : 0; }
export function runEndMs(mode: Mode) { return mode === 'run' ? RUN_MS : PRACTICE_ROUNDS * FORMATION_MS; }

export function createState(mode: Mode = 'run'): State {
  const runs: FormationRun[] = [];
  const drones: Drone[] = [];
  for (let r = 0; r < totalRounds(mode); r++) {
    const f = formationOfRound(mode, r);
    runs.push({ formation: f, round: r, start: r * FORMATION_MS, kills: 0, evaluated: false, success: null });
    FORMATIONS[f].drones.forEach((_, index) => drones.push({ formation: f, round: r, index, alive: true, killedAt: null, killedBy: null }));
  }
  return {
    mode, t: 0,
    slots: Array.from({ length: SLOT_COUNT }, () => ({ state: 'ready' as SlotState, until: 0, reservationId: null })),
    reservations: [], drones, runs,
    shield: START_SHIELD, score: 0, maxOneShot: 0, sixShots: 0, thunderCount: 0, formationSuccess: 0, formationFail: 0,
    boss: { hp: BOSS_HP, shieldUntil: 0, defeated: false },
    lastReserveAt: -Infinity, nextId: 1, ended: null, events: [],
  };
}

export function chainPoints(n: number) { return n <= 0 ? 0 : 100 * n + 50 * n * (n - 1); }

/** Drone is hittable from its round start through the decision moment (inclusive). */
export function droneActive(s: State, d: Drone, t: number) {
  const local = t - s.runs[d.round].start;
  return d.alive && local >= 0 && local <= FORMATION_ACTIVE_MS;
}

export function dronePosAt(s: State, d: Drone, t: number): Vec {
  return dronePos(FORMATIONS[d.formation].drones[d.index], t - s.runs[d.round].start);
}

export function bossActive(s: State, t: number) { return s.mode === 'run' && t >= BOSS_START_MS && !s.boss.defeated; }

export function reserve(s: State, t: number, x: number, y: number): boolean {
  advanceTo(s, t);
  if (s.ended || t >= runEndMs(s.mode)) { s.events.push({ type: 'reject', reason: 'ended' }); return false; }
  if (t - s.lastReserveAt < RESERVE_GAP_MS) { s.events.push({ type: 'reject', reason: 'gap' }); return false; }
  const slot = s.slots.findIndex(sl => sl.state === 'ready');
  if (slot < 0) { s.events.push({ type: 'reject', reason: 'no-slot' }); return false; }
  const cx = Math.min(LOGICAL, Math.max(0, x));
  const cy = Math.min(FIELD_BOTTOM, Math.max(FIELD_TOP, y));
  const id = s.nextId++;
  s.reservations.push({ id, x: cx, y: cy, at: t, impactAt: t + PENDING_MS, slot, resolved: false, kills: 0, bossHit: false });
  s.slots[slot] = { state: 'pending', until: t + PENDING_MS, reservationId: id };
  s.lastReserveAt = t;
  s.thunderCount++;
  s.events.push({ type: 'reserve', id, x: cx, y: cy, at: t });
  return true;
}

type Next = { at: number; kind: 0 | 1 | 2 | 3; ref: number };

function nextEvent(s: State): Next | null {
  let best: Next | null = null;
  const consider = (at: number, kind: Next['kind'], ref: number) => {
    if (!best || at < best.at || (at === best.at && (kind < best.kind || (kind === best.kind && ref < best.ref)))) best = { at, kind, ref };
  };
  for (const r of s.reservations) if (!r.resolved) consider(r.impactAt, 0, r.id);
  for (const run of s.runs) if (!run.evaluated) consider(run.start + FORMATION_ACTIVE_MS, 1, run.round);
  s.slots.forEach((sl, i) => { if (sl.state === 'cooldown') consider(sl.until, 2, i); });
  consider(runEndMs(s.mode), 3, 0);
  return best;
}

/** Processes every scheduled event with time <= t in order: impacts (by id) → formation decisions → slot recovery → end. */
export function advanceTo(s: State, t: number) {
  while (!s.ended) {
    const n = nextEvent(s);
    if (!n || n.at > t) break;
    s.t = Math.max(s.t, n.at);
    if (n.kind === 0) impact(s, s.reservations.find(r => r.id === n.ref)!);
    else if (n.kind === 1) decide(s, s.runs[n.ref]);
    else if (n.kind === 2) { s.slots[n.ref] = { state: 'ready', until: 0, reservationId: null }; s.events.push({ type: 'slot-ready', slot: n.ref, at: n.at }); }
    else finish(s, s.mode === 'practice' ? 'practice' : 'time', n.at);
  }
  if (!s.ended) s.t = Math.max(s.t, t);
}

function impact(s: State, r: Reservation) {
  r.resolved = true;
  const at = r.impactAt;
  s.slots[r.slot] = { state: 'cooldown', until: at + COOLDOWN_MS, reservationId: null };
  const kills: { round: number; index: number; x: number; y: number }[] = [];
  const reach = BLAST_R + DRONE_R;
  for (const d of s.drones) {
    if (!droneActive(s, d, at)) continue;
    const p = dronePosAt(s, d, at);
    if ((p.x - r.x) ** 2 + (p.y - r.y) ** 2 <= reach * reach) {
      d.alive = false; d.killedAt = at; d.killedBy = r.id;
      s.runs[d.round].kills++;
      kills.push({ round: d.round, index: d.index, x: p.x, y: p.y });
    }
  }
  let bossHit = false;
  if (bossActive(s, at) && at >= s.boss.shieldUntil) {
    const b = bossPos(at);
    const br = BLAST_R + BOSS_R;
    if ((b.x - r.x) ** 2 + (b.y - r.y) ** 2 <= br * br) {
      bossHit = true;
      s.boss.hp--;
      s.boss.shieldUntil = at + BOSS_SHIELD_MS;
    }
  }
  const points = chainPoints(kills.length);
  r.kills = kills.length;
  r.bossHit = bossHit;
  s.score += points;
  s.maxOneShot = Math.max(s.maxOneShot, kills.length);
  if (kills.length === 6) s.sixShots++;
  s.events.push({ type: 'impact', id: r.id, x: r.x, y: r.y, at, kills, points, bossHit });
  if (bossHit) {
    s.events.push({ type: 'boss-hit', hp: s.boss.hp, at });
    if (s.boss.hp <= 0) {
      s.boss.defeated = true;
      s.score += 2000;
      s.events.push({ type: 'boss-down', at });
      if (s.shield > 0) {
        s.score += s.shield * 300 + Math.floor((RUN_MS - at) / 1000) * 100;
        finish(s, 'clear', at);
      }
    }
  }
}

function decide(s: State, run: FormationRun) {
  run.evaluated = true;
  const at = run.start + FORMATION_ACTIVE_MS;
  run.success = run.kills >= 3;
  if (run.success) s.formationSuccess++; else s.formationFail++;
  s.events.push({ type: 'formation', round: run.round, success: run.success, kills: run.kills, at });
  if (!run.success && s.mode === 'run') {
    s.shield--;
    s.events.push({ type: 'shield', remaining: s.shield, at });
    if (s.shield <= 0) finish(s, 'shield', at);
  }
}

function finish(s: State, reason: EndReason, at: number) {
  if (s.ended) return;
  s.ended = { reason, at };
  s.t = at;
  for (const r of s.reservations) r.resolved = true; // terminal: pending reservations never score after the end
  s.events.push({ type: 'end', reason, at });
}

export function result(s: State): Result {
  const cleared = s.ended?.reason === 'clear';
  const rank = !cleared ? 'C' : s.sixShots >= 3 && s.formationFail === 0 ? 'S' : s.sixShots >= 1 ? 'A' : 'B';
  return {
    score: s.score, maxOneShot: s.maxOneShot, thunderCount: s.thunderCount, formationSuccess: s.formationSuccess,
    formationFail: s.formationFail, sixShots: s.sixShots, bossDefeated: s.boss.defeated, cleared, shield: s.shield,
    rank, reason: s.ended?.reason ?? 'time', endedAt: s.ended?.at ?? s.t,
  };
}

export function drainEvents(s: State): GameEvent[] { const e = s.events; s.events = []; return e; }

/** Current round index whose drones are on screen (including the 0.5 s exit), or -1 in the boss phase. */
export function currentRound(s: State, t: number) {
  const r = Math.floor(t / FORMATION_MS);
  return r < totalRounds(s.mode) ? r : -1;
}
