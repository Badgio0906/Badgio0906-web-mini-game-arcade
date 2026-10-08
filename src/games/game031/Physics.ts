import type { Player,Vec3 } from './Types';
import type { World } from './World';
export const BODY_WIDTH=.6,BODY_HEIGHT=1.8,EYE_HEIGHT=1.6;
const HALF=BODY_WIDTH/2,EPSILON=.000001;
export function freshPlayer(world:World):Player {
  return {position:{...world.spawn},velocity:{x:0,y:0,z:0},yaw:0,pitch:0,grounded:true};
}
export function bodyIntersects(player:Player,x:number,y:number,z:number):boolean {
  const p=player.position;
  return p.x+HALF>x+EPSILON&&p.x-HALF<x+1-EPSILON&&p.y+BODY_HEIGHT>y+EPSILON&&p.y<y+1-EPSILON&&p.z+HALF>z+EPSILON&&p.z-HALF<z+1-EPSILON;
}
function collision(world:World,p:Vec3):boolean {
  for(let y=Math.floor(p.y+EPSILON);y<=Math.floor(p.y+BODY_HEIGHT-EPSILON);y++)
    for(let z=Math.floor(p.z-HALF+EPSILON);z<=Math.floor(p.z+HALF-EPSILON);z++)
      for(let x=Math.floor(p.x-HALF+EPSILON);x<=Math.floor(p.x+HALF-EPSILON);x++)if(world.get(x,y,z)!==0)return true;
  return false;
}
export function safePlayer(world:World,player:Player):Player {
  const p=player.position;
  if(![p.x,p.y,p.z,player.yaw,player.pitch].every(Number.isFinite)||p.y<1||p.y>world.dimensions.y-BODY_HEIGHT||collision(world,p))return freshPlayer(world);
  return {...player,position:{...p},velocity:{x:0,y:0,z:0},pitch:Math.max(-1.48,Math.min(1.48,player.pitch)),grounded:false};
}
function advanceAxis(world:World,player:Player,axis:'x'|'y'|'z',distance:number):void {
  if(distance===0)return;
  const p=player.position,from=p[axis],to=from+distance;
  p[axis]=to;
  if(!collision(world,p))return;
  // Each fixed substep moves <0.1 voxel; binary contact resolution preserves wall sliding.
  let safe=from,blocked=to;
  for(let i=0;i<18;i++){
    const mid=(safe+blocked)/2;p[axis]=mid;
    if(collision(world,p))blocked=mid;else safe=mid;
  }
  p[axis]=safe;player.velocity[axis]=0;
  if(axis==='y'&&distance<0)player.grounded=true;
}
export function stepPlayer(world:World,player:Player,input:{forward:number;right:number;jump:boolean},dt:number):void {
  const total=Math.min(.1,Math.max(0,dt)),steps=Math.max(1,Math.ceil(total/(1/120))),step=total/steps;
  const length=Math.max(1,Math.hypot(input.forward,input.right));
  const forward=input.forward/length,right=input.right/length;
  const sin=Math.sin(player.yaw),cos=Math.cos(player.yaw);
  player.velocity.x=(-sin*forward+cos*right)*4;
  player.velocity.z=(-cos*forward-sin*right)*4;
  if(input.jump&&player.grounded){player.velocity.y=6.6;player.grounded=false;}
  for(let i=0;i<steps;i++) {
    player.velocity.y=Math.max(-22,player.velocity.y-16*step);player.grounded=false;
    advanceAxis(world,player,'x',player.velocity.x*step);
    advanceAxis(world,player,'z',player.velocity.z*step);
    advanceAxis(world,player,'y',player.velocity.y*step);
  }
}
