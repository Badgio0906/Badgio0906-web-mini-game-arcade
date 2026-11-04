import {describe,it,expect} from 'vitest';
import {StampRun,RUN_SECONDS,MAX_RUN_SECONDS} from '../../src/games/game009/StampRun';
function advance(r:StampRun,seconds=.75){for(let i=0;i<seconds/.05;i++)r.step(.05);}
function solve(r:StampRun){for(const a of r.snapshot().puzzle.actions)r.interact(a.id);r.pick(r.inspection().matchingIds[0]);}
describe('stamp continuous timed score chase',()=>{
 it('rewards a streak with time and score multiplier, resets on a forgiving wrong answer',()=>{const r=new StampRun(()=>{},()=>0);r.start();expect(r.snapshot().remaining).toBe(RUN_SECONDS);solve(r);advance(r);const before=r.snapshot().remaining;solve(r);expect(r.snapshot().remaining).toBeCloseTo(before+2);expect(r.snapshot().multiplier).toBe(1.25);advance(r);const wrong=r.snapshot().objects.find(o=>o.kind!==r.snapshot().request.kind)!;const time=r.snapshot().remaining;r.pick(wrong.id);expect(r.snapshot()).toMatchObject({alive:true,multiplier:1,errors:1});expect(r.snapshot().remaining).toBeCloseTo(time-2);});
 it('caps the entire run even when the player keeps finding objects quickly',()=>{const r=new StampRun(()=>{},()=>0);r.start();for(let i=0;i<200&&r.snapshot().alive;i++){solve(r);advance(r);}expect(r.snapshot().alive).toBe(false);expect(r.result()?.time).toBeCloseTo(MAX_RUN_SECONDS,1);expect(r.result()?.correct).toBeGreaterThan(20);});
 it('leaves practice without scoring, bonuses, or a deadline',()=>{const r=new StampRun();r.start(true);advance(r,MAX_RUN_SECONDS+5);solve(r);advance(r);solve(r);advance(r);expect(r.snapshot()).toMatchObject({practiceDone:true,score:0,remaining:RUN_SECONDS});expect(r.result()).toBeNull();});
});
