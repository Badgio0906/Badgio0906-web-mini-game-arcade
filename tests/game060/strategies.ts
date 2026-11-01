// Input-list strategies driven through the public model API only (no teleport, no state writes).
import {
  BLAST_R, BOSS_START_MS, DRONE_R, FORMATIONS, FORMATION_ACTIVE_MS, FORMATION_MS, PENDING_MS, RUN_MS,
  advanceTo, bossPos, createState, dronePos, dronePosAt, droneActive, reserve, result, type Mode, type State,
} from '../../src/games/game060/model';

export interface Tap { t: number; x: number; y: number }

/** Best single-strike point for formation f within its active window, searched on the analytic paths. */
export function bestStrike(f: number, minLocal = PENDING_MS) {
  const reach = (BLAST_R + DRONE_R) ** 2;
  let best = { n: 0, local: minLocal, x: 240, y: 230 };
  for (let local = minLocal; local <= FORMATION_ACTIVE_MS; local += 10) {
    const ps = FORMATIONS[f].drones.map(d => dronePos(d, local));
    for (const a of ps) for (const b of ps) {
      const cx = Math.round((a.x + b.x) / 2), cy = Math.round((a.y + b.y) / 2);
      const n = ps.filter(p => (p.x - cx) ** 2 + (p.y - cy) ** 2 <= reach).length;
      if (n > best.n) best = { n, local, x: cx, y: cy };
    }
  }
  // Aim at the middle of the time window in which that point still catches the same count, so the
  // plan does not depend on hitting the first possible millisecond.
  const count = (local: number) => FORMATIONS[f].drones.map(d => dronePos(d, local)).filter(p => (p.x - best.x) ** 2 + (p.y - best.y) ** 2 <= reach).length;
  let end = best.local;
  while (end + 10 <= FORMATION_ACTIVE_MS && count(end + 10) >= best.n) end += 10;
  return { ...best, local: Math.round((best.local + end) / 20) * 10, windowMs: end - best.local };
}

export function run(taps: Tap[], mode: Mode = 'run', step = 1000 / 60): State {
  const s = createState(mode);
  const sorted = [...taps].sort((a, b) => a.t - b.t);
  let i = 0;
  for (let now = 0; now <= RUN_MS + 1 && !s.ended; now += step) {
    while (i < sorted.length && sorted[i].t <= now) { reserve(s, sorted[i].t, sorted[i].x, sorted[i].y); i++; }
    advanceTo(s, Math.round(now));
  }
  advanceTo(s, RUN_MS);
  return s;
}

/** Aims 0.9 s ahead: one strike per formation at its best convergence, then three boss strikes. */
export function predictivePlan(): Tap[] {
  const taps: Tap[] = [];
  for (let r = 0; r < FORMATIONS.length; r++) {
    const b = bestStrike(r);
    taps.push({ t: r * FORMATION_MS + b.local - PENDING_MS, x: b.x, y: b.y });
  }
  for (const impact of [44400, 45400, 46400]) {
    const p = bossPos(impact);
    taps.push({ t: impact - PENDING_MS, x: Math.round(p.x), y: p.y });
  }
  return taps;
}

/** Taps where the formation is NOW (its live centroid) whenever a slot is free. */
export function reactivePlan(intervalMs = 300): Tap[] {
  const probe = createState('run');
  const taps: Tap[] = [];
  for (let t = 300; t < RUN_MS; t += intervalMs) {
    advanceTo(probe, t);
    if (probe.ended) break;
    const ready = probe.slots.some(s => s.state === 'ready');
    if (!ready) continue;
    let x: number, y: number;
    if (t >= BOSS_START_MS) { const p = bossPos(t); x = p.x; y = p.y; } else {
      const live = probe.drones.filter(d => droneActive(probe, d, t));
      if (!live.length) continue;
      const ps = live.map(d => dronePosAt(probe, d, t));
      x = ps.reduce((a, p) => a + p.x, 0) / ps.length; y = ps.reduce((a, p) => a + p.y, 0) / ps.length;
    }
    taps.push({ t, x: Math.round(x), y: Math.round(y) });
    reserve(probe, t, x, y);
  }
  return taps;
}

export function summarize(s: State) {
  const r = result(s);
  return { score: r.score, rank: r.rank, cleared: r.cleared, reason: r.reason, thunders: r.thunderCount, sixShots: r.sixShots, maxOneShot: r.maxOneShot, formationFail: r.formationFail, shield: r.shield, endedAt: r.endedAt };
}
