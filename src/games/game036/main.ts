import './style.css';
import {StorageService} from '../../core/StorageService';
import {AudioService} from '../../core/AudioService';
import {TelemetryService} from '../../core/TelemetryService';
import {createGameRecordSession} from '../../records/RecordSharing';
import {createMochi,stepMochi,move,rotate,hardDrop,setSoft,predict,pieceCells,index,COLS,ROWS,STAR,STAR_NEED,POP_MS,SETTLE_BASE_MS,SETTLE_ROW_MS,SPAWN,EMPTY,type MochiEvent} from './model';
import {MochiStore} from './save';
const el=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
const canvas=el<HTMLCanvasElement>('board'),nextCanvas=el<HTMLCanvasElement>('next'),menu=el<HTMLDialogElement>('menu'),app=el('app');
const storage=new StorageService(undefined,'web-mini-arcade:v1:game036:'),audio=new AudioService(storage),store=new MochiStore();let saved=store.read();
let training=false,practiceRetry=false;
const telemetry=new TelemetryService(storage,'game036',undefined,{remoteCollectionEnabled:false,ignoreEvent:()=>training});
const records=createGameRecordSession('game036');
let game=saved.snapshot??createMochi(),phase:'title'|'play'|'paused'|'help'|'result'='title';
const CELL=48,TOP=24,W=COLS*CELL,H=TOP+(ROWS-1)*CELL;
const PALETTE=[{base:'#f6a5c0',dark:'#d26f8f',name:'さくら'},{base:'#a3d68c',dark:'#5f9d55',name:'まっちゃ'},{base:'#ffd76a',dark:'#d3a42b',name:'ゆず'},{base:'#8fcdf3',dark:'#4f95c6',name:'ソーダ'}];
let previous:number|null=null,clock=0,shake=0,flash=0,glow=0,chainPeak=0,banner:{text:string;life:number;size:number}|null=null;
const particles:{x:number;y:number;vx:number;vy:number;life:number;max:number;color:string;size:number;star:boolean}[]=[];
const floats:{text:string;x:number;y:number;life:number;size:number;color:string}[]=[];
let drag:{id:number;x:number;y:number;t:number;col:number;moved:boolean;soft:boolean}|null=null;
const reducedMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches??false;
const cx=(x:number)=>x*CELL+CELL/2,cy=(y:number)=>TOP+(y-1)*CELL+CELL/2;
function active():boolean{return phase==='play';}
function persist():void{if(training||!saved.snapshot)return;saved.snapshot=structuredClone(game);store.write(saved);}
function clearInput():void{if(drag&&canvas.hasPointerCapture(drag.id))canvas.releasePointerCapture(drag.id);drag=null;previous=null;setSoft(game,false);stopHold();}
function setPhase(next:typeof phase):void{clearInput();phase=next;app.dataset.state=next;if(active()){if(menu.open)menu.close();canvas.focus({preventScroll:true});}render();}
// A tap aimed at the pad as the stack tops out must not land on the dialog button drawn in its place.
let shownAt=0;const GUARD_MS=450;for(const type of ['click','pointerdown','keydown'])menu.addEventListener(type,e=>{if(performance.now()-shownAt<GUARD_MS){e.preventDefault();e.stopImmediatePropagation();}},true);
function show(title:string,body:string,buttons:string,next:typeof phase,focus?:string):void{setPhase(next);shownAt=performance.now();menu.innerHTML=`<p class="eyebrow">MOCHI DROP</p><h2 id="menu-title">${title}</h2>${body}<div class="menu-actions">${buttons}</div><p><a id="menu-portal" class="arcade-portal-return" href="./index.html">← ゲーム一覧へ</a></p>`;if(!menu.open)menu.show();menu.scrollTop=0;el('menu-title').tabIndex=-1;if(focus)el(focus).focus();else el('menu-title').focus({preventScroll:true});el('menu-portal').onclick=quit;}
const button=(id:string,text:string,primary=false)=>`<button id="${id}" type="button" class="${primary?'primary':''}">${text}</button>`;
function abandon():void{if(!training&&saved.snapshot&&!saved.reported){saved.reported=true;telemetry.trackEvent('quit',{source:phase,score:game.score,pieces:game.pieces});telemetry.trackEvent('run_end',{outcome:'quit',score:game.score,completed:false,max_chain:game.maxChain});}saved.snapshot=null;store.write(saved);}
function resetEffects():void{particles.length=0;floats.length=0;shake=0;flash=0;glow=0;chainPeak=0;banner=null;}
function title():void{abandon();training=false;game=createMochi();resetEffects();show('もちっと連鎖','<p>おもちを2つずつ落として、<br>同じ味を<strong>4つ</strong>つなげると、ぽん。</p><p>消えたあとに落ちたおもちが、またつながると<strong>連鎖</strong>。<br>落下地点の影に「◯連鎖」と出たら置きどきです。</p>'+(saved.best?`<p class="best-line">BEST ${saved.best.toLocaleString()}点 · 最大 ${saved.bestChain}連鎖</p>`:''),button('play','すぐ遊ぶ',true)+button('practice','練習する')+button('explain','説明を見る'),'title','play');el('play').onclick=()=>start(false);el('practice').onclick=()=>start(true);el('explain').onclick=()=>help(false);}
function start(practice:boolean):void{abandon();training=practice;practiceRetry=false;game=createMochi(practice);resetEffects();if(!training){telemetry.trackEvent('run_start',{mode:'endless'});saved.runId=telemetry.getActiveRunId();saved.reported=false;saved.snapshot=structuredClone(game);records.startRun(saved.runId??undefined);}setPhase('play');persist();void audio.unlock();}
function help(inRun:boolean):void{show('つなげて、ぽん。','<ol><li>上から2つ1組のおもちが落ちてきます。左右へ動かし、回して置きましょう。</li><li>同じ味が<strong>縦横に4つ以上</strong>つながると消えます。消えた上のおもちが落ちて、またつながれば<strong>連鎖</strong>。連鎖ほど点数が大きく増えます（2連鎖×3、3連鎖×6、4連鎖×10…）。</li><li>落下地点の影が光って「◯連鎖」と出たら、そこに置くとその連鎖が起きます。</li><li>おもちを32個消すと、次の組に<strong>こんぺいとう</strong>が入ります。着地したところの味を、盤面からまとめて消します。</li><li>盤面を全部消すと2000点。中央上の×がふさがると終了です。</li></ol><p>PC：← → 移動 / ↑・X 右回転 / Z 左回転 / ↓ ゆっくり / Space すとん / Esc 休憩<br>スマホ：盤面を左右にスライドで移動、タップで回転、下へはらうと すとん。下のボタンでも操作できます。</p>',button('continue',inRun?'再開する':'すぐ遊ぶ',true)+(inRun?'':button('practice','練習する')+button('title','タイトルへ')),'help','continue');el('continue').onclick=inRun?resume:()=>start(false);if(!inRun){el('practice').onclick=()=>start(true);el('title').onclick=title;}}
function pause():void{if(!active())return;if(!training)telemetry.trackEvent('pause');persist();show('おもち、ひと休み。','<p>落下も連鎖も止まっています。<br>この盤面から再開できます。</p>',button('resume','再開する',true)+button('retry','最初から')+button('rules','遊び方')+button('title','タイトルへ'),'paused','resume');el('resume').onclick=resume;el('retry').onclick=()=>{if(!training)telemetry.trackEvent('retry');start(training);};el('rules').onclick=()=>help(true);el('title').onclick=title;}
function resume():void{setPhase('play');if(!training)telemetry.trackEvent('resume');void audio.unlock();}
const TIPS=['影に「◯連鎖」と出た場所は、置くだけで連鎖します。','同じ味を3つ並べて、上に別の味を乗せておくと連鎖のタネになります。','こんぺいとうは、たくさんある味の上に落とすと気持ちいい。','端の列に同じ味を縦に積むと、連鎖の土台になりやすい。','中央上の×の列は、なるべく低く保ちましょう。'];
function over():void{
 if(training){game=createMochi(true);return;}
 const previousBest=saved.best,improved=game.score>previousBest,chainBest=game.maxChain>saved.bestChain;saved.runs++;saved.reported=true;saved.best=Math.max(saved.best,game.score);saved.bestChain=Math.max(saved.bestChain,game.maxChain);saved.snapshot=null;store.write(saved);
 telemetry.trackEvent('score',{score:game.score,max_chain:game.maxChain,pieces:game.pieces});telemetry.trackEvent('run_end',{outcome:'over',score:game.score,completed:true,max_chain:game.maxChain,pieces:game.pieces,stars:game.stars,all_clears:game.allClears});if(improved)telemetry.trackEvent('best_update',{score:game.score,best:saved.best});records.complete(game.score,{metadata:{duration_seconds:Math.round(game.seconds)}});
 audio.tone(392,196,.7,'triangle',0,.05);audio.tone(294,147,.8,'sine',.12,.04);
 const gap=previousBest-game.score,tip=TIPS[saved.runs%TIPS.length],line=improved?'自己ベストを塗りかえました。':gap===0&&previousBest>0?'BESTと同点！':previousBest===0?'同じ味を4つ、つなげてみましょう。':`BESTまで あと ${gap.toLocaleString()}点`;
 show(improved?'BEST更新！':'おもち、満員です。',`<p class="result-score">${game.score.toLocaleString()} <small>点</small></p><p class="best-line">${line}</p><p>最大 ${game.maxChain}連鎖${chainBest?'（自己最高！）':''} · ${game.pieces}組 · こんぺいとう ${game.stars}回${game.allClears?` · 全消し ${game.allClears}回`:''}<br>BEST ${saved.best.toLocaleString()}点 · 最大 ${saved.bestChain}連鎖</p><p class="tip">ヒント：${tip}</p>`,button('retry','もう1回',true)+button('title','タイトルへ'),'result','retry');records.mount(menu);el('retry').onclick=()=>{telemetry.trackEvent('retry');start(false);};el('title').onclick=title;
}
function practiceDone():void{show('2連鎖、できました！','<p>影の「連鎖」表示が、置きどきの合図です。<br>練習はBESTに入りません。</p>',button('play','本番を遊ぶ',true)+button('practice','もう一度練習')+button('title','タイトルへ'),'result','play');el('play').onclick=()=>start(false);el('practice').onclick=()=>start(true);el('title').onclick=title;}
const SCALE=[0,2,4,7,9,12,14,16,19,21,24,26];
function effects(events:MochiEvent[]):void{
 for(const e of events){
  if(e.type==='move')audio.tone(620,620,.025,'triangle',0,.012);
  else if(e.type==='rotate')audio.tone(780,980,.05,'triangle',0,.02);
  else if(e.type==='land'){audio.tone(e.hard?170:210,110,.1,'sine',0,.05);if(e.hard)shake=Math.max(shake,2.5);}
  else if(e.type==='pop'){
   const f=523.25*2**(SCALE[Math.min(e.chain-1,SCALE.length-1)]/12);audio.tone(f,f*1.01,.24,'triangle',0,.06);audio.tone(f*1.5,f*1.5,.2,'sine',.06,.035);audio.tone(1400,380,.09,'sine',0,.035);
   if(e.star){for(let i=0;i<5;i++)audio.tone(1047*2**(SCALE[i+2]/12),1047*2**(SCALE[i+2]/12),.16,'sine',i*.05,.03);}
   chainPeak=Math.max(chainPeak,e.chain);glow=Math.min(1,glow+.18+e.chain*.08);shake=Math.max(shake,Math.min(12,1.5+e.chain*1.6+(e.star?5:0)));if(e.chain>=3||e.star)flash=Math.min(.5,.12+e.chain*.05);
   let sx=0,sy=0;for(const c of e.cells){sx+=cx(c.x);sy+=cy(c.y);const color=c.color===STAR?'#ffffff':PALETTE[c.color].base;for(let i=0;i<7+Math.min(e.chain,6);i++){const a=Math.random()*Math.PI*2,v=60+Math.random()*(140+e.chain*30);particles.push({x:cx(c.x),y:cy(c.y),vx:Math.cos(a)*v,vy:Math.sin(a)*v-80,life:0,max:.55+Math.random()*.45,color,size:3+Math.random()*5,star:Math.random()<.25});}}
   const n=e.cells.length||1;floats.push({text:e.gain?`+${e.gain.toLocaleString()}`:'ぽん',x:sx/n,y:sy/n,life:0,size:18+Math.min(e.chain,8)*2,color:'#fff'});
   if(e.star)banner={text:'こんぺいとう！',life:0,size:34};else if(e.chain>=2)banner={text:`${e.chain}連鎖！`,life:0,size:Math.min(64,30+e.chain*5)};
   if(particles.length>900)particles.splice(0,particles.length-900);
  }
  else if(e.type==='allclear'){banner={text:'ぜんぶ消し！',life:0,size:44};flash=.6;for(let i=0;i<6;i++)audio.tone(523.25*2**(SCALE[i+3]/12),523.25*2**(SCALE[i+3]/12),.22,'triangle',i*.07,.04);if(e.gain)floats.push({text:`+${e.gain}`,x:W/2,y:H/2+40,life:0,size:26,color:'#fff6c9'});}
  else if(e.type==='star-ready'){audio.tone(1568,2093,.25,'sine',0,.035);floats.push({text:'こんぺいとう準備OK',x:W/2,y:TOP+30,life:0,size:16,color:'#fff6c9'});}
  else if(e.type==='spawn'){
   if(!training&&chainPeak>=4)telemetry.trackEvent('specific_game_events',{event:'big_chain',chain:chainPeak});chainPeak=0;
   if(training){if(game.maxChain>=2){practiceDone();return;}if(game.pieces>0){game=createMochi(true);practiceRetry=true;}}
   else persist();
  }
  else if(e.type==='over'){over();return;}
 }
}
function roundRect(c:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number):void{c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}
function star(c:CanvasRenderingContext2D,x:number,y:number,r:number,spin:number,alpha=1):void{c.save();c.globalAlpha*=alpha;c.translate(x,y);c.rotate(spin);const g=c.createRadialGradient(-r*.3,-r*.3,1,0,0,r*1.1);g.addColorStop(0,'#ffffff');g.addColorStop(.5,'#fff1a8');g.addColorStop(1,'#f7a8d8');c.fillStyle=g;c.beginPath();for(let i=0;i<16;i++){const a=i/16*Math.PI*2,rr=i%2?r*.68:r;c.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);}c.closePath();c.fill();c.strokeStyle='#e7a7c6';c.lineWidth=2;c.stroke();c.restore();}
function mochi(c:CanvasRenderingContext2D,x:number,y:number,color:number,o:{sx?:number;sy?:number;alpha?:number;happy?:boolean;ghost?:boolean;r?:number}={}):void{
 if(color===STAR){star(c,x,y,(o.r??CELL/2-4)*(o.sx??1),clock*2,o.alpha??1);return;}
 const p=PALETTE[color],r=o.r??CELL/2-3,w=r*2*(o.sx??1),h=r*2*(o.sy??1);c.save();c.globalAlpha*=o.alpha??1;const left=x-w/2,top=y+r-h;
 if(o.ghost){c.setLineDash([5,5]);c.lineWidth=3;c.strokeStyle=p.dark;roundRect(c,left+2,top+2,w-4,h-4,r*.8);c.stroke();c.restore();return;}
 const g=c.createLinearGradient(0,top,0,top+h);g.addColorStop(0,'#ffffff');g.addColorStop(.18,p.base);g.addColorStop(1,p.dark);c.fillStyle=g;roundRect(c,left,top,w,h,r*.82);c.fill();
 c.fillStyle='#ffffff99';c.beginPath();c.ellipse(x-w*.18,top+h*.24,w*.18,h*.09,-.4,0,Math.PI*2);c.fill();
 const ey=top+h*.52,ex=w*.17;c.strokeStyle=c.fillStyle='#4a3a3f';c.lineWidth=2.4;c.lineCap='round';
 if(o.happy){for(const s of [-1,1]){c.beginPath();c.arc(x+s*ex,ey+2,3.6,Math.PI*1.1,Math.PI*1.9);c.stroke();}}else for(const s of [-1,1]){c.beginPath();c.arc(x+s*ex,ey,2.6,0,Math.PI*2);c.fill();}
 c.beginPath();c.arc(x,ey+4,o.happy?4.5:3,.15*Math.PI,.85*Math.PI);c.stroke();c.fillStyle='#ff8fa866';for(const s of [-1,1]){c.beginPath();c.ellipse(x+s*w*.31,ey+5,4.5,2.6,0,0,Math.PI*2);c.fill();}c.restore();
}
let backdrop:HTMLCanvasElement|null=null;
function paintBackdrop():HTMLCanvasElement{const b=document.createElement('canvas');b.width=W;b.height=H;const c=b.getContext('2d')!;const g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,'#fff6ef');g.addColorStop(1,'#f3e4f1');c.fillStyle=g;c.fillRect(0,0,W,H);c.fillStyle='#e9cfe066';for(let y=0;y<H;y+=24)for(let x=(y/24)%2?12:0;x<W;x+=24){c.beginPath();c.arc(x,y,1.6,0,Math.PI*2);c.fill();}c.strokeStyle='#e7d3e3';c.lineWidth=1;for(let x=1;x<COLS;x++){c.beginPath();c.moveTo(x*CELL,0);c.lineTo(x*CELL,H);c.stroke();}return b;}
function draw():void{
 const context=canvas.getContext('2d');if(!context)return;const c:CanvasRenderingContext2D=context;backdrop??=paintBackdrop();c.save();c.clearRect(0,0,W,H);
 if(shake>.2&&!reducedMotion)c.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);c.drawImage(backdrop,0,0);
 if(glow>.01){const g=c.createRadialGradient(W/2,H*.62,20,W/2,H*.62,H*.8);g.addColorStop(0,`rgba(255,226,150,${glow*.45})`);g.addColorStop(1,'rgba(255,200,230,0)');c.fillStyle=g;c.fillRect(0,0,W,H);}
 const danger=game.board[index(SPAWN.x,SPAWN.y+2)]!==EMPTY;c.save();c.translate(cx(SPAWN.x),cy(SPAWN.y));c.strokeStyle=danger?`rgba(214,72,96,${.55+.35*Math.sin(clock*8)})`:'#d9b9cc';c.lineWidth=4;c.lineCap='round';c.beginPath();c.moveTo(-10,-10);c.lineTo(10,10);c.moveTo(10,-10);c.lineTo(-10,10);c.stroke();c.restore();
 const settling=game.phase==='settle',elapsed=settling?SETTLE_BASE_MS+Math.max(0,...game.drops)*SETTLE_ROW_MS-game.timer:1e9,popT=game.phase==='pop'?1-game.timer/POP_MS:0,popping=new Set(game.popping);
 const offset=(i:number)=>settling?Math.max(0,game.drops[i]-elapsed/SETTLE_ROW_MS):0;
 for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){const i=index(x,y),color=game.board[i];if(color<0||color===STAR||popping.has(i)||offset(i)>0)continue;for(const [nx,ny] of [[x+1,y],[x,y+1]]){if(nx>=COLS||ny>=ROWS)continue;const j=index(nx,ny);if(game.board[j]!==color||popping.has(j)||offset(j)>0||y<1)continue;c.fillStyle=PALETTE[color].base;if(nx>x)c.fillRect(cx(x),cy(y)-CELL*.26,CELL,CELL*.56);else c.fillRect(cx(x)-CELL*.3,cy(y),CELL*.6,CELL);}}
 for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){const i=index(x,y),color=game.board[i];if(color===EMPTY)continue;const off=offset(i);let sx=1,sy=1,alpha=1,happy=false;
  if(settling&&game.drops[i]){const since=elapsed-game.drops[i]*SETTLE_ROW_MS;if(since>=0&&since<SETTLE_BASE_MS){const k=Math.sin(since/SETTLE_BASE_MS*Math.PI);sx=1+.14*k;sy=1-.16*k;}}
  if(popping.has(i)){happy=true;const blink=popT<.55?(Math.sin(popT*40)>0?1:.65):1;const grow=popT<.55?1+popT*.25:Math.max(0,(1-popT)/.45)*1.14;sx=sy=grow;alpha=blink;}
  mochi(c,cx(x),cy(y-off),color,{sx,sy,alpha,happy});}
 if(game.phase==='drop'&&game.piece&&active()){const pre=predict(game);if(pre){const lit=pre.chain>0;for(const p of pre.cells){if(lit){c.save();c.globalAlpha=.32+.18*Math.sin(clock*7);mochi(c,cx(p.x),cy(p.y),p.color);c.restore();}else mochi(c,cx(p.x),cy(p.y),p.color,{ghost:true});}
   if(lit){const top=Math.min(...pre.cells.map(p=>p.y)),x=pre.cells.reduce((n,p)=>n+cx(p.x),0)/pre.cells.length;const label=pre.chain>=2?`${pre.chain}連鎖`:'ぽん';c.font=`800 ${pre.chain>=2?19:16}px system-ui,sans-serif`;c.textAlign='center';const tw=c.measureText(label).width+18,ly=cy(top)-CELL*.78;c.fillStyle=pre.chain>=2?'#d9577c':'#8a6b7a';roundRect(c,Math.min(W-tw-2,Math.max(2,x-tw/2)),ly-14,tw,26,13);c.fill();c.fillStyle='#fff';c.fillText(label,Math.min(W-tw/2-2,Math.max(tw/2+2,x)),ly+5);}}
  for(const p of pieceCells(game.piece))if(p.y>=0)mochi(c,cx(p.x),cy(p.y),p.color);}
 for(const p of particles){const k=1-p.life/p.max;c.globalAlpha=Math.max(0,k);if(p.star)star(c,p.x,p.y,p.size*.9,p.life*6);else{c.fillStyle=p.color;c.beginPath();c.arc(p.x,p.y,p.size*k+1,0,Math.PI*2);c.fill();}}c.globalAlpha=1;
 c.textAlign='center';for(const f of floats){const k=f.life/1.1;c.globalAlpha=Math.max(0,1-k*k);c.font=`800 ${f.size}px system-ui,sans-serif`;c.lineWidth=5;c.strokeStyle='#8b4a6b';c.strokeText(f.text,f.x,f.y-k*46);c.fillStyle=f.color;c.fillText(f.text,f.x,f.y-k*46);}c.globalAlpha=1;
 if(banner){const k=banner.life,scale=k<.18?.6+k/.18*.5:k<.3?1.1-(k-.18)/.12*.1:1;c.save();c.globalAlpha=k>1.1?Math.max(0,1-(k-1.1)/.4):1;c.translate(W/2,H*.36);c.scale(scale,scale);c.font=`900 ${banner.size}px system-ui,sans-serif`;c.lineWidth=9;c.strokeStyle='#b4466f';c.lineJoin='round';c.strokeText(banner.text,0,0);const g=c.createLinearGradient(0,-banner.size,0,10);g.addColorStop(0,'#fffbe0');g.addColorStop(1,'#ffc4dc');c.fillStyle=g;c.fillText(banner.text,0,0);c.restore();}
 if(flash>.01){c.fillStyle=`rgba(255,255,240,${flash})`;c.fillRect(0,0,W,H);}
 if(game.phase==='over'){c.fillStyle='#60445566';c.fillRect(0,0,W,H);}
 c.restore();drawNext();
}
function drawNext():void{const c=nextCanvas.getContext('2d');if(!c)return;c.clearRect(0,0,nextCanvas.width,nextCanvas.height);game.queue.forEach(([a,b],n)=>{const x=n?72:26,y=n?92:66,r=n?15:19;mochi(c,x,y,b,{r});mochi(c,x,y+r*2+2,a,{r});});}
function render():void{
 el('score').textContent=game.score.toLocaleString();el('best').textContent=training?'練習 · 記録なし':`BEST ${saved.best.toLocaleString()}`;el('stats').textContent=training?'PRACTICE':`LV ${game.level} · 最大 ${game.maxChain}連鎖`;
 el('gauge-fill').style.width=`${training?0:Math.round(game.gauge/STAR_NEED*100)}%`;el('gauge').setAttribute('aria-valuenow',String(game.gauge));
 const text=phase==='paused'?'一時停止中':phase!=='play'?'つなげて、ぽん。':training?(practiceRetry?'もう一度。影に「2連鎖」と出る場所を探しましょう。':'ピンクの2つを、ピンクのとなりへ。影に「2連鎖」と出たら すとん。'):game.phase==='pop'||game.phase==='settle'?(game.chain>=2?`${game.chain}連鎖中…`:'ぽん。'):game.queue[0]?.[1]===STAR?'次はこんぺいとう。たくさんある味の上へ。':'影が光る場所は、置くと消えます。';const status=el('status');if(status.dataset.text!==text){status.dataset.text=text;status.textContent=text;}
 el<HTMLButtonElement>('pause').disabled=!active();for(const id of ['left','ccw','cw','right','drop'])el<HTMLButtonElement>(id).disabled=!active();
}
// Hold-to-repeat pad. Keyboard activation (click with detail 0) is a single action.
let holdTimer=0,holdRepeat=0;function stopHold():void{clearTimeout(holdTimer);clearInterval(holdRepeat);holdTimer=holdRepeat=0;}
function bindPad(id:string,action:()=>void,repeat:boolean):void{const b=el<HTMLButtonElement>(id);
 b.addEventListener('pointerdown',e=>{if(!active()||!e.isPrimary||e.button!==0)return;e.preventDefault();void audio.unlock();stopHold();action();if(repeat)holdTimer=window.setTimeout(()=>{holdRepeat=window.setInterval(()=>{if(active())action();else stopHold();},70);},210);});
 for(const type of ['pointerup','pointercancel','pointerleave'])b.addEventListener(type,stopHold);b.addEventListener('click',e=>{if(e.detail===0&&active())action();});b.addEventListener('contextmenu',e=>e.preventDefault());}
bindPad('left',()=>move(game,-1),true);bindPad('right',()=>move(game,1),true);bindPad('ccw',()=>rotate(game,-1),false);bindPad('cw',()=>rotate(game,1),false);bindPad('drop',()=>hardDrop(game),false);
canvas.addEventListener('pointerdown',e=>{if(!active()||!e.isPrimary||e.button!==0)return;e.preventDefault();void audio.unlock();drag={id:e.pointerId,x:e.clientX,y:e.clientY,t:performance.now(),col:game.piece?.x??0,moved:false,soft:false};canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id||!active())return;const cell=canvas.getBoundingClientRect().width/COLS,dx=e.clientX-drag.x,dy=e.clientY-drag.y;
 if(game.piece&&game.phase==='drop'){const target=Math.max(-1,Math.min(COLS,drag.col+Math.round(dx/cell)));let guard=COLS;while(game.piece&&game.piece.x!==target&&guard--){if(!move(game,Math.sign(target-game.piece.x)))break;drag.moved=true;}}
 if(Math.abs(dx)>10)drag.moved=true;const soft=dy>cell*1.1&&Math.abs(dy)>Math.abs(dx);if(soft!==drag.soft){drag.soft=soft;setSoft(game,soft);}});
canvas.addEventListener('pointerup',e=>{if(!drag||e.pointerId!==drag.id)return;const dt=performance.now()-drag.t,cell=canvas.getBoundingClientRect().width/COLS,dx=e.clientX-drag.x,dy=e.clientY-drag.y,moved=drag.moved;clearInput();if(!active())return;
 if(dy>cell*1.4&&dt<260&&Math.abs(dy)>Math.abs(dx)*1.5)hardDrop(game);else if(!moved&&Math.hypot(dx,dy)<12&&dt<400)rotate(game,1);});
canvas.addEventListener('pointercancel',()=>clearInput());canvas.addEventListener('lostpointercapture',()=>{if(drag){drag=null;setSoft(game,false);}});
document.addEventListener('keydown',e=>{const target=e.target as HTMLElement;if(phase==='result'&&(e.key==='r'||e.key==='R')&&!training){e.preventDefault();telemetry.trackEvent('retry');start(false);return;}
 // Space/Enter on a focused pad activate that button, not the board shortcut.
 if(target.closest('.pad button')&&[' ','Enter'].includes(e.key))return;
 if(target.closest('input,select,a,dialog')||target.closest('button')&&!target.closest('.pad')||!active())return;
 if(e.key==='Escape'){pause();return;}const k=e.key.length===1?e.key.toLowerCase():e.key;
 if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' ','x','z','Enter'].includes(k)){e.preventDefault();void audio.unlock();
  if(k==='ArrowLeft')move(game,-1);else if(k==='ArrowRight')move(game,1);else if(k==='ArrowUp'||k==='x'){if(!e.repeat)rotate(game,1);}else if(k==='z'){if(!e.repeat)rotate(game,-1);}else if(k==='ArrowDown')setSoft(game,true);else if((k===' '||k==='Enter')&&!e.repeat)hardDrop(game);}});
document.addEventListener('keyup',e=>{if(e.key==='ArrowDown')setSoft(game,false);});
el('pause').onclick=pause;el('mute').onclick=()=>{el('mute').textContent=audio.toggle()?'音 OFF':'音 ON';};el('mute').textContent=audio.muted?'音 OFF':'音 ON';
function quit():void{abandon();telemetry.trackEvent('return_to_portal',{source:phase});clearInput();}el('portal-link').onclick=quit;menu.addEventListener('cancel',e=>e.preventDefault());
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});window.addEventListener('blur',pause);window.addEventListener('pagehide',event=>{if(active())pause();persist();if(!event.persisted)audio.destroy();});
function frame(now:number):void{const dt=previous===null?0:(now-previous)/1000;previous=now;
 if(dt>.5&&active()){pause();}else if(dt>0){clock+=dt;
  if(active()){stepMochi(game,Math.min(dt,.05)*1000);if(game.events.length){const list=game.events;game.events=[];effects(list);}}
  for(const p of particles){p.life+=dt;p.vy+=520*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.985;}for(let i=particles.length-1;i>=0;i--)if(particles[i].life>particles[i].max)particles.splice(i,1);
  for(const f of floats)f.life+=dt;for(let i=floats.length-1;i>=0;i--)if(floats[i].life>1.1)floats.splice(i,1);
  if(banner){banner.life+=dt;if(banner.life>1.5)banner=null;}shake*=Math.pow(.02,dt);flash*=Math.pow(.01,dt);glow*=Math.pow(.25,dt);}
 draw();render();requestAnimationFrame(frame);}
canvas.width=W;canvas.height=H;
telemetry.trackEvent('game_open');if(saved.snapshot){if(saved.runId&&!saved.reported){telemetry.restoreRun(saved.runId);records.resumeRun(saved.runId);}phase='play';pause();}else title();requestAnimationFrame(frame);
if(import.meta.env.DEV)Object.defineProperty(window,'__game036',{get:()=>({phase,training,game:structuredClone(game),saved:structuredClone(saved)})});
