import {describe,it,expect} from 'vitest';
import Matter from 'matter-js';
import {BUILDINGS,createBuilding,shapeMetrics} from '../../src/games/game003/buildings';
import {TowerRun,FOUNDATION} from '../../src/games/game003/TowerRun';
import type {TowerEvent} from '../../src/games/game003/contracts';
const advance=(run:TowerRun,seconds:number)=>{for(let n=0;n<seconds*120&&run.alive;n++)run.step(1/120);};
function land(run:TowerRun){const count=run.stack.length;expect(run.drop()).toBe(true);for(let n=0;n<1200&&run.alive&&run.stack.length===count;n++)run.step(1/120);return run.stack.length>count;}
describe('Game003 compound architectural physics v3',()=>{
 it('provides ten genuinely different unions; the visible-volume density determines COM, mass and rotational inertia',()=>{
  expect(BUILDINGS).toHaveLength(10);expect(new Set(BUILDINGS.map(s=>JSON.stringify(s.parts))).size).toBe(10);
  for(const s of BUILDINGS){const m=shapeMetrics(s),b=createBuilding(s,300,200);expect(b.mass).toBeCloseTo(m.mass,8);expect(b.position.x).toBeCloseTo(300,8);expect(b.position.y).toBeCloseTo(200,8);expect(b.inertia).toBeGreaterThan(0);expect(b.parts.length).toBe(s.parts.length+1);}
  const factory=shapeMetrics(BUILDINGS[7]);expect(factory.cx).not.toBe(factory.width/2);
 });
 it('L-shaped empty corner remains empty to collision queries while its solid foot collides',()=>{
  const s=BUILDINGS[4],m=shapeMetrics(s),body=createBuilding(s,300,200);
  const empty=Matter.Bodies.circle(300+95-m.cx,200+20-m.cy,5),solid=Matter.Bodies.circle(300+95-m.cx,200+70-m.cy,5);
  expect(Matter.Query.collides(empty,[body])).toHaveLength(0);expect(Matter.Query.collides(solid,[body]).length).toBeGreaterThan(0);
 });
 it('quarter turns rotate actual collider, and touch movement clamps without letting repeat DROP queue',()=>{
  const r=new TowerRun(()=>{},()=>0);r.start();expect(r.rotate()).toBe(true);expect(r.cargo!.rotation).toBeCloseTo(Math.PI/2);r.move(-500);expect(r.cargo!.x).toBe(116);r.move(300);expect(r.drop()).toBe(true);expect(r.drop()).toBe(false);expect(r.rotate()).toBe(false);expect(r.move(400)).toBe(false);
  advance(r,4);expect(r.stack.length).toBe(1);expect(Math.abs(Math.sin(r.stack[0].rotation))).toBeGreaterThan(.99);expect(r.stack[0].height).toBe(46);
 });
 it('retains dynamic bodies after stacking, counts actual accepted height, and isolates snapshots and reset',()=>{
  const r=new TowerRun(()=>{},()=>0);r.start();expect(land(r)).toBe(true);expect(r.snapshot().height).toBeCloseTo(46/60,1);expect(land(r)).toBe(true);expect(r.snapshot()).toMatchObject({rulesVersion:3,alive:true,floors:2});
  const first=r.inspection().stack[0];expect(first.sleeping).toBeTypeOf('boolean');r.move(347);r.rotate();r.drop();advance(r,2);const after=r.inspection().stack[0];expect(Number.isFinite(after.rotation)).toBe(true);expect(after.x).toBeGreaterThan(0);
  const copy=r.inspection();copy.stack[0].x=999;expect(r.stack[0].x).not.toBe(999);r.start();expect(r.snapshot()).toMatchObject({floors:0,height:0,phase:'hanging',alive:true});const time=r.time;r.step(NaN);r.step(Infinity);r.step(-1);expect(r.time).toBe(time);r.step(10);expect(r.time).toBeCloseTo(.05,8);
 });
 it('a failed placement falls naturally, emits one end event, and leaves an older accepted count',()=>{
  const events:TowerEvent[]=[],r=new TowerRun(e=>events.push(e),()=>0);r.start();expect(land(r)).toBe(true);r.move(484);r.drop();advance(r,8);expect(r.alive).toBe(false);expect(r.result()!.outcome).toBe('fall');expect(r.result()!.floors).toBe(1);advance(r,2);expect(events.filter(e=>e.type==='collapse')).toHaveLength(1);const result=r.result()!;result.floors=99;expect(r.result()!.floors).toBe(1);
 });
 it('120 fixed-step simulations have finite bounded bodies with no penetration/explosion; centered builds settle',()=>{
  let settled=0,rotated=0;
  for(let trial=0;trial<120;trial++){
   const engine=Matter.Engine.create({enableSleeping:true,positionIterations:10,velocityIterations:8});engine.gravity.scale=.00072;
   const ground=Matter.Bodies.rectangle(300,660,FOUNDATION.width,42,{isStatic:true,friction:1});const angle=(trial%4)*Math.PI/2,body=createBuilding(BUILDINGS[trial%10],300+((trial%3)-1)*12,350,angle);Matter.Composite.add(engine.world,[ground,body]);
   for(let tick=0;tick<720;tick++)Matter.Engine.update(engine,1000/120);
   expect(Number.isFinite(body.position.x)&&Number.isFinite(body.position.y)&&Number.isFinite(body.angle),`trial ${trial}`).toBe(true);expect(Math.abs(body.velocity.x)).toBeLessThan(30);expect(Math.abs(body.angularVelocity)).toBeLessThan(.5);
   if(body.position.y<660&&body.speed<.3){settled++;expect(body.bounds.max.y).toBeLessThan(640);}
   if(Math.abs(body.angle-angle)>.1)rotated++;
   Matter.Composite.clear(engine.world,false);Matter.Engine.clear(engine);
  }
  expect(settled).toBeGreaterThanOrEqual(80);expect(rotated).toBeGreaterThan(10);
 },20000);
 it('stacking on a ledge creates real torque and eventual collapse rather than locking the lower body',()=>{
  const engine=Matter.Engine.create({enableSleeping:true,positionIterations:10,velocityIterations:8});engine.gravity.scale=.00072;
  const ground=Matter.Bodies.rectangle(300,660,40,42,{isStatic:true}),lower=createBuilding(BUILDINGS[1],310,580),heavy=createBuilding(BUILDINGS[0],338,430);Matter.Composite.add(engine.world,[ground,lower,heavy]);let tilt=0;for(let tick=0;tick<1200;tick++){Matter.Engine.update(engine,1000/120);tilt=Math.max(tilt,Math.abs(lower.angle));}
  expect(tilt).toBeGreaterThan(.15);expect(heavy.position.y).toBeGreaterThan(650);
 });
});
