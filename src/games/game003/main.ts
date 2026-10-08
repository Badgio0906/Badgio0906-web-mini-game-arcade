import { createGameRecordSession } from '../../records/RecordSharing';
import { createTowerTraining } from './TowerTraining';
import '../../arcade/onboarding.css';
import { buildingTitle } from './resultFlavor';
import './style.css';
import { StorageService } from '../../core/StorageService';
import { CreditService } from '../../core/CreditService';
import { TelemetryService } from '../../core/TelemetryService';
import { AudioService } from '../../core/AudioService';
import { requestRewardedCredit } from '../../core/RewardService';
import { createTowerGame } from './TowerScene';
import type { TowerChoice, TowerEvent, TowerResult, TowerSnapshot } from './contracts';
const recordSession = createGameRecordSession('game003');

type Screen = 'title' | 'playing' | 'paused' | 'result' | 'reward' | 'milestone';
const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;
const app = $('app'); const overlay = $('overlay'); const stage = $('stage');
const storage = new StorageService(undefined, 'web-mini-arcade:v1:game003:');
const telemetry = new TelemetryService(storage, 'game003');
const onboarding = createTowerTraining(storage, telemetry);
const credits = new CreditService(storage, telemetry); const audio = new AudioService(storage);
const listeners = new AbortController();
let state: Screen = 'title'; let runId = ''; let lastResult: TowerResult | null = null;
const legacyBest = storage.readNumber('best', 0); const legacyBonus = storage.readNumber('bestBonus', 0);
let best = storage.readNumber('rules2:best', 0); let newBest = false; let ended = true;
let bestBonus = storage.readNumber('rules2:bestBonus', 0);
let milestoneShown = false; let choiceEpoch = 0; let choiceLocked = false;
let choicePointer: { pointerId: number; button: string; epoch: number } | null = null;
let choiceKeyboard: { button: string; epoch: number } | null = null;
let choiceKeyboardStarted = false;
let lastChoicePointer: { x: number; y: number; at: number } | null = null;
const choiceButtons = new Set(['normal-button', 'challenge-button']);
let resultAvailableAt = 0; let rewardOfferVisible = false; let disposed = false;
let resultTimer: ReturnType<typeof window.setTimeout> | undefined;
const primary = (id: string, text: string) => `<button id="${id}" type="button" class="primary">${text}<span aria-hidden="true">→</span></button>`;
const titleButton = '<button id="title-button" type="button" class="secondary" aria-label="タイトルに戻る">TITLE</button>';
const stub = '<small class="stub-note">開発版 Rewarded Ad Stub<br />本番広告は表示されません。</small>';
const resultNote = () => credits.canPlay ? 'もう1個、もう少し高く。' : 'NO CREDIT · 開発版 Rewarded Ad Stub';
function trackRewardOffer(): void {
  if (!credits.canPlay && !rewardOfferVisible && !overlay.hidden && $('reward-button')) {
    rewardOfferVisible = true; telemetry.trackEvent('reward_offer_shown', { runId });
  }
}
function sync(): void {
  app.dataset.state = state;
  $('credit-count').textContent = String(credits.credits);
  $('credit-dots').textContent = Array.from({ length: 3 }, (_, i) => i < credits.credits ? '●' : '○').join(' ');
  $('best-value').textContent = String(best);
  $('mute-button').textContent = audio.muted ? '音 OFF' : '音 ON';
  $('mute-button').setAttribute('aria-label', audio.muted ? '音声をオンにする' : '音声をミュート');
  $('mute-button').setAttribute('aria-pressed', String(audio.muted));
  const pauseButton = $<HTMLButtonElement>('pause-button');
  pauseButton.disabled = state !== 'playing' && state !== 'paused';
  pauseButton.textContent = state === 'paused' ? '▶' : 'Ⅱ';
  pauseButton.setAttribute('aria-label', state === 'paused' ? '再開' : '一時停止');
  $<HTMLButtonElement>('drop-button').disabled = state !== 'playing';
}
function update(snapshot: TowerSnapshot): void {
  $('score-value').textContent = String(snapshot.floors);
  $('height-value').textContent = snapshot.height.toFixed(1);
  $('precision-label').textContent = `PERFECT ${snapshot.perfectCount} · ${snapshot.precisionScore} / 芸術 ${snapshot.artPairs}組 · ${snapshot.artScore}`;
  app.dataset.mode = snapshot.mode;
  $('balance-fill').style.width = `${Math.round(snapshot.instability * 100)}%`;
  $('balance-label').textContent = snapshot.instability > 0.72 ? '危険' : snapshot.instability > 0.4 ? '傾き注意' : '安定';
  $('center-label').textContent = snapshot.foundationCenter > 312 ? '基礎重心 → 右寄り' : snapshot.foundationCenter < 288 ? '基礎重心 ← 左寄り' : '基礎重心 · 中央';
  $('stage').dataset.danger = String(snapshot.instability > 0.72);
  const ready = state === 'playing' && snapshot.phase === 'hanging' && snapshot.alive;
  $<HTMLButtonElement>('drop-button').disabled = !ready;
  $('drop-status').textContent = state === 'milestone' ? '進行停止中 · モードを選択' : `${snapshot.cMode ? 'C国 MODE · 速度200% / ' : ''}${ready ? 'DROP READY · 落とせます' : state === 'paused' ? 'PAUSED · 塔は止まっています' : snapshot.phase === 'falling' ? '落下中…' : snapshot.phase === 'settling' ? '着地を待とう…' : 'タイミングを見て、DROP'}`;
}
function setScreen(next: Screen, delay = false): void {
  if (resultTimer !== undefined) { window.clearTimeout(resultTimer); resultTimer = undefined; }
  state = next; choicePointer = null; choiceKeyboard = null; sync(); overlay.hidden = next === 'playing';
  if (credits.canPlay || next === 'playing') rewardOfferVisible = false;
  if (next === 'playing') { update(controller.snapshot()); stage.focus({ preventScroll: true }); return; }
  if (next === 'title') {
    app.dataset.mode = 'normal';
    $('score-value').textContent = '0'; $('height-value').textContent = '0.0';
    $('precision-label').textContent = 'PERFECT 0 · BONUS 0'; $('balance-fill').style.width = '0%'; $('balance-label').textContent = '安定'; stage.dataset.danger = 'false';
    $('drop-status').textContent = 'タイミングを見て、DROP';
    overlay.innerHTML = `<article class="start-card"><span class="eyebrow">READY TO BUILD?</span><h2 class="game-title">我が国の建築は世界一ぃ！<small>DROP TOWER</small></h2><p>中央を狙うか、左右へ張り出すか。<br />反対へ戻して、釣り合いを取ろう。</p><div class="mini-best">新ルール BEST <b>${best}</b> FLOORS<small>旧ルール ${legacyBest}階 / BONUS ${legacyBonus} を保持</small></div>${credits.canPlay ? primary('play-button', 'PLAY · 建築開始') : primary('reward-button', '+3 CREDIT')}<small class="input-note">Space / Enter / Click / Tap</small>${credits.canPlay ? '' : stub}</article>`;
  } else if (next === 'paused') {
    $('drop-status').textContent = 'PAUSED · 塔は止まっています';
    overlay.innerHTML = `<article class="start-card"><span class="eyebrow">HOLD THE CRANE</span><h2>ひと休み。</h2><p>塔も時間も止まっています。<br />準備ができたら、続きから。</p><div class="inspection-actions">${primary('resume-button', 'RESUME · 再開')}${titleButton}</div></article>`;
  } else if (next === 'result' && lastResult) {
    const result = lastResult;
    overlay.innerHTML = `<article class="result-card"><div class="result-heading"><span class="result-game-title">我が国の建築は世界一ぃ！<small>DROP TOWER</small></span><h2>${result.outcome === 'fall' ? 'あと、もう少し。' : '塔が、崩れた。'}</h2><p class="result-reason">${result.reason}</p></div><div class="result-score"><b id="result-score">${result.floors}</b><span>階数・スコア</span>${newBest ? '<mark class="new-best">NEW BEST</mark>' : ''}</div><dl class="result-details"><div><dt>BEST</dt><dd id="result-best">${best} floors</dd></div><div><dt>HEIGHT</dt><dd>${result.height.toFixed(1)} m</dd></div><div><dt>TIME</dt><dd>${result.time.toFixed(1)} s</dd></div><div><dt>PERFECT</dt><dd>${result.perfectCount} <small>+${result.precisionScore}</small></dd></div><div><dt>芸術ペア</dt><dd>${result.artPairs}組 <small>+${result.artScore}</small></dd></div><div><dt>合計 BONUS</dt><dd>${result.bonusScore}<small id="result-bonus-best"> 新BEST ${bestBonus}</small></dd></div></dl><div class="result-flavor"><small>${result.cMode ? 'C国 MODE · 速度200% / PERFECT / 芸術点300% · 今回の称号' : '今回の称号'}</small><b id="building-title">${result.artPairs >= 5 ? '釣り合いの魔術師' : result.artPairs >= 2 ? '左右に事情のある建築士' : result.artPairs ? 'ちょっと攻めた大工' : buildingTitle(result.floors, result.cMode)}</b></div><div class="result-actions">${credits.canPlay ? primary('retry-button', 'RETRY · もう1回') : primary('reward-button', '+3 CREDIT')}${titleButton}</div><small class="result-note">新ルール v2 · 旧${legacyBest}階 / ${legacyBonus}点保持<br />${resultNote()}</small></article>`;
    recordSession.mount(overlay.firstElementChild as HTMLElement);
    if (delay) {
      overlay.hidden = true;
      resultTimer = window.setTimeout(() => { resultTimer = undefined; if (!disposed && state === 'result') { overlay.hidden = false; trackRewardOffer(); overlay.querySelector<HTMLButtonElement>('.primary')?.focus({ preventScroll: true }); } }, 300);
    }
  } else if (next === 'reward') {
    overlay.innerHTML = `<article class="start-card reward-card"><span class="eyebrow">ONE MORE TOWER</span><h2>もうひと建築？</h2><p>開発版の補充ボタンで<br /><b>+3 CREDIT</b></p><div class="inspection-actions">${primary('reward-button', '+3 CREDIT')}${titleButton}</div>${stub}<p id="reward-status" role="status"></p></article>`;
  }
  trackRewardOffer();
}
function showMilestone(): void {
  choiceEpoch += 1; choiceLocked = false; choiceKeyboardStarted = false;
  setScreen('milestone');
  overlay.innerHTML = `<article class="start-card milestone-card"><span class="eyebrow">HEIGHT 15 m / 新たな建築許可</span><h2>15mを突破しました。<br />C国モードを解禁しますか？</h2><div class="mode-terms"><b>C国モード</b><span>速度：<strong>200%</strong></span><span>PERFECT / 芸術点：<strong>300%</strong></span></div><p>危険ですが、とても伸びます。</p><div class="mode-actions">${primary('normal-button', '通常建築を続ける')}${primary('challenge-button', 'C国モードへ')}</div>${titleButton}<small>塔も時間も停止中。このRUNでは変更できません。</small></article>`;
  if (!milestoneShown) {
    milestoneShown = true;
    telemetry.trackEvent('milestone_reached', { runId, milestone: 'height15', height: controller.snapshot().height });
    telemetry.trackEvent('escalation_offered', { runId, milestone: 'height15' });
  }
  update(controller.snapshot());
}
function chooseMode(buttonId: string): void {
  if (state !== 'milestone' || choiceLocked || ended || credits.rewardPending || !controller.snapshot().pending) return;
  const choice: TowerChoice = buttonId === 'challenge-button' ? 'challenge' : 'normal';
  choiceLocked = true; choicePointer = null; choiceKeyboard = null;
  if (!controller.choose(choice)) { choiceLocked = false; return; }
  if (choice === 'challenge') telemetry.trackEvent('escalation_accepted', { runId, milestone: 'height15', choice });
  setScreen('playing');
}
function sound(event: TowerEvent): void {
  if (['overhang', 'art', 'support_failure'].includes(event.type) && !ended) {
    const snap = controller.snapshot();
    const data: Record<string, string | number | boolean> = event.type === 'art' ? { event: 'art_pair', first_id: event.pair.firstId, second_id: event.pair.secondId, points: event.pair.points, first_ratio: event.pair.firstRatio, second_ratio: event.pair.secondRatio, recovery_pixels: event.pair.recoveryPixels } : event.type === 'overhang' ? { event: 'overhang', cargo_id: event.cargoId, offset_ratio: event.offsetRatio, support_margin: event.margin, weak_joint_index: event.weakJointIndex } : event.type === 'support_failure' ? { event: 'support_failure', joint_index: event.jointIndex, support_margin: event.margin, contact: event.contact } : {};
    telemetry.trackEvent('specific_game_events', { runId, rulesVersion: 2, floors: snap.floors, ...data });
  }
  if (event.type === 'art') { audio.tone(540, 720, .13, 'triangle', 0, .03); audio.tone(810, 1080, .13, 'sine', .08, .025); }
  if (event.type === 'release') audio.tone(320, 200, 0.07, 'sine', 0, 0.025);
  if (event.type === 'land') { audio.tone(130, 75, 0.15, 'triangle', 0, 0.065); audio.tone(220, 120, 0.08, 'sine', 0.02, 0.025); }
  if (event.type === 'perfect') { const pitch = 520 + Math.min(event.combo, 8) * 65; audio.tone(pitch, pitch * 1.25, 0.14, 'sine'); audio.tone(pitch * 1.5, pitch * 1.5, 0.14, 'triangle', 0.07, 0.03); }
  if (event.type === 'danger') audio.tone(210, 160, 0.13, 'sine', 0, 0.025);
  if (event.type === 'collapse') { audio.tone(100, 35, 0.28, 'triangle', 0, 0.055); audio.tone(170, 60, 0.23, 'sine', 0.03, 0.03); }
}
const controller = createTowerGame($('game-canvas'), {
  onUpdate(snapshot) { if (snapshot.pending && state === 'playing') showMilestone(); if (state === 'playing' || state === 'paused' || state === 'milestone') update(snapshot); },
  onEvent: sound,
  onEnd(result) {
    if ((state !== 'playing' && state !== 'milestone') || ended || disposed) return;
    ended = true; lastResult = result; newBest = result.floors > best;
    best = Math.max(best, result.floors); storage.writeNumber('rules2:best', best);
    bestBonus = Math.max(bestBonus, result.bonusScore); storage.writeNumber('rules2:bestBonus', bestBonus); recordSession.complete(result.floors, { metadata: { duration_seconds: result.time, outcome: result.outcome } });
    credits.consume(runId);
    telemetry.trackEvent('run_end', { runId, rulesVersion: 2, outcome: 'over', score: result.floors, time: result.time, artPairs: result.artPairs, artScore: result.artScore, bonusScore: result.bonusScore });
    telemetry.trackEvent('score', { runId, rulesVersion: 2, score: result.floors, best, newBest });
    telemetry.trackEvent('run_duration', { runId, seconds: result.time, reason: 'over' });
    telemetry.trackEvent('tower_height', { runId, height: result.height, floors: result.floors });
    telemetry.trackEvent('perfect_count', { runId, count: result.perfectCount, maxCombo: result.maxCombo, precisionScore: result.precisionScore, cMode: result.cMode, perfectMultiplier: result.perfectMultiplier });
    resultAvailableAt = performance.now() + 300; setScreen('result', true);
  },
});
function start(retry = false): void {
  if (onboarding.intercept()) return;
  if (disposed || credits.rewardPending || state === 'playing' || state === 'paused' || state === 'milestone' || (state === 'result' && performance.now() < resultAvailableAt)) return;
  if (!credits.canPlay) { setScreen('reward'); return; }
  void audio.unlock(); runId = `game003-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  ended = false; lastResult = null; newBest = false; milestoneShown = false; choiceEpoch += 1; choiceLocked = false; choicePointer = null; choiceKeyboard = null;
  if (retry) telemetry.trackEvent('retry', { runId });
  recordSession.startRun(); telemetry.trackEvent('run_start', { runId, rulesVersion: 2, credits: credits.credits });
  setScreen('playing'); controller.start();
}
function drop(): void { if (state === 'playing' && !ended && controller.snapshot().phase === 'hanging') { void audio.unlock(); controller.drop(); } }
function pause(): void {
  if (state === 'playing') { controller.pause(true); telemetry.trackEvent('pause', { runId }); setScreen('paused'); }
  else if (state === 'paused') { void audio.unlock(); controller.pause(false); telemetry.trackEvent('resume', { runId }); setScreen('playing'); }
}
function recordQuit(): void {
  if ((state !== 'playing' && state !== 'paused' && state !== 'milestone') || ended) return;
  ended = true; const snapshot = controller.snapshot();
  telemetry.trackEvent('quit', { runId, score: snapshot.floors, time: snapshot.time });
  telemetry.trackEvent('run_end', { runId, rulesVersion: 2, outcome: 'quit', score: snapshot.floors, time: snapshot.time });
  telemetry.trackEvent('run_duration', { runId, seconds: snapshot.time, reason: 'quit' });
}
function title(): void { if (credits.rewardPending || (state === 'result' && performance.now() < resultAvailableAt)) return; recordQuit(); controller.title(); lastResult = null; newBest = false; setScreen('title'); }
async function reward(): Promise<void> {
  if (disposed || credits.rewardPending || credits.canPlay || (state === 'result' && performance.now() < resultAvailableAt)) return;
  if (state !== 'reward') setScreen('reward');
  const button = $<HTMLButtonElement>('reward-button'); button.disabled = true; button.textContent = 'CREDIT を補充中…';
  $<HTMLButtonElement>('title-button').disabled = true; $<HTMLButtonElement>('brand-button').disabled = true;
  const success = await credits.requestRewardedCredit(requestRewardedCredit);
  if (disposed) return;
  $<HTMLButtonElement>('brand-button').disabled = false;
  if (success) { controller.title(); setScreen('title'); $('play-button')?.focus({ preventScroll: true }); }
  else { setScreen('reward'); $('reward-status').textContent = '補充できませんでした。もう一度お試しください。'; }
}
app.addEventListener('click', event => {
  if (state === 'result' && performance.now() < resultAvailableAt) return;
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button'); if (!button || button.disabled) return;
  if (choiceButtons.has(button.id)) {
    const pointer = event as PointerEvent;
    if ((event.detail > 0 || pointer.pointerType) && (!choicePointer || choicePointer.pointerId !== pointer.pointerId || choicePointer.button !== button.id || choicePointer.epoch !== choiceEpoch)) return;
    if (!event.detail && !pointer.pointerType && choiceKeyboardStarted && (choiceKeyboard?.button !== button.id || choiceKeyboard.epoch !== choiceEpoch)) return;
    if (event.detail > 0 || pointer.pointerType) lastChoicePointer = { x: event.clientX, y: event.clientY, at: performance.now() };
    chooseMode(button.id); return;
  }
  switch (button.id) {
    case 'play-button': start(); break;
    case 'retry-button': start(true); break;
    case 'drop-button': drop(); break;
    case 'title-button': case 'brand-button': title(); break;
    case 'reward-button': void reward(); break;
    case 'mute-button': audio.toggle(); sync(); if (state === 'playing') update(controller.snapshot()); break;
    case 'pause-button': case 'resume-button': pause(); break;
  }
}, { signal: listeners.signal });
app.addEventListener('pointerdown', event => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button');
  if (button && choiceButtons.has(button.id) && state === 'milestone' && event.isPrimary && event.button === 0 && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey) choicePointer = { pointerId: event.pointerId, button: button.id, epoch: choiceEpoch };
}, { signal: listeners.signal });
app.addEventListener('pointercancel', () => { choicePointer = null; }, { signal: listeners.signal });
app.addEventListener('keydown', event => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button');
  if (!button || !choiceButtons.has(button.id) || (event.key !== 'Enter' && event.key !== ' ')) return;
  if (event.repeat || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) { event.preventDefault(); return; }
  choiceKeyboardStarted = true; choiceKeyboard = { button: button.id, epoch: choiceEpoch };
}, { signal: listeners.signal });
stage.addEventListener('pointerdown', event => {
  if (!event.isPrimary || event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || state !== 'playing') return;
  if (lastChoicePointer && performance.now() - lastChoicePointer.at < 350 && Math.hypot(event.clientX - lastChoicePointer.x, event.clientY - lastChoicePointer.y) < 72) return;
  event.preventDefault(); drop();
}, { signal: listeners.signal });
document.addEventListener('keydown', event => {
  const key = event.key.toLowerCase(); const action = key === 'enter' || key === ' ';
  if (event.repeat || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) { if (action) event.preventDefault(); return; }
  if (key === 'escape') { if (state === 'playing' || state === 'paused') { event.preventDefault(); pause(); } return; }
  if (!action || (event.target as HTMLElement).closest('button,a')) return;
  event.preventDefault();
  if (state === 'playing') drop();
  else if (state === 'title' || state === 'result') start(state === 'result');
  else if (state === 'paused') pause();
}, { signal: listeners.signal });
document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'playing') pause(); }, { signal: listeners.signal });
window.addEventListener('blur', () => { choicePointer = null; choiceKeyboard = null; if (state === 'playing') pause(); }, { signal: listeners.signal });
window.addEventListener('pagehide', event => { choicePointer = null; choiceKeyboard = null; if (!event.persisted) recordQuit(); if (state === 'playing') pause(); }, { signal: listeners.signal });
telemetry.trackEvent('game_open'); setScreen('title');
if (import.meta.env.DEV) {
  (window as unknown as { __arcadeDebug: unknown }).__arcadeDebug = Object.freeze({ gameId: 'game003', snapshot: () => controller.snapshot(), inspection: () => controller.inspection(), state: () => state, telemetry: () => telemetry.getEvents() });
}
if (import.meta.hot) import.meta.hot.dispose(() => { onboarding.destroy();
  disposed = true; if (resultTimer !== undefined) window.clearTimeout(resultTimer);
  listeners.abort(); controller.destroy(); audio.destroy();
  delete (window as unknown as { __arcadeDebug?: unknown }).__arcadeDebug;
});
