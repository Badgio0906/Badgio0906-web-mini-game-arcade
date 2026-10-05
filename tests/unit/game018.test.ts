import { describe, expect, it } from 'vitest';
import { ANGLE_PERIOD, POWER_PEAK_END, POWER_PEAK_START, POWER_PERIOD, ShoeRun, angleAt, powerAt, spinAt } from '../../src/games/game018/ShoeRun';
import { formatDistance, launchParameters, nearbyObstacles, obstacleAt, routeFor, activeReplayHold, replayPhysicalTime, sampleTrajectory, segmentBoxEntry, simulate } from '../../src/games/game018/physics';
import { SHOES } from '../../src/games/game018/shoes';
import { JUST_MAX_THRESHOLD, type Inputs, type ShoeEvent } from '../../src/games/game018/types';
const fixture = (override: Partial<Inputs> = {}): Inputs => ({ shoeType: 'sneaker', angle: 45, spin: .8, power: 100, ...override });
function nativeSequence(run = new ShoeRun()) {
  run.start(0); run.stop(700); run.settle(1000); run.stop(1412.5); run.settle(1712.5); run.stop(2362.5);
  return run;
}
function finish(run: ShoeRun, now = 100000) { run.settle(now); run.settle(now + 1000); run.settle(now + 100000); run.settle(now + 101000); }
describe('SHOE FLY HIGH timing contracts', () => {
  it('swings ANGLE slowly through readable5–85degrees and SPIN both directions', () => {
    expect(angleAt(0)).toBe(5); expect(angleAt(ANGLE_PERIOD / 2)).toBe(85); expect(angleAt(ANGLE_PERIOD)).toBe(5);
    expect(spinAt(1.65 / 4)).toBeCloseTo(1); expect(spinAt(1.65 * .75)).toBeCloseTo(-1);
  });
  it('provides a100mspeak plateau rather than a single-frame JUST MAX point', () => {
    for (let t = POWER_PEAK_START; t <= POWER_PEAK_END; t += .016) expect(powerAt(t)).toBeGreaterThanOrEqual(JUST_MAX_THRESHOLD);
    expect(powerAt(.59)).toBeLessThan(JUST_MAX_THRESHOLD); expect(powerAt(.71)).toBeLessThan(JUST_MAX_THRESHOLD); expect(powerAt(POWER_PERIOD)).toBeCloseTo(0);
  });
  it('uses exactly the native stop timestamp and requires each300mslock transition', () => {
    const run = new ShoeRun(); run.start(0); expect(run.stop(700)).toBe(true); expect(run.locked.angle).toBeCloseTo(45);
    expect(run.stop(700)).toBe(false); run.settle(999); expect(run.phase).toBe('angle-lock'); run.settle(1000); expect(run.phase).toBe('spin');
    run.stop(1412.5); expect(run.locked.spin).toBeCloseTo(1); run.settle(1712.5); expect(run.phase).toBe('power'); run.stop(2362.5); expect(run.justMax).toBe(true); expect(run.phase).toBe('max');
  });
  it('holds JUST MAX then600mskick before actual flight with no leaked final score', () => {
    const run = nativeSequence(); run.settle(2742.5); expect(run.phase).toBe('kick'); run.settle(3342.5); expect(run.phase).toBe('flight'); expect(run.result).toBeNull();
    expect(run.position).toEqual({ x: 0, y: 2 }); expect(run.snapshot().result).toBeNull(); expect(run.velocity.x).toBeGreaterThan(0);
  });
  it('rejects stale and nonfinite inputs and repeated stops during animations', () => {
    const run = new ShoeRun(); run.start(100); expect(run.stop(NaN)).toBe(false); expect(run.stop(99)).toBe(false); run.stop(700); expect(run.stop(800)).toBe(false);
    expect(run.locked.spin).toBeNull(); run.settle(Infinity); expect(run.phase).toBe('angle-lock');
  });
  it('freezes gauges and flight clock across a long pause', () => {
    const run = new ShoeRun(); run.start(0); run.settle(500); run.pause(true, 500); const before = run.snapshot(); run.settle(10500); expect(run.snapshot()).toEqual(before);
    expect(run.stop(11000)).toBe(false); run.pause(false, 11000); run.settle(11200); expect(run.angle).toBeCloseTo(angleAt(.7));
    const flight = nativeSequence(); flight.settle(2742.5); flight.settle(3342.5); flight.settle(4000); flight.pause(true, 4000); const frozen = flight.snapshot(); flight.settle(30000); expect(flight.snapshot()).toEqual(frozen); flight.pause(false, 30000); flight.settle(31000); expect(flight.flightElapsed).toBeCloseTo(frozen.flightElapsed + 1);
  });
  it('starts a fresh full oscillator after a delayed lock-completion frame', () => {
    const run = new ShoeRun(); run.start(0); run.stop(700); run.settle(7000); expect(run.phase).toBe('spin'); expect(run.phaseElapsed).toBe(0); run.stop(7000); expect(run.locked.spin).toBe(0);
  });
  it('counts actual streamed impacts even if a single delayed frame crosses the flight', () => {
    const events: ShoeEvent[] = [], run = new ShoeRun(event => events.push(event)); run.start(0, 'leather'); run.stop(333); run.settle(633); run.stop(970); run.settle(1270); run.stop(1920); run.settle(2300); run.settle(2900);
    expect(run.phase).toBe('flight'); run.settle(102900); expect(run.phase).toBe('landing'); expect(run.breaks).toBeGreaterThan(0); expect(run.position.y).toBe(0); run.settle(103550);
    expect(run.phase).toBe('result'); expect(run.breaks).toBe(run.result?.breaks); expect(events.filter(event => event.type === 'end')).toHaveLength(1); run.settle(200000); expect(events.filter(event => event.type === 'end')).toHaveLength(1);
  });
  it('returns diagnostic copies that cannot mutate actual gauges, effects or result', () => {
    const run = nativeSequence(), snapshot = run.snapshot(); snapshot.locked.angle = 85; snapshot.position.x = 123; expect(run.locked.angle).toBeCloseTo(45); expect(run.position.x).toBe(0);
    finish(run); const finished = run.snapshot(); if (!finished.result) throw new Error('Expected result'); finished.result.score.total = -1; finished.result.inputs.angle = 0; expect(run.result?.score.total).toBeGreaterThan(0); expect(run.result?.inputs.angle).toBeCloseTo(45);
  });
});
describe('deterministic physics and genuine score', () => {
  it('repeats the same trajectory, swept impacts, special events and score for identical inputs', () => { expect(simulate(fixture())).toEqual(simulate(fixture())); });
  it('lands at the exact physical trajectory coordinate and exposes interpolated motion', () => {
    const trajectory = simulate(fixture()), end = trajectory.samples.at(-1)!; expect(end.y).toBe(0); expect(trajectory.result.distance).toBe(end.x);
    const mid = sampleTrajectory(trajectory, trajectory.duration * .4); expect(mid.x).toBeGreaterThan(0); expect(mid.x).toBeLessThan(end.x); expect(mid.y).toBeGreaterThan(0); expect(sampleTrajectory(trajectory, trajectory.duration).x).toBe(end.x);
  });
  it('calculates height from the integrated trajectory and score from every published component', () => {
    const trajectory = simulate(fixture({ shoeType: 'leather', angle: 10 })), result = trajectory.result;
    expect(result.height).toBe(Math.max(...trajectory.samples.map(sample => sample.y))); expect(result.breaks).toBe(trajectory.obstacles.filter(obstacle => obstacle.broken).length);
    const score = result.score; expect(score.total).toBe(score.distance + score.height + score.breaks + score.spin + score.justMax + score.special); expect(score.distance).toBe(Math.floor(result.distance * 4)); expect(score.justMax).toBe(2500);
  });
  it('makes angle, magnitude and spin direction change real trajectory or rotation', () => {
    const low = simulate(fixture({ angle: 10 })), high = simulate(fixture({ angle: 80 })); expect(high.result.height).toBeGreaterThan(low.result.height * 10);
    const still = simulate(fixture({ spin: 0 })), spinning = simulate(fixture({ spin: .8 })), backwards = simulate(fixture({ spin: -.8 }));
    expect(spinning.result.distance).not.toBe(still.result.distance); expect(spinning.samples[20].rotation).toBeGreaterThan(0); expect(backwards.samples[20].rotation).toBeLessThan(0); expect(still.samples[20].rotation).toBe(0);
  });
  it('makes greater power and JUST MAX provide distinct launch velocity bonuses', () => {
    const ordinary = launchParameters(fixture({ power: 97 })), perfect = launchParameters(fixture({ power: 99.4 })), max = launchParameters(fixture({ power: 99.5 }));
    expect(ordinary.speed).toBeLessThan(perfect.speed); expect(max.speed).toBeGreaterThan(perfect.speed * 1.4); expect(simulate(fixture({ power: 98 })).result.powerRating).toBe('PERFECT');
  });
  it('assigns5shoe categories meaningful height, spin, distance, destruction and risk/reward strengths', () => {
    expect(new Set(SHOES.map(shoe => shoe.id)).size).toBe(5);
    const sneaker = simulate(fixture()), paper = simulate(fixture({ shoeType: 'paper', angle: 85 })), zori = simulate(fixture({ shoeType: 'zori', spin: 1 }));
    expect(paper.result.height).toBeGreaterThan(25000); expect(sneaker.result.distance).toBeGreaterThan(simulate(fixture({ shoeType: 'paper' })).result.distance);
    expect(zori.result.score.spin).toBeGreaterThan(simulate(fixture({ spin: 1 })).result.score.spin);
    expect(simulate(fixture({ shoeType: 'leather', angle: 10 })).result.breaks).toBeGreaterThan(simulate(fixture({ angle: 10 })).result.breaks);
    expect(simulate(fixture({ shoeType: 'iron-geta', angle: 20, power: 80 })).result.distance).toBeLessThan(1000);
    expect(simulate(fixture({ shoeType: 'iron-geta', angle: 20 })).result.distance).toBeGreaterThan(40000);
    expect(launchParameters(fixture({ shoeType: 'iron-geta', angle: 20, spin: .8 })).speed).toBeGreaterThan(launchParameters(fixture({ shoeType: 'iron-geta', angle: 20, spin: 1 })).speed * 3);
  });
  it('uses inclusive ground<=25 and sky>=55 with middle distance route', () => { expect(routeFor(25)).toBe('ground'); expect(routeFor(25.01)).toBe('distance'); expect(routeFor(54.99)).toBe('distance'); expect(routeFor(55)).toBe('sky'); });
  it('produces bounded obstacle streams and checks high-speed obstacle slab entries', () => {
    const trajectory = simulate(fixture({ shoeType: 'iron-geta', angle: 20 })); expect(trajectory.result.breaks).toBeGreaterThan(3);
    for (const obstacle of trajectory.obstacles) { const impact = trajectory.effects.find(effect => effect.obstacleId === obstacle.id); expect(impact).toBeDefined(); expect(impact!.y).toBeGreaterThanOrEqual(0); expect(impact!.y).toBeLessThanOrEqual(obstacle.height); expect(impact!.x).toBeGreaterThanOrEqual(obstacle.x); }
    const world = nearbyObstacles(1e9, []); expect(world.length).toBeLessThanOrEqual(24); expect(world.every(obstacle => obstacle.x > 1e9 - 1500)).toBe(true); expect(obstacleAt(0).x).toBe(150);
  });
  it('sweeps descending roof entries as well as vertical walls and rejects a clear miss', () => {
    const roof = { x: 100, y: 0, width: 100, height: 50 };
    expect(segmentBoxEntry(90, 90, 180, 10, roof)).toBe(.5);
    expect(segmentBoxEntry(0, 20, 300, 20, roof)).toBeCloseTo(1 / 3);
    expect(segmentBoxEntry(0, 51, 300, 51, roof)).toBeNull();
    expect(segmentBoxEntry(150, 80, 150, 20, roof)).toBe(.5);
  });
  it('triggers only physically reached and input-eligible sky events, plus all secret combinations', () => {
    const paper = simulate(fixture({ shoeType: 'paper', angle: 85 })); expect(paper.result.specials).toEqual(expect.arrayContaining(['JET STREAM', 'CLOUD NINE', 'AIRPLANE BREAK', 'UFO INCIDENT', 'ORBITAL SHOE']));
    expect(simulate(fixture({ angle: 85, power: 20 })).result.specials).not.toContain('AIRPLANE BREAK');
    expect(simulate(fixture({ shoeType: 'zori', spin: 1 })).result.specials).toContain('TORNADO ZORI');
    expect(simulate(fixture({ shoeType: 'leather', angle: 10 })).result.specials).toContain('BUSINESS MISSILE'); expect(simulate(fixture({ shoeType: 'iron-geta', angle: 20 })).result.specials).toContain('IRON BREAKER');
    const sky = paper.effects.find(effect => effect.name === 'ORBITAL SHOE')!; expect(sky.y).toBe(25000); expect(sky.time).toBeGreaterThan(0);
  });
  it('keeps flight20–40s design compatible without stretching a near-zero-power throw', () => {
    const ordinary = simulate(fixture({ power: 80 })); expect(ordinary.duration).toBeGreaterThanOrEqual(12); expect(ordinary.duration).toBeLessThanOrEqual(24);
    expect(simulate(fixture({ power: 0 })).duration).toBeLessThan(10);
  });
  it('lands every sampled extreme finite input within the bounded simulation horizon', () => {
    for (const shoe of SHOES) for (const angle of [5, 20, 45, 60, 85]) for (const spin of [-1, 0, .8, 1]) for (const power of [0, 80, 99.5, 100]) {
      const trajectory = simulate(fixture({ shoeType: shoe.id, angle, spin, power })); expect(trajectory.samples.length).toBeLessThanOrEqual(3601); expect(trajectory.samples.at(-1)!.y).toBe(0); expect(Number.isFinite(trajectory.result.distance)).toBe(true); expect(Number.isFinite(trajectory.result.score.total)).toBe(true);
    }
    expect(simulate(fixture({ angle: NaN, spin: Infinity, power: -100 })).result.inputs).toMatchObject({ angle: 5, spin: -1, power: 0 });
  });
  it('formats measured meters and kilometers with consistent units', () => { expect(formatDistance(124.7)).toBe('124.7 m'); expect(formatDistance(3420)).toBe('3.42 km'); expect(formatDistance(18600)).toBe('18.6 km'); expect(formatDistance(NaN)).toBe('0.0 m'); });
});
describe('isolated forgiving practice', () => {
  it('finishes individual ANGLE/SPIN/POWER stages without creating flight or scored results', () => {
    for (const stage of [0, 1, 2] as const) { const run = new ShoeRun(); run.startPractice(0, stage); expect(run.stop(stage === 2 ? 650 : 500)).toBe(true); run.settle(2000); run.settle(3000); expect(run.phase).toBe('practice-complete'); expect(run.result).toBeNull(); expect(run.flightDuration).toBe(0); expect(run.position.x).toBe(0); }
  });
  it('does not expire practice inputs and repeats a stage with fresh neutral defaults', () => {
    const run = new ShoeRun(); run.startPractice(0, 1); run.settle(100000); expect(run.phase).toBe('spin'); expect(run.alive).toBe(true); run.stop(100000); run.settle(101000); run.startPractice(102000, 1); expect(run.phase).toBe('spin'); expect(run.locked.spin).toBeNull(); expect(run.angle).toBe(45);
  });
  it('practices the real3-step sequence and real landing with zero score and no real result phase', () => {
    const events: ShoeEvent[] = [], run = new ShoeRun(event => events.push(event)); run.startPractice(0, 3); run.stop(700); run.settle(1000); run.stop(1412.5); run.settle(1712.5); run.stop(2362.5); finish(run);
    expect(run.phase).toBe('practice-complete'); expect(run.result?.distance).toBeGreaterThan(0); expect(run.result?.score.total).toBe(0); expect(run.result?.practice).toBe(true); expect(events.filter(event => event.type === 'end')).toHaveLength(1);
    run.start(300000, 'paper'); expect(run.practice).toBe(false); expect(run.result).toBeNull(); expect(run.shoeType).toBe('paper');
  });
});

describe('truthful sky event view holds', () => {
  it('holds the shoe at exact physical encounter coordinates and resumes the same integrated path', () => {
    const trajectory = simulate(fixture({ shoeType: 'paper', angle: 85 }));
    expect(trajectory.holds.map(hold => hold.name)).toEqual(['AIRPLANE BREAK', 'UFO INCIDENT', 'ORBITAL SHOE']);
    for (const hold of trajectory.holds) {
      const before = sampleTrajectory(trajectory, hold.start - .01), first = sampleTrajectory(trajectory, hold.start + .1), last = sampleTrajectory(trajectory, hold.end - .1), after = sampleTrajectory(trajectory, hold.end + .01);
      expect(first).toEqual(last); expect(first.x).toBeCloseTo(hold.x, 8); expect(first.y).toBeCloseTo(hold.y, 8); expect(first.t).toBe(hold.physicalTime);
      expect(before.y).toBeLessThan(hold.y); expect(after.y).toBeGreaterThan(hold.y); expect(activeReplayHold(trajectory, hold.start + .1)?.name).toBe(hold.name);
      expect(activeReplayHold(trajectory, hold.end + .01)).toBeNull();
    }
  });
  it('retimes encounters and later ground impacts while keeping final distance/height/score tied to physical samples', () => {
    const trajectory = simulate(fixture({ shoeType: 'paper', angle: 85 }));
    expect(trajectory.duration).toBeCloseTo(trajectory.motionDuration + trajectory.holds.length * .55);
    expect(trajectory.result.duration).toBeCloseTo(trajectory.duration + .6 + .65 + .38); expect(trajectory.result.duration).toBeLessThan(40);
    for (const hold of trajectory.holds) { const effect = trajectory.effects.find(effect => effect.name === hold.name)!; expect(effect.time).toBeCloseTo(hold.start); expect(sampleTrajectory(trajectory, effect.time).y).toBeCloseTo(effect.y, 8); }
    const end = sampleTrajectory(trajectory, trajectory.duration); expect(end.x).toBe(trajectory.result.distance); expect(end.y).toBe(0); expect(end.maxHeight).toBe(trajectory.result.height); expect(replayPhysicalTime(trajectory, trajectory.duration)).toBeCloseTo(trajectory.physicalDuration);
    const ground = simulate(fixture({ shoeType: 'leather', angle: 10 })); expect(ground.holds).toEqual([]); expect(ground.duration).toBe(ground.motionDuration);
    for (const impact of ground.effects.filter(effect => effect.type === 'impact')) { expect(ground.obstacles.find(obstacle => obstacle.id === impact.obstacleId)!.time).toBe(impact.time); }
  });
  it('native runtime exposes only its active encounter and pauses without losing its hold or leaking future results', () => {
    const events: ShoeEvent[] = [], run = new ShoeRun(event => events.push(event));
    run.start(0, 'paper'); run.stop(1400); run.settle(1700); const spinAt = 1700 + Math.asin(.8) / (2 * Math.PI) * 1.65 * 1000; run.stop(spinAt); run.settle(spinAt + 300); const powerAt = spinAt + 950; run.stop(powerAt); run.settle(powerAt + 380); const flightAt = powerAt + 980; run.settle(flightAt);
    const expected = simulate({ shoeType: run.shoeType, angle: run.angle, spin: run.spin, power: run.power }), hold = expected.holds[0];
    const holdAt = flightAt + (hold.start + .1) * 1000; run.settle(holdAt); expect(run.activeHold?.name).toBe('AIRPLANE BREAK'); expect(run.position.y).toBeCloseTo(2200, 8); expect(run.result).toBeNull();
    expect(events.some(event => event.type === 'special' && event.effect.name === 'UFO INCIDENT')).toBe(false);
    run.pause(true, holdAt); const frozen = run.snapshot(); run.settle(holdAt + 10000); expect(run.snapshot()).toEqual(frozen); run.pause(false, holdAt + 10000); run.settle(holdAt + 10100); expect(run.position.y).toBeCloseTo(2200, 8);
    const copy = run.snapshot(); if (!copy.activeHold) throw Error('Expected active hold'); copy.activeHold.position.y = -1; expect(run.activeHold?.position.y).toBe(2200);
  });
  it('remains deterministic, adds at most three short holds and leaves low-power near throws fast', () => {
    const input = fixture({ shoeType: 'paper', angle: 85 }); expect(simulate(input)).toEqual(simulate(input));
    for (const shoe of SHOES) for (const angle of [5, 20, 45, 60, 85]) for (const power of [0, 80, 99.5, 100]) {
      const trajectory = simulate(fixture({ shoeType: shoe.id, angle, power })); expect(trajectory.holds.length).toBeLessThanOrEqual(3); expect(trajectory.duration - trajectory.motionDuration).toBeLessThanOrEqual(1.650000001); expect(trajectory.duration).toBeLessThan(26); expect(sampleTrajectory(trajectory, trajectory.duration).y).toBe(0);
      if (power === 0) expect(trajectory.duration).toBeLessThan(10);
    }
  });
});
