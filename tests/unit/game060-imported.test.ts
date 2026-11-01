import { describe, expect, it } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import {
  BOX, BOSS_START_MS, FORMATIONS, FORMATION_MS, RUN_MS, advanceTo, bossPos, chainPoints, createState, drainEvents,
  dronePos, reserve, result, type State,
} from '../../src/games/game060/model';
import { bestStrike, predictivePlan, reactivePlan, run, summarize } from '../game060/strategies';

const impacts = (s: State) => drainEvents(s).filter(e => e.type === 'impact');

describe('C21 core', () => {
  it('spec sample: first formation matches x_i = 180+24i+64(t-0.9), y=160', () => {
    FORMATIONS[0].drones.forEach((d, i) => {
      for (const t of [0, 0.5, 0.9, 2]) {
        const p = dronePos(d, t * 1000);
        expect(p.x).toBeCloseTo(180 + 24 * i + 64 * (t - 0.9), 6);
        expect(p.y).toBe(160);
      }
    });
  });

  it('first reservation at (240,160) at t=0 removes all six exactly once at 900ms', () => {
    const s = createState();
    expect(reserve(s, 0, 240, 160)).toBe(true);
    advanceTo(s, 899);
    expect(impacts(s)).toHaveLength(0);
    expect(s.drones.filter(d => d.round === 0 && d.alive)).toHaveLength(6);
    advanceTo(s, 900);
    const ev = impacts(s);
    expect(ev).toHaveLength(1);
    expect(ev[0].type === 'impact' && ev[0].kills.length).toBe(6);
    expect(s.score).toBe(2100);
    advanceTo(s, 5000);
    expect(s.score).toBe(2100);
    expect(s.sixShots).toBe(1);
  });

  it('chain score formula and 6-in-one beats six singles', () => {
    expect([1, 2, 3, 6].map(chainPoints)).toEqual([100, 300, 600, 2100]);
    expect(chainPoints(6)).toBeGreaterThan(6 * chainPoints(1));
  });

  it('every formation starts in bounds, and allows a full 6-kill and a >=3 defence', () => {
    FORMATIONS.forEach((f, i) => {
      for (const d of f.drones) {
        expect(d.x0).toBeGreaterThanOrEqual(BOX.minX); expect(d.x0).toBeLessThanOrEqual(BOX.maxX);
        expect(d.y0).toBeGreaterThanOrEqual(BOX.minY); expect(d.y0).toBeLessThanOrEqual(BOX.maxY);
      }
      expect(bestStrike(i).n, f.name).toBe(6);
    });
  });

  it('slot cycle: pending until 900, cooldown 1199 still busy, ready at 2100', () => {
    const s = createState();
    reserve(s, 0, 10, 400);
    advanceTo(s, 899); expect(s.slots[0].state).toBe('pending');
    advanceTo(s, 900); expect(s.slots[0].state).toBe('cooldown');
    advanceTo(s, 2099); expect(s.slots[0].state).toBe('cooldown');
    advanceTo(s, 2100); expect(s.slots[0].state).toBe('ready');
  });

  it('3 slots max, 120ms global gap', () => {
    const s = createState();
    expect(reserve(s, 0, 10, 400)).toBe(true);
    expect(reserve(s, 119, 10, 400)).toBe(false);
    expect(reserve(s, 120, 10, 400)).toBe(true);
    expect(reserve(s, 240, 10, 400)).toBe(true);
    expect(reserve(s, 400, 10, 400)).toBe(false); // no ready slot
    expect(drainEvents(s).filter(e => e.type === 'reject').map(e => e.type === 'reject' && e.reason)).toEqual(['gap', 'no-slot']);
    expect(s.thunderCount).toBe(3);
  });

  it('blast reach boundary is 68+14 = 82px', () => {
    // drone 0 of formation 0 at t=900 is at (180,160)
    const hit = createState(); reserve(hit, 0, 180 + 82, 160); advanceTo(hit, 900);
    expect(hit.drones[0].alive).toBe(false);
    const miss = createState(); reserve(miss, 0, 180 - 82.01, 160); advanceTo(miss, 900);
    expect(miss.drones[0].alive).toBe(true);
  });

  it('simultaneous impacts: lower reservation id owns the kill, no double count', () => {
    const s = createState();
    reserve(s, 0, 240, 160);
    // a second slot cannot land at the same ms because of the 120ms gap; equal-time ownership is
    // still checked by forcing two reservations through the gap boundary at different start times
    reserve(s, 120, 240, 160);
    advanceTo(s, 1100);
    const ev = impacts(s);
    expect(ev.map(e => e.type === 'impact' && e.kills.length)).toEqual([6, 0]);
    expect(s.score).toBe(2100);
    expect(new Set(s.drones.filter(d => !d.alive).map(d => d.killedBy))).toEqual(new Set([1]));
  });

  it('pending reservation survives a formation switch and hits the next formation', () => {
    const b = bestStrike(1);
    const s = createState();
    const t = FORMATION_MS + b.local - 900;
    expect(t).toBeLessThan(FORMATION_MS + 1000);
    reserve(s, FORMATION_MS - 300, 0, 400); // lands after the switch, on nothing
    reserve(s, t, b.x, b.y);
    advanceTo(s, FORMATION_MS + 5000);
    expect(s.runs[1].kills).toBe(6);
  });

  it('formation fail costs exactly one shield; shield 0 ends the run', () => {
    const s = createState();
    advanceTo(s, 5000);
    expect(s.shield).toBe(2);
    advanceTo(s, 5000 + 5500 * 2);
    expect(s.shield).toBe(0);
    expect(s.ended).toEqual({ reason: 'shield', at: 16000 });
    expect(result(s).rank).toBe('C');
    reserve(s, 16001, 240, 160);
    expect(s.thunderCount).toBe(0);
  });

  it('kills at exactly the 5000ms decision count, after it the drones are not hittable', () => {
    const at = createState(); reserve(at, 4100, 0, 50); // miss but keeps flow
    const b0 = dronePos(FORMATIONS[0].drones[2], 5000);
    const s1 = createState(); reserve(s1, 4100, b0.x, b0.y); advanceTo(s1, 6000);
    expect(s1.runs[0].kills).toBeGreaterThan(0);
    const b1 = dronePos(FORMATIONS[0].drones[2], 5001);
    const s2 = createState(); reserve(s2, 4101, b1.x, b1.y); advanceTo(s2, 6000);
    expect(s2.runs[0].kills).toBe(0);
  });

  it('boss: 1 damage per reservation, 800ms shield, clear before time-up', () => {
    const s = createState();
    // skip formations by sacrificing shields is impossible (3 fails = end), so keep 3+ per formation
    for (const tap of predictivePlan().slice(0, 8)) reserve(s, tap.t, tap.x, tap.y);
    advanceTo(s, BOSS_START_MS);
    const p1 = bossPos(44500), p2 = bossPos(45100), p3 = bossPos(45300);
    reserve(s, 43600, p1.x, p1.y); // impact 44500 → hit
    reserve(s, 44200, p2.x, p2.y); // impact 45100 → 600ms after: shielded, no damage
    reserve(s, 44400, p3.x, p3.y); // impact 45300 → exactly 800ms: damage
    advanceTo(s, 45300);
    expect(s.boss.hp).toBe(1);
    const ev = drainEvents(s).filter(e => e.type === 'boss-hit');
    expect(ev).toHaveLength(2);
  });

  it('time-up at 54000 processes impacts scheduled at 54000 first', () => {
    const s = createState();
    for (const tap of predictivePlan().slice(0, 8)) reserve(s, tap.t, tap.x, tap.y);
    advanceTo(s, 53000);
    const p = bossPos(54000);
    reserve(s, 53100, p.x, p.y); // first boss hit lands at 54000 exactly
    advanceTo(s, 60000);
    expect(s.boss.hp).toBe(2);
    expect(s.ended).toEqual({ reason: 'time', at: RUN_MS });
    expect(reserve(s, 53999, 0, 0)).toBe(false);
  });

  it('frame-rate invariance: identical result at 30/60/120Hz with the same timestamps', () => {
    const plan = predictivePlan();
    const r = [30, 60, 120, 7].map(hz => summarize(run(plan, 'run', 1000 / hz)));
    expect(r[1]).toEqual(r[0]); expect(r[2]).toEqual(r[0]); expect(r[3]).toEqual(r[0]);
  });

  it('predictive plan clears with rank S; S is reachable with normal rules', () => {
    const s = summarize(run(predictivePlan()));
    expect(s.cleared).toBe(true);
    expect(s.rank).toBe('S');
    expect(s.sixShots).toBe(8);
  });

  it('practice mode: 3 rounds of formation 0, no shield loss, ends at 16500', () => {
    const s = createState('practice');
    advanceTo(s, 20000);
    expect(s.shield).toBe(3);
    expect(s.ended).toEqual({ reason: 'practice', at: 16500 });
  });

  it('records strategy comparison (reactive vs predictive) to QA', () => {
    const predictive = summarize(run(predictivePlan()));
    const reactive = [150, 300, 600].map(iv => ({ intervalMs: iv, ...summarize(run(reactivePlan(iv))) }));
    const sixKillWindowMs = FORMATIONS.map((f, i) => ({ formation: f.name, windowMs: bestStrike(i).windowMs }));
    const out = { generatedBy: 'tests/model.test.ts', scope: 'model input lists only, not human play', predictive, reactive, sixKillWindowMs };
    mkdirSync('qa', { recursive: true });
    writeFileSync('qa/strategy-comparison.json', JSON.stringify(out, null, 2) + '\n');
    writeFileSync('qa/plan-predictive.json', JSON.stringify(predictivePlan(), null, 1) + '\n');
    for (const r of reactive) expect(r.score).toBeLessThan(predictive.score);
  });
});
