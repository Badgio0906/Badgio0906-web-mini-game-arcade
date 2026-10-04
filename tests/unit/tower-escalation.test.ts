import { describe, expect, it } from 'vitest';
import { TowerRun, swingAmplitude, swingSpeed } from '../../src/games/game003/TowerRun';
import type { TowerEvent } from '../../src/games/game003/contracts';

const fixedCargo = () => 1 / 7; // Existing cargo arithmetic makes later cargo39px high: floor23 totals900px /15m.
function until(run: TowerRun, condition: () => boolean, budget = 20) {
  for (let n = 0; n < budget * 240 && !condition() && run.alive; n++) run.step(1 / 240);
  expect(condition(), JSON.stringify(run.snapshot())).toBe(true);
}
function perfect(run: TowerRun) {
  until(run, () => run.phase === 'hanging');
  until(run, () => Math.abs(run.landingProjection() - run.topCenter) < .25);
  expect(run.drop()).toBe(true);
  until(run, () => run.phase === 'settling' || !run.alive, 3);
  expect(run.alive).toBe(true);
  expect(run.inspection().recentlyAccepted?.perfect).toBe(true);
}
function offer(events: TowerEvent[] = []) {
  const run = new TowerRun(event => events.push(event), fixedCargo); run.start();
  for (let n = 0; n < 40 && !run.snapshot().pending; n++) perfect(run);
  expect(run.snapshot().pending).toBe('height15');
  return run;
}

describe('Tower once-only15m choice', () => {
  it('uses accepted height strictly above15m; exact15m does not offer', () => {
    const run = new TowerRun(() => {}, fixedCargo); run.start();
    for (let n = 0; n < 23; n++) perfect(run);
    expect(run.snapshot()).toMatchObject({ floors: 23, height: 15, pending: null });
    perfect(run);
    expect(run.snapshot()).toMatchObject({ floors: 24, height: 15.65, pending: 'height15', alive: true, mode: 'normal' });
    expect(run.result()).toBeNull();
  });

  it('freezes the entire accepted scene and clock; selecting normal cannot queue a future release or repeat the offer', () => {
    const events: TowerEvent[] = []; const run = offer(events); const before = run.inspection();
    for (let n = 0; n < 100; n++) { run.step(.05); expect(run.drop()).toBe(false); }
    expect(run.inspection()).toEqual(before); expect(run.result()).toBeNull();
    expect(run.choose('normal')).toBe(true); expect(run.choose('challenge')).toBe(false);
    expect(run.snapshot()).toMatchObject({ pending: null, cMode: false, speedMultiplier: 1, perfectMultiplier: 1 });
    for (let n = 0; n < 8; n++) { perfect(run); expect(run.snapshot().pending).toBeNull(); }
    until(run, () => run.phase === 'hanging', 2);
    run.step(.05); expect(run.phase).toBe('hanging');
    expect(events.filter(event => event.type === 'milestone')).toEqual([{ type: 'milestone', milestone: 'height15' }]);
    expect(events.filter(event => event.type === 'choice')).toEqual([{ type: 'choice', milestone: 'height15', choice: 'normal' }]);
  });

  it('C mode latches, keeps previously earned bonus and triples only future ordinary Perfect awards', () => {
    const events: TowerEvent[] = []; const run = offer(events); const before = run.snapshot();
    const previousPerfects = events.filter(event => event.type === 'perfect').length;
    expect(run.choose('challenge')).toBe(true);
    expect(run.snapshot()).toMatchObject({ cMode: true, mode: 'challenge', speedMultiplier: 2, perfectMultiplier: 3, precisionScore: before.precisionScore });
    expect(run.choose('normal')).toBe(false);
    perfect(run);
    expect(run.snapshot().precisionScore - before.precisionScore).toBe(2400);
    expect(events.filter(event => event.type === 'perfect')).toHaveLength(previousPerfects + 1);
    const latest = events.filter(event => event.type === 'perfect').at(-1);
    expect(latest).toMatchObject({ type: 'perfect', points: 2400 });
    expect(run.snapshot().pending).toBeNull();
    run.start();
    expect(run.snapshot()).toMatchObject({ floors: 0, height: 0, pending: null, cMode: false, mode: 'normal', speedMultiplier: 1, perfectMultiplier: 1, precisionScore: 0 });
  });

  it('doubles hanger angular velocity while preserving real-time counting, full cargo geometry and vertical gravity', () => {
    const normal = offer(); const challenge = offer();
    expect(normal.inspection()).toEqual(challenge.inspection());
    normal.choose('normal'); challenge.choose('challenge');
    until(normal, () => normal.phase === 'hanging', 2); until(challenge, () => challenge.phase === 'hanging', 2);
    const a = normal.inspection(); const b = challenge.inspection();
    expect(b.cargo).toMatchObject({ id: a.cargo!.id, width: a.cargo!.width, height: a.cargo!.height, mass: a.cargo!.mass, y: a.cargo!.y });
    const amplitude = swingAmplitude(a.floors); const speed = swingSpeed(a.floors);
    const angle = (run: TowerRun, multiplier: number) => {
      const body = run.inspection().cargo!;
      return Math.atan2((body.x - 300) / amplitude, body.vx / (amplitude * speed * multiplier));
    };
    const oldA = angle(normal, 1); const oldB = angle(challenge, 2); const timeA = normal.time; const timeB = challenge.time;
    normal.step(.025); challenge.step(.025);
    const delta = (value: number) => Math.atan2(Math.sin(value), Math.cos(value));
    expect(delta(angle(challenge, 2) - oldB)).toBeCloseTo(2 * delta(angle(normal, 1) - oldA), 8);
    expect(normal.time - timeA).toBeCloseTo(.025, 9); expect(challenge.time - timeB).toBeCloseTo(.025, 9);
    normal.drop(); challenge.drop();
    const flightA = normal.inspection().cargo!; const flightB = challenge.inspection().cargo!;
    normal.step(.025); challenge.step(.025);
    expect(challenge.inspection().cargo!.y - flightB.y).toBeCloseTo(normal.inspection().cargo!.y - flightA.y, 8);
    expect(challenge.inspection().cargo!.vy).toBeCloseTo(normal.inspection().cargo!.vy, 8);
  });
});
