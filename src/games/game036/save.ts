import {COLS,ROWS,COLORS,STAR,EMPTY,MAX_LEVEL,MAX_SCORE,STAR_NEED,pieceCells,index,type MochiState} from './model';
export const SAVE_KEY='web-mini-arcade:v1:game036:state';
export interface MochiSave {game_id:'game036';rules_version:'1';best:number;bestChain:number;runs:number;snapshot:MochiState|null;runId:string|null;reported:boolean;}
export function blankSave():MochiSave{return {game_id:'game036',rules_version:'1',best:0,bestChain:0,runs:0,snapshot:null,runId:null,reported:true};}
const integer=(v:unknown,min:number,max:number):v is number=>typeof v==='number'&&Number.isInteger(v)&&v>=min&&v<=max;
const cell=(v:unknown)=>integer(v,EMPTY,STAR);
const color=(v:unknown,star=false)=>integer(v,0,star?STAR:COLORS-1);
function validMetadata(s:MochiSave):boolean{return !!s&&s.game_id==='game036'&&s.rules_version==='1'&&integer(s.best,0,MAX_SCORE)&&integer(s.bestChain,0,99)&&integer(s.runs,0,1e9)&&typeof s.reported==='boolean'&&(s.runId===null||typeof s.runId==='string'&&s.runId.length<100);}
// A broken unfinished board must not erase previously finalized local records.
function recoverRecords(v:unknown):MochiSave{const s=v as MochiSave;return validMetadata(s)?{...blankSave(),best:s.best,bestChain:s.bestChain,runs:s.runs}:blankSave();}
/** Accept only a coherent in-progress production board; anything odd falls back to a fresh title. */
export function validateSave(v:unknown):MochiSave|null{
 try{const s=v as MochiSave;if(!validMetadata(s))return null;
  const b=s.snapshot;if(!b)return s.reported?structuredClone(s):null;if(s.reported)return null;
  const size=COLS*ROWS;
  if(b.rules_version!=='1'||b.practice!==false||!integer(b.seed,0,0xffffffff)||!Array.isArray(b.board)||b.board.length!==size||!b.board.every(cell)||!Array.isArray(b.drops)||b.drops.length!==size||!b.drops.every(n=>integer(n,0,ROWS))||!Array.isArray(b.popping)||!b.popping.every(n=>integer(n,0,size-1)))return null;
  if(!['drop','settle','pop'].includes(b.phase)||!Number.isFinite(b.timer)||b.timer<-1000||b.timer>5000||!Number.isFinite(b.gravity)||b.gravity<0||b.gravity>5000||!Number.isFinite(b.seconds)||b.seconds<0||b.seconds>1e7||typeof b.soft!=='boolean')return null;
  if(!Array.isArray(b.queue)||b.queue.length!==2||!b.queue.every(q=>Array.isArray(q)&&q.length===2&&color(q[0])&&color(q[1],true)))return null;
  if(![b.score].every(n=>integer(n,0,MAX_SCORE))||!integer(b.chain,0,99)||!integer(b.maxChain,0,99)||!integer(b.popped,0,1e8)||!integer(b.level,1,MAX_LEVEL)||!integer(b.gauge,0,STAR_NEED-1)||!integer(b.pieces,0,1e8)||!integer(b.allClears,0,1e6)||!integer(b.stars,0,1e6))return null;
  const p=b.piece;if(b.phase==='drop'){if(!p||!integer(p.x,0,COLS-1)||!integer(p.y,0,ROWS-1)||!integer(p.rot,0,3)||!color(p.a)||!color(p.b,true))return null;if(!pieceCells(p).every(c=>integer(c.x,0,COLS-1)&&integer(c.y,0,ROWS-1)&&b.board[index(c.x,c.y)]===EMPTY))return null;}else if(p!==null)return null;
  return structuredClone({...s,snapshot:{...b,events:[]}});
 }catch{return null;}
}
export class MochiStore {private memory:MochiSave|null=null;private denied=false;constructor(private backend?:Pick<Storage,'getItem'|'setItem'>){try{this.backend??=window.localStorage;}catch{this.denied=true;}}
 read():MochiSave{if(this.memory)return structuredClone(this.memory);try{const raw=this.denied?null:this.backend?.getItem(SAVE_KEY);if(!raw||raw.length>=50000)return blankSave();const value:unknown=JSON.parse(raw);return validateSave(value)??recoverRecords(value);}catch{return blankSave();}}
 write(s:MochiSave):void{const copy=structuredClone(s);if(copy.snapshot)copy.snapshot.events=[];this.memory=copy;if(!this.denied)try{this.backend?.setItem(SAVE_KEY,JSON.stringify(copy));}catch{this.denied=true;}}
}
