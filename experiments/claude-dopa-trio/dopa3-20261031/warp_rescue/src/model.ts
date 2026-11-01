// C23 WARP RESCUE — pure model on an integer-ms timetable. Capsules never stop or wait; movement is
// only a visual interpolation of the ledger below.

export const LANE_X = [80, 240, 400] as const;
export const SENSOR_Y = 300;
export const FALL_PX_PER_S = 100;
export const RUN_MS = 50000;
export const PRACTICE_WAVES = 2;
export const WAVES = 12;
export const PER_WAVE = 5;
export const WARP_MS = 450;
export const SWITCH_COOLDOWN_MS = 80;
export const DOCK_PERIOD = 5400;
export const DOCK_OPEN = 2700;
export const dockPhase0 = (i: number) => 1000 + i * 1800;
export const CLEAR_RESCUES = 42;

export const pmod = (a: number, m: number) => ((a % m) + m) % m;
export function dockOpen(dock: number, t: number) { return pmod(t - dockPhase0(dock), DOCK_PERIOD) < DOCK_OPEN; }
/** ms until this dock flips state (open→closed or closed→open). */
export function dockFlipIn(dock: number, t: number) {
  const ph = pmod(t - dockPhase0(dock), DOCK_PERIOD);
  return ph < DOCK_OPEN ? DOCK_OPEN - ph : DOCK_PERIOD - ph;
}

export interface PodSpec { id: string; wave: number; j: number; lane: number; tin: number }
export const SCHEDULE: readonly PodSpec[] = Array.from({ length: WAVES * PER_WAVE }, (_, k) => {
  const wave = Math.floor(k / PER_WAVE), j = k % PER_WAVE;
  const a = (2 * wave) % 3, b = (a + 1) % 3;
  const lane = wave < 4 ? a : [a, a, b, b, a][j];
  return { id: `${wave}-${j}`, wave, j, lane, tin: 4000 * wave + 1000 + 450 * j };
});
export function podY(p: PodSpec, t: number) { return SENSOR_Y + (FALL_PX_PER_S * (t - p.tin)) / 1000; }

export type PodStatus = 'falling' | 'warping' | 'rescued' | 'rerouted' | 'cushion';
export interface Pod extends PodSpec { status: PodStatus; outlet: number | null; arriveAt: number | null; resolvedAt: number | null; points: number }
export type Mode = 'run' | 'practice';
export type GameEvent =
  | { type: 'select'; selector: 'in' | 'out'; value: number; at: number }
  | { type: 'reject'; selector: 'in' | 'out'; at: number }
  | { type: 'warp'; id: string; lane: number; outlet: number; arriveAt: number; at: number }
  | { type: 'cushion'; id: string; lane: number; at: number }
  | { type: 'rescue'; id: string; dock: number; points: number; streak: number; at: number }
  | { type: 'reroute'; id: string; dock: number; at: number }
  | { type: 'wave'; wave: number; bonus: number; sameDock: boolean; at: number }
  | { type: 'end'; at: number; cleared: boolean };

export interface State {
  mode: Mode; t: number; inlet: number; outlet: number; inletAt: number; outletAt: number;
  pods: Pod[]; streak: number; maxStreak: number; score: number; rescued: number;
  fullWaves: number; sameDockWaves: number; waveDone: boolean[]; ended: { at: number; cleared: boolean } | null; events: GameEvent[];
}

export const endMs = (m: Mode) => (m === 'run' ? RUN_MS : 4000 * PRACTICE_WAVES + 1500);
export function createState(mode: Mode = 'run'): State {
  const waves = mode === 'run' ? WAVES : PRACTICE_WAVES;
  return {
    mode, t: 0, inlet: 0, outlet: 0, inletAt: -Infinity, outletAt: -Infinity,
    pods: SCHEDULE.filter(p => p.wave < waves).map(p => ({ ...p, status: 'falling' as PodStatus, outlet: null, arriveAt: null, resolvedAt: null, points: 0 })),
    streak: 0, maxStreak: 0, score: 0, rescued: 0, fullWaves: 0, sameDockWaves: 0, waveDone: Array(waves).fill(false), ended: null, events: [],
  };
}

export const rescuePoints = (streakBefore: number) => 100 * Math.min(3, 1 + Math.floor(streakBefore / 10));

/**
 * Selector change at time t. Events strictly before t are processed first; the new selection then
 * applies to crossings at t itself (input → crossing order within the same ms).
 */
export function select(s: State, t: number, selector: 'in' | 'out', value: number): boolean {
  advanceTo(s, t - 1);
  if (s.ended || t >= endMs(s.mode) || value < 0 || value > 2) return false;
  const last = selector === 'in' ? s.inletAt : s.outletAt;
  if (t - last < SWITCH_COOLDOWN_MS) { s.events.push({ type: 'reject', selector, at: t }); return false; }
  if (selector === 'in') { if (s.inlet === value) return true; s.inlet = value; s.inletAt = t; }
  else { if (s.outlet === value) return true; s.outlet = value; s.outletAt = t; }
  s.events.push({ type: 'select', selector, value, at: t });
  return true;
}

type Next = { at: number; order: number; pod: Pod | null };
function next(s: State): Next | null {
  let best: Next | null = null;
  const take = (n: Next) => { if (!best || n.at < best.at || (n.at === best.at && n.order < best.order)) best = n; };
  for (const p of s.pods) {
    if (p.status === 'falling') take({ at: p.tin, order: 1 + p.tin / 1e6, pod: p });
    else if (p.status === 'warping') take({ at: p.arriveAt!, order: 0 + p.arriveAt! / 1e6, pod: p });
  }
  take({ at: endMs(s.mode), order: 9, pod: null });
  return best;
}

/** Processes the ledger up to and including t: arrivals → sensor crossings → wave bonus → end. */
export function advanceTo(s: State, t: number) {
  while (!s.ended) {
    const n = next(s);
    if (!n || n.at > t) break;
    s.t = Math.max(s.t, n.at);
    if (!n.pod) { finish(s, n.at); break; }
    const p = n.pod;
    if (p.status === 'falling') {
      if (s.inlet === p.lane) {
        p.status = 'warping'; p.outlet = s.outlet; p.arriveAt = p.tin + WARP_MS;
        s.events.push({ type: 'warp', id: p.id, lane: p.lane, outlet: p.outlet, arriveAt: p.arriveAt, at: p.tin });
      } else {
        p.status = 'cushion'; p.resolvedAt = p.tin; s.streak = 0;
        s.events.push({ type: 'cushion', id: p.id, lane: p.lane, at: p.tin });
        waveCheck(s, p.wave, p.tin);
      }
    } else {
      const at = p.arriveAt!;
      if (dockOpen(p.outlet!, at)) {
        p.points = rescuePoints(s.streak);
        s.score += p.points; s.streak++; s.maxStreak = Math.max(s.maxStreak, s.streak); s.rescued++;
        p.status = 'rescued';
        s.events.push({ type: 'rescue', id: p.id, dock: p.outlet!, points: p.points, streak: s.streak, at });
      } else {
        p.status = 'rerouted'; s.streak = 0;
        s.events.push({ type: 'reroute', id: p.id, dock: p.outlet!, at });
      }
      p.resolvedAt = at;
      waveCheck(s, p.wave, at);
    }
  }
  if (!s.ended) s.t = Math.max(s.t, t);
}

function waveCheck(s: State, wave: number, at: number) {
  if (s.waveDone[wave]) return;
  const group = s.pods.filter(p => p.wave === wave);
  if (group.some(p => p.resolvedAt === null)) return;
  s.waveDone[wave] = true;
  if (!group.every(p => p.status === 'rescued')) return;
  const sameDock = new Set(group.map(p => p.outlet)).size === 1;
  const bonus = sameDock ? 500 : 300;
  s.score += bonus; s.fullWaves++; if (sameDock) s.sameDockWaves++;
  s.events.push({ type: 'wave', wave, bonus, sameDock, at });
}

function finish(s: State, at: number) {
  const cleared = s.mode === 'run' && s.rescued >= CLEAR_RESCUES;
  if (cleared) { s.score += 1000; if (s.rescued === s.pods.length) s.score += 1000; }
  s.ended = { at, cleared };
  s.events.push({ type: 'end', at, cleared });
}

export function drainEvents(s: State) { const e = s.events; s.events = []; return e; }
export interface Result { score: number; rescued: number; total: number; fullWaves: number; sameDockWaves: number; maxStreak: number; cleared: boolean; rank: 'S' | 'A' | 'B' | 'C' }
export function result(s: State): Result {
  const r = s.rescued;
  const rank = r >= 60 ? 'S' : r >= 54 ? 'A' : r >= CLEAR_RESCUES ? 'B' : 'C';
  return { score: s.score, rescued: r, total: s.pods.length, fullWaves: s.fullWaves, sameDockWaves: s.sameDockWaves, maxStreak: s.maxStreak, cleared: !!s.ended?.cleared, rank: s.mode === 'run' ? rank : 'C' };
}
