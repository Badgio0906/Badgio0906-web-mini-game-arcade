import { describe, expect, it } from 'vitest';
import { CHARGE_SECONDS, FireworkRun, MAX_PARTICLES, RUN_SECONDS, targetAt, type FireworkEvent } from '../../src/games/game033/FireworkRun';
const advance = (run: FireworkRun, seconds: number): void => { for (let remaining = seconds; remaining > 1e-9; remaining -= .02) run.step(Math.min(.02, remaining)); };
function shot(run: FireworkRun, power: number): void { expect(run.press()).toBe(true); advance(run, power * CHARGE_SECONDS); expect(run.release()).toBe(true); }
function finishShot(run: FireworkRun): void { for (let i = 0; i < 100 && run.snapshot().rockets.length; i++) run.step(.02); }

describe('Game033 height release, chain and bounded simulation', () => {
  it('press/release selects real bloom altitude; maximum charge does not solve a low target', () => {
    const run = new FireworkRun(); run.start(); expect(run.snapshot().target).toEqual(targetAt(0));
    shot(run, .35); finishShot(run); expect(run.snapshot()).toMatchObject({ successes: 1, combo: 1 }); expect(run.snapshot().blooms[0].quality).toBe('perfect');
    shot(run, 1.7); expect(run.snapshot().rockets[0].bloomY).toBe(120); finishShot(run);
    expect(run.snapshot().blooms.at(-1)?.quality).toBe('miss'); expect(run.snapshot().combo).toBe(0);
  });
  it('a four-flower rhythm earns actual overlap chains and a special pattern', () => {
    const events: FireworkEvent[] = [], run = new FireworkRun(e => events.push(e), () => .5); run.start();
    for (let i = 0; i < 4; i++) shot(run, run.snapshot().target.power);
    finishShot(run); const s = run.snapshot();
    expect(s.successes).toBe(4); expect(s.combo).toBe(4); expect(s.maxChain).toBeGreaterThanOrEqual(2);
    expect(events.filter(e => e.type === 'bloom' && e.bloom.special)).toHaveLength(1);
    expect(s.score).toBeGreaterThan(4 * 240);
  });
  it('finishes once after 100 active seconds, accepts final in-flight blooms and resets held state', () => {
    const events: FireworkEvent[] = [], run = new FireworkRun(e => events.push(e)); run.start(); advance(run, RUN_SECONDS - 1.2);
    shot(run, .35); expect(run.snapshot().rockets).toHaveLength(1); advance(run, 2);
    expect(run.snapshot().phase).toBe('ended'); expect(run.snapshot().result).toMatchObject({ successes: 1, launches: 1 });
    expect(events.filter(e => e.type === 'end')).toHaveLength(1); const ended = run.snapshot(); advance(run, 2); expect(run.snapshot()).toEqual(ended);
    run.start(); expect(run.snapshot()).toMatchObject({ time: 0, score: 0, holding: false, combo: 0, result: null });
  });
  it('untimed practice stays independent and denied/paused/cancelled inputs never release a rocket', () => {
    const run = new FireworkRun(); expect(run.press()).toBe(false); run.start(true); advance(run, 130); expect(run.snapshot().phase).toBe('playing');
    run.press(); advance(run, .5); run.cancelCharge(); expect(run.release()).toBe(false); expect(run.snapshot().rockets).toHaveLength(0);
    const paused = run.snapshot(); run.snapshot(); expect(run.snapshot()).toEqual(paused);
    for (const dt of [Infinity, NaN, 0, -1]) run.step(dt); expect(run.snapshot()).toEqual(paused);
    run.step(30); expect(run.snapshot().time - paused.time).toBeCloseTo(.05);
    run.reset(); expect(run.snapshot().phase).toBe('ready');
  });
  it('caps particles and rockets under rapid repeated launches and snapshots cannot mutate the model', () => {
    const run = new FireworkRun(() => {}, () => .5); run.start(true);
    for (let i = 0; i < 2500; i++) { run.press(); run.release(); run.step(.02); const s = run.snapshot(); expect(s.particles.length).toBeLessThanOrEqual(MAX_PARTICLES); expect(s.rockets.length).toBeLessThanOrEqual(6); }
    const s = run.snapshot(); s.target.y = -1; if (s.particles[0]) s.particles[0].life = 999;
    expect(run.snapshot().target.y).toBeGreaterThan(0); expect(run.snapshot().particles.every(p => p.life < 3)).toBe(true);
  });
});
