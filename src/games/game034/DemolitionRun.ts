import Matter from 'matter-js';
export interface ToyBlock {id:string;x:number;y:number;width:number;height:number;material:number;density?:number;cut?:boolean;fixed?:boolean;angle?:number}
export interface Site {id:number;name:string;hint:string;target:{left:number;right:number};hutX:number;blocks:ToyBlock[]}
const block=(id:string,x:number,y:number,width:number,height:number,material=0,density=.0015):ToyBlock=>({id,x,y,width,height,material,density});
function makeSite(id:number,name:string,supports:number[],upper:ToyBlock[],target:[number,number],hutX:number,hint:string):Site {
 const feet=supports.map((x,i)=>({...block(`foot-${i}`,x,472,20,96,3),cut:true,fixed:true}));
 const beams=[{...block('beam-left',335,416,90,16,0),cut:true},{...block('beam-right',425,416,90,16,0),cut:true}];
 return {id,name,hint,target:{left:target[0],right:target[1]},hutX,blocks:[...feet,...beams,...upper]};
}
/** All visible parts are individual rigid bodies, including the selectable beams. */
export const SITES:readonly Site[]=[
 makeSite(0,'ふたつ足の門',[320,440],[block('arch-left',335,376,35,64,1),block('arch-right',425,376,35,64,1),block('cap',380,332,140,24,2)],[230,530],95,'片足を外すと、門はどちらへ傾く？'),
 makeSite(1,'右ポケット工場',[310,380,450],[block('factory',380,380,152,56,1),block('heavy',435,332,60,40,3,.003),block('chimney',325,321,24,62,2)],[265,565],115,'右の重い箱。倒す向きと小屋の距離を見よう。'),
 makeSite(2,'左重りの時計塔',[325,435],[block('tower-base',380,376,90,64,2),block('tower',360,314,54,60,1),block('clock',338,266,90,36,3,.0025)],[195,485],650,'左に寄る時計。反対側の支えを残すと？'),
 makeSite(3,'三つ足の橋',[295,380,465],[block('bridge-left',325,380,50,56,1),block('bridge-right',435,380,50,56,1),block('bridge-top',380,340,190,24,2)],[245,515],660,'足だけでなく、木の継ぎ梁も外せます。'),
 makeSite(4,'階段のお城',[310,380,450],[block('castle-base',380,384,160,48,1),block('step-left',325,340,50,40,2),block('step-mid',375,320,50,80,2),block('step-right',425,300,50,120,1)],[245,550],105,'段差の高さで、崩れる順番が変わる。'),
 makeSite(5,'ふたこぶホテル',[325,435],[block('hotel-left',335,358,54,100,1),block('hotel-right',425,370,54,76,2),block('hotel-link',380,310,140,16,0),block('roof',365,282,70,40,3)],[205,505],665,'二つの塔は、てっぺんの梁で支え合う。'),
 makeSite(6,'空中の四角い庭',[300,380,460],[block('garden-left',320,380,30,56,1),block('garden-right',440,380,30,56,1),block('garden-top',380,342,180,20,2),block('planter-left',320,316,42,32,3),block('planter-right',445,308,52,48,2,.0025)],[255,545],105,'空洞の上の庭。中の支柱と両端を比べよう。'),
 makeSite(7,'ずれずれ本社',[315,380,445],[block('office-low',390,382,150,52,1),block('office-mid',365,333,118,46,2),block('office-top',405,287,134,46,1),block('office-tank',420,248,40,32,3,.003)],[240,535],650,'最上部は右、中央は左。少ない箇所で低く。'),
];
export interface PiecePose {id:string;x:number;y:number;angle:number;width:number;height:number;material:number;cut:boolean;fixed:boolean;mass:number}
export interface SiteResult {score:number;containment:number;demolished:number;protected:boolean;cuts:number;clean:boolean;highest:number;site:number}
export type DemolitionPhase='selecting'|'simulating'|'result';
interface Live {definition:ToyBlock;body:Matter.Body;initialY:number}
export class DemolitionRun {
 readonly engine=Matter.Engine.create({enableSleeping:true,positionIterations:10,velocityIterations:8});
 readonly selected=new Set<string>();phase:DemolitionPhase='selecting';time=0;site:Site;private pieces:Live[]=[];private hut!:Matter.Body;private accumulator=0;private hutHit=false;private resultValue:SiteResult|null=null;
 constructor(siteIndex=0){this.site=SITES[siteIndex%SITES.length];this.load(siteIndex);}
 load(index:number){this.site=SITES[Math.max(0,Math.floor(index))%SITES.length];Matter.Composite.clear(this.engine.world,false);Matter.Engine.clear(this.engine);this.engine.timing.timestamp=0;this.engine.gravity.scale=.00085;this.selected.clear();this.phase='selecting';this.time=this.accumulator=0;this.hutHit=false;this.resultValue=null;
  const ground=Matter.Bodies.rectangle(380,540,1700,40,{isStatic:true,friction:1,label:'ground'});this.hut=Matter.Bodies.rectangle(this.site.hutX,496,64,48,{isStatic:true,label:'protected-hut'});
  this.pieces=this.site.blocks.map(definition=>{const body=Matter.Bodies.rectangle(definition.x,definition.y,definition.width,definition.height,{isStatic:definition.fixed??false,density:definition.density??.0015,friction:.65,frictionStatic:1.2,frictionAir:.006,restitution:.02,slop:.02,label:definition.id,angle:definition.angle??0});return {definition,body,initialY:definition.y};});
  Matter.Composite.add(this.engine.world,[ground,this.hut,...this.pieces.map(p=>p.body)]);
  // Settle the assembled toy before taking the reference. Only explicit execution advances play time.
  for(let n=0;n<120;n++)Matter.Engine.update(this.engine,1000/120);for(const p of this.pieces)p.initialY=p.body.position.y;
 }
 candidates(){return this.pieces.filter(p=>p.definition.cut).map(p=>this.pose(p));}
 toggle(id:string){if(this.phase!=='selecting'||!this.pieces.some(p=>p.definition.id===id&&p.definition.cut))return false;if(this.selected.delete(id))return true;if(this.selected.size>=3)return false;this.selected.add(id);return true;}
 execute(){if(this.phase!=='selecting'||this.selected.size<1)return false;for(const p of this.pieces)if(this.selected.has(p.definition.id))Matter.Composite.remove(this.engine.world,p.body);this.pieces=this.pieces.filter(p=>!this.selected.has(p.definition.id));for(const p of this.pieces)if(!p.body.isStatic)Matter.Sleeping.set(p.body,false);this.phase='simulating';return true;}
 step(seconds:number){if(this.phase!=='simulating'||!Number.isFinite(seconds)||seconds<=0)return;this.accumulator+=Math.min(.05,seconds);while(this.accumulator+1e-10>=1/120&&this.phase==='simulating'){this.accumulator-=1/120;this.time+=1/120;Matter.Engine.update(this.engine,1000/120);
   const collided=this.engine.pairs.list.some((p:Matter.Pair)=>p.isActive&&(p.bodyA===this.hut||p.bodyB===this.hut)&&p.bodyA.label!=='ground'&&p.bodyB.label!=='ground');if(collided)this.hutHit=true;
   if(this.time>=8){this.phase='result';this.resultValue=this.calculate();}
  }}
 private calculate():SiteResult {const movable=this.pieces.filter(p=>!p.body.isStatic);let mass=0,inside=0,lowered=0;let highest=520;
  for(const p of movable){const b=p.body;mass+=b.mass;const overlap=Math.max(0,Math.min(b.bounds.max.x,this.site.target.right)-Math.max(b.bounds.min.x,this.site.target.left)),fraction=Math.min(1,overlap/Math.max(1,b.bounds.max.x-b.bounds.min.x));inside+=b.mass*fraction;
   const fall=Math.max(0,b.position.y-p.initialY),low=Math.max(0,Math.min(1,(fall-12)/78));lowered+=b.mass*low;highest=Math.min(highest,b.bounds.min.y);
  }
  const containment=mass?inside/mass:0,demolished=mass?lowered/mass:0,protectedHut=!this.hutHit,clean=containment>=.9&&demolished>=.7&&protectedHut;
  const base=Math.round(containment*350+demolished*400+(protectedHut?150:0));const economy=demolished>=.55&&protectedHut?(4-this.selected.size)*60:0;
  return {score:Math.round((base+economy)*(1+this.site.id*.08)),containment,demolished,protected:protectedHut,cuts:this.selected.size,clean,highest:520-highest,site:this.site.id};
 }
 private pose(p:Live):PiecePose {const d=p.definition,b=p.body;return {id:d.id,x:b.position.x,y:b.position.y,angle:b.angle,width:d.width,height:d.height,material:d.material,cut:!!d.cut,fixed:!!d.fixed,mass:b.mass};}
 poses(){return this.pieces.map(p=>this.pose(p));}result(){return this.resultValue?{...this.resultValue}:null;}
 destroy(){Matter.Composite.clear(this.engine.world,false);Matter.Engine.clear(this.engine);}
}
