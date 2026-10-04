import { describe, expect, it } from 'vitest';
import { WorkdayRun, MOVE_SECONDS, PLAYER_Y, PREVIEW_SECONDS, validateWaves, type WorkdayEvent } from '../../src/games/game002/WorkdayRun';
import { calculateWorkdayScore } from '../../src/games/game002/scoring';

function seeded(seed: number) {
  let value = seed;
  return () => { value = (Math.imul(value, 1664525) + 1013904223) >>> 0; return value / 4294967296; };
}
/** Only public step / one-lane inputs. Reads the same visible final lane and approach clock as DEV inspection. */
function safeStep(run: WorkdayRun) {
  const wave = run.waves.find(candidate => candidate.encounterTime + .3 >= run.worldTime);
  if (wave && wave.encounterTime - run.worldTime < 1.15 && run.targetLane !== wave.safeLane) {
    run.move(run.targetLane < wave.safeLane ? 1 : -1);
  }
  run.step(1 / 60);
}
function reach(run: WorkdayRun, distance: number) {
  for (let n = 0; n < 1200 * 60 && run.alive && run.distance < distance; n++) {
    if (run.pending) throw new Error(`Unchosen ${run.pending} before ${distance}m`);
    safeStep(run);
  }
  expect(run.alive).toBe(true);
  expect(run.distance).toBeGreaterThanOrEqual(distance);
}
function company(seed = 17, events: WorkdayEvent[] = []) {
  const run = new WorkdayRun(event => events.push(event), seeded(seed));
  run.start(); reach(run, 1000);
  expect(run.pending).toBe('company');
  return run;
}
function bikeOffer(seed = 17, events: WorkdayEvent[] = []) {
  const run = company(seed, events);
  expect(run.choose('journey')).toBe(true);
  reach(run, 2000); expect(run.pending).toBe('bike');
  return run;
}

describe('Workday milestone and endless journey', () => {
  it('1000m pauses the live run and all motion, rejects nonmatching choices, then clears office exactly once', () => {
    const events: WorkdayEvent[] = []; const run = company(17, events);
    const before = run.inspection();
    expect(before).toMatchObject({ distance: 1000, alive: true, outcome: null, mode: 'commute' });
    expect(run.result()).toBeNull();
    for (let n = 0; n < 100; n++) { expect(run.move(n % 2 ? 1 : -1)).toBe(false); run.step(.05); }
    expect(run.inspection()).toEqual(before);
    for (const choice of ['bike', 'walk', 'safe_exit'] as const) expect(run.choose(choice)).toBe(false);
    expect(events.filter(event => event.type === 'milestone')).toEqual([{ type: 'milestone', milestone: 'company' }]);
    expect(events.some(event => ['clear', 'safe_exit', 'collision'].includes(event.type))).toBe(false);
    expect(run.choose('office')).toBe(true);
    expect(run.result()).toMatchObject({ distance: 1000, outcome: 'clear', cleared: true, time: before.time });
    expect(run.choose('office')).toBe(false); expect(run.choose('journey')).toBe(false);
    expect(events.filter(event => event.type === 'choice')).toHaveLength(1);
    expect(events.filter(event => event.type === 'clear')).toHaveLength(1);
  });

  it('journey reaches a frozen second choice; safe exit finalizes real score once without office clear', () => {
    const events: WorkdayEvent[] = []; const run = bikeOffer(77, events);
    const before = run.inspection();
    expect(before).toMatchObject({ distance: 2000, pending: 'bike', mode: 'journey', travel: 'walk' });
    for (let n = 0; n < 60; n++) { run.step(.05); run.move(1); }
    expect(run.inspection()).toEqual(before); expect(run.result()).toBeNull();
    expect(run.choose('journey')).toBe(false); expect(run.choose('office')).toBe(false);
    expect(run.choose('safe_exit')).toBe(true);
    expect(run.result()).toMatchObject({ ...calculateWorkdayScore(2000, before.dodges), outcome: 'safe_exit', cleared: false, time: before.time });
    const result = run.result(); run.step(.05); run.move(-1); expect(run.choose('bike')).toBe(false);
    expect(run.result()).toEqual(result);
    expect(events.filter(event => event.type === 'milestone').map(event => event.type === 'milestone' && event.milestone)).toEqual(['company', 'bike']);
    expect(events.filter(event => event.type === 'safe_exit')).toHaveLength(1);
    expect(events.filter(event => event.type === 'clear')).toHaveLength(0);
  });

  it('both continuation choices start a visible fresh segment with a usable collision lead and no instant reward', () => {
    for (const choice of ['walk', 'bike'] as const) {
      const run = bikeOffer(); const before = run.snapshot();
      const oldIds = new Set(run.enemies.map(enemy => enemy.id));
      expect(run.choose(choice)).toBe(true);
      const after = run.snapshot();
      expect(after.time).toBe(before.time); expect(after.worldTime).toBe(before.worldTime);
      expect(after.distance).toBe(2000); expect(after.dodges).toBe(before.dodges);
      expect(run.enemies.every(enemy => !oldIds.has(enemy.id))).toBe(true);
      const earliest = Math.min(...run.enemies.map(enemy => enemy.encounterTime));
      const entryLead = (earliest - run.worldTime - 32 * PREVIEW_SECONDS / (PLAYER_Y + 40)) / after.speedMultiplier;
      expect(entryLead).toBeGreaterThan(1.8);
      expect(validateWaves(run.waves, after.speedMultiplier)).toBe(true);
    }
  });

  it('bike doubles approach, distance and one-lane motion while duration counts real active seconds', () => {
    const walk = bikeOffer(12345); const bike = bikeOffer(12345);
    walk.choose('walk'); bike.choose('bike');
    const walkStart = walk.snapshot(); const bikeStart = bike.snapshot();
    expect(walk.enemies).toEqual(bike.enemies);
    const direction = walk.targetLane === 2 ? -1 : 1;
    expect(walk.move(direction)).toBe(true); expect(bike.move(direction)).toBe(true);
    for (let n = 0; n < 4; n++) { walk.step(1 / 60); bike.step(1 / 60); }
    expect(bike.snapshot().moving).toBe(false); expect(walk.snapshot().moving).toBe(true);
    expect(bike.time - bikeStart.time).toBeCloseTo(walk.time - walkStart.time, 9);
    expect(bike.worldTime - bikeStart.worldTime).toBeCloseTo((walk.worldTime - walkStart.worldTime) * 2, 9);
    expect(bike.distance - 2000).toBeCloseTo((walk.distance - 2000) * 2, 8);
    expect(bike.snapshot()).toMatchObject({ mode: 'bike', travel: 'bike', speedMultiplier: 2 });
    expect(MOVE_SECONDS).toBe(.13);
  });

  it('five seeded walking and biking journeys pass 5000m with bounded visible resources and only two offers', () => {
    for (const choice of ['walk', 'bike'] as const) for (const seed of [1, 17, 77, 12345, 4294967295]) {
      const events: WorkdayEvent[] = []; const run = bikeOffer(seed, events); run.choose(choice);
      let frames = 0;
      while (run.alive && run.distance < 5200 && frames++ < 400 * 60) {
        safeStep(run);
        expect(run.enemies.length).toBeLessThanOrEqual(12); expect(run.waves.length).toBeLessThanOrEqual(6);
        expect(validateWaves(run.waves, run.speedMultiplier)).toBe(true);
        expect(run.pending).toBeNull();
      }
      expect(run.snapshot(), `${choice} seed ${seed}`).toMatchObject({ alive: true, outcome: null, pending: null });
      expect(run.distance).toBeGreaterThanOrEqual(5200); expect(run.result()).toBeNull();
      expect(events.filter(event => event.type === 'milestone')).toHaveLength(2);
      expect(events.filter(event => ['clear', 'safe_exit', 'collision'].includes(event.type))).toHaveLength(0);
    }
  }, 20_000);

  it('endless bike still collides normally, reports uncapped distance, and retry resets both milestone choices and speed', () => {
    const events: WorkdayEvent[] = []; const run = bikeOffer(1, events); run.choose('bike'); reach(run, 5100);
    for (let n = 0; n < 20 * 60 && run.alive; n++) run.step(1 / 60);
    expect(run.result()).toMatchObject({ outcome: 'collision', cleared: false, mode: 'bike', travel: 'bike' });
    expect(run.result()!.distance).toBeGreaterThan(5000);
    expect(run.result()!.score).toBeGreaterThan(5000);
    expect(events.filter(event => event.type === 'collision')).toHaveLength(1);
    run.start();
    expect(run.snapshot()).toMatchObject({ distance: 0, time: 0, worldTime: 0, pending: null, mode: 'commute', travel: 'walk', speedMultiplier: 1, dodges: 0 });
    reach(run, 1000); expect(run.pending).toBe('company');
    expect(events.filter(event => event.type === 'milestone')).toHaveLength(3);
  });

  it('endless scoring keeps tier rounding beyond legacy cap and finite safe arithmetic', () => {
    for (const distance of [2000, 5001, 10000, 20000]) {
      expect(calculateWorkdayScore(distance, 15)).toMatchObject({ distance, bonusPercent: 170, score: Math.floor(distance * 1.7) });
    }
    expect(calculateWorkdayScore(5001.9, 3.9)).toEqual({ distance: 5001, dodges: 3, bonusPercent: 110, score: 5501 });
    expect(calculateWorkdayScore(Number.MAX_SAFE_INTEGER, 15).score).toBe(Number.MAX_SAFE_INTEGER);
    expect(calculateWorkdayScore(Infinity, NaN)).toMatchObject({ distance: 0, dodges: 0, score: 0 });
  });
});
