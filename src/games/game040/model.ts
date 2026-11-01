import {createWaves,DEFAULT_SEED,type EnemyKind,type Spawn} from './waves';
export type {EnemyKind,Spawn} from './waves';
export type Tier='small'|'large'|'full';
export interface Enemy {readonly id:number;readonly kind:EnemyKind;readonly x:number;readonly y:number;readonly r:number;readonly hp:number;readonly vx:number;readonly vy:number;readonly salvage?:boolean;}
export interface Bullet {readonly id:number;readonly shotId:number;readonly x:number;readonly y:number;readonly tier:Tier;readonly ageMs:number;readonly dx:number;readonly dy:number;readonly bomb?:boolean;}
export interface GameEvent {readonly type:'intake'|'shot'|'blast'|'kill'|'full'|'jam'|'damage'|'boss'|'finish'|'bomb-catch'|'bomb-expire';readonly x?:number;readonly y?:number;readonly shotId?:number;readonly tier?:Tier;readonly chain?:number;readonly kind?:EnemyKind;readonly score?:number;readonly radius?:number;readonly result?:Snapshot['result'];readonly enemyId?:number;readonly primary?:boolean;readonly bomb?:boolean;}
export interface Snapshot {
 readonly mode:'run'|'practice';readonly state:'playing'|'paused'|'result';readonly elapsedMs:number;readonly score:number;readonly lives:number;readonly charge:number;readonly aimDeg:number;readonly sucking:boolean;readonly blockedMs:number;readonly jamHoldMs:number;readonly bombMs:number;readonly bombsLaunched:number;readonly bombsExpired:number;readonly salvageAbsorbed:number;readonly hitstopMs:number;readonly maxChain:number;readonly fullShots:number;readonly absorbed:number;readonly bossHp:number|null;readonly result:'clear'|'time'|'life'|'practice'|null;readonly rank:'S'|'A'|'B'|'C';readonly enemies:readonly Enemy[];readonly bullets:readonly Bullet[];readonly recordable:boolean;readonly shotCount:number;readonly maxGameplayObjects:number;
}
export const TICK_MS=1000/120;
export const SUCTION_HALF_ANGLE=24*1.15;
export const NOZZLE=Object.freeze({x:240,y:462});
export const DANGER_Y=436;
export const RULES_VERSION=2;
export const SHOT=Object.freeze({small:Object.freeze({damage:4,radius:36,multiplier:1}),large:Object.freeze({damage:8,radius:68,multiplier:2}),full:Object.freeze({damage:12,radius:100,multiplier:4})});
const BOMB_TICKS=420,FIRE_BLOCK_TICKS=15,INVULNERABLE_TICKS=84,SECONDARY_TICKS=7;
const radians=(deg:number)=>deg*Math.PI/180;
const clamp=(x:number,a:number,b:number)=>Math.max(a,Math.min(b,x));
type MutableEnemy={-readonly[P in keyof Enemy]:Enemy[P]};
type MutableBullet={-readonly[P in keyof Bullet]:Bullet[P]};
interface ShotRecord {tier:Tier;kills:number;bossHit:boolean;bomb:boolean;radius:number;damage:number;}
interface Blast {atTick:number;serial:number;x:number;y:number;shotId:number;primary:boolean;}
/** Fixture injection is for unit tests only; any fixture makes the result non-recordable. */
export interface ModelFixture {readonly charge?:number;readonly lives?:number;readonly elapsedMs?:number;readonly durationMs?:number;readonly spawns?:readonly Spawn[];}
export interface RunOptions {readonly mode?:'run'|'practice';readonly seed?:number;readonly fixture?:ModelFixture;}
export class CleaningRun {
 private readonly mode:'run'|'practice';private readonly recordable:boolean;private readonly spawns:readonly Spawn[];private readonly durationTick:number;
 private state:Snapshot['state']='playing';private tick=0;private carryMs=0;private score=0;private lives=3;private charge=24;private aimDeg=0;private sucking=false;private blockedUntil=0;private bombUntil=0;private bombsLaunched=0;private bombsExpired=0;private salvageAbsorbed=0;private invulnerableUntil=0;private hitstopMs=0;private maxChain=0;private fullShots=0;private absorbed=0;private bossHp:number|null=null;private result:Snapshot['result']=null;private nextSpawn=0;private nextEntity=1;private nextShot=1;private nextBlast=1;private shotCount=0;private maxGameplayObjects=0;
 private enemies:MutableEnemy[]=[];private bullets:MutableBullet[]=[];private blasts:Blast[]=[];private shots=new Map<number,ShotRecord>();private events:GameEvent[]=[];
 constructor(options:RunOptions={}){
  this.mode=options.mode??'run';this.recordable=this.mode==='run'&&!options.fixture;
  const f=options.fixture;this.charge=clamp(Math.trunc(f?.charge??24),0,100);this.lives=clamp(Math.trunc(f?.lives??3),0,3);this.tick=Math.max(0,Math.round((f?.elapsedMs??0)/TICK_MS));
  this.durationTick=Math.round((f?.durationMs??(this.mode==='practice'?16000:60000))/TICK_MS);
  this.spawns=(f?.spawns??createWaves(options.seed??DEFAULT_SEED,this.mode==='practice')).map((s,index)=>({...s,index})).sort((a,b)=>a.atMs-b.atMs||a.index-b.index);
  this.spawnDue();this.measureObjects();
 }
 snapshot():Snapshot{return{mode:this.mode,state:this.state,elapsedMs:this.tick*1000/120,score:this.score,lives:this.lives,charge:this.charge,aimDeg:this.aimDeg,sucking:this.sucking,blockedMs:Math.max(0,(this.blockedUntil-this.tick)*TICK_MS),jamHoldMs:0,bombMs:Math.max(0,(this.bombUntil-this.tick)*TICK_MS),bombsLaunched:this.bombsLaunched,bombsExpired:this.bombsExpired,salvageAbsorbed:this.salvageAbsorbed,hitstopMs:this.hitstopMs,maxChain:this.maxChain,fullShots:this.fullShots,absorbed:this.absorbed,bossHp:this.bossHp,result:this.result,rank:this.rank(),enemies:this.enemies.map(e=>({...e})),bullets:this.bullets.map(b=>({...b})),recordable:this.recordable,shotCount:this.shotCount,maxGameplayObjects:this.maxGameplayObjects};}
 setAim(deg:number):void{if(Number.isFinite(deg))this.aimDeg=clamp(deg,-60,60);}
 beginSuction():boolean{if(this.state!=='playing'||this.sucking||this.tick<this.blockedUntil)return false;this.sucking=true;return true;}
 release():boolean{
  if(this.state!=='playing'||!this.sucking)return false;this.sucking=false;
  if(this.tick<this.blockedUntil||(this.charge<24&&this.bombUntil===0))return false;
  const tier:Tier=this.charge===100?'full':this.charge>=60?'large':'small',shotId=this.nextShot++,a=radians(this.aimDeg);
  const bomb=this.bombUntil>this.tick,urgent=bomb&&this.bombUntil-this.tick<=120,def=SHOT[tier];this.shots.set(shotId,{tier,kills:0,bossHit:false,bomb,radius:bomb?(urgent?200:160):def.radius,damage:bomb?Math.max(def.damage,urgent?12:8):def.damage});if(bomb)this.bombsLaunched++;this.bombUntil=0;this.bullets.push({id:this.nextEntity++,shotId,x:NOZZLE.x,y:NOZZLE.y,tier,bomb,ageMs:0,dx:Math.sin(a),dy:-Math.cos(a)});
  this.charge=0;this.blockedUntil=this.tick+FIRE_BLOCK_TICKS;this.shotCount++;if(tier==='full')this.fullShots++;
  this.events.push({type:'shot',x:NOZZLE.x,y:NOZZLE.y,shotId,tier,bomb});this.measureObjects();return true;
 }
 cancel():void{this.sucking=false;}
 pause():void{if(this.state==='playing'){this.cancel();this.state='paused';}}
 resume():void{if(this.state==='paused'){this.cancel();this.state='playing';}}
 drainEvents():GameEvent[]{const result=this.events;this.events=[];return result;}
 advance(deltaMs:number):void{
  if(this.state!=='playing'||!Number.isFinite(deltaMs)||deltaMs<0)return;
  this.carryMs+=deltaMs;
  while(this.state==='playing'){
   // Hitstop consumes wall time equally for ALL simulation clocks, not just drawing.
   if(this.hitstopMs>0){const used=Math.min(this.hitstopMs,this.carryMs);this.hitstopMs-=used;this.carryMs-=used;if(this.carryMs<=1e-9){this.carryMs=0;break;}}
   if(this.carryMs+1e-7<TICK_MS)break;
   this.carryMs=Math.max(0,this.carryMs-TICK_MS);this.step();
  }
 }
 private spawnDue():void{
  while(this.nextSpawn<this.spawns.length&&this.spawns[this.nextSpawn].atMs<=this.tick*TICK_MS+1e-6){
   const s=this.spawns[this.nextSpawn++],r=s.r??(s.kind==='dust'?10:s.kind==='boss'?58:18),hp=s.hp??(s.kind==='can'?2:s.kind==='boss'?36:1);
   this.enemies.push({id:this.nextEntity++,kind:s.kind,x:s.x,y:s.y,r,hp,vx:s.vx??0,vy:s.vy??0});
   if(s.kind==='boss'){this.bossHp=hp;this.events.push({type:'boss',x:s.x,y:s.y,kind:'boss'});}
  }
 }
 private step():void{
  this.tick++;this.spawnDue();const fullAtStart=this.charge===100;
  // 1. Movement/intake. Dust is physically pulled; the cone does not grant instant collection.
  const taken=new Set<number>();
  for(const e of this.enemies){
   if(this.sucking&&this.tick>=this.blockedUntil&&(e.kind==='dust'||e.kind==='bomb')&&this.inCone(e)){
    const dx=NOZZLE.x-e.x,dy=NOZZLE.y-e.y,d=Math.hypot(dx,dy),move=Math.min(d,360/120);
    if(d>0){e.x+=dx/d*move;e.y+=dy/d*move;}
    if(Math.hypot(NOZZLE.x-e.x,NOZZLE.y-e.y)<=24){taken.add(e.id);if(e.kind==='bomb'){if(this.bombUntil===0){this.bombUntil=this.tick+BOMB_TICKS;this.events.push({type:'bomb-catch',x:e.x,y:e.y,kind:'bomb'});}else this.charge=Math.min(100,this.charge+12);}else{this.absorbed++;if(e.salvage)this.salvageAbsorbed++;this.charge=Math.min(100,this.charge+12);if(this.mode==='run')this.score+=40;this.events.push({type:'intake',x:e.x,y:e.y,kind:'dust',score:this.mode==='run'?40:0});}}
   }else{e.x+=e.vx/120;e.y+=e.vy/120;}
  }
  this.enemies=this.enemies.filter(e=>!taken.has(e.id));
  if(this.charge===100&&!fullAtStart)this.events.push({type:'full',x:NOZZLE.x,y:NOZZLE.y});
  // Full charge stays usable; only a captured timed bomb can expire. No stun or suction cancel.
  if(this.bombUntil>0&&this.tick>=this.bombUntil){this.bombUntil=0;this.bombsExpired++;this.lives=Math.max(0,this.lives-1);this.invulnerableUntil=Math.max(this.invulnerableUntil,this.tick+INVULNERABLE_TICKS);this.events.push({type:'bomb-expire',x:NOZZLE.x,y:NOZZLE.y});}
  // 2. Swept primary shots, with the closest hit and deterministic id tie-break.
  const liveBullets:MutableBullet[]=[];
  for(const b of this.bullets){
   const nx=b.x+b.dx*1000/120,ny=b.y+b.dy*1000/120;let first:MutableEnemy|undefined,t=Infinity;
   for(const e of this.enemies){if(e.hp<=0||e.salvage||e.kind==='bomb')continue;const hit=segmentCircle(b.x,b.y,nx,ny,e.x,e.y,e.r+10);if(hit!==null&&(hit<t-1e-10||Math.abs(hit-t)<1e-10&&e.id<(first?.id??Infinity))){t=hit;first=e;}}
   if(first){const x=b.x+(nx-b.x)*t,y=b.y+(ny-b.y)*t;this.applyBlast({atTick:this.tick,serial:this.nextBlast++,x,y,shotId:b.shotId,primary:true});if(b.tier==='full')this.hitstopMs=Math.max(this.hitstopMs,35);}
   else{b.x=nx;b.y=ny;b.ageMs+=TICK_MS;if(b.ageMs<800-1e-6&&nx>=-10&&nx<=490&&ny>=-10&&ny<=490)liveBullets.push(b);}
  }
  this.bullets=liveBullets;
  this.blasts.sort((a,b)=>a.atTick-b.atTick||a.serial-b.serial);
  while(this.blasts.length&&this.blasts[0].atTick<=this.tick)this.applyBlast(this.blasts.shift()!);
  this.enemies=this.enemies.filter(e=>e.hp>0);
  // 3. Danger crossings all remove the can, but one life at most within the invulnerability period.
  const crossed=new Set<number>();
  for(const e of this.enemies){if(e.kind==='can'&&e.y>=DANGER_Y){crossed.add(e.id);if(this.tick>=this.invulnerableUntil){this.lives=Math.max(0,this.lives-1);this.invulnerableUntil=this.tick+INVULNERABLE_TICKS;this.events.push({type:'damage',x:e.x,y:e.y,kind:'can'});}}}
  this.enemies=this.enemies.filter(e=>!crossed.has(e.id)&&e.y<=510&&e.x>=-40&&e.x<=520);
  this.measureObjects();
  // 4. Terminal priority is fixed: life0 > boss death > deadline; attacks at the deadline still resolve.
  if(this.lives===0)this.finish('life');
  else if(this.bossHp===0)this.finish('clear');
  else if(this.tick>=this.durationTick)this.finish(this.mode==='practice'?'practice':'time');
  else if(this.mode==='practice'&&!this.enemies.some(e=>e.kind!=='dust'&&e.kind!=='bomb')&&this.maxChain>=1&&this.blasts.length===0)this.finish('practice');
  this.pruneShots();
 }
 private inCone(e:MutableEnemy):boolean{
  const dx=e.x-NOZZLE.x,dy=e.y-NOZZLE.y,d=Math.hypot(dx,dy);if(d>440)return false;if(d<=24)return true;
  const a=Math.atan2(dx,-dy)*180/Math.PI;return Math.abs(a-this.aimDeg)<=SUCTION_HALF_ANGLE;
 }
 private applyBlast(b:Blast):void{
  const shot=this.shots.get(b.shotId);if(!shot)return;const def=SHOT[shot.tier],radius=b.primary?shot.radius:64,damage=b.primary?shot.damage:2;
  this.events.push({type:'blast',primary:b.primary,x:b.x,y:b.y,radius,shotId:b.shotId,tier:shot.tier,bomb:shot.bomb&&b.primary});
  for(const e of this.enemies){
   if(e.hp<=0||e.salvage||e.kind==='bomb'||Math.hypot(e.x-b.x,e.y-b.y)>radius+e.r)continue;
   if(e.kind==='boss'){if(!b.primary||shot.bossHit)continue;shot.bossHit=true;}
   e.hp=Math.max(0,e.hp-damage);if(e.kind==='boss')this.bossHp=e.hp;
   if(e.hp>0)continue;
   shot.kills++;this.maxChain=Math.max(this.maxChain,shot.kills);
   const base=e.kind==='can'?150:e.kind==='bag'?300:e.kind==='dust'?40:0;
   const points=this.mode==='run'?(e.kind==='boss'?3000:Math.floor(base*def.multiplier*(10+Math.min(shot.kills-1,20))/10)):0;this.score+=points;
   this.events.push({type:'kill',enemyId:e.id,x:e.x,y:e.y,shotId:b.shotId,tier:shot.tier,chain:shot.kills,kind:e.kind,score:points});
   if(e.kind==='can'||e.kind==='bag'){const count=e.kind==='bag'?2:1;for(let i=0;i<count;i++)this.enemies.push({id:this.nextEntity++,kind:'dust',x:e.x+(i?12:-8),y:e.y+8,r:10,hp:1,vx:i?10:-10,vy:36,salvage:true});}
   if(e.kind==='can')this.blasts.push({atTick:this.tick+SECONDARY_TICKS,serial:this.nextBlast++,x:e.x,y:e.y,shotId:b.shotId,primary:false});
  }
 }
 private finish(result:NonNullable<Snapshot['result']>):void{
  if(this.state==='result')return;this.result=result;this.cancel();this.state='result';
  if(result==='clear'&&this.mode==='run')this.score+=this.lives*500+Math.floor(Math.max(0,(this.durationTick-this.tick)/120))*100;
  this.events.push({type:'finish',result,score:this.score});this.carryMs=0;
 }
 private rank():Snapshot['rank']{if(this.result!=='clear')return'C';return this.maxChain>=12&&this.lives>=2?'S':this.maxChain>=8?'A':'B';}
 private measureObjects():void{this.maxGameplayObjects=Math.max(this.maxGameplayObjects,this.enemies.length+this.bullets.length+this.blasts.length);}
 private pruneShots():void{const active=new Set([...this.bullets.map(b=>b.shotId),...this.blasts.map(b=>b.shotId)]);for(const id of this.shots.keys())if(!active.has(id))this.shots.delete(id);}
}
/** First intersection on a segment, not the end point: high-speed bullets cannot tunnel. */
export function segmentCircle(ax:number,ay:number,bx:number,by:number,cx:number,cy:number,r:number):number|null{
 const dx=bx-ax,dy=by-ay,fx=ax-cx,fy=ay-cy,c=fx*fx+fy*fy-r*r;if(c<=0)return 0;
 const a=dx*dx+dy*dy;if(a===0)return null;const b=2*(fx*dx+fy*dy),disc=b*b-4*a*c;if(disc<0)return null;
 const t=(-b-Math.sqrt(disc))/(2*a);return t>=0&&t<=1?t:null;
}
