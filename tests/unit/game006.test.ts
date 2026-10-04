import { describe, expect, it } from 'vitest';
import { ParkingRun, PARKING_TEMPLATES, CAR_WIDTH, CAR_HEIGHT, WHEELBASE, MIN_DISTANCE, MAX_DISTANCE, poseAlongArc, rectangleCorners, containsCar, rectanglesTouch, sweptCarTouches, parkingGrade, scoreParking } from '../../src/games/game006/ParkingRun';
import type { ParkingEvent, ParkingPose } from '../../src/games/game006/contracts';
const shape = (x = 0, y = 0, rotation = 0, width = CAR_WIDTH, height = CAR_HEIGHT): ParkingPose => ({ x, y, rotation, width, height });
function until(run: ParkingRun, condition: () => boolean, dt = 1 / 240, budget = 40) {
  for (let n = 0; n < budget / dt && run.snapshot().alive && !condition(); n++) run.step(dt);
  expect(condition(), JSON.stringify(run.inspection())).toBe(true);
}
/** Solve only the visibly drawn target geometry, then wait on real public gauges. No RNG / locked values / score mutation. */
function controls(run: ParkingRun) {
  const { layout } = run.inspection(); const turn = layout.slot.rotation - layout.start.rotation;
  const curvature = Math.abs(turn) < 1e-9 ? 0 : (Math.cos(layout.start.rotation) - Math.cos(layout.slot.rotation)) / (layout.slot.x - layout.start.x);
  const distance = Math.abs(turn) < 1e-9 ? layout.start.y - layout.slot.y : turn / curvature;
  return { steering: Math.atan(curvature * WHEELBASE) * 180 / Math.PI, power: (distance - MIN_DISTANCE) / (MAX_DISTANCE - MIN_DISTANCE) };
}
function park(run: ParkingRun) {
  until(run, () => run.snapshot().phase === 'angle'); const target = controls(run);
  until(run, () => Math.abs(run.snapshot().steeringDegrees - target.steering) < .02, .0002);
  expect(run.act()).toBe(true);
  until(run, () => Math.abs(run.snapshot().power - target.power) < .0006, .0005);
  expect(run.act()).toBe(true);
  until(run, () => run.snapshot().phase === 'parked' || !run.snapshot().alive, 1 / 240, 3);
  expect(run.snapshot().alive, JSON.stringify(run.result())).toBe(true);
  expect(containsCar(run.inspection().layout.slot, run.snapshot().pose)).toBe(true);
}
function offer(roll = 0, events: ParkingEvent[] = []) {
  const run = new ParkingRun(event => events.push(event), () => roll); run.start();
  for (let n = 0; n < 10; n++) park(run);
  until(run, () => run.snapshot().pending === 'forbidden', 1 / 240, 2);
  return run;
}

describe('PARK IT! geometry and ordinary gauge play', () => {
  it('integrates a genuine quarter circle, retains full vehicle dimensions and checks every rotated corner', () => {
    expect(poseAlongArc(shape(), .01, Math.PI * 50)).toMatchObject({ width: 42, height: 70 });
    const turn = poseAlongArc(shape(), .01, Math.PI * 50);
    expect(turn.x).toBeCloseTo(100); expect(turn.y).toBeCloseTo(-100); expect(turn.rotation).toBeCloseTo(Math.PI / 2);
    const corners = rectangleCorners(shape(0, 0, Math.PI / 2));
    expect(Math.max(...corners.map(p => p.x))).toBeCloseTo(35); expect(Math.max(...corners.map(p => p.y))).toBeCloseTo(21);
    expect(containsCar(shape(), shape())).toBe(true); expect(containsCar(shape(), shape(.01))).toBe(false);
    expect(containsCar(shape(), shape(0, 0, Math.PI / 2))).toBe(false);
    expect(rectanglesTouch(shape(), shape(42))).toBe(true); expect(rectanglesTouch(shape(), shape(42.001))).toBe(false);
    // AABB overlap is insufficient for a tilted car.
    expect(rectanglesTouch(shape(0, 0, Math.PI / 4), shape(39, 39, 0, 1, 1))).toBe(false);
  });

  it('detects thin contact in the curved center sweep even while both endpoint bodies remain clear', () => {
    const start = shape(0, 0, 0, .1, .1); const end = poseAlongArc(start, .01, .4); const mid = poseAlongArc(start, .01, .2);
    const corner = rectangleCorners(mid)[3]; const thin = shape(corner.x, corner.y, 0, .000001, .000001);
    expect(rectanglesTouch(start, thin)).toBe(false); expect(rectanglesTouch(end, thin)).toBe(false);
    expect(rectanglesTouch(mid, thin)).toBe(true); expect(sweptCarTouches(start, end, thin)).toBe(true);
  });

  it('locks steering then power, rejects inputs during motion/settle and reports honest strength errors once', () => {
    const events: ParkingEvent[] = []; const run = new ParkingRun(event => events.push(event));
    expect(run.act()).toBe(false); run.start();
    const initialTime = run.snapshot().time; run.step(NaN); run.step(Infinity); run.step(-1); expect(run.snapshot().time).toBe(initialTime);
    until(run, () => Math.abs(run.snapshot().steeringDegrees) < .02, .0002); expect(run.act()).toBe(true);
    expect(run.snapshot()).toMatchObject({ phase: 'power', lockedPower: null });
    expect(Math.abs(run.snapshot().lockedSteering!)).toBeLessThan(.02);
    expect(run.act()).toBe(true); expect(run.snapshot()).toMatchObject({ phase: 'driving', lockedPower: 0 });
    for (let n = 0; n < 500 && run.snapshot().alive; n++) { expect(run.act()).toBe(false); run.step(1 / 240); }
    expect(run.result()).toMatchObject({ outcome: 'outside', parked: 0, score: 0 }); expect(run.result()!.reason).toContain('足りず');
    expect(events.filter(event => event.type === 'failure')).toHaveLength(1);
    const result = run.result(); run.step(.05); run.act(); expect(run.result()).toEqual(result);
    run.start(); until(run, () => Math.abs(run.snapshot().steeringDegrees) < .02, .0002); run.act(); until(run, () => run.snapshot().power > .9999, .0005); run.act();
    until(run, () => !run.snapshot().alive, 1 / 240, 3); expect(run.result()!.reason).toContain('強すぎ');
    run.start(); until(run, () => Math.abs(run.snapshot().steeringDegrees - 30) < .05, .0002); run.act();
    until(run, () => Math.abs(run.snapshot().power - (240 - MIN_DISTANCE) / (MAX_DISTANCE - MIN_DISTANCE)) < .0006, .0005); run.act();
    until(run, () => !run.snapshot().alive, 1 / 240, 3); expect(run.result()).toMatchObject({ outcome: 'outside' }); expect(run.result()!.reason).toContain('角度');
    run.start(); park(run); const before = run.snapshot(); expect(before.grade).toBe('PERFECT PARK');
    expect(run.act()).toBe(false); run.step(.05); expect(run.snapshot().lockedSteering).toBe(before.lockedSteering);
  });

  it('near-correct steering with genuinely short power on angled bays identifies strength rather than distance-dependent heading', () => {
    for (const roll of [.5, .999]) {
      const run=new ParkingRun(()=>{},()=>roll);run.start();park(run);park(run);
      until(run,()=>run.snapshot().phase==='angle');const target=controls(run);
      expect(Math.abs(target.steering)).toBeGreaterThan(11);expect(Math.abs(target.steering)).toBeLessThan(12);
      const almostCorrect=target.steering+Math.sign(target.steering)*.573;
      until(run,()=>Math.abs(run.snapshot().steeringDegrees-almostCorrect)<.015,.0002);run.act();
      until(run,()=>Math.abs(run.snapshot().power-.00265)<.000025,.0002);run.act();
      until(run,()=>!run.snapshot().alive,1/240,3);
      expect(run.result()).toMatchObject({outcome:'outside',parked:2});
      expect(run.result()!.reason).toContain('足りず');
      expect(run.result()!.score).toBe(450); // Two real centered Perfects, no failed parking score.
    }
  });

  it('all seven visible designed templates are achievable via legal gauge waits in normal and narrow forbidden modes', () => {
    for (const mode of ['normal','forbidden'] as const) {
      const seen = new Set<string>();
      for (const roll of [0,.2,.4,.5,.6,.8,.999]) {
        const run = offer(roll); run.choose(mode);
        for (let n = 0; n < 3; n++) {
          seen.add(run.inspection().layout.templateId); park(run);
          expect(run.inspection().projection).toHaveLength(41); expect(run.inspection().layout.obstacles.length).toBeLessThanOrEqual(2);
        }
      }
      expect(seen).toEqual(new Set(PARKING_TEMPLATES));
    }
  }, 30_000);

  it('tenth success previews and freezes one choice; narrow mode doubles only subsequent points and resets on retry', () => {
    const events: ParkingEvent[] = []; const normal = offer(); const forbidden = offer(0, events); const frozen = forbidden.inspection();
    expect(frozen).toMatchObject({ parked: 10, alive: true, pending: 'forbidden', phase: 'choice', mode: 'normal' });
    expect(frozen.layout.slot).toMatchObject({ width: 50, height: 82 });
    for (let n = 0; n < 50; n++) { forbidden.step(.05); expect(forbidden.act()).toBe(false); }
    expect(forbidden.inspection()).toEqual(frozen); expect(forbidden.result()).toBeNull();
    expect(normal.choose('normal')).toBe(true); expect(forbidden.choose('forbidden')).toBe(true);
    expect(forbidden.choose('normal')).toBe(false); expect(forbidden.snapshot().score).toBe(frozen.score);
    park(normal); park(forbidden);
    expect(forbidden.snapshot().score - frozen.score).toBe((normal.snapshot().score - frozen.score) * 2);
    expect(forbidden.snapshot()).toMatchObject({ mode: 'forbidden', modeMultiplier: 2, pending: null });
    expect(events.filter(event => event.type === 'milestone')).toHaveLength(1); expect(events.filter(event => event.type === 'choice')).toHaveLength(1);
    forbidden.start(); expect(forbidden.snapshot()).toMatchObject({ parked: 0, score: 0, mode: 'normal', modeMultiplier: 1, pending: null, perfectStreak: 0 });
  });

  it('a wrong angle contacts a real neighbor before the endpoint; failed cargo cannot add a park or precision score', () => {
    const events: ParkingEvent[] = []; const run = new ParkingRun(event => events.push(event), () => .999); run.start(); park(run); park(run);
    until(run, () => run.snapshot().phase === 'angle'); expect(run.inspection().layout.templateId).toBe('angle-left');
    const before = run.snapshot(); const target = controls(run);
    until(run, () => Math.abs(run.snapshot().steeringDegrees) < .02, .0002);
    expect(run.act()).toBe(true); until(run, () => Math.abs(run.snapshot().power - target.power) < .0006, .0005); run.act();
    until(run, () => !run.snapshot().alive, 1 / 240, 3);
    expect(run.result()).toMatchObject({ outcome: 'collision', parked: 2, score: before.score });
    expect(run.result()!.reason).toContain('隣の車'); expect(run.result()!.contact).not.toBeNull();
    expect(events.filter(event => event.type === 'failure')).toHaveLength(1);
    const copy = run.result()!; copy.pose.x = -999; copy.contact!.x = -999; expect(run.result()!.pose.x).not.toBe(-999); expect(run.result()!.contact!.x).not.toBe(-999);
  });

  it('grades actual offset precision, caps consecutive Perfect bonus and bounds retained objects over60 successes', () => {
    const slot = shape(0,0,0,72,106);
    expect(parkingGrade(shape(),slot)).toBe('PERFECT PARK'); expect(parkingGrade(shape(6),slot)).toBe('GREAT'); expect(parkingGrade(shape(12),slot)).toBe('GOOD');
    expect(scoreParking('GOOD',99,'normal')).toBe(100); expect(scoreParking('GREAT',99,'normal')).toBe(150);
    expect([1,2,3,4,5,99].map(streak => scoreParking('PERFECT PARK',streak,'normal'))).toEqual([200,250,300,350,400,400]);
    const run = offer(); run.choose('forbidden');
    for (let n = 10; n < 60; n++) {
      park(run); const inspect = run.inspection(); expect(inspect.layout.obstacles.length).toBeLessThanOrEqual(2); expect(inspect.projection).toHaveLength(41);
      expect(inspect.pose).toMatchObject({ width: CAR_WIDTH, height: CAR_HEIGHT });
    }
    expect(run.snapshot()).toMatchObject({ parked: 60, alive: true, pending: null });
    const copy = run.inspection(); copy.layout.slot.width = 0; copy.layout.obstacles.length = 0; copy.projection[0].x = -999;
    expect(run.inspection().layout.slot.width).toBe(50); expect(run.inspection().projection[0].x).not.toBe(-999);
  }, 20_000);
});
