import {describe,it,expect} from 'vitest';
import {TowerRun} from '../../src/games/game003/TowerRun';
// v3 replaces automatic swinging and C-mode escalation with manual spatial construction.
describe('Tower v3 construction controls',()=>{
 it('lets the player inspect shape and freely position before release; waiting adds no hidden movement or score',()=>{const r=new TowerRun();r.start();r.move(340);r.rotate();const cargo={...r.cargo!};for(let n=0;n<300;n++)r.step(1/120);expect(r.cargo).toEqual(cargo);expect(r.snapshot()).toMatchObject({rulesVersion:3,pending:null,cMode:false,floors:0,bonusScore:0});expect(r.choose('challenge')).toBe(false);});
 it('returns exactly to the original orientation after four quarter turns, and starts a fresh run independently',()=>{const r=new TowerRun();r.start();for(let n=0;n<4;n++)expect(r.rotate()).toBe(true);expect(r.cargo!.rotation).toBeCloseTo(0);r.move(430);r.drop();r.start();expect(r.cargo).toMatchObject({x:300,rotation:0,id:0,shapeId:'long'});expect(r.snapshot().time).toBe(0);});
});
