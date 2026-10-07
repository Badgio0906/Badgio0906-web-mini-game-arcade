export type Kind = 'clip'|'eraser'|'pen'|'badge'|'key'|'usb'|'calculator'|'phone'|'fountain'|'oldphone'|'goldusb'|'keys'|'master';
export type Upgrade = 'depth'|'capacity'|'width';
export type Phase = 'ready'|'descending'|'ascending'|'returned'|'finished';
export interface Item { id: number; x: number; depth: number; kind: Kind; value: number; caught: boolean }
export interface FishingState { version: 1; seed: number; castNumber: number; phase: Phase; depth: number; x: number; maxDepth: number; capacity: number; width: number; balance: number; score: number; casts: number; totalCaught: number; items: Item[]; bag: number[]; lastValue: number; lastCaught: number; maxReached: number; rarestKind: Kind|null; rarestProbability: number }
export const NAMES: Record<Kind,string> = {clip:'クリップ',eraser:'消しゴム',pen:'ペン',badge:'社員証ケース',key:'鍵',usb:'USB',calculator:'電卓',phone:'スマホ',fountain:'万年筆',oldphone:'古い携帯',goldusb:'金色USB',keys:'鍵束',master:'マスターキーっぽいもの'};
const VALUES: Record<Kind,number> = {clip:8,eraser:12,pen:18,badge:22,key:32,usb:40,calculator:48,phone:58,fountain:75,oldphone:85,goldusb:110,keys:95,master:160};
export const CAPS = { depth: 300, capacity: 8, width: 3 };
const MAX_TOTAL = 1_000_000_000;
const clamp = (v:number, lo:number, hi:number) => Math.min(hi,Math.max(lo,v));
export function rng(seed:number): () => number { let x=seed>>>0; return () => { x=(x+0x6d2b79f5)>>>0; let t=Math.imul(x^(x>>>15),1|x); t^=t+Math.imul(t^(t>>>7),61|t); return ((t^(t>>>14))>>>0)/4294967296; }; }
/** One cast owns at most48 immutable-position objects. Rarity draw: 2% master +3% gold USB at every depth; otherwise choose uniformly in the depth tier. */
export function generate(seed:number, depth:number): Item[] {
  const random=rng(seed), count=Math.min(48,Math.round(depth/5)+8);
  return Array.from({length:count},(_,id) => { const d=8+random()*(depth-16), r=random();
    const tier:Kind[]=d<70?['clip','eraser','pen','badge']:d<160?['key','usb','calculator','phone']:['fountain','oldphone','goldusb','keys'];
    const kind:Kind=r<.02?'master':r<.05?'goldusb':tier[Math.floor(random()*tier.length)];
    return {id,x:28+random()*304,depth:d,kind,value:VALUES[kind],caught:false};
  });
}
export class Fishing {
  state: FishingState;
  constructor(seed=Date.now()>>>0) { this.state={version:1,seed:seed>>>0,castNumber:0,phase:'ready',depth:0,x:180,maxDepth:100,capacity:3,width:1,balance:0,score:0,casts:0,totalCaught:0,items:[],bag:[],lastValue:0,lastCaught:0,maxReached:0,rarestKind:null,rarestProbability:1}; }
  cast(): boolean { const s=this.state; if(s.phase!=='ready'&&s.phase!=='returned') return false;
    s.castNumber=Math.min(MAX_TOTAL,s.castNumber+1); s.phase='descending'; s.depth=0;s.x=180;s.bag=[];s.lastValue=0;s.lastCaught=0;
    s.items=generate((s.seed^Math.imul(s.castNumber,2654435761))>>>0,s.maxDepth); return true;
  }
  moveTo(x:number):void { if(this.state.phase==='ascending'&&Number.isFinite(x)) this.state.x=clamp(x,18,342); }
  step(seconds:number,direction=0): {picked: Item[]; returned: boolean; turned: boolean} {
    const s=this.state, picked:Item[]=[], dt=clamp(seconds,0,1/60); let returned=false,turned=false;
    if(s.phase==='descending') { s.depth=Math.min(s.maxDepth,s.depth+45*dt); s.maxReached=Math.max(s.maxReached,s.depth); if(s.depth>=s.maxDepth){s.phase='ascending';turned=true;} }
    else if(s.phase==='ascending') { this.moveTo(s.x+clamp(direction,-1,1)*185*dt); const old=s.depth;s.depth=Math.max(0,s.depth-25*dt);
      // Swept vertical contact avoids skipping an object at any fixed-step boundary.
      for(const item of s.items) if(!item.caught&&s.bag.length<s.capacity&&item.depth<=old+3&&item.depth>=s.depth-3&&Math.abs(item.x-s.x)<=10+8*s.width) {item.caught=true;s.bag.push(item.id);picked.push(item);const probability=item.kind==='master'?.02:item.kind==='goldusb'?(item.depth>=160?.2675:.03):.2375;if(probability<s.rarestProbability){s.rarestProbability=probability;s.rarestKind=item.kind;}}
      if(s.depth===0){ this.deposit(); returned=true; }
    }
    return {picked,returned,turned};
  }
  deposit():boolean { const s=this.state;if(s.phase!=='ascending'||s.depth!==0)return false;
    const value=s.items.filter(i=>s.bag.includes(i.id)).reduce((n,i)=>n+i.value,0);
    s.lastCaught=s.bag.length;s.lastValue=value;s.score=Math.min(MAX_TOTAL,s.score+value);s.balance=Math.min(MAX_TOTAL,s.balance+value);s.casts=Math.min(MAX_TOTAL,s.casts+1);s.totalCaught=Math.min(MAX_TOTAL,s.totalCaught+s.bag.length);s.phase='returned';return true;
  }
  price(type:Upgrade):number|null { const s=this.state,level=type==='depth'?(s.maxDepth-100)/50:type==='capacity'?s.capacity-3:s.width-1;
    if((type==='depth'?s.maxDepth:s[type])>=CAPS[type])return null;return (type==='depth'?55:type==='capacity'?40:65)*(level+1); }
  upgrade(type:Upgrade):boolean { const s=this.state;if(!['ready','returned'].includes(s.phase))return false;const p=this.price(type);if(p===null||s.balance<p)return false;s.balance-=p;if(type==='depth')s.maxDepth+=50;else s[type]++;return true; }
  finish():boolean { if(!['ready','returned'].includes(this.state.phase))return false;this.state.phase='finished';this.state.items=[];this.state.bag=[];return true; }
  static restore(raw:unknown):Fishing|null {
    if(!raw||typeof raw!=='object')return null;const s=raw as FishingState;
    const integer=(v:unknown,lo:number,hi:number):v is number => typeof v==='number'&&Number.isInteger(v)&&v>=lo&&v<=hi;
    if(s.version!==1||!integer(s.seed,0,4294967295)||!integer(s.castNumber,0,MAX_TOTAL)||!['ready','descending','ascending','returned','finished'].includes(s.phase)||!integer(s.maxDepth,100,300)||(s.maxDepth-100)%50||!integer(s.capacity,3,8)||!integer(s.width,1,3)||!Number.isFinite(s.depth)||s.depth<0||s.depth>s.maxDepth||!Number.isFinite(s.x)||s.x<18||s.x>342||!Array.isArray(s.items)||s.items.length>48||!Array.isArray(s.bag)||s.bag.length>s.capacity||new Set(s.bag).size!==s.bag.length)return null;
    for(const key of ['balance','score','casts','totalCaught','lastValue','lastCaught'] as const) if(!integer(s[key],0,MAX_TOTAL))return null;
    if(new Set(s.items.map(i=>i.id)).size!==s.items.length||s.items.some(i=>!integer(i.id,0,47)||!Number.isFinite(i.x)||i.x<28||i.x>332||!Number.isFinite(i.depth)||i.depth<0||i.depth>s.maxDepth||!Object.hasOwn(VALUES,i.kind)||i.value!==VALUES[i.kind]||typeof i.caught!=='boolean'))return null;
    if(s.bag.some(id=>!s.items.some(i=>i.id===id&&i.caught))||s.items.some(i=>i.caught!==s.bag.includes(i.id)))return null;
    if(!Number.isFinite(s.maxReached)||s.maxReached<0||s.maxReached>s.maxDepth||!Number.isFinite(s.rarestProbability)||s.rarestProbability<.02||s.rarestProbability>1||s.rarestKind!==null&&!Object.hasOwn(VALUES,s.rarestKind))return null;
    if(s.phase==='returned'&&s.depth!==0||s.phase==='descending'&&s.bag.length>0)return null;
    const model=new Fishing();model.state=structuredClone(s);return model;
  }
}
