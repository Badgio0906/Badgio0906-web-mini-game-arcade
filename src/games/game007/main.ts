import { createOnboarding } from '../../arcade/onboarding';
import './style.css';
import { StorageService } from '../../core/StorageService';
import { CreditService } from '../../core/CreditService';
import { TelemetryService } from '../../core/TelemetryService';
import { AudioService } from '../../core/AudioService';
import { requestRewardedCredit } from '../../core/RewardService';
import { createElevatorGame } from './ElevatorBoard';
import { elevatorTitle } from './resultFlavor';
import type { ElevatorChoice, ElevatorEvent, ElevatorSnapshot, ElevatorResult } from './contracts';

type Screen = 'title' | 'playing' | 'paused' | 'milestone' | 'ending' | 'result' | 'reward';
const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;
const app = $('app'); const overlay = $('overlay');
const storage = new StorageService(undefined, 'web-mini-arcade:v1:game007:');
const telemetry = new TelemetryService(storage, 'game007');
const onboarding = createOnboarding({ gameId: 'game007', storage, telemetry }); const credits = new CreditService(storage, telemetry); const audio = new AudioService(storage);
const listeners = new AbortController();
let state: Screen = 'title'; let runId = ''; let ended = true; let disposed = false;
let best = storage.readNumber('best', 0); let newBest = false; let lastResult: ElevatorResult | null = null;
let resultAvailableAt = 0; let resultTimer: ReturnType<typeof window.setTimeout> | undefined;
let offerVisible = false; let milestoneShown = false; let choiceLocked = false; let choiceEpoch = 0;
let pointerApproval: { id: number; button: string; epoch: number } | null = null;
let keyApproval: { button: string; epoch: number } | null = null; let keyboardStarted = false;
const choiceButtons = new Set(['normal-button', 'fast-button']);
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
function update(snapshot: ElevatorSnapshot): void {
  writeText('score-value', String(snapshot.score)); writeText('floor-value', String(snapshot.floor));
  if (app.dataset.phase !== snapshot.phase) app.dataset.phase = snapshot.phase;
  if (app.dataset.mode !== snapshot.mode) app.dataset.mode = snapshot.mode;
  app.dataset.scoreDigits = String(Math.min(7, Math.max(String(snapshot.score).length, String(best).length)));
  writeText('mode-label', snapshot.mode === 'fast' ? '業務用高速 · ×1.5' : '通常運転');
  writeText('phase-label', state === 'paused' ? 'かごも時計も停止中。準備ができたら再開。' : state === 'milestone' ? '運転停止中。乗り換えを選んでください。' : snapshot.phase === 'overload' ? `${snapshot.excessKg} kg 超過。運転を停止しました。` : snapshot.phase === 'boarding' ? '重さと行き先を見て、乗せる？見送る？' : snapshot.phase === 'unloading' ? '到着。降りた荷物の分だけ、次の余裕が生まれます。' : snapshot.phase === 'travel' ? '次の階へ移動中。NEXTの重さと行き先を確認。' : '扉が閉まります。次の階へ。');
}
function setScreen(next: Screen): void {
  if (resultTimer !== undefined) { window.clearTimeout(resultTimer); resultTimer = undefined; }
  state = next; clearApprovals(); sync(); overlay.hidden = next === 'ending';
  if (credits.canPlay || next === 'playing') offerVisible = false;
  if (next === 'playing') {
    overlay.innerHTML = '<article class="dispatch-note play-note"><span class="eyebrow">BUILDING SERVICES / 007</span><h2>まだ、乗れますか？</h2><p>現在荷重と、今回の乗客の重さ。<br />450 kgを超えないように判断。</p><ul><li>行き先で降りると荷重が減ります。</li><li>NEXTと次の降車も見て、先を考えよう。</li><li>見送ると次の階へ。空便は得点なし。</li></ul><small>← → / A D<br />画面の左・右をタップ</small></article>'; update(controller.snapshot()); return;
  }
  if (next === 'title') {
    writeText('score-value', '0'); writeText('floor-value', '1'); writeText('mode-label', '通常運転'); writeText('phase-label', '450 kgまで。行き先も見て、ひと組ずつ。'); app.dataset.mode = 'normal'; app.dataset.phase = 'boarding'; app.dataset.scoreDigits = String(Math.min(7, String(best).length));
    overlay.innerHTML = `<article class="dispatch-note start-note"><span class="eyebrow">PLEASE CHECK THE LOAD</span><h2 class="game-title">まだ乗れます<small>ELEVATOR OVERLOAD</small></h2><p>重さと行き先を見て、乗せるか断るか。<br />人と変な荷物を、無事に届けよう。</p><div class="mini-best">BEST SCORE <b>${best}</b></div>${credits.canPlay ? primary('play-button', 'PLAY · 運転開始') : primary('reward-button', '+3 CREDIT')}<small>← → / A D / 左右をタップ<br />降りた荷物の分、次の余裕が生まれます。</small>${credits.canPlay ? '' : stub}</article>`;
  } else if (next === 'paused') {
    update(controller.snapshot()); overlay.innerHTML = `<article class="dispatch-note pause-note"><span class="eyebrow">OUT OF SERVICE / PAUSED</span><h2>ひと休み。</h2><p>かごも、判断の時計も停止中。<br />準備ができたら続きから。</p><div class="paired-actions">${primary('resume-button', 'RESUME · 再開')}${titleButton}</div></article>`;
  } else if (next === 'result' && lastResult) {
    const result = lastResult;
    overlay.innerHTML = `<article class="dispatch-note result-note"><div class="result-heading"><span class="result-game-title">まだ乗れます<small>ELEVATOR OVERLOAD</small></span><h2>重量オーバー！</h2><p class="result-reason">${result.load} / 450 kg<br /><b>${result.excessKg} kg 超過</b> · ${result.party.label}</p></div><div class="result-score"><b id="result-score">${result.score}</b><span>SCORE</span>${newBest ? '<mark class="new-best">NEW BEST</mark>' : ''}</div><dl class="result-details"><div><dt>BEST</dt><dd id="result-best">${best}</dd></div><div><dt>到達階</dt><dd>${result.floor} F</dd></div><div><dt>人のお届け</dt><dd>${result.deliveredPeople} 人</dd></div><div><dt>荷物のお届け</dt><dd>${result.deliveredCargo} 個</dd></div><div><dt>TIME</dt><dd>${result.time.toFixed(1)} s</dd></div><div><dt>CREDIT</dt><dd>${credits.credits} / 3</dd></div></dl><div class="lift-title"><small>${result.mode === 'fast' ? '業務用高速 · ' : ''}積載効率 ${result.utilization.toFixed(0)}% · 今回の称号</small><b id="elevator-title">${elevatorTitle(result.floor, result.deliveredPeople, result.deliveredCargo)}</b></div><div class="paired-actions">${credits.canPlay ? primary('retry-button', 'RETRY · もう1回') : primary('reward-button', '+3 CREDIT')}${titleButton}</div><small>${credits.canPlay ? '次は、もうひと組届けよう。' : 'NO CREDIT · 開発版 Rewarded Ad Stub'}</small></article>`;
  } else if (next === 'reward') {
    overlay.innerHTML = `<article class="dispatch-note reward-note"><span class="eyebrow">BACK IN SERVICE</span><h2>もうひと運転？</h2><p>開発版の補充ボタンで<br /><b>+3 CREDIT</b></p><div class="paired-actions">${primary('reward-button', '+3 CREDIT')}${titleButton}</div>${stub}<p id="reward-status" role="status"></p></article>`;
  }
  trackOffer();
}
function showMilestone(): void {
  choiceEpoch += 1; choiceLocked = false; keyboardStarted = false; setScreen('milestone');
  overlay.innerHTML = `<article class="dispatch-note choice-note"><span class="eyebrow">20 F / NEW ELEVATOR AVAILABLE</span><h2>業務用高速エレベーターに<br />乗り換えますか？</h2><p>今までのスコアは、そのまま。<br />高速では、これからの得点が1.5倍。</p><div class="speed-terms">判断時間：<b>3.2秒 → 最短2秒</b><br />階の移動：<b>1.15秒 → 0.58秒</b><br />もっと速く、もっと忙しい運転へ。</div><div class="choice-actions">${primary('normal-button', 'このまま')}${primary('fast-button', '高速へ')}</div>${titleButton}<small>このままなら通常運転を続けます。<br />かごも時計も停止中。選択は自由にもう一度遊べます。</small></article>`;
  if (!milestoneShown) { milestoneShown = true; telemetry.trackEvent('milestone_reached', { runId, milestone: 'floor20', floor: controller.snapshot().floor }); telemetry.trackEvent('escalation_offered', { runId, milestone: 'floor20' }); }
  update(controller.snapshot());
}
function chooseMode(choice: ElevatorChoice): void {
  if (state !== 'milestone' || ended || choiceLocked || credits.rewardPending || !controller.snapshot().pending) return;
  choiceLocked = true; clearApprovals(); if (!controller.choose(choice)) { choiceLocked = false; return; }
  if (choice === 'fast') telemetry.trackEvent('escalation_accepted', { runId, milestone: 'floor20', choice }); setScreen('playing');
}
function sound(event: ElevatorEvent): void {
  if (event.type === 'decision') audio.tone(event.side === 'accept' ? 370 : 280, event.side === 'accept' ? 470 : 250, 0.08, 'sine', 0, 0.025);
  if (event.type === 'delivery') { audio.tone(600, 800, 0.13, 'triangle', 0, 0.025); audio.tone(900, 900, 0.1, 'sine', 0.07, 0.02); }
  if (event.type === 'floor') audio.tone(450, 450, 0.075, 'sine', 0, 0.018);
  if (event.type === 'overload') { audio.tone(230, 230, 0.2, 'triangle', 0, 0.035); audio.tone(230, 230, 0.2, 'triangle', 0.27, 0.035); }
}
const controller = createElevatorGame($('game-canvas'), {
  onUpdate(snapshot) { if (snapshot.pending && state === 'playing') showMilestone(); if (state === 'playing' || state === 'paused' || state === 'milestone' || state === 'ending') update(snapshot); },
  onEvent: sound,
  onEnd(result) {
    if ((state !== 'playing' && state !== 'milestone') || ended || disposed) return;
    ended = true; lastResult = result; newBest = result.score > best; best = Math.max(best, result.score); storage.writeNumber('best', best); credits.consume(runId);
    telemetry.trackEvent('run_end', { runId, outcome: 'over', score: result.score, time: result.time, floor: result.floor, deliveredPeople: result.deliveredPeople, deliveredCargo: result.deliveredCargo, utilization: result.utilization, mode: result.mode });
    telemetry.trackEvent('score', { runId, score: result.score, best, newBest, floor: result.floor }); telemetry.trackEvent('run_duration', { runId, seconds: result.time, reason: 'over', failure_reason: 'overload' });
    resultAvailableAt = performance.now() + 650; setScreen('ending');
    resultTimer = window.setTimeout(() => { resultTimer = undefined; if (!disposed && state === 'ending') { resultAvailableAt = performance.now(); setScreen('result'); overlay.querySelector<HTMLButtonElement>('.primary')?.focus({ preventScroll: true }); } }, 650);
  },
});
function start(retry = false): void {
  if (onboarding.intercept(() => start(retry))) return;
  if (disposed || credits.rewardPending || state === 'playing' || state === 'paused' || state === 'milestone' || state === 'ending' || (state === 'result' && performance.now() < resultAvailableAt)) return;
  if (!credits.canPlay) { setScreen('reward'); return; }
  void audio.unlock(); runId = `game007-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; ended = false; lastResult = null; newBest = false; milestoneShown = false; choiceEpoch += 1; choiceLocked = false; clearApprovals();
  if (retry) telemetry.trackEvent('retry', { runId }); telemetry.trackEvent('run_start', { runId, credits: credits.credits }); setScreen('playing'); controller.start();
}
function pause(): void {
  if (state === 'playing') { controller.pause(true); telemetry.trackEvent('pause', { runId }); setScreen('paused'); }
  else if (state === 'paused') { void audio.unlock(); controller.pause(false); telemetry.trackEvent('resume', { runId }); setScreen('playing'); }
}
function recordQuit(): void {
  if ((state !== 'playing' && state !== 'paused' && state !== 'milestone') || ended) return;
  ended = true; const snapshot = controller.snapshot(); telemetry.trackEvent('quit', { runId, score: snapshot.score, time: snapshot.time }); telemetry.trackEvent('run_end', { runId, outcome: 'quit', score: snapshot.score, time: snapshot.time, floor: snapshot.floor, mode: snapshot.mode }); telemetry.trackEvent('run_duration', { runId, seconds: snapshot.time, reason: 'quit' });
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
    clearApprovals(); chooseMode(button.id === 'fast-button' ? 'fast' : 'normal'); return;
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
if (import.meta.env.DEV) (window as unknown as { __arcadeDebug: unknown }).__arcadeDebug = Object.freeze({ gameId: 'game007', snapshot: () => controller.snapshot(), inspection: () => controller.inspection(), state: () => state, telemetry: () => telemetry.getEvents() });
if (import.meta.hot) import.meta.hot.dispose(() => { onboarding.destroy(); disposed = true; if (resultTimer !== undefined) window.clearTimeout(resultTimer); listeners.abort(); controller.destroy(); audio.destroy(); delete (window as unknown as { __arcadeDebug?: unknown }).__arcadeDebug; });
