import { TowerRun } from './TowerRun';
import { BUILDINGS, buildingById, shapeMetrics } from './buildings';
import type { CargoPose, TowerController, TowerHooks } from './contracts';
/** Draw the same union of rectangles used by the compound body. No bounding-box sprite. */
export function drawBuilding(c:CanvasRenderingContext2D, cargo:CargoPose, atlas?:HTMLImageElement){
 const shape=buildingById(cargo.shapeId),m=shapeMetrics(shape),index=BUILDINGS.indexOf(shape);
 c.save();c.translate(cargo.x,cargo.y);c.rotate(cargo.rotation);c.translate(-m.cx,-m.cy);
 c.beginPath();for(const p of shape.parts)c.rect(p.x,p.y,p.w,p.h);c.save();c.clip();
 if(atlas?.complete&&atlas.naturalWidth){const tw=atlas.naturalWidth/5,th=atlas.naturalHeight/2;c.drawImage(atlas,index%5*tw,Math.floor(index/5)*th,tw,th,0,0,m.width,m.height);}
 else {c.fillStyle=shape.color;c.fillRect(0,0,m.width,m.height);c.fillStyle='#f5e8b5';for(let y=10;y<m.height;y+=19)for(let x=9;x<m.width;x+=20)c.fillRect(x,y,8,10);c.fillStyle='#334c5a44';for(let y=27;y<m.height;y+=19)c.fillRect(0,y,m.width,2);}
 for(const p of shape.parts)if(p.density){c.fillStyle='#40525b99';c.fillRect(p.x,p.y,p.w,p.h);c.strokeStyle='#e5d4a4';c.lineWidth=2;for(let y=p.y+6;y<p.y+p.h;y+=8){c.beginPath();c.moveTo(p.x+4,y);c.lineTo(p.x+p.w-4,y);c.stroke();}}
 c.restore();c.strokeStyle='#344b60';c.lineWidth=2;for(const p of shape.parts)c.strokeRect(p.x,p.y,p.w,p.h);
 c.restore();c.fillStyle='#344b60';c.beginPath();c.arc(cargo.x,cargo.y,3,0,Math.PI*2);c.fill();
}
export function createTowerGame(parent:HTMLElement,hooks:TowerHooks):TowerController {
 const canvas=document.createElement('canvas');canvas.width=600;canvas.height=720;canvas.setAttribute('aria-label','不規則なビルを積む工事現場');canvas.style.cssText='display:block;width:100%;height:100%;object-fit:contain';parent.append(canvas);
 const c=canvas.getContext('2d')!,atlas=new Image(),city=new Image();atlas.src=`${import.meta.env.BASE_URL}assets/game003/buildings-atlas.webp`;city.src=`${import.meta.env.BASE_URL}assets/game003/physics-city.webp`;
 const run=new TowerRun(event=>{if(event.type==='art'){popup=`芸術建築 +${event.pair.points}`;popupAge=0;}if(event.type==='perfect'){popup=`PERFECT +${event.points}`;popupAge=0;}hooks.onEvent(event);});
 let titleMode=true,paused=false,destroyed=false,frame=0,last=performance.now(),cameraY=0,popup='',popupAge=10,reported=true;
 function draw(){const s=run.inspection();const target=run.alive?Math.min(0,run.topY-465):cameraY;cameraY+=(target-cameraY)*.08;
  const gradient=c.createLinearGradient(0,0,0,720);gradient.addColorStop(0,'#9dc7d4');gradient.addColorStop(1,'#e6e5cf');c.fillStyle=gradient;c.fillRect(0,0,600,720);
  if(city.complete&&city.naturalWidth){const cropWidth=city.naturalHeight*600/720;c.drawImage(city,(city.naturalWidth-cropWidth)/2,0,cropWidth,city.naturalHeight,0,0,600,720);}
  else {for(let i=0;i<12;i++){c.fillStyle=i%2?'#87a7ae55':'#9eb7b355';c.fillRect(i*57-24,565-(i%4)*24-cameraY*.15,45,120);}}
  c.save();c.translate(0,-cameraY);c.fillStyle='#e8dfca';c.fillRect(0,681,600,5000);c.fillStyle='#344b60';c.fillRect(185,639,230,42);c.fillStyle='#dcb451';for(let x=192;x<410;x+=25)c.fillRect(x,650,12,8);
  c.strokeStyle='#6a869455';c.lineWidth=1;for(let m=0;m<100;m++){const y=639-m*60;if(y-cameraY<0)break;c.beginPath();c.moveTo(63,y);c.lineTo(77,y);c.stroke();c.fillStyle='#537986';c.font='12px monospace';c.fillText(`${m} m`,20,y+4);}
  const demo:CargoPose[]=[{id:0,shapeId:'long',x:300,y:616,width:142,height:46,mass:78,rotation:0,vx:0,vy:0},{id:1,shapeId:'ell',x:300,y:560,width:126,height:90,mass:84,rotation:0,vx:0,vy:0}];
  for(const b of titleMode?demo:s.stack)drawBuilding(c,b,atlas);
  const cargo=s.cargo;if(cargo){if(run.phase==='hanging'){c.strokeStyle='#344b6033';c.setLineDash([6,9]);c.beginPath();c.moveTo(cargo.x,cargo.y);c.lineTo(cargo.x,run.topY);c.stroke();c.setLineDash([]);}drawBuilding(c,cargo,atlas);c.fillStyle='#344b60';c.font='bold 15px sans-serif';c.textAlign='center';c.fillText(`${buildingById(cargo.shapeId).name} · ${cargo.mass} kg`,cargo.x,cargo.y-85);c.textAlign='left';}
  c.restore();c.fillStyle='#344b60';c.fillRect(100,49,400,17);c.fillStyle='#dcb451';c.fillRect((cargo?.x??300)-18,66,36,18);
  if(cargo&&run.phase==='hanging'){c.strokeStyle='#657a80';c.lineWidth=2;c.beginPath();c.moveTo(cargo.x,84);c.lineTo(cargo.x,cargo.y-cameraY-60);c.stroke();}
  if(popupAge<1.3){c.fillStyle='#fff5dce8';c.fillRect(140,122,320,44);c.fillStyle='#344b60';c.font='bold 22px sans-serif';c.textAlign='center';c.fillText(popup,300,152);c.textAlign='left';}
 }
 function tick(now:number){if(destroyed)return;const dt=Math.min(.05,Math.max(0,(now-last)/1000));last=now;if(!paused){popupAge+=dt;if(run.alive){run.step(dt);hooks.onUpdate(run.snapshot());if(!run.alive&&!reported){reported=true;const result=run.result();if(result)hooks.onEnd(result);}}draw();}frame=requestAnimationFrame(tick);}
 frame=requestAnimationFrame(tick);
 return {start(){titleMode=false;paused=false;reported=false;cameraY=0;run.start();hooks.onUpdate(run.snapshot());},title(){titleMode=true;paused=false;reported=true;cameraY=0;run.reset();draw();},drop:()=>!paused&&run.drop(),move:x=>!paused&&run.move(x),rotate:()=>!paused&&run.rotate(),choose:choice=>!paused&&run.choose(choice),pause:value=>{paused=value;last=performance.now();},snapshot:()=>run.snapshot(),inspection:()=>run.inspection(),destroy(){destroyed=true;cancelAnimationFrame(frame);canvas.remove();}};
}
