import { describe, it, expect } from 'vitest';
import { ParkingRun } from '../../src/games/game006/ParkingRun';
function wait(run:ParkingRun, predicate:()=>boolean, dt=.001, limit=40){for(let n=0;n<limit/dt&&run.snapshot().alive&&!predicate();n++)run.step(dt);expect(predicate()).toBe(true);}
function launch(run:ParkingRun){const {start,slot}=run.inspection().layout,turn=slot.rotation-start.rotation,chord=Math.hypot(slot.x-start.x,slot.y-start.y);const d=Math.abs(turn)<1e-9?chord:Math.abs(turn)*chord/(2*Math.sin(Math.abs(turn)/2)),angle=Math.atan(turn/d*110)*180/Math.PI,power=(d-120)/220;wait(run,()=>Math.abs(run.snapshot().steeringDegrees-angle)<.02,.0002);run.act();wait(run,()=>Math.abs(run.snapshot().power-power)<.0001,.0001);run.act();run.step(.01);}
describe('mobile progressive parking',()=>{
 it('starts with two inputs and unlocks optional driving controls only after three successful parks',()=>{
  const run=new ParkingRun(()=>{},()=>0,true);run.start();expect(run.snapshot()).toMatchObject({rulesVersion:4,brakeUnlocked:false});
  for(let n=0;n<3;n++){launch(run);expect(run.brake()).toBe(false);expect(run.correct()).toBe(false);wait(run,()=>run.snapshot().phase==='parked');if(n<2)wait(run,()=>run.snapshot().phase==='angle');}
  wait(run,()=>run.snapshot().phase==='slot-choice');expect(run.snapshot().brakeUnlocked).toBe(true);run.chooseSlot('safe');launch(run);expect(run.brake()).toBe(true);
  run.start();expect(run.snapshot().brakeUnlocked).toBe(false);
 });
 it('keeps brake and correction practice available without changing production unlocks',()=>{const run=new ParkingRun(()=>{},()=>0,true);run.startPractice(1);expect(run.snapshot().brakeUnlocked).toBe(true);run.startPractice(3);expect(run.snapshot().brakeUnlocked).toBe(true);run.startPractice(0);expect(run.snapshot().brakeUnlocked).toBe(false);});
});
