import type { FishCatch } from './FishingModel';
/** A bounded view of real catches, not a second fish inventory or an external event. */
export const AQUARIUM_LIMIT = 12;
export function displayedCatches(catches:readonly FishCatch[]):readonly FishCatch[]{return catches.slice(-AQUARIUM_LIMIT);}
export function aquariumPose(index:number,seconds:number){
 const t=Number.isFinite(seconds)?Math.max(0,seconds):0;
 const phase=t*(.17+(index%4)*.025)+index*2.399;
 return {x:.5+Math.sin(phase)*.31,y:.30+(index%4)*.13+Math.sin(t*.31+index)*.035,right:Math.cos(phase)>=0};
}
export function aquariumFishWidth(waterWidth:number,big:boolean){return Math.min(waterWidth*.44,Math.max(28,waterWidth*(big?.31:.24)));}
export function drawAquarium(canvas:HTMLCanvasElement,background:HTMLImageElement|undefined,images:Record<string,HTMLImageElement>,catches:readonly FishCatch[],seconds:number){
 const rect=canvas.getBoundingClientRect(),ctx=canvas.getContext('2d');if(!ctx||!background||!rect.width||!rect.height)return;
 const ratio=Math.min(devicePixelRatio||1,1.5),W=rect.width,H=rect.height;
 if(canvas.width!==Math.round(W*ratio)||canvas.height!==Math.round(H*ratio)){canvas.width=Math.round(W*ratio);canvas.height=Math.round(H*ratio);}
 ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,W,H);
 // The photographic frame is contained, preserving the glass and source aspect.
 const scale=Math.min(W/background.width,H/background.height),bw=background.width*scale,bh=background.height*scale,bx=(W-bw)/2,by=(H-bh)/2;
 ctx.drawImage(background,bx,by,bw,bh);
 const water={x:bx+bw*.08,y:by+bh*.21,w:bw*.84,h:bh*.52};
 ctx.save();ctx.beginPath();ctx.rect(water.x,water.y,water.w,water.h);ctx.clip();
 const visible=displayedCatches(catches);
 visible.forEach((c,i)=>{const image=images[c.fishId];if(!image)return;const pose=aquariumPose(i,seconds),fw=aquariumFishWidth(water.w,c.big||c.fishId==='lord'),fh=fw*image.height/image.width;
  const margin=fw/(2*water.w)+.025,swimX=margin+(1-2*margin)*(pose.x-.19)/.62;
  ctx.save();ctx.translate(water.x+swimX*water.w,water.y+pose.y*water.h);ctx.scale(pose.right?1:-1,1);ctx.globalAlpha=.95;ctx.drawImage(image,-fw/2,-fh/2,fw,fh);ctx.restore();
 });ctx.restore();canvas.dataset.fishCount=String(visible.length);canvas.dataset.totalCatch=String(catches.length);
 canvas.setAttribute('aria-label','釣った魚が泳ぐ水槽。釣果'+catches.length+'匹、表示'+visible.length+'匹。');
}
