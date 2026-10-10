/** Pure Game032 rules. Seconds are active foreground time; no clocks, storage or network. */
export const FISHING_DURATION = 300;
export const SCORE_LIMIT = 100_000;
export type FishingMethod = 'bait' | 'lure';
export type FishingMode = 'standard' | 'practice';
export type FishingPhase = 'idle' | 'charging' | 'casting' | 'waiting' | 'nibble' | 'bite' | 'fight' | 'landed' | 'failed' | 'ended';
export type DistanceBucket = 'near' | 'medium' | 'far';
export type SpotId = 'shallows' | 'rocks' | 'shade' | 'pool';
export type FishId = 'oikawa' | 'ugui' | 'yamame' | 'amago' | 'nijimasu' | 'iwana' | 'lord';
export type FailureReason = 'early' | 'late' | 'line' | 'escaped' | 'no_bite';
export interface FishingSpot {
  readonly id: SpotId; readonly name: string; readonly x: number;
  readonly preferred: DistanceBucket; readonly hint: string; readonly biteChance: number;
  readonly sizeBias: number; readonly weights: readonly number[];
}
export interface FishDefinition {
  readonly id: FishId; readonly name: string; readonly minCm: number; readonly maxCm: number;
  readonly basePoints: number; readonly rareBonus: number; readonly strength: number;
  readonly description: string;
}
export const FISH: readonly FishDefinition[] = Object.freeze(([
  {id:'oikawa',name:'オイカワ',minCm:8,maxCm:18,basePoints:30,rareBonus:0,strength:.78,description:'浅瀬を泳ぐ、銀色の小さな魚。'},
  {id:'ugui',name:'ウグイ',minCm:14,maxCm:30,basePoints:65,rareBonus:0,strength:.88,description:'ゆるい流れで見かける、すらりとした魚。'},
  {id:'yamame',name:'ヤマメ',minCm:15,maxCm:34,basePoints:105,rareBonus:0,strength:1,description:'岩陰を好む、斑紋のきれいな川魚。'},
  {id:'amago',name:'アマゴ',minCm:16,maxCm:36,basePoints:115,rareBonus:25,strength:1.03,description:'小さな朱点が目印。木陰にも姿を見せる。'},
  {id:'nijimasu',name:'ニジマス',minCm:25,maxCm:58,basePoints:180,rareBonus:0,strength:1.14,description:'深みを泳ぐ、力強い大きな魚。'},
  {id:'iwana',name:'イワナ',minCm:20,maxCm:45,basePoints:150,rareBonus:45,strength:1.1,description:'静かな木陰に潜む、白い点の川魚。'},
  {id:'lord',name:'川の主',minCm:62,maxCm:90,basePoints:700,rareBonus:200,strength:1.5,description:'ごくまれに出会う、清流の大きな主。'},
] as FishDefinition[]).map(f => Object.freeze(f)));
export const SPOTS: readonly FishingSpot[] = Object.freeze([
  {id:'shallows',name:'浅瀬',x:.14,preferred:'near',hint:'近くのゆるい流れ。小魚がよく集まる。',biteChance:.94,sizeBias:.05,weights:[49,30,12,5,2,2,.1]},
  {id:'rocks',name:'岩陰',x:.38,preferred:'medium',hint:'岩のそばへほどよく。ヤマメが好む。',biteChance:.9,sizeBias:.2,weights:[12,16,39,16,9,8,.2]},
  {id:'shade',name:'木陰',x:.63,preferred:'near',hint:'枝の下へ近く投げる。イワナやアマゴの気配。',biteChance:.86,sizeBias:.28,weights:[7,10,18,30,8,27,.7]},
  {id:'pool',name:'深み',x:.86,preferred:'far',hint:'奥の深い流れへ遠投。大物の気配、待ち時間は長め。',biteChance:.82,sizeBias:.5,weights:[3,10,12,10,42,23,1.2]},
].map(s => Object.freeze({...s,weights:Object.freeze(s.weights)})) as FishingSpot[]);
export interface FishCatch {
  readonly fishId: FishId; readonly name: string; readonly sizeCm: number; readonly points: number;
  readonly rare: boolean; readonly big: boolean; readonly spotId: SpotId; readonly distance: DistanceBucket; readonly method: FishingMethod;
}
export interface FishingEvent {
  readonly type: 'spot_changed'|'cast_started'|'cast_released'|'splash'|'bite_small'|'bite_ready'|'bite_hook_success'|'bite_hook_fail_early'|'bite_hook_fail_late'|'fish_hooked'|'fish_landed'|'fish_escaped'|'session_end';
  readonly data: Readonly<Record<string, string | number | boolean>>;
}
export interface FishingInput { readonly left?: boolean; readonly right?: boolean; readonly reeling?: boolean; }
export interface FishingSnapshot {
  readonly mode: FishingMode; readonly phase: FishingPhase; readonly elapsed: number; readonly remaining: number|null;
  readonly phaseTime: number; readonly playerX: number; readonly spotId: SpotId; readonly charge: number;
  readonly targetX: number; readonly targetPower: number; readonly method: FishingMethod; readonly lureProgress: number; readonly lurePulse: number;
  readonly castPower: number; readonly castDistance: DistanceBucket; readonly tension: number;
  readonly fightProgress: number; readonly fishPulling: boolean; readonly pullTimeRemaining: number;
  readonly biteTimeRemaining: number; readonly reeling: boolean; readonly fish: FishDefinition|null;
  readonly lastCatch: FishCatch|null; readonly catches: readonly FishCatch[]; readonly score: number;
  readonly streak: number; readonly maxStreak: number; readonly failure: FailureReason|null; readonly paused: boolean;
}
export interface FishingOptions { readonly mode?: FishingMode; readonly random?: () => number; }
const CAST_SECONDS=.9, NIBBLE_SECONDS=.8, CHARGE_SECONDS=1.25, BAIT_MAX_WAIT=12, LURE_COOLDOWN=.25, EPS=1e-8;
const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));
export const distanceBucket=(power:number):DistanceBucket=>power<.34?'near':power<.74?'medium':'far';

export class FishingModel {
  readonly mode: FishingMode;
  private readonly random:()=>number;
  private phase: FishingPhase='idle';
  private elapsed=0;
  private phaseTime=0;
  private readonly playerX=.14;
  private targetX=.14;
  private targetPower=.15;
  private method:FishingMethod='bait';
  private lureProgress=0;
  private lurePulse=0;
  private lureCooldown=0;
  private lureRetrieves=0;
  private spotIndex=0;
  private charge=0;
  private castPower=0;
  private castDistance:DistanceBucket='near';
  private tension=0;
  private fightProgress=0;
  private pulling=true;
  private pullClock=0;
  private pullDuration=1.3;
  private reeling=false;
  private paused=false;
  private waitDuration=3;
  private biteDuration=1.6;
  private pendingFish:FishDefinition|null=null;
  private fish:FishDefinition|null=null;
  private sizeCm=0;
  private lastCatch:FishCatch|null=null;
  private catches:FishCatch[]=[];
  private score=0;
  private streak=0;
  private maxStreak=0;
  private failure:FailureReason|null=null;
  private events:FishingEvent[]=[];
  constructor(options:FishingOptions={}) {this.mode=options.mode??'standard';this.random=options.random??Math.random;}
  get snapshot():FishingSnapshot {
    return Object.freeze({mode:this.mode,phase:this.phase,elapsed:this.elapsed,remaining:this.mode==='standard'?Math.max(0,FISHING_DURATION-this.elapsed):null,
      phaseTime:this.phaseTime,playerX:this.playerX,targetX:this.targetX,targetPower:this.targetPower,method:this.method,lureProgress:this.lureProgress,lurePulse:this.lurePulse,spotId:SPOTS[this.spotIndex].id,charge:this.charge,castPower:this.castPower,castDistance:this.castDistance,
      tension:this.tension,fightProgress:this.fightProgress,fishPulling:this.pulling,pullTimeRemaining:Math.max(0,this.pullDuration-this.pullClock),
      biteTimeRemaining:this.phase==='bite'?Math.max(0,this.biteDuration-this.phaseTime):0,reeling:this.reeling,fish:this.fish,
      lastCatch:this.lastCatch,catches:Object.freeze([...this.catches]),score:this.score,streak:this.streak,maxStreak:this.maxStreak,failure:this.failure,paused:this.paused});
  }
  drainEvents():FishingEvent[] {const out=this.events;this.events=[];return out;}
  /** Direct river aiming; depth is normalized from near (0) to far (1). */
  setTarget(xNorm:number,powerNorm:number):boolean {
    if(this.paused||(this.phase!=='idle'&&this.phase!=='charging')||!Number.isFinite(xNorm)||!Number.isFinite(powerNorm))return false;
    this.targetX=clamp(xNorm,.06,.94);this.targetPower=clamp(powerNorm,0,1);
    let nearest=0;for(let i=1;i<SPOTS.length;i++)if(Math.abs(SPOTS[i].x-this.targetX)<Math.abs(SPOTS[nearest].x-this.targetX))nearest=i;
    if(nearest!==this.spotIndex){this.spotIndex=nearest;this.emit('spot_changed',{spot_id:SPOTS[nearest].id});}
    return true;
  }
  setMethod(method:FishingMethod):boolean {
    if(this.paused||this.phase!=='idle'||(method!=='bait'&&method!=='lure'))return false;
    this.method=method;this.lureProgress=0;this.lurePulse=0;return true;
  }
  /** One fresh retrieve action, not a held reel. No fish is attracted without clicks. */
  retrieveLure():boolean {
    if(this.paused||this.method!=='lure'||this.phase!=='waiting'||this.lureCooldown>EPS)return false;
    this.lureCooldown=LURE_COOLDOWN;this.lurePulse=1;this.lureRetrieves++;
    this.lureProgress=clamp(this.lureRetrieves/10,0,1);
    const spot=SPOTS[this.spotIndex],matched=spot.preferred===this.castDistance;
    // Different points/depths change attraction. A complete retrieve always offers
    // one bite opportunity, never a guaranteed hook or catch.
    if(this.lureRetrieves>=2&&(this.roll()<spot.biteChance*(matched?.65:.38)||this.lureRetrieves>=10))this.beginNibble();
    return true;
  }
  startCharge():boolean {
    if(this.paused||this.phase!=='idle')return false;
    this.charge=0;this.failure=null;this.fish=null;this.pendingFish=null;this.lureProgress=0;this.lurePulse=0;this.lureCooldown=0;this.lureRetrieves=0;this.enter('charging');
    this.emit('cast_started',{spot_id:SPOTS[this.spotIndex].id,method:this.method});return true;
  }
  releaseCast():boolean {
    if(this.paused||this.phase!=='charging')return false;
    this.castPower=this.targetPower;this.castDistance=distanceBucket(this.targetPower);
    this.waitDuration=2.2+this.roll()*2+(this.spotIndex===3?1.5:0);
    this.enter('casting');this.emit('cast_released',{spot_id:SPOTS[this.spotIndex].id,distance:this.castDistance,method:this.method,charge_ms:Math.round(this.charge*CHARGE_SECONDS*1000)});return true;
  }
  hook():boolean {
    if(this.paused)return false;
    if(this.phase==='waiting'||this.phase==='nibble') {this.fail('early');return false;}
    if(this.phase!=='bite'||!this.pendingFish)return false;
    this.fish=this.pendingFish;this.tension=.25;this.fightProgress=0;this.pulling=true;this.pullClock=0;
    this.pullDuration=1.1+this.fish.strength*.25;this.reeling=false;this.enter('fight');
    this.emit('bite_hook_success',{spot_id:SPOTS[this.spotIndex].id});this.emit('fish_hooked',{fish_id:this.fish.id,size_cm:this.sizeCm});return true;
  }
  setReeling(value:boolean):void {this.reeling=!this.paused&&this.phase==='fight'&&value;}
  /** pointercancel/lost capture must not cast or keep reeling. */
  cancelInput():void {
    this.reeling=false;
    if(this.phase==='charging'){this.charge=0;this.enter('idle');}
  }
  /** Pause cancels held actions and an unfinished charge. Resume requires a fresh gesture. */
  setPaused(value:boolean):void {
    this.paused=value;
    if(value)this.cancelInput();
    else this.reeling=false;
  }
  update(dt:number,input:FishingInput={}):void {
    if(this.paused||this.phase==='ended'||!Number.isFinite(dt)||dt<=0)return;
    if(input.reeling!==undefined)this.setReeling(input.reeling);
    // Never simulate minutes of background catch-up; substeps preserve hook/fight boundaries.
    let remaining=Math.min(dt,.25);
    while(remaining>EPS){
      let step=Math.min(remaining,1/120);
      if(this.mode==='standard')step=Math.min(step,FISHING_DURATION-this.elapsed);
      this.elapsed+=step;
      if(this.mode==='standard'&&this.elapsed>=FISHING_DURATION-EPS){this.elapsed=FISHING_DURATION;this.reeling=false;this.enter('ended');this.emit('session_end',{score:this.score,fish_count:this.catches.length,max_size_cm:Math.max(0,...this.catches.map(c=>c.sizeCm))});break;}
      this.step(step);remaining-=step;
    }
  }
  private step(dt:number):void {
    this.phaseTime+=dt;
    this.lureCooldown=Math.max(0,this.lureCooldown-dt);this.lurePulse=Math.max(0,this.lurePulse-dt*3);
    if(this.phase==='charging')this.charge=clamp(this.phaseTime/CHARGE_SECONDS,0,1);
    else if(this.phase==='casting'&&this.phaseTime>=CAST_SECONDS-EPS){this.enter('waiting');this.emit('splash',{distance:this.castDistance,method:this.method});}
    else if(this.phase==='waiting'&&this.method==='bait'&&this.phaseTime>=this.waitDuration-EPS){
      const spot=SPOTS[this.spotIndex],matched=spot.preferred===this.castDistance;
      const chance=this.mode==='practice'?1:spot.biteChance*(matched?1:.63);
      if(this.roll()<chance||this.phaseTime>=BAIT_MAX_WAIT-EPS)this.beginNibble();
      else this.waitDuration=Math.min(BAIT_MAX_WAIT,this.phaseTime+1.8);
    }else if(this.phase==='nibble'&&this.phaseTime>=NIBBLE_SECONDS-EPS){this.biteDuration=this.mode==='practice'?2.3:1.6;this.enter('bite');this.emit('bite_ready',{window_ms:this.biteDuration*1000});}
    else if(this.phase==='bite'&&this.phaseTime>=this.biteDuration-EPS)this.fail('late');
    else if(this.phase==='fight'&&this.fish){
      this.pullClock+=dt;
      if(this.pullClock>=this.pullDuration-EPS){this.pullClock=0;this.pulling=!this.pulling;this.pullDuration=this.pulling?1.1+this.fish.strength*.25:1.9;}
      const practiceScale=this.mode==='practice'?.68:1;
      if(this.pulling){this.tension+=dt*(this.reeling?.47*this.fish.strength*practiceScale:.025);if(this.reeling)this.fightProgress+=dt*.024/this.fish.strength;}
      else {this.tension-=dt*(this.reeling?.09:.24);if(this.reeling)this.fightProgress+=dt*.34/this.fish.strength;}
      this.tension=clamp(this.tension,0,1);this.fightProgress=clamp(this.fightProgress,0,1);
      if(this.tension>=1-EPS)this.fail('line');
      else if(this.fightProgress>=1-EPS)this.land();
      else if(this.phaseTime>(this.fish.id==='lord'?32:24))this.fail('escaped');
    }else if((this.phase==='landed'&&this.phaseTime>=1.4-EPS)||(this.phase==='failed'&&this.phaseTime>=1.6-EPS)) {this.reeling=false;this.charge=0;this.fish=null;this.pendingFish=null;this.enter('idle');}
  }
  private beginNibble():void {
    const spot=SPOTS[this.spotIndex],matched=spot.preferred===this.castDistance;
    this.pendingFish=this.selectFish(spot,matched);
    const sizeFraction=clamp(this.roll()*.78+spot.sizeBias*(matched?.44:.14),0,1);
    this.sizeCm=Math.round((this.pendingFish.minCm+(this.pendingFish.maxCm-this.pendingFish.minCm)*sizeFraction)*10)/10;
    this.enter('nibble');this.emit('bite_small',{spot_id:spot.id,method:this.method});
  }
  private selectFish(spot:FishingSpot,matched:boolean):FishDefinition {
    const weights=spot.weights.map((w,i)=>i>=4&&!matched?w*.45:w);
    let choice=this.roll()*weights.reduce((a,b)=>a+b,0);
    for(let i=0;i<weights.length;i++){choice-=weights[i];if(choice<0)return FISH[i];}
    return FISH[FISH.length-1];
  }
  private land():void {
    if(!this.fish)return;
    this.streak++;this.maxStreak=Math.max(this.maxStreak,this.streak);
    const fraction=(this.sizeCm-this.fish.minCm)/(this.fish.maxCm-this.fish.minCm);
    const big=fraction>=.8;
    const points=this.fish.basePoints+Math.round(clamp(fraction,0,1)*80)+this.fish.rareBonus+(big?100:0)+Math.min(30,(this.streak-1)*5);
    const caught=Object.freeze({fishId:this.fish.id,name:this.fish.name,sizeCm:this.sizeCm,points,rare:this.fish.rareBonus>0,big,spotId:SPOTS[this.spotIndex].id,distance:this.castDistance,method:this.method});
    this.lastCatch=caught;this.catches.push(caught);this.score+=points;this.reeling=false;this.enter('landed');
    this.emit('fish_landed',{fish_id:caught.fishId,size_cm:caught.sizeCm,points,rare:caught.rare,big:caught.big,spot_id:caught.spotId,method:caught.method});
  }
  private fail(reason:FailureReason):void {
    this.failure=reason;this.streak=0;this.reeling=false;this.enter('failed');
    if(reason==='early')this.emit('bite_hook_fail_early',{spot_id:SPOTS[this.spotIndex].id});
    else if(reason==='late')this.emit('bite_hook_fail_late',{spot_id:SPOTS[this.spotIndex].id});
    this.emit('fish_escaped',{reason,spot_id:SPOTS[this.spotIndex].id});
  }
  private enter(phase:FishingPhase):void {this.phase=phase;this.phaseTime=0;}
  private roll():number {const value=this.random();return Number.isFinite(value)?clamp(value,0,1-Number.EPSILON):.5;}
  private emit(type:FishingEvent['type'],data:FishingEvent['data']):void {if(this.events.length>=256)this.events.shift();this.events.push(Object.freeze({type,data:Object.freeze(data)}));}
}
