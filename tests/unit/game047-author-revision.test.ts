import {it,expect} from 'vitest';import {map,visualSize} from '../../src/games/game047/model';
it('score visibly grows the snowman independently of mass',()=>{expect(visualSize(0)).toBe(16);expect(visualSize(16000)).toBeGreaterThan(visualSize(3000)*1.35);expect(visualSize(1e8)).toBeLessThanOrEqual(320);});
it('authored formations have distinct routes rather than rectangular piles',()=>{const a=map().filter(o=>o.kind==='snowman');expect(new Set(a.map(o=>o.y)).size).toBeGreaterThan(3);});
