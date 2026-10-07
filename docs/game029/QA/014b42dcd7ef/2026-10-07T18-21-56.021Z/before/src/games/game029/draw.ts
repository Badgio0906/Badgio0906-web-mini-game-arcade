import type { Fishing, Kind } from './Fishing';
/** Original code-authored office silhouettes; no reference-site asset or font pictogram. */
export function object(c:CanvasRenderingContext2D,kind:Kind,x:number,y:number,size=26):void {
  c.save();c.translate(x,y);c.scale(size/26,size/26);c.lineWidth=2;c.strokeStyle='#193f43';c.fillStyle='#f6edcf';c.lineCap='round';
  const rect=(x:number,y:number,w:number,h:number,fill:string)=>{c.fillStyle=fill;c.beginPath();c.roundRect(x,y,w,h,2);c.fill();c.stroke();};
  switch(kind){
    case 'clip': c.beginPath();c.moveTo(-3,12);c.lineTo(-3,-9);c.bezierCurveTo(-3,-17,8,-17,8,-8);c.lineTo(8,9);c.bezierCurveTo(8,17,-9,17,-9,8);c.lineTo(-9,-7);c.bezierCurveTo(-9,-12,2,-12,2,-7);c.lineTo(2,7);c.stroke();break;
    case 'eraser':rect(-12,-7,24,14,'#ede1ae');rect(-12,-7,9,14,'#e39980');break;
    case 'pen':case 'fountain':c.rotate(-.45);rect(-4,-15,8,24,kind==='pen'?'#e3b347':'#294e52');c.fillStyle='#f2e5b2';c.beginPath();c.moveTo(-4,9);c.lineTo(0,16);c.lineTo(4,9);c.closePath();c.fill();c.stroke();c.strokeStyle='#f7edd6';c.beginPath();c.moveTo(1,-12);c.lineTo(1,-3);c.stroke();break;
    case 'badge':rect(-10,-12,20,27,'#bce0cf');rect(-4,-17,8,5,'#e6d69c');c.fillStyle='#365d60';c.beginPath();c.arc(0,-4,3,0,Math.PI*2);c.fill();c.fillRect(-5,3,10,4);break;
    case 'key':case 'keys':case 'master':c.rotate(.6);c.strokeStyle=kind==='master'?'#714f20':'#193f43';c.fillStyle=kind==='master'?'#efc454':'#e5dcbb';c.beginPath();c.arc(0,-8,6,0,Math.PI*2);c.fill();c.stroke();c.beginPath();c.moveTo(0,-2);c.lineTo(0,15);c.lineTo(6,15);c.moveTo(0,9);c.lineTo(5,9);c.stroke();if(kind==='keys'){c.translate(7,0);c.rotate(-.6);c.beginPath();c.arc(0,-8,4,0,Math.PI*2);c.moveTo(0,-4);c.lineTo(0,12);c.lineTo(4,12);c.stroke();}break;
    case 'usb':case 'goldusb':rect(-7,-6,14,19,kind==='goldusb'?'#e8ba50':'#789891');rect(-5,-14,10,8,'#e9eee8');c.fillStyle='#38565a';c.fillRect(-3,-11,2,3);c.fillRect(1,-11,2,3);break;
    case 'calculator':rect(-11,-15,22,30,'#ebeee0');rect(-8,-11,16,6,'#93bfb2');c.fillStyle='#315456';for(let a=0;a<3;a++)for(let b=0;b<3;b++)c.fillRect(-7+a*5,-1+b*5,3,3);break;
    case 'phone':case 'oldphone':rect(-9,-16,18,32,'#294e52');rect(-6,-12,12,kind==='oldphone'?12:23,'#a9d5c9');c.fillStyle='#ede5b7';if(kind==='oldphone')for(let a=0;a<3;a++)for(let b=0;b<2;b++)c.fillRect(-5+a*4,4+b*4,2,2);else{c.beginPath();c.arc(0,13,1.5,0,Math.PI*2);c.fill();}break;
  }c.restore();
}
export function draw(c:CanvasRenderingContext2D,model:Fishing,practice=false):void{
  const s=model.state,w=360,h=450, camera=Math.max(0,Math.min(s.maxDepth-95,s.depth-55));
  const yy=(depth:number)=>38+(depth-camera)*4;
  c.clearRect(0,0,w,h);const bg=c.createLinearGradient(0,0,0,h);bg.addColorStop(0,camera>80?'#51868d':'#80b8b9');bg.addColorStop(1,'#174e5c');c.fillStyle=bg;c.fillRect(0,0,w,h);
  c.strokeStyle='#a4c8c2';c.fillStyle='#e1efdd';c.font='12px sans-serif';c.textAlign='left';
  for(let d=Math.ceil(camera/20)*20;d<camera+105;d+=20){const y=yy(d);c.globalAlpha=.6;c.beginPath();c.moveTo(8,y);c.lineTo(26,y);c.stroke();c.fillText(`${d}m`,9,y-5);}c.globalAlpha=1;
  // Entrance and the rope share exactly the hook's horizontal coordinate; deeper views continue the same rope through the top boundary.
  if(camera===0){c.fillStyle='#fcf7e8';c.fillRect(0,0,w,23);c.fillStyle='#143a41';c.beginPath();c.ellipse(180,24,58,13,0,0,Math.PI*2);c.fill();c.strokeStyle='#d5e7d6';c.stroke();}
  const hookY=yy(s.depth);c.strokeStyle='#f8e9b5';c.lineWidth=2;c.beginPath();c.moveTo(180,yy(0)-14);c.lineTo(s.x,hookY-11);c.stroke();
  for(const i of s.items)if(!i.caught&&yy(i.depth)>24&&yy(i.depth)<h+25)object(c,i.kind,i.x,yy(i.depth),28);
  // Unambiguous J hook, connected to rope, with a barb and width-size cue.
  c.strokeStyle='#f4c95a';c.lineWidth=5+s.width;c.lineCap='round';c.beginPath();c.moveTo(s.x,hookY-11);c.lineTo(s.x,hookY+6);c.bezierCurveTo(s.x,hookY+23,s.x+20,hookY+23,s.x+20,hookY+7);c.stroke();c.lineWidth=3;c.beginPath();c.moveTo(s.x+20,hookY+7);c.lineTo(s.x+14,hookY+12);c.stroke();
  s.bag.slice(0,8).forEach((id,j)=>{const item=s.items.find(i=>i.id===id);if(item)object(c,item.kind,s.x+(j%3-1)*21,hookY+38+Math.floor(j/3)*22,19);});
  if(['ready','returned','finished'].includes(s.phase)){c.fillStyle='#f8f2dd';c.font='bold 16px sans-serif';c.textAlign='center';c.fillText(practice?'短い糸で、ひとつ拾ってみよう':'水の底に、だれかの忘れもの。',180,414);}
}
