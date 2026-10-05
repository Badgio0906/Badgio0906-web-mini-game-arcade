import { describe, expect, it } from 'vitest';
import { FrogRun } from '../../src/games/game019/FrogRun';
import { createLevel } from '../../src/games/game019/generation';
import { JUMPS, type Direction, type FrogEvent, type JumpSize } from '../../src/games/game019/types';

const sizes: JumpSize[] = ['small', 'medium', 'large'];
const directions: Direction[] = [-1, 0, 1];
function finishJump(run: FrogRun): void {
  for (let frame = 0; frame < 2400 && run.alive && !run.player.grounded; frame++) run.update(1 / 120);
}
function climb(seed: number): { run: FrogRun; events: FrogEvent[]; choices: { size: JumpSize; direction: Direction }[] } {
  const events: FrogEvent[] = []; const run = new FrogRun(event => events.push(event)); run.start(seed);
  const choices: { size: JumpSize; direction: Direction }[] = [];
  for (let jump = 0; jump < 120 && run.alive; jump++) {
    const forecasts = sizes.flatMap(size => directions.map(direction => run.forecast(size, direction)));
    forecasts.sort((a, b) => Number(b.cleared || b.milestone) - Number(a.cleared || a.milestone) || (b.landing?.y ?? -1) - (a.landing?.y ?? -1));
    const best = forecasts[0];
    if (!best.cleared && !best.milestone && (!best.landing || best.landing.y <= run.player.y)) throw new Error(`No upward route: seed ${seed}, y ${run.player.y}, x ${run.player.x}, forecasts ${JSON.stringify(forecasts.map(f => [f.size, f.direction, f.landing]))}`);
    expect(run.jump(best.size, best.direction)).toBe(true); choices.push({ size: best.size, direction: best.direction }); finishJump(run);
  }
  return { run, events, choices };
}
describe('Game019 precision frog ascent', () => {
  it.each([1, 2, 7, 12])('ordinary public jump inputs reach both chapters and space under wind seed %i', seed => {
    const { run, events, choices } = climb(seed);
    expect(run.cleared).toBe(true); expect(run.maxHeight).toBe(200); expect(run.chapter).toBe('space');
    expect(events.filter(event => event.type === 'milestone')).toHaveLength(1);
    expect(events.filter(event => event.type === 'sky')).toHaveLength(1);
    expect(events.filter(event => event.type === 'clear')).toHaveLength(1);
    expect(choices.length).toBeLessThan(80);
    expect(new Set(choices.map(choice => choice.direction)).size).toBeGreaterThan(1);
  });
  it('small is low repositioning, medium and large have distinct useful ascent', () => {
    const peaks: number[] = []; const shifts: number[] = [];
    for (const size of sizes) { const run = new FrogRun(); run.startPractice(0); run.jump(size, 1); finishJump(run); peaks.push(run.maxHeight); shifts.push(run.player.x - 180); }
    expect(peaks[0]).toBeCloseTo(JUMPS.small.height / 10, 1); expect(peaks[1]).toBeCloseTo(5, 1); expect(peaks[2]).toBeCloseTo(9, 1);
    expect(shifts[0]).toBeGreaterThan(20); expect(shifts[0]).toBeLessThan(35); expect(shifts[1]).toBeGreaterThan(shifts[0]);
  });
  it('launch direction is fixed in the air and inputs reject invalid sizes/directions', () => {
    const run = new FrogRun(); run.start(); expect(run.jump('medium', -1)).toBe(true);
    expect(run.jump('large', 1)).toBe(false); expect(run.player.vx).toBe(-104);
    finishJump(run); expect(run.jump('invalid' as JumpSize, 0)).toBe(false); expect(run.jump('medium', 2 as Direction)).toBe(false);
  });
  it('forecast is side-effect free, follows the exact physics, and snapshots are detached', () => {
    const events: FrogEvent[] = []; const run = new FrogRun(event => events.push(event)); run.start(); const before = run.snapshot();
    const forecast = run.forecast('medium', -1); expect(run.snapshot()).toEqual(before); expect(events).toHaveLength(0);
    run.jump('medium', -1); finishJump(run); expect(run.player.x).toBeCloseTo(forecast.landing!.x, 6); expect(run.player.y).toBe(forecast.landing!.y);
    const snapshot = run.snapshot(); snapshot.player.x = -100; snapshot.platforms[0].active = false; snapshot.wind[0].x = 999;
    expect(run.player.x).not.toBe(-100); expect(run.snapshot().platforms[0].active).toBe(true); expect(run.snapshot().wind[0].x).not.toBe(999);
  });
  it('invalid time does not advance and no-caller-update pauses everything', () => {
    const run = new FrogRun(); run.start(); run.jump('large', 1); const before = run.snapshot();
    for (const dt of [NaN, Infinity, -1, 0]) run.update(dt); expect(run.snapshot()).toEqual(before);
    run.update(500); expect(run.time).toBeCloseTo(.1, 6); expect(run.player.y).toBeLessThan(30);
    run.quit(); const after = run.snapshot(); run.update(1); expect(run.snapshot()).toEqual(after); expect(run.jump('small', 0)).toBe(false);
  });
  it('practice stages teach actual landing and never emit the story/clear events', () => {
    for (let stage = 0; stage < 4; stage++) {
      const events: FrogEvent[] = []; const run = new FrogRun(event => events.push(event)); run.startPractice(stage);
      const start = run.height; run.jump(stage === 0 ? 'small' : stage === 2 ? 'large' : 'medium', stage === 2 ? 1 : -1); finishJump(run);
      expect(run.player.grounded).toBe(true); expect(run.snapshot().practice).toBe(true);
      if (stage === 1) expect(run.height - start).toBeGreaterThan(1);
      if (stage === 2) expect(run.height - start).toBeGreaterThan(5);
      if (stage === 3) expect(run.snapshot().activeWind).not.toBeNull();
      expect(events.filter(e => ['milestone', 'sky', 'clear'].includes(e.type))).toHaveLength(0);
    }
  });
  it('levels have narrow choices, moss, crumbling detours, solid interference and forecast winds', () => {
    const level = createLevel(1); expect(level.platforms.some(p => p.type === 'moss' && p.slide !== 0)).toBe(true); expect(level.platforms.some(p => p.type === 'crumble')).toBe(true);
    expect(level.obstacles.some(o => o.type === 'ceiling')).toBe(true); expect(level.obstacles.some(o => o.type === 'wall')).toBe(true);
    expect(level.wind.some(w => w.x > 30)).toBe(true); expect(level.wind.some(w => w.x < -30)).toBe(true); expect(level.wind.some(w => w.y > 0)).toBe(true); expect(level.wind.some(w => w.y < 0)).toBe(true);
    expect(createLevel(1)).toEqual(level); expect(createLevel(2).platforms).toEqual(level.platforms);
  });
  it('a bad landing loses height with a comical drop and permits immediate retry', () => {
    const events: FrogEvent[] = []; const run = new FrogRun(event => events.push(event)); run.start();
    for (let i = 0; i < 10 && run.height < 30; i++) {
      const best = sizes.flatMap(size => directions.map(direction => run.forecast(size, direction))).filter(f => f.landing).sort((a, b) => b.landing!.y - a.landing!.y)[0];
      run.jump(best.size, best.direction); finishJump(run);
    }
    const height = run.height; const record = run.maxHeight;
    const bad = sizes.flatMap(size => directions.map(direction => run.forecast(size, direction))).filter(f => f.landing && f.landing.y < run.player.y - 100).sort((a, b) => a.landing!.y - b.landing!.y)[0];
    expect(bad).toBeDefined(); run.jump(bad.size, bad.direction); finishJump(run);
    expect(run.height).toBeLessThan(height - 10); expect(run.maxHeight).toBeGreaterThanOrEqual(record); expect(run.alive).toBe(true);
    expect(events.some(event => event.type === 'fall' && event.drop > 10)).toBe(true); expect(run.jump('medium', 0)).toBe(true);
  });
  it('restarts always return to the well bottom and model memory remains bounded', () => {
    const { run } = climb(1); run.start(2); expect(run.height).toBe(0); expect(run.maxHeight).toBe(0); expect(run.milestoneSeen).toBe(false); expect(run.cleared).toBe(false);
    const count = run.snapshot().platforms.length;
    for (let i = 0; i < 1000; i++) run.update(.1);
    expect(run.snapshot().platforms).toHaveLength(count); expect(count).toBeLessThan(90); expect(run.forecast('large', 1).points.length).toBeLessThanOrEqual(151);
  });
  it('a small reposition can access a narrow crumbling shortcut; it collapses and recovers', () => {
    const run = new FrogRun(); run.start();
    for (const [size, direction] of [['medium', -1], ['medium', 1], ['small', 1], ['large', -1]] as [JumpSize, Direction][]) { expect(run.jump(size, direction)).toBe(true); finishJump(run); }
    const id = run.player.platformId!; const ledge = run.snapshot().platforms.find(p => p.id === id)!;
    expect(ledge.type).toBe('crumble'); expect(ledge.y).toBe(129);
    for (let i = 0; i < 100; i++) run.update(.01);
    expect(run.snapshot().platforms.find(p => p.id === id)!.active).toBe(false); expect(run.player.grounded).toBe(false);
    for (let i = 0; i < 350; i++) run.update(.01);
    expect(run.snapshot().platforms.find(p => p.id === id)!.active).toBe(true); expect(run.alive).toBe(true);
  });
});
