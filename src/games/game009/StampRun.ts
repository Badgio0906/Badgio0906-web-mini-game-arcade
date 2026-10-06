import { ITEMS, itemName } from './items';
import type { DeskLayout, DeskObject, StampEvent, StampInspection, StampRequest, StampResult, StampSnapshot } from './contracts';
export const RUN_SECONDS = 75;
export const matchesRequest = (object: DeskObject, request: StampRequest): boolean => object.kind === request.kind && (request.color === undefined || object.color === request.color) && (request.capped === undefined || object.capped === request.capped);
export function calculateDeskLayout(objects: readonly DeskObject[], availableWidth: number): DeskLayout {
 const width = Math.max(220, Number.isFinite(availableWidth) ? availableWidth : 300); const columns = width < 500 ? 4 : width < 780 ? 6 : 8; const cell = width / columns;
 return { width, height: Math.ceil(objects.length / columns) * cell + 12, bounds: objects.map((object,index)=>({id:object.id,left:(index%columns)*cell+2,top:Math.floor(index/columns)*cell+4,width:cell-4,height:cell-4})) };
}
export class StampRun {
 private correct=0; private score=0; private time=0; private remaining=RUN_SECONDS; private alive=false; private phase: StampSnapshot['phase']='searching'; private feedback=0; private searchTime=0; private roundId=0; private deskId=0; private objects: DeskObject[]=[]; private lifted=new Set<number>(); private tidyState=false; private request: StampRequest={kind:'calculator',text:'電卓を取ってください',sample:true}; private lastPicked:number|null=null; private lastPoints=0; private errors=0; private lifts=0; private tidies=0; private note=''; private practice=false; private practiceStep=0; private practiceDone=false; private ending:StampResult|null=null;
 constructor(private readonly emit:(event:StampEvent)=>void=()=>{}, private readonly random:()=>number=Math.random){this.makeDesk();}
 start(practice=false):void {this.correct=this.score=this.time=this.feedback=this.searchTime=this.roundId=this.deskId=this.errors=this.lifts=this.tidies=this.lastPoints=0;this.remaining=RUN_SECONDS;this.alive=true;this.phase='searching';this.lastPicked=null;this.note='';this.practice=practice;this.practiceStep=0;this.practiceDone=false;this.ending=null;this.makeDesk();this.nextRequest();}
 private makeDesk():void {
  this.deskId++;this.lifted.clear();this.tidyState=false;
  const count=this.practice?9:this.correct<6?9:this.correct<12?16:24;
  const offset=this.practice?15:(this.deskId*7)%ITEMS.length;
  const kinds=Array.from({length:count},(_,i)=>ITEMS[(offset+i)%ITEMS.length].kind);
  if(this.practice){kinds[0]='calculator';kinds[1]='scissors';kinds[2]='pen';}
  if(!this.practice&&this.correct>=12){kinds[count-1]='pen';kinds[count-2]='pen';}
  this.objects=kinds.map((kind,index)=>({id:this.deskId*100+index,kind,color:kind==='highlighter'?'yellow':kind==='binder'?'black':kind==='pen'?'blue':'natural',capped:kind==='pen'&&index%2===0,rotation:this.practice?0:(this.random()-.5)*18,placement:index,paper:this.practice?index===1?1:null:this.correct>=6&&index%7===1?index:null}));
 }
 private nextRequest():void {
  this.roundId++;this.phase='searching';this.searchTime=0;this.lastPicked=null;this.lastPoints=0;
  let item:DeskObject;
  if(this.practice)item=this.objects[this.practiceStep===0?0:this.practiceStep===1?1:2];
  else item=this.objects[(this.roundId*5+this.deskId)%this.objects.length];
  const features=!this.practice&&this.correct>=9;
  this.request={kind:item.kind,text:`${itemName(item.kind)}を取ってください`,sample:this.correct<6||this.practice};
  if(features&&item.kind==='highlighter'){this.request.color=item.color;this.request.text='黄色い蛍光ペンを取ってください';}
  if(features&&item.kind==='binder'){this.request.color=item.color;this.request.text='黒いダブルクリップを取ってください';}
  if(features&&item.kind==='pen'){this.request.color=item.color;this.request.capped=item.capped;this.request.text=`キャップ${item.capped?'付き':'なし'}の青いペンを取ってください`;}
  if(!this.objects.some(o=>matchesRequest(o,this.request)))throw new Error('Request without an actual match');
  this.note=this.practice?['電卓を探して取ろう。','折れた紙の端をめくり、はさみを取ろう。','「整頓する」を使ってから、ペンを取ろう。'][this.practiceStep]:'同じ条件なら、どれでも正解。';
 }
 pick(id:number):boolean {
  if(!this.alive||this.phase!=='searching')return false;const object=this.objects.find(o=>o.id===id);if(!object)return false;
  if(object.paper!==null&&!this.lifted.has(object.paper)&&!this.tidyState){this.note='まず紙の折れた端をめくろう。';return false;}
  if(this.practice&&this.practiceStep===2&&!this.tidyState){this.note='まず「整頓する」を押してみよう。';return false;}
  this.lastPicked=id;
  if(!matchesRequest(object,this.request)){this.errors++;this.remaining=Math.max(0,this.remaining-2);this.note='違う物です。時間 −2秒。';this.emit({type:'mistake',kind:object.kind,objectId:id,penaltySeconds:2});if(this.remaining<=0)this.finish();return true;}
  this.lastPoints=100+Math.max(0,Math.round(30-this.searchTime*2))+(this.tidyState?0:Math.min(15,Math.floor(this.objects.length/3)));
  this.score+=this.lastPoints;this.correct++;this.phase='feedback';this.feedback=.45;this.note=`見つけた！ +${this.lastPoints}`;
  this.emit({type:'correct',kind:object.kind,objectId:id,points:this.lastPoints,searchMs:Math.round(this.searchTime*1000),correct:this.correct});return true;
 }
 lift(paper:number):boolean {if(!this.alive||this.phase!=='searching'||this.tidyState||this.lifted.has(paper)||!this.objects.some(o=>o.paper===paper))return false;this.lifted.add(paper);this.lifts++;this.note='紙を持ち上げた。下の物を探そう。';this.emit({type:'paper_lift',paper,count:this.lifts});return true;}
 tidy():boolean {if(!this.alive||this.phase!=='searching'||this.tidyState)return false;this.tidyState=true;for(const o of this.objects)if(o.paper!==null)this.lifted.add(o.paper);this.remaining=Math.max(0,this.remaining-2.5);this.tidies++;this.note='整頓！時間 −2.5秒。散乱ボーナスだけ減少。';this.emit({type:'tidy',costSeconds:2.5,count:this.tidies});if(this.remaining<=0&&!this.practice)this.finish();return true;}
 step(seconds:number):void {if(!this.alive||!Number.isFinite(seconds)||seconds<=0)return;const dt=Math.min(.05,seconds);this.time+=dt;if(!this.practice)this.remaining=Math.max(0,this.remaining-dt);if(this.phase==='feedback'){this.feedback-=dt;if(this.feedback<=1e-8){if(this.practice){this.practiceStep++;if(this.practiceStep>=3){this.practiceDone=true;this.alive=false;this.phase='ended';this.emit({type:'practice_complete'});return;}}else if(this.correct%3===0)this.makeDesk();this.nextRequest();}}else this.searchTime+=dt;if(this.remaining<=0&&!this.practice)this.finish();}
 private finish():void {if(!this.alive)return;this.alive=false;this.phase='ended';this.note='おつかれさま！';this.ending={score:this.score,correct:this.correct,time:this.time,errors:this.errors,lifts:this.lifts,tidies:this.tidies,outcome:'timeout',reason:'75秒の机仕事が終了。'};this.emit({type:'timeout'});}
 snapshot():StampSnapshot {return {round:this.correct+1,roundId:this.roundId,deskId:this.deskId,correct:this.correct,score:this.score,time:this.time,remaining:this.remaining,alive:this.alive,phase:this.phase,request:{...this.request},objects:this.objects.map(o=>({...o})),liftedPapers:[...this.lifted],tidy:this.tidyState,multiplier:this.tidyState?1:1.1,lastPicked:this.lastPicked,lastPoints:this.lastPoints,errors:this.errors,lifts:this.lifts,tidies:this.tidies,note:this.note,practice:this.practice,practiceStep:this.practiceStep,practiceDone:this.practiceDone};}
 inspection():StampInspection {const s=this.snapshot();return {...s,matchingIds:s.objects.filter(o=>matchesRequest(o,s.request)).map(o=>o.id),layout:null};}
 result():StampResult|null{return this.ending?{...this.ending}:null;}
}
