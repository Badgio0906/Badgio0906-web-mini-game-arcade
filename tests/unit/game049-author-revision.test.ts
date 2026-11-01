import {it,expect} from 'vitest';import {chart} from '../../src/games/game049/model';
it('author revision never requires simultaneous-pad notes',()=>{expect(chart().every(n=>n.kind==='L'||n.kind==='R')).toBe(true);});
import {createSong,strike,songAdvance} from '../../src/games/game049/model';
function perform(seed:number){const s=createSong(seed);for(const n of s.notes)strike(s,n.kind,n.t);songAdvance(s,50.6);return s;}
it('eight combo guarantees first cosmetic change; later changes are seeded and scoring-neutral',()=>{const a=perform(4902),b=perform(4902),c=perform(4903);expect(a.formLog).toEqual(b.formLog);expect(a.score).toBe(c.score);expect(a.maxTension).toBe(4);expect(a.formLog[0].combo).toBe(8);expect(new Set(a.formLog.map(x=>x.form)).size).toBeGreaterThanOrEqual(2);expect(a.notes.every(n=>n.result==='PERFECT')).toBe(true);});
it('miss lowers tension while keeping the acquired costume; new runs reset changes',()=>{const s=perform(4902),form=s.form;strike(s,'L',51);expect(s.form).toBe(form);expect(s.tension).toBe(3);expect(createSong().form).toBe('base');expect(createSong().formLog).toHaveLength(0);});
