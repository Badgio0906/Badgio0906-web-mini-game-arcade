import type { Target,Vec3 } from './Types';
import type { World } from './World';
export function lookDirection(yaw:number,pitch:number):Vec3 {
  const cp=Math.cos(pitch);return {x:-Math.sin(yaw)*cp,y:Math.sin(pitch),z:-Math.cos(yaw)*cp};
}
/** Amanatides-style voxel traversal; render meshes/particles never take part in selection. */
export function raycast(world:World,origin:Vec3,direction:Vec3,range=5):Target|null {
  const length=Math.hypot(direction.x,direction.y,direction.z);
  if(!Number.isFinite(length)||length===0||!Number.isFinite(range)||range<=0)return null;
  const d={x:direction.x/length,y:direction.y/length,z:direction.z/length};
  const cell={x:Math.floor(origin.x),y:Math.floor(origin.y),z:Math.floor(origin.z)};
  const axes=['x','y','z'] as const;
  const step={x:Math.sign(d.x),y:Math.sign(d.y),z:Math.sign(d.z)};
  const delta={x:Math.abs(1/d.x),y:Math.abs(1/d.y),z:Math.abs(1/d.z)};
  const next={x:Infinity,y:Infinity,z:Infinity};
  for(const axis of axes)if(d[axis]!==0)next[axis]=((step[axis]>0?cell[axis]+1:cell[axis])-origin[axis])/d[axis];
  let distance=0,normal:Vec3={x:0,y:0,z:0};
  for(let i=0;i<64&&distance<=range;i++) {
    if(cell.x<0||cell.y<0||cell.z<0||cell.x>=world.dimensions.x||cell.y>=world.dimensions.y||cell.z>=world.dimensions.z)return null;
    const block=world.get(cell.x,cell.y,cell.z);
    if(block!==0)return {...cell,block,normal:{...normal},distance};
    let axis:'x'|'y'|'z'='x';if(next.y<next.x)axis='y';if(next.z<next[axis])axis='z';
    distance=next[axis];cell[axis]+=step[axis];next[axis]+=delta[axis];normal={x:0,y:0,z:0};normal[axis]=-step[axis];
  }
  return null;
}
