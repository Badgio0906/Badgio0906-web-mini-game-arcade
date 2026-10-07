import { describe, it, expect, vi } from 'vitest';
import { Mines, counts, neighbors, candidate, deductions, solve, verifyProof, generate, GENERATOR, type Proof } from '../../src/games/game025/Mines';
import { snapshot, restore, SaveStore, reportResult } from '../../src/games/game025/Save';
import fallbacks from '../../src/games/game025/fallbacks.json';
const boardAt = (start = 40) => { const b = new Mines('beginner'), data = fallbacks[start]; expect(b.initialize(data.mines, start, data.proof as Proof)).toBe(true); return b; };
describe('game025 standard fixed mines', () => {
  it('correct eight neighbors on corners, edges, middle and 1–8 counts', () => {
    expect(neighbors(0,9,9)).toEqual([1,9,10]); expect(neighbors(4,9,9)).toHaveLength(5); expect(neighbors(40,9,9)).toHaveLength(8);
    const m = Array(81).fill(false); neighbors(40,9,9).forEach(i => m[i] = true); expect(counts(m,9,9)[40]).toBe(8);
    for(let n=1;n<=8;n++){ const mines=Array(81).fill(false);neighbors(40,9,9).slice(0,n).forEach(i=>mines[i]=true);expect(counts(mines,9,9)[40]).toBe(n); }
  });
  it('exact mine totals and safe first click plus all valid neighbors in both modes', () => {
    for(const d of ['beginner','intermediate'] as const) for(const start of [0,8,40,80]){ const b=new Mines(d), m=candidate(d,start,1234+start); expect(m.filter(Boolean)).toHaveLength(b.total); expect(m[start]).toBe(false);expect(neighbors(start,b.width,b.height).every(i=>!m[i])).toBe(true); }
  });
  it('flags before initialization do not initialize and flagged opening is ignored', () => { const b = new Mines('beginner'); expect(b.act('flag',40)).toBe(true); expect(b.act('open',40)).toBe(false); expect(b.initialized).toBe(false); });
  it('zero expansion skips user flags and never changes mines', () => { const b=boardAt();b.act('flag',39);const original=[...b.mines];b.act('open',40);expect(b.opened[40]).toBe(true);expect(b.opened[39]).toBe(false);expect(b.openedCount).toBeGreaterThan(1);expect(b.mines).toEqual(original);b.act('flag',39);b.act('open',39);expect(b.opened[39]).toBe(true); });
  it('all safe opens win once, flags alone never win', () => { const b=boardAt();b.mines.forEach((m,i)=>{if(m)b.act('flag',i);});expect(b.outcome).toBe('active'); b.mines.forEach((m,i)=>{if(!m)b.act('open',i);});expect(b.outcome).toBe('won');const count=b.history.length;expect(b.act('flag',0)).toBe(false);expect(b.history).toHaveLength(count); });
  it('mine opens lose once and further actions are rejected',()=>{const b=boardAt();b.act('open',40);b.act('open',b.mines.indexOf(true));expect(b.outcome).toBe('lost');const count=b.history.length;expect(b.act('open',1)).toBe(false);expect(b.history).toHaveLength(count);});
  it('correct flags chord safe cells; wrong equal-count flags can lose',()=>{
    let demonstrated=false;
    for(const data of fallbacks){const b=boardAt(data.proof.start);b.act('open',data.proof.start);
      const cell=b.numbers.findIndex((n,i)=>b.opened[i]&&n>0&&neighbors(i,9,9).filter(j=>!b.opened[j]&&!b.mines[j]).length>=n&&neighbors(i,9,9).some(j=>b.mines[j]));if(cell<0)continue;
      const good=boardAt(data.proof.start);good.act('open',data.proof.start);neighbors(cell,9,9).filter(j=>good.mines[j]).forEach(j=>good.act('flag',j));good.act('chord',cell);expect(good.outcome).not.toBe('lost');
      neighbors(cell,9,9).filter(j=>!b.opened[j]&&!b.mines[j]).slice(0,b.numbers[cell]).forEach(j=>b.act('flag',j));expect(b.act('chord',cell)).toBe(true);expect(b.outcome).toBe('lost');demonstrated=true;break;
    }expect(demonstrated).toBe(true);
  });
});
describe('game025 visible-state deduction and fallback proof',()=>{
  it('all 81 own fallback starts have complete matching replayable proof',()=>{ expect(fallbacks).toHaveLength(81);fallbacks.forEach((r,i)=>{expect(r.proof.start).toBe(i);expect(r.proof.generator).toBe(GENERATOR);expect(verifyProof('beginner',r.mines,r.proof as Proof)).toBe(true);expect(r.mines.filter(Boolean)).toHaveLength(10);expect(neighbors(i,9,9).every(j=>!r.mines[j])).toBe(true); }); });
  it('ambiguous public fixture gives no proven safe or mine cells',()=>{expect(deductions({width:2,height:2,total:1,cells:[1,null,null,null]})).toEqual([]);});
  it('an original ambiguous candidate is not claimed verified',()=>{let ambiguous=false;for(let seed=0;seed<1000;seed++){const proof=solve('beginner',candidate('beginner',0,seed),0);if(!proof.verified){ambiguous=true;expect(verifyProof('beginner',candidate('beginner',0,seed),proof)).toBe(false);break;}}expect(ambiguous).toBe(true);});
  it('the solver public projection contains no hidden board or flags',()=>{const b=boardAt();b.act('open',40);const before=deductions(b.visible()); b.act('flag',b.mines.indexOf(true));expect(deductions(b.visible())).toEqual(before);expect(Object.keys(b.visible()).sort()).toEqual(['cells','height','total','width']);});
  it('logical hint identifies safe user flag without trusting it as truth',()=>{const b=boardAt();b.act('flag',39);b.act('open',40);expect(deductions(b.visible()).some(d=>d.cell===39&&d.kind==='safe')).toBe(true);});
  it('bounded generation reports failure without falsely verifying',()=>{expect(generate('beginner',0,0,0,0)).toBe(null);});
  it('clicked start cannot differ from the independently valid proof start',()=>{const r=fallbacks[0];const b=new Mines('beginner');expect(b.initialize(r.mines,5,r.proof as Proof)).toBe(false);});
  it('proof mismatch, translated start and tampering are rejected',()=>{const r=fallbacks[40];expect(verifyProof('beginner',r.mines,{...r.proof,start:0} as Proof)).toBe(false);expect(verifyProof('beginner',r.mines,{...r.proof,steps:[]} as Proof)).toBe(false);});
});
describe('game025 atomic validated snapshot',()=>{
  const stats={won:0,lost:0,reported:[]};
  it('replays all active flags/opened/history and proof, elapsed and same run id',()=>{const b=boardAt();b.act('flag',39);b.act('open',40);const s=snapshot(b,12345,2,'12345678-1234-4123-8123-123456789abc',false,stats);const r=restore(s);expect(r?.board.opened).toEqual(b.opened);expect(r?.board.flags).toEqual(b.flags);expect(r?.saved.runId).toBe('12345678-1234-4123-8123-123456789abc');expect(r?.saved.elapsedMs).toBe(12345);});
  it('empty flagged state restores with no initialized board',()=>{const b=new Mines('beginner');b.act('flag',3);expect(restore(snapshot(b,30,0,'12345678-1234-4123-8123-123456789abc',false,stats))?.board.flags[3]).toBe(true);});
  it('rejects mismatched counts, flags, outcome, first start, history and versions',()=>{const b=boardAt();b.act('open',40);const original=snapshot(b,0,0,'12345678-1234-4123-8123-123456789abc',false,stats);for(const mutate of [(s:any)=>s.board.numbers[0]++, (s:any)=>s.board.flags[40]=true, (s:any)=>s.board.outcome='won',(s:any)=>s.board.start=0,(s:any)=>s.board.history.push({type:'open',cell:999}),(s:any)=>s.rules_version='2',(s:any)=>s.elapsedMs=-1,(s:any)=>s.game_id='game024',(s:any)=>s.stats.reported=['12345678-1234-4123-8123-123456789abc']]){const s=structuredClone(original);mutate(s);expect(restore(s)).toBe(null);}});
  it('won/lost snapshot requires atomic report ledger and restores no new result',()=>{for(const outcome of ['won','lost']){const b=boardAt();b.act('open',40);if(outcome==='lost')b.act('open',b.mines.indexOf(true));else b.mines.forEach((m,i)=>{if(!m)b.act('open',i);});const stats={won:outcome==='won'?1:0,lost:outcome==='lost'?1:0,reported:['12345678-1234-4123-8123-123456789abc']};const s=snapshot(b,100,0,'12345678-1234-4123-8123-123456789abc',true,stats);expect(restore(s)?.board.outcome).toBe(outcome);expect(restore({...s,reported:false})).toBe(null);}});
});

describe('game025 blocked snapshot storage',()=>{
  it('retains the current memory snapshot after denied writes against valid stale reads',()=>{
    const b=new Mines('beginner'),old=snapshot(b,0,0,'12345678-1234-4123-8123-123456789abc',false,{won:0,lost:0,reported:[]});
    vi.stubGlobal('localStorage',{getItem:()=>JSON.stringify(old),setItem:()=>{throw new Error('write denied');}});
    try{const store=new SaveStore();store.write({...old,hints:7});expect(store.read()?.saved.hints).toBe(7);}finally{vi.unstubAllGlobals();}
  });
});

describe('game025 unavailable observer does not gate result statistics',()=>{
  it('saves/reloads a won board with null observer ID and stable local result ID, once only',()=>{
    const b=boardAt();b.act('open',40);b.mines.forEach((mine,i)=>{if(!mine)b.act('open',i);});
    const localId='87654321-4321-4321-8321-abcdef123456';
    const stats=reportResult(b,localId,{won:0,lost:0,reported:[]});expect(stats.won).toBe(1);
    const saved=snapshot(b,123,0,null,true,stats,localId);const reloaded=restore(saved);
    expect(reloaded?.saved.runId).toBe(null);expect(reloaded?.saved.resultId).toBe(localId);expect(reloaded?.saved.reported).toBe(true);expect(reloaded?.board.outcome).toBe('won');
    expect(reportResult(reloaded!.board,localId,reloaded!.saved.stats).won).toBe(1);
    expect(restore({...saved,resultId:null})).toBe(null);expect(restore({...saved,save_version:1})).toBe(null);
  });
  it('saves/reloads a lost null-observer board and keeps its report ledger independent',()=>{
    const b=boardAt();b.act('open',40);b.act('open',b.mines.indexOf(true));const resultId='abcdef12-abcd-4123-8123-abcdef123456';
    const stats=reportResult(b,resultId,{won:0,lost:0,reported:[]});const reloaded=restore(snapshot(b,20,0,null,true,stats,resultId));
    expect(reloaded?.saved.stats.lost).toBe(1);expect(reloaded?.board.outcome).toBe('lost');expect(reportResult(reloaded!.board,resultId,reloaded!.saved.stats).lost).toBe(1);
  });
});

describe('game025 paused generated first-open save',()=>{
  it('replays a prepared board without revealing it, preserving the exact deferred first open',()=>{
    const b=boardAt(5),id='12345678-1234-4123-8123-123456789abc';
    const s=snapshot(b,17,0,id,false,{won:0,lost:0,reported:[]},id,5);const loaded=restore(s);
    expect(loaded?.saved.firstOpenPending).toBe(5);expect(loaded?.board.openedCount).toBe(0);expect(loaded?.board.history).toEqual([]);
    expect(restore({...s,runId:null,resultId:null})).toBe(null);expect(restore({...s,firstOpenPending:0})).toBe(null);expect(restore({...s,firstOpenPending:null})).toBe(null);
    loaded!.board.act('open',loaded!.saved.firstOpenPending!);expect(loaded!.board.opened[5]).toBe(true);
  });
});
