import { KINDS, RainJourney, type Pedestrian } from './model';
const images = new Map<string, HTMLImageElement>();
const names = ['player','elegant','tough','office-man','office-woman','student','elderly','family','rare','home','umbrella-teal','rain-icon'];
export async function loadArt(): Promise<void> {
  await Promise.all([...names.map(name => [name, `./assets/game038/${name}.webp`]), ['background','./assets/game017/reorganization/rain-city.webp']].map(([name,url]) => new Promise<void>((resolve,reject) => {
    const image = new Image(); image.onload = () => { images.set(name,image); resolve(); }; image.onerror = () => reject(Error(`素材を読み込めません: ${name}`)); image.src = url;
  })));
}
export function paint(canvas: HTMLCanvasElement, journey: RainJourney | null, time: number, laneVisual: number): void {
  const w = canvas.clientWidth, h = canvas.clientHeight, dpr = Math.min(2, devicePixelRatio || 1);
  if (canvas.width !== Math.round(w*dpr) || canvas.height !== Math.round(h*dpr)) { canvas.width=Math.round(w*dpr); canvas.height=Math.round(h*dpr); }
  const ctx=canvas.getContext('2d')!;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
  const bg=images.get('background');if(bg){const ratio=Math.max(w/bg.width,h/bg.height);const bw=bg.width*ratio;ctx.drawImage(bg,-(bw-w)*(.5+.15*Math.sin((journey?.elapsed??0)/55)),0,bw,bg.height*ratio);}
  const gradient=ctx.createLinearGradient(0,h*.54,0,h);gradient.addColorStop(0,'#142b4300');gradient.addColorStop(1,'#07162980');ctx.fillStyle=gradient;ctx.fillRect(0,0,w,h);
  const y=(lane:number)=>h*(.71+lane*.105), scale=(lane:number)=>.82+lane*.09;
  ctx.setLineDash([3,12]);ctx.lineWidth=1;for(let lane=0;lane<3;lane++){ctx.strokeStyle='#c9e6ed20';ctx.beginPath();ctx.moveTo(0,y(lane)+4);ctx.lineTo(w,y(lane)+4);ctx.stroke();}ctx.setLineDash([]);
  const distance=journey?.distance??0, people=journey?.people??[{id:'demo0',lane:0,x:4.4,kind:0,radius:.62,direction:1,guide:true},{id:'demo1',lane:2,x:8,kind:6,radius:.62,direction:-1,guide:false}] as Pedestrian[];
  const owner=journey?.shelter;const playerX=w*.30, units=w/13;
  function sprite(name:string,x:number,foot:number,height:number,flip=false,alpha=1){const im=images.get(name);if(!im)return;const width=im.width/im.height*height;ctx.save();ctx.translate(x,foot);if(flip)ctx.scale(-1,1);ctx.globalAlpha=alpha;ctx.drawImage(im,-width/2,-height,width,height);ctx.restore();}
  if(journey&&journey.remaining<15){const homeX=playerX+(journey.remaining+.5)*units; sprite('home',homeX,y(1),h*.37);}
  const drawPlayer=()=>{const sy=y(laneVisual),size=h*.235*scale(laneVisual),bob=Math.sin(time*9)*Math.min(1.8,h*.003);ctx.fillStyle='#080e1788';ctx.beginPath();ctx.ellipse(playerX,sy+1,Math.max(7,size*.17),3,0,0,Math.PI*2);ctx.fill();sprite('player',playerX,sy+bob,size);ctx.strokeStyle='#f4d29f';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(playerX,sy+4,Math.max(8,size*.15),4,0,0,Math.PI*2);ctx.stroke();};
  for(let lane=0;lane<3;lane++){
    const row=people.filter(p=>p.lane===lane).sort((a,b)=>b.x-a.x);
    for(const p of row){const x=playerX+(p.x-distance)*units;if(x< -100||x>w+100)continue;const kind=KINDS[p.kind],active=owner?.id===p.id;const size=h*.255*scale(lane),foot=y(lane),radius=p.radius*units;
      ctx.fillStyle=active?'#b8e7c34d':p.guide?'#c8e0dc20':'#a7bdcc14';ctx.strokeStyle=active?'#cfefc3':kind.points<0?'#f2a48780':'#c3dfdf66';ctx.lineWidth=active?2:1;ctx.beginPath();ctx.ellipse(x,foot,radius,Math.max(5,h*.012),0,0,Math.PI*2);ctx.fill();ctx.stroke();
      sprite(kind.sprite,x,foot+Math.sin(time*7+p.kind)*1.3,size,p.direction===-1);
      if(p.guide||active){ctx.font=`600 ${Math.max(10,Math.min(14,w*.017))}px sans-serif`;ctx.textAlign='center';const label=`${kind.points>0?'+':''}${kind.points}`;const tw=ctx.measureText(label).width;ctx.fillStyle='#091925db';ctx.fillRect(x-tw/2-6,foot-size-19,tw+12,18);ctx.fillStyle=kind.points<0?'#ffba9b':'#e5e7b7';ctx.fillText(label,x,foot-size-6);}
    }
    if(Math.round(laneVisual)===lane)drawPlayer();
  }
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches){ctx.strokeStyle='#cfe7f033';ctx.lineWidth=.8;for(let i=0;i<60;i++){const x=((i*83+time*40)% (w+40))-20,ry=(i*137+time*180)%(h+30)-15;ctx.beginPath();ctx.moveTo(x,ry);ctx.lineTo(x-3,ry+12);ctx.stroke();}}
}
