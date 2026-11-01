/** Read-only model policy. Never edits charge/time/enemies/score; only aims, holds, releases and advances. */
import {CleaningRun,TICK_MS,type Snapshot, type GameEvent} from '../../src/games/game040/model';
export type PolicyName='aimed'|'central-small'|'greedy';
export interface PolicyAction {aimDeg?:number;begin?:boolean;release?:boolean;}
const angle=(x:number,y:number)=>Math.atan2(x-240,462-y)*180/Math.PI;
export function policyAction(s:Snapshot,name:PolicyName='aimed'):PolicyAction{
 if(s.state!=='playing')return{};
 if(!s.sucking)return s.blockedMs===0?{begin:true}:{};
 if(name==='central-small')return s.charge>=24?{aimDeg:0,release:true}:{aimDeg:0};
 if(s.bossHp!==null&&name==='aimed'){const blocked=s.enemies.some(e=>(e.kind==='dust'||e.kind==='bomb')&&Math.abs(e.x-240)<e.r+10&&e.y<462&&e.y>110);return !blocked&&(s.charge===100||(s.bombMs>0&&s.bombMs<=900))?{aimDeg:0,release:true}:{aimDeg:0};}
 const danger=s.enemies.filter(e=>e.kind==='can'&&e.y>340).sort((a,b)=>b.y-a.y||a.id-b.id)[0];
 if(s.charge===100||(name==='aimed'&&((danger&&(s.charge>=24||s.bombMs>0))||(s.bombMs>0&&s.bombMs<1100)))){
  const boss=s.enemies.find(e=>e.kind==='boss'),target=(name==='aimed'?danger:undefined)??boss??s.enemies.filter(e=>e.kind==='can'||e.kind==='bag').sort((a,b)=>b.y-a.y||a.id-b.id)[0];
  return{...(target?{aimDeg:angle(target.x,target.y)}:{}),release:true};
 }
 const dust=s.enemies.filter(e=>e.kind==='dust'||e.kind==='bomb').sort((a,b)=>Math.hypot(a.x-240,462-a.y)-Math.hypot(b.x-240,462-b.y)||a.id-b.id)[0];
 return dust?{aimDeg:angle(dust.x,dust.y)}:{};
}
export function runPolicy(name:PolicyName='aimed',hz=120){
 const run=new CleaningRun(),actions:{atMs:number;aimDeg?:number;begin?:boolean;release?:boolean}[]=[],inputTrace:{wallMs:number;aimDeg?:number;begin?:boolean;release?:boolean}[]=[],events:(GameEvent&{atMs:number})[]=[];
 for(let wallMs=0;wallMs<65000&&run.snapshot().state!=='result';wallMs+=1000/hz){
  const s=run.snapshot(),action=policyAction(s,name);if(Object.keys(action).length)inputTrace.push({wallMs,...action});if(action.aimDeg!==undefined)run.setAim(action.aimDeg);if(action.begin)run.beginSuction();if(action.release)run.release();if(action.begin||action.release)actions.push({atMs:s.elapsedMs,...action});
  run.advance(1000/hz);events.push(...run.drainEvents().map(e=>({...e,atMs:run.snapshot().elapsedMs})));
 }
 return{policy:name,hz,snapshot:run.snapshot(),actions,inputTrace,events};
}
export {TICK_MS};
