import { Fishing, type FishingState } from './Fishing';
export const SAVE_KEY='web-mini-arcade:v1:game029:save';
export interface Saved { version:1; model:FishingState|null; runId:string|null; resultId:string|null; best:number; finishes:number; reported:string[] }
const id=(s:unknown):s is string => typeof s==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(s);
export class SaveStore {
  private memory:Saved|null=null;private memoryOnly=false;private backend?:Pick<Storage,'getItem'|'setItem'>;
  constructor(backend?:Pick<Storage,'getItem'|'setItem'>){try{this.backend=backend??window.localStorage;}catch{this.memoryOnly=true;}}
  private current():Saved|null{return this.memory?structuredClone(this.memory):null;}
  private reject():Saved|null{this.memoryOnly=true;return this.current();}
  read():Saved|null {if(this.memoryOnly)return this.current();try {const raw=this.backend?.getItem(SAVE_KEY);if(!raw)return this.current();if(raw.length>100000)return this.reject();const s=JSON.parse(raw) as Saved;
    if(!s||typeof s!=='object'||s.version!==1||s.runId!==null&&!id(s.runId)||s.resultId!==null&&!id(s.resultId)||!Number.isInteger(s.best)||s.best<0||s.best>1e9||!Number.isInteger(s.finishes)||s.finishes<0||s.finishes>1e9||!Array.isArray(s.reported)||s.reported.length>64||s.reported.some(v=>!id(v))||s.model!==null&&!Fishing.restore(s.model)||s.model!==null&&!s.resultId)return this.reject();
    this.memory=s;return structuredClone(s);
  }catch{return this.reject();}}
  write(s:Saved):void{this.memory=structuredClone(s);try{if(!this.memoryOnly)this.backend?.setItem(SAVE_KEY,JSON.stringify(s));}catch{this.memoryOnly=true;}}
}
export function reportFinish(s:Saved, resultId:string,score:number):boolean {if(s.reported.includes(resultId))return false;s.best=Math.max(s.best,score);s.finishes=Math.min(1e9,s.finishes+1);s.reported=[...s.reported,resultId].slice(-64);return true;}
