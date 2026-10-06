/** Original intentional Canvas illustration: no generated/imported character art. */
export interface TrayCup { remaining: number; liquidAngle: number; surfaceTilt: number; spilling: boolean; spillRate: number }
export interface TrayView { bodyLean: number; time: number; distance: number; cups: TrayCup[]; hazard?: { type: string; side: number; approach: number } | null }
const INK = '#393a32';
function shape(ctx: CanvasRenderingContext2D, d: string, fill: string | CanvasGradient, stroke = INK, width = 2.5): void {
  const p = new Path2D(d); ctx.fillStyle = fill; ctx.fill(p); if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(p); }
}
function ellipse(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, fill: string, stroke = '', width = 2): void {
  ctx.beginPath(); ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2); ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}
}
function hand(ctx: CanvasRenderingContext2D, side: -1 | 1, front: boolean): void {
  ctx.save(); ctx.translate(300,0);ctx.scale(side,1);
  if (!front) {
    const sleeve=ctx.createLinearGradient(120,370,230,460);sleeve.addColorStop(0,'#456b67');sleeve.addColorStop(1,'#284d4d');
    shape(ctx,'M154 371 Q183 361 205 379 L246 450 L132 450 L132 408 Z',sleeve);
    shape(ctx,'M147 373 Q172 359 193 372 L207 393 Q180 409 145 402 Z','#eee5d0');
    shape(ctx,'M148 384 L141 367 Q113 362 101 344 Q89 325 102 311 Q107 307 112 315 L123 330 Q136 332 151 333 L156 310 Q159 300 167 304 Q175 307 173 321 L170 344 Q188 348 187 369 L191 383 Q176 395 148 384 Z','#dfae83');
    shape(ctx,'M159 365 Q173 361 183 369 L191 383 Q176 395 148 384 L146 374 Q153 378 162 378 Z','#d29a72','',0);
    ctx.strokeStyle='#70918a';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(187,415);ctx.lineTo(212,449);ctx.stroke();
  } else {
    // The palm crosses the lower rim into the cuff, and every finger attaches to it.
    shape(ctx,'M143 397 L140 381 Q124 381 118 371 Q115 364 121 360 Q128 357 134 369 L143 372 L146 351 Q148 341 155 344 Q163 346 160 360 L160 372 Q174 371 182 385 L188 397 Q170 409 143 397 Z','#e5b88f');
    for(let i=0;i<3;i++) {const x=123+i*12,y=383+i*2;shape(ctx,`M${x} ${y} q-5 -15 2 -19 q7 -4 11 5 l2 16 q-7 9 -15 -2 Z`,'#eac098');ellipse(ctx,x+7,y-14,3,4,'#f7d8ba');ctx.strokeStyle='#bd8965';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(x+1,y-2);ctx.lineTo(x+10,y);ctx.stroke();}
    shape(ctx,'M149 366 Q145 345 155 342 Q165 344 163 357 L161 375 Q151 380 149 366 Z','#ecc29a');ellipse(ctx,156,350,4,5,'#f8dbc0');

  }
  ctx.restore();
}
function cup(ctx: CanvasRenderingContext2D, c: TrayCup, x: number, count: number, lean: number, time: number): void {
  ctx.save();ctx.translate(x,291);ctx.scale(count===1?1.15:.94,count===1?1.15:.94);
  ellipse(ctx,4,55,75,15,'#42362130');
  const handle=ctx.createLinearGradient(60,0,112,0);handle.addColorStop(0,'#d5ddd5');handle.addColorStop(.5,'#fffdf2');handle.addColorStop(1,'#d3d8ce');
  // A loop, attached twice to the cup; the hole exposes the tray behind it.
  const hp=new Path2D('M58 -38 C122 -55 119 45 57 47 L57 26 C90 34 98 -13 60 -17 Z');ctx.fillStyle=handle;ctx.fill(hp);ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.stroke(hp);
  const body=ctx.createLinearGradient(-68,0,68,0);body.addColorStop(0,'#d8ddd1');body.addColorStop(.3,'#fffdf2');body.addColorStop(.7,'#f5f2e4');body.addColorStop(1,'#b7c8bc');
  shape(ctx,'M-70 -43 C-67 -12 -65 28 -54 47 Q0 73 54 47 C65 28 67 -12 70 -43 Z',body);
  ctx.strokeStyle='#fffdf4';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-48,-23);ctx.quadraticCurveTo(-51,22,-39,39);ctx.stroke();
  ellipse(ctx,0,-43,70,30,'#fffdf4',INK,3);
  ellipse(ctx,0,-43,60,23,'#b8bbad','#899286',1.5);
  ctx.save();ctx.beginPath();ctx.ellipse(0,-43,59,22,0,0,Math.PI*2);ctx.clip();
  // Local surface slope cancels vessel rotation under gravity; liquid oscillator remains independent.
  const slope=Math.tan(Math.max(-.9,Math.min(.9,c.liquidAngle-lean)));
  const level=-62+(100-c.remaining)*.4;
  const coffee=ctx.createLinearGradient(0,-65,0,-20);coffee.addColorStop(0,'#583221');coffee.addColorStop(1,'#291b17');ctx.fillStyle=coffee;
  ctx.beginPath();ctx.moveTo(-90,level-slope*70);ctx.lineTo(90,level+slope*70);ctx.lineTo(90,5);ctx.lineTo(-90,5);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#b87945';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-90,level-slope*70+2);ctx.lineTo(90,level+slope*70+2);ctx.stroke();
  ctx.globalAlpha=.5;ellipse(ctx,-21,-34,16,3,'#d5aa74');ctx.globalAlpha=1;ctx.restore();
  ctx.strokeStyle='#fffdf2';ctx.lineWidth=6;ctx.beginPath();ctx.ellipse(0,-43,65,26,0,0,Math.PI*2);ctx.stroke();
  ctx.strokeStyle='#899487';ctx.lineWidth=1.3;ctx.beginPath();ctx.ellipse(0,-43,69,29,0,0,Math.PI*2);ctx.stroke();
  shape(ctx,'M-20 11 Q0 0 20 11 L16 31 Q0 40 -16 31 Z','#5a8073','',0);
  ctx.strokeStyle='#e8edde';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-10,17);ctx.lineTo(9,17);ctx.moveTo(-5,23);ctx.lineTo(5,23);ctx.stroke();
  if(c.spilling){const side=c.surfaceTilt>=0?-1:1;ctx.strokeStyle='#422618';ctx.lineWidth=6;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(side*62,-45);ctx.quadraticCurveTo(side*83,-23,side*82,3);ctx.stroke();for(let i=0;i<4;i++){const a=(time*.9+i*.23)%1;ellipse(ctx,side*(80+a*25),-12+a*93,3,5,'#4c2b1b');}}
  ctx.restore();
}
export function paintTray(ctx: CanvasRenderingContext2D, s: TrayView): void {
  ctx.clearRect(0,0,600,450);
  const wall=ctx.createLinearGradient(0,0,0,250);wall.addColorStop(0,'#e5dec8');wall.addColorStop(1,'#f3ecd8');ctx.fillStyle=wall;ctx.fillRect(0,0,600,450);
  shape(ctx,'M0 0 L221 82 L221 225 L0 450 Z','#d1c5ad','',0);shape(ctx,'M600 0 L379 82 L379 225 L600 450 Z','#c5d1c0','',0);
  shape(ctx,'M221 225 L379 225 L600 450 L0 450 Z','#bba584','',0);
  ctx.fillStyle='#4e7569';ctx.fillRect(246,102,108,123);ctx.fillStyle='#b9d2bb';ctx.fillRect(257,114,39,49);ctx.fillRect(304,114,39,49);ctx.fillStyle='#d8c494';ctx.fillRect(258,190,84,5);
  ctx.strokeStyle='#728475';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(0,199);ctx.lineTo(221,181);ctx.moveTo(600,199);ctx.lineTo(379,181);ctx.stroke();
  for(const side of [-1,1]){ctx.save();ctx.translate(300,0);ctx.scale(side,1);shape(ctx,'M119 35 L221 0 L222 192 L119 181 Z','#e8e8d7','#87958b',2);shape(ctx,'M134 55 L199 32 L199 126 L134 129 Z','#afc2af','',0);ctx.strokeStyle='#faf4df';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(139,62);ctx.lineTo(193,42);ctx.stroke();ctx.restore();}
  for(let i=0;i<5;i++){const p=(s.distance/16+i/5)%1,y=225+p*p*230;ctx.strokeStyle='#8f806740';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(220-220*p,y);ctx.lineTo(380+220*p,y);ctx.stroke();}
  if(s.hazard){const a=s.hazard.approach,y=206+a*80;ctx.strokeStyle='#ad7050';ctx.lineWidth=5;
    if(s.hazard.type==='corner'){ctx.beginPath();ctx.moveTo(265,y-33);ctx.lineTo(265+s.hazard.side*55,y-33);ctx.lineTo(265+s.hazard.side*55,y);ctx.stroke();ctx.beginPath();ctx.moveTo(254+s.hazard.side*55,y-11);ctx.lineTo(265+s.hazard.side*55,y);ctx.lineTo(276+s.hazard.side*55,y-11);ctx.stroke();}
    else if(s.hazard.type==='step'){const l=170-a*90,r=430+a*90;shape(ctx,`M${l} ${y} L${r} ${y} L${r+7} ${y+10} L${l-7} ${y+10} Z`,'#8b7254','#665942',2);ctx.strokeStyle='#f0d49f';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(l,y);ctx.lineTo(r,y);ctx.stroke();}
    else{ctx.strokeStyle='#806e54';ctx.lineWidth=3;ctx.setLineDash([8,5]);ctx.beginPath();ctx.moveTo(170-a*90,y);ctx.lineTo(430+a*90,y);ctx.stroke();ctx.setLineDash([]);}
  }
  ctx.save();ctx.translate(300,328);ctx.rotate(s.bodyLean);ctx.translate(-300,-328);
  hand(ctx,-1,false);hand(ctx,1,false);
  shape(ctx,'M94 292 Q80 293 78 310 L72 366 Q74 395 112 403 L488 403 Q525 395 528 366 L522 310 Q520 293 506 292 Z','#886045');
  const tray=ctx.createLinearGradient(0,281,0,395);tray.addColorStop(0,'#d8b77e');tray.addColorStop(1,'#b98b56');
  shape(ctx,'M97 274 Q82 274 80 294 L70 359 Q72 383 109 387 L491 387 Q528 383 530 359 L520 294 Q518 274 503 274 Z',tray);
  shape(ctx,'M104 286 L496 286 Q506 287 508 303 L516 356 Q515 370 491 374 L109 374 Q86 370 84 356 L92 303 Q94 286 104 286 Z','#c39d68','#9e784e',2);
  ctx.strokeStyle='#dfc391';ctx.lineWidth=2;for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(108,305+i*16);ctx.bezierCurveTo(210,298+i*16,383,314+i*16,493,305+i*16);ctx.stroke();}
  s.cups.forEach((c,i)=>cup(ctx,c,s.cups.length===1?290:203+i*188,s.cups.length,s.bodyLean,s.time));
  hand(ctx,-1,true);hand(ctx,1,true);ctx.restore();
}
