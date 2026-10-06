import {it,expect} from 'vitest';
import {ParkingRun} from '../../src/games/game006/ParkingRun';
import {ParkingRun as BaselineParkingRun} from '../../docs/seven-games-2026-10-06/game006/QA/baseline-model/ParkingRun';
/** Exact archived baseline, not a reimplementation of the new velocity. */
it('replays identical legal inputs and varying frame steps with exact old unbraked pose and outcome',()=>{
 for(const [wantedAngle,wantedPower] of [[0,.54545],[0,0],[0,1],[30,.54545],[-11.308,.54545]]){
  const old=new BaselineParkingRun(()=>{},()=>.999);const current=new ParkingRun(()=>{},()=>.999);old.start();current.start();
  for(let frame=0;frame<70000;frame++){
   const a=old.snapshot(),b=current.snapshot();
   const common=(s:ReturnType<typeof old.snapshot>)=>({time:s.time,pose:s.pose,phase:s.phase,alive:s.alive,steeringDegrees:s.steeringDegrees,power:s.power,lockedSteering:s.lockedSteering,lockedPower:s.lockedPower,outcome:s.outcome,parked:s.parked});
   expect(common(b)).toEqual(common(a));
   if(!a.alive||a.phase==='parked')break;
   if(a.phase==='angle'&&Math.abs(a.steeringDegrees-wantedAngle)<.03){old.act();current.act();}
   else if(a.phase==='power'&&Math.abs(a.power-wantedPower)<.0003){old.act();current.act();}
   const dt=frame%3===0?.0002:frame%3===1?.0004:.0003;old.step(dt);current.step(dt);
  }
  expect(current.snapshot().phase==='parked'||!current.snapshot().alive).toBe(true);
  if(old.result())expect(current.result()!.pose).toEqual(old.result()!.pose);
 }
},20000);
