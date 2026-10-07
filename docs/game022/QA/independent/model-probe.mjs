import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { createServer } from '/workspace/classic-author-022/node_modules/vite/dist/node/index.js';
const server=await createServer({root:'/workspace/classic-author-022',server:{middlewareMode:true},appType:'custom'});
const checks=[];
try{
 const m=await server.ssrLoadModule('/src/games/game022/Klondike.ts');
 const p=await server.ssrLoadModule('/src/games/game022/persistence.ts');
 const check=(name,fn)=>{fn();checks.push(name);};
 const integrity=g=>{assert(m.validPosition(g.position));assert.equal(new Set(m.cardsIn(g.position)).size,52);};
 check('500 independent seeded draw1/draw3 histories: identity conservation and exact snapshot restoration',()=>{
  for(const draw of [1,3])for(let seed=4000;seed<4250;seed++){
   const g=new m.Klondike(`independent-${seed}`,draw);
   for(let step=0;step<40;step++){
    const visible=g.visibleMoves();
    if(step%11===0&&g.history.length){const previous=structuredClone(g.history.at(-1));assert(g.undo());assert.deepEqual(g.position,previous);}
    else if(step%4&&visible.length){const move=visible[(seed+step)%visible.length];assert(g.move(move.source,move.destination));}
    else g.drawStock();
    integrity(g);assert.deepEqual(m.Klondike.restore(g.snapshot()).snapshot(),g.snapshot());
   }
  }
 });
 check('dry-run proof completes independently constructed fully-visible alternating 52-card tableau',()=>{
  const g=new m.Klondike('all-visible');
  const suits=[[0,1,3,2],[1,0,2,3]];
  g.position={tableau:Array.from({length:7},(_,c)=>c<4?Array.from({length:13},(_,i)=>({card:suits[i%2][c]*13+12-i,faceUp:true})):[]),stock:[],waste:[],foundations:[[],[],[],[]],moves:0};
  integrity(g);const before=structuredClone(g.position);const plan=g.finishPlan();assert.equal(plan.length,52);assert.deepEqual(g.position,before);assert(g.finishVisible());assert(g.cleared);integrity(g);
 });
 check('partial draw3 after two remaining cards: last drawn only, lower waste reveals and recycle order exact',()=>{
  const g=new m.Klondike('partial',3);
  g.position={tableau:Array.from({length:7},()=>[]),stock:[26,0],waste:Array.from({length:52},(_,i)=>i).filter(i=>i!==26&&i!==0),foundations:[[],[],[],[]],moves:0};
  integrity(g);const before=structuredClone(g.position);assert.equal(g.drawStock(),'draw');assert.deepEqual(g.stack({pile:'waste'}),[26]);
  assert(g.move({pile:'waste'},{pile:'foundation',column:2}));assert.deepEqual(g.stack({pile:'waste'}),[0]);
  assert(g.move({pile:'waste'},{pile:'foundation',column:0}));integrity(g);
  const remaining=g.position.waste.slice();assert.equal(g.drawStock(),'recycle');assert.deepEqual(g.position.stock,remaining.slice().reverse());
  assert(g.undo());assert.deepEqual(g.position.waste,remaining);assert(g.undo());assert(g.undo());assert(g.undo());assert.deepEqual(g.position,before);
 });
 check('visible hint unchanged by 250 independent hidden-card/stock permutations',()=>{
  for(let seed=0;seed<250;seed++){
   const g=new m.Klondike(`visible-${seed}`);g.drawStock();const expected=g.hint();
   const hidden=g.position.tableau.flat().filter(c=>!c.faceUp);const identities=[...hidden.map(c=>c.card),...g.position.stock];identities.reverse();
   hidden.forEach((card,i)=>{card.card=identities[i];});g.position.stock=identities.slice(hidden.length);
   integrity(g);assert.deepEqual(g.hint(),expected);
  }
 });
 check('daily ledger separates draw1/draw3 and counts each same-day mode once; reload flags atomic',()=>{
  let raw='';const backend={getItem:()=>raw,setItem:(_k,v)=>{raw=v;}};let store=new p.SolitaireStore(backend),stats={clears:0,dailyClears:[]};
  for(const draw of [1,3])for(let retry=0;retry<3;retry++){
   const date='2026-10-08',g=new m.Klondike(m.dailySeed(date,draw),draw,'daily',date);
   g.position={tableau:Array.from({length:7},()=>[]),stock:[],waste:[],foundations:m.SUITS.map((_,s)=>Array.from({length:13},(_,r)=>s*13+r)),moves:100};
   const outcome=store.reportClear(g.snapshot(),stats);stats=outcome.stats;assert.equal(outcome.added,retry===0);
   store=new p.SolitaireStore(backend);assert.equal(store.read().snapshot.reported,true);assert.equal(store.reportClear(store.read().snapshot,store.read().stats).added,false);
  }
  assert.equal(stats.clears,2);assert.equal(stats.dailyClears.length,2);
 });
 await writeFile('/workspace/arcade-classic-five/docs/game022/QA/independent/model-probe.json',JSON.stringify({at:new Date().toISOString(),provenance:'independent model simulation; not native browser or human play',checks},null,2)+'\n');console.log(JSON.stringify({checks:checks.length,allPassed:true}));
}finally{await server.close();}
