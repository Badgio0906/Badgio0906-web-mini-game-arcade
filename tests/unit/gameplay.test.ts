import { describe, expect, it } from 'vitest';
import { INNER_RADIUS, MAX_ANGULAR_SPEED, OrbitRun, OUTER_RADIUS, SWITCH_SECONDS, difficultyAt, speedAt, validatePattern } from '../../src/game/OrbitRun';
import type { GameplayEvent } from '../../src/game/contracts';

function seeded(seed: number) {
  let value = seed;
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

describe('orbit movement and scoring', () => {
  it('interpolates a shift, rejects repeated inputs during it, and resets a completed run', () => {
    const events: GameplayEvent[] = [];
    const run = new OrbitRun(event => events.push(event), seeded(1));
    expect(run.shift()).toBe(false);
    run.start();
    expect(run.shift()).toBe(true);
    expect(run.shift()).toBe(false);
    run.step(0.05);
    expect(run.radius).toBeGreaterThan(INNER_RADIUS);
    expect(run.radius).toBeLessThan(OUTER_RADIUS);
    run.step(0.05);
    run.step(0.05);
    expect(run.radius).toBeCloseTo(OUTER_RADIUS);
    expect(run.snapshot().shifting).toBe(false);
    expect(events.filter(event => event.type === 'shift')).toHaveLength(1);
    run.start();
    expect(run.snapshot()).toMatchObject({ time: 0, score: 0, lane: 'inner', combo: 0, alive: true });
    expect(run.result()).toBeNull();
  });

  it('emits death once, freezes the result, and caps resumed large frames', () => {
    const events: GameplayEvent[] = [];
    const run = new OrbitRun(event => events.push(event), seeded(2));
    run.start();
    run.step(60);
    expect(run.time).toBeCloseTo(0.05);
    for (let frame = 0; frame < 1200 && run.alive; frame++) run.step(1 / 60);
    expect(run.alive).toBe(false);
    expect(run.result()?.time).toBeGreaterThan(5);
    const result = run.result();
    run.step(10);
    expect(run.shift()).toBe(false);
    expect(run.result()).toEqual(result);
    expect(events.filter(event => event.type === 'death')).toHaveLength(1);
    expect(result?.score).toBeGreaterThan(0);
  });

  it('rewards a survivable late switch only after the obstacle has been passed', () => {
    const events: GameplayEvent[] = [];
    const run = new OrbitRun(event => events.push(event), seeded(3));
    run.start();
    while (!run.obstacles.length) run.step(1 / 240);
    const obstacle = run.obstacles[0];
    while ((obstacle.angle - obstacle.halfWidth - 8 / INNER_RADIUS - run.theta) / speedAt(run.time) > 0.19) run.step(1 / 240);
    expect(run.shift()).toBe(true);
    expect(events.filter(event => event.type === 'near_miss')).toHaveLength(0);
    for (let n = 0; n < 240; n++) run.step(1 / 240);
    expect(run.alive).toBe(true);
    expect(events.filter(event => event.type === 'near_miss')).toHaveLength(1);
    expect(run.snapshot().combo).toBe(1);
    expect(run.snapshot().score).toBeGreaterThanOrEqual(130);
  });
});

describe('difficulty and fair pattern generation', () => {
  it('has ordered difficulty boundaries and bounded continuous rotation speed', () => {
    expect([0, 10, 30, 60, 90].map(difficultyAt)).toEqual(['WARM UP', 'EASY', 'NORMAL', 'HARD', 'VERY HARD']);
    for (let time = 0; time <= 3600; time += 1) {
      expect(speedAt(time)).toBeLessThanOrEqual(MAX_ANGULAR_SPEED);
      expect(speedAt(time + 1) - speedAt(time)).toBeLessThan(0.015);
    }
    expect(SWITCH_SECONDS).toBeGreaterThanOrEqual(0.1);
    expect(SWITCH_SECONDS).toBeLessThanOrEqual(0.18);
    expect(validatePattern([
      { lane: 'inner', offset: 0, halfWidth: 0.12 },
      { lane: 'outer', offset: 0.5, halfWidth: 0.12 },
    ])).toBe(false);
  });

  it.each([1, 17, 77])('safe reactive policy survives ten minutes with bounded object lists (seed %s)', seed => {
    const run = new OrbitRun(() => {}, seeded(seed));
    run.start();
    for (let n = 0; n < 600 * 60; n++) {
      const threat = run.obstacles.find(obstacle => obstacle.angle + obstacle.halfWidth + 8 / INNER_RADIUS >= run.theta);
      if (threat?.lane === run.lane && threat.angle - threat.halfWidth - run.theta < 0.8) run.shift();
      run.step(1 / 60);
      if (!run.alive) throw new Error(`Safe policy died at ${run.time}s, seed ${seed}`);
      expect(run.obstacles.length).toBeLessThanOrEqual(8);
      expect(run.shards.length).toBeLessThanOrEqual(8);
      expect(validatePattern(run.obstacles.map(obstacle => ({ lane: obstacle.lane, offset: obstacle.angle, halfWidth: obstacle.halfWidth })))).toBe(true);
    }
    expect(run.snapshot().time).toBeCloseTo(600, 3);
    expect(run.snapshot().score).toBeGreaterThan(6000);
  });
});
