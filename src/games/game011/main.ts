import { createGameRecordSession } from '../../records/RecordSharing';
import './style.css';
import { StorageService } from '../../core/StorageService';
import { TelemetryService } from '../../core/TelemetryService';
import { AudioService } from '../../core/AudioService';
import { createOnboarding } from '../../arcade/onboarding';
import { createUnkoGame } from './UnkoBoard';
import { answerLabel, SCORE_VERSION } from './UnkoRun';
import { resultComment } from './resultFlavor';
import type { UnkoEvent, UnkoResult, UnkoSnapshot } from './contracts';
const recordSession = createGameRecordSession('game011');

type Screen = 'title' | 'playing' | 'paused' | 'ending' | 'result';
const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;
const app = $('app'); const overlay = $('overlay'); const abort = new AbortController();
const storage = new StorageService(undefined, 'web-mini-arcade:v1:game011:');
const telemetry = new TelemetryService(storage, 'game011'); const audio = new AudioService(storage);
const onboarding = createOnboarding({ gameId: 'game011', storage, telemetry });
let state: Screen = 'title'; let runId = ''; let ended = true; let disposed = false; let result: UnkoResult | null = null;
const legacyBest = storage.readNumber('best', 0);
let best = storage.readNumber('best:v2', 0); let bestFinal = storage.readNumber('bestFinalStreak', 0); let newBest = false; let newFinal = false;
let resultTimer: ReturnType<typeof window.setTimeout> | undefined;
const text = (id: string, value: string): void => { const e = $(id); if (e && e.textContent !== value) e.textContent = value; };
const primary = (id: string, label: string) => `<button id="${id}" type="button" class="primary">${label} <span aria-hidden="true">→</span></button>`;
const titleButton = '<button id="title-button" type="button" class="secondary">タイトル</button>';
const sound = (event: UnkoEvent): void => {
  if (event.type === 'correct') audio.tone(event.kind === 'final' ? 720 : 570, 900, 0.055, 'triangle', 0, 0.025);
  if (event.type === 'wrong' || event.type === 'timeout') audio.tone(280, 140, 0.16, 'sine', 0, 0.04);
  if (event.type === 'ready') audio.tone(420, 600, 0.045, 'sine', 0, 0.022);
};
function sync(): void {
  app.dataset.state = state; text('best-value', String(best)); text('best-final-value', String(bestFinal));
  app.dataset.scoreDigits = String(Math.min(9, Math.max(String(best).length, String(controller?.snapshot().score ?? 0).length)));
  text('mute-button', audio.muted ? '音 OFF' : '音 ON'); $('mute-button').setAttribute('aria-pressed', String(audio.muted));
  $('mute-button').setAttribute('aria-label', audio.muted ? '音声をオンにする' : '音声をミュート');
  const pause = $<HTMLButtonElement>('pause-button'); pause.disabled = state !== 'playing' && state !== 'paused'; pause.textContent = state === 'paused' ? '▶' : 'Ⅱ'; pause.setAttribute('aria-label', state === 'paused' ? '再開' : '一時停止');
  $<HTMLButtonElement>('brand-button').disabled = state === 'ending';
}
function update(snapshot: UnkoSnapshot): void { text('score-value', String(snapshot.score)); app.dataset.phase = snapshot.phase; app.dataset.scoreDigits = String(Math.min(9, Math.max(String(best).length, String(snapshot.score).length))); }
function screen(next: Screen): void {
  state = next; sync(); overlay.hidden = next === 'playing' || next === 'ending';
  if (overlay.hidden && document.activeElement instanceof HTMLElement && overlay.contains(document.activeElement)) document.activeElement.blur();
  if (next === 'title') {
    text('score-value', '0'); app.dataset.phase = 'title';
    overlay.innerHTML = `<article class="title-ticket"><div><span class="eyebrow">たった二択。なのに。</span><h1>ウンコかウコンか。</h1><p>出てきたものを、左右で答えるだけ。<br />間違い・時間切れで終了です。</p></div><div class="ticket-actions">${primary('play-button', storage.readBoolean('tutorialCompleted', false) ? 'すぐ遊ぶ' : '遊んでみる')}<small>← → / A D / クリック / タップ<br />無料・回数制限なし${legacyBest ? `<br />旧BEST ${legacyBest}（旧配点）` : ''}</small></div></article>`;
  } else if (next === 'paused') {
    overlay.innerHTML = `<article class="pause-ticket"><div><span class="eyebrow">PAUSE</span><h2>ひと息。</h2><p>問題と時計を止めています。</p></div><div class="paired-actions">${primary('resume-button', '続きから')}${titleButton}</div></article>`;
  } else if (next === 'result' && result) {
    overlay.innerHTML = `<article class="result-ticket"><div class="result-intro"><span class="eyebrow">${result.outcome === 'timeout' ? 'TIME UP' : 'OOPS!'}</span><h2>${result.reason}</h2><p>${result.actual ? `あなたの回答：${answerLabel(result.actual)} · ` : ''}正解は <strong>${answerLabel(result.expected)}</strong></p></div><div class="result-score"><span>SCORE</span><strong id="result-score">${result.score}</strong>${newBest ? '<mark>NEW BEST</mark>' : ''}</div><dl class="result-details"><div><dt>画像問題</dt><dd>${result.imageCorrect} / 10</dd></div><div><dt>テキスト問題</dt><dd>${result.textCorrect} / 10</dd></div><div><dt>FINAL MODE</dt><dd>${result.finalMode ? answerLabel(result.finalMode) : '—'}</dd></div><div><dt>FINAL STREAK</dt><dd>${result.finalStreak}${newFinal ? ' ↑' : ''}</dd></div><div><dt>BEST SCORE</dt><dd>${best}</dd></div><div><dt>BEST FINAL</dt><dd>${bestFinal}</dd></div></dl><p class="result-comment">${resultComment(result)}</p><div class="paired-actions">${primary('retry-button', 'もう一回')}${titleButton}</div></article>`;
    overlay.querySelector<HTMLButtonElement>('.primary')?.focus({ preventScroll: true });
  }
  if (next === 'result') recordSession.mount(overlay.firstElementChild as HTMLElement);
}
const controller = createUnkoGame($('game-canvas'), {
  onUpdate(snapshot) { if (state !== 'title') update(snapshot); }, onEvent: sound,
  onEnd(value) {
    if (ended || disposed || state !== 'playing') return;
    ended = true; result = value; newBest = value.score > best; newFinal = value.finalStreak > bestFinal;
    best = Math.max(best, value.score); bestFinal = Math.max(bestFinal, value.finalStreak); storage.writeNumber('best:v2', best); storage.writeNumber('bestFinalStreak', bestFinal); recordSession.complete(value.score, { metadata: { duration_seconds: value.time, outcome: value.outcome } });
    telemetry.trackEvent('run_end', { runId, score_version: SCORE_VERSION, outcome: 'over', score: value.score, time: value.time, image_correct: value.imageCorrect, text_correct: value.textCorrect, final_mode: value.finalMode ?? 'none', final_streak: value.finalStreak, reason: value.outcome });
    telemetry.trackEvent('score', { runId, score_version: SCORE_VERSION, score: value.score, best, newBest, final_streak: value.finalStreak, best_final: bestFinal }); telemetry.trackEvent('run_duration', { runId, seconds: value.time, reason: 'over' });
    screen('ending'); resultTimer = window.setTimeout(() => { resultTimer = undefined; if (!disposed && state === 'ending') screen('result'); }, 200);
  },
});
function start(retry = false): void {
  if (disposed || state === 'playing' || state === 'paused' || state === 'ending') return;
  if (onboarding.intercept(() => start(retry))) return;
  void audio.unlock(); runId = `game011-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; ended = false; result = null; newBest = newFinal = false;
  if (retry) telemetry.trackEvent('retry', { runId }); recordSession.startRun(); telemetry.trackEvent('run_start', { runId, score_version: SCORE_VERSION }); screen('playing'); controller.start();
}
function pause(): void {
  if (state === 'playing') { controller.pause(true); if (ended) return; telemetry.trackEvent('pause', { runId }); screen('paused'); }
  else if (state === 'paused') { void audio.unlock(); controller.pause(false); telemetry.trackEvent('resume', { runId }); screen('playing'); }
}
function recordQuit(): void {
  if (ended || state !== 'playing' && state !== 'paused') return;
  // Settle the real deadline before allowing navigation to classify an already-expired answer as quit.
  if (state === 'playing') controller.pause(true); if (ended) return;
  ended = true; const s = controller.snapshot(); telemetry.trackEvent('quit', { runId, score: s.score, time: s.time }); telemetry.trackEvent('run_end', { runId, score_version: SCORE_VERSION, outcome: 'quit', score: s.score, time: s.time }); telemetry.trackEvent('run_duration', { runId, seconds: s.time, reason: 'quit' });
}
function title(): void { if (state === 'ending') return; recordQuit(); if (resultTimer !== undefined) return; controller.title(); result = null; screen('title'); }
app.addEventListener('click', event => {
  if (event.altKey || event.ctrlKey || event.shiftKey || event.metaKey) return;
  const target = (event.target as Element).closest<HTMLButtonElement | HTMLAnchorElement>('button,a'); if (!target || target instanceof HTMLButtonElement && target.disabled) return;
  switch (target.id) {
    case 'play-button': start(); break; case 'retry-button': start(true); break;
    case 'brand-button': case 'title-button': title(); break;
    case 'pause-button': case 'resume-button': pause(); break;
    case 'mute-button': audio.toggle(); sync(); break;
    case 'portal-link': recordQuit(); telemetry.trackEvent('return_to_portal', { runId }); break;
  }
}, { signal: abort.signal });
document.addEventListener('keydown', event => {
  if (event.altKey || event.ctrlKey || event.shiftKey || event.metaKey || document.querySelector('dialog[open]')) return;
  if (event.key === 'Escape' && (state === 'playing' || state === 'paused')) { event.preventDefault(); pause(); }
}, { signal: abort.signal });
window.addEventListener('blur', () => { if (state === 'playing') pause(); }, { signal: abort.signal });
document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'playing') pause(); }, { signal: abort.signal });
window.addEventListener('pagehide', event => { if (!event.persisted) recordQuit(); else if (state === 'playing') pause(); }, { signal: abort.signal });
$<HTMLAnchorElement>('portal-link').href = import.meta.env.BASE_URL;
telemetry.trackEvent('game_open'); screen('title');
if (import.meta.env.DEV) (window as unknown as { __arcadeDebug: unknown }).__arcadeDebug = Object.freeze({ gameId: 'game011', snapshot: () => controller.snapshot(), inspection: () => controller.inspection(), state: () => state, telemetry: () => telemetry.getEvents() });
if (import.meta.hot) import.meta.hot.dispose(() => { disposed = true; if (resultTimer !== undefined) window.clearTimeout(resultTimer); abort.abort(); controller.destroy(); onboarding.destroy(); audio.destroy(); delete (window as unknown as { __arcadeDebug?: unknown }).__arcadeDebug; });
