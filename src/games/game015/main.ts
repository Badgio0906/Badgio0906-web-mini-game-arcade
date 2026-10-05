import './style.css';
import { drawKing } from './art';
import { StorageService } from '../../core/StorageService';
import { TelemetryService } from '../../core/TelemetryService';
import { createOnboarding } from '../../arcade/onboarding';
import { createFallGame, paintFallPractice } from './FallBoard';
import { FallAudio } from './audio';
import type { FallEvent, FallResult, FallSnapshot } from './types';

type Screen = 'title' | 'playing' | 'paused' | 'ending' | 'result';
const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;
const app = $('app'), overlay = $('overlay'), abort = new AbortController();
const storage = new StorageService(undefined, 'web-mini-arcade:v1:game015:');
const telemetry = new TelemetryService(storage, 'game015'), audio = new FallAudio(storage);
const onboarding = createOnboarding({ gameId: 'game015', storage, telemetry, practicePaint: paintFallPractice });
let screenEpoch = 0;
let state: Screen = 'title', best = storage.readNumber('best', 0), runId = '', ended = true, disposed = false, newBest = false;
let milestoneUntil = 0, milestoneMessage = '', hazardNoticeUntil = 0, hazardMessage = '';
let result: FallResult | null = null, timer: ReturnType<typeof window.setTimeout> | undefined;
const text = (id: string, value: string): void => { const e = $(id); if (e && e.textContent !== value) e.textContent = value; };
const button = (id: string, label: string, primary = false): string => `<button id="${id}" type="button" class="${primary ? 'primary' : 'secondary'}">${label}</button>`;

// Keep gesture origin through pointerup: touch clicks can be retargeted after the menu appears.
interface GestureOrigin { epoch: number; releasedAt: number | null }
const gestures = new Map<number, GestureOrigin>();
let lastReleased: { id: number; origin: GestureOrigin } | undefined;
let gestureCleanup: ReturnType<typeof window.setTimeout> | undefined;
const pruneGestures = (): void => {
  const now = performance.now();
  for (const [id, origin] of gestures) if (origin.releasedAt !== null && now - origin.releasedAt > 5000) gestures.delete(id);
  if (lastReleased && lastReleased.origin.releasedAt !== null && now - lastReleased.origin.releasedAt > 5000) lastReleased = undefined;
};
function scheduleGestureCleanup(): void {
  if (gestureCleanup !== undefined) return;
  gestureCleanup = window.setTimeout(() => { gestureCleanup = undefined; pruneGestures(); if ([...gestures.values()].some(origin => origin.releasedAt !== null)) scheduleGestureCleanup(); }, 5100);
}
document.addEventListener('pointerdown', e => {
  if (!(e.target instanceof Node) || !app.contains(e.target)) return;
  pruneGestures();
  // Native touch has few simultaneous contacts; keep a bounded record without discarding its origin on release.
  if (!gestures.has(e.pointerId) && gestures.size >= 32) {
    const released = [...gestures].find(([, origin]) => origin.releasedAt !== null);
    gestures.delete(released?.[0] ?? gestures.keys().next().value!);
  }
  gestures.set(e.pointerId, { epoch: screenEpoch, releasedAt: null });
}, { capture: true, signal: abort.signal });
const releaseGesture = (e: PointerEvent): void => {
  const origin = gestures.get(e.pointerId); if (!origin) return;
  origin.releasedAt = performance.now(); lastReleased = { id: e.pointerId, origin }; scheduleGestureCleanup();
};
document.addEventListener('pointerup', releaseGesture, { capture: true, signal: abort.signal });
document.addEventListener('pointercancel', releaseGesture, { capture: true, signal: abort.signal });
app.addEventListener('click', e => {
  pruneGestures();
  const pointer = e as MouseEvent & { pointerId?: number; pointerType?: string };
  const id = typeof pointer.pointerId === 'number' && pointer.pointerId >= 0 ? pointer.pointerId : undefined;
  // Keyboard/assistive clicks have detail0 and no pointer origin. Compatibility MouseEvent uses the latest release.
  const keyedOrigin = id !== undefined ? gestures.get(id) : undefined;
  const origin = keyedOrigin ?? (e.detail > 0 ? lastReleased?.origin : undefined);
  const originId = keyedOrigin ? id : e.detail > 0 ? lastReleased?.id : undefined;
  if (originId !== undefined) gestures.delete(originId);
  if (origin && lastReleased?.origin === origin) lastReleased = undefined;
  if (origin && origin.epoch !== screenEpoch) { e.preventDefault(); e.stopImmediatePropagation(); }
}, { capture: true, signal: abort.signal });
function comment(depth: number): string {
  return depth >= 5000 ? '落下に人生を捧げています。' : depth >= 2000 ? '何を目指しているのでしょうか。' : depth >= 1000 ? 'まだ底はありません。' : depth >= 700 ? 'そろそろ電波が入りません。' : depth >= 300 ? '戻る気はありますか？' : depth >= 100 ? 'だいぶ下がってきました。' : 'まだ地上が見えています。';
}
function sync(): void {
  app.dataset.state = state; text('best-value', String(best)); text('mute-button', audio.muted ? '音 OFF' : '音 ON');
  $('mute-button').setAttribute('aria-pressed', String(audio.muted)); $('mute-button').setAttribute('aria-label', audio.muted ? '音声をオンにする' : '音声をミュート');
  const pause = $<HTMLButtonElement>('pause-button'); pause.disabled = state !== 'playing' && state !== 'paused'; pause.textContent = state === 'paused' ? '▶' : 'Ⅱ'; pause.setAttribute('aria-label', state === 'paused' ? '再開' : '一時停止');
  $<HTMLButtonElement>('brand-button').disabled = state === 'ending';
}
function screen(next: Screen): void {
  screenEpoch++; state = next; sync(); overlay.hidden = next === 'playing' || next === 'ending';
  if (overlay.hidden && document.activeElement instanceof HTMLElement && overlay.contains(document.activeElement)) document.activeElement.blur();
  if (next === 'title') overlay.innerHTML = `<article class="menu title-menu"><span class="eyebrow">A VERY DOWNWARD ADVENTURE</span><canvas id="title-king" width="48" height="72" aria-label="王冠と白ひげ、紫の衣装に赤マントのキング"></canvas><h1>落下キング<small>～FALL KING～</small></h1><p class="tagline">上を目指すな。うまく落ちろ。</p><p>迫る天井から逃げ、次の足場へDROP。<br />左右で空中移動。中央のトゲにも注意！</p><div class="title-actions">${button('play-button', storage.readBoolean('tutorialCompleted', false) ? 'すぐ遊ぶ' : '遊んでみる', true)}</div><small>BEST ${best} m · 無料・回数制限なし</small></article>`;
  if (next === 'title') { const c = overlay.querySelector<HTMLCanvasElement>('#title-king')!.getContext('2d')!; c.scale(2, 2); drawKing(c, 0, 0, { state: 'falling' }); }
  if (next === 'paused') overlay.innerHTML = `<article class="menu pause-menu"><span class="eyebrow">PAUSE</span><h2>ひと息つこう。</h2><p>落下・足場・時計を止めています。<br />再開後は、もう一度押して移動。</p><div class="paired-actions">${button('resume-button', '続きから', true)}${button('title-button', 'タイトル')}</div></article>`;
  if (next === 'result' && result) {
    overlay.innerHTML = `<article class="menu result-menu"><span class="eyebrow">${result.outcome === 'scroll' ? 'TOO SLOW!' : result.outcome === 'impact' ? 'SPLAT!' : result.outcome === 'spike' ? 'SPIKES!' : result.outcome === 'needle' ? 'WALL NEEDLE!' : 'BIRD!'}</span><h2>${result.outcome === 'scroll' ? '天井に追いつかれました。' : result.outcome === 'impact' ? '落ちすぎました。' : result.outcome === 'spike' ? '針に当たりました。' : result.outcome === 'needle' ? '壁の針に当たりました。' : '鳥に当たりました。'}</h2><p class="death-reason">${result.reason}</p><div class="result-depth"><span>DEPTH</span><strong id="result-score">${result.score}<small>m</small></strong>${newBest ? '<mark>NEW BEST</mark>' : ''}</div><dl class="result-details"><div><dt>BEST</dt><dd>${best} m</dd></div><div><dt>NICE DROP</dt><dd>${result.niceDrops}</dd></div><div><dt>落下距離</dt><dd>${result.fallDistance.toFixed(1)} m</dd></div><div><dt>TIME</dt><dd>${result.time.toFixed(1)} 秒</dd></div></dl><p class="result-comment">${comment(result.depth)}</p><div class="paired-actions">${button('retry-button', 'もう一回', true)}${button('title-button', 'タイトル')}</div></article>`;
    overlay.querySelector<HTMLButtonElement>('#retry-button')?.focus({ preventScroll: true });
  }
}
function update(s: FallSnapshot): void {
  if (state !== 'title') { text('score-value', String(s.score)); text('nice-value', String(s.niceDrops)); }
  app.dataset.phase = s.phase;
  if (state === 'playing') { audio.tick(s.time, s.depth, s.phase === 'falling'); text('live-status', s.time < milestoneUntil ? milestoneMessage : s.time < hazardNoticeUntil ? hazardMessage : s.topRemaining < 48 ? '天井が迫る！ 今すぐ下へ DROP ↓' : s.phase === 'grounded' ? '次の足場はどこ？ 天井が来る前に DROP ↓' : s.phase === 'stunned' ? '強い着地！ 少しだけひざを休めます' : `空中移動 · FALL ${s.fallDistance.toFixed(1)} m${s.danger !== 'safe' ? ' · DANGER' : ''}`); }
}
function event(e: FallEvent): void {
  if (e.type === 'hazard_warning') { hazardMessage = e.kind === 'bird' ? '鳥の動きを待って、タイミングよく DROP。' : '壁の針の予兆！ 壁から離れよう。'; hazardNoticeUntil = controller.snapshot().time + e.seconds; audio.tone(720, 520, .07, .02); }
  if (e.type === 'hazard_active' && e.kind === 'wall_needle') audio.tone(150, 85, .08, .018, 'sawtooth');
  if (e.type === 'drop') audio.tone(520, 160, .085);
  if (e.type === 'landing') {
    const l = e.landing; telemetry.trackEvent('fall_distance', { runId, meters: l.fallDistance }); telemetry.trackEvent('landing_type', { runId, kind: l.kind }); telemetry.trackEvent('platform_type', { runId, type: l.platformType });
    if (l.kind !== 'fatal') audio.tone(l.kind === 'hard' ? 115 : 280, l.kind === 'hard' ? 70 : 420, .09);
  }
  if (e.type === 'nice_drop') { telemetry.trackEvent('nice_drop', { runId, count: e.count, fall_distance: e.landing.fallDistance }); audio.tone(660, 990, .13, .035); }
  if (e.type === 'crumble') audio.tone(120, 65, .08, .02, 'sawtooth');
  if (e.type === 'milestone') { telemetry.trackEvent('milestone_reached', { runId, depth: e.depth }); milestoneMessage = e.message; milestoneUntil = controller.snapshot().time + 2; text('live-status', e.message); audio.tone(523, 1046, .2); }
}
const controller = createFallGame($('game-canvas'), { onUpdate: update, onEvent: event, onEnd(value) {
  if (ended || disposed) return; ended = true; result = value; newBest = value.score > best; best = Math.max(best, value.score); storage.writeNumber('best', best);
  audio.setPlaying(false); audio.tone(240, 42, .26, .04);
  telemetry.trackEvent('run_end', { runId, outcome: 'over', score: value.score, time: value.time, reason: value.outcome });
  telemetry.trackEvent('score', { runId, score: value.score, best, newBest, nice_drops: value.niceDrops }); telemetry.trackEvent('run_duration', { runId, seconds: value.time, reason: 'over', failure_reason: value.outcome }); telemetry.trackEvent('depth_reached', { runId, depth: value.depth });
  screen('ending'); timer = window.setTimeout(() => { timer = undefined; if (!disposed && state === 'ending') screen('result'); }, 400);
} }, () => best);
function start(retry = false): void {
  if (disposed || state === 'playing' || state === 'paused' || state === 'ending') return;
  if (onboarding.intercept(() => start(retry))) return;
  void audio.unlock(); runId = `game015-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; ended = false; result = null; newBest = false; milestoneUntil = hazardNoticeUntil = 0; milestoneMessage = hazardMessage = '';
  if (retry) telemetry.trackEvent('retry', { runId }); telemetry.trackEvent('run_start', { runId }); screen('playing'); controller.start(); audio.setPlaying(true);
}
function pause(): void {
  if (state === 'playing') { controller.pause(true); audio.setPlaying(false); telemetry.trackEvent('pause', { runId }); screen('paused'); }
  else if (state === 'paused') { void audio.unlock(); controller.pause(false); audio.setPlaying(true); telemetry.trackEvent('resume', { runId }); screen('playing'); }
}
function quit(): void {
  if (ended || state !== 'playing' && state !== 'paused') return; ended = true; controller.pause(true); audio.setPlaying(false); const s = controller.snapshot();
  telemetry.trackEvent('quit', { runId, score: s.score, time: s.time }); telemetry.trackEvent('run_end', { runId, outcome: 'quit', score: s.score, time: s.time }); telemetry.trackEvent('run_duration', { runId, seconds: s.time, reason: 'quit' });
}
function title(): void { if (state === 'ending') return; quit(); controller.title(); result = null; text('score-value', '0'); text('nice-value', '0'); screen('title'); }
app.addEventListener('click', e => {
  if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return; const target = (e.target as Element).closest<HTMLButtonElement | HTMLAnchorElement>('button,a'); if (!target || target instanceof HTMLButtonElement && target.disabled) return;
  if (target.classList.contains('arcade-portal-back')) { quit(); audio.setPlaying(false); return; }
  switch (target.id) { case 'play-button': start(); break; case 'retry-button': start(true); break; case 'resume-button': case 'pause-button': pause(); break; case 'title-button': case 'brand-button': title(); break; case 'mute-button': audio.toggle(); sync(); break; }
}, { signal: abort.signal });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !e.repeat && !e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey && !document.querySelector('dialog[open]') && (state === 'playing' || state === 'paused')) { e.preventDefault(); pause(); } }, { signal: abort.signal });
window.addEventListener('blur', () => { if (state === 'playing') pause(); }, { signal: abort.signal });
document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'playing') pause(); }, { signal: abort.signal });
window.addEventListener('pagehide', e => { if (e.persisted) { if (state === 'playing') pause(); } else { quit(); audio.setPlaying(false); } }, { signal: abort.signal });
telemetry.trackEvent('game_open'); screen('title');
if (import.meta.env.DEV) (window as unknown as { __arcadeDebug: unknown }).__arcadeDebug = Object.freeze({ gameId: 'game015', snapshot: () => controller.snapshot(), inspection: () => controller.inspection(), state: () => state, telemetry: () => telemetry.getEvents() });
if (import.meta.hot) import.meta.hot.dispose(() => { disposed = true; if (timer !== undefined) clearTimeout(timer); abort.abort(); if (gestureCleanup !== undefined) clearTimeout(gestureCleanup); gestures.clear(); lastReleased = undefined; controller.destroy(); onboarding.destroy(); audio.destroy(); delete (window as unknown as { __arcadeDebug?: unknown }).__arcadeDebug; });
