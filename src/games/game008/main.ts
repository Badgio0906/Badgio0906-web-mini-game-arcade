import { createOnboarding } from '../../arcade/onboarding';
import './style.css';
import { StorageService } from '../../core/StorageService';
import { CreditService } from '../../core/CreditService';
import { TelemetryService } from '../../core/TelemetryService';
import { AudioService } from '../../core/AudioService';
import { requestRewardedCredit } from '../../core/RewardService';
import { createCoffeeGame } from './CoffeeBoard';
import { coffeeTitle } from './resultFlavor';
import type { CoffeeChoice, CoffeeEvent, CoffeeSnapshot, CoffeeResult } from './contracts';

type Screen = 'title' | 'playing' | 'paused' | 'milestone' | 'ending' | 'result' | 'reward';
const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;
const app = $('app'); const overlay = $('overlay');
const storage = new StorageService(undefined, 'web-mini-arcade:v1:game008:');
const telemetry = new TelemetryService(storage, 'game008');
const onboarding = createOnboarding({ gameId: 'game008', storage, telemetry }); const credits = new CreditService(storage, telemetry); const audio = new AudioService(storage);
const listeners = new AbortController();
let state: Screen = 'title'; let runId = ''; let ended = true; let disposed = false;
let best = storage.readNumber('best', 0); let newBest = false; let lastResult: CoffeeResult | null = null;
let resultAvailableAt = 0; let resultTimer: ReturnType<typeof window.setTimeout> | undefined;
let offerVisible = false; let milestoneShown = new Set<string>(); let choiceLocked = false; let choiceEpoch = 0;
let pointerApproval: { id: number; button: string; epoch: number } | null = null;
let keyApproval: { button: string; epoch: number } | null = null; let keyboardStarted = false;
const choiceButtons = new Set(['decline-button', 'accept-button']);
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
function update(snapshot: CoffeeSnapshot): void {
  writeText('score-value', String(snapshot.score)); writeText('distance-value', String(Math.floor(snapshot.distance)));
  app.dataset.phase = snapshot.phase; app.dataset.cups = String(snapshot.cupCount);
  app.dataset.scoreDigits = String(Math.min(7, Math.max(String(snapshot.score).length, String(best).length)));
  writeText('mode-label', `${snapshot.cupCount}カップ · ×${snapshot.multiplier}`);
  writeText('phase-label', state === 'paused' ? '身体も液面も停止中。準備ができたら再開。' : state === 'milestone' ? '散歩を止めて考え中。今までのスコアはそのまま。' : snapshot.phase === 'ended' ? `${lastResult?.emptyCupName ?? 'コーヒー'}が0%。散歩はここまで。` : snapshot.activeEvent ? `${snapshot.activeEvent.name}。液面の遅れを見て、落ち着いて。` : snapshot.preview ? `${snapshot.preview.name}の予告。急な操作に気をつけて。` : '身体を戻しても、液面は少し遅れて戻ります。');
}
function setScreen(next: Screen): void {
  if (resultTimer !== undefined) { window.clearTimeout(resultTimer); resultTimer = undefined; }
  state = next; clearApprovals(); sync(); overlay.hidden = next === 'ending';
  if (credits.canPlay || next === 'playing') offerVisible = false;
  if (next === 'playing') {
    overlay.innerHTML = '<article class="receipt play-receipt"><span class="eyebrow">A LITTLE MORNING WALK</span><h2>Easy does it.</h2><p>左右を押して、身体のバランスを取ろう。<br />液体は、身体より遅れて揺れます。</p><ol><li>急に動かすと、反対へ揺れる。</li><li>戻したあとも、揺れは少し残る。</li><li>少しこぼれても大丈夫。どれか1杯が0%になると終了。</li></ol><small>← → / A D を押す<br />左右のボタンを押す・画面をタップ</small></article>'; update(controller.snapshot()); return;
  }
  if (next === 'title') {
    writeText('score-value', '0'); writeText('distance-value', '0'); writeText('mode-label', 'ひとり分 · ×1'); writeText('phase-label', '急に動くと、コーヒーは遅れて揺れます。'); app.dataset.cups = '1'; app.dataset.phase = 'walking'; app.dataset.scoreDigits = String(Math.min(7, String(best).length));
    overlay.innerHTML = `<article class="receipt start-note"><span class="eyebrow">FRESHLY POURED / TAKE A WALK</span><h2 class="game-title">コーヒーこぼすな<small>COFFEE WALK</small></h2><p>朝の街へ、コーヒーと一緒に。<br />左右のバランスを取って、<br />最後の一滴まで届けよう。</p><div class="mini-best">BEST SCORE <b>${best}</b></div>${credits.canPlay ? primary('play-button', 'PLAY · 散歩へ') : primary('reward-button', '+3 CREDIT')}<small>← → / A D / 左右を押す・タップ<br />急に動くと液面が遅れて揺れます。0%で終了。</small>${credits.canPlay ? '' : stub}</article>`;
  } else if (next === 'paused') {
    update(controller.snapshot()); overlay.innerHTML = `<article class="receipt pause-note"><span class="eyebrow">COFFEE BREAK / PAUSED</span><h2>ひと休み。</h2><p>身体も、液面も、時計も停止中。<br />準備ができたら続きから。</p><div class="paired-actions">${primary('resume-button', 'RESUME · 再開')}${titleButton}</div></article>`;
  } else if (next === 'result' && lastResult) {
    const result = lastResult;
    overlay.innerHTML = `<article class="receipt result-note"><div class="result-heading"><span class="result-game-title">コーヒーこぼすな<small>COFFEE WALK</small></span><h2>あっ、空っぽ。</h2><p class="result-reason">${result.emptyCupName}が0%。<br />${result.reason}</p></div><div class="result-score"><b id="result-score">${result.score}</b><span>SCORE</span>${newBest ? '<mark class="new-best">NEW BEST</mark>' : ''}</div><dl class="result-details"><div><dt>BEST</dt><dd id="result-best">${best}</dd></div><div><dt>歩いた距離</dt><dd>${Math.floor(result.distance)} m</dd></div><div><dt>カップ</dt><dd>${result.cupCount} 杯</dd></div><div><dt>TIME / CREDIT</dt><dd>${result.time.toFixed(1)} s · ${credits.credits}/3</dd></div></dl><div class="coffee-title"><small>今回の称号 · ×${result.multiplier}</small><b id="coffee-title">${coffeeTitle(result.distance, result.cupCount)}</b><div class="final-cups">${result.cups.map(cup => `<span>${cup.name} ${Math.max(0, Math.floor(cup.remaining))}%</span>`).join('')}</div></div><div class="paired-actions">${credits.canPlay ? primary('retry-button', 'RETRY · もう1回') : primary('reward-button', '+3 CREDIT')}${titleButton}</div><small>${credits.canPlay ? '次は、もう少し遠くまで。' : 'NO CREDIT · 開発版 Rewarded Ad Stub'}</small></article>`;
  } else if (next === 'reward') {
    overlay.innerHTML = `<article class="receipt reward-note"><span class="eyebrow">ONE MORE MORNING WALK</span><h2>もうひと散歩？</h2><p>開発版の補充ボタンで<br /><b>+3 CREDIT</b></p><div class="paired-actions">${primary('reward-button', '+3 CREDIT')}${titleButton}</div>${stub}<p id="reward-status" role="status"></p></article>`;
  }
  trackOffer();
}
function showMilestone(): void {
  const snapshot = controller.snapshot(); const milestone = snapshot.pending; if (!milestone) return;
  choiceEpoch += 1; choiceLocked = false; keyboardStarted = false; setScreen('milestone');
  const third = milestone === 'third_cup';
  overlay.innerHTML = `<article class="receipt choice-note"><span class="eyebrow">${third ? '1000' : '500'} m / A SMALL REQUEST</span><h2>${third ? '会長の分も頼まれました。' : '部長の分も持っていきますか？'}</h2><p>今までのスコアは、そのまま。<br />${third ? '3杯を同時に運ぶ、とても忙しい散歩へ。' : '持つと2杯。液面の揺れは、それぞれ違います。'}</p><div class="choice-terms">${third ? '持ちます：<b>3カップ · これからの得点2倍</b><br />いやです：2カップのまま、×1.5を継続。' : '持つ：<b>2カップ · これからの得点1.5倍</b><br />断る：1カップのまま、散歩を継続。'}<br />どれか1杯が0%になると終了。</div><div class="choice-actions">${primary('decline-button', third ? 'いやです' : '断る')}${primary('accept-button', third ? '持ちます' : '持つ')}</div>${titleButton}<small>身体も液面も時計も停止中。<br />選択は自由にもう一度遊べます。</small></article>`;
  if (!milestoneShown.has(milestone)) { milestoneShown.add(milestone); telemetry.trackEvent('milestone_reached', { runId, milestone, distance: snapshot.distance }); telemetry.trackEvent('escalation_offered', { runId, milestone }); }
  update(snapshot);
}
function chooseMode(choice: CoffeeChoice): void {
  if (state !== 'milestone' || ended || choiceLocked || credits.rewardPending || !controller.snapshot().pending) return;
  const milestone = controller.snapshot().pending!; choiceLocked = true; clearApprovals();
  if (!controller.choose(choice)) { choiceLocked = false; return; }
  if (choice === 'accept') telemetry.trackEvent('escalation_accepted', { runId, milestone, choice, cupCount: controller.snapshot().cupCount }); setScreen('playing');
}
function sound(event: CoffeeEvent): void {
  if (event.type === 'warning') audio.tone(550, 620, 0.09, 'sine', 0, 0.023);
  if (event.type === 'hazard') audio.tone(220, 190, 0.08, 'triangle', 0, 0.012);
  if (event.type === 'empty') audio.tone(260, 125, 0.25, 'sine', 0, 0.04);
  if (event.type === 'choice' && event.choice === 'accept') audio.tone(430, 650, 0.14, 'triangle', 0, 0.026);
}
const controller = createCoffeeGame($('game-canvas'), {
  onUpdate(snapshot) { if (snapshot.pending && state === 'playing') showMilestone(); if (state === 'playing' || state === 'paused' || state === 'milestone' || state === 'ending') update(snapshot); },
  onEvent: sound,
  onEnd(result) {
    if ((state !== 'playing' && state !== 'milestone') || ended || disposed) return;
    ended = true; lastResult = result; newBest = result.score > best; best = Math.max(best, result.score); storage.writeNumber('best', best); credits.consume(runId);
    telemetry.trackEvent('run_end', { runId, outcome: 'over', score: result.score, time: result.time, distance: result.distance, cupCount: result.cupCount, multiplier: result.multiplier });
    telemetry.trackEvent('score', { runId, score: result.score, best, newBest, distance: result.distance, cupCount: result.cupCount }); telemetry.trackEvent('run_duration', { runId, seconds: result.time, reason: 'over', failure_reason: 'empty' });
    resultAvailableAt = performance.now() + 300; setScreen('ending');
    resultTimer = window.setTimeout(() => { resultTimer = undefined; if (!disposed && state === 'ending') { resultAvailableAt = performance.now(); setScreen('result'); overlay.querySelector<HTMLButtonElement>('.primary')?.focus({ preventScroll: true }); } }, 300);
  },
});
function start(retry = false): void {
  if (onboarding.intercept(() => start(retry))) return;
  if (disposed || credits.rewardPending || state === 'playing' || state === 'paused' || state === 'milestone' || state === 'ending' || (state === 'result' && performance.now() < resultAvailableAt)) return;
  if (!credits.canPlay) { setScreen('reward'); return; }
  void audio.unlock(); runId = `game008-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; ended = false; lastResult = null; newBest = false; milestoneShown.clear(); choiceEpoch += 1; choiceLocked = false; clearApprovals();
  if (retry) telemetry.trackEvent('retry', { runId }); telemetry.trackEvent('run_start', { runId, credits: credits.credits }); setScreen('playing'); controller.start();
}
function pause(): void {
  if (state === 'playing') { controller.pause(true); telemetry.trackEvent('pause', { runId }); setScreen('paused'); }
  else if (state === 'paused') { void audio.unlock(); controller.pause(false); telemetry.trackEvent('resume', { runId }); setScreen('playing'); }
}
function recordQuit(): void {
  if ((state !== 'playing' && state !== 'paused' && state !== 'milestone') || ended) return;
  ended = true; const snapshot = controller.snapshot(); telemetry.trackEvent('quit', { runId, score: snapshot.score, time: snapshot.time }); telemetry.trackEvent('run_end', { runId, outcome: 'quit', score: snapshot.score, time: snapshot.time, distance: snapshot.distance, cupCount: snapshot.cupCount }); telemetry.trackEvent('run_duration', { runId, seconds: snapshot.time, reason: 'quit' });
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
    clearApprovals(); chooseMode(button.id === 'accept-button' ? 'accept' : 'decline'); return;
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
if (import.meta.env.DEV) (window as unknown as { __arcadeDebug: unknown }).__arcadeDebug = Object.freeze({ gameId: 'game008', snapshot: () => controller.snapshot(), inspection: () => controller.inspection(), state: () => state, telemetry: () => telemetry.getEvents() });
if (import.meta.hot) import.meta.hot.dispose(() => { onboarding.destroy(); disposed = true; if (resultTimer !== undefined) window.clearTimeout(resultTimer); listeners.abort(); controller.destroy(); audio.destroy(); delete (window as unknown as { __arcadeDebug?: unknown }).__arcadeDebug; });
