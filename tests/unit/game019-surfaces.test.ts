import { describe,it,expect } from 'vitest';
import { ChargeRun } from '../../src/games/game019/ChargeRun';
import { createFlatPrototype } from '../../src/games/game019/prototypeLevel';
import { ledge,STEP,type ChargeEvent,type Direction } from '../../src/games/game019/chargeTypes';
const advance=(r:ChargeRun,ms:number)=>{for(let i=0;i<Math.round(ms/1000/STEP);i++)r.update(STEP);};
function jump(r:ChargeRun,ms:number,d:Direction){r.setDirection(d);expect(r.beginCharge()).toBe(true);advance(r,ms);expect(r.releaseCharge()).toBe(true);for(let i=0;i<2400&&!r.player.grounded;i++)r.update(STEP);}
describe('Game019 actual surfaces and collision telemetry',()=>{
 it('a crumbling ledge cancels a held charge, physically falls and restores without duplicating jump outcomes',()=>{
 const level=createFlatPrototype();level.ledges.push(ledge('crack',180,3.6,110,'crumble'));const events:ChargeEvent[]=[];const r=new ChargeRun(level,e=>events.push(e));jump(r,450,0);expect(r.player.ledgeId).toBe('crack');expect(r.beginCharge()).toBe(true);advance(r,2200);expect(r.player.ledgeId).toBe('bottom');expect(r.alive).toBe(true);expect(r.phase).toBe('grounded');expect(r.jumps).toBe(1);expect(events.filter(e=>e.type==='jump_end')).toHaveLength(1);expect(events.filter(e=>e.type==='fall_end')).toHaveLength(2);expect(events.some(e=>e.type==='charge_cancel')).toBe(true);advance(r,3000);expect(r.snapshot().ledges.find(l=>l.id==='crack')!.active).toBe(true);expect(r.player.y).toBe(0);
 });
 it('moss briefly slides along actual ground and settles before carrying the frog off a wide shelf',()=>{
 const level=createFlatPrototype();level.startX=70;level.ledges.push(ledge('moss',180,3.6,110,'moss'));const r=new ChargeRun(level);jump(r,450,1);expect(r.player.ledgeId).toBe('moss');const x=r.player.x;expect(r.player.slipTime).toBeGreaterThan(0);advance(r,1500);expect(r.player.x-x).toBeGreaterThan(2);expect(r.player.x-x).toBeLessThan(10);expect(r.player.vx).toBe(0);expect(r.player.grounded).toBe(true);
 });
 it('a persistent boundary contact emits one bump per jump rather than120 events/second',()=>{
 const events:ChargeEvent[]=[];const r=new ChargeRun(createFlatPrototype(),e=>events.push(e));jump(r,700,1);expect(r.player.x).toBe(327);expect(events.filter(e=>e.type==='wall_bump')).toHaveLength(1);jump(r,700,1);expect(events.filter(e=>e.type==='wall_bump')).toHaveLength(2);
 });
 it('a held charge and all clocks ignore invalid elapsed values and quit cannot forecast another jump',()=>{
 const r=new ChargeRun(createFlatPrototype());r.beginCharge();const before=r.snapshot();for(const dt of [0,-1,NaN,Infinity])r.update(dt);expect(r.snapshot()).toEqual(before);r.quit();expect(r.forecast(450,1).landing).toBeNull();const s=r.snapshot();s.sections[0].name='tampered';expect(r.snapshot().sections[0].name).not.toBe('tampered');
 });
});
