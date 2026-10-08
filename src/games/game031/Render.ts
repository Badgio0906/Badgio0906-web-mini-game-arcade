import * as T from 'three';
import { CHUNK, type Vec3 } from './Types';
import { World } from './World';
import { BLOCKS } from './Blocks';
import type { Engine } from './Engine';
import { SurfaceTextures, applySurfaceShader, type SurfaceState, type SurfaceTier } from './SurfaceTextures';
const faces=[{n:[1,0,0],v:[[1,0,1],[1,0,0],[1,1,0],[1,1,1]],shade:.8},{n:[-1,0,0],v:[[0,0,0],[0,0,1],[0,1,1],[0,1,0]],shade:.65},{n:[0,1,0],v:[[0,1,1],[1,1,1],[1,1,0],[0,1,0]],shade:1},{n:[0,-1,0],v:[[0,0,0],[1,0,0],[1,0,1],[0,0,1]],shade:.55},{n:[0,0,1],v:[[0,0,1],[1,0,1],[1,1,1],[0,1,1]],shade:.85},{n:[0,0,-1],v:[[1,0,0],[0,0,0],[0,1,0],[1,1,0]],shade:.72}];
export interface Metrics { frameMs:number; fps:number; calls:number; triangles:number; chunks:number; dirty:number; meshMs:number; editDelayMs:number; geometries:number; textures:number; surfaceState?:SurfaceState }
export class Render {
 readonly renderer:T.WebGLRenderer; readonly scene=new T.Scene(); readonly camera=new T.PerspectiveCamera(70,1,.05,72);
 private meshes=new Map<string,T.Mesh>(); readonly surfaces:SurfaceTextures;
 private basic:T.MeshBasicMaterial; private standard:T.MeshLambertMaterial; private material:T.MeshBasicMaterial|T.MeshLambertMaterial; private world:World|null=null;
 onSurfaceChange:(()=>void)|null=null;
 private outline=new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(1.006,1.006,1.006)),new T.LineBasicMaterial({color:0xffffff}));
 private cracks=new T.LineSegments(new T.BufferGeometry(),new T.LineBasicMaterial({color:0x16383c,transparent:true,opacity:.8}));
 private preview=new T.Mesh(new T.BoxGeometry(1.015,1.015,1.015),new T.MeshBasicMaterial({color:0x86e4cd,transparent:true,opacity:.3,depthWrite:false}));
 private particles=new T.Points(new T.BufferGeometry(),new T.PointsMaterial({color:0xd7ded3,size:.07})); private bursts:{p:Vec3;v:Vec3;life:number}[]=[];
 private last=0; private edited=new Map<string,number>(); private quality='auto'; private previousVisible='';
 metrics:Metrics={frameMs:0,fps:0,calls:0,triangles:0,chunks:0,dirty:0,meshMs:0,editDelayMs:0,geometries:0,textures:0};
 constructor(canvas:HTMLCanvasElement){
  this.renderer=new T.WebGLRenderer({canvas,antialias:false,powerPreference:'low-power'});this.renderer.outputColorSpace=T.SRGBColorSpace;
  this.surfaces=new SurfaceTextures(this.tier(),this.renderer.capabilities.getMaxAnisotropy());
  this.basic=new T.MeshBasicMaterial({color:0xffffff,vertexColors:true});
  this.standard=new T.MeshLambertMaterial({color:0xffffff,vertexColors:false});
  applySurfaceShader(this.basic,this.surfaces);applySurfaceShader(this.standard,this.surfaces);
  this.material=this.tier()==='light'?this.basic:this.standard;
  const sun=new T.DirectionalLight(0xffffff,1.4);sun.position.set(30,60,25);
  this.scene.add(new T.AmbientLight(0xffffff,1.5),sun);
  this.surfaces.onChange=()=>this.onSurfaceChange?.();void this.surfaces.load(this.tier());
  this.scene.background=new T.Color('#87bac3');this.scene.fog=new T.Fog('#87bac3',20,55);
  this.outline.visible=this.preview.visible=false;this.scene.add(this.outline,this.preview,this.particles,this.cracks);this.cracks.geometry.setAttribute('position',new T.BufferAttribute(new Float32Array(30),3));this.cracks.frustumCulled=false;this.particles.geometry.setAttribute('position',new T.BufferAttribute(new Float32Array(48*3),3));this.particles.geometry.setDrawRange(0,0);this.particles.frustumCulled=false;
 }
 setWorld(world:World):void{for(const mesh of this.meshes.values()){this.scene.remove(mesh);mesh.geometry.dispose();}this.meshes.clear();this.world=world;this.previousVisible='';this.edited.clear();for(let y=0;y<world.dimensions.y;y+=CHUNK)for(let z=0;z<world.dimensions.z;z+=CHUNK)for(let x=0;x<world.dimensions.x;x+=CHUNK)world.dirty.add(world.chunkKey(x,y,z));}
 private tier():SurfaceTier{return this.quality==='light'||this.quality==='auto'&&matchMedia('(pointer:coarse)').matches?'light':'standard';}
 setQuality(tier:string):void{this.quality=tier;this.previousVisible='';this.resize();}
 resize():void{const c=this.renderer.domElement,rect=c.getBoundingClientRect(),tier=this.tier();this.renderer.setPixelRatio(Math.min(devicePixelRatio,tier==='light'?1:1.5));this.renderer.setSize(rect.width,rect.height,false);this.camera.aspect=rect.width/Math.max(1,rect.height);this.camera.updateProjectionMatrix();const material=tier==='light'?this.basic:this.standard;if(this.material!==material){this.material=material;for(const mesh of this.meshes.values())mesh.material=material;}void this.surfaces.load(tier);}
 editedChunk(key:string):void{this.edited.set(key,performance.now());}
 burst(p:Vec3,block:number):void{(this.particles.material as T.PointsMaterial).color.set(BLOCKS[block].color);for(let i=0;i<6&&this.bursts.length<48;i++)this.bursts.push({p:{x:p.x+.5,y:p.y+.5,z:p.z+.5},v:{x:Math.cos(i*2.3)*1.2,y:.5+i*.1,z:Math.sin(i*2.3)*1.2},life:.4});}
 private geometry(key:string):T.BufferGeometry{
  const w=this.world!,[cx,cy,cz]=key.split(',').map(Number),positions:number[]=[],colors:number[]=[],uv:number[]=[],normals:number[]=[],layers:number[]=[],indices:number[]=[];
  for(let y=cy*16;y<Math.min((cy+1)*16,w.dimensions.y);y++)for(let z=cz*16;z<Math.min((cz+1)*16,w.dimensions.z);z++)for(let x=cx*16;x<Math.min((cx+1)*16,w.dimensions.x);x++){
   const id=w.get(x,y,z);if(!id)continue;
   for(const f of faces){const nx=x+f.n[0],ny=y+f.n[1],nz=z+f.n[2];if(ny>=w.dimensions.y||nx<0||nz<0||nx>=w.dimensions.x||nz>=w.dimensions.z||ny<0){if(ny<w.dimensions.y)continue;}else if(w.get(nx,ny,nz))continue;
    const base=positions.length/3;for(let i=0;i<4;i++){const v=f.v[i];positions.push(x+v[0],y+v[1],z+v[2]);colors.push(f.shade,f.shade,f.shade);normals.push(...f.n);layers.push(id);const u=i===1||i===2?1:0,vv=i>=2?1:0;uv.push(u,1-vv);}indices.push(base,base+1,base+2,base,base+2,base+3);
   }
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));g.setAttribute('surfaceUv',new T.Float32BufferAttribute(uv,2));g.setAttribute('surfaceLayer',new T.Float32BufferAttribute(layers,1));g.setIndex(indices);g.computeBoundingSphere();return g;
 }
 frame(engine:Engine,dt:number):void{
  if(!this.world)return;const now=performance.now(),p=engine.player.position;this.metrics.frameMs=this.last?now-this.last:0;this.last=now;this.metrics.fps=this.metrics.frameMs?1000/this.metrics.frameMs:0;
  const lightweight=this.quality==='light'||this.quality==='auto'&&matchMedia('(pointer:coarse)').matches,range=lightweight?27:43;
  this.camera.position.set(p.x,p.y+1.6,p.z);this.camera.rotation.order='YXZ';this.camera.rotation.set(engine.player.pitch,engine.player.yaw,0);
  const underground=p.y<this.world.referenceHeight-2,fog=underground?'#24434e':'#87bac3';this.scene.background=(this.scene.background as T.Color).set(fog);this.scene.fog=new T.Fog(fog,underground?12:range*.65,range+12);
  const near=(key:string)=>{const [x,y,z]=key.split(',').map(Number);return Math.hypot(x*16+8-p.x,y*16+8-p.y,z*16+8-p.z)<range+14;};
  const visible=`${Math.floor(p.x/8)},${Math.floor(p.y/8)},${Math.floor(p.z/8)},${range}`;
  if(visible!==this.previousVisible){for(const [key,m]of this.meshes)m.visible=near(key);this.previousVisible=visible;}
  const queue=[...this.world.dirty].filter(near).sort((a,b)=>{const dist=(key:string)=>{const c=key.split(',').map(Number);return (c[0]*16+8-p.x)**2+(c[1]*16+8-p.y)**2+(c[2]*16+8-p.z)**2;};return dist(a)-dist(b);});
  if(queue.length){const key=queue[0],world=this.world,worldId=world.worldId,revision=world.chunkRevisions.get(key)??0,start=performance.now(),g=this.geometry(key);this.metrics.meshMs=performance.now()-start;
   if(this.world===world&&this.world.worldId===worldId&&(world.chunkRevisions.get(key)??0)===revision){const old=this.meshes.get(key);if(old){this.scene.remove(old);old.geometry.dispose();}const mesh=new T.Mesh(g,this.material);this.meshes.set(key,mesh);this.scene.add(mesh);world.clearDirty(key,revision);const edit=this.edited.get(key);if(edit){this.metrics.editDelayMs=performance.now()-edit;this.edited.delete(key);}}
   else g.dispose();
  }
  const target=engine.target;this.outline.visible=!!target;this.preview.visible=false;this.cracks.visible=!!target&&engine.digProgress>0;
  if(target){const n=target.normal,u=n.x?{x:0,y:1,z:0}:{x:1,y:0,z:0},v=n.z?{x:0,y:1,z:0}:n.x?{x:0,y:0,z:1}:{x:0,y:0,z:1},origin={x:target.x+.5+n.x*.505,y:target.y+.5+n.y*.505,z:target.z+.5+n.z*.505},pattern=[[0,0,.15,.20],[.15,.20,.27,.09],[0,0,-.16,-.18],[-.16,-.18,-.26,-.14],[0,0,.18,-.24]],crackPositions=this.cracks.geometry.getAttribute('position') as T.BufferAttribute;pattern.forEach((line,i)=>{for(let k=0;k<2;k++){const a=line[k*2],b=line[k*2+1];crackPositions.setXYZ(i*2+k,origin.x+u.x*a+v.x*b,origin.y+u.y*a+v.y*b,origin.z+u.z*a+v.z*b);}});crackPositions.needsUpdate=true;this.cracks.geometry.setDrawRange(0,Math.ceil(engine.digProgress*5)*2);(this.cracks.material as T.LineBasicMaterial).color.set(target.block===5||target.block===8?'#ffe1a1':'#16383c');this.outline.position.set(target.x+.5,target.y+.5,target.z+.5);(this.outline.material as T.LineBasicMaterial).color.set(target.block===9?'#edc580':target.block===4?'#264852':'#ffffff');
   const candidate={x:target.x+target.normal.x,y:target.y+target.normal.y,z:target.z+target.normal.z};this.preview.position.set(candidate.x+.5,candidate.y+.5,candidate.z+.5);this.preview.visible=true;(this.preview.material as T.MeshBasicMaterial).color.set(engine.placement().ok?'#88dcca':'#daaf90');
  }
  const positions=this.particles.geometry.getAttribute('position') as T.BufferAttribute;this.bursts=this.bursts.filter(b=>b.life>0);this.bursts.forEach((b,i)=>{b.life-=dt;b.v.y-=dt*5;b.p.x+=b.v.x*dt;b.p.y+=b.v.y*dt;b.p.z+=b.v.z*dt;positions.setXYZ(i,b.p.x,b.p.y,b.p.z);});positions.needsUpdate=true;this.particles.geometry.setDrawRange(0,this.bursts.length);
  this.renderer.render(this.scene,this.camera);this.metrics.calls=this.renderer.info.render.calls;this.metrics.triangles=this.renderer.info.render.triangles;this.metrics.chunks=[...this.meshes.values()].filter(m=>m.visible).length;this.metrics.dirty=queue.length;this.metrics.geometries=this.renderer.info.memory.geometries;this.metrics.textures=this.renderer.info.memory.textures;this.metrics.surfaceState={...this.surfaces.state,errors:[...this.surfaces.state.errors]};
 }
 destroy():void{for(const m of this.meshes.values())m.geometry.dispose();this.basic.dispose();this.standard.dispose();this.surfaces.destroy();this.onSurfaceChange=null;this.outline.geometry.dispose();(this.outline.material as T.Material).dispose();this.preview.geometry.dispose();(this.preview.material as T.Material).dispose();this.particles.geometry.dispose();(this.particles.material as T.Material).dispose();this.cracks.geometry.dispose();(this.cracks.material as T.Material).dispose();this.renderer.dispose();}
}
