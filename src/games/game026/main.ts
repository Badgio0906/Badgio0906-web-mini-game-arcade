import './style.css';
import { Race, dice, point, marker, PROMOTIONS, TRANSFERS, type GameMode, type Move } from './model';
import { SaveStore, snapshot, reportResult, type Stats } from './save';
import { TurnScheduler, InputGate } from './flow';
import { TelemetryService, type EventName } from '../../core/TelemetryService';
import { AudioService } from '../../core/AudioService';
import { StorageService } from '../../core/StorageService';
import { uuid } from '../../analytics/runtime';
import { analyticsConfig } from '../../analytics/config';
const el=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
const app=el('app'), menu=el<HTMLDialogElement>('menu');
let inPractice=false;
const telemetry=new TelemetryService(undefined,'game026',undefined,{remoteCollectionEnabled:false,ignoreEvent:()=>analyticsConfig.environment==='production'&&inPractice});
const audio=new AudioService(new StorageService(undefined,'web-mini-arcade:v1:game026:'));
const store=new SaveStore(), scheduler=new TurnScheduler(), gate=new InputGate();
let available=store.read(), stats:Stats=available?.envelope.stats??{matches:0,wins:0,reported:[]};
let race=new Race('cpu'), selected:GameMode=available?.race?.mode??'cpu';
let state='title', retained=false, reported=false;
let runId:string|null=null, resultId:string|null=null, feedback='あなたのペースで、ひと振りずつ。', practiceStep=0;
const shapes=['circle','square','triangle','hexagon'], colors=['#dfad42','#4b8983','#c76e55','#7b9156'];
const name=(i:number)=>race.mode==='cpu' ? i===0?'あなた':'CPU' : `プレイヤー${i+1}`;
const training=()=>inPractice;
function event(name:EventName,data:Record<string,string|number|boolean>={}):void {if(!training())telemetry.trackEvent(name,data);}
function save():void {if(!training())store.write({save_version:1,stats,active:retained&&resultId?snapshot(race,resultId,runId,reported):null});}
function mode(next:string):void {scheduler.cancel();gate.transition();state=next;app.dataset.state=next;render();}
function show(html:string,next:string):void {
  mode(next);menu.innerHTML=html+'<p class="menu-return"><a id="menu-portal" href="./index.html">← 100ガレへ</a></p>';
  if(!menu.open)menu.show();menu.scrollTop=0;menu.querySelector<HTMLElement>('h2')?.setAttribute('tabindex','-1');menu.querySelector<HTMLElement>('h2')?.focus({preventScroll:true});
  el('menu-portal').onclick=()=>{if(retained&&!race.complete)pause(false);event('return_to_portal',{source:state});};
}
function close():void {if(menu.open)menu.close();}
function token(i:number,x:number,y:number,size:number):string {
  const c=colors[i], common=`fill="${c}" stroke="#173d43" stroke-width=".35"`;
  if(i===0)return `<circle cx="${x}" cy="${y}" r="${size}" ${common}/>`;
  if(i===1)return `<rect x="${x-size}" y="${y-size}" width="${size*2}" height="${size*2}" rx=".3" ${common}/>`;
  const pts=i===2?[[x,y-size],[x+size,y+size],[x-size,y+size]]:[[x-size/2,y-size],[x+size/2,y-size],[x+size,y],[x+size/2,y+size],[x-size/2,y+size],[x-size,y]];
  return `<polygon points="${pts.map(p=>p.join(',')).join(' ')}" ${common}/>`;
}
function renderBoard():void {
  let svg='<defs><marker id="up-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="3" markerHeight="3" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#447e61"/></marker><marker id="down-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="3" markerHeight="3" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#697ea0"/></marker></defs>';
  for(let p=1;p<=100;p++){const q=point(p);svg+=`<rect x="${q.x-5}" y="${q.y-5}" width="10" height="10" fill="${p===100?'#f1d580':(Math.floor((p-1)/10)+((p-1)%10))%2?'#f9f4df':'#dfe9d6'}" stroke="#b7c5af" stroke-width=".15"/>`;}
  for(const [type,map] of [['up',PROMOTIONS],['down',TRANSFERS]] as const) for(const [a,b] of Object.entries(map)){const from=point(Number(a)),to=point(b);svg+=`<path d="M ${from.x} ${from.y+1.5} L ${to.x} ${to.y+1.5}" fill="none" stroke="${type==='up'?'#50896b':'#6a80a0'}" stroke-width=".85" opacity=".85" marker-end="url(#${type}-arrow)" ${type==='down'?'stroke-dasharray="1.2 .6"':''}/>`;}
  for(let p=1;p<=100;p++){const q=point(p);svg+=`<text x="${q.x-3.9}" y="${q.y-1.1}" font-size="3.6" font-weight="650" fill="#183d43">${p}</text>`;if(PROMOTIONS[p]!==undefined||TRANSFERS[p]!==undefined)svg+=`<text x="${q.x+3.4}" y="${q.y+4}" text-anchor="end" font-size="3.2" font-weight="800" fill="${PROMOTIONS[p]!==undefined?'#376d4a':'#456182'}">${PROMOTIONS[p]!==undefined?'↑':'↓'}</text>`;}
  for(let i=0;i<race.players.length;i++){const p=race.players[i];const group=race.players.map((v,j)=>v.position===p.position?j:-1).filter(j=>j>=0),at=group.indexOf(i),m=marker(p.position,group.length,at);
    svg+=`<g aria-label="${name(i)}、${p.position}マス${p.rank?'、'+p.rank+'位':''}">${token(i,m.x,m.y,m.size)}</g>`;}
  document.getElementById('board')!.innerHTML=svg;
  document.getElementById('board')!.setAttribute('aria-label',`1から100の盤面。${race.players.map((p,i)=>`${name(i)}は${p.position}マス${p.rank?'、'+p.rank+'位':''}`).join('。')}`);
}
function render():void {
  renderBoard();el('players').innerHTML=race.players.map((p,i)=>`<div class="player ${i===race.current&&!race.complete?'active':''}" data-player="${i}" data-position="${p.position}" data-rank="${p.rank??''}"><span class="token-icon ${shapes[i]}" aria-hidden="true"></span><strong>${name(i)}<small>${p.rank?p.rank+'位':i===race.current?'今回の手番':'次の手番を待っています'}</small></strong><span class="position">${p.position}<small>マス</small></span></div>`).join('');
  el('die').textContent=race.lastDie===null?'—':String(race.lastDie);el('die').setAttribute('aria-label',race.lastDie===null?'サイコロ、まだ振っていません':`確定したサイコロの目、${race.lastDie}`);
  el('turn').textContent=training()?`練習 ${Math.min(practiceStep+1,2)} / 2 · 記録には入りません`:race.complete?'順位が決まりました':`${name(race.current)}の番 · ${race.history.length+1}手目`;
  el('status').textContent=feedback;
  el<HTMLButtonElement>('roll').disabled=!['playing','practice'].includes(state)||race.active.cpu||race.complete;
  el('roll').textContent=state==='rolling'?'目を確定しました':race.active.cpu&&state==='playing'?'CPUの番':'サイコロをふる';
  for(const id of ['pause','help','retry'])el<HTMLButtonElement>(id).disabled=!['playing','rolling','practice'].includes(state);
}
function message(move:Move):string {
  const start=`${name(move.player)}：${move.die} → `;
  if(move.event==='promotion')return `${start}${move.landed}から${move.to}へ昇進。名刺が少し強そうになりました。`;
  if(move.event==='transfer')return `${start}${move.landed}から${move.to}へ異動。窓際の景色が良くなりました。`;
  if(move.event==='overrun')return `${start}100を超えるので、その場の${move.from}マス。`;
  if(move.event==='finish')return `${start}100ぴったり！ ${race.players[move.player].rank}位でゴール。`;
  return `${start}${move.to}マスへ。`;
}
function scheduleTurn():void {if(state==='playing'&&race.active.cpu&&!race.complete)scheduler.schedule(440,()=>{if(state==='playing'&&!document.hidden&&race.active.cpu)roll();});}
function settle():void {
  if(!['rolling','practice-rolling'].includes(state)||document.hidden)return;
  const move=race.settle();if(!move)return;feedback=message(move);audio.tone(320,420,.065,'sine',0,.012);
  if(!training()) {event('specific_game_events',{event:move.event==='finish'?'finish':move.event,player:move.player+1,position:move.to,turns:race.history.length,dice:move.die});}
  if(training()){practiceStep++;if(practiceStep>=2){show('<h2 id="menu-title">のぼったり、おりたり。</h2><p>昇進・異動はサイコロ移動のあとに1回だけ。押しっぱなしで次のサイコロは振れません。</p><div class="menu-actions"><button id="practice-again">もう一度練習</button><button id="practice-title" class="primary">タイトルへ</button></div>','practice-result');el('practice-again').onclick=practice;el('practice-title').onclick=()=>title();}else{mode('practice');el('roll').focus({preventScroll:true});}return;}
  if(race.complete){if(!reported&&resultId){stats=reportResult(race,resultId,stats);reported=true;save();event('run_end',{outcome:'clear',completed:true,players:race.players.length,rank:race.players[0].rank!,turns:race.history.length,promotions:race.players.reduce((a,p)=>a+p.promotions,0),transfers:race.players.reduce((a,p)=>a+p.transfers,0)});}results();return;}
  mode('playing');save();scheduleTurn();if(!race.active.cpu)el('roll').focus({preventScroll:true});
}
function roll():void {
  if(!['playing','practice'].includes(state)||race.pending!==null||race.complete)return;
  const value=training()?2:dice();if(!race.prepare(value))return;
  event('specific_game_events',{event:'dice_roll',dice:value,player:race.current+1,players:race.players.length,turns:race.history.length+1});
  feedback=`${name(race.current)}の目は${value}。結果はもう確定しています。`;mode(training()?'practice-rolling':'rolling');save();void audio.unlock();
  scheduler.schedule(matchMedia('(prefers-reduced-motion: reduce)').matches?70:220,settle);
}
function abandon():void {scheduler.cancel();if(retained&&!race.complete)event('run_end',{outcome:'quit',completed:false,turns:race.history.length,players:race.players.length});retained=false;runId=null;resultId=null;reported=false;inPractice=false;save();}
function start():void {abandon();race=new Race(selected);retained=true;resultId=uuid();event('run_start',{players:race.players.length,mode:selected});runId=telemetry.getActiveRunId();available=null;feedback='100ぴったりを目指そう。まずは、ひと振り。';close();mode('playing');save();el('roll').focus({preventScroll:true});void audio.unlock();}
function title(initial=false):void {
  if(!initial){abandon();available=null;race=new Race(selected);}
  show(`<p class="eyebrow">UP & DOWN</p><h2 id="menu-title">出世すごろく</h2><p>ふって進んで、のぼったり、おりたり。<br>時間を気にせず、100マスへ。</p><label>参加者<select id="mode"><option value="cpu" ${selected==='cpu'?'selected':''}>あなた + CPU</option><option value="local2" ${selected==='local2'?'selected':''}>同じ端末で2人</option><option value="local3" ${selected==='local3'?'selected':''}>同じ端末で3人</option><option value="local4" ${selected==='local4'?'selected':''}>同じ端末で4人</option></select></label><div class="menu-actions">${available?.race&&!available.race.complete?'<button id="restore" class="primary">保存した対戦を続ける</button>':''}<button id="play" class="primary">すぐ遊ぶ</button><button id="explain">説明を見る</button><button id="practice">練習する</button></div><p>完了した対戦 ${stats.matches}回 · あなた / P1の1位 ${stats.wins}回<br>途中保存の復元は、休憩状態から。</p>`,'title');
  el<HTMLSelectElement>('mode').onchange=e=>{selected=(e.target as HTMLSelectElement).value as GameMode;race=new Race(selected);render();};el('play').onclick=start;el('explain').onclick=()=>help(false);el('practice').onclick=practice;
  if(available?.race&&!available.race.complete)el('restore').onclick=()=>{const loaded=available!;race=loaded.race!;selected=race.mode;const s=loaded.envelope.active!;runId=s.runId;resultId=s.resultId;reported=s.reported;retained=true;inPractice=false;stats=loaded.envelope.stats;available=null;if(runId)telemetry.restoreRun(runId);feedback='保存した対戦です。確定済みのサイコロも、そのまま続きます。';pause(false);};
}
function help(inRun:boolean):void {
  if(inRun){scheduler.cancel();save();}event('tutorial_view',{source:inRun?'playing':'title'});
  show('<h2 id="menu-title">100ぴったりまで、ひと振りずつ。</h2><ol class="rules"><li>自分の番にサイコロをふる。1〜6は同じ確率です。</li><li>上向きの昇進で上へ、下向きの異動で下へ。移動イベントは1回だけ、連鎖しません。</li><li>100を超える目なら、その場。6でも追加ターンはありません。</li><li>ゴールした人は手番を抜けます。最後の1人の順位は、その時点で確定します。</li></ol><p>時間制限や時間BESTはありません。同じマスの駒は形と位置で区別できます。休憩と再読込では勝手に次の手番を進めません。</p><div class="menu-actions"><button id="help-return" class="primary">'+(inRun?'盤面へ':'タイトルへ')+'</button></div>','help');
  el('help-return').onclick=()=>{if(inRun)resume();else title(true);};
}
function pause(track=true):void {if(track)event('pause');show('<h2 id="menu-title">ひと休み。</h2><p>サイコロもCPUの番も止まっています。<br>確定した目は、振り直しません。</p><div class="menu-actions"><button id="resume" class="primary">続ける</button><button id="pause-title">対戦を終えてタイトルへ</button></div>','paused');save();el('resume').onclick=resume;el('pause-title').onclick=()=>title();}
function resume():void {event('resume');close();if(race.pending!==null){mode(training()?'practice-rolling':'rolling');scheduler.schedule(120,settle);}else{mode(training()?'practice':'playing');scheduleTurn();if(!race.active.cpu)el('roll').focus({preventScroll:true});}save();}
function practice():void {abandon();inPractice=true;race=new Race('local2');race.players[0].position=16;race.players[1].position=1;practiceStep=0;feedback='練習用の位置です。2が出るサイコロを振って、異動を体験しよう。';close();mode('practice');el('roll').focus({preventScroll:true});}
function results():void {
  const rows=race.players.map((p,i)=>({p,i})).sort((a,b)=>a.p.rank!-b.p.rank!).map(({p,i})=>`<tr><td>${p.rank}位</td><td>${name(i)}${p.position!==100?' · 最後の順位':''}</td><td>${p.turns}</td><td>${p.promotions} / ${p.transfers}</td></tr>`).join('');
  show(`<h2 id="menu-title">順位が決まりました。</h2><table><thead><tr><th>順位</th><th>参加者</th><th>手数</th><th>昇進 / 異動</th></tr></thead><tbody>${rows}</tbody></table><p>最後の1人は現在地で順位確定。<br>完了した対戦 ${stats.matches}回 · P1の1位 ${stats.wins}回</p><div class="menu-actions"><button id="next" class="primary">もう一局</button><button id="result-title">タイトルへ</button></div>`,'result');el('next').onclick=()=>{event('retry');start();};el('result-title').onclick=()=>title();save();
}
el('roll').onclick=roll;el('pause').onclick=()=>pause();el('help').onclick=()=>help(true);
el('retry').onclick=()=>{show('<h2 id="menu-title">最初からやり直す？</h2><p>今の対戦は終了して、新しく始めます。</p><div class="menu-actions"><button id="confirm-retry">やり直す</button><button id="cancel-retry" class="primary">今の対戦へ</button></div>','confirm');save();el('confirm-retry').onclick=()=>{event('retry');if(training())practice();else start();};el('cancel-retry').onclick=resume;};
el('mute').onclick=()=>{audio.toggle();el('mute').textContent=audio.muted?'音 OFF':'音 ON';};el('mute').textContent=audio.muted?'音 OFF':'音 ON';
el('portal').onclick=()=>{if(retained&&!race.complete)pause(false);event('return_to_portal',{source:state});};
// Own controls only: native click is committed once, after a fresh matching pointer down/up.
let pointerStart:{id:number;x:number;y:number}|null=null;
document.addEventListener('pointerdown',e=>{if(!e.isPrimary||e.button!==0)return;const target=(e.target as Element).closest('button,a');if(target){gate.down(e.pointerId,target);pointerStart={id:e.pointerId,x:e.clientX,y:e.clientY};}},{capture:true});
document.addEventListener('pointermove',e=>{if(pointerStart?.id===e.pointerId&&Math.hypot(e.clientX-pointerStart.x,e.clientY-pointerStart.y)>12){gate.cancel(e.pointerId);pointerStart=null;}},{capture:true});
document.addEventListener('pointerup',e=>{gate.release(e.pointerId);pointerStart=null;},{capture:true});
document.addEventListener('pointercancel',e=>{gate.cancel(e.pointerId);pointerStart=null;},{capture:true});
document.addEventListener('lostpointercapture',e=>gate.lost(e.pointerId),{capture:true});
document.addEventListener('click',e=>{const target=(e.target as Element).closest('button,a');if(target&&e.detail>0&&!gate.physicalClick(target)){e.preventDefault();e.stopImmediatePropagation();}},{capture:true});
let keyboard:{key:string;target:HTMLButtonElement;epoch:number}|null=null;
document.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();if(['playing','rolling','practice','practice-rolling'].includes(state))pause();return;}if((e.key==='Enter'||e.key===' ')&&(e.target as HTMLElement).tagName==='BUTTON'){e.preventDefault();if(gate.keyDown(e.key,e.repeat))keyboard={key:e.key,target:e.target as HTMLButtonElement,epoch:gate.epoch};}},{capture:true});
document.addEventListener('keyup',e=>{if(e.key!=='Enter'&&e.key!==' ')return;const allowed=gate.keyUp(e.key);if(keyboard?.key===e.key){e.preventDefault();const press=keyboard;keyboard=null;if(allowed&&press.epoch===gate.epoch&&press.target.isConnected&&!press.target.disabled)press.target.click();}},{capture:true});
function background():void {gate.clear();keyboard=null;if(['playing','rolling','practice','practice-rolling','help','confirm'].includes(state)&& (retained||training()))pause(false);}
document.addEventListener('visibilitychange',()=>{if(document.hidden)background();});window.addEventListener('blur',background);
window.addEventListener('pagehide',()=>{scheduler.cancel();gate.clear();if(retained&&!race.complete){state='paused';app.dataset.state=state;}save();audio.destroy();});
telemetry.trackEvent('game_open');title(true);
