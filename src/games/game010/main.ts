import { createOnboarding } from '../../arcade/onboarding';
import './style.css';
import { StorageService } from '../../core/StorageService';
import { CreditService } from '../../core/CreditService';
import { TelemetryService } from '../../core/TelemetryService';
import { AudioService } from '../../core/AudioService';
import { requestRewardedCredit } from '../../core/RewardService';
import { createMeetingGame } from './MeetingBoard';
import { meetingTitle } from './resultFlavor';
import type { MeetingChoice, MeetingEvent, MeetingSnapshot, MeetingResult } from './contracts';

type Screen = 'title' | 'playing' | 'paused' | 'milestone' | 'ending' | 'result' | 'reward';
const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;
const app = $('app'); const overlay = $('overlay');
const storage = new StorageService(undefined, 'web-mini-arcade:v1:game010:');
const telemetry = new TelemetryService(storage, 'game010');
const onboarding = createOnboarding({ gameId: 'game010', storage, telemetry }); const credits = new CreditService(storage, telemetry); const audio = new AudioService(storage);
const listeners = new AbortController();
let state: Screen = 'title'; let runId = ''; let ended = true; let disposed = false;
let best = storage.readNumber('best', 0); let newBest = false; let lastResult: MeetingResult | null = null;
let resultAvailableAt = 0; let resultTimer: ReturnType<typeof window.setTimeout> | undefined;
let offerVisible = false; let milestoneShown = false; let choiceLocked = false; let choiceEpoch = 0;
let pointerApproval: { id: number; button: string; epoch: number } | null = null;
let keyApproval: { button: string; epoch: number } | null = null; let keyboardStarted = false;
const choiceButtons = new Set(['leave-button', 'board-button']);
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
function clock(seconds: number): string { const n = Math.max(0, Math.floor(seconds)); return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`; }
function update(snapshot: MeetingSnapshot): void {
  writeText('score-value', String(snapshot.score)); writeText('meeting-time', clock(snapshot.meetingSeconds)); writeText('real-time-label', `実プレイ ${snapshot.time.toFixed(1)} s`);
  app.dataset.phase = snapshot.phase; app.dataset.attention = snapshot.mode; app.dataset.meeting = snapshot.meetingMode; app.dataset.scoreDigits = String(Math.min(7, Math.max(String(snapshot.score).length, String(best).length)));
  writeText('mode-label', snapshot.meetingMode === 'board' ? '役員会 · ×2' : '通常会議 · ×1');
  writeText('phase-label', state === 'paused' ? '会議も手元の仕事も停止中。準備ができたら再開。' : state === 'milestone' ? '予定時間を超過。続けるか、今日はここまでか。' : snapshot.phase === 'answer' ? 'はい、聞いていました。回答できました。' : snapshot.phase === 'cue' ? snapshot.currentCue?.kind === 'feint' ? '資料確認。こちらへの質問ではありません。' : '「ところで…」質問の予兆。聞く姿勢へ。' : snapshot.phase === 'ended' ? lastResult?.outcome === 'safe_exit' ? '本日の会議はここまで。スコアを確定しました。' : 'すみません、聞いてませんでした。' : snapshot.mode === 'work' ? `内職中。実時間1秒あたり${10 * snapshot.multiplier}点。上司の予兆に注意。` : '聞いている間は安全。内職の時間が得点に。');
}
function setScreen(next: Screen): void {
  if (resultTimer !== undefined) { window.clearTimeout(resultTimer); resultTimer = undefined; }
  state = next; clearApprovals(); sync(); overlay.hidden = next === 'ending';
  if (credits.canPlay || next === 'playing') offerVisible = false;
  if (next === 'playing') {
    overlay.innerHTML = '<article class="minutes play-note"><span class="eyebrow">AGENDA IN PROGRESS</span><h2>Just listening.</h2><p>内職の時間が得点に。<br />質問されたときに聞いていれば、自動で回答。</p><ul><li>「ところで…」とこちらを見る姿勢は、質問の予兆。</li><li>「資料確認」は、こちらへの質問ではありません。</li><li>聞く姿勢は安全ですが、得点は増えません。</li></ul><small>Space / クリック / タップで切替<br />会議時計は実時間の5倍です。</small></article>'; update(controller.snapshot()); return;
  }
  if (next === 'title') {
    writeText('score-value', '0'); writeText('meeting-time', '0:00'); writeText('mode-label', '通常会議 · ×1'); writeText('phase-label', '聞いている間は安全。内職の時間が得点に。'); writeText('real-time-label', '実プレイ 0.0 s'); app.dataset.attention = 'listen'; app.dataset.meeting = 'normal'; app.dataset.phase = 'talk'; app.dataset.scoreDigits = String(Math.min(7, String(best).length));
    overlay.innerHTML = `<article class="minutes start-note"><span class="eyebrow">定例会議 / PLEASE PAY ATTENTION</span><h2 class="game-title">会議、聞いてます？<small>MEETING SURVIVAL</small></h2><p>聞くか、こっそり別の仕事をするか。<br />上司の予兆を読んで、<br />質問の前には聞く姿勢へ。</p><div class="mini-best">BEST SCORE <b>${best}</b></div>${credits.canPlay ? primary('play-button', 'PLAY · 会議へ') : primary('reward-button', '+3 CREDIT')}<small>Space / クリック / タップで切替<br />聞く間は0点、内職は実時間1秒あたり10点。<br />会議5分相当＝実プレイ約60秒です。</small>${credits.canPlay ? '' : stub}</article>`;
  } else if (next === 'paused') {
    update(controller.snapshot()); overlay.innerHTML = `<article class="minutes pause-note"><span class="eyebrow">休憩中 / PAUSED</span><h2>ひと休み。</h2><p>会議も、内職も、時計も停止中。<br />準備ができたら続きから。</p><div class="paired-actions">${primary('resume-button', 'RESUME · 再開')}${titleButton}</div></article>`;
  } else if (next === 'result' && lastResult) {
    const result = lastResult; const safe = result.outcome === 'safe_exit';
    overlay.innerHTML = `<article class="minutes result-note"><div class="result-heading"><span class="result-game-title">会議、聞いてます？<small>MEETING SURVIVAL</small></span><h2>${safe ? '今日はここまで。' : 'すみません、<br />聞いてませんでした。'}</h2><p class="result-reason">${safe ? 'スコアを確定。自由にもう一度遊べます。' : result.reason}</p></div><div class="result-score"><b id="result-score">${result.score}</b><span>WORK SCORE</span>${newBest ? '<mark class="new-best">NEW BEST</mark>' : ''}</div><dl class="result-details"><div><dt>BEST</dt><dd id="result-best">${best}</dd></div><div><dt>会議換算 · 5倍</dt><dd>${clock(result.meetingSeconds)}</dd></div><div><dt>実プレイ</dt><dd>${result.time.toFixed(1)} s</dd></div><div><dt>CREDIT</dt><dd>${credits.credits}/3</dd></div></dl><div class="meeting-title"><small>${result.meetingMode === 'board' ? '役員会 · ×2' : '通常会議 · ×1'} / 今回の称号</small><b id="meeting-title">${meetingTitle(result.score, result.meetingMode)}</b></div><div class="paired-actions">${credits.canPlay ? primary('retry-button', 'RETRY · もう1回') : primary('reward-button', '+3 CREDIT')}${titleButton}</div><small>${credits.canPlay ? `回答 ${result.answered}回 · 内職 ${result.workSeconds.toFixed(1)} s` : 'NO CREDIT · 開発版 Rewarded Ad Stub'}</small></article>`;
  } else if (next === 'reward') {
    overlay.innerHTML = `<article class="minutes reward-note"><span class="eyebrow">次の議題へ / ONE MORE MEETING</span><h2>もうひと会議？</h2><p>開発版の補充ボタンで<br /><b>+3 CREDIT</b></p><div class="paired-actions">${primary('reward-button', '+3 CREDIT')}${titleButton}</div>${stub}<p id="reward-status" role="status"></p></article>`;
  }
  trackOffer();
}
function showMilestone(): void {
  const snapshot = controller.snapshot(); if (!snapshot.pending) return;
  choiceEpoch += 1; choiceLocked = false; keyboardStarted = false; setScreen('milestone');
  overlay.innerHTML = `<article class="minutes choice-note"><span class="eyebrow">会議5分相当 / 実プレイ約60秒</span><h2>会議が予定時間を超過しました。<br />役員も参加するそうです。</h2><div class="choice-terms"><b>今日はここまで：</b>スコア確定、自由にもう一度遊べます。<br /><b>続ける：</b>役員会へ。これからの内職得点が2倍（実時間1秒20点）。質問は増え、予兆は最短0.9秒。<small>今までの得点はそのまま。<br />続行時はLISTENから再開。今の予兆と会議時間は引き継ぎます。</small></div><div class="choice-actions">${primary('leave-button', '今日はここまで')}${primary('board-button', '続ける')}${titleButton}</div><small>会議も時計も停止中。選ぶまで進みません。</small></article>`;
  if (!milestoneShown) { milestoneShown = true; telemetry.trackEvent('milestone_reached', { runId, milestone: 'overtime', meetingSeconds: snapshot.meetingSeconds, time: snapshot.time }); telemetry.trackEvent('escalation_offered', { runId, milestone: 'overtime' }); }
  update(snapshot);
}
function chooseMode(choice: MeetingChoice): void {
  if (state !== 'milestone' || ended || choiceLocked || credits.rewardPending || !controller.snapshot().pending) return;
  choiceLocked = true; clearApprovals(); if (!controller.choose(choice)) { choiceLocked = false; return; }
  if (ended || state !== 'milestone') return;
  if (choice === 'board') telemetry.trackEvent('escalation_accepted', { runId, milestone: 'overtime', choice }); setScreen('playing');
}
function sound(event: MeetingEvent): void {
  if (event.type === 'toggle') audio.tone(event.mode === 'listen' ? 450 : 340, event.mode === 'listen' ? 450 : 330, 0.05, 'sine', 0, 0.016);
  if (event.type === 'cue' && event.cue.kind === 'question') audio.tone(600, 680, 0.08, 'sine', 0, 0.022);
  if (event.type === 'answer') audio.tone(520, 670, 0.09, 'triangle', 0, 0.022);
  if (event.type === 'caught') audio.tone(260, 125, 0.2, 'sine', 0, 0.035);
}
const controller = createMeetingGame($('game-canvas'), {
  onUpdate(snapshot) { if (snapshot.pending && state === 'playing') showMilestone(); if (state === 'playing' || state === 'paused' || state === 'milestone' || state === 'ending') update(snapshot); },
  onEvent: sound,
  onEnd(result) {
    if ((state !== 'playing' && state !== 'milestone') || ended || disposed) return;
    ended = true; lastResult = result; newBest = result.score > best; best = Math.max(best, result.score); storage.writeNumber('best', best);
    const safe = result.outcome === 'safe_exit'; if (!safe) credits.consume(runId); else telemetry.trackEvent('safe_exit', { runId, score: result.score, time: result.time, milestone: 'overtime' });
    telemetry.trackEvent('run_end', { runId, outcome: safe ? 'safe_exit' : 'over', score: result.score, time: result.time, meetingSeconds: result.meetingSeconds, meetingMode: result.meetingMode, answered: result.answered, workSeconds: result.workSeconds });
    telemetry.trackEvent('score', { runId, score: result.score, best, newBest, meetingMode: result.meetingMode }); telemetry.trackEvent('run_duration', { runId, seconds: result.time, reason: safe ? 'safe_exit' : 'over', failure_reason: safe ? 'none' : 'caught' });
    resultAvailableAt = performance.now() + 300; setScreen('ending');
    resultTimer = window.setTimeout(() => { resultTimer = undefined; if (!disposed && state === 'ending') { resultAvailableAt = performance.now(); setScreen('result'); overlay.querySelector<HTMLButtonElement>('.primary')?.focus({ preventScroll: true }); } }, 300);
  },
});
function start(retry = false): void {
  if (onboarding.intercept(() => start(retry))) return;
  if (disposed || credits.rewardPending || state === 'playing' || state === 'paused' || state === 'milestone' || state === 'ending' || (state === 'result' && performance.now() < resultAvailableAt)) return;
  if (!credits.canPlay) { setScreen('reward'); return; }
  void audio.unlock(); runId = `game010-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; ended = false; lastResult = null; newBest = false; milestoneShown = false; choiceEpoch += 1; choiceLocked = false; clearApprovals();
  if (retry) telemetry.trackEvent('retry', { runId }); telemetry.trackEvent('run_start', { runId, credits: credits.credits }); setScreen('playing'); controller.start();
}
function pause(): void {
  if (state === 'playing') { controller.pause(true); telemetry.trackEvent('pause', { runId }); setScreen('paused'); }
  else if (state === 'paused') { void audio.unlock(); controller.pause(false); telemetry.trackEvent('resume', { runId }); setScreen('playing'); }
}
function recordQuit(): void {
  if ((state !== 'playing' && state !== 'paused' && state !== 'milestone') || ended) return;
  ended = true; const snapshot = controller.snapshot(); telemetry.trackEvent('quit', { runId, score: snapshot.score, time: snapshot.time }); telemetry.trackEvent('run_end', { runId, outcome: 'quit', score: snapshot.score, time: snapshot.time, meetingSeconds: snapshot.meetingSeconds, meetingMode: snapshot.meetingMode }); telemetry.trackEvent('run_duration', { runId, seconds: snapshot.time, reason: 'quit' });
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
    clearApprovals(); chooseMode(button.id === 'board-button' ? 'board' : 'leave'); return;
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
if (import.meta.env.DEV) (window as unknown as { __arcadeDebug: unknown }).__arcadeDebug = Object.freeze({ gameId: 'game010', snapshot: () => controller.snapshot(), inspection: () => controller.inspection(), state: () => state, telemetry: () => telemetry.getEvents() });
if (import.meta.hot) import.meta.hot.dispose(() => { onboarding.destroy(); disposed = true; if (resultTimer !== undefined) window.clearTimeout(resultTimer); listeners.abort(); controller.destroy(); audio.destroy(); delete (window as unknown as { __arcadeDebug?: unknown }).__arcadeDebug; });
