import {describe,expect,it} from 'vitest';
import {Mines,verifyProof,type Proof} from '../../src/games/game025/Mines';
import {snapshot,restore} from '../../src/games/game025/Save';
import mini from '../../src/games/game025/mini-fallbacks.json';
describe('game025 proven mini board and saved compatibility',()=>{
 it('every first cell has a five-mine 6x6 board with a complete public deduction proof',()=>{
  expect(mini).toHaveLength(36);
  mini.forEach((data,start)=>{
   const b=new Mines('mini');expect(b.width).toBe(6);expect(b.total).toBe(5);
   expect(data.proof.start).toBe(start);expect(verifyProof('mini',data.mines,data.proof as Proof)).toBe(true);
   expect(b.initialize(data.mines,start,data.proof as Proof)).toBe(true);b.act('open',start);expect(b.outcome).not.toBe('lost');
  });
 });
 it('roundtrips mini board, deferred first action and daily metadata without weakening proof checks',()=>{
  const b=new Mines('mini'),data=mini[15],id='12345678-1234-4123-8123-123456789abc';
  b.initialize(data.mines,15,data.proof as Proof);
  const s={...snapshot(b,123,0,null,false,{won:0,lost:0,reported:[]},id,15),boardMode:'daily' as const,dailyId:'2026-11-04'};
  const restored=restore(s);expect(restored?.board.width).toBe(6);expect(restored?.saved.firstOpenPending).toBe(15);expect(restored?.saved.dailyId).toBe('2026-11-04');
  expect(restore({...s,board:{...s.board,proof:null}})).toBeNull();
 });
});
