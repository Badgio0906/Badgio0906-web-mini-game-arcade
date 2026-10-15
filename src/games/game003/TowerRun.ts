import Matter from 'matter-js';
import { BUILDINGS, buildingById, createBuilding, shapeMetrics } from './buildings';
import type { ArtPair, CargoPose, Foundation, TowerChoice, TowerEvent, TowerInspection, TowerOutcome, TowerPhase, TowerResult, TowerSnapshot, SupportInterface, AcceptedLanding } from './contracts';
export const FOUNDATION: Foundation={x:300,y:660,width:230,height:42};
export const GRAVITY=720, PERFECT_PIXELS=7, SUPPORT_GRACE=4, SETTLE_SECONDS=.55;
export const swingSpeed=(n:number)=>Math.min(1.22,.52+n*.024);
export const swingAmplitude=(n:number)=>Math.min(155,38+n*8);
export const cargoMass=(w:number,h:number)=>Math.round(w*h*.0012*10);
export const ART_MIN_RATIO=.2,ART_MAX_RATIO=.46,ART_RECOVERY_PIXELS=8;
export const isArtOffset=(r:number)=>Math.abs(r)>=ART_MIN_RATIO&&Math.abs(r)<=ART_MAX_RATIO;
export function artPairPoints(a:number,b:number,recovery:number,multiplier:1|3,streak:number){return Math.round(180+Math.min(100,recovery*3)+Math.min(60,Math.abs(a-b)*50)+Math.min(30,streak*5))*multiplier;}
export interface StabilityReport {stable:boolean;instability:number;loadCenter:number;minMargin:number;weakJointIndex:number;unstableJointIndex:number;support:{left:number;right:number};lean:number;foundationCenter:number;interfaces:SupportInterface[]}
/** Diagnostic only: live collision response is Matter's SAT / contact solver, never this envelope. */
export function evaluateTowerStability(stack:readonly CargoPose[],foundation:Foundation=FOUNDATION):StabilityReport {
 const total=stack.reduce((v,b)=>v+b.mass,0),center=total?stack.reduce((v,b)=>v+b.mass*b.x,0)/total:foundation.x;
 const left=foundation.x-foundation.width/2,right=foundation.x+foundation.width/2,margin=Math.min(center-left,right-center);
 const lean=stack.reduce((v,b)=>Math.max(v,Math.abs(b.rotation)),0),instability=Math.min(1,Math.max(lean/.7,1-margin/(foundation.width/2)));
 return {stable:margin>=0&&lean<1.1,instability,loadCenter:center,minMargin:margin,weakJointIndex:0,unstableJointIndex:margin<0?0:-1,support:{left,right},lean,foundationCenter:center,interfaces:[]};
}
export const pairRecovery=(before:StabilityReport,after:StabilityReport)=>Math.abs(before.foundationCenter-FOUNDATION.x)-Math.abs(after.foundationCenter-FOUNDATION.x);
interface Live {id:number;body:Matter.Body;shapeId:string}
interface BeforeDrop {bias:number;tilt:number;topId:number;center:number;topX:number;topWidth:number;parts:number}
export class TowerRun {
 time=0;alive=false;phase:TowerPhase='ended';pending:'height15'|null=null;cMode=false;cargo:CargoPose|null=null;
 readonly stack:CargoPose[]=[];instability=0;
 private engine=Matter.Engine.create({enableSleeping:true,positionIterations:10,velocityIterations:8,constraintIterations:4});
 private live:Live[]=[];private active:Live|null=null;private nextId=0;private settleAge=0;private flightAge=0;private accumulator=0;
 private precisionScore=0;private perfectCount=0;private combo=0;private maxCombo=0;private artScore=0;private artPairs=0;private artStreak=0;
 private recentArtPair:ArtPair|null=null;private recentlyAccepted:AcceptedLanding|null=null;private ending:TowerResult|null=null;
 private usedArt=new Set<number>();private acceptedHeight=0;private report=evaluateTowerStability([]);private before:BeforeDrop|null=null;
 private wasContact=false;private preContactX=300;
 constructor(private readonly emit:(e:TowerEvent)=>void=()=>{},private readonly random:()=>number=Math.random){this.reset();}
 get topY(){return this.live.length?Math.min(...this.live.map(l=>l.body.bounds.min.y)):FOUNDATION.y-FOUNDATION.height/2;}
 get topCenter(){const top=this.live.reduce<Live|null>((a,b)=>!a||b.body.bounds.min.y<a.body.bounds.min.y?b:a,null);return top?.body.position.x??FOUNDATION.x;}
 get speedMultiplier():1|2{return this.cMode?2:1;}get perfectMultiplier():1|3{return this.cMode?3:1;}
 get artDiagnostic(){return this.recentArtPair?{...this.recentArtPair}:null;}
 get supportDiagnostic(){return {...this.report.support,y:FOUNDATION.y-FOUNDATION.height/2,loadCenter:this.report.loadCenter,weakJointIndex:this.report.weakJointIndex,failureJointIndex:0};}
 start(){this.reset();this.alive=true;this.spawnCargo();}
 reset(){Matter.Composite.clear(this.engine.world,false);Matter.Engine.clear(this.engine);this.engine.timing.timestamp=0;this.engine.gravity.y=1;this.engine.gravity.scale=.00072;
  Matter.Composite.add(this.engine.world,Matter.Bodies.rectangle(FOUNDATION.x,FOUNDATION.y,FOUNDATION.width,FOUNDATION.height,{isStatic:true,friction:1,frictionStatic:2,restitution:0,label:'foundation'}));
  this.time=this.accumulator=this.nextId=this.settleAge=this.flightAge=this.precisionScore=this.perfectCount=this.combo=this.maxCombo=this.artScore=this.artPairs=this.artStreak=this.acceptedHeight=0;
  this.alive=false;this.phase='ended';this.pending=null;this.cMode=false;this.cargo=null;this.live=[];this.stack.length=0;this.active=null;this.ending=null;this.recentlyAccepted=null;this.recentArtPair=null;this.before=null;this.usedArt.clear();this.instability=0;this.report=evaluateTowerStability([]);
 }
 move(x:number){if(!this.alive||this.phase!=='hanging'||!this.cargo||!Number.isFinite(x))return false;this.cargo.x=Math.max(116,Math.min(484,x));return true;}
 rotate(){if(!this.alive||this.phase!=='hanging'||!this.cargo)return false;this.cargo.rotation=(this.cargo.rotation+Math.PI/2)%(Math.PI*2);return true;}
 drop(){if(!this.alive||this.phase!=='hanging'||!this.cargo)return false;
  const c=this.cargo;this.active={id:c.id,shapeId:c.shapeId!,body:createBuilding(buildingById(c.shapeId),c.x,c.y,c.rotation)};
  Matter.Composite.add(this.engine.world,this.active.body);this.before={bias:Math.abs(this.report.foundationCenter-FOUNDATION.x),tilt:this.stack.reduce((v,s)=>Math.max(v,Math.abs(s.rotation)),0),topId:this.stack.at(-1)?.id??-1,center:this.report.foundationCenter,topX:this.topCenter,topWidth:this.stack.at(-1)?.width??FOUNDATION.width,parts:buildingById(this.stack.at(-1)?.shapeId).parts.length};
  this.phase='falling';this.flightAge=this.settleAge=0;this.wasContact=false;this.preContactX=c.x;this.emit({type:'release'});return true;
 }
 choose(choice:TowerChoice){if(!this.pending||!this.alive)return false;this.pending=null;this.cMode=choice==='challenge';this.emit({type:'choice',milestone:'height15',choice});return true;}
 landingProjection(){return this.cargo?.x??this.topCenter;}
 step(seconds:number){if(!this.alive||this.pending||!Number.isFinite(seconds)||seconds<=0)return;this.accumulator+=Math.min(.05,seconds);
  while(this.accumulator+1e-10>=1/120&&this.alive){this.accumulator-=1/120;this.time+=1/120;Matter.Engine.update(this.engine,1000/120);this.sync();this.report=evaluateTowerStability(this.stack);this.instability=this.report.instability;
   if(this.live.some(l=>l.body.position.y>FOUNDATION.y+100||l.body.bounds.max.x<0||l.body.bounds.min.x>600)){this.emit({type:'support_failure',jointIndex:0,margin:this.report.minMargin,contact:false});this.finish('collapse');break;}
   if(this.active){this.flightAge+=1/120;const body=this.active.body,contact=this.contactPairs(body).length>0;
    if(contact&&!this.wasContact){this.wasContact=true;this.preContactX=body.position.x;this.phase='settling';}
    const quiet=contact&&body.speed<.28&&Math.abs(body.angularVelocity)<.012&&this.live.every(l=>l.body.speed<.35&&Math.abs(l.body.angularVelocity)<.015);
    this.settleAge=quiet?this.settleAge+1/120:0;
    if(this.settleAge>=SETTLE_SECONDS){this.accept();}
    else if(body.position.y>FOUNDATION.y+170||body.bounds.max.x<0||body.bounds.min.x>600||this.flightAge>9)this.finish('fall');
   }
  }
 }
 private contactPairs(body:Matter.Body):Matter.Pair[]{return this.engine.pairs.list.filter((p:Matter.Pair)=>p.isActive&&(p.bodyA.parent===body||p.bodyB.parent===body));}
 private pose(l:Live):CargoPose {const b=l.body,m=shapeMetrics(buildingById(l.shapeId));return {id:l.id,shapeId:l.shapeId,x:b.position.x,y:b.position.y,width:m.width,height:m.height,mass:Math.round(b.mass*10),rotation:b.angle,vx:b.velocity.x*60,vy:b.velocity.y*60,angularVelocity:b.angularVelocity,sleeping:b.isSleeping};}
 private sync(){this.stack.splice(0,this.stack.length,...this.live.map(l=>this.pose(l)));if(this.active)this.cargo=this.pose(this.active);}
 private spawnCargo(){const id=this.nextId++;const shape=BUILDINGS[id===0?0:id===1?4:Math.floor(this.random()*BUILDINGS.length)%BUILDINGS.length],m=shapeMetrics(shape);
  this.cargo={id,shapeId:shape.id,x:300,y:Math.min(210,this.topY-150),width:m.width,height:m.height,mass:Math.round(m.mass*10),rotation:0,vx:0,vy:0};this.phase='hanging';this.active=null;
 }
 private accept(){const arriving=this.active!;const body=arriving.body;const contacts=this.contactPairs(body);const old=this.before!;
  this.live.push(arriving);this.active=null;this.sync();this.report=evaluateTowerStability(this.stack);this.instability=this.report.instability;
  this.acceptedHeight=Math.max(this.acceptedHeight,(FOUNDATION.y-FOUNDATION.height/2-this.topY)/60);
  const c=this.stack.at(-1)!,perfect=Math.abs(this.preContactX-old.topX)<PERFECT_PIXELS&&Math.abs(Math.sin(c.rotation))<.06;
  if(perfect){this.combo++;this.perfectCount++;this.maxCombo=Math.max(this.maxCombo,this.combo);const points=100*Math.min(this.combo,8)*this.perfectMultiplier;this.precisionScore+=points;this.emit({type:'perfect',combo:this.combo,points});}else this.combo=0;
  const recovery=old.bias-Math.abs(this.report.foundationCenter-FOUNDATION.x),previous=this.stack.at(-2),ratio=(c.x-old.topX)/Math.min(c.width,old.topWidth);
  const priorBody=this.live.find(l=>l.id===old.topId)?.body;
  const touchesPrior=!!priorBody&&contacts.some(p=>p.bodyA.parent===priorBody||p.bodyB.parent===priorBody);
  const regainedTilt=previous?old.tilt-Math.abs(previous.rotation):0;
  // Opposite position alone cannot score: actual SAT contact + recovered mass centre + difficult shape/tilt + quiet settling are required.
  if(previous&&touchesPrior&&!this.usedArt.has(previous.id)&&!this.usedArt.has(c.id)&&recovery>=ART_RECOVERY_PIXELS&&(regainedTilt>.015||(old.parts>1&&Math.abs(previous.x-FOUNDATION.x)>22))&&Math.abs(ratio)>.12){
   this.artStreak++;const firstRatio=(previous.x-FOUNDATION.x)/FOUNDATION.width;const points=artPairPoints(firstRatio,ratio,recovery,this.perfectMultiplier,this.artStreak);
   const pair:ArtPair={firstId:previous.id,secondId:c.id,firstX:previous.x,secondX:c.x,firstRatio,secondRatio:ratio,recoveryPixels:recovery,points};
   this.recentArtPair=pair;this.artPairs++;this.artScore+=points;this.usedArt.add(previous.id);this.usedArt.add(c.id);this.emit({type:'art',pair:{...pair},streak:this.artStreak});
  }else this.artStreak=0;
  const supportXs=contacts.flatMap(p=>p.collision.supports.filter((s):s is Matter.Vector=>!!s).map(v=>v.x));
  const left=supportXs.length?Math.min(...supportXs):c.x,right=supportXs.length?Math.max(...supportXs):c.x;
  this.report.support={left,right};this.report.interfaces=[{index:this.stack.length-1,left,right,loadCenter:c.x,margin:Math.min(c.x-left,right-c.x),instability:this.instability}];
  this.recentlyAccepted={x:c.x,width:c.width,height:c.height,overlapRatio:Math.max(0,right-left)/c.width,loadCenter:this.report.foundationCenter,supportMargin:this.report.minMargin,perfect};
  this.emit({type:'land',floors:this.stack.length});if(Math.abs(ratio)>.2)this.emit({type:'overhang',cargoId:c.id,offsetRatio:ratio,margin:this.report.minMargin,weakJointIndex:0});
  this.cargo=null;this.spawnCargo();
 }
 snapshot():TowerSnapshot{return {rulesVersion:3,artScore:this.artScore,artPairs:this.artPairs,artStreak:this.artStreak,bonusScore:this.artScore+this.precisionScore,foundationCenter:this.report.foundationCenter,supportMargin:this.report.minMargin,floors:this.stack.length,height:this.acceptedHeight,pending:this.pending,cMode:this.cMode,mode:this.cMode?'challenge':'normal',speedMultiplier:this.speedMultiplier,perfectMultiplier:this.perfectMultiplier,time:this.time,perfectCount:this.perfectCount,combo:this.combo,maxCombo:this.maxCombo,precisionScore:this.precisionScore,alive:this.alive,phase:this.phase,instability:this.instability,outcome:this.ending?.outcome??null};}
 inspection():TowerInspection{return {...this.snapshot(),cargo:this.cargo?{...this.cargo}:null,stack:this.stack.map(c=>({...c})),foundation:{...FOUNDATION},topCenter:this.topCenter,topY:this.topY,support:{...this.report.support},supportY:FOUNDATION.y-FOUNDATION.height/2,loadCenter:this.report.loadCenter,weakJointIndex:0,recentlyAccepted:this.recentlyAccepted?{...this.recentlyAccepted}:null,recentArtPair:this.artDiagnostic,interfaces:this.report.interfaces.map(j=>({...j}))};}
 result(){return this.ending?{...this.ending}:null;}
 private finish(outcome:TowerOutcome){if(!this.alive)return;this.alive=false;this.phase='ended';this.pending=null;const s=this.snapshot();this.ending={...s,reason:outcome==='fall'?'建物が足場を外れました。':'支えが動き、塔が崩れました。',outcome};this.emit({type:'collapse',reason:outcome});}
}
