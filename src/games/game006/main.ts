import { createGameRecordSession } from '../../records/RecordSharing';
import './style.css';
import { StorageService } from '../../core/StorageService';
import { CreditService } from '../../core/CreditService';
import { TelemetryService } from '../../core/TelemetryService';
import { AudioService } from '../../core/AudioService';
import { requestRewardedCredit } from '../../core/RewardService';
import { createParkingGame } from './ParkingScene';
import { parkingTitle } from './resultFlavor';
import type { ParkingChoice, ParkingEvent, ParkingSnapshot, ParkingResult, ParkingSlotKind } from './contracts';
const recordSession = createGameRecordSession('game006');

type Screen = 'explain' | 'practice' | 'practice-success' | 'title' | 'playing' | 'paused' | 'milestone' | 'result' | 'reward';
const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;
const app = $('app'); const stage = $('stage'); const overlay = $('overlay');
const storage = new StorageService(undefined, 'web-mini-arcade:v1:game006:');
const telemetry = new TelemetryService(storage, 'game006');
const legacyBest = storage.readNumber('best', 0);
let practiceStep = 0; let practicePaused = false; let heldKey = false; let heldPointer: number | null = null;
let driveInputArmed = false; let freshGesture = false;
const credits = new CreditService(storage, telemetry); const audio = new AudioService(storage);
const listeners = new AbortController();
let state: Screen = 'title'; let runId = ''; let ended = true; let disposed = false;
let best = storage.readNumber('best-rules-v2', 0); let newBest = false; let lastResult: ParkingResult | null = null;
let resultAvailableAt = 0; let resultTimer: ReturnType<typeof window.setTimeout> | undefined;
let offerVisible = false; let milestoneShown = false; let choiceLocked = false; let choiceEpoch = 0;
let lastLayoutParked = '';
let pointerApproval: { id: number; button: string; phase: string; layout: number; epoch: number } | null = null;
let keyApproval: { button: string; phase: string; layout: number; epoch: number } | null = null;
let keyboardStarted = false;
let lastChoicePointer: { x: number; y: number; at: number } | null = null;
const guardedButtons = new Set(['action-button', 'normal-button', 'forbidden-button', 'slot-safe-button', 'slot-challenge-button']);
const primary = (id: string, text: string) => `<button id="${id}" type="button" class="primary">${text}<span aria-hidden="true">→</span></button>`;
const titleButton = '<button id="title-button" type="button" class="secondary" aria-label="タイトルに戻る">タイトル</button>';
const stub = '<small class="stub-note">開発版 Rewarded Ad Stub<br />本番広告は表示されません。</small>';
const writeText = (id: string, value: string): void => { const element = $(id); if (element && element.textContent !== value) element.textContent = value; };
function clearApprovals(): void { pointerApproval = null; keyApproval = null; }
function trackOffer(): void {
  if (!credits.canPlay && !offerVisible && $('reward-button')) { offerVisible = true; telemetry.trackEvent('reward_offer_shown', { runId }); }
}
function sync(): void {
  app.dataset.state = state; app.dataset.scoreDigits = String(Math.min(7, Math.max(String(best).length, String(controller.snapshot().score).length))); writeText('credit-count', String(credits.credits));
  writeText('credit-dots', Array.from({ length: 3 }, (_, i) => i < credits.credits ? '●' : '○').join(' '));
  writeText('best-value', String(best)); writeText('mute-button', audio.muted ? '音 OFF' : '音 ON');
  $('mute-button').setAttribute('aria-label', audio.muted ? '音声をオンにする' : '音声をミュート'); $('mute-button').setAttribute('aria-pressed', String(audio.muted));
  const pauseButton = $<HTMLButtonElement>('pause-button'); pauseButton.disabled = state !== 'playing' && state !== 'practice' && state !== 'paused'; pauseButton.textContent = state === 'paused' ? '▶' : 'Ⅱ'; pauseButton.setAttribute('aria-label', state === 'paused' ? '再開' : '一時停止');
  $<HTMLButtonElement>('action-button').disabled = state !== 'playing' && state !== 'practice';
}
function update(snapshot: ParkingSnapshot): void {
  app.dataset.scoreDigits = String(Math.min(7, Math.max(String(best).length, String(snapshot.score).length)));
  writeText('stage-hud', `${state === 'practice' ? '練習' : 'SCORE'} ${snapshot.score} · ${snapshot.parked}台 · BEST V2 ${best}`);
  writeText('score-value', String(snapshot.score)); writeText('parked-value', String(snapshot.parked));
  if (app.dataset.phase !== snapshot.phase) app.dataset.phase = snapshot.phase;
  if (app.dataset.mode !== snapshot.mode) app.dataset.mode = snapshot.mode;
  writeText('mode-label', snapshot.mode === 'forbidden' ? '禁断駐車 · SCORE ×2' : '通常駐車');
  writeText('multiplier-label', `PERFECT ${snapshot.perfectCount} · 連続倍率 ×${snapshot.streakMultiplier.toFixed(2)}${snapshot.mode === 'forbidden' ? ' · 禁断 ×2' : ''}`);
  const angle = snapshot.lockedSteering ?? snapshot.steeringDegrees; const power = snapshot.lockedPower ?? snapshot.power;
  writeText('angle-value', `${angle >= 0 ? '+' : ''}${angle.toFixed(1)}°`); writeText('power-value', `${Math.round(power * 100)}%`);
  $('angle-needle').style.left = `${Math.max(0, Math.min(100, (angle + 38) / 76 * 100))}%`; $('power-fill').style.width = `${Math.max(0, Math.min(100, power * 100))}%`;
  writeText('angle-lock', snapshot.lockedSteering === null ? 'SPACEで確定' : '角度は確定済み'); writeText('power-lock', snapshot.lockedPower === null ? snapshot.phase === 'angle' ? '角度の次に確定' : 'SPACEで発進' : '強さは確定済み');
  const ready = (state === 'playing' || state === 'practice') && snapshot.alive && (snapshot.phase === 'angle' || snapshot.phase === 'power' || snapshot.phase === 'driving' && !snapshot.brakeUsed);
  $('slot-controls').hidden = !((state === 'playing' || state === 'practice') && snapshot.phase === 'slot-choice');
  $('action-button').hidden = snapshot.phase === 'slot-choice';
  if (snapshot.phase === 'driving' && !heldKey && heldPointer === null) driveInputArmed = true;
  if (snapshot.phase !== 'driving') driveInputArmed = false;
  const actionButton = $<HTMLButtonElement>('action-button'); actionButton.disabled = !ready;
  const action = snapshot.phase === 'angle' ? '角度を決める' : snapshot.phase === 'power' ? '強さを決める' : snapshot.phase === 'driving' ? snapshot.brakeUsed ? '制動中…' : 'ブレーキ' : snapshot.phase === 'slot-choice' ? '枠を選ぶ' : snapshot.phase === 'parked' ? '駐車完了' : '決める';
  if (actionButton.dataset.label !== action) { actionButton.dataset.label = action; actionButton.innerHTML = `${action}<span aria-hidden="true">SPACE / TAP</span>`; actionButton.setAttribute('aria-label', action); }
  writeText('step-value', state === 'paused' ? 'ひと休み。' : state === 'milestone' ? '狭い枠、どうする？' : snapshot.phase === 'angle' ? 'STEP 1 · 角度を決める' : snapshot.phase === 'power' ? 'STEP 2 · 強さを決める' : snapshot.phase === 'driving' ? snapshot.brakeUsed ? '制動中 · 1度だけ' : 'もう一度入力でブレーキ' : snapshot.phase === 'slot-choice' ? '先に枠を指定する' : snapshot.phase === 'parked' ? snapshot.grade ?? '駐車完了' : '2回で駐車。');
  writeText('step-hint', state === 'paused' || state === 'milestone' ? '車も時計も停止中' : snapshot.phase === 'angle' ? '枠に向かう角度を狙おう' : snapshot.phase === 'power' ? '点線の到達位置をよく見て' : snapshot.phase === 'parked' ? `余裕 ${snapshot.precision?.margin.toFixed(1)}px` : snapshot.phase === 'slot-choice' ? '安全 ×1 / 挑戦 ×1.4 · 指定外は対象外' : '角度を決める → 強さを決める');
  if (state === 'practice') { writeText('step-value', `練習 ${practiceStep+1}/3 · ${snapshot.phase === 'driving' ? 'ブレーキはもう一度' : snapshot.phase === 'slot-choice' ? '安全か挑戦を指定' : snapshot.phase === 'angle' ? '角度を決める' : '強さを決める'}`); writeText('step-hint', practiceStep === 0 ? '角度0° → 54%前後で駐車' : practiceStep === 1 ? '角度0° → 85%前後 → 枠の手前で制動' : '枠を指定 → 角度と強さで入れよう'); }
  writeText('play-step', snapshot.phase === 'angle' ? 'まずは、向きを。' : snapshot.phase === 'power' ? '次に、進む強さを。' : snapshot.phase === 'parked' ? snapshot.grade ?? '駐車完了' : '枠の中へ、まっすぐ。');
  writeText('locked-angle', snapshot.lockedSteering === null ? 'まだ決めていません' : `${snapshot.lockedSteering.toFixed(1)}°`);
  writeText('locked-power', snapshot.lockedPower === null ? 'まだ決めていません' : `${Math.round(snapshot.lockedPower * 100)}%`);
  const lotKey = `${snapshot.parked}:${snapshot.slotKind}:${snapshot.phase}`;
  if (lotKey !== lastLayoutParked) { lastLayoutParked = lotKey; const layout = controller.inspection().layout; writeText('lot-label', `PARKING ${String(layout.id + 1).padStart(3, '0')} / ${snapshot.phase === 'slot-choice' ? '枠を選ぶ' : layout.name}`); }
}
function setScreen(next: Screen, delayResult = false): void {
  if (resultTimer !== undefined) { window.clearTimeout(resultTimer); resultTimer = undefined; }
  state = next; clearApprovals(); sync();
  if (credits.canPlay || next === 'playing') offerVisible = false;
  if (next === 'playing' || next === 'practice') {
    overlay.innerHTML = '<article class="ticket play-ticket"><span class="eyebrow">ONE BAY / TWO DECISIONS + BRAKE</span><h2 id="play-step">まずは、向きを。</h2><p>1回目で角度を確定。<br />2回目で強さを確定して発進。<br />指定枠に全体が入れば成功。走行中の新入力で、一度だけブレーキ。</p><dl><dt>確定した角度</dt><dd id="locked-angle">まだ決めていません</dd><dt>確定した強さ</dt><dd id="locked-power">まだ決めていません</dd></dl><small>点線は、今の設定での軌道予測。<br />急がず、2回を別々に決めよう。</small></article>';
    if (next === 'practice') overlay.innerHTML = `<article class="ticket play-ticket"><span class="eyebrow">PRACTICE ${practiceStep+1}/3</span><h2>${['角度 → 強さ','止めどころを読む','枠を指定する'][practiceStep]}</h2><p>${['角度0°・強さ54%前後で、車全体を枠へ。','角度0°・強さ85%前後。枠の少し手前で、新しい入力からブレーキ。','先に安全／挑戦を指定。指定した枠だけがゴールです。'][practiceStep]}</p><small>練習のスコアはBESTに保存されません。<br />ヘッダーのタイトルからいつでもスキップ。</small></article>`;
    update(controller.snapshot()); stage.focus({ preventScroll: true }); return;
  }
  if (next === 'title') {
    writeText('score-value', '0'); writeText('parked-value', '0'); writeText('angle-value', '—'); writeText('power-value', '—'); writeText('step-value', '2回で駐車。'); writeText('step-hint', '角度を決める → 強さを決める'); writeText('mode-label', '通常駐車'); writeText('lot-label', 'PARKING LOT / 001'); writeText('multiplier-label', '精度と連続PERFECTでスコアUP'); writeText('angle-lock', 'SPACEで確定'); writeText('power-lock', '角度の次に確定'); $('action-button').innerHTML = '角度を決める<span aria-hidden="true">SPACE / TAP</span>'; $('action-button').dataset.label = '角度を決める'; $('action-button').setAttribute('aria-label', '角度を決める'); app.dataset.mode = 'normal'; app.dataset.phase = 'ended'; $('angle-needle').style.left = '50%'; $('power-fill').style.width = '0%';
    overlay.innerHTML = `<article class="ticket start-ticket"><span class="eyebrow">PARKING TICKET / 006</span><h2 class="game-title">ギリギリ駐車<small>PARK IT!</small></h2><p>角度を決めて、強さを決める。<br />枠を選んで、ぴたりと止める。</p><div class="mini-best">BEST SCORE <b>${best}</b></div>${credits.canPlay ? primary('play-button', 'すぐ遊ぶ') : primary('reward-button', '+3 CREDIT')}<div class="local-start-options"><button id="tutorial-explain-button" class="secondary" type="button">説明を見る</button><button id="tutorial-again-button" class="secondary" type="button">練習する</button></div><small>新ルール V2${legacyBest ? ` · 旧BEST ${legacyBest}（旧ルール）` : ''}</small><small>Space / クリック / タップ<br />精度と連続PERFECTでスコアUP</small>${credits.canPlay ? '' : stub}</article>`;
  } else if (next === 'explain') {
    overlay.innerHTML = `<article class="ticket explain-ticket"><span class="eyebrow">PARKING / V2</span><h2>選んで、止める。</h2><p>1. 角度を決める。<br />2. 強さを決めて発進。<br />3. 必要なら、新しい入力で一度だけブレーキ。<br />方向は変わらず、少し進んでから止まります。</p><p>最初の3台は単一枠。以降は安全 ×1／挑戦 ×1.4を先に指定。薄い枠は対象外です。</p><p>精度が主役。ノーブレーキ成功は+10%、接触なしのギリギリ通過は最大+20。失敗には追加点が入りません。</p>${primary('tutorial-again-button','練習する')}${titleButton}</article>`;
  } else if (next === 'practice-success') {
    overlay.innerHTML = `<article class="ticket practice-success-ticket"><span class="eyebrow">PRACTICE ${practiceStep+1}/3</span><h2>入りました！</h2><p>${['角度と強さで円弧が決まりました。','同じ曲線で、少し進んでから制動できました。','指定した枠に収まりました。'][practiceStep]}<br />練習の得点とBESTは本番から独立。</p>${primary('practice-next-button',practiceStep < 2 ? '次の練習へ' : 'タイトルへ')}${titleButton}</article>`;
  } else if (next === 'paused') {
    update(controller.snapshot()); overlay.innerHTML = `<article class="ticket pause-ticket"><span class="eyebrow">ENGINE OFF / PAUSED</span><h2>ひと休み。</h2><p>車も計器も、時間も停止中。<br />準備ができたら続きから。</p><div class="ticket-actions">${primary('resume-button', 'RESUME · 再開')}${titleButton}</div></article>`;
  } else if (next === 'result' && lastResult) {
    const result = lastResult;
    overlay.innerHTML = `<article class="ticket result-ticket"><div class="result-heading"><span class="result-game-title">ギリギリ駐車<small>PARK IT!</small></span><h2>${result.outcome === 'collision' ? 'あ、ぶつかった。' : '枠から、はみ出した。'}</h2><p class="result-reason">${result.reason}</p></div><div class="result-score"><b id="result-score">${result.score}</b><span>SCORE V2</span>${newBest ? '<mark class="new-best">NEW BEST</mark>' : ''}</div><dl class="result-details"><div><dt>BEST V2</dt><dd id="result-best">${best}</dd></div><div><dt>駐車成功</dt><dd>${result.parked} 台</dd></div><div><dt>PERFECT</dt><dd>${result.perfectCount} 回</dd></div><div><dt>最大連続</dt><dd>${result.maxStreak} 回</dd></div><div><dt>TIME</dt><dd>${result.time.toFixed(1)} s</dd></div></dl><div class="driver-title"><small>${result.mode === 'forbidden' ? '禁断駐車 · 今回の称号' : '今回の称号'}</small><b id="driver-title">${parkingTitle(result.parked)}</b></div><div class="ticket-actions">${credits.canPlay ? primary('retry-button', 'RETRY · もう1回') : primary('reward-button', '+3 CREDIT')}${titleButton}</div><small>${credits.canPlay ? '次は、もう1台ぴたりと。' : 'NO CREDIT · 開発版 Rewarded Ad Stub'}</small></article>`;
    recordSession.mount(overlay.firstElementChild as HTMLElement);
    if (delayResult) {
      overlay.hidden = true; resultTimer = window.setTimeout(() => { resultTimer = undefined; if (!disposed && state === 'result') { overlay.hidden = false; trackOffer(); overlay.querySelector<HTMLButtonElement>('.primary')?.focus({ preventScroll: true }); } }, 300);
    }
  } else if (next === 'reward') {
    overlay.innerHTML = `<article class="ticket reward-ticket"><span class="eyebrow">REISSUE PARKING TICKET</span><h2>もうひと駐車？</h2><p>開発版の補充ボタンで<br /><b>+3 CREDIT</b></p><div class="ticket-actions">${primary('reward-button', '+3 CREDIT')}${titleButton}</div>${stub}<p id="reward-status" role="status"></p></article>`;
  }
  if (!delayResult) { overlay.hidden = false; trackOffer(); }
}
function showMilestone(): void {
  choiceEpoch += 1; choiceLocked = false; keyboardStarted = false; setScreen('milestone');
  overlay.innerHTML = `<article class="ticket milestone-ticket"><span class="eyebrow">10 CARS / A STRANGE PARKING BAY</span><h2>そこ、本当に<br />駐車スペースですか？</h2><p>入ると、このRUNは禁断駐車モードへ。<br />スコアは2倍。でも、枠はとても狭くなります。</p><div class="risk-terms"><span>禁断駐車<b>SCORE ×2</b></span><span>余裕は、ほんの少し<b>極狭スペース</b></span></div><div class="choice-actions">${primary('normal-button', 'やめておく')}${primary('forbidden-button', '入る')}</div>${titleButton}<small>やめておくと通常スペースへ。<br />車も時間も停止中。選択は自由にもう一度遊べます。</small></article>`;
  if (!milestoneShown) { milestoneShown = true; telemetry.trackEvent('milestone_reached', { runId, milestone: 'parked10', parked: controller.snapshot().parked }); telemetry.trackEvent('escalation_offered', { runId, milestone: 'parked10' }); }
  update(controller.snapshot());
}
function chooseMode(choice: ParkingChoice): void {
  if (state !== 'milestone' || ended || choiceLocked || credits.rewardPending || !controller.snapshot().pending) return;
  choiceLocked = true; clearApprovals();
  if (!controller.choose(choice)) { choiceLocked = false; return; }
  if (choice === 'forbidden') telemetry.trackEvent('escalation_accepted', { runId, milestone: 'parked10', choice });
  lastLayoutParked = ''; setScreen('playing');
}
function sound(event: ParkingEvent): void {
  if (event.type === 'angle') audio.tone(280, 410, 0.075, 'sine', 0, 0.03);
  if (event.type === 'launch') { audio.tone(170, 350, 0.15, 'triangle', 0, 0.04); audio.tone(350, 420, 0.11, 'sine', 0.07, 0.02); }
  if (event.type === 'park') { const pitch = event.grade === 'PERFECT PARK' ? 780 : event.grade === 'GREAT' ? 640 : 520; audio.tone(pitch, pitch * 1.25, 0.13, 'sine', 0, 0.035); if (event.grade === 'PERFECT PARK') audio.tone(pitch * 1.5, pitch * 1.5, 0.16, 'triangle', 0.075, 0.025); }
  if (event.type === 'failure') { audio.tone(170, 65, 0.24, 'triangle', 0, 0.035); audio.tone(95, 45, 0.21, 'sine', 0.03, 0.02); }
}
const controller = createParkingGame($('game-canvas'), {
  onUpdate(snapshot) { if (state === 'practice' && snapshot.phase === 'parked') {
      if (practiceStep === 1 && !snapshot.brakeUsed) { controller.pause(true); setScreen('practice-success'); overlay.innerHTML = `<article class="ticket"><h2>今度はブレーキ。</h2><p>発進後に新しい入力で一度だけ制動し、枠へ止めよう。</p>${primary('practice-repeat-button','もう一度')}${titleButton}</article>`; return; }
      controller.pause(true); telemetry.trackEvent('tutorial_step_complete',{step:practiceStep+1,rulesVersion:2}); setScreen('practice-success'); return;
    } if (snapshot.pending && state === 'playing') showMilestone(); if (state === 'playing' || state === 'practice' || state === 'paused' || state === 'milestone') update(snapshot); },
  onEvent(event) { sound(event);
    if (state === 'playing' && !ended) telemetry.trackEvent('specific_game_events', {runId, rulesVersion:2, ...event, event: event.type});
  },
  onEnd(result) {
    if (state === 'practice') { controller.pause(true); setScreen('practice-success'); overlay.innerHTML = `<article class="ticket"><h2>もう一度、試そう。</h2><p>${result.reason}</p>${primary('practice-repeat-button','同じ練習を再開')}${titleButton}</article>`; return; }
    if ((state !== 'playing' && state !== 'milestone') || ended || disposed) return;
    ended = true; lastResult = result; newBest = result.score > best; best = Math.max(best, result.score); storage.writeNumber('best-rules-v2', best); credits.consume(runId); recordSession.complete(result.score, { metadata: { duration_seconds: result.time, outcome: result.outcome } });
    telemetry.trackEvent('run_end', { runId, outcome: 'over', score: result.score, time: result.time, parked: result.parked, perfectCount: result.perfectCount, maxStreak: result.maxStreak, mode: result.mode, rulesVersion:2, failureCause:result.cause, brakeUsed:result.brakeUsed, slot:result.slotKind });
    telemetry.trackEvent('score', { runId, rulesVersion: 2, score: result.score, best, newBest, parked: result.parked }); telemetry.trackEvent('run_duration', { runId, rulesVersion: 2, seconds: result.time, reason: 'over', failure_reason: result.outcome });
    update(controller.snapshot()); resultAvailableAt = performance.now() + 300; setScreen('result', true);
  },
});
function start(retry = false): void {
  if (state === 'practice' || state === 'practice-success' || state === 'explain') return;
  if (disposed || credits.rewardPending || state === 'playing' || state === 'paused' || state === 'milestone' || (state === 'result' && performance.now() < resultAvailableAt)) return;
  if (!credits.canPlay) { setScreen('reward'); return; }
  void audio.unlock(); runId = `game006-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; ended = false; lastResult = null; newBest = false; milestoneShown = false; choiceEpoch += 1; choiceLocked = false; lastLayoutParked = ''; clearApprovals();
  if (retry) telemetry.trackEvent('retry', { runId, rulesVersion: 2 }); recordSession.startRun(); telemetry.trackEvent('run_start', { runId, credits: credits.credits, rulesVersion: 2 }); setScreen('playing'); controller.start();
}
function act(): void {
  if ((state !== 'playing' && state !== 'practice') || state === 'playing' && ended) return;
  if (!freshGesture) return;
  const phase = controller.snapshot().phase;
  if (phase === 'driving' && (!driveInputArmed || !freshGesture)) return;
  if (phase !== 'angle' && phase !== 'power' && phase !== 'driving') return;
  void audio.unlock(); controller.act(); if (phase === 'power' || phase === 'driving') driveInputArmed = false;
}
function chooseSlot(choice: ParkingSlotKind): void { if ((state === 'playing' || state === 'practice') && controller.chooseSlot(choice)) { clearApprovals(); update(controller.snapshot()); stage.focus({preventScroll:true}); } }
function practice(step = 0): void {
  recordQuit(); practiceStep = step; practicePaused = false; ended = true; clearApprovals(); driveInputArmed = false; telemetry.trackEvent('practice_start',{step:step+1,rulesVersion:2});
  setScreen('practice'); controller.startPractice(step);
}

function pause(): void {
  if (state === 'playing' || state === 'practice') { practicePaused = state === 'practice'; heldKey = false; heldPointer = null; freshGesture = false; driveInputArmed = false; controller.pause(true); telemetry.trackEvent('pause', { runId }); setScreen('paused'); }
  else if (state === 'paused') { void audio.unlock(); controller.pause(false); telemetry.trackEvent('resume', { runId }); setScreen(practicePaused ? 'practice' : 'playing'); }
}
function recordQuit(): void {
  if ((state !== 'playing' && state !== 'practice' && state !== 'paused' && state !== 'milestone') || ended) return;
  ended = true; const snapshot = controller.snapshot(); telemetry.trackEvent('quit', { runId, rulesVersion: 2, score: snapshot.score, time: snapshot.time }); telemetry.trackEvent('run_end', { runId, rulesVersion: 2, outcome: 'quit', score: snapshot.score, time: snapshot.time, parked: snapshot.parked, mode: snapshot.mode }); telemetry.trackEvent('run_duration', { runId, rulesVersion: 2, seconds: snapshot.time, reason: 'quit' });
}
function title(): void { if (credits.rewardPending || (state === 'result' && performance.now() < resultAvailableAt)) return; recordQuit(); controller.title(); lastResult = null; newBest = false; setScreen('title'); }
async function reward(): Promise<void> {
  if (disposed || credits.rewardPending || credits.canPlay || (state === 'result' && performance.now() < resultAvailableAt)) return;
  if (state !== 'reward') setScreen('reward');
  $<HTMLButtonElement>('reward-button').disabled = true; $('reward-button').textContent = 'CREDIT を補充中…'; $<HTMLButtonElement>('title-button').disabled = true; $<HTMLButtonElement>('brand-button').disabled = true;
  const success = await credits.requestRewardedCredit(requestRewardedCredit); if (disposed) return;
  $<HTMLButtonElement>('brand-button').disabled = false;
  if (success) { controller.title(); setScreen('title'); $('play-button')?.focus({ preventScroll: true }); }
  else { setScreen('reward'); writeText('reward-status', '補充できませんでした。もう一度お試しください。'); }
}
function recentChoice(event: { clientX: number; clientY: number }): boolean { return !!lastChoicePointer && performance.now() - lastChoicePointer.at < 350 && Math.hypot(event.clientX - lastChoicePointer.x, event.clientY - lastChoicePointer.y) < 72; }
function inputEpoch(): { phase: string; layout: number; epoch: number } { const snapshot = controller.snapshot(); return { phase: state === 'milestone' ? 'choice' : snapshot.phase, layout: controller.inspection().layout.id, epoch: choiceEpoch }; }
app.addEventListener('click', event => {
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || (state === 'result' && performance.now() < resultAvailableAt)) return;
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button'); if (!button || button.disabled) return;
  if (guardedButtons.has(button.id)) {
    const expected = inputEpoch(); const pointer = event as PointerEvent; const fromPointer = !!event.detail || !!pointer.pointerType;
    if (fromPointer && (!pointerApproval || pointerApproval.id !== pointer.pointerId || pointerApproval.button !== button.id || pointerApproval.phase !== expected.phase || pointerApproval.layout !== expected.layout || pointerApproval.epoch !== expected.epoch)) return;
    if (!fromPointer && keyboardStarted && (!keyApproval || keyApproval.button !== button.id || keyApproval.phase !== expected.phase || keyApproval.layout !== expected.layout || keyApproval.epoch !== expected.epoch)) return;
    if (button.id === 'slot-safe-button' || button.id === 'slot-challenge-button') { clearApprovals(); chooseSlot(button.id === 'slot-safe-button' ? 'safe' : 'challenge'); }
    else if (button.id === 'action-button') { if (fromPointer && recentChoice(event)) return; clearApprovals(); act(); }
    else { if (fromPointer) lastChoicePointer = { x: event.clientX, y: event.clientY, at: performance.now() }; clearApprovals(); chooseMode(button.id === 'forbidden-button' ? 'forbidden' : 'normal'); }
    return;
  }
  switch (button.id) {
    case 'tutorial-explain-button': setScreen('explain'); telemetry.trackEvent('tutorial_view',{rulesVersion:2}); break;
    case 'tutorial-again-button': practice(); break;
    case 'practice-repeat-button': practice(practiceStep); break;
    case 'practice-next-button': if (practiceStep < 2) practice(practiceStep+1); else { storage.writeBoolean('tutorialCompleted-rules-v2',true); telemetry.trackEvent('practice_complete',{rulesVersion:2}); title(); } break;
    case 'play-button': start(); break; case 'retry-button': start(true); break; case 'title-button': case 'brand-button': title(); break; case 'reward-button': void reward(); break;
    case 'mute-button': audio.toggle(); sync(); if (state === 'playing') update(controller.snapshot()); break; case 'pause-button': case 'resume-button': pause(); break;
  }
}, { signal: listeners.signal });
app.addEventListener('pointerdown', event => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button'); if (!button || button.disabled || !guardedButtons.has(button.id) || !event.isPrimary || event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  freshGesture = heldPointer === null && !heldKey; heldPointer = event.pointerId;
  pointerApproval = { id: event.pointerId, button: button.id, ...inputEpoch() };
}, { signal: listeners.signal });
app.addEventListener('pointercancel', () => { pointerApproval = null; }, { signal: listeners.signal });
app.addEventListener('keydown', event => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button'); if (!button || button.disabled || !guardedButtons.has(button.id) || (event.key !== ' ' && event.key !== 'Enter')) return;
  if (event.repeat || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) { event.preventDefault(); return; }
  freshGesture = !heldKey && heldPointer === null; heldKey = true;
  keyboardStarted = true; keyApproval = { button: button.id, ...inputEpoch() };
}, { signal: listeners.signal });
stage.addEventListener('pointerdown', event => {
  if (!event.isPrimary || event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || (state !== 'playing' && state !== 'practice') || (event.target as HTMLElement).closest('button,a') || recentChoice(event)) return;
  freshGesture = heldPointer === null && !heldKey; heldPointer = event.pointerId; event.preventDefault(); act();
}, { signal: listeners.signal });
document.addEventListener('keydown', event => {
  const action = event.key === ' ' || event.key === 'Enter';
  if (event.repeat || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) { if (action) event.preventDefault(); return; }
  if (event.key === 'Escape' && (state === 'playing' || state === 'practice' || state === 'paused')) { event.preventDefault(); pause(); return; }
  if (!action || (event.target as HTMLElement).closest('button,a')) return;
  event.preventDefault(); freshGesture = !heldKey && heldPointer === null; heldKey = true; if (state === 'playing' || state === 'practice') act(); else if (state === 'title' || state === 'result') start(state === 'result'); else if (state === 'paused') pause();
}, { signal: listeners.signal });
window.addEventListener('pointerup', event => { if (heldPointer === event.pointerId) heldPointer = null; }, {signal:listeners.signal});
window.addEventListener('pointercancel', () => { heldPointer = null; freshGesture = false; }, {signal:listeners.signal});
document.addEventListener('keyup', event => { if (event.key === ' ' || event.key === 'Enter') heldKey = false; }, {signal:listeners.signal});
document.addEventListener('visibilitychange', () => { if (document.hidden && (state === 'playing' || state === 'practice')) pause(); }, { signal: listeners.signal });
window.addEventListener('blur', () => { clearApprovals(); heldKey = false; heldPointer = null; freshGesture = false; if (state === 'playing' || state === 'practice') pause(); }, { signal: listeners.signal });
window.addEventListener('pagehide', event => { clearApprovals(); if (!event.persisted) recordQuit(); if (state === 'playing' || state === 'practice') pause(); }, { signal: listeners.signal });
document.querySelector('.arcade-portal-back')?.addEventListener('click',()=>telemetry.trackEvent('return_to_portal'),{signal:listeners.signal});
telemetry.trackEvent('game_open'); setScreen('title');
if (import.meta.env.DEV) (window as unknown as { __arcadeDebug: unknown }).__arcadeDebug = Object.freeze({ gameId: 'game006', snapshot: () => controller.snapshot(), inspection: () => controller.inspection(), state: () => state, telemetry: () => telemetry.getEvents() });
if (import.meta.hot) import.meta.hot.dispose(() => { disposed = true; if (resultTimer !== undefined) window.clearTimeout(resultTimer); listeners.abort(); controller.destroy(); audio.destroy(); delete (window as unknown as { __arcadeDebug?: unknown }).__arcadeDebug; });
