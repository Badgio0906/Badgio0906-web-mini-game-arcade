import { CHUNK, type ChunkDiff, type Dimensions, type Vec3 } from './Types';
export interface Cave { kind:'small'|'medium'|'large'; center:Vec3; radius:number }
/** Integer-only coordinate hashing makes terrain independent of traversal/chunk order. */
export function coordinateHash(seed:number,x:number,y:number,z:number):number {
  let n=(seed^Math.imul(x,374761393)^Math.imul(y,668265263)^Math.imul(z,2147483647))>>>0;
  n=Math.imul(n^(n>>>13),1274126177)>>>0;
  return (n^(n>>>16))>>>0;
}
export const referenceHeightFor=(d:Dimensions):number=>d.y===64?48:Math.max(3,Math.floor(d.y*.60));
export const spawnFor=(_seed:number,d:Dimensions):Vec3=>({x:Math.floor(d.x/2)+.5,y:referenceHeightFor(d)+1,z:Math.min(d.z-3,Math.floor(d.z/2)+4)+.5});
export function protectedAt(seed:number,d:Dimensions,x:number,y:number,z:number):boolean {
  const spawn=spawnFor(seed,d),height=referenceHeightFor(d);
  return Math.abs(x-Math.floor(spawn.x))<=1&&Math.abs(z-Math.floor(spawn.z))<=1&&y>=height&&y<=height+3;
}
export class World {
  readonly dimensions:Dimensions; readonly worldId:string; readonly seed:number;
  readonly spawn:Vec3; readonly referenceHeight:number; readonly caves:Cave[];
  revision=0; readonly chunkRevisions=new Map<string,number>(); readonly dirty=new Set<string>();
  private readonly base:Uint8Array; private readonly cells:Uint8Array;
  private readonly diffs=new Map<number,number>();
  constructor(seed:number,dimensions:Dimensions,worldId?:string) {
    if(![dimensions.x,dimensions.y,dimensions.z].every(n=>Number.isInteger(n)&&n>=8&&n<=128)||dimensions.y>64) throw new Error('invalid_world_dimensions');
    this.dimensions={...dimensions};this.seed=seed>>>0;this.worldId=worldId??`local-${Date.now()}-${this.seed}`;
    const {x:dx,y:dy,z:dz}=dimensions;
    this.referenceHeight=referenceHeightFor(dimensions);
    this.spawn=spawnFor(this.seed,dimensions);
    const radius=Math.min(dx,dz,dy)/8;
    this.caves=[
      {kind:'large',center:{x:Math.floor(dx*.31),y:Math.max(3,this.referenceHeight*.40),z:Math.floor(dz*.34)},radius:Math.max(1.35,radius)},
      {kind:'medium',center:{x:Math.floor(dx*.70),y:Math.max(3,this.referenceHeight*.62),z:Math.floor(dz*.67)},radius:Math.max(1.2,radius*.60)},
      {kind:'small',center:{x:Math.floor(dx*.57),y:Math.max(2,this.referenceHeight*.35),z:Math.floor(dz*.75)},radius:Math.max(.95,radius*.30)},
      {kind:'medium',center:{x:Math.floor(dx/2),y:this.referenceHeight-3,z:Math.max(3,Math.floor(dz/2)-4)},radius:Math.max(1.4,Math.min(4,radius*.65))},
    ];
    this.base=new Uint8Array(dx*dy*dz);
    const sx=Math.floor(this.spawn.x),sz=Math.floor(this.spawn.z);
    for(let y=0;y<dy;y++)for(let z=0;z<dz;z++)for(let x=0;x<dx;x++) {
      let block=0;
      const border=x===0||z===0||x===dx-1||z===dz-1||y===0;
      // The shallow ridge in front offers immediate digging without a quest or long walk.
      const ridge=Math.abs(x-sx)<=3&&z>=sz-5&&z<=sz-3&&dy>=16?2:0;
      const surface=this.referenceHeight+ridge;
      if(border) block=9;
      else if(y<=surface) {
        block=y===surface?1:y>=surface-3?2:y>=Math.floor(this.referenceHeight*.66)?3:y>=Math.floor(this.referenceHeight*.47)?4:5;
        if(y<surface-4) {
          const h=coordinateHash(this.seed,x,y,z)%997;
          if(h<4) block=y<this.referenceHeight*.38?8:y<this.referenceHeight*.67?7:6;
          if(this.caves.some(c=>((x-c.center.x)**2+(y-c.center.y)**2+(z-c.center.z)**2)<c.radius*c.radius)) block=0;
        }
        // A low, open passage beneath the ridge reveals a cave near the start.
        if(dy>=16&&Math.abs(x-sx)<=1&&z>=Math.floor(dz/2)-4&&z<=sz-3&&y>=this.referenceHeight-2&&y<=this.referenceHeight-1) block=0;
        // Natural blue crystals at the entrance are part of the deterministic base.
        if(dy>=16&&x===sx+2&&z===sz-5&&y===this.referenceHeight-1) block=6;
      }
      if(this.protected(x,y,z)) block=y===this.referenceHeight?9:0;
      this.base[this.index(x,y,z)]=block;
    }
    this.cells=this.base.slice();
    for(let cy=0;cy<Math.ceil(dy/CHUNK);cy++)for(let cz=0;cz<Math.ceil(dz/CHUNK);cz++)for(let cx=0;cx<Math.ceil(dx/CHUNK);cx++) {
      const key=`${cx},${cy},${cz}`;this.chunkRevisions.set(key,0);this.dirty.add(key);
    }
  }
  private inside(x:number,y:number,z:number):boolean {
    return Number.isInteger(x)&&Number.isInteger(y)&&Number.isInteger(z)&&x>=0&&y>=0&&z>=0&&x<this.dimensions.x&&y<this.dimensions.y&&z<this.dimensions.z;
  }
  private index(x:number,y:number,z:number):number {return x+this.dimensions.x*(z+this.dimensions.z*y);}
  get(x:number,y:number,z:number):number {return this.inside(x,y,z)?this.cells[this.index(x,y,z)]!:9;}
  baseAt(x:number,y:number,z:number):number {return this.inside(x,y,z)?this.base[this.index(x,y,z)]!:9;}
  protected(x:number,y:number,z:number):boolean {
    return protectedAt(this.seed,this.dimensions,x,y,z);
  }
  chunkKey(x:number,y:number,z:number):string {return `${Math.floor(x/CHUNK)},${Math.floor(y/CHUNK)},${Math.floor(z/CHUNK)}`;}
  set(x:number,y:number,z:number,id:number):boolean {
    if(!this.inside(x,y,z)||this.protected(x,y,z)||!Number.isInteger(id)||id<0||id>8||this.get(x,y,z)===9||this.get(x,y,z)===id)return false;
    const index=this.index(x,y,z);this.cells[index]=id;
    if(id===this.base[index])this.diffs.delete(index);else this.diffs.set(index,id);
    this.revision++;
    const affected=new Set([this.chunkKey(x,y,z)]);
    for(const [ax,ay,az] of [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]]) {
      const nx=x+ax!,ny=y+ay!,nz=z+az!;
      if(this.inside(nx,ny,nz))affected.add(this.chunkKey(nx,ny,nz));
    }
    for(const key of affected){this.chunkRevisions.set(key,(this.chunkRevisions.get(key)??0)+1);this.dirty.add(key);}
    return true;
  }
  clearDirty(key:string,revision:number):boolean {
    if(this.chunkRevisions.get(key)!==revision)return false;
    return this.dirty.delete(key);
  }
  exportDiffs():ChunkDiff[] {
    const chunks=new Map<string,number[]>();
    for(const [index,id] of this.diffs) {
      const x=index%this.dimensions.x;
      const z=Math.floor(index/this.dimensions.x)%this.dimensions.z;
      const y=Math.floor(index/(this.dimensions.x*this.dimensions.z));
      const key=this.chunkKey(x,y,z),cells=chunks.get(key)??[];
      cells.push((x%CHUNK)+CHUNK*((z%CHUNK)+CHUNK*(y%CHUNK)),id);chunks.set(key,cells);
    }
    return [...chunks].sort(([a],[b])=>a.localeCompare(b)).map(([key,cells])=>{
      const pairs:Array<[number,number]>=[];for(let i=0;i<cells.length;i+=2)pairs.push([cells[i]!,cells[i+1]!]);
      pairs.sort((a,b)=>a[0]-b[0]);return {key,cells:pairs.flat()};
    });
  }
  applyDiffs(chunks:ChunkDiff[]):void {
    // Validation is complete before any data is changed; the storage reader also validates metadata.
    const edits:Array<[number,number,number,number]>=[];const seen=new Set<number>();
    for(const chunk of chunks) {
      if(!/^\d+,\d+,\d+$/.test(chunk.key)||chunk.cells.length%2)throw new Error('invalid_chunk_diff');
      const [cx,cy,cz]=chunk.key.split(',').map(Number);
      for(let i=0;i<chunk.cells.length;i+=2){const local=chunk.cells[i]!,id=chunk.cells[i+1]!;
        const x=cx!*16+local%16,z=cz!*16+Math.floor(local/16)%16,y=cy!*16+Math.floor(local/256);
        if(!Number.isInteger(local)||local<0||local>=4096||!this.inside(x,y,z)||!Number.isInteger(id)||id<0||id>8||this.protected(x,y,z)||this.baseAt(x,y,z)===9||seen.has(this.index(x,y,z)))throw new Error('invalid_chunk_cell');
        seen.add(this.index(x,y,z));edits.push([x,y,z,id]);
      }
    }
    for(const [x,y,z,id] of edits)this.set(x,y,z,id);
  }
}
