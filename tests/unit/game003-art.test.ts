import { describe, expect, it } from 'vitest';
import { TowerRun, evaluateTowerStability, cargoMass, artPairPoints } from '../../src/games/game003/TowerRun';
import type { CargoPose, TowerEvent } from '../../src/games/game003/contracts';
const box = (x: number, mass = 60, width = 176): CargoPose => ({ id: 0, x, y: 0, width, height: 40, mass, vx: 0, vy: 0, rotation: 0 });
function until(r: TowerRun, f: () => boolean, seconds = 24) { for (let n = 0; n < seconds * 240 && !f() && r.alive; n++) { if (r.pending) r.choose('normal'); r.step(1 / 240); } expect(f(), JSON.stringify(r.snapshot())).toBe(true); }
function land(r: TowerRun, x: number) { until(r, () => r.phase === 'hanging'); until(r, () => Math.abs(r.landingProjection() - x) < .4); r.drop(); until(r, () => r.phase === 'settling' || !r.alive, 4); }
describe('Game003 artistic physical balance', () => {
  it('keeps every interface and rejects intermediate failure even if aggregate lies inside foundation', () => {
    const r = evaluateTowerStability([box(260, 1, 100), box(340, 1, 100), box(270, 100, 100)]);
    expect(r.foundationCenter).toBeGreaterThan(195); expect(r.foundationCenter).toBeLessThan(405);
    expect(r.stable).toBe(false); expect(r.interfaces).toHaveLength(3);
    expect(r.interfaces[1].margin).toBeLessThan(-4);
    expect(evaluateTowerStability([box(300), box(500)]).stable).toBe(false);
  });
  it('uses one visible-volume density and retains full geometry for two distinct stable overhang pairs', () => {
    expect(cargoMass(176, 40)).toBe(60); expect(cargoMass(176, 40)).toBe(cargoMass(176, 40));
    for (const route of [[337, 263], [263, 337], [300, 337, 282], [300, 263, 318]]) {
      const r = new TowerRun(() => {}, () => .5); r.start();
      for (const x of route) land(r, x);
      const s = r.inspection(); expect(s.alive).toBe(true); expect(s.artPairs, route.join(',')).toBe(1);
      expect(s.artScore).toBeGreaterThan(300); expect(s.artScore).toBeLessThanOrEqual(360);
      expect(evaluateTowerStability(s.stack).stable).toBe(true);
      expect(s.stack.map(c => c.width)).toEqual(route.map((_, i) => 176 - i * 4));
      expect(s.stack.every(c => c.mass === cargoMass(c.width, c.height) && c.rotation === 0)).toBe(true);
      expect(s.recentArtPair!.recoveryPixels).toBeGreaterThanOrEqual(3);
      expect(s.perfectCount).toBe(route[0] === 300 ? 1 : 0);
      expect(s.bonusScore).toBe(s.artScore + s.precisionScore);
    }
  });
  it('never rewards tiny alternation, waiting, repeat drops or overlapping reuse of the same cargo', () => {
    const events: TowerEvent[] = []; const r = new TowerRun(e => events.push(e), () => .5); r.start();
    for (const x of [300, 305, 300]) land(r, x);
    expect(r.snapshot().artPairs).toBe(0);
    r.start(); for (const x of [337, 263, 337]) land(r, x);
    expect(r.snapshot().artPairs).toBe(1); const before = r.snapshot().artScore;
    for (let i = 0; i < 300; i++) r.step(1 / 240);
    expect(r.snapshot().artScore).toBe(before); expect(events.filter(e => e.type === 'art')).toHaveLength(1);
    const copy = r.inspection(); copy.recentArtPair!.points = 99999; copy.interfaces[0].loadCenter = 99999;
    expect(r.inspection().recentArtPair!.points).toBe(before); expect(r.inspection().interfaces[0].loadCenter).not.toBe(99999);
  });
  it('same-direction overhang fails an actual lower joint, instead of random collapse', () => {
    const events: TowerEvent[] = []; const r = new TowerRun(e => events.push(e), () => .5); r.start();
    for (const x of [300, 300, 300, 337, 385, 416, 417, 418, 420]) { if (r.alive) land(r, x); }
    expect(r.alive).toBe(false); expect(r.result()!.outcome).toBe('collapse');
    expect(r.snapshot().artPairs).toBe(0); expect(events.some(e => e.type === 'support_failure' && e.jointIndex < r.stack.length)).toBe(true);
  });
  it('keeps centered precision combo and applies C mode to art once with bounded streak', () => {
    const r = new TowerRun(() => {}, () => .5); r.start(); land(r, 300); land(r, r.topCenter);
    expect(r.snapshot()).toMatchObject({ precisionScore: 300, artPairs: 0, perfectCount: 2, bonusScore: 300 });
    for (const [a,b,recovery,streak] of [[.2,.3,3,1], [.46,.46,50,999]]) {
      expect(artPairPoints(a,b,recovery,3,streak)).toBe(artPairPoints(a,b,recovery,1,streak) * 3);
      expect(artPairPoints(a,b,recovery,1,streak)).toBeLessThanOrEqual(390);
    }
    r.start(); for (let i = 0; i < 24; i++) land(r, r.topCenter);
    // helper handles normal choices; open next physical mode choice explicitly in a fresh run.
    const c = new TowerRun(() => {}, () => .5); c.start();
    for (let i = 0; i < 40 && !c.pending; i++) land(c, c.topCenter);
    expect(c.pending).toBe('height15'); c.choose('challenge');
    const top = c.topCenter, previous = c.snapshot(); land(c, top + 35); land(c, top - 20);
    expect(c.snapshot().artPairs).toBe(1); const pair = c.inspection().recentArtPair!;
    expect(pair.points).toBe(artPairPoints(pair.firstRatio, pair.secondRatio, pair.recoveryPixels, 1, 1) * 3);
    expect(c.snapshot().precisionScore).toBe(previous.precisionScore);
    expect(c.snapshot()).toMatchObject({ speedMultiplier: 2, perfectMultiplier: 3 });
  });
});
