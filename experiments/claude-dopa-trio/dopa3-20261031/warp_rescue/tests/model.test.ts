import { describe, expect, it } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import {
  RUN_MS, SCHEDULE, WARP_MS, advanceTo, createState, dockFlipIn, dockOpen, drainEvents, pmod, podY, rescuePoints, result,
  select, type State,
} from '../src/model';

type Ctl = { at: number; selector: 'in' | 'out'; value: number };
/** Spec reference schedule: inlet at tin−200, outlet at tin−100 (keep current outlet while it is open on arrival). */
export function readingPlan(): Ctl[] {
  const out: Ctl[] = []; let o = 0;
  for (const p of SCHEDULE) {
    const safe = [0, 1, 2].filter(d => dockOpen(d, p.tin + WARP_MS));
    if (!safe.includes(o)) o = safe[0];
    out.push({ at: p.tin - 200, selector: 'in', value: p.lane }, { at: p.tin - 100, selector: 'out', value: o });
  }
  return out;
}
export function play(ctl: Ctl[], s: State = createState(), step = 1000 / 60) {
  const sorted = [...ctl].sort((a, b) => a.at - b.at); let i = 0;
  for (let now = 0; now <= RUN_MS + 1 && !s.ended; now += step) {
    while (i < sorted.length && sorted[i].at <= now) { select(s, sorted[i].at, sorted[i].selector, sorted[i].value); i++; }
    advanceTo(s, Math.round(now));
  }
  advanceTo(s, RUN_MS);
  return s;
}

describe('C23 timetable and docks', () => {
  it('60 pods, t_in formula and lanes per spec, last arrival 47.25s', () => {
    expect(SCHEDULE).toHaveLength(60);
    expect(SCHEDULE[0].tin).toBe(1000);
    expect(SCHEDULE[59].tin + WARP_MS).toBe(47250);
    expect(SCHEDULE.slice(0, 5).map(p => p.lane)).toEqual([0, 0, 0, 0, 0]);
    expect(SCHEDULE.filter(p => p.wave === 4).map(p => p.lane)).toEqual([2, 2, 0, 0, 2]);
  });
  it('first pods are already visible at start (y ≥ 40 at t=0 for the first wave head)', () => {
    expect(podY(SCHEDULE[0], 0)).toBe(200);
  });
  it('dock OPEN window: inclusive start, exclusive end at 2.7s, negative phase wraps', () => {
    expect(dockOpen(0, 1000)).toBe(true);
    expect(dockOpen(0, 3699)).toBe(true);
    expect(dockOpen(0, 3700)).toBe(false);
    expect(dockOpen(0, 6400)).toBe(true);
    expect(dockOpen(2, 0)).toBe(true); // phase 0−4600 → mod 5400 = 800 → open
    expect(pmod(-1, 5400)).toBe(5399);
    expect(dockFlipIn(0, 1000)).toBe(2700);
    for (let t = 0; t < 5400; t++) expect([0, 1, 2].some(d => dockOpen(d, t))).toBe(true);
  });
  it('arrival at exactly 450ms: 449 still warping, 450 resolved', () => {
    const s = createState();
    advanceTo(s, 1000 + 449);
    expect(s.pods[0].status).toBe('warping');
    advanceTo(s, 1000 + 450);
    expect(s.pods[0].status).toBe('rescued');
  });
  it('outlet is fixed at the inlet crossing; later outlet change does not retarget', () => {
    const s = createState();
    advanceTo(s, 1000); // pod 0 warps with outlet 0
    select(s, 1100, 'out', 1);
    advanceTo(s, 1450);
    expect(s.pods[0].outlet).toBe(0);
    expect(s.pods[1].outlet).toBe(1); // crossed at 1450 after the change → new outlet
  });
  it('same-ms selection applies before the crossing at that ms', () => {
    const s = createState();
    const t = SCHEDULE[0].tin;
    const s2 = createState();
    select(s2, t, 'in', 1); // moved away exactly at crossing time → pod 0 misses
    advanceTo(s2, t);
    expect(s2.pods[0].status).toBe('cushion');
    expect(s.inlet).toBe(0);
  });
  it('80ms cooldown per selector, independent between inlet and outlet', () => {
    const s = createState();
    expect(select(s, 100, 'in', 1)).toBe(true);
    expect(select(s, 179, 'in', 2)).toBe(false);
    expect(select(s, 150, 'out', 2)).toBe(true);
    expect(select(s, 180, 'in', 2)).toBe(true);
  });
  it('low-FPS: one big advance still evaluates each crossing at its own time', () => {
    const a = play(readingPlan(), createState(), 1000 / 60);
    const b = play(readingPlan(), createState(), 250);
    const c = play(readingPlan(), createState(), 1000 / 120);
    expect(result(b)).toEqual(result(a));
    expect(result(c)).toEqual(result(a));
  });
  it('reroute resets the streak; points tier 100/200/300', () => {
    expect([0, 9, 10, 19, 20, 50].map(rescuePoints)).toEqual([100, 100, 200, 200, 300, 300]);
    const s = createState();
    advanceTo(s, 4000);
    expect(s.streak).toBe(5);
    select(s, 4500, 'out', 2); // wave1 lane2... inlet still 0 → cushions reset streak
    advanceTo(s, 7000);
    expect(s.streak).toBe(0);
  });
  it('wave bonus once: 500 for same dock, none if any capsule fails; no double rescue', () => {
    const s = createState();
    advanceTo(s, 4000);
    const ev = drainEvents(s);
    expect(ev.filter(e => e.type === 'wave')).toEqual([{ type: 'wave', wave: 0, bonus: 500, sameDock: true, at: 1000 + 4 * 450 + 450 }]);
    expect(ev.filter(e => e.type === 'rescue')).toHaveLength(5);
    expect(s.score).toBe(500 + 500);
    advanceTo(s, 4000);
    expect(s.score).toBe(1000);
  });
  it('reading plan rescues all 60 (S); scoring stops at 50s', () => {
    const s = play(readingPlan());
    const r = result(s);
    expect(r.rescued).toBe(60);
    expect(r.rank).toBe('S');
    expect(r.cleared).toBe(true);
    const before = s.score;
    advanceTo(s, 70000);
    expect(s.score).toBe(before);
    expect(select(s, 50000, 'in', 1)).toBe(false);
  });
  it('records 3-strategy comparison', () => {
    const lanePlan = SCHEDULE.map(p => ({ at: p.tin - 200, selector: 'in' as const, value: p.lane }));
    const fixedExit = [0, 1, 2].map(d => result(play([...lanePlan, { at: 10, selector: 'out', value: d }])));
    const center = result(play([{ at: 10, selector: 'in', value: 1 }]));
    const reading = result(play(readingPlan()));
    const out = { scope: 'model input lists only, not human play', inletCenterFixed: center, inletOnlyFixedExit: fixedExit, inletAndArrivalReading: reading };
    mkdirSync('qa', { recursive: true });
    writeFileSync('qa/strategy-comparison.json', JSON.stringify(out, null, 2) + '\n');
    writeFileSync('qa/plan-reading.json', JSON.stringify(readingPlan(), null, 1) + '\n');
    expect(Math.max(...fixedExit.map(r => r.rescued))).toBe(32);
    expect(center.rescued).toBeLessThan(42);
    expect(reading.rescued).toBe(60);
  });
});
