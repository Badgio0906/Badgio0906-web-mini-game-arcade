import { describe, expect, it } from 'vitest';
import { ParkingRun, curvatureFor, poseAlongArc, containsCar, BRAKE_SECONDS } from '../../src/games/game006/ParkingRun';
import type { ParkingEvent } from '../../src/games/game006/contracts';
function wait(run: ParkingRun, predicate: () => boolean, step = .001, budget = 40) {
  for (let t = 0; t < budget && !predicate() && run.snapshot().alive; t += step) run.step(step);
  expect(predicate(), JSON.stringify(run.inspection())).toBe(true);
}
function launch(run: ParkingRun, angle: number, power: number) {
  wait(run, () => Math.abs(run.snapshot().steeringDegrees - angle) < .02, .0002); expect(run.act()).toBe(true);
  wait(run, () => Math.abs(run.snapshot().power - power) < .0001, .0001); expect(run.act()).toBe(true);
}
const end = (run: ParkingRun) => wait(run, () => run.snapshot().phase === 'parked' || !run.snapshot().alive, .001, 3);
describe('PARK IT v3 one steering correction', () => {
  it('changes the exact driven arc continuously and rescues a slightly wrong angle without awarding free points', () => {
    const plain = new ParkingRun(), corrected = new ParkingRun(); plain.start(); corrected.start();
    launch(plain, 6, 120 / 220); launch(corrected, 6, 120 / 220);
    wait(corrected, () => corrected.inspection().driven >= 120);
    const before = corrected.inspection(); expect(corrected.correct()).toBe(true);
    expect(corrected.snapshot().pose).toEqual(before.pose); expect(corrected.correct()).toBe(false);
    const projected = corrected.inspection().endpoint;
    const expected = poseAlongArc(before.pose, -curvatureFor(before.lockedSteering!), before.driveDistance - before.driven);
    expect(projected).toEqual(expected);
    end(plain); end(corrected);
    expect(plain.result()?.outcome).toBe('outside');
    expect(corrected.snapshot().phase).toBe('parked'); expect(containsCar(corrected.inspection().layout.slot, corrected.snapshot().pose)).toBe(true);
    expect(corrected.snapshot().pose).toEqual(expected);
    expect(corrected.snapshot().score).toBeGreaterThan(0);
    const clean = new ParkingRun(); clean.start(); launch(clean, 0, 120 / 220); end(clean);
    expect(clean.snapshot().score).toBeGreaterThan(corrected.snapshot().score);
    wait(corrected, () => corrected.snapshot().phase === 'angle'); launch(corrected, 0, 120 / 220); corrected.step(.01);
    expect(corrected.snapshot().correctionUsed).toBe(true); expect(corrected.correct()).toBe(false);
  });
  it('allows the old finite brake after correction and stops on that same piecewise route', () => {
    const events: ParkingEvent[] = []; const run = new ParkingRun(e => events.push(e)); run.start(); launch(run, 6, .9);
    wait(run, () => run.inspection().driven >= 120); expect(run.correct()).toBe(true);
    const pivot = run.inspection(); wait(run, () => run.inspection().driven >= 210); const braking = run.inspection();
    expect(run.brake()).toBe(true); expect(run.correct()).toBe(false); end(run);
    const speed = pivot.driveDistance / (1.1 + pivot.driveDistance / 340 * .35);
    expect(run.inspection().driven - braking.driven).toBeCloseTo(speed * BRAKE_SECONDS / 2, 6);
    const expected = poseAlongArc(pivot.pose, -curvatureFor(pivot.lockedSteering!), run.inspection().driven - pivot.driven);
    expect(run.snapshot().pose).toEqual(expected); expect(run.snapshot().brakeUsed).toBe(true);
    expect(events.filter(e => e.type === 'brake')).toHaveLength(1); expect(events.filter(e => e.type === 'correction')).toHaveLength(1);
  });
  it('rejects non-driving/zero-time/repeated corrections and resets the allowance only for a new RUN', () => {
    const run = new ParkingRun(); expect(run.correct()).toBe(false); run.start(); expect(run.correct()).toBe(false);
    launch(run, 4, .54); expect(run.correct()).toBe(false); run.step(.01); expect(run.correct()).toBe(true);
    run.start(); expect(run.snapshot()).toMatchObject({correctionUsed: false, correctionDistance: null, rulesVersion: 3});
    launch(run, 4, .54); run.step(.01); run.brake(); expect(run.correct()).toBe(false);
  });
  it('keeps curbs active after the reversed curve, using the actual pose and contact', () => {
    const run = new ParkingRun(); run.start(); run.act(); // locked -38deg
    wait(run, () => run.snapshot().power > .9999, .0002); run.act(); run.step(.01); expect(run.correct()).toBe(true); end(run);
    expect(run.snapshot().parked).toBe(0); expect(run.result()).not.toBeNull(); expect(run.result()!.pose).toEqual(run.snapshot().pose);
    expect(run.result()!.correctionUsed).toBe(true);
    expect(run.result()!.outcome).toBe('collision'); expect(run.result()!.contact).not.toBeNull();
  });
});
