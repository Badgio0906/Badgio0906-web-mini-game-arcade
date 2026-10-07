import { LEVELS } from './Levels';
import { Route, RULES } from './Route';
import type { Point } from './Geometry';
export type Progress = { unlocked:number; best:(number|null)[]; clears:number; reported:string[] };
export type Current = {stage:number;points:Point[];cleared:boolean;reported:boolean;resultId:string;runId:string|null;hints:number;resets:number};
export type Snapshot = {save_version:1;game_id:'game030';rules_version:string;progress:Progress;current:Current|null};
export const freshProgress=():Progress=>({unlocked:1,best:Array(20).fill(null),clears:0,reported:[]});
const integer=(v:unknown,max:number)=>typeof v==='number'&&Number.isInteger(v)&&v>=0&&v<=max;
export const validId=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(v);
export function validate(value:unknown):Snapshot|null {
  try {
    const s=value as Snapshot,p=s.progress,c=s.current;
    if(s.save_version!==1||s.game_id!=='game030'||s.rules_version!==RULES||!p||!integer(p.unlocked,20)||p.unlocked<1||!integer(p.clears,1000000)||!Array.isArray(p.reported)||p.reported.length>100||!p.reported.every(validId)||new Set(p.reported).size!==p.reported.length||p.reported.length>p.clears||!Array.isArray(p.best)||p.best.length!==20||!p.best.every((n,i)=>n===null||typeof n==='number'&&Number.isFinite(n)&&n>0&&n<=LEVELS[i].budget))return null;
    if(p.best.slice(0,p.unlocked-1).some(n=>n===null))return null;
    if(c){
      if(!integer(c.stage,20)||c.stage<1||c.stage>p.unlocked||typeof c.cleared!=='boolean'||typeof c.reported!=='boolean'||!validId(c.resultId)||c.runId!==null&&!validId(c.runId)||!integer(c.hints,1000000)||!integer(c.resets,1000000)||!Array.isArray(c.points)||c.points.some(q=>!q||typeof q.x!=='number'||typeof q.y!=='number'))return null;
      const route=new Route(LEVELS[c.stage-1]);if(!route.restore(c.points,c.cleared))return null;
      if(c.cleared!==c.reported||c.reported&&!p.reported.includes(c.resultId)||!c.reported&&p.reported.includes(c.resultId)||c.cleared&&p.best[c.stage-1]===null)return null;
    }
    return structuredClone(s);
  }catch{return null;}
}
export function makeSnapshot(progress:Progress,current:Current|null):Snapshot{return {save_version:1,game_id:'game030',rules_version:RULES,progress:structuredClone(progress),current:current?structuredClone(current):null};}
/** Local result IDs are gameplay-only; optional observer IDs never determine completion. */
export function recordClear(progress:Progress,stage:number,used:number,resultId:string):{progress:Progress;updated:boolean} {
  if(!validId(resultId)||!integer(stage,20)||stage<1||stage>progress.unlocked||!Number.isFinite(used)||used<=0||used>LEVELS[stage-1].budget||progress.reported.includes(resultId))return {progress,updated:false};
  const next=structuredClone(progress),best=next.best[stage-1];next.best[stage-1]=best===null?used:Math.min(best,used);
  next.unlocked=Math.min(20,Math.max(next.unlocked,stage+1));next.clears=Math.min(1000000,next.clears+1);next.reported=[...next.reported,resultId].slice(-100);
  return {progress:next,updated:true};
}
export class SaveStore {
  readonly key='web-mini-arcade:v1:game030:snapshot';private memory:Snapshot|null=null;private memoryOnly=false;
  constructor(private backend?:Pick<Storage,'getItem'|'setItem'>){if(!backend)try{this.backend=window.localStorage;}catch{this.memoryOnly=true;}}
  read():Snapshot|null {
    if(this.memoryOnly)return validate(this.memory);
    try{
      const raw=this.backend?.getItem(this.key);
      if(raw!==null&&raw!==undefined){
        const saved=raw.length<=500000?validate(JSON.parse(raw)):null;
        if(saved){this.memory=structuredClone(saved);return saved;}
        this.memoryOnly=true;
      }
    }catch{this.memoryOnly=true;}
    return validate(this.memory);
  }
  write(value:Snapshot):void {
    this.memory=structuredClone(value);
    if(this.memoryOnly)return;
    try{this.backend?.setItem(this.key,JSON.stringify(value));}catch{this.memoryOnly=true;}
  }
}
