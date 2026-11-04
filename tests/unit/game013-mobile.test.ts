import { describe, it, expect } from 'vitest';
// Public source is deliberately unbundled so existing legacy URLs remain stable.
// @ts-expect-error Static browser module has no declaration file.
import { rhythmChart, advanceRhythm, strikeRhythm, calibrationOffset, rhythmRank } from '../../public/games/tachibana-task-heaven/mobile-model.js';
import { readFileSync } from 'node:fs';
const stage=JSON.parse(readFileSync('public/games/tachibana-task-heaven/mobile-assets/stage_01.json','utf8'));
describe('Game013 single-stage rhythm',()=>{
 it('preserves all26 original stage1 response notes and scores at most2600',()=>{const s=rhythmChart(stage);expect(s.notes).toHaveLength(26);for(const n of s.notes)expect(strikeRhythm(s,n.channel,n.t)).toBe('PERFECT');expect(s.score).toBe(2600);expect(s.misses).toBe(0);expect(s.maxCombo).toBe(26);});
 it('applies late-input compensation before judgment',()=>{const s=rhythmChart(stage);s.offset=.12;const n=s.notes[0];expect(strikeRhythm(s,n.channel,n.t+.12)).toBe('PERFECT');expect(s.score).toBe(100);});
 it('does not award a note twice and consumes wrong-channel notes once',()=>{const s=rhythmChart(stage),n=s.notes[0];expect(strikeRhythm(s,4,n.t)).toBe('MISS');expect(strikeRhythm(s,n.channel,n.t)).toBe('MISS');expect(s.score).toBe(0);advanceRhythm(s,n.t+.5);expect(s.misses).toBe(2);});
 it('ignores input during demonstrations and counts omissions once',()=>{const s=rhythmChart(stage);expect(strikeRhythm(s,1,s.cues[0].t)).toBe('WAIT');expect(s.misses).toBe(0);advanceRhythm(s,s.duration);expect(s.misses).toBe(26);advanceRhythm(s,s.duration+1);expect(s.misses).toBe(26);});
 it('uses original good and ok windows and bounded median calibration',()=>{const s=rhythmChart(stage);expect(strikeRhythm(s,1,s.notes[0].t+.14)).toBe('GOOD');expect(strikeRhythm(s,1,s.notes[1].t+.23)).toBe('OK');expect(s.score).toBe(110);expect(calibrationOffset([101,105,99,102,800])).toBe(102);expect(calibrationOffset([900,800])).toBe(250);expect(rhythmRank(2600,26)).toBe('S');});
});
