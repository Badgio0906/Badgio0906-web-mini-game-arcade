import { createGameRecordSession } from '../../records/RecordSharing';
import './style.css';
import { AudioService } from '../../core/AudioService';
import { StorageService } from '../../core/StorageService';
import { TelemetryService } from '../../core/TelemetryService';
import { ChargeBoard } from './ChargeBoard';
import { ChargeMusic } from './ChargeMusic';
import { ChargeInput } from './ChargeInput';
import { ChargePractice } from './ChargePractice';
import { ChargeRun } from './ChargeRun';
import { createAuthoredLevel } from './authoredLevel';
import { recordClearStats, recordFallStats } from './stats';
import type { ChargeEvent } from './chargeTypes';
const recordSession = createGameRecordSession('game019');

type State = 'title' | 'explanation' | 'playing' | 'practice' | 'paused' | 'result';
const el = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;
const app = el('app'), menu = el('menu'), canvas = el<HTMLCanvasElement>('frog-canvas');
const storage = new StorageService(undefined, 'web-mini-arcade:v1:game019:');
const audio = new AudioService(storage), telemetry = new TelemetryService(storage, 'game019'), board = new ChargeBoard(canvas);
const music = new ChargeMusic(audio);
let best = storage.readNumber('bestHeightDm', 0, 0, 2000);
let state: State = 'title', previous: 'playing' | 'practice' = 'playing';
let run = new ChargeRun(createAuthoredLevel(), onRunEvent), practice: ChargePractice | null = null;
let activeRun = false, runId = 0, runStartBest = best, peeking = false, chargeTone = '';
const fmt = (n: number) => `${Math.max(0, n).toFixed(1)} m`;
const active = () => state === 'playing' || state === 'practice';
const current = () => (state === 'practice' || state === 'paused' && previous === 'practice') && practice ? practice.run : run;
const input = new ChargeInput(el<HTMLButtonElement>('jump-button'), el<HTMLButtonElement>('left-button'), el<HTMLButtonElement>('right-button'), {
  enabled: () => active() && !(state === 'practice' && practice?.passed),
  begin: () => { void audio.unlock(); return current().beginCharge(); },
  release: () => { if (current().releaseCharge() && state === 'practice') audio.tone(260, 500, .08, 'square', 0, .018); },
  cancel: () => current().cancelCharge(),
  direction: d => { if (state === 'practice' && practice) practice.direction(d); else current().setDirection(d); },
  peek: p => { peeking = p; }, pause: () => state === 'paused' ? resume() : pause(), focus: () => canvas.focus({ preventScroll: true }),
}, el<HTMLButtonElement>('peek-button'));
function setState(next: State): void {
  input.reset(); state = next; app.dataset.state = next; chargeTone = '';
  el<HTMLButtonElement>('pause-button').disabled = !active(); el('practice-actions').hidden = next !== 'practice'; menu.hidden = active();
  for (const id of ['left-button', 'right-button', 'jump-button', 'peek-button']) el<HTMLButtonElement>(id).disabled = !active();
}
function track(event: ChargeEvent): void { telemetry.trackEvent('specific_game_events', { event: event.type, run_id: runId, ...event.data }); }
function onRunEvent(event: ChargeEvent): void {
  if (!activeRun) return;
  track(event);
  if (event.type === 'jump') audio.tone(event.data.jump_band === 'short' ? 210 : event.data.jump_band === 'medium' ? 290 : 370, 600, .08, 'square', 0, .018);
  if (event.type === 'land') audio.tone(160, 100, .045, 'triangle', 0, .016);
  if (event.type === 'fall_end' && Number(event.data.progress_lost) >= 8) audio.tone(180, 55, .22, 'sawtooth', 0, .012);
  if (event.type === 'ceiling_bump' || event.type === 'wall_bump') audio.tone(85, 40, .055, 'square', 0, .012);
  if (event.type === 'well_clear') {
    storage.writeNumber('wellClearCount', storage.readNumber('wellClearCount', 0, 0, 1000000) + 1);
    telemetry.trackEvent('phase_reached', { phase: 'shore', height: 100, run_id: runId });
    audio.tone(330, 660, .15, 'square', 0, .018); audio.tone(440, 880, .15, 'square', .15, .018);
  }
  if (event.type === 'chapter_reached') telemetry.trackEvent('phase_reached', { phase: 'sky', height: event.data.height, run_id: runId });
  if (event.type === 'clear') {
    track({ type: 'space_clear', data: event.data }); telemetry.trackEvent('phase_reached', { phase: 'space', height: 200, run_id: runId });
    recordClearStats(storage, run.time);
    finish('clear'); showResult();
  }
}
function saveBest(): void {
  if (!activeRun) return;
  const next = Math.floor(run.maxHeight * 10 + 1e-7);
  if (next > best) { best = Math.min(2000, next); storage.writeNumber('bestHeightDm', best); }
}
function finish(outcome: 'clear' | 'quit' | 'restart'): void {
  if (!activeRun) return; saveBest(); const s = run.snapshot(); activeRun = false;
  const newBest = best > runStartBest;
  telemetry.trackEvent('score', { score: Math.floor(s.maxHeight * 10) / 10, unit: 'meters', newBest, run_id: runId });
  if (newBest) telemetry.trackEvent('best_update', { score: best / 10, best: best / 10, unit: 'meters', run_id: runId });
  telemetry.trackEvent('run_end', { outcome, score: s.maxHeight, seconds: Number(s.time.toFixed(2)), falls: s.falls, total_fall: s.totalFall, biggest_fall: s.biggestFall, jumps: s.jumps, phase: s.chapter, run_id: runId });
  recordFallStats(storage, s.totalFall);
  recordSession.complete(Math.floor(s.maxHeight*10+1e-7)/10, { metadata: { duration_seconds: s.time, outcome } });
}
function beginRun(source = 'direct'): void {
  finish('restart'); input.reset(); practice = null; run = new ChargeRun(createAuthoredLevel(), onRunEvent); activeRun = true; runId++; runStartBest = best;
  recordSession.startRun(); telemetry.trackEvent('run_start', { source, run_id: runId, level: 'authored-v2', air_control: 'none' });
  telemetry.trackEvent('phase_reached', { phase: 'well', height: 0, run_id: runId });
  setState('playing'); menu.innerHTML = ''; board.resetCamera(); canvas.focus({ preventScroll: true }); void audio.unlock();
}
function title(): void {
  finish('quit'); input.reset(); practice = null; run = new ChargeRun(createAuthoredLevel(), onRunEvent); setState('title'); board.resetCamera();
  menu.innerHTML = `<span class="eyebrow">HOLD. RELEASE. HOPE.</span><h1>井の中の蛙、<br>大海を目指す<small>WELL TO SPACE</small></h1><p>溜めて、離して、祈る。<br>落ちた分だけ、次の跳び方が分かる。</p><div class="menu-actions"><button id="play-button" class="primary" type="button">すぐ遊ぶ</button><button id="tutorial-explain-button" type="button">説明を見る</button><button id="tutorial-again-button" type="button">練習する</button></div><p class="menu-detail">目標は井戸の外、100m。落ちても続く。<br>最高高度を保存。位置のセーブはありません。</p>`;
  el('play-button').onclick = () => { telemetry.trackEvent('tutorial_skip', { source: 'title', practiced: storage.readBoolean('chargePracticeV2Completed', false) }); beginRun(); };
  el('tutorial-explain-button').onclick = explain; el('tutorial-again-button').onclick = beginPractice;
}
function explain(): void {
  setState('explanation'); telemetry.trackEvent('tutorial_view', { source: 'title' });
  menu.innerHTML = `<span class="eyebrow">HOW TO HOP</span><h2>離す前に、着地点を決める。</h2><ol><li><b>JUMPを押して溜め、離して跳ぶ。</b>短押しは位置合わせ、ほどほどは普段の登り、長押しは高く遠くへ。</li><li><b>左・右を押しながら離す。</b>方向なしは真上。跳んだ後の左右入力では軌道を変えられない。</li><li>大きく跳べば正解とは限らない。梁、狭い石、滑る苔を見て踏み切ろう。</li><li><b>下を見る</b>を押すと戻り先を確認できる。大きな棚は落下を受け止める地形。位置を保存するチェックポイントではない。</li><li>落ちても同じRUNが続く。ゆっくり観察して、もう一度。井戸の外では旗と風を読もう。</li></ol><p>PC：← / A、→ / D ＋ Space長押し→離す。↓ / Sで下を見る。Escで一時停止。<br>スマホ：左右と中央JUMPを同時に押す。方向を離すと真上。<br>風は踏み切った場所の風が着地まで続きます。</p><div class="menu-actions"><button id="play-button" class="primary" type="button">すぐ遊ぶ</button><button id="practice-button" type="button">練習する</button><button id="title-button" type="button">タイトルへ</button></div>`;
  el('play-button').onclick = () => beginRun('explanation'); el('practice-button').onclick = beginPractice; el('title-button').onclick = title;
}
function beginPractice(): void {
  finish('quit'); input.reset(); practice = new ChargePractice(step => { telemetry.trackEvent('tutorial_step_complete', { step: step + 1, mode: 'practice', version: 2 }); audio.tone(360, 720, .1, 'square', 0, .018); });
  setState('practice'); menu.innerHTML = ''; board.resetCamera(); telemetry.trackEvent('practice_start', { source: 'menu', version: 2 }); canvas.focus({ preventScroll: true }); void audio.unlock();
}
function completePractice(): void {
  telemetry.trackEvent('practice_complete', { steps: 7, version: 2 }); storage.writeBoolean('chargePracticeV2Completed', true); setState('result');
  menu.innerHTML = `<span class="eyebrow">PRACTICE COMPLETE</span><h2>溜め方、分かった！</h2><p>小さく整え、ほどほどに登り、大きく狙う。<br>飛んだら着地を待とう。</p><div class="menu-actions"><button id="play-button" class="primary" type="button">すぐ遊ぶ</button><button id="title-button" type="button">タイトルへ</button></div>`;
  el('play-button').onclick = () => beginRun('practice'); el('title-button').onclick = title;
}
function showResult(): void {
  const s = run.snapshot(); setState('result');
  menu.innerHTML = `<span class="eyebrow">WELL → SEA → SPACE</span><h2>宇宙だ！ ……次はどこ？</h2><p class="result-height">${fmt(s.maxHeight)}</p><p>TOTAL FALL ${fmt(s.totalFall)}<br>転落 ${s.falls}回 ／ ${s.jumps}ジャンプ<br>TIME ${Math.floor(s.time / 60)}:${String(Math.floor(s.time % 60)).padStart(2, '0')} ／ BEST ${fmt(best / 10)}</p><div class="menu-actions"><button id="retry-button" class="primary" type="button">もう一度、井戸から</button><button id="title-button" type="button">タイトルへ</button><a href="./index.html">ゲームセンターへ</a></div>`;
  recordSession.mount(menu);
  el('retry-button').onclick = () => { telemetry.trackEvent('retry'); beginRun('retry'); }; el('title-button').onclick = title;
}
function pause(): void {
  if (!active()) return; previous = state as 'playing' | 'practice'; setState('paused'); telemetry.trackEvent('pause', { mode: previous });
  menu.innerHTML = `<span class="eyebrow">TAKE A BREATH</span><h2>一時停止</h2><p>HEIGHT ${fmt(current().snapshot().height)}<br>TOTAL FALL ${fmt(current().totalFall)}</p><div class="menu-actions"><button id="resume-button" class="primary" type="button">続ける</button><button id="restart-button" type="button">最初からやり直す</button><button id="title-button" type="button">タイトルへ</button></div>`;
  if (previous === 'playing') { saveBest(); const s = run.snapshot(); recordSession.complete(Math.floor(s.maxHeight*10+1e-7)/10, { metadata: { duration_seconds: s.time, outcome: 'milestone' } }); recordSession.mount(menu); }
  el('resume-button').onclick = resume; el('restart-button').onclick = confirmRestart; el('title-button').onclick = title;
}
function confirmRestart(): void {
  menu.innerHTML = `<span class="eyebrow">RESTART?</span><h2>最初からやり直す？</h2><p>いまの位置へは戻れません。BESTは残ります。</p><div class="menu-actions"><button id="confirm-restart-button" type="button">はい、最初から</button><button id="resume-button" class="primary" type="button">やめて続ける</button></div>`;
  el('confirm-restart-button').onclick = () => { telemetry.trackEvent('retry', { mode: previous }); if (previous === 'practice') beginPractice(); else beginRun('restart'); }; el('resume-button').onclick = resume;
}
function resume(): void { if (state !== 'paused') return; setState(previous); telemetry.trackEvent('resume', { mode: previous }); canvas.focus({ preventScroll: true }); }
el('pause-button').onclick = pause;
el('mute-button').onclick = () => { el('mute-button').textContent = audio.toggle() ? '音 OFF' : '音 ON'; }; el('mute-button').textContent = audio.muted ? '音 OFF' : '音 ON';
el('next-practice-button').onclick = () => { if (!practice || state !== 'practice') return; input.reset(); if (practice.next()) { board.resetCamera(); if (practice.complete) completePractice(); else canvas.focus({ preventScroll: true }); } };
el('skip-practice-button').onclick = () => { telemetry.trackEvent('tutorial_skip', { source: 'practice', step: (practice?.stage ?? 0) + 1, version: 2 }); beginRun('practice_skip'); };
el('portal-link').addEventListener('click', () => { finish('quit'); telemetry.trackEvent('return_to_portal', { source: state }); });
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); }); window.addEventListener('blur', pause);
window.addEventListener('pagehide', () => { finish('quit'); input.destroy(); audio.destroy(); }, { once: true });
let last = performance.now();
function frame(now: number): void {
  const dt = Math.min(.05, Math.max(0, (now - last) / 1000)); last = now;
  if (state === 'practice') practice!.update(dt); else if (state === 'playing') { run.update(dt); saveBest(); }
  const s = current().snapshot(); music.update(dt, active(), s.height >= 170 ? 'space' : s.chapter, s.phase === 'charging'); board.draw(s, { dt, peek: peeking, practice: state === 'practice', title: state === 'title' });
  el('height-value').textContent = fmt(s.height); el('max-value').textContent = fmt(s.maxHeight); el('best-value').textContent = fmt(best / 10);
  el('chapter-label').textContent = state === 'practice' ? `練習 ${practice!.stage + 1} / 7：${practice!.lesson.title}` : s.chapter === 'well' ? `${s.section?.name ?? '井戸の底'} / 目標 100m` : s.chapter === 'sea' ? '海だ！ ……あっ、鳥!?' : s.chapter === 'sky' ? '井の外の蛙、宇宙を目指す' : '宇宙に到着！';
  el('wind-label').textContent = s.wind ? s.wind.label : '風なし';
  const next = el('next-wind-label'); next.hidden = !s.nextWind || !s.wellCleared; next.textContent = s.nextWind ? `次の風 ${s.nextWind.from}m〜：${s.nextWind.label}` : '';
  el('live-status').textContent = state === 'practice' ? practice!.passed ? '着地できた！ 次へ進もう。' : practice!.lesson.text : s.feedback;
  if (state === 'practice') { el<HTMLButtonElement>('next-practice-button').disabled = !practice!.passed; el('next-practice-button').textContent = practice!.stage === 6 ? '練習を完了' : 'できた！ 次へ'; }
  // Edge-triggered charge notes; never a continuously repeating alarm or exact POWER readout.
  const toneKey = s.phase === 'charging' && active() ? s.chargeBand : '';
  if (toneKey !== chargeTone) { chargeTone = toneKey; if (toneKey) audio.tone(toneKey === 'short' ? 160 : toneKey === 'medium' ? 220 : 300, toneKey === 'long' ? 360 : 260, .04, 'triangle', 0, .012); }
  requestAnimationFrame(frame);
}
telemetry.trackEvent('game_open'); title(); requestAnimationFrame(frame);
if (import.meta.env.DEV) {
  Object.defineProperty(window, '__game019', { get: () => ({ state, run: current().snapshot(), practice: practice ? { stage: practice.stage, passed: practice.passed, complete: practice.complete } : null, best, telemetry: telemetry.getEvents() }) });
  // Deliberately separate expensive forecasting from the cheap snapshot used while holding input.
  Object.defineProperty(window, '__game019Forecasts', { get: () => [60, 80, 100, 120, 150, 200, 250, 300, 325, 350, 375, 400, 425, 450, 475, 500, 525, 550, 575, 600, 625, 650, 675, 700].flatMap(ms => ([-1, 0, 1] as const).map(d => current().forecast(ms, d))) });
}
