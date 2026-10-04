import { createOnboarding } from '../../arcade/onboarding';
import { memoryComment } from './resultFlavor';
import './style.css';
import { StorageService } from '../../core/StorageService';
import { CreditService } from '../../core/CreditService';
import { TelemetryService } from '../../core/TelemetryService';
import { AudioService } from '../../core/AudioService';
import { requestRewardedCredit } from '../../core/RewardService';
import { createEchoGame } from './EchoBoard';
import type { EchoEvent, EchoResult, EchoSnapshot } from './contracts';

type Screen = 'title' | 'playing' | 'paused' | 'result' | 'reward';
const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;
const app = $('app'); const overlay = $('overlay');
const storage = new StorageService(undefined, 'web-mini-arcade:v1:game004:');
const telemetry = new TelemetryService(storage, 'game004');
const onboarding = createOnboarding({ gameId: 'game004', storage, telemetry });
const credits = new CreditService(storage, telemetry); const audio = new AudioService(storage);
const listeners = new AbortController();
let state: Screen = 'title'; let runId = ''; let lastResult: EchoResult | null = null;
let best = storage.readNumber('best', 0); let newBest = false; let ended = true;
let resultAvailableAt = 0; let rewardOfferVisible = false; let disposed = false;
let resultTimer: ReturnType<typeof window.setTimeout> | undefined;
const primary = (id: string, text: string) => `<button id="${id}" type="button" class="primary">${text}<span aria-hidden="true">→</span></button>`;
const titleButton = '<button id="title-button" type="button" class="secondary" aria-label="タイトルに戻る">TITLE</button>';
const stub = '<small class="stub-note">開発版 Rewarded Ad Stub<br />本番広告は表示されません。</small>';
function trackRewardOffer(): void {
  if (!credits.canPlay && !rewardOfferVisible && $('reward-button')) { rewardOfferVisible = true; telemetry.trackEvent('reward_offer_shown', { runId }); }
}
function sync(): void {
  app.dataset.state = state; $('credit-count').textContent = String(credits.credits);
  $('credit-dots').textContent = Array.from({ length: 3 }, (_, i) => i < credits.credits ? '●' : '○').join(' ');
  $('best-value').textContent = String(best); $('mute-button').textContent = audio.muted ? '音 OFF' : '音 ON';
  $('mute-button').setAttribute('aria-label', audio.muted ? '音声をオンにする' : '音声をミュート'); $('mute-button').setAttribute('aria-pressed', String(audio.muted));
  const button = $<HTMLButtonElement>('pause-button'); button.disabled = state !== 'playing' && state !== 'paused'; button.textContent = state === 'paused' ? '▶' : 'Ⅱ'; button.setAttribute('aria-label', state === 'paused' ? '再開' : '一時停止');
}
function writeText(id: string, value: string): void { const element = $(id); if (element && element.textContent !== value) element.textContent = value; }
function update(snapshot: EchoSnapshot): void {
  writeText('score-value', String(snapshot.level)); writeText('correct-value', String(snapshot.correctInputs)); writeText('sequence-value', String(snapshot.totalLength)); writeText('input-count', `${snapshot.index} / ${snapshot.totalLength}`);
  if (app.dataset.phase !== snapshot.phase) app.dataset.phase = snapshot.phase;
  const label = state === 'paused' ? 'PAUSED' : snapshot.phase === 'watch' ? 'WATCH · 見て覚える' : snapshot.phase === 'recall' ? 'YOUR TURN · あなたの番' : snapshot.phase === 'between' ? 'LEVEL CLEAR' : 'CORRECT SEQUENCE';
  writeText('phase-label', label);
  writeText('phase-hint', state === 'paused' ? '再開ボタンで続きから' : snapshot.phase === 'watch' ? '光る順番を覚えよう' : snapshot.phase === 'recall' ? '同じ順番でタップ · 時間制限なし' : snapshot.phase === 'between' ? '正解！ 次の光を待とう' : '正しい順番を、もう一度');
  writeText('turn-label', snapshot.phase === 'recall' ? 'あなたの番。' : snapshot.phase === 'between' ? '覚えられた！' : 'まずは、見て覚える。');
  writeText('recall-progress', snapshot.phase === 'recall' ? `${snapshot.index} / ${snapshot.totalLength} INPUTS` : `${snapshot.totalLength} LIGHTS`);
}
function setScreen(next: Screen, delay = false): void {
  if (resultTimer !== undefined) { window.clearTimeout(resultTimer); resultTimer = undefined; }
  state = next; sync();
  if (credits.canPlay || next === 'playing') rewardOfferVisible = false;
  if (next === 'playing') {
    overlay.innerHTML = '<article class="play-card"><span class="eyebrow">WATCH → RECALL</span><h2 id="turn-label">まずは、見て覚える。</h2><p>光が終わったら、同じ順番で。<br />入力の時間制限はありません。</p><b id="recall-progress">2 LIGHTS</b></article>';
    return;
  }
  if (next === 'title') {
    $('score-value').textContent = '1'; $('correct-value').textContent = '0'; $('sequence-value').textContent = '2'; $('input-count').textContent = '0 / 2'; app.dataset.phase = 'ended'; $('phase-label').textContent = 'READY'; $('phase-hint').textContent = '光った順番を覚えて、タップ';
    overlay.innerHTML = `<article class="start-card"><span class="eyebrow">REMEMBER THE LIGHTS</span><h2 class="game-title">あなたの短期記憶、無事ですか？<small>ECHO GRID</small></h2><p>まずは2つの光から。<br />光が終わったら、同じ順番で押そう。</p><div class="mini-best">BEST <b>${best}</b> LEVEL</div>${credits.canPlay ? primary('play-button', 'PLAY · 記憶開始') : primary('reward-button', '+3 CREDIT')}<small class="input-note">クリック / タップ / 1–9</small>${credits.canPlay ? '' : stub}</article>`;
  } else if (next === 'paused') {
    $('phase-label').textContent = 'PAUSED'; $('phase-hint').textContent = '光も時間も止まっています';
    overlay.innerHTML = `<article class="start-card pause-card"><span class="eyebrow">TAKE A QUIET MOMENT</span><h2>ひと休み。</h2><p>光も時間も停止中。準備ができたら再開。</p><div class="pause-actions">${primary('resume-button', 'RESUME · 再開')}${titleButton}</div></article>`;
  } else if (next === 'result' && lastResult) {
    const result = lastResult; $('phase-label').textContent = 'CORRECT SEQUENCE'; $('phase-hint').textContent = '正しい順番を、もう一度'; app.dataset.phase = 'ended';
    const cells = result.sequence.map((cell, index) => `<span class="sequence-pill"><small>${index + 1}</small><b>${cell + 1}</b></span>`).join('');
    overlay.innerHTML = `<article class="result-card"><div class="result-heading"><span class="result-game-title">あなたの短期記憶、無事ですか？<small>ECHO GRID</small></span><h2>あと、もう1 LEVEL。</h2></div><div class="result-score"><span>LEVEL</span><b id="result-score">${result.level}</b>${newBest ? '<mark class="new-best">NEW BEST</mark>' : ''}</div><dl class="result-details"><div><dt>BEST</dt><dd id="result-best">${best}</dd></div><div><dt>CORRECT</dt><dd>${result.correctInputs}</dd></div><div><dt>TIME</dt><dd>${result.time.toFixed(1)} s</dd></div><div><dt>CREDIT</dt><dd>${credits.credits} / 3</dd></div></dl><p class="result-reason">押したのは <b>${result.actualCell + 1}</b> · 次の正解は <b>${result.expectedCell + 1}</b></p><div class="correct-sequence" aria-label="正しい順番"><span class="sequence-label">正しい順番</span><div class="sequence-pills">${cells}</div></div><p id="memory-comment" class="result-flavor">${memoryComment(result.level)}<small>ゲーム内のネタです</small></p><div class="result-actions">${credits.canPlay ? primary('retry-button', 'RETRY · もう1回') : primary('reward-button', '+3 CREDIT')}${titleButton}</div><small class="result-note">${credits.canPlay ? '次は、もう1 LEVEL。' : 'NO CREDIT · 開発版 Rewarded Ad Stub'}</small></article>`;
    if (delay) {
      overlay.querySelectorAll<HTMLButtonElement>('button').forEach(button => { button.disabled = true; });
      resultTimer = window.setTimeout(() => { resultTimer = undefined; if (!disposed && state === 'result') { overlay.querySelectorAll<HTMLButtonElement>('button').forEach(button => { button.disabled = false; }); overlay.querySelector<HTMLButtonElement>('.primary')?.focus({ preventScroll: true }); } }, 300);
    }
  } else if (next === 'reward') {
    overlay.innerHTML = `<article class="start-card reward-card"><span class="eyebrow">ONE MORE ECHO</span><h2>もうひと記憶？</h2><p>開発版の補充ボタンで<br /><b>+3 CREDIT</b></p><div class="reward-actions">${primary('reward-button', '+3 CREDIT')}${titleButton}</div>${stub}<p id="reward-status" role="status"></p></article>`;
  }
  trackRewardOffer();
}
function sound(event: EchoEvent): void {
  if (event.type === 'cue' || event.type === 'correct') { const pitch = [330, 370, 415, 440, 494, 554, 587, 659, 740][event.cell]; audio.tone(pitch, pitch, event.type === 'cue' ? 0.18 : 0.11, 'sine', 0, 0.035); if (event.type === 'correct') audio.tone(pitch * 2, pitch * 2, 0.07, 'triangle', 0, 0.01); }
  if (event.type === 'level_clear') { audio.tone(554, 740, 0.16, 'sine'); audio.tone(830, 830, 0.15, 'triangle', 0.09, 0.025); }
  if (event.type === 'mistake') { audio.tone(220, 165, 0.16, 'sine', 0, 0.04); audio.tone(165, 145, 0.16, 'triangle', 0.08, 0.025); }
}
const controller = createEchoGame($('game-canvas'), {
  onUpdate(snapshot) { if (state === 'playing' || state === 'paused') update(snapshot); },
  onEvent: sound,
  onEnd(result) {
    if (state !== 'playing' || ended || disposed) return;
    ended = true; lastResult = result; newBest = result.level > best; best = Math.max(best, result.level); storage.writeNumber('best', best); credits.consume(runId);
    telemetry.trackEvent('run_end', { runId, outcome: 'over', score: result.level, time: result.time });
    telemetry.trackEvent('score', { runId, score: result.level, best, newBest });
    telemetry.trackEvent('run_duration', { runId, seconds: result.time, reason: 'over' });
    telemetry.trackEvent('memory_level', { runId, level: result.level, correctInputs: result.correctInputs });
    telemetry.trackEvent('sequence_length', { runId, length: result.sequence.length });
    resultAvailableAt = performance.now() + 300; setScreen('result', true);
  },
});
function start(retry = false): void {
  if (onboarding.intercept(() => start(retry))) return;
  if (disposed || credits.rewardPending || state === 'playing' || state === 'paused' || (state === 'result' && performance.now() < resultAvailableAt)) return;
  if (!credits.canPlay) { setScreen('reward'); return; }
  void audio.unlock(); runId = `game004-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; ended = false; lastResult = null; newBest = false;
  if (retry) telemetry.trackEvent('retry', { runId }); telemetry.trackEvent('run_start', { runId, credits: credits.credits }); setScreen('playing'); controller.start();
}
function pause(): void {
  if (state === 'playing') { controller.pause(true); telemetry.trackEvent('pause', { runId }); setScreen('paused'); }
  else if (state === 'paused') { void audio.unlock(); controller.pause(false); telemetry.trackEvent('resume', { runId }); setScreen('playing'); update(controller.snapshot()); }
}
function recordQuit(): void {
  if ((state !== 'playing' && state !== 'paused') || ended) return; ended = true; const snapshot = controller.snapshot();
  telemetry.trackEvent('quit', { runId, score: snapshot.level, time: snapshot.time }); telemetry.trackEvent('run_end', { runId, outcome: 'quit', score: snapshot.level, time: snapshot.time }); telemetry.trackEvent('run_duration', { runId, seconds: snapshot.time, reason: 'quit' });
}
function title(): void { if (credits.rewardPending || (state === 'result' && performance.now() < resultAvailableAt)) return; recordQuit(); controller.title(); lastResult = null; newBest = false; setScreen('title'); }
async function reward(): Promise<void> {
  if (disposed || credits.rewardPending || credits.canPlay || (state === 'result' && performance.now() < resultAvailableAt)) return;
  controller.title(); if (state !== 'reward') setScreen('reward');
  const button = $<HTMLButtonElement>('reward-button'); button.disabled = true; button.textContent = 'CREDIT を補充中…'; $<HTMLButtonElement>('title-button').disabled = true; $<HTMLButtonElement>('brand-button').disabled = true;
  const success = await credits.requestRewardedCredit(requestRewardedCredit); if (disposed) return; $<HTMLButtonElement>('brand-button').disabled = false;
  if (success) { controller.title(); setScreen('title'); $('play-button')?.focus({ preventScroll: true }); }
  else { setScreen('reward'); $('reward-status').textContent = '補充できませんでした。もう一度お試しください。'; }
}
app.addEventListener('click', event => {
  if (state === 'result' && performance.now() < resultAvailableAt) return; if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button'); if (!button || button.disabled) return;
  switch (button.id) {
    case 'play-button': start(); break; case 'retry-button': start(true); break; case 'title-button': case 'brand-button': title(); break; case 'reward-button': void reward(); break;
    case 'mute-button': audio.toggle(); sync(); break; case 'pause-button': case 'resume-button': pause(); break;
  }
}, { signal: listeners.signal });
document.addEventListener('keydown', event => {
  const key = event.key.toLowerCase(); const action = key === 'enter' || key === ' ';
  if (event.repeat || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) { if (action) event.preventDefault(); return; }
  if (key === 'escape' && (state === 'playing' || state === 'paused')) { event.preventDefault(); pause(); }
  if (action && !(event.target as HTMLElement).closest('button,a')) event.preventDefault();
}, { signal: listeners.signal });
document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'playing') pause(); }, { signal: listeners.signal });
window.addEventListener('blur', () => { if (state === 'playing') pause(); }, { signal: listeners.signal });
window.addEventListener('pagehide', event => { if (!event.persisted) recordQuit(); if (state === 'playing') pause(); }, { signal: listeners.signal });
telemetry.trackEvent('game_open'); setScreen('title');
if (import.meta.env.DEV) (window as unknown as { __arcadeDebug: unknown }).__arcadeDebug = Object.freeze({ gameId: 'game004', snapshot: () => controller.snapshot(), inspection: () => controller.inspection(), state: () => state, telemetry: () => telemetry.getEvents() });
if (import.meta.hot) import.meta.hot.dispose(() => { onboarding.destroy(); disposed = true; if (resultTimer !== undefined) window.clearTimeout(resultTimer); listeners.abort(); controller.destroy(); audio.destroy(); delete (window as unknown as { __arcadeDebug?: unknown }).__arcadeDebug; });
