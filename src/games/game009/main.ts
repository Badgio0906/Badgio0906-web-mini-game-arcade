import { createGameRecordSession } from '../../records/RecordSharing';
import './style.css';
import { StorageService } from '../../core/StorageService';
import { TelemetryService } from '../../core/TelemetryService';
import { AudioService } from '../../core/AudioService';
import { createStampGame } from './StampBoard';
import type { StampEvent, StampResult, StampSnapshot } from './contracts';
const recordSession = createGameRecordSession('game009');
const $=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
const app=$('app'),overlay=$('overlay');const storage=new StorageService(undefined,'web-mini-arcade:v1:game009:');const telemetry=new TelemetryService(storage,'game009');const audio=new AudioService(storage);
let state='title',best=storage.readNumber('bestRules2',0),runId=0,lastResult:StampResult|null=null,guard=0,finished=false;
const oldBest=storage.readNumber('best',0);const button=(id:string,label:string)=>`<button type="button" id="${id}">${label}</button>`;
function sync(){app.dataset.state=state;$('best-value').textContent=String(best);$('mute-button').textContent=audio.muted?'音 OFF':'音 ON';$('pause-button').textContent=state.endsWith('paused')?'▶':'Ⅱ';($('pause-button') as HTMLButtonElement).disabled=!['playing','practice','paused','practice-paused'].includes(state);}
function update(s:StampSnapshot){$('score-value').textContent=String(state.startsWith('practice')?0:s.score);$('correct-value').textContent=String(state.startsWith('practice')?0:s.correct);$('mode-label').textContent=s.tidy?'整頓済み':'散乱ボーナスあり';if(state==='practice'&&s.practiceDone){state='practice-done';telemetry.trackEvent('practice_complete',{rulesVersion:2});show();}}
function show(){sync();overlay.hidden=['playing','practice'].includes(state);guard=performance.now()+180;
 if(state==='title')overlay.innerHTML=`<article><small>机の上の物探し / STAMP HUNT</small><h1>印鑑どこですか</h1><p>電卓、はさみ、ペン…26種類。<br>頼まれた物を、机から探そう。</p><div class="menu-actions">${button('play-button','すぐ遊ぶ')}${button('explain-button','説明を見る')}${button('practice-button','練習する')}</div><p class="record-note">新版 BEST ${best} ・旧ルール BEST ${oldBest}</p></article>`;
 else if(state==='explanation')overlay.innerHTML=`<article><h2>机の探し物</h2><p>名前と特徴に合う物をクリック／タップ。<br>同じ条件なら、どれでも正解です。</p><p>折れた紙の端をめくると下の物が見えます。<br>整頓は −2.5秒、散乱ボーナスだけ減少。<br>誤答は −2秒。本番は75秒です。</p><p>同じ机を3問使います。場所も覚えよう。</p><div class="menu-actions">${button('play-button','すぐ遊ぶ')}${button('practice-button','練習する')}${button('title-button','タイトル')}</div></article>`;
 else if(state==='paused'||state==='practice-paused')overlay.innerHTML=`<article><h2>ちょっと休憩。</h2><p>机も時計も停止中。</p>${button('resume-button','再開')}${button('title-button','タイトル')}</article>`;
 else if(state==='practice-done')overlay.innerHTML=`<article><h2>練習できました！</h2><p>物を探す、紙をめくる、整頓する。<br>本番の記録には混ぜません。</p>${button('play-button','すぐ遊ぶ')}${button('title-button','タイトル')}</article>`;
 else if(state==='result'&&lastResult)overlay.innerHTML=`<article><h2>おつかれさま！</h2><strong class="result-score">${lastResult.score}点</strong><p>${lastResult.correct}個発見 ・誤答 ${lastResult.errors}回<br>紙めくり ${lastResult.lifts}回 ・整頓 ${lastResult.tidies}回</p><p>新版 BEST ${best} ／旧ルール ${oldBest}</p>${button('retry-button','もう1回')}${button('title-button','タイトル')}</article>`;
 if(state==='result')recordSession.mount(overlay.firstElementChild as HTMLElement);
}
function event(e:StampEvent){if(e.type==='correct')audio.tone(680,900,.07,'triangle',0,.02);if(e.type==='mistake')audio.tone(240,150,.12,'triangle',0,.018);if(state==='playing')telemetry.trackEvent('specific_game_events',{run_id:runId,rulesVersion:2,event:e.type,...e});}
const controller=createStampGame($('game-canvas'),{onUpdate:update,onEvent:event,onEnd(result){if(state!=='playing'||finished)return;finished=true;lastResult=result;best=Math.max(best,result.score);storage.writeNumber('bestRules2',best); recordSession.complete(result.score, { metadata: { duration_seconds: result.time, outcome: 'complete' } });telemetry.trackEvent('run_end',{run_id:runId,rulesVersion:2,score:result.score,correct:result.correct,seconds:result.time,errors:result.errors,lifts:result.lifts,tidies:result.tidies,outcome:'complete'});state='result';show();}});
function start(practice=false){void audio.unlock();if(state==='playing'||state==='practice')return;state=practice?'practice':'playing';finished=false;runId++;if(practice)telemetry.trackEvent('practice_start',{rulesVersion:2});else { recordSession.startRun(); telemetry.trackEvent('run_start',{run_id:runId,rulesVersion:2}); }controller.start(practice);show();}
function title(){if(state==='playing'||state==='paused')telemetry.trackEvent('run_end',{run_id:runId,rulesVersion:2,outcome:'quit',score:controller.snapshot().score});controller.title();state='title';show();}
function pause(){if(state==='playing'||state==='practice'){controller.pause(true);state=state==='practice'?'practice-paused':'paused';telemetry.trackEvent('pause',{run_id:runId,practice:state==='practice-paused'});show();}else if(state==='paused'||state==='practice-paused'){state=state==='practice-paused'?'practice':'playing';controller.pause(false);telemetry.trackEvent('resume',{run_id:runId,practice:state==='practice'});show();}}
app.addEventListener('click',event=>{const target=(event.target as Element).closest<HTMLButtonElement>('button');if(!target||target.disabled||performance.now()<guard)return;switch(target.id){case'play-button':case'retry-button':start();break;case'practice-button':start(true);break;case'explain-button':controller.title();state='explanation';telemetry.trackEvent('tutorial_view',{rulesVersion:2});show();break;case'title-button':case'brand-button':title();break;case'pause-button':case'resume-button':pause();break;case'mute-button':audio.toggle();sync();break;}});
document.addEventListener('keydown',event=>{if(event.repeat&&(event.key==='Enter'||event.key===' '))event.preventDefault();if(event.key==='Escape'&&!event.repeat){event.preventDefault();pause();}});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&(state==='playing'||state==='practice'))pause();});window.addEventListener('blur',()=>{if(state==='playing'||state==='practice')pause();});
telemetry.trackEvent('game_open',{rulesVersion:2});show();
if(import.meta.env.DEV)(window as unknown as {__arcadeDebug:unknown}).__arcadeDebug=Object.freeze({gameId:'game009',snapshot:()=>controller.snapshot(),inspection:()=>controller.inspection(),state:()=>state,telemetry:()=>telemetry.getEvents()});
if(import.meta.hot)import.meta.hot.dispose(()=>{controller.destroy();audio.destroy();});
