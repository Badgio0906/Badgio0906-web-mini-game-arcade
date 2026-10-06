import { describe, it, expect } from 'vitest';
import { createParkingOptions, parkingRouteIsSafe, rectangleDistance, CAR_WIDTH, CAR_HEIGHT } from '../../src/games/game006/ParkingRun';
const shape = (x: number, y: number, rotation = 0) => ({ x, y, rotation, width: CAR_WIDTH, height: CAR_HEIGHT });
describe('Parking v2 slots and shape distance', () => {
  it('both shared-obstacle routes are reachable at all generated side/mode choices', () => {
    for (const index of [3, 10, 25]) for (const mode of ['normal', 'forbidden'] as const) for (const roll of [0, .499, .5, .999]) {
      const options = createParkingOptions(index, mode, roll);
      expect(options).toHaveLength(2); expect(options[0].layout.obstacles).toEqual(options[1].layout.obstacles);
      expect(options.every(o => parkingRouteIsSafe(o.layout))).toBe(true);
      expect(options[0].layout.slot.x).not.toBe(options[1].layout.slot.x);
      if (mode === 'forbidden') expect(options.map(o => [o.layout.slot.width, o.layout.slot.height])).toEqual([[50,82],[50,82]]);
    }
  });
  it('measures corners and touching bodies, rather than center separation', () => {
    expect(rectangleDistance(shape(0,0),shape(42,0))).toBe(0);
    expect(rectangleDistance(shape(0,0),shape(46,0))).toBeCloseTo(4);
    expect(rectangleDistance(shape(0,0),shape(42,74))).toBeCloseTo(4);
    expect(rectangleDistance(shape(0,0,Math.PI/2),shape(60,0))).toBeCloseTo(4);
  });
});

import { ParkingRun, BRAKE_SECONDS, scoreParking, poseAlongArc, curvatureFor, containsCar } from '../../src/games/game006/ParkingRun';
import type { ParkingEvent, ParkingSlotKind } from '../../src/games/game006/contracts';
function wait(run: ParkingRun, predicate: () => boolean, dt = 1/240, budget = 40) {
  for (let n = 0; n < budget/dt && run.snapshot().alive && !predicate(); n++) run.step(dt);
  expect(predicate(), JSON.stringify(run.inspection())).toBe(true);
}
function aim(run: ParkingRun, power: number, angle = 0) {
  wait(run, () => Math.abs(run.snapshot().steeringDegrees-angle)<.02, .0002); expect(run.act()).toBe(true);
  wait(run, () => Math.abs(run.snapshot().power-power)<.0001, .0001); expect(run.act()).toBe(true);
}
function target(run: ParkingRun) {
  const {start,slot}=run.inspection().layout; const turn=slot.rotation-start.rotation;
  const chord=Math.hypot(slot.x-start.x,slot.y-start.y);const d=Math.abs(turn)<1e-9?chord:Math.abs(turn)*chord/(2*Math.sin(Math.abs(turn)/2));
  return {angle:Math.atan(turn/d*110)*180/Math.PI,power:(d-120)/220,d};
}
function parkLegal(run: ParkingRun, kind: ParkingSlotKind = 'safe') {
  wait(run,()=>run.snapshot().phase==='angle'||run.snapshot().phase==='slot-choice');
  if(run.snapshot().phase==='slot-choice')run.chooseSlot(kind);
  const t=target(run);aim(run,t.power,t.angle);
  wait(run,()=>run.snapshot().phase==='parked'||!run.snapshot().alive,1/240,3);expect(run.snapshot().phase).toBe('parked');
}
describe('Parking v2 finite braking and scoring boundaries',()=>{
  it('preserves the exact unbraked historical arc, speed and endpoint, until the new success reward',()=>{
    const run=new ParkingRun();run.start();aim(run,120/220);const v=run.inspection();const distance=v.driveDistance;
    const speed=distance/(1.1+distance/340*.35);run.step(.05);
    expect(run.inspection().driven).toBeCloseTo(speed*.05,8);
    const expected = poseAlongArc(v.layout.start,curvatureFor(v.lockedSteering!),speed*.05); for (const key of ['x','y','rotation'] as const) expect(run.snapshot().pose[key]).toBeCloseTo(expected[key],10);
    wait(run,()=>run.snapshot().phase==='parked',1/240,3);
    expect(run.snapshot().pose).toEqual(poseAlongArc(v.layout.start,curvatureFor(v.lockedSteering!),distance));
    expect(run.snapshot()).toMatchObject({brakeUsed:false,noBrakePoints:20,score:220});
  });
  it('brakes once over 240ms on the identical committed curved path, and can save excessive power',()=>{
    const events:ParkingEvent[]=[];const run=new ParkingRun(e=>events.push(e));run.startPractice(2);run.chooseSlot('challenge');
    const t=target(run);aim(run,.95,t.angle);const launch=run.inspection();const speed=launch.driveDistance/(1.1+launch.driveDistance/340*.35);
    expect(run.act()).toBe(false);
    wait(run,()=>run.inspection().driven>=t.d-speed*BRAKE_SECONDS/2,1/1000,3);
    const before=run.inspection();expect(run.act()).toBe(true);expect(run.act()).toBe(false);expect(run.snapshot().pose).toEqual(before.pose);
    run.step(.05);const mid=run.inspection();expect(mid.driven).toBeGreaterThan(before.driven);expect(mid.phase).toBe('driving');
    expect(mid.pose).toEqual(poseAlongArc(mid.layout.start,curvatureFor(mid.lockedSteering!),mid.driven));
    wait(run,()=>run.snapshot().phase==='parked',1/1000,1);
    expect(run.inspection().driven-before.driven).toBeCloseTo(speed*BRAKE_SECONDS/2,7);
    expect(run.snapshot()).toMatchObject({brakeUsed:true,noBrakePoints:0,slotKind:'challenge',nearMisses:1,nearMissPoints:10});
    expect(events.filter(e=>e.type==='brake')).toHaveLength(1);expect(events.filter(e=>e.type==='near_miss')).toHaveLength(1);
    expect(run.act()).toBe(false);
  });
  it('an early brake cannot rescue wrong power and cannot accelerate or change steering',()=>{
    const events:ParkingEvent[]=[];const run=new ParkingRun(e=>events.push(e));run.start();aim(run,.1);run.step(.05);run.act();
    const angle=run.snapshot().lockedSteering;
    wait(run,()=>!run.snapshot().alive,1/240,1);
    expect(run.result()).toMatchObject({cause:'short',brakeUsed:true,score:0});
    expect(run.result()!.reason).toContain('ブレーキが早く');expect(run.snapshot().lockedSteering).toBe(angle);
    expect(events.filter(e=>e.type==='near_miss'||e.type==='park')).toHaveLength(0);
  });
  it('offers both bays only after three successes, freezes gauges/time, and scores selected challenge separately',()=>{
    const events:ParkingEvent[]=[];const run=new ParkingRun(e=>events.push(e),()=>0);run.start();
    for(let n=0;n<3;n++){expect(run.inspection().options).toHaveLength(0);parkLegal(run);}
    wait(run,()=>run.snapshot().phase==='slot-choice',1/240,2);const view=run.inspection();
    run.step(.05);expect(run.inspection()).toEqual(view);expect(run.act()).toBe(false);
    expect(run.chooseSlot('challenge')).toBe(true);expect(run.chooseSlot('safe')).toBe(false);
    const before=run.snapshot().score;const t=target(run);aim(run,t.power,t.angle);wait(run,()=>run.snapshot().phase==='parked',1/240,3);
    const p=events.filter(e=>e.type==='park').at(-1)!;
    expect(p).toMatchObject({type:'park',basePoints:490,noBrakePoints:49,nearMissPoints:10,points:549,slot:'challenge'});
    expect(run.snapshot().score-before).toBe(549);expect(run.snapshot().precision!.margin).toBeGreaterThan(0);
  });
  it('never awards proximity when a body corner subsequently contacts the neighbor',()=>{
    const events:ParkingEvent[]=[];const run=new ParkingRun(e=>events.push(e));run.startPractice(2);run.chooseSlot('challenge');
    const t=target(run);aim(run,1,t.angle+2);
    wait(run,()=>!run.snapshot().alive,1/240,3);
    expect(run.result()).toMatchObject({outcome:'collision',cause:'collision',score:0});
    expect(run.snapshot()).toMatchObject({nearMisses:0,nearMissPoints:0,noBrakePoints:0});
    expect(events.filter(e=>e.type==='near_miss'||e.type==='park')).toHaveLength(0);
  });
  it('keeps forbidden future-only x2 and challenge x1.4 as single independent factors',()=>{
    expect(scoreParking('PERFECT PARK',1,'normal','challenge')).toBe(280);
    expect(scoreParking('PERFECT PARK',1,'forbidden','challenge')).toBe(560);
    const events:ParkingEvent[]=[];const run=new ParkingRun(e=>events.push(e),()=>0);run.start();for(let n=0;n<10;n++)parkLegal(run);
    wait(run,()=>run.snapshot().pending==='forbidden',1/240,2);const score=run.snapshot().score;run.choose('forbidden');expect(run.snapshot().score).toBe(score);
    parkLegal(run,'challenge');const p=events.filter(e=>e.type==='park').at(-1)!;
    expect(p).toMatchObject({type:'park',basePoints:1120,noBrakePoints:112,nearMissPoints:10,points:1242});
    expect(run.snapshot().score-score).toBe(1242);
  });
  it('landing in the visible unselected bay explains the designation, and gains no success score',()=>{
    const run=new ParkingRun();run.startPractice(2);const other=run.inspection().options[1].layout;
    run.chooseSlot('safe');const angle=Math.atan(other.slot.rotation/260*110)*180/Math.PI;
    aim(run,(260-120)/220,angle);wait(run,()=>!run.snapshot().alive,1/240,3);
    expect(containsCar(other.slot,run.snapshot().pose)).toBe(true);expect(run.result()).toMatchObject({cause:'unselected',score:0});expect(run.result()!.reason).toContain('指定した枠');
  });
});
