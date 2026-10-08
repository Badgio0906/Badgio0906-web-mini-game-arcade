import { BLOCKS, inventory as freshInventory } from './Blocks';
import { freshStats,type Player,type Target,type WorldStats } from './Types';
import { bodyIntersects,EYE_HEIGHT,freshPlayer,safePlayer,stepPlayer } from './Physics';
import { lookDirection,raycast } from './Ray';
import type { World } from './World';
export interface EngineInput {forward:number;right:number;jump:boolean;dig:boolean}
export class Engine {
  readonly world:World; player:Player;inventory:number[];stats:WorldStats;selected=1;
  digProgress=0;target:Target|null=null;
  onEdit?: (kind:'mine'|'place',target:Target,block:number)=>void;
  private diggingKey:string|null=null;
  constructor(world:World,player?:Player,inventory?:number[],stats?:WorldStats) {
    this.world=world;this.player=player?safePlayer(world,player):freshPlayer(world);
    this.inventory=inventory?[...inventory]:freshInventory();
    this.stats=stats?{...stats,found:[...stats.found]}:freshStats();
    this.refreshTarget();
  }
  private refreshTarget():void {
    const p=this.player.position;
    this.target=raycast(this.world,{x:p.x,y:p.y+EYE_HEIGHT,z:p.z},lookDirection(this.player.yaw,this.player.pitch));
  }
  resetInput():void {this.diggingKey=null;this.digProgress=0;this.player.velocity.x=0;this.player.velocity.z=0;}
  returnToSurface():void {this.resetInput();this.player=freshPlayer(this.world);this.refreshTarget();}
  update(dt:number,input:EngineInput):void {
    const elapsed=Math.min(.1,Math.max(0,Number.isFinite(dt)?dt:0));
    stepPlayer(this.world,this.player,input,elapsed);this.refreshTarget();
    this.stats.activeSeconds+=elapsed;
    this.stats.maxDepth=Math.max(this.stats.maxDepth,Math.max(0,this.world.referenceHeight+1-this.player.position.y));
    const target=this.target;
    if(!input.dig||!target||!BLOCKS[target.block]?.breakable||this.world.protected(target.x,target.y,target.z)) {this.diggingKey=null;this.digProgress=0;return;}
    const key=`${target.x},${target.y},${target.z},${target.block}`;
    if(key!==this.diggingKey){this.diggingKey=key;this.digProgress=0;}
    this.digProgress=Math.min(1,this.digProgress+elapsed/BLOCKS[target.block]!.hardness);
    if(this.digProgress<1)return;
    // Canonical voxel mutation is the atomic guard against stale or duplicate mining.
    if(this.world.get(target.x,target.y,target.z)===target.block&&this.world.set(target.x,target.y,target.z,0)) {
      this.inventory[target.block]=(this.inventory[target.block]??0)+1;this.stats.mined++;
      if(this.world.baseAt(target.x,target.y,target.z)===target.block&&!this.stats.found.includes(target.block))this.stats.found.push(target.block);
      this.onEdit?.('mine',target,target.block);
    }
    this.diggingKey=null;this.digProgress=0;this.refreshTarget();
  }
  placement():{ok:boolean;reason:string;x:number;y:number;z:number;target:Target|null} {
    this.refreshTarget();const t=this.target;
    const result={ok:false,reason:'面を狙ってください',x:0,y:0,z:0,target:t};
    if(!t||t.distance>5||Math.abs(t.normal.x)+Math.abs(t.normal.y)+Math.abs(t.normal.z)!==1)return result;
    const x=t.x+t.normal.x,y=t.y+t.normal.y,z=t.z+t.normal.z;Object.assign(result,{x,y,z});
    const d=this.world.dimensions;
    if(x<0||y<1||z<0||x>=d.x||y>=d.y||z>=d.z){result.reason='世界の外には置けません';return result;}
    if(this.world.protected(x,y,z)){result.reason='帰還台と頭上を空けておきます';return result;}
    if(!BLOCKS[this.selected]?.placeable){result.reason='この素材は置けません';return result;}
    if((this.inventory[this.selected]??0)<1){result.reason='この素材は0個です';return result;}
    if(this.world.get(x,y,z)!==0){result.reason='すでにブロックがあります';return result;}
    if(bodyIntersects(this.player,x,y,z)){result.reason='自分の身体に重なる場所です';return result;}
    result.ok=true;result.reason='ここに置けます';return result;
  }
  place():{ok:boolean;reason:string} {
    this.resetInput();const p=this.placement();
    if(!p.ok||!p.target)return {ok:false,reason:p.reason};
    if(!this.world.set(p.x,p.y,p.z,this.selected))return {ok:false,reason:'対象が変わりました'};
    this.inventory[this.selected]!--;this.stats.placed++;
    this.onEdit?.('place',{...p.target,x:p.x,y:p.y,z:p.z,block:this.selected},this.selected);
    this.refreshTarget();return {ok:true,reason:'置きました'};
  }
}
