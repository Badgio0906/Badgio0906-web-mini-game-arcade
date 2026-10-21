import {describe,it,expect} from 'vitest';
import {createMochi,stepMochi,move,rotate,hardDrop,setSoft,predict,findPops,resolveAll,collapse,starTarget,chainPower,gravityMs,index,pieceCells,COLS,ROWS,EMPTY,STAR,STAR_NEED,ALL_CLEAR_BONUS,type MochiState} from '../../src/games/game036/model';
import {blankSave,validateSave,MochiStore} from '../../src/games/game036/save';
const empty=()=>Array(COLS*ROWS).fill(EMPTY);
const settle=(s:MochiState)=>{let n=0;while(s.phase!=='drop'&&s.phase!=='over'&&n++<2000)stepMochi(s,16);return n;};
const events=(s:MochiState)=>{const out=s.events;s.events=[];return out;};
describe('Game036 mochi drop rules',()=>{
 it('spawns at the top centre with a two-piece preview and is reproducible from the seed',()=>{const a=createMochi(false,42),b=createMochi(false,42);expect(a.piece).toMatchObject({x:2,y:1,rot:0});expect(a.queue).toHaveLength(2);expect(a).toEqual(b);expect(a.queue.flat().every(c=>c>=0&&c<3)).toBe(true);});
 it('moves inside walls, rotates with wall kicks and quick-turns in a one-column well',()=>{const s=createMochi(false,1);while(move(s,-1));expect(s.piece!.x).toBe(0);expect(rotate(s,-1)).toBe(true);expect(s.piece!.x).toBe(1);expect(pieceCells(s.piece!).every(c=>c.x>=0)).toBe(true);
  const w=createMochi(false,2);for(let y=1;y<ROWS;y++){w.board[index(1,y)]=3;w.board[index(3,y)]=3;}w.board[index(2,ROWS-1)]=3;expect(rotate(w,1)).toBe(true);expect(w.piece!.rot).toBe(2);});
 it('gravity drops one row per interval, waits a short lock grace and soft drop locks at once when grounded',()=>{const s=createMochi(false,3);stepMochi(s,gravityMs(1));expect(s.piece!.y).toBe(2);while(s.piece&&s.piece.y<ROWS-1)stepMochi(s,gravityMs(1));expect(s.phase).toBe('drop');stepMochi(s,300);expect(s.phase).toBe('drop');setSoft(s,true);stepMochi(s,1);expect(s.phase).not.toBe('drop');});
 it('splits a horizontal pair on uneven ground and pops orthogonal groups of four only below the hidden row',()=>{const b=empty();b[index(0,12)]=0;b[index(1,12)]=0;b[index(2,12)]=0;b[index(3,12)]=1;expect(findPops(b).cells).toEqual([]);b[index(0,11)]=0;expect(findPops(b).cells).toHaveLength(4);
  const hidden=empty();for(let x=0;x<4;x++)hidden[index(x,0)]=2;expect(findPops(hidden).cells).toEqual([]);
  const s=createMochi(false,4);s.board[index(3,12)]=1;s.piece={x:2,y:1,rot:1,a:0,b:2};hardDrop(s);settle(s);expect(s.board[index(2,12)]).toBe(0);expect(s.board[index(3,11)]).toBe(2);});
 it('practice staircase becomes a two-chain from the shown pink pair and the preview says so first',()=>{const s=createMochi(true,5);expect(findPops(s.board).cells).toEqual([]);move(s,-1);expect(predict(s)?.chain).toBe(0);move(s,1);expect(predict(s)?.chain).toBe(2);hardDrop(s);const log:number[]=[];for(let n=0;n<400&&s.phase!=='drop';n++){stepMochi(s,16);for(const e of events(s))if(e.type==='pop')log.push(e.chain);}expect(log).toEqual([1,2]);expect(s.maxChain).toBe(2);expect(s.score).toBe(0);});
 it('scores pops by triangular chain power and grants an all-clear bonus',()=>{expect([1,2,3,4,5].map(chainPower)).toEqual([1,3,6,10,15]);const s=createMochi(false,6);s.board[index(0,12)]=1;s.board[index(1,12)]=1;s.piece={x:2,y:1,rot:1,a:1,b:1};hardDrop(s);settle(s);expect(s.score).toBe(40+ALL_CLEAR_BONUS);expect(s.allClears).toBe(1);});
 it('fills the konpeito gauge, puts a star in the next pair and the star clears its whole flavour',()=>{const s=createMochi(false,7);s.gauge=STAR_NEED-4;s.board[index(0,12)]=2;s.board[index(1,12)]=2;s.piece={x:2,y:1,rot:1,a:2,b:2};hardDrop(s);settle(s);expect(s.gauge).toBe(0);expect(s.piece!.b).toBe(STAR);
  const b=empty();b[index(0,12)]=3;b[index(5,12)]=3;b[index(3,12)]=3;b[index(2,12)]=1;b[index(2,11)]=STAR;expect(starTarget(b,2,11)).toBe(1);b[index(3,11)]=3;b[index(2,12)]=EMPTY;collapse(b);expect(starTarget(b,2,12)).toBe(3);expect(findPops(b)).toEqual({cells:[index(0,12),index(2,12),index(3,11),index(3,12),index(5,12)].sort((x,y)=>x-y),star:true});});
 it('resolves cascades synchronously the same way as the timed steps',()=>{const s=createMochi(true,8);const board=[...s.board];board[index(2,12)]=0;board[index(2,11)]=0;expect(resolveAll(board).chain).toBe(2);expect(board.every(c=>c===EMPTY||c===1)).toBe(true);});
 it('ends only when the spawn cell is covered and stays bounded over long random play',()=>{for(let n=0;n<40;n++){const s=createMochi(false,1000+n);let guard=0;while(s.phase!=='over'&&guard++<4000){if(s.phase==='drop'){move(s,(n+s.pieces)%5-2);if(s.pieces%3)rotate(s,1);hardDrop(s);}settle(s);}expect(s.phase).toBe('over');expect(s.board[index(2,1)]!==EMPTY||s.board[index(2,0)]!==EMPTY).toBe(true);expect(Number.isFinite(s.score)).toBe(true);expect(s.level).toBeLessThanOrEqual(15);}});
});
describe('Game036 save',()=>{
 it('round-trips a mid-chain board and continues identically',()=>{const s=createMochi(false,9);s.board[index(0,12)]=1;s.board[index(1,12)]=1;s.piece={x:2,y:1,rot:1,a:1,b:1};hardDrop(s);stepMochi(s,100);s.events=[];const saved={...blankSave(),snapshot:s,reported:false,runId:'r'};const copy=validateSave(JSON.parse(JSON.stringify(saved)))!;expect(copy).toEqual(saved);settle(s);settle(copy.snapshot!);s.events=[];copy.snapshot!.events=[];expect(copy.snapshot).toEqual(s);});
 it('rejects practice, finished, malformed or inconsistent snapshots',()=>{const s=createMochi(false,10);for(const patch of [{practice:true},{phase:'over'},{board:[1]},{level:0},{queue:[[0,9],[0,0]]},{piece:null}])expect(validateSave({...blankSave(),snapshot:{...s,...patch},reported:false})).toBeNull();expect(validateSave({...blankSave(),snapshot:s,reported:true})).toBeNull();expect(validateSave({...blankSave(),best:-1})).toBeNull();});
 it('rejects a falling pair whose satellite is outside the board or overlaps a settled mochi',()=>{
  const edge=createMochi(false,12);edge.piece={x:COLS-1,y:ROWS-1,rot:1,a:0,b:1};
  expect(validateSave({...blankSave(),snapshot:edge,reported:false})).toBeNull();
  const collision=createMochi(false,13);collision.board[index(2,0)]=1;
  expect(validateSave({...blankSave(),snapshot:collision,reported:false})).toBeNull();
 });
 it('recovers valid records when only the unfinished snapshot is corrupt, without restoring a run',()=>{
  const broken={...blankSave(),best:4321,bestChain:5,runs:7,reported:false,runId:'unfinished',snapshot:{...createMochi(false,11),piece:null}};
  const store=new MochiStore({getItem:()=>JSON.stringify(broken),setItem:()=>{}});
  expect(store.read()).toEqual({...blankSave(),best:4321,bestChain:5,runs:7});
  const foreign=new MochiStore({getItem:()=>JSON.stringify({...broken,game_id:'game035'}),setItem:()=>{}});
  expect(foreign.read()).toEqual(blankSave());
 });
 it('keeps records in memory when storage writes are denied',()=>{const store=new MochiStore({getItem:()=>null,setItem:()=>{throw Error('denied');}});const saved={...blankSave(),best:4321,bestChain:5};store.write(saved);expect(store.read()).toEqual(saved);});
});
