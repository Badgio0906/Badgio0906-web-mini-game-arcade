import {describe,it,expect} from 'vitest';
import {riverProjection} from '../../src/games/game032/Projection';
describe('river artwork and casting coordinates',()=>{
 for(const [w,h] of [[980,441],[362,363],[292,265],[808,210]])it(`${w}x${h}: all casts visibly land inside generated water`,()=>{
  for(const x of [.14,.38,.63,.86]){const p=riverProjection(w,h,1536,1024,x);expect(p.sx).toBeGreaterThanOrEqual(0);expect(p.sx+p.sw).toBeLessThanOrEqual(1536);expect(p.sy).toBeGreaterThanOrEqual(0);expect(p.sy+p.sh).toBeLessThanOrEqual(1024);expect(p.castY(0)).toBeGreaterThan(p.castY(1));for(const power of [0,.3,.5,.8,1]){const y=p.castY(power);expect(y).toBeGreaterThan(0);expect(y).toBeLessThan(h);const sourceY=p.sy+y/h*p.sh;expect(sourceY).toBeGreaterThanOrEqual(1024*.44);expect(sourceY).toBeLessThanOrEqual(1024*.581);}}
 });
});

import {targetPoint,aimFromPoint} from '../../src/games/game032/Projection';
describe('direct water aiming shared landing coordinates',()=>{
 for(const [w,h] of [[932,441],[244,360],[188,280],[650,146]])it(`${w}x${h} preview/hit-test return the same selected point`,()=>{
  const p=riverProjection(w,h,1536,1024,.5);
  for(const x of [.06,.14,.38,.63,.86,.94])for(const power of [0,.15,.5,.85,1]){const point=targetPoint(x,power,w,p),selected=aimFromPoint(point.x,point.y,w,p);expect(selected).not.toBeNull();expect(selected!.x).toBeCloseTo(x,8);expect(selected!.power).toBeCloseTo(power,8);}
 });
 it('bank and invalid coordinates are not silently converted to water',()=>{const p=riverProjection(900,430,1536,1024,.5);for(const [x,y] of [[300,420],[-2,200],[300,-1],[Infinity,200],[NaN,200]])expect(aimFromPoint(x,y,900,p)).toBeNull();});
});

describe('source-backed water band stays visible in shallow and tall crops',()=>{
 for(const [w,h] of [[932,441],[244,360],[188,280],[650,146]])it(`${w}x${h} shows both river edges above foreground vegetation`,()=>{
 const p=riverProjection(w,h,1536,1024,.5);expect(p.waterNear-p.waterFar).toBeGreaterThan(20);
 for(const power of [0,.5,1]){const y=p.castY(power);const sourceY=p.sy+y/h*p.sh;expect(sourceY).toBeGreaterThanOrEqual(1024*.449);expect(sourceY).toBeLessThanOrEqual(1024*.581);}
 });
});

it('accepts browser sub-pixel edge rounding while keeping the bank outside selection',()=>{
 const p=riverProjection(936,441,1536,1024,.5);
 for(const y of [p.waterFar-.00003,p.waterNear+.00003])expect(aimFromPoint(600,y,936,p)).not.toBeNull();
 for(const y of [p.waterFar-1,p.waterNear+1])expect(aimFromPoint(600,y,936,p)).toBeNull();
 expect(aimFromPoint(600,p.waterFar-.00003,936,p)?.power).toBe(1);
 expect(aimFromPoint(600,p.waterNear+.00003,936,p)?.power).toBe(0);
});
