import { describe, it, expect } from 'vitest';
import { ChargePractice } from '../../src/games/game019/ChargePractice';
import { STEP, type Direction } from '../../src/games/game019/chargeTypes';
function jump(p: ChargePractice, ms: number, d: Direction, airRight = false) { p.direction(d); expect(p.run.beginCharge()).toBe(true); for (let i = 0; i < Math.round(ms / 1000 / STEP); i++) p.update(STEP); expect(p.run.releaseCharge()).toBe(true); if (airRight) p.direction(1); for (let i = 0; i < 2400 && !p.run.player.grounded; i++) p.update(STEP); }
describe('Game019 isolated charge practice', () => {
  it('requires actual charge and landing for all seven lessons, including short preparation', () => {
    const passes: number[] = []; const p = new ChargePractice(i => passes.push(i));
    const cases: [number, Direction][] = [[80,0],[450,0],[700,0],[450,-1],[450,1],[450,-1]];
    for (let i=0;i<6;i++) { expect(p.stage).toBe(i); expect(p.next()).toBe(false); jump(p,...cases[i], i===5); expect(p.passed).toBe(true); expect(p.next()).toBe(true); }
    jump(p,700,-1); expect(p.passed).toBe(false);
    // Restart only this test's independent fixture; a failed practice still physically continues in production.
    const fresh = new ChargePractice(); for(let i=0;i<6;i++){jump(fresh,...cases[i],i===5);fresh.next();}
    jump(fresh,80,1); expect(fresh.passed).toBe(false); jump(fresh,700,-1); expect(fresh.passed).toBe(true); expect(fresh.next()).toBe(true); expect(fresh.complete).toBe(true);
    expect(passes).toEqual([0,1,2,3,4,5]); expect(fresh.run.wellCleared).toBe(false); expect(fresh.run.clear).toBe(false);
  });
  it('reading, cancelling, or the wrong power does not pass a lesson', () => {
    const p=new ChargePractice(); p.run.beginCharge();p.run.update(.1);p.run.cancelCharge();expect(p.passed).toBe(false);jump(p,700,0);expect(p.passed).toBe(false);expect(p.next()).toBe(false);
  });
  it('no-air lesson requires trying the opposite direction after release', () => {
    const p=new ChargePractice(); const cases: [number,Direction][]=[[80,0],[450,0],[700,0],[450,-1],[450,1]];
    for(const c of cases){jump(p,...c);p.next();}jump(p,450,-1);expect(p.passed).toBe(false);
  });
});
