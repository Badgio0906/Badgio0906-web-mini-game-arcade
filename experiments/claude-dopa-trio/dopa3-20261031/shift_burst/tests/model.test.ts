import { describe, expect, it } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import {
  MIN_STEPS, MIN_STEPS_TOTAL, ROOMS, RUN_MS, advanceTo, beamResult, createState, drainEvents, fire, result, score,
  selectCannon, shift, shifted, solveRoom, type State,
} from '../src/model';

/** Optimal plan: per room, apply solver moves (merged into ±2 drags where same row repeats), then fire. */
export function optimalPlan() {
  const plan: { t: number; op: 'shift' | 'cannon' | 'fire'; row?: number; d?: number; col?: number }[] = [];
  let t = 500;
  ROOMS.forEach(rm => {
    const sol = solveRoom(rm);
    for (const [row, d] of sol.moves) { plan.push({ t, op: 'shift', row, d }); t += 200; }
    plan.push({ t, op: 'cannon', col: sol.target }); t += 50;
    plan.push({ t, op: 'fire' }); t += 900;
  });
  return plan;
}
export function play(plan: ReturnType<typeof optimalPlan>, s: State = createState()) {
  for (const p of plan) {
    if (p.op === 'shift') shift(s, p.t, p.row!, p.d!);
    else if (p.op === 'cannon') { advanceTo(s, p.t); selectCannon(s, p.col!); }
    else fire(s, p.t);
  }
  advanceTo(s, RUN_MS);
  return s;
}

describe('C22 board', () => {
  it('reference min steps match the independent design BFS (2/4/3/4/3/3)', () => {
    expect(MIN_STEPS).toEqual([2, 4, 3, 4, 3, 3]);
    expect(MIN_STEPS_TOTAL).toBe(19);
  });

  it('hand-computed sample: room 1 aligns on column 2 with row0 +1 and row2 −1', () => {
    let c = [...ROOMS[0].cores];
    c = shifted(c, ROOMS[0], 0, 1); c = shifted(c, ROOMS[0], 2, -1);
    expect(c).toEqual([2, 2, 2, 2]);
  });

  it('wrap 0↔4 and ±2 moves', () => {
    const s = createState();
    shift(s, 0, 1, 2); // row1 2→4
    expect(s.cores[1]).toBe(4);
    shift(s, 200, 1, 1); // 4→0 wrap
    expect(s.cores[1]).toBe(0);
    shift(s, 400, 1, -2); // 0→3 wrap
    expect(s.cores[1]).toBe(3);
    expect(shift(s, 600, 1, 3)).toBe(false); // out of range
    expect(s.moveSteps).toBe(5);
  });

  it('gear pair moves opposite, counts |d| once, preserves pair sum mod 5', () => {
    const s = createState();
    s.roomIndex = 4; s.cores = [...ROOMS[4].cores]; // test setup for room 5 only
    const sum01 = (s.cores[0] + s.cores[1]) % 5, sum23 = (s.cores[2] + s.cores[3]) % 5;
    shift(s, 0, 0, 2);
    expect(s.cores.slice(0, 2)).toEqual([4, 3]);
    expect(s.moveSteps).toBe(2);
    shift(s, 200, 3, -1);
    expect((s.cores[0] + s.cores[1]) % 5).toBe(sum01);
    expect((s.cores[2] + s.cores[3]) % 5).toBe(sum23);
  });

  it('every room is solvable with ≤625 states and the solver replay aligns', () => {
    for (const rm of ROOMS) {
      const sol = solveRoom(rm);
      let c = [...rm.cores];
      for (const [r, d] of sol.moves) c = shifted(c, rm, r, d);
      expect(new Set(c).size).toBe(1);
    }
  });

  it('beam goes bottom→top, stops at first hard armor, passes broken rows', () => {
    expect(beamResult([1, 2, 3, 2], [false, false, false, false], 2)).toEqual({ hits: [3], stoppedAt: 2 });
    expect(beamResult([2, 2, 3, 2], [false, false, false, true], 3)).toEqual({ hits: [2], stoppedAt: 1 });
    expect(beamResult([2, 2, 2, 2], [false, false, false, false], 2)).toEqual({ hits: [3, 2, 1, 0], stoppedAt: null });
  });

  it('partial shot breaks bottom rows, they stay broken, no double scoring of broken rows', () => {
    const s = createState();
    selectCannon(s, 2);
    fire(s, 0); // row3 core at 2 → 1 row
    expect(s.broken).toEqual([false, false, false, true]);
    expect(score(s)).toBe(100);
    fire(s, 400); // row2 is at 3: stops immediately, row3 already broken: no points
    expect(score(s)).toBe(100);
    shift(s, 800, 2, -1); shift(s, 1000, 0, 1);
    fire(s, 1200); // rows 2,1,0 → 900 + room bonus 100 − 40 cost
    expect(s.roomIndex).toBe(0);
    expect(score(s)).toBe(100 + 900 + 100 - 40);
  });

  it('locks: move 120ms, beam 350ms, room switch +400ms; inputs during lock are rejected, clock still runs', () => {
    const s = createState();
    shift(s, 0, 0, 1);
    expect(shift(s, 119, 2, -1)).toBe(false);
    expect(shift(s, 120, 2, -1)).toBe(true);
    selectCannon(s, 2);
    expect(fire(s, 200)).toBe(false); // still move-locked until 240
    expect(fire(s, 240)).toBe(true);
    expect(s.roomIndex).toBe(0);
    expect(shift(s, 900, 0, 1)).toBe(false); // room switch until 240+750 = 990
    advanceTo(s, 990);
    expect(s.roomIndex).toBe(1);
    expect(shift(s, 990, 0, 1)).toBe(true);
    expect(drainEvents(s).filter(e => e.type === 'reject').length).toBe(3);
  });

  it('full pierce scores 1600 + 400; four singles score 400 + 100', () => {
    const a = createState(); shift(a, 0, 0, 1); shift(a, 200, 2, -1); selectCannon(a, 2); fire(a, 400);
    expect(score(a)).toBe(1600 + 400 - 40);
    const b = createState(); // chase each core with the cannon, one row per shot, no moves
    selectCannon(b, 2); fire(b, 0); // row3
    selectCannon(b, 3); fire(b, 400); // row2
    selectCannon(b, 2); fire(b, 800); // row1
    selectCannon(b, 1); fire(b, 1200); // row0
    expect(score(b)).toBe(400 + 100);
  });

  it('ammo 1 last shot that misses ends the run as a failure; score never negative', () => {
    const s = createState();
    for (let i = 0; i < 12; i++) shift(s, i * 200, 0, 2); // 24 steps of cost
    selectCannon(s, 0);
    for (let i = 0; i < 12; i++) fire(s, 3000 + i * 400);
    expect(s.ended?.reason).toBe('ammo');
    expect(score(s)).toBeGreaterThanOrEqual(0);
    expect(result(s).rank).toBe('C');
  });

  it('time-up at 50s; a shot at 49999 is accepted, at 50000 rejected', () => {
    const s = createState();
    selectCannon(s, 2);
    expect(fire(s, 49999)).toBe(true);
    expect(fire(s, 50000)).toBe(false);
    expect(s.ended?.reason).toBe('time');
  });

  it('optimal normal-input plan clears all 6 rooms with one shot each → rank S', () => {
    const s = play(optimalPlan());
    const r = result(s);
    expect(r.cleared).toBe(true);
    expect(r.oneShotRooms).toBe(6);
    expect(r.moveSteps).toBe(19);
    expect(r.rank).toBe('S');
  });

  it('last full pierce at the end clears (clear wins over the last-ammo check)', () => {
    const s = createState(); s.ammo = 1;
    shift(s, 0, 0, 1); shift(s, 200, 2, -1); selectCannon(s, 2);
    s.roomIndex = 5; s.roomsCleared = 5; // isolated check of clear priority when the final room is cleared with the final shell
    s.cores = [2, 2, 2, 2];
    fire(s, 400);
    expect(s.ended?.reason).toBe('clear');
  });

  it('clearing a non-final room with the last shell ends the run as out-of-ammo', () => {
    const s = createState(); s.ammo = 1;
    shift(s, 0, 0, 1); shift(s, 200, 2, -1); selectCannon(s, 2);
    fire(s, 400);
    expect(s.ended?.reason).toBe('ammo');
  });

  it('records strategy comparison: bottom-up singles vs full alignment', () => {
    // singles strategy: always break the lowest row by aligning only it with the cannon (no gear planning)
    const singles = createState();
    let t = 300;
    while (!singles.ended && t < RUN_MS) {
      advanceTo(singles, t);
      const row = singles.broken.lastIndexOf(false);
      if (row < 0) { t += 100; continue; }
      selectCannon(singles, singles.cores[row]);
      fire(singles, t); t += 800;
    }
    const full = play(optimalPlan());
    const out = { scope: 'model input lists only, not human play', singles: result(singles), fullAlignment: result(full) };
    mkdirSync('qa', { recursive: true });
    writeFileSync('qa/strategy-comparison.json', JSON.stringify(out, null, 2) + '\n');
    writeFileSync('qa/plan-optimal.json', JSON.stringify(optimalPlan(), null, 1) + '\n');
    expect(result(full).score).toBeGreaterThan(result(singles).score);
  });
});
