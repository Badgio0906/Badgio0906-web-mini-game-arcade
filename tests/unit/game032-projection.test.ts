import {describe,it,expect} from 'vitest';
import {riverProjection} from '../../src/games/game032/Projection';
describe('river artwork and casting coordinates',()=>{
 for(const [w,h] of [[980,441],[362,363],[292,265],[808,210]])it(`${w}x${h}: all casts visibly land inside generated water`,()=>{
  for(const x of [.14,.38,.63,.86]){const p=riverProjection(w,h,1536,1024,x);expect(p.sx).toBeGreaterThanOrEqual(0);expect(p.sx+p.sw).toBeLessThanOrEqual(1536);expect(p.sy).toBeGreaterThanOrEqual(0);expect(p.sy+p.sh).toBeLessThanOrEqual(1024);expect(p.castY(0)).toBeGreaterThan(p.castY(1));for(const power of [0,.3,.5,.8,1]){const y=p.castY(power);expect(y).toBeGreaterThan(0);expect(y).toBeLessThan(h);const sourceY=p.sy+y/h*p.sh;expect(sourceY).toBeGreaterThanOrEqual(1024*.44);expect(sourceY).toBeLessThanOrEqual(1024*.69);}}
 });
});
