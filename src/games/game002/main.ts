import { createGameRecordSession } from '../../records/RecordSharing';
import { createOnboarding } from '../../arcade/onboarding';
import { calculateWorkdayScore } from './scoring';
import './style.css';
import { StorageService } from '../../core/StorageService';
import { CreditService } from '../../core/CreditService';
import { TelemetryService } from '../../core/TelemetryService';
import { AudioService } from '../../core/AudioService';
import { requestRewardedCredit } from '../../core/RewardService';
import { createWorkdayGame } from './WorkdayScene';
import type { WorkdayEvent, WorkdayResult } from './WorkdayRun';
const recordSession = createGameRecordSession('game002');

type Screen = 'title' | 'playing' | 'paused' | 'result' | 'reward' | 'milestone';
const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;
const app = $('app'); const overlay = $('overlay'); const stage = $('stage');
const dialog = $<HTMLDialogElement>('how-dialog');
const storage = new StorageService(undefined, 'web-mini-arcade:v1:game002:');
const telemetry = new TelemetryService(storage, 'game002');
const onboarding = createOnboarding({ gameId: 'game002', storage, telemetry });
const credits = new CreditService(storage, telemetry); const audio = new AudioService(storage);
const events = new AbortController();
let state: Screen = 'title'; let runId = ''; let lastResult: WorkdayResult | null = null;
let best = storage.readNumber('best', 0);
let bestScore = storage.readNumber('bestScore', 0);
let cleared = storage.readBoolean('cleared', false);
let clearTimeMs = storage.readNumber('clearTimeMs', 0);
let newBest = false; let resultAvailableAt = 0; let quitLogged = false;
let rewardOfferVisible = false;
let choiceEpoch = 0; let choiceLocked = false;
let choicePointer: { pointerId: number; button: string; epoch: number } | null = null;
let choiceKeyboard: { button: string; epoch: number } | null = null;
let choiceKeyboardStarted = false;
let lastChoicePointer: { x: number; y: number; at: number } | null = null;
const shownMilestones = new Set<'company' | 'bike'>();
const milestoneButtonIds = new Set(['company-button','journey-button','safe-exit-button','walk-button','bike-button']);
let resultTimer: ReturnType<typeof window.setTimeout> | undefined;
const seconds = (time: number) => `${time.toFixed(1)} s`;
const primary = (id: string, text: string) => `<button id="${id}" type="button" class="primary">${text}<span aria-hidden="true">→</span></button>`;
const titleButton = '<button id="title-button" type="button" class="secondary">TITLE · タイトルへ</button>';
const resultTitleButton = '<button id="title-button" type="button" class="secondary" aria-label="タイトルに戻る">TITLE</button>';
const record = () => cleared ? `<span id="clear-record" class="clear-record">出社済み ✓${clearTimeMs > 0 ? ` · 到達時間 ${seconds(clearTimeMs / 1000)}` : ''}</span>` : '';
function trackRewardOffer(): void {
  if (!credits.canPlay && !rewardOfferVisible) { rewardOfferVisible = true; telemetry.trackEvent('reward_offer_shown', { runId }); }
}

function sync(): void {
  $('credit-count').textContent = String(credits.credits);
  $('credit-dots').textContent = Array.from({ length: 3 }, (_, i) => i < credits.credits ? '●' : '○').join(' ');
  $('best-value').textContent = String(best);
  $('mute-button').textContent = audio.muted ? '音 OFF' : '音 ON';
  $('mute-button').setAttribute('aria-label', audio.muted ? '音声をオンにする' : '音声をミュート');
  $('mute-button').setAttribute('aria-pressed', String(audio.muted));
  $<HTMLButtonElement>('pause-button').disabled = state !== 'playing' && state !== 'paused';
  $('pause-button').textContent = state === 'paused' ? '▶' : 'Ⅱ';
  $('pause-button').setAttribute('aria-label', state === 'paused' ? '再開' : '一時停止');
  app.dataset.state = state;
  app.dataset.distanceDigits = String(Math.min(7, String(best).length));
}
function setScreen(next: Screen, delayResult = false): void {
  if (resultTimer !== undefined) { window.clearTimeout(resultTimer); resultTimer = undefined; }
  state = next; choicePointer = null; choiceKeyboard = null; sync(); overlay.hidden = state === 'playing';
  if (credits.canPlay || state === 'playing') rewardOfferVisible = false;
  if (state === 'playing') { stage.focus({ preventScroll: true }); return; }
  if (state === 'title') {
    $('score-value').textContent = '0'; $('nice-value').textContent = '0'; $('score-total-value').textContent = '0'; $('bonus-value').textContent = '100%'; $('district-label').textContent = '住宅街'; $('progress-fill').style.width = '0%'; $('progress').setAttribute('aria-valuenow', '0'); $('journey-target').textContent = '弊社 1000 m'; $('travel-mode').textContent = '通勤 · 徒歩'; $('progress').setAttribute('aria-valuemax', '1000');
    overlay.innerHTML = `<article class="start-card"><span class="eyebrow">READY FOR WORK?</span><div class="little-case" aria-hidden="true">▰</div><h2 class="game-title">ゆううつな月曜日<small>WORKDAY DODGE</small></h2><p>左右へひょいっ。<br />オフィスまで、あと 1000 m。</p><div class="mini-best">BEST <b>${best} m</b> · SCORE <b>${bestScore}</b>${record()}</div>${credits.canPlay ? primary('play-button', 'PLAY · 出勤する') : primary('reward-button', '+3 CREDIT')}<small>← → / A D ・ 左右をタップ</small>${credits.canPlay ? '' : '<small>開発版：Rewarded Ad Stub</small>'}</article>`;
  } else if (state === 'paused') {
    overlay.innerHTML = `<article class="start-card"><span class="eyebrow">TAKE A BREATHER</span><h2>ひと休み。</h2><p>道は止まっています。<br />準備ができたら、続きから。</p><div class="ticket-actions">${primary('resume-button', 'RESUME · 再開')}${titleButton}</div></article>`;
  } else if (state === 'result' && lastResult) {
    const result = lastResult;
    overlay.innerHTML = `<article class="result-card"><span class="result-game-title">ゆううつな月曜日<small>WORKDAY DODGE</small></span><h2>${result.outcome === 'clear' ? '出社成功！' : result.outcome === 'safe_exit' ? '今日は、ここまで。' : result.mode === 'commute' ? '出勤失敗……' : '旅は、ここでおしまい。'}</h2><p class="result-line">${result.outcome === 'clear' ? '無事到着。今日もおつかれさま！' : result.outcome === 'safe_exit' ? '旅のスコアを確定しました。自由にもう一度遊べます。' : 'ぶつかりおじさんに、ぶつかっちゃった。'}</p>${newBest ? '<span class="new-best">NEW BEST!</span>' : ''}<div class="result-distance"><b id="result-score">${result.score}</b><span>SCORE</span></div><dl class="dodge-details"><div><dt>到達距離</dt><dd id="result-distance">${result.distance} m</dd></div><div><dt>NICE DODGE</dt><dd>${result.dodges} 回</dd></div><div><dt>ボーナス</dt><dd>${result.bonusPercent}%</dd></div></dl><dl class="result-details"><div><dt>BEST SCORE</dt><dd id="result-score-best">${bestScore}</dd></div><div><dt>BEST m</dt><dd id="result-best">${best} m</dd></div><div><dt>TIME</dt><dd>${seconds(result.time)}</dd></div><div><dt>CREDIT</dt><dd>${credits.credits} / 3</dd></div></dl>${record()}<div class="result-actions">${credits.canPlay ? primary('retry-button', result.cleared ? 'もう一度、出勤する' : 'RETRY · もう一度') : primary('reward-button', '+3 CREDIT')}${resultTitleButton}</div><small>${credits.canPlay ? result.outcome === 'safe_exit' ? '安全に帰還。次は、どこまで行こう？' : result.mode === 'bike' ? 'バイクの旅は、あっという間。' : '次こそ、すいすい出社。' : 'NO CREDIT · 開発版：Rewarded Ad Stub'}</small></article>`;
    recordSession.mount(overlay.firstElementChild as HTMLElement);
    if (delayResult) {
      overlay.hidden = true;
      resultTimer = window.setTimeout(() => { resultTimer = undefined; if (state === 'result') { overlay.hidden = false; trackRewardOffer(); overlay.querySelector<HTMLButtonElement>('.primary')?.focus({ preventScroll: true }); } }, 300);
    }
  } else if (state === 'reward') {
    overlay.innerHTML = `<article class="start-card"><span class="eyebrow">A NEW MORNING</span><h2>もうひと通勤？</h2><p>広告を見ると<br /><b>+3 CREDIT</b></p><div class="ticket-actions">${primary('reward-button', '+3 CREDIT')}${titleButton}</div><small>開発版：Rewarded Ad Stub<br />本番広告は表示されません。</small><p id="reward-status" role="status"></p></article>`;
  }
  if (!overlay.hidden && (state === 'title' || state === 'result' || state === 'reward')) trackRewardOffer();
}
function showMilestone(milestone: 'company' | 'bike'): void {
  choiceEpoch += 1; choiceLocked = false; choiceKeyboardStarted = false;
  setScreen('milestone');
  const milestoneName = milestone === 'company' ? 'company_1000m' : 'bike_2000m';
  if (!shownMilestones.has(milestone)) {
    shownMilestones.add(milestone);
    telemetry.trackEvent('milestone_reached', { runId, milestone: milestoneName, distance: controller.snapshot().distance });
    telemetry.trackEvent('escalation_offered', { runId, milestone: milestoneName });
  }
  overlay.innerHTML = milestone === 'company'
    ? `<article class="start-card milestone-card"><span class="eyebrow">弊社 / 1000 m</span><h2>会社に到着しました。<br />出勤しますか？</h2><p>※出勤するとここでゲームは終わりです</p><div class="milestone-actions">${primary('company-button', '出勤する')}${primary('journey-button', '旅に出る')}</div>${resultTitleButton}<small>道も時計も停止中。ゆっくり選べます。</small></article>`
    : `<article class="start-card milestone-card bike-choice"><span class="eyebrow">旅の途中 / 2000 m</span><h2>45歳ですが、盗んだバイクで走りだしますか？</h2><p>バイクは速度200%。距離も危険も、ぐっと増えます。</p><div class="milestone-actions">${primary('safe-exit-button', 'ここで旅を終える')}${primary('walk-button', '歩きを続ける')}${primary('bike-button', 'バイクで行く')}</div>${resultTitleButton}<small>終了する選択は自由にもう一度遊べます。</small></article>`;
  $('hint').textContent = '進行停止中 · 選択してから再開';
}
function chooseMilestone(buttonId: string): void {
  if (state !== 'milestone' || choiceLocked || credits.rewardPending) return;
  const choices = { 'company-button': 'office', 'journey-button': 'journey', 'safe-exit-button': 'safe_exit', 'walk-button': 'walk', 'bike-button': 'bike' } as const;
  const choice = choices[buttonId as keyof typeof choices];
  if (!choice || !controller.snapshot().pending) return;
  const milestone = controller.snapshot().pending === 'company' ? 'company_1000m' : 'bike_2000m';
  choiceLocked = true; choicePointer = null; choiceKeyboard = null;
  if (!controller.choose(choice)) { choiceLocked = false; return; }
  if (choice === 'journey' || choice === 'bike') telemetry.trackEvent('escalation_accepted', { runId, milestone, choice });
  if (state === 'milestone') setScreen('playing');
}
function sound(event: WorkdayEvent): void {
  if (event.type === 'move') audio.tone(270, 400, 0.07, 'sine', 0, 0.025);
  if (event.type === 'dodge') { audio.tone(600, 900, 0.12, 'triangle'); audio.tone(900, 1200, 0.1, 'sine', 0.05); }
  if (event.type === 'collision') { audio.tone(170, 80, 0.23, 'triangle'); audio.tone(90, 45, 0.25, 'sine', 0.03); }
  if (event.type === 'clear') for (let i = 0; i < 4; i++) audio.tone(440 * [1, 1.25, 1.5, 2][i], 440 * [1, 1.25, 1.5, 2][i], 0.22, 'triangle', i * 0.1);
  if (event.type === 'district') audio.tone(420, 650, 0.12, 'sine', 0, 0.025);
}
const controller = createWorkdayGame($('game-canvas'), {
  onUpdate(snapshot) {
    if (state !== 'playing' && state !== 'paused' && state !== 'milestone') return;
    if (snapshot.pending && state === 'playing') showMilestone(snapshot.pending);
    $('score-value').textContent = String(snapshot.distance);
    const scoring = calculateWorkdayScore(snapshot.distance, snapshot.dodges); $('nice-value').textContent = String(snapshot.dodges); $('score-total-value').textContent = String(scoring.score); $('bonus-value').textContent = `${scoring.bonusPercent}%`;
    $('district-label').textContent = snapshot.district;
    const target = snapshot.mode === 'commute' ? 1000 : snapshot.pending === 'bike' || snapshot.distance < 2000 ? 2000 : Math.ceil((snapshot.distance + 1) / 1000) * 1000;
    $('progress-fill').style.width = `${Math.min(100, snapshot.distance / target * 100)}%`; $('progress').setAttribute('aria-valuemax', String(target));
    $('journey-target').textContent = snapshot.mode === 'commute' ? '弊社 1000 m' : snapshot.distance < 2000 ? '旅へ · 2000 m' : 'まだ、先がある';
    $('travel-mode').textContent = snapshot.travel === 'bike' ? 'バイク · 速度200%' : snapshot.mode === 'journey' ? '旅 · 徒歩' : '通勤 · 徒歩';
    app.dataset.distanceDigits = String(Math.min(7, Math.max(String(snapshot.distance).length, String(best).length)));
    $('progress').setAttribute('aria-valuenow', String(snapshot.distance));
    $('hint').textContent = state === 'milestone' ? '進行停止中 · 選択してから再開' : snapshot.mode !== 'commute' ? '旅は続く · 黄色い矢印は相手の次の動き' : snapshot.distance < 150 ? '← → / A D ・ 左右をタップで移動' : snapshot.difficulty === 'HARD' ? 'もうすぐ到着！ 前をよく見よう' : '黄色い矢印は、相手の次の動き';
  },
  onEvent: sound,
  onEnd(result) {
    if (state !== 'playing' && state !== 'milestone') return;
    lastResult = result;
    const milliseconds = Math.round(result.time * 1000);
    newBest = result.distance > best || (result.cleared && (!cleared || !clearTimeMs || milliseconds < clearTimeMs));
    const newScoreBest = result.score > bestScore; bestScore = Math.max(bestScore, result.score); storage.writeNumber('bestScore', bestScore);
    newBest = newBest || newScoreBest;
    best = Math.max(best, result.distance); storage.writeNumber('best', best); recordSession.complete(result.score, { metadata: { duration_seconds: result.time, outcome: result.outcome } });
    if (result.outcome === 'clear') {
      cleared = true; storage.writeBoolean('cleared', true);
      if (!clearTimeMs || milliseconds < clearTimeMs) { clearTimeMs = milliseconds; storage.writeNumber('clearTimeMs', clearTimeMs); }
      telemetry.trackEvent('office_clear', { runId, distance: 1000, time: result.time });
    } else if (result.outcome === 'collision') credits.consume(runId);
    if (result.outcome === 'safe_exit') telemetry.trackEvent('safe_exit', { runId, milestone: 'bike_2000m', score: result.score, distance: result.distance });
    const outcome = result.outcome === 'clear' ? 'clear' : result.outcome === 'safe_exit' ? 'safe_exit' : 'over';
    telemetry.trackEvent('run_end', { runId, outcome, score: result.score, distance: result.distance, dodges: result.dodges, bonusPercent: result.bonusPercent, time: result.time });
    telemetry.trackEvent('score', { runId, score: result.score, best: bestScore, newBest: newScoreBest, distance: result.distance, dodges: result.dodges, bonusPercent: result.bonusPercent });
    telemetry.trackEvent('run_duration', { runId, seconds: result.time, reason: outcome });
    telemetry.trackEvent('distance_reached', { runId, distance: result.distance, cleared: result.cleared });
    resultAvailableAt = performance.now() + 300; setScreen('result', true);
  },
});
function start(retry = false): void {
  if (onboarding.intercept(() => start(retry))) return;
  if (credits.rewardPending || state === 'playing' || state === 'paused' || state === 'milestone' || (state === 'result' && performance.now() < resultAvailableAt)) return;
  if (!credits.canPlay) { setScreen('reward'); return; }
  void audio.unlock(); runId = `game002-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  quitLogged = false; shownMilestones.clear(); choiceEpoch += 1; choiceLocked = false; choicePointer = null; choiceKeyboard = null; lastResult = null; newBest = false;
  if (retry) telemetry.trackEvent('retry', { runId });
  recordSession.startRun(); telemetry.trackEvent('run_start', { runId, credits: credits.credits });
  setScreen('playing'); controller.start();
}
function pause(): void {
  if (state === 'playing') { controller.pause(true); telemetry.trackEvent('pause', { runId }); setScreen('paused'); }
  else if (state === 'paused') { void audio.unlock(); controller.pause(false); telemetry.trackEvent('resume', { runId }); setScreen('playing'); }
}
function recordQuit(): void {
  if ((state !== 'playing' && state !== 'paused' && state !== 'milestone') || quitLogged) return;
  quitLogged = true; const snapshot = controller.snapshot();
  telemetry.trackEvent('quit', { runId, distance: snapshot.distance, time: snapshot.time });
  telemetry.trackEvent('run_end', { runId, outcome: 'quit', score: calculateWorkdayScore(snapshot.distance, snapshot.dodges).score, distance: snapshot.distance, dodges: snapshot.dodges, bonusPercent: calculateWorkdayScore(snapshot.distance, snapshot.dodges).bonusPercent, time: snapshot.time });
  telemetry.trackEvent('run_duration', { runId, seconds: snapshot.time, reason: 'quit' });
}
function title(): void { if (credits.rewardPending) return; recordQuit(); controller.title(); lastResult = null; newBest = false; setScreen('title'); }
async function reward(): Promise<void> {
  if (credits.rewardPending) return;
  if (state !== 'reward') setScreen('reward');
  const button = $<HTMLButtonElement>('reward-button'); button.disabled = true; button.textContent = 'CREDIT を補充中…';
  const success = await credits.requestRewardedCredit(requestRewardedCredit);
  if (success) { controller.title(); setScreen('title'); $('play-button')?.focus({ preventScroll: true }); }
  else { setScreen('reward'); $('reward-status').textContent = '補充できませんでした。もう一度お試しください。'; }
}
app.addEventListener('click', event => {
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button'); if (!button || button.disabled) return;
  if (milestoneButtonIds.has(button.id)) {
    const pointer = event as PointerEvent;
    if ((event.detail > 0 || pointer.pointerType) && (!choicePointer || choicePointer.pointerId !== pointer.pointerId || choicePointer.button !== button.id || choicePointer.epoch !== choiceEpoch)) return;
    if (!event.detail && !pointer.pointerType && choiceKeyboardStarted && (choiceKeyboard?.button !== button.id || choiceKeyboard.epoch !== choiceEpoch)) return;
    if (event.detail > 0 || pointer.pointerType) lastChoicePointer = { x: event.clientX, y: event.clientY, at: performance.now() };
    chooseMilestone(button.id); return;
  }
  switch (button.id) {
    case 'play-button': start(); break;
    case 'retry-button': start(true); break;
    case 'title-button': case 'brand-button': title(); break;
    case 'reward-button': void reward(); break;
    case 'mute-button': audio.toggle(); sync(); break;
    case 'pause-button': case 'resume-button': pause(); break;
    case 'how-button': if (state === 'playing') pause(); dialog.showModal(); break;
  }
}, { signal: events.signal });
app.addEventListener('pointerdown', event => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button');
  if (button && milestoneButtonIds.has(button.id) && state === 'milestone' && event.isPrimary && event.button === 0 && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey) choicePointer = { pointerId: event.pointerId, button: button.id, epoch: choiceEpoch };
}, { signal: events.signal });
app.addEventListener('pointercancel', () => { choicePointer = null; }, { signal: events.signal });
app.addEventListener('keydown', event => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button');
  if (!button || !milestoneButtonIds.has(button.id) || (event.key !== 'Enter' && event.key !== ' ')) return;
  if (event.repeat || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) { event.preventDefault(); return; }
  choiceKeyboardStarted = true; choiceKeyboard = { button: button.id, epoch: choiceEpoch };
}, { signal: events.signal });
function closeHow(): void { dialog.close(); }
$('close-how-button').addEventListener('click', closeHow, { signal: events.signal });
$('how-ok-button').addEventListener('click', closeHow, { signal: events.signal });
stage.addEventListener('pointerdown', event => {
  if (!event.isPrimary || event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || dialog.open || (event.target as HTMLElement).closest('button,a') || state !== 'playing') return;
  if (lastChoicePointer && performance.now() - lastChoicePointer.at < 350 && Math.hypot(event.clientX - lastChoicePointer.x, event.clientY - lastChoicePointer.y) < 72) return;
  event.preventDefault(); void audio.unlock();
  const bounds = stage.getBoundingClientRect(); controller.move(event.clientX < bounds.left + bounds.width / 2 ? -1 : 1);
}, { signal: events.signal });
document.addEventListener('keydown', event => {
  if (dialog.open || event.repeat || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) { if (event.key === ' ' || event.key === 'Enter') event.preventDefault(); return; }
  const key = event.key.toLowerCase();
  if (key === 'escape') { if (state === 'playing' || state === 'paused') { event.preventDefault(); pause(); } return; }
  const direction = key === 'arrowleft' || key === 'a' ? -1 : key === 'arrowright' || key === 'd' ? 1 : 0;
  if (direction && state === 'playing') { event.preventDefault(); void audio.unlock(); controller.move(direction); return; }
  if ((key === 'enter' || key === ' ') && !(event.target as HTMLElement).closest('button,a')) {
    if (state === 'title' || state === 'result') { event.preventDefault(); start(state === 'result'); }
    else if (state === 'paused') { event.preventDefault(); pause(); }
  }
}, { signal: events.signal });
document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'playing') pause(); }, { signal: events.signal });
window.addEventListener('blur', () => { choicePointer = null; choiceKeyboard = null; if (state === 'playing') pause(); }, { signal: events.signal });
window.addEventListener('pagehide', event => { choicePointer = null; choiceKeyboard = null; if (!event.persisted) recordQuit(); if (state === 'playing') pause(); }, { signal: events.signal });
telemetry.trackEvent('game_open'); setScreen('title');
if (import.meta.env.DEV) {
  (window as unknown as { __arcadeDebug: unknown }).__arcadeDebug = Object.freeze({
    gameId: 'game002', snapshot: () => controller.snapshot(), inspection: () => controller.inspection(), state: () => state, telemetry: () => telemetry.getEvents(),
  });
}
if (import.meta.hot) import.meta.hot.dispose(() => { onboarding.destroy(); if (resultTimer !== undefined) window.clearTimeout(resultTimer); events.abort(); controller.destroy(); audio.destroy(); });
