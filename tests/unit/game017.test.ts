import { describe, expect, it } from 'vitest';
import { project, unproject, VIEW } from '../../src/games/game017/RainBoard';
import { RainRun } from '../../src/games/game017/RainRun';
import { createScene, findSafeRoute, practiceScene, rainCandidate, randomFrom } from '../../src/games/game017/generation';
import { circleEntry, segmentDistance } from '../../src/games/game017/geometry';
import { START, GOAL, PLAYER_RADIUS, type Rain, type RainEvent, type Point } from '../../src/games/game017/types';
const drop = (dangerous = true, z = 300, radius = 24): Rain => ({ id: 0, x: 500, z, height: 90, fallSpeed: 100, timeToImpact: dangerous ? .9 : 3, impact: { x: 500, z }, radius, dangerous });
function planning(practice = false, events: RainEvent[] = []) {
  const run = new RainRun(e => events.push(e)); run.start(0, 1, practice); run.settle(1050); run.activate(1100); run.settle(1650); return run;
}
function draw(run: RainRun, path: Point[], at = 1700) { expect(run.append(path[0], at, true)).toBe(true); for (const p of path.slice(1)) run.append(p, at); }
function finish(run: RainRun) { run.settle(2250); run.settle(3650); }
describe('RAINSHIFT phase and clock contracts', () => {
  it('rejects early acceleration and opens a generous rain input window', () => {
    const run = new RainRun(); run.start(0); expect(run.activate(200)).toBe(false); run.settle(1050); expect(run.phase).toBe('rain'); expect(run.activate(3200)).toBe(true);
  });
  it('starts the full five seconds only once the .55s camera rotation completes', () => {
    const run = new RainRun(); run.start(0); run.settle(1050); run.activate(1100); run.settle(1400);
    expect(run.camera).toBeGreaterThan(0); expect(run.camera).toBeLessThan(1); expect(run.remaining()).toBeNull();
    run.settle(1650); expect(run.remaining(1650)).toBe(5); expect(run.camera).toBe(1);
  });
  it('does not steal planning time after a delayed camera-completion frame', () => {
    const run = new RainRun(); run.start(0); run.settle(1050); run.activate(1100); run.settle(2300); expect(run.phase).toBe('plan'); expect(run.remaining(2300)).toBe(5);
  });
  it('freezes the planning deadline during an explicit pause', () => {
    const run = planning(); run.pause(true, 2000); const before = run.snapshot(2000); run.settle(9000); expect(run.snapshot(9000).remaining).toBe(before.remaining); run.pause(false, 10000);
    expect(run.remaining(10000)).toBeCloseTo(4.65); run.settle(14649); expect(run.phase).toBe('plan'); run.settle(14650); expect(run.phase).toBe('lower');
  });
  it('rejects route writes at the exact deadline and runs an incomplete route visibly before ending', () => {
    const run = planning(); run.append(START, 1700, true); run.append({ x: 130, z: 300 }, 1700);
    expect(run.append(GOAL, 6650)).toBe(false); expect(run.phase).toBe('lower'); run.settle(7200); run.settle(8600); expect(run.result?.reason).toBe('unfinished');
  });
  it('reports a single missed-activation end without collision during transitions', () => {
    const events: RainEvent[] = [], run = new RainRun(e => events.push(e)); run.start(0); run.settle(1050); run.settle(4530); run.settle(9000);
    expect(events.filter(e => e.type === 'end')).toHaveLength(1); expect(run.result?.reason).toBe('activation');
  });
});
describe('continuous route and rain geometry', () => {
  it('accepts the visible goal area despite touch quantization, rejects points outside it', () => {
    const run = planning(); run.scene.rain = []; draw(run, [START, { x: 929.99995, z: 300.00005 }]); finish(run); expect(run.phase).toBe('clear');
    const outside = planning(); outside.append({ x: 930, z: 366 }, 1700); expect(outside.phase).toBe('plan');
  });
  it('keeps rain time and trailing images on the actual arc when the route backtracks', () => {
    const run = planning(); run.scene.rain = []; draw(run, [START, { x: 700, z: 150 }, { x: 300, z: 150 }, GOAL]); run.settle(2250); run.settle(3000);
    expect(run.dashTime).toBeCloseTo(.75); const trailing = run.trailingPosition(30);
    expect(trailing.z).toBe(150); expect(trailing.x).toBeGreaterThan(run.position.x);
    run.pause(true, 3000); run.settle(8000); expect(run.dashTime).toBeCloseTo(.75);
  });
  it('requires the start/tail rather than accepting disconnected drawing', () => {
    const run = planning(); expect(run.append({ x: 500, z: 300 }, 1700, true)).toBe(false); expect(run.route).toHaveLength(1);
    expect(run.append(START, 1700, true)).toBe(true); run.append({ x: 170, z: 300 }, 1700);
    expect(run.append(START, 1700, true)).toBe(false); expect(run.append({ x: 170, z: 300 }, 1700, true)).toBe(true);
  });
  it('resets a line without resetting the planning clock', () => {
    const run = planning(); run.append({ x: 200, z: 200 }, 1900); const time = run.remaining(1900); run.resetRoute(1900); expect(run.route).toEqual([START]); expect(run.remaining(1900)).toBe(time);
  });
  it('detects a circle entry even when neither endpoint is inside, including tangency', () => {
    expect(circleEntry({ x: 0, z: 0 }, { x: 100, z: 0 }, { x: 50, z: 0 }, 10)).toBe(.4);
    expect(circleEntry({ x: 0, z: 10 }, { x: 100, z: 10 }, { x: 50, z: 0 }, 10)).toBe(.5);
    expect(circleEntry({ x: 0, z: 11 }, { x: 100, z: 11 }, { x: 50, z: 0 }, 10)).toBeNull();
  });
  it('sweeps an entire dash after a delayed frame rather than tunnelling through a raindrop', () => {
    const run = planning(); run.scene.rain = [drop()]; draw(run, [START, GOAL]); finish(run);
    expect(run.result?.reason).toBe('rain'); expect(run.position.x).toBeCloseTo(500 - 24 - PLAYER_RADIUS); expect(run.score).toBe(0);
  });
  it('follows all bends instead of colliding against a straight shortcut', () => {
    const run = planning(); run.scene.rain = [drop()]; draw(run, [START, { x: 300, z: 150 }, { x: 700, z: 150 }, GOAL]); finish(run);
    expect(run.phase).toBe('clear'); expect(run.score).toBe(1000); expect(run.position).toEqual(GOAL);
  });
  it('ignores high rain that cannot arrive within this dash', () => {
    const run = planning(); run.scene.rain = [drop(false)]; draw(run, [START, GOAL]); finish(run); expect(run.phase).toBe('clear'); expect(run.score).toBe(1000);
  });
  it('awards CLOSE CALL only outside the actual collision radius', () => {
    const run = planning(); run.scene.rain = [drop(true, 337)]; draw(run, [START, GOAL]); finish(run); expect(run.score).toBe(1300); expect(run.closeCalls).toBe(1);
    const wet = planning(); wet.scene.rain = [drop(true, 332)]; draw(wet, [START, GOAL]); finish(wet); expect(wet.result?.reason).toBe('rain'); expect(wet.score).toBe(0);
  });
  it('never awards a clear twice, then escalates and resets on a new run', () => {
    const run = planning(); run.scene.rain = []; draw(run, [START, GOAL]); finish(run); run.settle(3700); expect(run.score).toBe(1000); run.settle(4850); expect(run.round).toBe(2);
    run.settle(5900); run.activate(5950); run.settle(6500); run.scene.rain = []; draw(run, [START, GOAL], 6550); run.settle(7100); run.settle(8500); expect(run.score).toBe(2200);
    run.start(9000); expect(run.score).toBe(0); expect(run.streak).toBe(0); expect(run.round).toBe(1);
  });
  it('keeps practice score zero, recovers at planning after a collision and can complete', () => {
    const run = planning(true); run.scene.rain = [drop()]; draw(run, [START, GOAL]); finish(run); expect(run.score).toBe(0); run.retryPractice(4000); expect(run.remaining(4000)).toBe(5);
    draw(run, [START, { x: 300, z: 150 }, { x: 700, z: 150 }, GOAL], 4050); run.settle(4600); run.settle(6000); expect(run.phase).toBe('clear'); expect(run.score).toBe(0);
  });
});
describe('playable layout generator', () => {
  it('independently checks every returned segment over early, wind, large-rain and saturated rounds', () => {
    for (const round of [1, 2, 4, 6, 12, 40]) for (let seed = 1; seed <= 30; seed++) {
      const scene = createScene(round, seed);
      expect(scene.safeRoute[0]).toEqual(START); expect(scene.safeRoute.at(-1)).toEqual(GOAL);
      for (const rain of scene.rain) if (rain.dangerous) for (let i = 1; i < scene.safeRoute.length; i++)
        expect(segmentDistance(scene.safeRoute[i - 1], scene.safeRoute[i], rain.impact)).toBeGreaterThan(rain.radius + PLAYER_RADIUS + 12);
      expect(scene.rain.length).toBeLessThanOrEqual(42);
    }
  });
  it('rejects an impossible barrier and regenerates a candidate rather than accepting it', () => {
    let calls = 0;
    const scene = createScene(1, 1, () => ++calls === 1 ? [drop(true, 300, 400)] : []);
    expect(calls).toBe(2); expect(scene.rejected).toBe(1); expect(findSafeRoute([drop(true, 300, 400)])).toBeNull(); expect(scene.safeRoute.at(-1)).toEqual(GOAL);
  });
  it('has a bounded fallback that is itself validated after repeated rejection', () => {
    const scene = createScene(10, 1, () => [drop(true, 300, 400)]);
    expect(scene.rejected).toBe(24); expect(scene.fallback).toBe(true); expect(findSafeRoute(scene.rain)).not.toBeNull();
  });
  it('makes wind and impact forecasts deterministic and introduces large drops only later', () => {
    expect(createScene(4, 80)).toEqual(createScene(4, 80));
    expect(createScene(1, 1).wind).toEqual({ x: 0, z: 0 }); expect(createScene(4, 1).wind).not.toEqual({ x: 0, z: 0 });
    const rain = rainCandidate(6, randomFrom(1), { x: 5, z: 10 }); expect(rain[0].radius).toBe(27);
    for (const r of rain) { expect(r.x + 5 * r.timeToImpact).toBeCloseTo(r.impact.x); expect(r.z + 10 * r.timeToImpact).toBeCloseTo(r.impact.z); }
    expect(practiceScene().safeRoute.at(-1)).toEqual(GOAL);
  });
});

describe('responsive shared projection', () => {
  it('inverts the rendered top-down positions at desktop and tall phone sizes', () => {
    const initial = VIEW.height;
    try { for (const height of [620, 1450]) { VIEW.height = height; for (const p of [START, GOAL, { x: 500, z: 40 }, { x: 500, z: 560 }]) { const q = project(p, 0, 1), inverse = unproject(q.x, q.y); expect(inverse.x).toBeCloseTo(p.x); expect(inverse.z).toBeCloseTo(p.z); } } } finally { VIEW.height = initial; }
  });
  it('uses exactly the same projected footprint extent as the effective collision circle', () => {
    const initial = VIEW.height;
    try { for (const height of [620, 1450]) { VIEW.height = height; const center = project({ x: 500, z: 300 }, 0, 1), radius = 24 + PLAYER_RADIUS; const right = project({ x: 500 + radius, z: 300 }, 0, 1), lower = project({ x: 500, z: 300 + radius }, 0, 1); expect(right.x - center.x).toBeCloseTo(radius * .884); expect(lower.y - center.y).toBeCloseTo(radius * (height - 212) / 600); } } finally { VIEW.height = initial; }
  });
});
