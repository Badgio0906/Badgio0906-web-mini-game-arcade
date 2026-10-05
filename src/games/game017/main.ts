import './style.css';
import { StorageService } from '../../core/StorageService';
import { AudioService } from '../../core/AudioService';
import { TelemetryService } from '../../core/TelemetryService';
import { CreditService } from '../../core/CreditService';
import { requestRewardedCredit } from '../../core/RewardService';
import { RainRun } from './RainRun';
import { RainBoard, project, unproject, VIEW } from './RainBoard';
import type { Phase, RainEvent } from './types';

type Screen = 'title' | 'explanation' | 'practice' | 'practice-complete' | 'playing' | 'paused' | 'result' | 'practice-failure' | 'reward';
const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;
const storage = new StorageService(undefined, 'web-mini-arcade:v1:game017:');
const telemetry = new TelemetryService(storage, 'game017'), audio = new AudioService(storage), credits = new CreditService(storage, telemetry);
const app = $('app'), menu = $('menu'), canvas = $<HTMLCanvasElement>('rain-canvas'), abort = new AbortController();
const board = new RainBoard(canvas), run = new RainRun(onEvent);
let screen: Screen = 'title', previousScreen: Screen = 'playing', best = storage.readNumber('best', 0), ended = true, runId = '', epoch = 0, frame = 0, disposed = false, lastRainSound = 0, lastDrawSound = 0;
let drag: { id: number; epoch: number } | null = null;
const origins = new Map<number, { epoch: number; approved: boolean }>();
const zoom = document.createElement('canvas'); zoom.width = 152; zoom.height = 128; zoom.style.width = '100%'; zoom.style.height = '100%'; $('pointer-loupe').append(zoom);
const zoomContext = zoom.getContext('2d')!;
const btn = (id: string, label: string, primary = false): string => '<button id="' + id + '" class="' + (primary ? 'primary' : '') + '" type="button">' + label + '</button>';
const titleButton = (): string => btn('title-button', 'タイトル');
const text = (id: string, value: string): void => { const e = $(id); if (e.textContent !== value) e.textContent = value; };
const now = (): number => performance.now();
const phaseLabels: Record<Phase, string> = { warning: 'CLOUDS GATHER', rain: 'RAIN IS HERE', rise: '超加速！', plan: 'WORLD STOP · PLAN', lower: 'LET’S RUN', dash: 'シュシュン！', clear: 'DRY CLEAR', over: 'RAINY…' };

function stopDrag(): void { const old = drag; drag = null; if (old && canvas.hasPointerCapture(old.id)) canvas.releasePointerCapture(old.id); $('pointer-loupe').hidden = true; }
function setScreen(next: Screen): void {
  stopDrag(); epoch++; screen = next; app.dataset.state = screen; menu.hidden = next === 'playing' || next === 'practice';
  if (document.activeElement instanceof HTMLElement && menu.contains(document.activeElement)) document.activeElement.blur();
  const actions = (markup: string): string => '<div class="menu-actions">' + markup + '</div>';
  if (next === 'title') menu.innerHTML = '<span class="menu-eyebrow">A VERY DRY THEORY</span><h1>雨って避けたら<br/>濡れないよね<small>～RAINSHIFT～</small></h1><p>雨を止めて、道を描いて、<br/>シュシュン！ と右端まで。</p>' + actions(btn('play-button', storage.readBoolean('tutorialCompleted', false) ? 'すぐ遊ぶ' : '遊んでみる', true) + btn('tutorial-again-button', '練習する')) + '<p class="menu-detail">クリック／タップ → ドラッグ<br/>無料・回数制限なしの試作版</p>';
  if (next === 'explanation') menu.innerHTML = '<span class="menu-eyebrow">HOW TO STAY DRY</span><h2>雨？ 当たらなければ晴れです。</h2><ol><li>雨が来たら、道路か「超加速」をタップ。</li><li>世界が止まったら、黄色い主人公からドラッグ。</li><li>赤い着地点を避け、右のGOALへ。計画は5秒。</li></ol><p>薄い雨は今回は届きません。<br/>線が途切れたら、先端から続きを描けます。</p>' + actions(btn('tutorial-practice-button', 'やってみる', true) + titleButton());
  if (next === 'practice-complete') menu.innerHTML = '<span class="menu-eyebrow">PRACTICE COMPLETE</span><h2>DRY CLEAR！</h2><p>雨って実質、晴れと同じよな。<br/>同じ操作で、次は本番の通りへ。</p>' + actions(btn('tutorial-start-button', '本番へ', true) + titleButton()) + '<p class="menu-detail">練習はSCORE・BEST・CREDITに影響しません。</p>';
  if (next === 'paused') menu.innerHTML = '<span class="menu-eyebrow">WORLD PAUSED</span><h2>雨も時計も、お休み。</h2><p>描いた線と残り時間を保持しています。<br/>再開後は、線の先端から描けます。</p>' + actions(btn('resume-button', '続きから', true) + titleButton());
  if (next === 'result' || next === 'practice-failure') {
    const reason = run.result?.reason === 'rain' ? '赤い雨の着地点に触れました。' : run.result?.reason === 'activation' ? '雨が来たら、タップで止めよう。' : '線がGOALまで届いていませんでした。';
    menu.innerHTML = '<span class="menu-eyebrow">' + (next === 'result' ? 'GAME OVER' : 'PRACTICE · TRY AGAIN') + '</span><h2>雨はやっぱり雨だ……</h2><p>Rainy is still rainy...</p><p>' + reason + '</p>' + (next === 'result' ? '<p class="result-score" id="result-score">' + run.score + '</p><p>ROUND ' + run.round + ' · DRY STREAK ' + run.streak + '<br/>BEST ' + best + '</p>' : '<p>練習は終わりません。もう一度試そう。</p>') + actions(btn(next === 'result' ? 'retry-button' : 'practice-retry-button', next === 'result' ? 'もう一回' : 'もう一度やってみる', true) + titleButton() + (next === 'result' ? '<a href="./index.html">ゲームセンター</a>' : ''));
  }
  if (next === 'reward') menu.innerHTML = '<span class="menu-eyebrow">DEVELOPMENT STUB</span><h2>CREDITを補充</h2><p>開発用Stubです。実際の広告はありません。</p>' + actions(btn('reward-confirm-button', '+3 CREDIT', true) + titleButton());
  sync();
}
function sync(): void {
  const real = !run.practice && screen !== 'title' && screen !== 'explanation';
  text('score-value', String(real ? run.score : 0)); text('round-value', String(real ? run.round : 1)); text('streak-value', String(real ? run.streak : 0)); text('best-value', String(best));
  text('mute-button', audio.muted ? '音 OFF' : '音 ON'); $('mute-button').setAttribute('aria-pressed', String(audio.muted));
  const pausable = screen === 'playing' || screen === 'practice' || screen === 'paused';
  $<HTMLButtonElement>('pause-button').disabled = !pausable; $('pause-button').setAttribute('aria-label', screen === 'paused' ? '再開' : '一時停止'); text('pause-button', screen === 'paused' ? '▶' : 'Ⅱ');
  $<HTMLButtonElement>('accelerate-button').disabled = !(screen === 'playing' || screen === 'practice') || run.phase !== 'rain';
  $<HTMLButtonElement>('erase-button').disabled = !(screen === 'playing' || screen === 'practice') || run.phase !== 'plan';
  app.dataset.phase = run.phase; app.dataset.round = String(run.round);
  const remaining = run.remaining(now()); text('timer-value', remaining === null ? run.phase === 'rise' || run.phase === 'lower' ? '↻' : 'READY' : remaining.toFixed(1) + 's');
  const step = run.phase === 'warning' || run.phase === 'rain' ? 1 : run.phase === 'rise' ? 2 : run.phase === 'plan' ? run.route.length > 1 ? 4 : 3 : 5;
  text('phase-label', (run.practice && screen === 'practice' ? '練習 ' + step + '/5 · ' : '') + phaseLabels[run.phase]);
  const message = run.feedback || (run.phase === 'warning' ? '雲が集まっています。雨が降ったらタップ！' : run.phase === 'rain' ? '今！ 道路か超加速ボタンをタップ。' : run.phase === 'plan' ? '赤い着地点を避けて、主人公からGOALへドラッグ。' : run.phase === 'dash' ? '描いた線に沿って、超高速移動！' : run.phase === 'clear' ? 'Rainy is basically sunny. ' + (run.closeCalls ? 'CLOSE CALL ×' + run.closeCalls : '雨って実質、晴れと同じよな') : run.phase === 'over' ? run.result?.reason === 'rain' ? '赤い雨の着地点に触れました。' : run.result?.reason === 'activation' ? '雨が来たら、タップで止めよう。' : '線がGOALまで届いていませんでした。' : '視点が移る間、計画の時計は止まります。');
  text('live-status', message);
}
function onEvent(event: RainEvent): void {
  if (event.type === 'phase') {
    stopDrag(); epoch++;
    if (event.phase === 'rise') { audio.tone(150, 1300, .16, 'sawtooth', 0, .025); if (!run.practice) telemetry.trackEvent('phase_reached', { runId, phase: 'acceleration' }); }
    if (event.phase === 'dash') for (let i = 0; i < 3; i++) audio.tone(1100, 160, .13, 'triangle', i * .25, .025);
    if (event.phase === 'warning' && !run.practice && !ended) telemetry.trackEvent('round_reached', { runId, round: run.round });
  }
  if (event.type === 'clear') {
    audio.tone(660, 990, .18, 'triangle', 0, .04);
    if (run.practice) { telemetry.trackEvent('tutorial_step_complete', { step: 5 }); setScreen('practice-complete'); }
    else telemetry.trackEvent('milestone_reached', { runId, round: event.round, score: event.score, close_calls: event.closeCalls });
  }
  if (event.type === 'end') {
    audio.tone(290, 65, .22, 'sine', 0, .045);
    if (run.practice) { setScreen('practice-failure'); return; }
    if (ended) return; ended = true; best = Math.max(best, event.result.score); storage.writeNumber('best', best);
    telemetry.trackEvent('run_end', { runId, outcome: 'over', score: event.result.score, time: event.result.time, failure_reason: event.result.reason, round: event.result.round });
    telemetry.trackEvent('score', { runId, score: event.result.score, best }); telemetry.trackEvent('run_duration', { runId, seconds: event.result.time, reason: 'over' }); setScreen('result');
  }
}
function explain(): void { quit(); telemetry.trackEvent('tutorial_start', { practiceAgain: storage.readBoolean('tutorialCompleted', false) }); setScreen('explanation'); }
function start(retry = false): void {
  if (disposed || screen === 'playing' || screen === 'practice' || credits.rewardPending) return;
  if (!storage.readBoolean('tutorialCompleted', false)) { explain(); return; }
  if (!credits.canPlay) { setScreen('reward'); return; }
  runId = 'game017-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
  if (credits.enabled && !credits.consume(runId)) return;
  ended = false; if (retry) telemetry.trackEvent('retry', { runId }); telemetry.trackEvent('run_start', { runId }); void audio.unlock();
  setScreen('playing'); run.start(now(), Math.floor(Math.random() * 0xffffffff)); sync();
}
function quit(): void {
  if (ended || run.practice) return;
  ended = true; run.pause(true, now()); telemetry.trackEvent('quit', { runId, score: run.score, time: run.time }); telemetry.trackEvent('run_end', { runId, outcome: 'quit', score: run.score, time: run.time });
}
function pause(): void {
  if (screen === 'playing' || screen === 'practice') { previousScreen = screen; run.pause(true, now()); if (run.paused) { telemetry.trackEvent('pause', { runId }); setScreen('paused'); } }
  else if (screen === 'paused') { run.pause(false, now()); telemetry.trackEvent('resume', { runId }); setScreen(previousScreen); }
}
function accelerate(): void { if (screen === 'playing' || screen === 'practice') { void audio.unlock(); run.activate(now()); sync(); } }
function localPoint(event: PointerEvent) {
  const rect = canvas.getBoundingClientRect(), scale = Math.min(rect.width / VIEW.width, rect.height / VIEW.height);
  const left = rect.left + (rect.width - VIEW.width * scale) / 2, top = rect.top + (rect.height - VIEW.height * scale) / 2;
  return { ...unproject((event.clientX - left) / scale, (event.clientY - top) / scale), viewX: (event.clientX - left) / scale, viewY: (event.clientY - top) / scale, rect, scale };
}
function loupe(event: PointerEvent): void {
  if (event.pointerType !== 'touch') return;
  const p = localPoint(event), box = $('pointer-loupe'), stage = $('board-wrap').getBoundingClientRect();
  box.hidden = false; box.style.left = Math.max(0, Math.min(stage.width - 76, event.clientX - stage.left - 90)) + 'px'; box.style.top = Math.max(0, event.clientY - stage.top - 96) + 'px';
  zoomContext.fillStyle = '#edf3df'; zoomContext.fillRect(0, 0, zoom.width, zoom.height);
  zoomContext.drawImage(canvas, p.viewX - 45, p.viewY - 40, 112, 80, 0, 0, zoom.width, zoom.height);
}
app.addEventListener('pointerdown', e => { if (origins.size > 64) origins.clear(); origins.set(e.pointerId, { epoch, approved: e.isPrimary && e.button === 0 && !e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey }); }, { capture: true, signal: abort.signal });
app.addEventListener('click', e => {
  const id = (e as PointerEvent).pointerId, origin = origins.get(id); origins.delete(id);
  if (origin !== undefined && (!origin.approved || origin.epoch !== epoch)) { e.preventDefault(); e.stopImmediatePropagation(); }
}, { capture: true, signal: abort.signal });
canvas.addEventListener('pointerdown', e => {
  if (!e.isPrimary || e.button !== 0 || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || screen !== 'playing' && screen !== 'practice') return;
  e.preventDefault(); void audio.unlock();
  if (run.phase === 'rain') { accelerate(); return; }
  if (run.phase !== 'plan') return;
  const point = localPoint(e), tail = run.route[run.route.length - 1], projected = project(tail, 0, run.camera);
  const nearVisibleTail = Math.hypot(point.viewX - projected.x, point.viewY - projected.y) * point.scale <= 28;
  if (!run.append(nearVisibleTail ? tail : point, now(), true)) { sync(); return; }
  drag = { id: e.pointerId, epoch }; canvas.setPointerCapture(e.pointerId); loupe(e);
}, { signal: abort.signal });
canvas.addEventListener('pointermove', e => { if (!drag || drag.id !== e.pointerId || drag.epoch !== epoch) return; e.preventDefault(); const accepted = run.append(localPoint(e), now()); if (accepted && now() - lastDrawSound > 90) { lastDrawSound = now(); audio.tone(450, 600, .035, 'sine', 0, .008); } if (drag) loupe(e); sync(); }, { signal: abort.signal });
canvas.addEventListener('pointerup', e => { if (drag?.id !== e.pointerId) return; run.append(localPoint(e), now()); stopDrag(); }, { signal: abort.signal });
canvas.addEventListener('pointercancel', stopDrag, { signal: abort.signal }); canvas.addEventListener('lostpointercapture', stopDrag, { signal: abort.signal });
app.addEventListener('click', e => {
  if (e.button !== 0 || e.altKey || e.ctrlKey || e.metaKey || credits.rewardPending) return;
  const target = (e.target as Element).closest<HTMLButtonElement | HTMLAnchorElement>('button,a'); if (!target || target instanceof HTMLButtonElement && target.disabled) return;
  if (target instanceof HTMLAnchorElement) { quit(); telemetry.trackEvent('return_to_portal', { runId }); return; }
  switch (target.id) {
    case 'play-button': start(); break;
    case 'retry-button': start(true); break;
    case 'tutorial-again-button': explain(); break;
    case 'tutorial-practice-button': setScreen('practice'); run.start(now(), 1, true); sync(); break;
    case 'tutorial-start-button': storage.writeBoolean('tutorialCompleted', true); telemetry.trackEvent('tutorial_complete'); start(); break;
    case 'practice-retry-button': if (run.result?.reason === 'activation') run.start(now(), 1, true); else run.retryPractice(now()); setScreen('practice'); break;
    case 'title-button': quit(); setScreen('title'); break;
    case 'pause-button': case 'resume-button': pause(); break;
    case 'mute-button': audio.toggle(); sync(); break;
    case 'accelerate-button': accelerate(); break;
    case 'erase-button': stopDrag(); run.resetRoute(now()); sync(); break;
    case 'reward-confirm-button': { const pending = credits.requestRewardedCredit(requestRewardedCredit); menu.querySelectorAll<HTMLButtonElement>('button').forEach(b => { b.disabled = true; }); void pending.then(granted => { if (!disposed) setScreen(granted ? 'title' : 'reward'); }); break; }
  }
}, { signal: abort.signal });
const held = new Set<string>();
document.addEventListener('keydown', e => {
  if (e.repeat || held.has(e.code)) { if (e.code === 'Space' || e.code === 'Enter') e.preventDefault(); return; } held.add(e.code);
  if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
  if (e.code === 'Escape') { e.preventDefault(); pause(); }
  if (e.code === 'Space' && !(e.target as Element).closest('button,a') && run.phase === 'rain') { e.preventDefault(); accelerate(); }
}, { signal: abort.signal });
document.addEventListener('keyup', e => held.delete(e.code), { signal: abort.signal });
function blur(): void { held.clear(); stopDrag(); if (screen === 'playing' || screen === 'practice') pause(); }
window.addEventListener('blur', blur, { signal: abort.signal }); document.addEventListener('visibilitychange', () => { if (document.hidden) blur(); }, { signal: abort.signal });
window.addEventListener('pagehide', e => { if (e.persisted) blur(); else quit(); }, { signal: abort.signal });
function tick(time: number): void {
  if (screen === 'playing' || screen === 'practice') run.settle(time);
  board.render(run, time, screen === 'title' || screen === 'explanation'); sync();
  if ((screen === 'playing' || screen === 'practice') && run.phase === 'rain' && time - lastRainSound > 200) { lastRainSound = time; audio.tone(1100, 570, .08, 'triangle', 0, .009); }
  frame = requestAnimationFrame(tick);
}
telemetry.trackEvent('game_open'); setScreen('title'); frame = requestAnimationFrame(tick);
if (import.meta.env.DEV) (window as unknown as { __arcadeDebug: unknown }).__arcadeDebug = Object.freeze({ gameId: 'game017', state: () => screen, snapshot: () => run.snapshot(now()), inspection: () => ({ rain: run.scene.rain.map(r => ({ ...r, impact: { ...r.impact } })), safeRoute: run.scene.safeRoute.map(p => ({ ...p })), wind: { ...run.scene.wind }, attempts: run.scene.attempts, rejected: run.scene.rejected, fallback: run.scene.fallback }), telemetry: () => telemetry.getEvents() });
if (import.meta.hot) import.meta.hot.dispose(() => { disposed = true; cancelAnimationFrame(frame); stopDrag(); abort.abort(); audio.destroy(); board.destroy(); delete (window as unknown as { __arcadeDebug?: unknown }).__arcadeDebug; });
