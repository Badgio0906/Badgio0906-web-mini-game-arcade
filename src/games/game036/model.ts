/** Game036 MOCHI DROP: pure falling-pair chain model. Rendering, audio and storage stay outside. */
export const COLS=6,ROWS=13,COLORS=4,STAR=4,EMPTY=-1,GROUP=4,STAR_NEED=32,ALL_CLEAR_BONUS=2000,MAX_LEVEL=15;
export const POP_MS=420,SETTLE_BASE_MS=70,SETTLE_ROW_MS=34,LOCK_MS=420,SOFT_MS=34,MAX_SCORE=99_999_999;
export const SPAWN={x:2,y:1} as const;
export type Phase='drop'|'settle'|'pop'|'over';
export interface Piece {x:number;y:number;rot:number;a:number;b:number;}
export interface PopEvent {type:'pop';chain:number;count:number;gain:number;star:boolean;cells:{x:number;y:number;color:number}[];}
export type MochiEvent=PopEvent|{type:'land';hard:boolean}|{type:'allclear';gain:number}|{type:'star-ready'}|{type:'over'}|{type:'spawn'}|{type:'move'}|{type:'rotate'};
export interface MochiState {
 rules_version:'1';practice:boolean;seed:number;board:number[];piece:Piece|null;queue:[number,number][];phase:Phase;timer:number;gravity:number;
 drops:number[];popping:number[];chain:number;score:number;popped:number;level:number;gauge:number;maxChain:number;pieces:number;allClears:number;stars:number;seconds:number;soft:boolean;
 events:MochiEvent[];
}
const OFFSET=[[0,-1],[1,0],[0,1],[-1,0]] as const;
export const index=(x:number,y:number)=>y*COLS+x;
export const chainPower=(chain:number)=>chain*(chain+1)/2;
export const gravityMs=(level:number)=>Math.max(160,Math.round(900*.88**(level-1)));
/** mulberry32; returns [value in 0..1, next seed] so the run stays reproducible across saves. */
function random(seed:number):[number,number]{let t=(seed+0x6d2b79f5)>>>0;const next=t;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return [((t^t>>>14)>>>0)/4294967296,next];}
function pair(s:MochiState,colors=COLORS):[number,number]{const [a,s1]=random(s.seed),[b,s2]=random(s1);s.seed=s2;return [Math.floor(a*colors),Math.floor(b*colors)];}
export function subCell(p:Piece):{x:number;y:number}{const [dx,dy]=OFFSET[p.rot];return {x:p.x+dx,y:p.y+dy};}
export function pieceCells(p:Piece):{x:number;y:number;color:number}[]{const s=subCell(p);return [{x:p.x,y:p.y,color:p.a},{x:s.x,y:s.y,color:p.b}];}
const free=(board:number[],x:number,y:number)=>x>=0&&x<COLS&&y>=0&&y<ROWS&&board[index(x,y)]===EMPTY;
const fits=(board:number[],p:Piece)=>pieceCells(p).every(c=>free(board,c.x,c.y));
export function createMochi(practice=false,seed=(Date.now()^Math.floor(Math.random()*0x7fffffff))>>>0):MochiState{
 const s:MochiState={rules_version:'1',practice,seed:seed>>>0,board:Array(COLS*ROWS).fill(EMPTY),piece:null,queue:[],phase:'drop',timer:0,gravity:0,drops:Array(COLS*ROWS).fill(0),popping:[],chain:0,score:0,popped:0,level:1,gauge:0,maxChain:0,pieces:0,allClears:0,stars:0,seconds:0,soft:false,events:[]};
 if(practice){practiceBoard(s.board);s.queue=[[0,0],[0,0]];}else s.queue=[pair(s,3),pair(s,3)];
 spawn(s);s.events=[];return s;
}
/** Two-step staircase: drop the pink pair beside the pinks and the yellows fall into the second pop. */
export function practiceBoard(board:number[]):void{board.fill(EMPTY);const put=(x:number,y:number,c:number)=>{board[index(x,y)]=c;};put(0,12,2);put(0,11,2);put(0,10,1);put(1,12,0);put(1,11,0);put(1,10,2);put(1,9,2);}
function spawn(s:MochiState):void{
 const [a,b]=s.queue.shift()!;s.queue.push(s.practice?[0,0]:pair(s));
 const p={x:SPAWN.x,y:SPAWN.y,rot:0,a,b};
 if(!fits(s.board,p)){s.piece=null;s.phase='over';s.events.push({type:'over'});return;}
 s.piece=p;s.phase='drop';s.gravity=0;s.timer=0;s.events.push({type:'spawn'});
}
export function move(s:MochiState,dx:number):boolean{if(s.phase!=='drop'||!s.piece)return false;const p={...s.piece,x:s.piece.x+dx};if(!fits(s.board,p))return false;s.piece=p;s.events.push({type:'move'});return true;}
/** Rotate with side kicks, a floor kick and a quick 180 turn inside one-column wells. */
export function rotate(s:MochiState,dir:1|-1):boolean{
 if(s.phase!=='drop'||!s.piece)return false;const base=s.piece;
 for(const turn of [dir,dir*2]){const rot=(base.rot+turn+8)%4,[ox,oy]=OFFSET[rot];
  for(const [kx,ky] of [[0,0],[-ox,-oy]]){const p={...base,rot,x:base.x+kx,y:base.y+ky};if(fits(s.board,p)){s.piece=p;s.events.push({type:'rotate'});return true;}}}
 return false;
}
export function canFall(s:MochiState):boolean{return !!s.piece&&fits(s.board,{...s.piece,y:s.piece.y+1});}
export function hardDrop(s:MochiState):boolean{if(s.phase!=='drop'||!s.piece)return false;while(canFall(s))s.piece.y++;lock(s,true);return true;}
function lock(s:MochiState,hard:boolean):void{
 const p=s.piece!;for(const c of pieceCells(p))s.board[index(c.x,c.y)]=c.color;
 s.piece=null;s.pieces++;s.chain=0;s.soft=false;s.events.push({type:'land',hard});beginSettle(s);
}
/** Column gravity. Returns rows fallen per destination cell for the landing animation. */
export function collapse(board:number[]):number[]{const drops=Array(COLS*ROWS).fill(0);
 for(let x=0;x<COLS;x++){let to=ROWS-1;for(let y=ROWS-1;y>=0;y--){const c=board[index(x,y)];if(c===EMPTY)continue;board[index(x,y)]=EMPTY;board[index(x,to)]=c;drops[index(x,to)]=to-y;to--;}}
 return drops;
}
function beginSettle(s:MochiState):void{s.drops=collapse(s.board);const most=Math.max(0,...s.drops);s.phase='settle';s.timer=most?SETTLE_BASE_MS+most*SETTLE_ROW_MS:0;}
/** Konpeito stars clear every mochi of the flavour they land on (below, then sides, then the most common). */
export function starTarget(board:number[],x:number,y:number):number|null{
 for(const [nx,ny] of [[x,y+1],[x-1,y],[x+1,y],[x,y-1]]){if(nx<0||nx>=COLS||ny<0||ny>=ROWS)continue;const c=board[index(nx,ny)];if(c>=0&&c<COLORS)return c;}
 const counts=Array(COLORS).fill(0);for(const c of board)if(c>=0&&c<COLORS)counts[c]++;const best=Math.max(...counts);return best>0?counts.indexOf(best):null;
}
/** Cells removed by the next resolution step: stars first, otherwise every orthogonal group of four or more below the hidden row. */
export function findPops(board:number[]):{cells:number[];star:boolean}{
 const stars=board.flatMap((c,i)=>c===STAR?[i]:[]);
 if(stars.length){const out=new Set(stars);for(const i of stars){const target=starTarget(board,i%COLS,Math.floor(i/COLS));if(target!==null)board.forEach((c,j)=>{if(c===target)out.add(j);});}return {cells:[...out].sort((a,b)=>a-b),star:true};}
 const seen=new Set<number>(),cells:number[]=[];
 for(let i=COLS;i<board.length;i++){const color=board[i];if(color<0||color>=COLORS||seen.has(i))continue;const group=[i],stack=[i];seen.add(i);
  while(stack.length){const j=stack.pop()!,x=j%COLS,y=Math.floor(j/COLS);for(const [nx,ny] of [[x+1,y],[x-1,y],[x,y+1],[x,y-1]]){if(nx<0||nx>=COLS||ny<1||ny>=ROWS)continue;const k=index(nx,ny);if(!seen.has(k)&&board[k]===color){seen.add(k);group.push(k);stack.push(k);}}}
  if(group.length>=GROUP)cells.push(...group);}
 return {cells:cells.sort((a,b)=>a-b),star:false};
}
/** Synchronous resolve shared by the landing preview and tests. */
export function resolveAll(board:number[]):{chain:number;popped:number}{let chain=0,popped=0;for(let guard=0;guard<40;guard++){collapse(board);const pops=findPops(board);if(!pops.cells.length)break;chain++;popped+=pops.cells.length;for(const i of pops.cells)board[i]=EMPTY;}return {chain,popped};}
/** Where the current pair would land and how many chain steps that placement starts. */
export function predict(s:MochiState):{cells:{x:number;y:number;color:number}[];chain:number}|null{
 if(s.phase!=='drop'||!s.piece)return null;const board=[...s.board],cells:{x:number;y:number;color:number}[]=[];
 for(const c of pieceCells(s.piece).sort((a,b)=>b.y-a.y)){let y=c.y;while(free(board,c.x,y+1))y++;board[index(c.x,y)]=c.color;cells.push({x:c.x,y,color:c.color});}
 return {cells,chain:resolveAll(board).chain};
}
function finishResolution(s:MochiState):void{
 if(s.chain>0&&s.board.every(c=>c===EMPTY)){const gain=ALL_CLEAR_BONUS*(s.practice?0:1);s.score=Math.min(MAX_SCORE,s.score+gain);s.allClears++;s.events.push({type:'allclear',gain});}
 s.chain=0;spawn(s);
}
function resolve(s:MochiState):void{
 const pops=findPops(s.board);if(!pops.cells.length){finishResolution(s);return;}
 s.chain++;s.maxChain=Math.max(s.maxChain,s.chain);const count=pops.cells.length,gain=s.practice?0:count*10*chainPower(s.chain);s.score=Math.min(MAX_SCORE,s.score+gain);
 if(pops.star)s.stars++;else{s.popped+=count;s.level=Math.min(MAX_LEVEL,1+Math.floor(s.popped/40));if(!s.practice){s.gauge+=count;if(s.gauge>=STAR_NEED){s.gauge=0;s.queue[0]=[s.queue[0][0],STAR];s.events.push({type:'star-ready'});}}}
 s.popping=pops.cells;s.phase='pop';s.timer=POP_MS;s.events.push({type:'pop',chain:s.chain,count,gain,star:pops.star,cells:pops.cells.map(i=>({x:i%COLS,y:Math.floor(i/COLS),color:s.board[i]}))});
}
/** Advance by real milliseconds (paused time is never passed in). */
export function stepMochi(s:MochiState,ms:number):void{
 if(s.phase==='over')return;s.seconds+=ms/1000;
 if(s.phase==='drop'&&s.piece){s.gravity+=ms;const grounded=!canFall(s),limit=s.soft?SOFT_MS:grounded?Math.max(LOCK_MS,gravityMs(s.level)):gravityMs(s.level);
  if(s.gravity>=limit){s.gravity=0;if(grounded)lock(s,false);else s.piece.y++;}return;}
 s.timer-=ms;if(s.timer>0)return;
 if(s.phase==='pop'){for(const i of s.popping)s.board[i]=EMPTY;s.popping=[];beginSettle(s);if(s.timer<=0)resolve(s);return;}
 if(s.phase==='settle'){s.drops.fill(0);resolve(s);}
}
export function setSoft(s:MochiState,on:boolean):void{s.soft=on&&s.phase==='drop';if(on&&s.piece&&!canFall(s))s.gravity=SOFT_MS;}
