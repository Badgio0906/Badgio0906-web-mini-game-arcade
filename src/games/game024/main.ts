import './style.css';
import { StorageService } from '../../core/StorageService';
import { AudioService } from '../../core/AudioService';
import { TelemetryService, type EventName } from '../../core/TelemetryService';
import { analyticsConfig } from '../../analytics/config';
import { createSnake,enqueue,step,type Direction,type Speed } from './model';
import { SnakeClock } from './clock';
import { SnakeSaveStore, captureSave } from './save';
const el = <T extends HTMLElement>(id:string) => document.getElementById(id) as T;
const app=el('app'),canvas=el<HTMLCanvasElement>('board'),menu=el<HTMLDialogElement>('menu');
const storage=new StorageService(undefined,'web-mini-arcade:v1:game024:');
const audio=new AudioService(storage), telemetry=new TelemetryService(storage,'game024',undefined,{remoteCollectionEnabled:false});
const store=new SnakeSaveStore(); let saved=store.read();
let snake=saved.snapshot ?? createSnake(seed()),speed=saved.speed,clock=new SnakeClock(speed);
clock.remainder=saved.clock.remainder;clock.elapsed=saved.clock.elapsed;
type Phase='title'|'explanation'|'playing'|'practice'|'paused'|'result'|'confirm';
let phase:Phase='title',training=false;
const held=new Set<string>();
const labels:Record<Speed,string>={4:'ゆっくり',6:'ふつう',8:'はやい'};
function seed():number { const v=new Uint32Array(1); try {crypto.getRandomValues(v);return v[0];}catch{return Date.now()>>>0;} }
const active = () => phase==='playing' || phase==='practice';
function trainingEvent(name:EventName,data:Record<string,string|number|boolean>={}):void { if(analyticsConfig.environment!=='production')telemetry.trackEvent(name,{...data,mode:'practice'}); }
function persist():void { if(training)return; saved=captureSave(saved,snake,speed,{remainder:clock.remainder,elapsed:clock.elapsed});store.write(saved); }
function clearInput():void {held.clear();snake={...snake,queue:[]};}
function setPhase(next:Phase):void {phase=next;app.dataset.state=next;el<HTMLButtonElement>('pause-button').disabled=!active();el<HTMLButtonElement>('restart-button').disabled=!active();el<HTMLButtonElement>('help-button').disabled=!active();for(const b of document.querySelectorAll<HTMLButtonElement>('[data-dir]')) b.disabled=!active(); if(active()){if(menu.open)menu.close();clock.resume();}else{clock.pause();clearInput();} render();}
function show(html:string,next:Phase):void {setPhase(next);menu.innerHTML=html+'<p class="menu-return"><a id="menu-portal" href="./index.html">← 100ガレへ</a></p>';if(!menu.open)menu.show();el('menu-portal').onclick=portal; menu.querySelector<HTMLButtonElement>('button')?.focus({preventScroll:true});}
function draw():void {
  const size=Math.max(1,Math.floor(canvas.getBoundingClientRect().width*(devicePixelRatio||1)));
  if(canvas.width!==size){canvas.width=size;canvas.height=size;}
  const ctx=canvas.getContext('2d');if(!ctx)return; const c=size/snake.size;
  ctx.fillStyle='#eaf0dd';ctx.fillRect(0,0,size,size);
  ctx.strokeStyle='#c4d2b5';ctx.lineWidth=Math.max(1,size/600);
  ctx.beginPath();for(let i=0;i<=snake.size;i++){ctx.moveTo(i*c,0);ctx.lineTo(i*c,size);ctx.moveTo(0,i*c);ctx.lineTo(size,i*c);}ctx.stroke();
  if(snake.food){const f=snake.food;ctx.fillStyle='#bd883c';ctx.beginPath();ctx.roundRect((f.x+.19)*c,(f.y+.19)*c,.62*c,.62*c,.13*c);ctx.fill();ctx.fillStyle='#e7b975';ctx.fillRect((f.x+.27)*c,(f.y+.25)*c,.22*c,.12*c);}
  snake.body.forEach((p,i)=>{ctx.fillStyle=i===0?'#42794d':'#719660';ctx.beginPath();ctx.roundRect((p.x+.055)*c,(p.y+.055)*c,.89*c,.89*c,.22*c);ctx.fill();});
  const h=snake.body[0];const vertical=['up','down'].includes(snake.direction), sign=['up','left'].includes(snake.direction)?-.19:.19;
  ctx.fillStyle='#173e31';for(const eye of [-.19,.19]){ctx.beginPath();ctx.arc((h.x+.5+(vertical?eye:sign))*c,(h.y+.5+(vertical?sign:eye))*c,.065*c,0,Math.PI*2);ctx.fill();}
}
function render():void {draw();el('foods-value').textContent=String(snake.foods);el('length-value').textContent=String(snake.body.length);el('best-value').textContent=training?'—':String(saved.stats.best[speed]);el('speed-label').textContent=`${labels[speed]} · 毎秒${speed}マス`;el('board-caption').textContent=training?'練習 · 餌を1つ食べよう · 記録には入りません':'20 × 20 · 端は通り抜けません';el('live-status').textContent=training?'↑ に曲がって、琥珀色の餌へ。':active()?'真逆へは曲がれません。しっぽに、ご用心。':phase==='paused'?'一時停止中 · 再開はボタンから。':'好きな速さで、のびのびと。';}
function recordEnd(reason:'wall'|'self'|'clear'|'quit'|'restart'):void {
  if(training || !saved.run.active || saved.run.reported)return;
  saved.run.active=false;saved.run.reported=true;saved.stats.runs++;
  if(reason==='clear')saved.stats.clears++;
  if(reason==='quit'||reason==='restart'){saved.snapshot=null;saved.clock={remainder:0,elapsed:0};store.write(saved);}else persist();
  telemetry.trackEvent('run_end',{outcome:reason==='clear'?'clear':['wall','self'].includes(reason)?'fail':reason,reason,score:snake.foods,foods:snake.foods,length:snake.body.length,speed,seconds:Number((clock.elapsed/1000).toFixed(2)),completed:reason==='clear',unit:'foods'});
}
function title():void {
  recordEnd('quit');if(training)speed=saved.speed;training=false;saved.snapshot=null;saved.run={id:null,active:false,reported:true,freshFoods:0};saved.clock={remainder:0,elapsed:0};store.write(saved);snake=createSnake(seed());clock=new SnakeClock(speed);
  show(`<p class="eyebrow">SNAKE</p><h2 id="menu-title">ひとマススネーク</h2><p>食べて、のびて。<br>自分のしっぽに、ご用心。</p><label class="speed-choice">進む速さ<select id="speed-choice">${([4,6,8] as Speed[]).map(s=>`<option value="${s}" ${speed===s?'selected':''}>${labels[s]} · 毎秒${s}マス</option>`).join('')}</select></label><div class="menu-actions"><button id="play-button" class="primary" type="button">すぐ遊ぶ</button><button id="explain-button" type="button">説明を見る</button><button id="practice-button" type="button">練習する</button></div><p>速度ごとにBESTを保存。途中は一時停止で保存します。</p>`,'title');
  el<HTMLSelectElement>('speed-choice').onchange=e=>{speed=Number((e.target as HTMLSelectElement).value) as Speed;saved.speed=speed;store.write(saved);render();};
  el('play-button').onclick=()=>{telemetry.trackEvent('tutorial_skip',{source:'title'});start();};el('explain-button').onclick=()=>explain(false);el('practice-button').onclick=practice;
}
function start():void {recordEnd('restart');training=false;snake=createSnake(seed());clock=new SnakeClock(speed);clearInput(); saved.run={id:null,active:true,reported:false,freshFoods:0};telemetry.trackEvent('run_start',{speed,source:phase,unit:'foods'});saved.run.id=telemetry.getActiveRunId();setPhase('playing');persist();void audio.unlock();}
function practice():void {recordEnd('quit');training=true;speed=4;snake=createSnake(24,8);snake.food={x:4,y:2};clock=new SnakeClock(4);clearInput();trainingEvent('practice_start');setPhase('practice');void audio.unlock();}
function explain(inRun:boolean):void {
  if(!training)telemetry.trackEvent('tutorial_view',{source:phase});
  show('<p class="eyebrow">HOW TO PLAY</p><h2 id="menu-title">餌を食べて、1マスずつ。</h2><ol><li>蛇は選んだ速さで進みます。矢印キー、WASD、方向ボタンで曲がります。</li><li>琥珀色の四角が餌。食べると身体が1マス伸びます。</li><li>壁や自分の身体にぶつかると終了。真逆へは曲がれません。</li><li>20×20マスを埋めるとクリア。途中で速さは変わりません。</li></ol><p>餌の数が記録です。時間制限はありません。<br>離れると休憩。戻ったら、ボタンで再開。</p><div class="menu-actions"><button id="continue-button" class="primary" type="button">'+(inRun?'再開する':'すぐ遊ぶ')+'</button>'+(inRun?'':'<button id="practice-button" type="button">練習する</button><button id="title-button" type="button">タイトルへ</button>')+'</div>','explanation');
  persist();el('continue-button').onclick=inRun?resume:start;if(!inRun){el('practice-button').onclick=practice;el('title-button').onclick=title;}
}
function resume():void {clearInput();if(!training)telemetry.trackEvent('resume');setPhase(training?'practice':'playing');persist();void audio.unlock();}
function pause(restored=false):void {if(!active()&&!restored)return;if(!training&&!restored)telemetry.trackEvent('pause');
  show(`<h2 id="menu-title">${restored?'途中から、のびのび。':'ひと休み。'}</h2><p>盤面はそのまま。<br>${restored?'保存した続きです。':'休憩中は蛇も止まります。'}<br>ボタンで再開してください。</p><div class="menu-actions"><button id="resume-button" class="primary" type="button">再開する</button><button id="pause-retry" type="button">最初から遊ぶ</button><button id="pause-title" type="button">タイトルへ</button></div>`,'paused');persist();el('resume-button').onclick=resume;el('pause-retry').onclick=retry;el('pause-title').onclick=title;}
function retry():void {if(training){practice();return;}telemetry.trackEvent('retry',{source:phase});start();}
function confirmRestart():void {show('<h2 id="menu-title">最初から遊ぶ？</h2><p>途中の蛇は終わり、新しい盤面を始めます。</p><div class="menu-actions"><button id="confirm-retry" type="button">もう1回</button><button id="cancel-retry" class="primary" type="button">再開する</button></div>','confirm');persist();el('confirm-retry').onclick=retry;el('cancel-retry').onclick=resume;}
function result():void {
  const completed=training&&snake.foods>=1;
  if(training){if(completed)trainingEvent('practice_complete',{foods:1});}
  else recordEnd(snake.outcome as 'wall'|'self'|'clear');
  const text=completed?'練習できました。':snake.outcome==='clear'?'盤面いっぱい、のびました。':snake.outcome==='wall'?'壁にぶつかりました。':'自分の身体にぶつかりました。';
  show(`<p class="eyebrow">${training?'PRACTICE':'SNAKE'}</p><h2 id="menu-title">${text}</h2><p>餌 ${snake.foods}個 · 長さ ${snake.body.length}<br>${training?'練習の記録はBESTに入りません。':`${labels[speed]} · BEST ${saved.stats.best[speed]}個`}</p><div class="menu-actions"><button id="retry-button" class="primary" type="button">${training?'もう1回練習':'もう1回'}</button>${training?'<button id="practice-play" type="button">本番を遊ぶ</button>':''}<button id="result-title" type="button">タイトルへ</button></div>`,'result');persist();el('retry-button').onclick=retry;el('result-title').onclick=title;if(training)el('practice-play').onclick=()=>{speed=saved.speed;start();};
}
function tick():boolean {
  if(!active())return false;const previous=snake.foods;snake=step(snake);
  if(snake.foods>previous){audio.tone(470,570,.07,'sine',0,.018);if(!training){saved.run.freshFoods++;telemetry.trackEvent('specific_game_events',{event:'food',foods:snake.foods,length:snake.body.length,speed});if(snake.foods>saved.stats.best[speed]){saved.stats.best[speed]=snake.foods;telemetry.trackEvent('best_update',{score:snake.foods,best:snake.foods,unit:'foods',speed});}}}
  render();persist();if(snake.outcome!=='playing'||training&&snake.foods>=1){result();return false;}return true;
}
function direction(d:Direction):void {if(active())snake=enqueue(snake,d);}
for(const b of document.querySelectorAll<HTMLButtonElement>('[data-dir]'))b.onclick=()=>direction(b.dataset.dir as Direction);
const keyDirs:Record<string,Direction>={ArrowUp:'up',ArrowRight:'right',ArrowDown:'down',ArrowLeft:'left',w:'up',d:'right',s:'down',a:'left'};
document.addEventListener('keydown',e=>{if((e.target as HTMLElement).closest('input,select,textarea'))return;const d=keyDirs[e.key]??keyDirs[e.key.toLowerCase()];if(d&&active()){e.preventDefault();if(!e.repeat&&!held.has(e.key)){held.add(e.key);direction(d);}}else if(e.key==='Escape'&&active()){e.preventDefault();pause();}});
document.addEventListener('keyup',e=>held.delete(e.key));menu.addEventListener('cancel',e=>e.preventDefault());
el('pause-button').onclick=()=>pause();el('restart-button').onclick=confirmRestart;el('help-button').onclick=()=>explain(true);
el('mute-button').onclick=()=>{el('mute-button').textContent=audio.toggle()?'音 OFF':'音 ON';};el('mute-button').textContent=audio.muted?'音 OFF':'音 ON';
function portal():void {recordEnd('quit');telemetry.trackEvent('return_to_portal',{source:phase});}
el('portal-link').onclick=portal;
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});window.addEventListener('blur',()=>pause());window.addEventListener('resize',draw);
window.addEventListener('pagehide',()=>{clock.pause();clearInput();persist();audio.destroy();},{once:true});
function frame(now:number):void {if(clock.frame(now,tick)==='gap')pause();requestAnimationFrame(frame);}
telemetry.trackEvent('game_open');
if(saved.snapshot){if(saved.run.active&&saved.run.id)telemetry.restoreRun(saved.run.id);if(snake.outcome==='playing')pause(true);else result();}else title();
requestAnimationFrame(frame);
if(import.meta.env.DEV)Object.defineProperty(window,'__game024',{get:()=>({phase,training,speed,snake:structuredClone(snake),elapsed:clock.elapsed,stats:structuredClone(saved.stats),run:structuredClone(saved.run),telemetry:telemetry.getEvents()})});
