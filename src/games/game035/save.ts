import {createCurling,type CurlingState} from './model';
export const SAVE_KEY='web-mini-arcade:v1:game035:state';
export interface CurlingSave {game_id:'game035';rules_version:'1';best:number;runs:number;snapshot:CurlingState|null;runId:string|null;reported:boolean;}
export function blankSave():CurlingSave{return {game_id:'game035',rules_version:'1',best:0,runs:0,snapshot:null,runId:null,reported:true};}
const integer=(v:unknown,min:number,max:number):v is number=>typeof v==='number'&&Number.isInteger(v)&&v>=min&&v<=max;
export function validateSave(v:unknown):CurlingSave|null {
 try{const s=v as CurlingSave;if(!s||s.game_id!=='game035'||s.rules_version!=='1'||!integer(s.best,0,15000)||!integer(s.runs,0,1e9)||typeof s.reported!=='boolean'||!(s.runId===null||typeof s.runId==='string'&&s.runId.length<100))return null;
  const b=s.snapshot;if(!b)return s.reported?structuredClone(s):null;
  if(!integer(b.end,1,3)||!integer(b.shots,0,3)||b.practice!==false||typeof b.moving!=='boolean'||!['playing','complete'].includes(b.outcome)||!integer(b.total,0,15000)||!integer(b.chain,0,3)||!Number.isFinite(b.seconds)||b.seconds<0||b.seconds>1e6||!Array.isArray(b.stones)||b.stones.length>5||!Array.isArray(b.results)||b.results.length!==(b.outcome==='complete'?3:b.end-1))return null;
  if(new Set(b.stones.map(p=>p.id)).size!==b.stones.length||!b.stones.every(p=>integer(p.id,0,12)&&['you','other'].includes(p.team)&&typeof p.out==='boolean'&&[p.x,p.y,p.vx,p.vy].every(Number.isFinite)&&Math.abs(p.x)<1000&&Math.abs(p.y)<1500&&Math.abs(p.vx)<1000&&Math.abs(p.vy)<1000))return null;
  if(!b.results.every(r=>[r.close,r.removal,r.guard,r.economy,r.total].every(n=>integer(n,0,5000)))||b.results.reduce((n,r)=>n+r.total,0)!==b.total||s.reported!==(b.outcome==='complete'))return null;
  return structuredClone(s);
 }catch{return null;}
}
export class CurlingStore {private memory:CurlingSave|null=null;private denied=false;constructor(private backend?:Pick<Storage,'getItem'|'setItem'>){try{this.backend??=window.localStorage;}catch{this.denied=true;}}
 read():CurlingSave{if(this.memory)return structuredClone(this.memory);try{const raw=this.denied?null:this.backend?.getItem(SAVE_KEY);return raw&&raw.length<50000?validateSave(JSON.parse(raw))??blankSave():blankSave();}catch{return blankSave();}}
 write(s:CurlingSave):void{this.memory=structuredClone(s);if(!this.denied)try{this.backend?.setItem(SAVE_KEY,JSON.stringify(s));}catch{this.denied=true;}}
}
export {createCurling};
