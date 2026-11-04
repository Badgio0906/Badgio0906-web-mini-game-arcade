import { describe, it, expect } from 'vitest';
// @ts-expect-error Static browser module has no declaration file.
import { heartInterval, heartJudge, heartRank } from '../../public/games/finger-heart-challenge/mobile-model.js';
describe('Game014 timing score',()=>{
 it('gives100 at the heart midpoint and60 near its edge',()=>{expect(heartJudge('heart',.325,.65).points).toBe(100);expect(heartJudge('heart',.02,.65).points).toBe(60);expect(heartJudge('heart',.64,.65).points).toBe(60);});
 it('ends a scored run for other poses or an expired heart',()=>{for(const pose of ['peace','open','ok','fox','point','thumbs_up'])expect(heartJudge(pose,.325,.65).points).toBe(0);expect(heartJudge('heart',.65,.65).points).toBe(0);expect(heartJudge('heart',-.01,.65).points).toBe(0);});
 it('keeps five progressively faster stages and bounded25-hit points',()=>{expect([0,5,10,15,20,25].map(heartInterval)).toEqual([.65,.55,.45,.35,.25,.25]);expect(25*heartJudge('heart',.125,.25).points).toBe(2500);expect(heartRank(2500)).toBe('S');expect(heartRank(0)).toBe('D');});
});
