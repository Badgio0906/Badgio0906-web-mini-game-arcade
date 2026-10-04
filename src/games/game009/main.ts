import { createOnboarding } from '../../arcade/onboarding';
import './style.css';
import { StorageService } from '../../core/StorageService';
import { CreditService } from '../../core/CreditService';
import { TelemetryService } from '../../core/TelemetryService';
import { AudioService } from '../../core/AudioService';
import { requestRewardedCredit } from '../../core/RewardService';
import { createStampGame } from './StampBoard';
import { stampTitle } from './resultFlavor';
import type { StampChoice, StampEvent, StampSnapshot, StampResult } from './contracts';

type Screen = 'title' | 'playing' | 'paused' | 'milestone' | 'ending' | 'result' | 'reward';
const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;
const app = $('app'); const overlay = $('overlay');
const storage = new StorageService(undefined, 'web-mini-arcade:v1:game009:');
const telemetry = new TelemetryService(storage, 'game009');
const onboarding = createOnboarding({ gameId: 'game009', storage, telemetry }); const credits = new CreditService(storage, telemetry); const audio = new AudioService(storage);
const listeners = new AbortController();
let state: Screen = 'title'; let runId = ''; let ended = true; let disposed = false;
let best = storage.readNumber('best', 0); let newBest = false; let lastResult: StampResult | null = null;
let resultAvailableAt = 0; let resultTimer: ReturnType<typeof window.setTimeout> | undefined;
let offerVisible = false; let milestoneShown = new Set<number>(); let choiceLocked = false; let choiceEpoch = 0;
let pointerApproval: { id: number; button: string; epoch: number } | null = null;
let keyApproval: { button: string; epoch: number } | null = null; let keyboardStarted = false;
const choiceButtons = new Set(['clean-button', 'continue-button']);
const primary = (id: string, text: string) => `<button id="${id}" type="button" class="primary">${text}<span aria-hidden="true">→</span></button>`;
const titleButton = '<button id="title-button" type="button" class="secondary" aria-label="タイトルに戻る">タイトル</button>';
const stub = '<small class="stub-note">開発版 Rewarded Ad Stub<br />本番広告は表示されません。</small>';
const writeText = (id: string, value: string): void => { const element = $(id); if (element && element.textContent !== value) element.textContent = value; };
function clearApprovals(): void { pointerApproval = null; keyApproval = null; }
function trackOffer(): void {
  if (!credits.canPlay && !offerVisible && !overlay.hidden && $('reward-button')) { offerVisible = true; telemetry.trackEvent('reward_offer_shown', { runId }); }
}
function sync(): void {
  app.dataset.state = state; writeText('credit-count', String(credits.credits)); writeText('credit-dots', Array.from({ length: 3 }, (_, i) => i < credits.credits ? '●' : '○').join(' ')); writeText('best-value', String(best));
  writeText('mute-button', audio.muted ? '音 OFF' : '音 ON'); $('mute-button').setAttribute('aria-label', audio.muted ? '音声をオンにする' : '音声をミュート'); $('mute-button').setAttribute('aria-pressed', String(audio.muted));
  const button = $<HTMLButtonElement>('pause-button'); button.disabled = state !== 'playing' && state !== 'paused'; button.textContent = state === 'paused' ? '▶' : 'Ⅱ'; button.setAttribute('aria-label', state === 'paused' ? '再開' : '一時停止');
  $<HTMLButtonElement>('brand-button').disabled = state === 'ending' || credits.rewardPending;
}
function update(snapshot: StampSnapshot): void {
  writeText('score-value', String(snapshot.score)); writeText('correct-value', String(snapshot.correct));
  app.dataset.phase = snapshot.phase; app.dataset.scoreDigits = String(Math.min(7, Math.max(String(snapshot.score).length, String(best).length)));
  writeText('mode-label', `得点倍率 ×${snapshot.multiplier}`);
  writeText('phase-label', state === 'paused' ? '机も時計も停止中。準備ができたら再開。' : state === 'milestone' ? '机も時計も停止中。片付ける？このまま？' : snapshot.phase === 'feedback' ? `見つけた！ +${snapshot.lastPoints} SCORE` : snapshot.phase === 'ended' ? '次は、もうひとつ見つけよう。' : '指示に合う印鑑をひとつ。似た道具に気をつけて。');
}
function setScreen(next: Screen): void {
  if (resultTimer !== undefined) { window.clearTimeout(resultTimer); resultTimer = undefined; }
  state = next; clearApprovals(); sync(); overlay.hidden = next === 'ending';
  if (credits.canPlay || next === 'playing') offerVisible = false;
  if (next === 'playing') {
    overlay.innerHTML = '<article class="paperwork play-note"><span class="eyebrow">SEARCH IN PROGRESS</span><p>色と形を見て、合う印鑑をひとつ。<br />同じ条件の印鑑なら、どれでも正解。</p><small>クリック / タップ / Tabで選んでEnter</small></article>'; update(controller.snapshot()); return;
  }
  if (next === 'title') {
    writeText('score-value', '0'); writeText('correct-value', '0'); writeText('mode-label', '得点倍率 ×1'); writeText('phase-label', '指示を見て、合う印鑑をひとつ。'); app.dataset.phase = 'searching'; app.dataset.scoreDigits = String(Math.min(7, String(best).length));
    overlay.innerHTML = `<article class="paperwork start-note"><div class="paper-title"><span class="eyebrow">未処理 / PLEASE FIND THE STAMP</span><h2>印鑑どこですか<small>STAMP HUNT</small></h2></div><div class="paper-explanation"><p>指示に合う色と形の印鑑を探して、クリック。<br />時間切れ・まちがいで終了。<br />合う印鑑が複数あれば、どれでも正解。</p><small>クリック / タップ / Tabで選んでEnter</small></div><div class="paper-actions"><div class="mini-best">BEST SCORE <b>${best}</b></div>${credits.canPlay ? primary('play-button', 'PLAY · 探し始める') : primary('reward-button', '+3 CREDIT')}${credits.canPlay ? '' : stub}</div></article>`;
  } else if (next === 'paused') {
    update(controller.snapshot()); overlay.innerHTML = `<article class="paperwork pause-note"><div class="paper-title"><span class="eyebrow">作業中断 / PAUSED</span><h2>ちょっと休憩。</h2></div><p>机も、残り時間も停止中。<br />準備ができたら続きから。</p><div class="paired-actions">${primary('resume-button', 'RESUME · 再開')}${titleButton}</div></article>`;
  } else if (next === 'result' && lastResult) {
    const result = lastResult;
    overlay.innerHTML = `<article class="paperwork result-note"><div class="result-heading"><span class="result-game-title">印鑑どこですか<small>STAMP HUNT</small></span><h2>${result.outcome === 'timeout' ? '時間切れ。' : 'それ、違う印鑑です。'}</h2><p class="result-reason">${result.reason}</p></div><div class="result-score"><b id="result-score">${result.score}</b><span>SCORE</span>${newBest ? '<mark class="new-best">NEW BEST</mark>' : ''}</div><dl class="result-details"><div><dt>BEST</dt><dd id="result-best">${best}</dd></div><div><dt>見つけた数</dt><dd>${result.correct}</dd></div><div><dt>TIME</dt><dd>${result.time.toFixed(1)} s</dd></div><div><dt>CREDIT</dt><dd>${credits.credits}/3</dd></div></dl><div class="desk-title"><small>今回の称号 · ×${result.multiplier}</small><b id="stamp-title">${stampTitle(result.correct, result.clutterLevel)}</b></div><div class="correct-request"><small>探していた印鑑</small><b>${result.request.text}</b></div><div class="result-actions"><div class="paired-actions">${credits.canPlay ? primary('retry-button', 'RETRY · もう1回') : primary('reward-button', '+3 CREDIT')}${titleButton}</div><small>${credits.canPlay ? '次は、もうひとつ見つけよう。' : 'NO CREDIT · 開発版 Rewarded Ad Stub'}</small></div></article>`;
  } else if (next === 'reward') {
    overlay.innerHTML = `<article class="paperwork reward-note"><div class="paper-title"><span class="eyebrow">再開準備 / ONE MORE SEARCH</span><h2>もうひと探し？</h2></div><div class="paper-explanation"><p>開発版の補充ボタンで <b>+3 CREDIT</b></p>${stub}<p id="reward-status" role="status"></p></div><div class="paired-actions">${primary('reward-button', '+3 CREDIT')}${titleButton}</div></article>`;
  }
  trackOffer();
}
function showMilestone(): void {
  const snapshot = controller.snapshot(); if (!snapshot.pending) return;
  choiceEpoch += 1; choiceLocked = false; keyboardStarted = false; setScreen('milestone');
  overlay.innerHTML = `<article class="paperwork choice-note"><div class="paper-title"><span class="eyebrow">${snapshot.correct}個発見 / DESK MAINTENANCE</span><h2>机を片付けますか？</h2></div><div class="choice-terms"><p>今までのスコアは、そのまま。</p><b>片付ける：</b>散らかりを6段階減らし、これからの倍率を×1へ。<br /><b>このままでいい：</b>散らかりを3段階増やし、これからの倍率を+0.25（最大×3）。<small>机も時計も停止中。選択は自由にもう一度遊べます。</small></div><div class="choice-actions">${primary('clean-button', '片付ける')}${primary('continue-button', 'このままでいい')}${titleButton}</div></article>`;
  if (!milestoneShown.has(snapshot.roundId)) { milestoneShown.add(snapshot.roundId); telemetry.trackEvent('milestone_reached', { runId, milestone: 'cleanup', roundId: snapshot.roundId, correct: snapshot.correct }); telemetry.trackEvent('escalation_offered', { runId, milestone: 'cleanup', roundId: snapshot.roundId }); }
  update(snapshot);
}
function chooseMode(choice: StampChoice): void {
  if (state !== 'milestone' || ended || choiceLocked || credits.rewardPending || !controller.snapshot().pending) return;
  const roundId = controller.snapshot().roundId; choiceLocked = true; clearApprovals();
  if (!controller.choose(choice)) { choiceLocked = false; return; }
  if (choice === 'continue') telemetry.trackEvent('escalation_accepted', { runId, milestone: 'cleanup', roundId, choice, multiplier: controller.snapshot().multiplier }); setScreen('playing');
}
function sound(event: StampEvent): void {
  if (event.type === 'correct') { audio.tone(680, 950, 0.09, 'triangle', 0, 0.027); audio.tone(950, 950, 0.06, 'sine', 0.03, 0.018); }
  if (event.type === 'mistake' || event.type === 'timeout') audio.tone(260, 125, 0.22, 'sine', 0, 0.04);
  if (event.type === 'choice') audio.tone(event.choice === 'clean' ? 480 : 380, 580, 0.09, 'triangle', 0, 0.02);
}
const controller = createStampGame($('game-canvas'), {
  onUpdate(snapshot) { if (snapshot.pending && state === 'playing') showMilestone(); if (state === 'playing' || state === 'paused' || state === 'milestone' || state === 'ending') update(snapshot); },
  onEvent: sound,
  onEnd(result) {
    if ((state !== 'playing' && state !== 'milestone') || ended || disposed) return;
    ended = true; lastResult = result; newBest = result.score > best; best = Math.max(best, result.score); storage.writeNumber('best', best); credits.consume(runId);
    telemetry.trackEvent('run_end', { runId, outcome: 'over', score: result.score, time: result.time, correct: result.correct, multiplier: result.multiplier, clutterLevel: result.clutterLevel });
    telemetry.trackEvent('score', { runId, score: result.score, best, newBest, correct: result.correct }); telemetry.trackEvent('run_duration', { runId, seconds: result.time, reason: 'over', failure_reason: result.outcome });
    resultAvailableAt = performance.now() + 300; setScreen('ending');
    resultTimer = window.setTimeout(() => { resultTimer = undefined; if (!disposed && state === 'ending') { resultAvailableAt = performance.now(); setScreen('result'); overlay.querySelector<HTMLButtonElement>('.primary')?.focus({ preventScroll: true }); } }, 300);
  },
});
function start(retry = false): void {
  if (onboarding.intercept(() => start(retry))) return;
  if (disposed || credits.rewardPending || state === 'playing' || state === 'paused' || state === 'milestone' || state === 'ending' || (state === 'result' && performance.now() < resultAvailableAt)) return;
  if (!credits.canPlay) { setScreen('reward'); return; }
  void audio.unlock(); runId = `game009-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; ended = false; lastResult = null; newBest = false; milestoneShown.clear(); choiceEpoch += 1; choiceLocked = false; clearApprovals();
  if (retry) telemetry.trackEvent('retry', { runId }); telemetry.trackEvent('run_start', { runId, credits: credits.credits }); setScreen('playing'); controller.start();
}
function pause(): void {
  if (state === 'playing') { controller.pause(true); telemetry.trackEvent('pause', { runId }); setScreen('paused'); }
  else if (state === 'paused') { void audio.unlock(); controller.pause(false); telemetry.trackEvent('resume', { runId }); setScreen('playing'); }
}
function recordQuit(): void {
  if ((state !== 'playing' && state !== 'paused' && state !== 'milestone') || ended) return;
  ended = true; const snapshot = controller.snapshot(); telemetry.trackEvent('quit', { runId, score: snapshot.score, time: snapshot.time }); telemetry.trackEvent('run_end', { runId, outcome: 'quit', score: snapshot.score, time: snapshot.time, correct: snapshot.correct, multiplier: snapshot.multiplier }); telemetry.trackEvent('run_duration', { runId, seconds: snapshot.time, reason: 'quit' });
}
function title(): void { if (credits.rewardPending || state === 'ending' || (state === 'result' && performance.now() < resultAvailableAt)) return; recordQuit(); controller.title(); lastResult = null; newBest = false; setScreen('title'); }
async function reward(): Promise<void> {
  if (disposed || credits.rewardPending || credits.canPlay || state === 'ending' || (state === 'result' && performance.now() < resultAvailableAt)) return;
  if (state !== 'reward') setScreen('reward'); $<HTMLButtonElement>('reward-button').disabled = true; $('reward-button').textContent = 'CREDIT を補充中…'; $<HTMLButtonElement>('title-button').disabled = true; $<HTMLButtonElement>('brand-button').disabled = true;
  const success = await credits.requestRewardedCredit(requestRewardedCredit); if (disposed) return;
  $<HTMLButtonElement>('brand-button').disabled = false;
  if (success) { controller.title(); setScreen('title'); $('play-button')?.focus({ preventScroll: true }); }
  else { setScreen('reward'); writeText('reward-status', '補充できませんでした。もう一度お試しください。'); }
}
app.addEventListener('click', event => {
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || (state === 'result' && performance.now() < resultAvailableAt)) return;
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button'); if (!button || button.disabled) return;
  if (choiceButtons.has(button.id)) {
    const pointer = event as PointerEvent;
    if ((event.detail > 0 || pointer.pointerType) && (!pointerApproval || pointerApproval.id !== pointer.pointerId || pointerApproval.button !== button.id || pointerApproval.epoch !== choiceEpoch)) return;
    if (!event.detail && !pointer.pointerType && keyboardStarted && (!keyApproval || keyApproval.button !== button.id || keyApproval.epoch !== choiceEpoch)) return;
    clearApprovals(); chooseMode(button.id === 'continue-button' ? 'continue' : 'clean'); return;
  }
  switch (button.id) {
    case 'play-button': start(); break; case 'retry-button': start(true); break; case 'title-button': case 'brand-button': title(); break; case 'reward-button': void reward(); break;
    case 'mute-button': audio.toggle(); sync(); break; case 'pause-button': case 'resume-button': pause(); break;
  }
}, { signal: listeners.signal });
app.addEventListener('pointerdown', event => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button'); if (!button || button.disabled || !choiceButtons.has(button.id) || state !== 'milestone' || !event.isPrimary || event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  pointerApproval = { id: event.pointerId, button: button.id, epoch: choiceEpoch };
}, { signal: listeners.signal });
app.addEventListener('pointercancel', () => { pointerApproval = null; }, { signal: listeners.signal });
app.addEventListener('keydown', event => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button'); if (!button || button.disabled || !choiceButtons.has(button.id) || (event.key !== ' ' && event.key !== 'Enter')) return;
  if (event.repeat || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) { event.preventDefault(); return; }
  keyboardStarted = true; keyApproval = { button: button.id, epoch: choiceEpoch };
}, { signal: listeners.signal });
document.addEventListener('keydown', event => {
  const action = event.key === ' ' || event.key === 'Enter';
  if (event.repeat || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) { if (action) event.preventDefault(); return; }
  if (event.key === 'Escape' && (state === 'playing' || state === 'paused')) { event.preventDefault(); pause(); return; }
  if (!action || (event.target as HTMLElement).closest('button,a')) return;
  event.preventDefault(); if (state === 'title' || state === 'result') start(state === 'result'); else if (state === 'paused') pause();
}, { signal: listeners.signal });
document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'playing') pause(); }, { signal: listeners.signal });
window.addEventListener('blur', () => { clearApprovals(); if (state === 'playing') pause(); }, { signal: listeners.signal });
window.addEventListener('pagehide', event => { clearApprovals(); if (!event.persisted) recordQuit(); if (state === 'playing') pause(); }, { signal: listeners.signal });
telemetry.trackEvent('game_open'); setScreen('title');
if (import.meta.env.DEV) (window as unknown as { __arcadeDebug: unknown }).__arcadeDebug = Object.freeze({ gameId: 'game009', snapshot: () => controller.snapshot(), inspection: () => controller.inspection(), state: () => state, telemetry: () => telemetry.getEvents() });
if (import.meta.hot) import.meta.hot.dispose(() => { onboarding.destroy(); disposed = true; if (resultTimer !== undefined) window.clearTimeout(resultTimer); listeners.abort(); controller.destroy(); audio.destroy(); delete (window as unknown as { __arcadeDebug?: unknown }).__arcadeDebug; });
