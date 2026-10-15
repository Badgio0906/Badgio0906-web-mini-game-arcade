import { describe, expect, it } from 'vitest';
import { WorkdayRun, PREVIEW_SECONDS, PLAYER_Y, validateWaves } from '../../src/games/game002/WorkdayRun';
import { bikeStageAt, bikeSpeedAt, calculateWorkdayScore, weightedWorkdayDistance } from '../../src/games/game002/scoring';

const random = (seed: number) => () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
function steer(run: WorkdayRun, dt = 1 / 30): void {
  const next = run.waves.find(w => w.encounterTime + .3 >= run.roadTime);
  if (next && next.encounterTime - run.roadTime < 1.3 && run.targetLane !== next.safeLane) run.move(run.targetLane < next.safeLane ? 1 : -1);
  run.step(dt);
}

describe('Game002 1000m bike acceleration and integrated score', () => {
  it('uses boarding-relative exact boundaries and caps real speeds', () => {
    for (const start of [2000, 2074.25]) {
      expect(bikeStageAt(start + 999.999, start)).toBe(0);
      expect(bikeStageAt(start + 1000, start)).toBe(1);
      expect(bikeStageAt(start + 2000, start)).toBe(2);
    }
    expect([0, 1, 2, 3, 4].map(bikeSpeedAt)).toEqual([2, 2.25, 2.5, 2.8, 3.1]);
    expect(bikeSpeedAt(10000)).toBe(4);
    expect(bikeStageAt(12000, null)).toBe(0);
  });
  it('prices only the metres in each band and adds NICE once on plain metres', () => {
    expect(weightedWorkdayDistance(3000, 2000)).toBe(3000);
    expect(weightedWorkdayDistance(4000, 2000)).toBe(4500);
    expect(weightedWorkdayDistance(4500, 2000)).toBe(5600);
    expect(calculateWorkdayScore(4500, 3, 2000).score).toBe(6050);
    expect(calculateWorkdayScore(3001, 0, 2000).score).toBe(3001);
    let previous = 0;
    for (let distance = 0; distance <= 20000; distance++) {
      const score = calculateWorkdayScore(distance, 15, 2000).score;
      expect(score).toBeGreaterThanOrEqual(previous); previous = score;
    }
    expect(calculateWorkdayScore(Number.MAX_SAFE_INTEGER, 99, 2000).score).toBe(Number.MAX_SAFE_INTEGER);
  });
  it('public adjacent-lane inputs survive every acceleration and the capped high-speed region at varied frame rates', () => {
    for (const seed of [1, 17, 77, 12345]) {
      const stages: number[] = [];
      const run = new WorkdayRun(e => { if (e.type === 'acceleration') stages.push(e.stage); }, random(seed));
      run.start(); let frames = 0;
      while (run.alive && run.distance < 12000 && frames++ < 60000) {
        if (run.pending) { run.choose(run.pending === 'company' ? 'journey' : 'bike'); continue; }
        steer(run, frames % 3 === 0 ? .05 : frames % 3 === 1 ? 1 / 30 : 1 / 120);
        expect(validateWaves(run.waves, run.hazardMultiplier)).toBe(true);
        expect(run.waves.every(w => !w.blockedLanes.includes(w.safeLane))).toBe(true);
      }
      expect(run.alive, `seed ${seed} at ${run.distance}`).toBe(true);
      expect(run.distance).toBeGreaterThanOrEqual(12000);
      expect(run.speedMultiplier).toBe(4);
      expect(stages).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      expect(run.bikeStartDistance).toBe(2000);
      expect(PREVIEW_SECONDS / run.hazardMultiplier).toBeGreaterThanOrEqual(1.5);
      for (const e of run.enemies) expect((e.encounterTime - e.changeEnd - 32 * PREVIEW_SECONDS / (PLAYER_Y + 40)) / run.hazardMultiplier).toBeGreaterThan(.6);
      // Reading while paused consumes neither the hazard clock nor score; a long
      // resume-frame delay is limited to 50ms and continuous collision substeps.
      const paused = run.inspection(); run.snapshot(); run.inspection(); expect(run.inspection()).toEqual(paused);
      run.step(30); expect(run.time - paused.time).toBeCloseTo(.05);
      run.start(); expect(run.snapshot()).toMatchObject({ bikeStage: 0, bikeStartDistance: null, speedMultiplier: 1, roadTime: 0 });
    }
  }, 20000);
});
