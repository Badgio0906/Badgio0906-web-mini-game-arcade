import { describe, expect, it } from 'vitest';
import { TowerRun, evaluateTowerStability, swingAmplitude, swingSpeed } from '../../src/games/game003/TowerRun';
import type { CargoPose, TowerEvent } from '../../src/games/game003/contracts';

function seeded(seed: number) {
  let n = seed;
  return () => { n = (Math.imul(n, 1664525) + 1013904223) >>> 0; return n / 4294967296; };
}
function cargo(x: number, mass: number, width = 100): CargoPose {
  return { id: 0, x, y: 0, mass, width, height: 40, vx: 0, vy: 0, rotation: 0 };
}
function until(run: TowerRun, condition: () => boolean, maxSeconds = 20) {
  for (let t = 0; t < maxSeconds && !condition(); t += 1 / 120) {
    if (run.snapshot().pending) expect(run.choose('normal')).toBe(true);
    run.step(1 / 120);
  }
  expect(condition(), `condition not reached after ${maxSeconds}s; ${JSON.stringify(run.snapshot())}`).toBe(true);
}
function landAt(run: TowerRun, target: () => number, tolerance = 0.5) {
  until(run, () => run.phase === 'hanging');
  until(run, () => Math.abs(run.landingProjection() - target()) < tolerance);
  const original = { ...run.cargo! };
  expect(run.drop()).toBe(true);
  until(run, () => run.phase === 'settling' || !run.alive, 3);
  return original;
}

describe('DROP TOWER mass and support', () => {
  it('checks upper mass at every contact; heavy overhang fails even with a supported top and foundation', () => {
    const lightTop = [cargo(300, 10), cargo(340, 10), cargo(380, 1)];
    expect(evaluateTowerStability(lightTop).stable).toBe(true);
    const heavyTop = [cargo(300, 10), cargo(340, 1), cargo(380, 10)];
    const report = evaluateTowerStability(heavyTop);
    expect(report.stable).toBe(false);
    expect(report.weakJointIndex).toBe(1);
    expect(report.loadCenter).toBeGreaterThan(report.support.right + 4);
    expect(evaluateTowerStability([cargo(300, 1), cargo(405, 1)]).stable).toBe(false);
  });

  it('keeps intact width, height, mass and offset on a non-perfect accepted landing', () => {
    const run = new TowerRun(); run.start();
    const original = landAt(run, () => 320);
    expect(run.snapshot()).toMatchObject({ floors: 1, perfectCount: 0, combo: 0, precisionScore: 0, alive: true });
    const accepted = run.inspection().stack[0];
    expect(accepted).toMatchObject({ width: original.width, height: original.height, mass: original.mass });
    expect(accepted.x).toBeCloseTo(320, 0);
    expect(accepted.x).not.toBe(300);
    expect(run.snapshot().height).toBeCloseTo(original.height / 60);
    expect(run.inspection().recentlyAccepted!.overlapRatio).toBeLessThan(1);
  });

  it('keeps the smallest physical margin separate from the normalized weakest-joint signal', () => {
    const report = evaluateTowerStability([cargo(380, 100, 200), cargo(380, 1, 20)]);
    expect(report.stable).toBe(true);
    expect(report.minMargin).toBe(10);
    expect(report.weakJointIndex).toBe(0);
    expect(report.support).toEqual({ left: 280, right: 405 });
    expect(report.loadCenter).toBe(380);
    expect(report.instability).toBeCloseTo(1 - 29 / 62.5);
  });

  it('the first three extreme alternating releases survive using real support geometry', () => {
    const run = new TowerRun(); run.start();
    for (const x of [337.7, 262.3, 337.7]) {
      landAt(run, () => x, 0.6);
      expect(run.alive).toBe(true);
      expect(evaluateTowerStability(run.inspection().stack).stable).toBe(true);
    }
    expect(run.snapshot().floors).toBe(3);
  });

  it('counts accepted floors only and separates perfect combo bonus from floor score', () => {
    const events: TowerEvent[] = []; const run = new TowerRun(event => events.push(event)); run.start();
    expect(run.drop()).toBe(true);
    expect(run.snapshot()).toMatchObject({ floors: 0, phase: 'falling', perfectCount: 0 });
    until(run, () => run.phase === 'settling', 3);
    expect(run.snapshot()).toMatchObject({ floors: 1, perfectCount: 1, combo: 1, precisionScore: 100 });
    landAt(run, () => run.topCenter);
    expect(run.snapshot()).toMatchObject({ floors: 2, perfectCount: 2, combo: 2, precisionScore: 300 });
    landAt(run, () => run.topCenter + 15);
    expect(run.snapshot()).toMatchObject({ floors: 3, perfectCount: 2, combo: 0, maxCombo: 2, precisionScore: 300 });
    expect(events.filter(event => event.type === 'land')).toHaveLength(3);
  });

  it('rejects repeat releases throughout flight/settle without queuing a future drop', () => {
    const events: TowerEvent[] = []; const run = new TowerRun(event => events.push(event)); run.start(); run.drop();
    for (let n = 0; n < 80; n++) { expect(run.drop()).toBe(false); run.step(1 / 120); }
    until(run, () => run.phase === 'settling', 3);
    for (let n = 0; n < 20; n++) { expect(run.drop()).toBe(false); run.step(1 / 120); }
    until(run, () => run.phase === 'hanging', 2);
    run.step(0.05);
    expect(run.phase).toBe('hanging');
    expect(events.filter(event => event.type === 'release')).toHaveLength(1);
  });

  it('five safe timing policies grow 60 full-size floors with bounded drift and stable mass support', () => {
    for (const seed of [1, 17, 77, 12345, 4294967295]) {
      const run = new TowerRun(() => {}, seeded(seed)); run.start();
      let accumulatedHeight = 0;
      for (let floor = 0; floor < 60; floor++) {
        const original = landAt(run, () => run.topCenter);
        accumulatedHeight += original.height;
        const inspect = run.inspection();
        expect(inspect.alive, `seed ${seed}, floor ${floor}`).toBe(true);
        expect(inspect.floors).toBe(floor + 1);
        expect(inspect.stack).toHaveLength(floor + 1);
        expect(inspect.stack.at(-1)).toMatchObject({ width: original.width, height: original.height, mass: original.mass });
        expect(evaluateTowerStability(inspect.stack).stable).toBe(true);
        expect(inspect.height).toBeCloseTo(accumulatedHeight / 60, 8);
        expect(Math.abs(inspect.stack.at(-1)!.x - original.x)).toBeLessThan(3);
      }
    }
    expect(swingSpeed(10_000)).toBeLessThanOrEqual(1.22);
    expect(swingAmplitude(10_000)).toBeLessThanOrEqual(155);
  }, 15_000);

  it('bad release ends once, does not count failed cargo, and reset or copied diagnostics cannot mutate a run', () => {
    const events: TowerEvent[] = []; const run = new TowerRun(event => events.push(event)); run.start();
    for (let n = 0; n < 3; n++) landAt(run, () => run.topCenter);
    until(run, () => run.phase === 'hanging');
    until(run, () => run.cargo!.x > 410);
    run.drop(); until(run, () => !run.alive, 4);
    expect(run.snapshot()).toMatchObject({ floors: 3, alive: false, phase: 'ended', outcome: 'fall' });
    const result = run.result()!; result.floors = 999;
    expect(run.result()!.floors).toBe(3);
    run.step(0.05); run.drop();
    expect(events.filter(event => event.type === 'collapse')).toHaveLength(1);
    run.start(); const copy = run.inspection(); copy.cargo!.x = -999; copy.foundation.x = -999;
    expect(run.inspection().cargo!.x).toBe(300);
    expect(run.inspection().foundation.x).toBe(300);
    run.step(NaN); run.step(Infinity); run.step(-1);
    expect(run.time).toBe(0);
    run.step(10); expect(run.time).toBeCloseTo(0.05, 8);
    run.reset(); expect(run.snapshot()).toMatchObject({ floors: 0, alive: false, outcome: null });
    expect(events.filter(event => event.type === 'collapse')).toHaveLength(1);
  });

  it('an unstable arriving cargo tips and fully falls before ending; older loaded joints collapse the tower', () => {
    const run = new TowerRun(() => {}, () => 0.5); run.start();
    for (let n = 0; n < 3; n++) landAt(run, () => run.topCenter);
    until(run, () => run.phase === 'hanging'); until(run, () => run.cargo!.x > 410); run.drop();
    until(run, () => run.instability === 1, 3);
    expect(run.alive).toBe(true); expect(run.phase).toBe('falling'); expect(run.snapshot().floors).toBe(3);
    until(run, () => Math.abs(run.cargo!.rotation) > 0.2, 1);
    expect(run.alive).toBe(true);
    until(run, () => !run.alive, 3);
    expect(run.result()!.outcome).toBe('fall');
    run.start();
    for (const x of [337, 337, 262, 330, 390, 410, 410]) {
      if (!run.alive) break;
      landAt(run, () => x);
    }
    expect(run.result()!.outcome).toBe('collapse');
    expect(run.snapshot().floors).toBeGreaterThan(3);
    expect(run.snapshot().floors).toBeLessThan(7);
    expect(run.inspection().weakJointIndex).toBeLessThan(run.stack.length);
  });
});
