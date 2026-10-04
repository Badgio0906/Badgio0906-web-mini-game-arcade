import { createOnboarding } from './arcade/onboarding';
import './style.css';
import { StorageService } from './core/StorageService';
import { TelemetryService } from './core/TelemetryService';
import { CreditService } from './core/CreditService';
import { requestRewardedCredit } from './core/RewardService';
import { AudioService } from './core/AudioService';
import { InputService } from './core/InputService';
import { createOrbitGame, getOrbitInspection } from './game/OrbitScene';
import { playOrbitSound } from './game/playOrbitSound';
import type { OrbitController, RunResult, RunSnapshot } from './game/contracts';

type Screen = 'title' | 'playing' | 'paused' | 'result' | 'reward';
const storage = new StorageService();
const telemetry = new TelemetryService(storage);
const onboarding = createOnboarding({ gameId: 'game001', storage, telemetry });
const credits = new CreditService(storage, telemetry);
const audio = new AudioService(storage);
let state: Screen = 'title';
let best = storage.readNumber('best', 0);
let runNumber = 0;
let runId = '';
let lastResult: RunResult | undefined;
let latest: RunSnapshot | undefined;
let newBest = false;
let resultAvailableAt = 0;
let quitLogged = false;
let controller: OrbitController;

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  <header class="site-header">
    <a class="brand" href="./" aria-label="ORBIT SHIFT タイトルへ"><span class="brand-mark" aria-hidden="true">◉</span><span>MINI GAME<br><b>ARCADE</b></span></a>
    <div class="header-center"><span class="status-dot"></span> FREE TO PLAY <span class="header-divider">/</span> GAME 001</div>
    <div class="edition">ORBIT SHIFT <span>v0.1</span></div>
  </header>
  <main class="arcade-layout">
    <aside class="intro-panel">
      <div class="eyebrow"><span>001</span> THE FIRST ORBIT</div>
      <h1 class="orbit-ja-title">軌道をズラせ！<small>～ORBIT SHIFT～</small></h1>
      <p class="tagline">ひとつのボタン。<br>ふたつの軌道。<br>その一瞬が、ベストを変える。</p>
      <div class="genre-tags"><span>ONE BUTTON</span><span>SCORE ATTACK</span></div>
      <div class="best-panel"><span class="small-label">YOUR PERSONAL BEST</span><div><span id="best-value">0</span><span class="unit">PTS</span></div><p>昨日の自分を、追い越そう。</p></div>
      <div class="controls-note"><span class="small-label">ONE INPUT. THAT'S ALL.</span><p><kbd>SPACE</kbd> <kbd>ENTER</kbd><span>クリック / タップでもOK</span></p></div>
    </aside>
    <section class="game-panel" aria-label="ORBIT SHIFT ゲーム">
      <div class="game-toolbar">
        <div class="credits" aria-label="残りCREDIT"><span class="small-label">CREDIT</span><div id="credit-dots" aria-hidden="true"></div><span id="credit-count">3</span></div>
        <div class="toolbar-actions">
          <button id="mute-button" class="icon-button" data-action="mute" aria-label="音をミュート" aria-pressed="false"></button>
          <button id="pause-button" class="icon-button" data-action="pause" aria-label="一時停止" disabled><span aria-hidden="true">Ⅱ</span></button>
        </div>
      </div>
      <div class="playfield">
        <div class="game-hud" aria-hidden="true"><div><span class="small-label">SCORE</span><span id="score-value">00000</span></div><div class="hud-right"><span id="difficulty-value" class="difficulty">WARM UP</span><span id="time-value">00:00</span></div></div>
        <div id="stage" tabindex="0" role="application" aria-label="ゲーム領域。Space、Enter、クリック、タップで軌道切替。Escapeで一時停止。"><div id="game-canvas"></div><div id="overlay"></div></div>
        <div class="field-footer"><span id="lane-value"><i class="lane-dot"></i> INNER ORBIT</span><span id="combo-value">READY WHEN YOU ARE</span></div>
      </div>
      <div class="under-board"><span><i class="live-dot"></i><span id="status-text">TAP / SPACE TO START</span></span><button id="how-button" data-action="how">遊び方 <span aria-hidden="true">↗</span></button></div>
      <div id="announcement" class="sr-only" aria-live="polite" aria-atomic="true"></div>
    </section>
    <aside class="guide-panel">
      <span class="small-label">FLIGHT MANUAL</span>
      <div class="guide-item"><span class="guide-icon orbit-icon" aria-hidden="true">⇄</span><div><b>SHIFT</b><p>タップで軌道を切替。</p></div></div>
      <div class="guide-item"><span class="guide-icon hazard-icon" aria-hidden="true">▰</span><div><b>DODGE</b><p>赤い障害をかわす。</p></div></div>
      <div class="guide-item"><span class="guide-icon shard-icon" aria-hidden="true">◇</span><div><b>COLLECT</b><p>SHARDで追加スコア。</p></div></div>
      <div class="risk-note"><span class="small-label">A LITTLE CLOSER.</span><p>ギリギリの切替で<br><strong>NEAR MISS</strong>。<br>リスクを取るかは、あなた次第。</p></div>
      <span class="guide-bottom">STAY IN ORBIT.<br>GO ONE MORE.</span>
    </aside>
  </main>
  <footer class="site-footer"><span>A SMALL GAME. A NEW HIGH.</span><span>ローカル自己ベスト <i>·</i> 無料 <i>·</i> インストール不要</span><span>WEB MINI GAME ARCADE © 2026</span></footer>
  <dialog id="how-dialog" aria-labelledby="how-title">
    <div class="dialog-heading"><span class="eyebrow">FLIGHT MANUAL</span><button class="icon-button" data-action="close-how" aria-label="遊び方を閉じる">×</button></div>
    <h2 id="how-title">タップで、軌道を切替。</h2>
    <p>時計回りに進む機体を INNER / OUTER に切り替え、赤い障害をかわそう。</p>
    <div class="manual-row"><span class="hazard-icon">▰</span><p><b>赤いバー</b>に触れるとGAME OVER。</p></div>
    <div class="manual-row"><span class="shard-icon">◇</span><p><b>金のSHARD</b>を取ると追加スコア。</p></div>
    <p>直前の切替で <b>NEAR MISS</b>。連続成功でCOMBO。安全に避けるだけでも得点が増えます。</p>
    <p class="manual-credit">GAME OVERで1 CREDIT消費。0になったら広告Stubで+3 CREDIT。自己ベストはこのブラウザに保存されます。</p>
    <button class="primary-button" data-action="close-how">わかった <span aria-hidden="true">↗</span></button>
  </dialog>`;

function element<T extends HTMLElement = HTMLElement>(id: string): T { return document.getElementById(id) as T; }
const stage = element('stage');
const overlay = element('overlay');
const dialog = element<HTMLDialogElement>('how-dialog');
const number = (value: number): string => Math.floor(value).toLocaleString('en-US');
const clock = (value: number): string => `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(Math.floor(value % 60)).padStart(2, '0')}`;
const soundOn = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 8a6 6 0 0 1 0 8M20 5a10 10 0 0 1 0 14"/></svg>';
const soundOff = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="m17 9 5 6m0-6-5 6"/></svg>';

function updateChrome(): void {
  element('credit-count').textContent = String(credits.credits);
  element('credit-dots').innerHTML = Array.from({ length: 3 }, (_, i) => `<i class="${i < credits.credits ? 'filled' : ''}"></i>`).join('');
  element('best-value').textContent = number(best);
  const mute = element<HTMLButtonElement>('mute-button');
  mute.innerHTML = audio.muted ? soundOff : soundOn;
  mute.setAttribute('aria-pressed', String(audio.muted));
  mute.setAttribute('aria-label', audio.muted ? '音をONにする' : '音をミュート');
  mute.title = audio.muted ? 'SOUND OFF' : 'SOUND ON';
  const pause = element<HTMLButtonElement>('pause-button');
  pause.disabled = state !== 'playing' && state !== 'paused';
  pause.setAttribute('aria-label', state === 'paused' ? '再開' : '一時停止');
  app.dataset.state = state;
}

function setScreen(next: Screen): void {
  const previous = state;
  state = next;
  updateChrome();
  overlay.hidden = state === 'playing';
  if (state === 'playing') {
    overlay.innerHTML = '';
    element('status-text').textContent = 'TAP / SPACE → 軌道を切替';
    return;
  }
  if (state === 'title') {
    overlay.innerHTML = `<div class="title-screen screen-card"><div class="eyebrow">ONE BUTTON. TWO ORBITS.</div><div class="hero-title orbit-ja-title">軌道を<br>ズラせ！<small>～ORBIT SHIFT～</small></div><p class="hero-caption">流れに乗って、一瞬をかわそう。</p><button id="play-button" class="primary-button" data-action="play"><span class="play-triangle" aria-hidden="true"></span>PLAY<span class="button-end" aria-hidden="true">↗</span></button><p class="start-hint">TAP / SPACE TO SHIFT ORBIT</p></div>`;
    element('status-text').textContent = 'TAP / SPACE TO START';
    element('combo-value').textContent = 'READY WHEN YOU ARE';
  } else if (state === 'paused') {
    overlay.innerHTML = `<div class="screen-card pause-screen"><span class="eyebrow">TAKE A BREATH</span><h2>PAUSED<span>.</span></h2><p>準備ができたら、また軌道へ。</p><button id="resume-button" class="primary-button" data-action="resume">RESUME <span aria-hidden="true">↗</span></button><button id="title-button" class="secondary-button" data-action="title">TITLE</button><p class="start-hint">SPACE / ESC TO RESUME</p></div>`;
    element('status-text').textContent = 'PAUSED · 準備ができたら再開';
  } else if (state === 'result' && lastResult) {
    overlay.innerHTML = `<div class="screen-card result-screen"><span class="eyebrow ${newBest ? 'new-best' : ''}">${newBest ? '↗ NEW PERSONAL BEST' : 'FLIGHT COMPLETE'}</span><h2>ONE MORE<span>?</span></h2><p class="death-reason"></p><div class="result-score"><span class="small-label">SCORE</span><strong>${number(lastResult.score)}</strong><span class="result-best">BEST ${number(best)}</span></div><div class="result-stats"><div><span>TIME</span><b>${clock(lastResult.time)}</b></div><div><span>MAX COMBO</span><b>×${Math.max(1, lastResult.maxCombo)}</b></div></div><button id="retry-button" class="primary-button" data-action="retry">RETRY <span aria-hidden="true">↻</span></button><button id="title-button" class="secondary-button" data-action="title">TITLE</button><p class="start-hint">${credits.enabled ? `${credits.credits} CREDIT LEFT · ` : ''}SPACE TO RETRY</p></div>`;
    overlay.querySelector('.death-reason')!.textContent = lastResult.reason || '赤い障害に接触';
    element('status-text').textContent = 'NICE FLIGHT. GO ONE MORE.';
  } else if (state === 'reward') {
    const results = lastResult ? `<div class="reward-summary"><span>SCORE <b>${number(lastResult.score)}</b></span><span>BEST <b>${number(best)}</b></span><span>TIME <b>${clock(lastResult.time)}</b></span><span>MAX COMBO <b>×${Math.max(1, lastResult.maxCombo)}</b></span></div>` : '';
    overlay.innerHTML = `<div class="screen-card reward-screen"><span class="eyebrow ${newBest ? 'new-best' : ''}">${newBest ? '↗ NEW PERSONAL BEST' : 'YOUR NEXT FLIGHT AWAITS'}</span><h2>NO CREDIT<span>.</span></h2>${results}<div class="credit-symbol" aria-hidden="true">+3</div><p>広告を見ると +3 CREDIT</p><button id="reward-button" class="primary-button" data-action="reward">+3 CREDIT <span aria-hidden="true">↗</span></button><button id="title-button" class="secondary-button" data-action="title">TITLE</button><p class="stub-note">開発版：Rewarded Ad Stub<br>今回は実際の広告は表示されません</p></div>`;
    element('status-text').textContent = 'NO CREDIT · 次のフライトを補充';
    if (previous !== 'reward') telemetry.trackEvent('reward_offer_shown', { credits: 0 });
  }
}

function startRun(retry = false): void {
  if (onboarding.intercept(() => startRun(retry))) return;
  if (credits.rewardPending || state === 'playing') return;
  if (!credits.canPlay) { setScreen('reward'); return; }
  if (retry) telemetry.trackEvent('retry', { previousRunId: runId });
  void audio.unlock();
  runId = `run-${Date.now()}-${++runNumber}`;
  quitLogged = false;
  lastResult = undefined;
  newBest = false;
  telemetry.trackEvent('run_start', { runId, credits: credits.credits });
  setScreen('playing');
  controller.startRun();
  stage.focus({ preventScroll: true });
}

function pauseRun(): void {
  if (state === 'playing') {
    controller.setPaused(true);
    setScreen('paused');
    telemetry.trackEvent('pause', { runId });
    element('announcement').textContent = 'ゲームを一時停止しました。';
    stage.focus({ preventScroll: true });
  } else if (state === 'paused') {
    controller.setPaused(false);
    setScreen('playing');
    telemetry.trackEvent('resume', { runId });
    stage.focus({ preventScroll: true });
  }
}

function recordQuit(): void {
  if ((state === 'playing' || state === 'paused') && !quitLogged) {
    quitLogged = true;
    telemetry.trackEvent('quit', { runId, score: latest?.score ?? 0, time: latest?.time ?? 0 });
    telemetry.trackEvent('run_end', { runId, outcome: 'quit', reason: 'quit', score: latest?.score ?? 0, time: latest?.time ?? 0 });
    telemetry.trackEvent('run_duration', { runId, seconds: latest?.time ?? 0, reason: 'quit' });
  }
}

function onAction(): void {
  if (dialog.open) return;
  if (state === 'title') startRun();
  else if (state === 'playing') { void audio.unlock(); controller.shift(); }
  else if (state === 'paused') pauseRun();
  else if (state === 'result' && performance.now() >= resultAvailableAt) startRun(true);
}

controller = createOrbitGame(element('game-canvas'), {
  onUpdate(snapshot) {
    latest = snapshot;
    if (state !== 'playing' && state !== 'paused') return;
    element('score-value').textContent = String(Math.floor(snapshot.score)).padStart(5, '0');
    element('time-value').textContent = clock(snapshot.time);
    element('difficulty-value').textContent = snapshot.difficulty;
    element('lane-value').innerHTML = `<i class="lane-dot"></i> ${snapshot.lane.toUpperCase()} ORBIT`;
    element('combo-value').textContent = snapshot.combo > 1 ? `NEAR MISS COMBO ×${snapshot.combo}` : snapshot.time < 10 ? 'TAP / SPACE TO SHIFT' : 'STAY IN ORBIT';
    element('combo-value').classList.toggle('combo-active', snapshot.combo > 1);
  },
  onEvent(event) { playOrbitSound(audio, event); },
  onGameOver(result) {
    if (state !== 'playing') return;
    lastResult = result;
    resultAvailableAt = performance.now() + 420;
    newBest = result.score > best;
    if (newBest) { best = Math.floor(result.score); storage.writeNumber('best', best); }
    telemetry.trackEvent('run_end', { runId, outcome: 'over', reason: 'collision', score: result.score, time: result.time, maxCombo: result.maxCombo });
    telemetry.trackEvent('run_duration', { runId, seconds: result.time, reason: 'over' });
    telemetry.trackEvent('score', { runId, score: result.score, best, newBest });
    credits.consume(runId);
    setScreen(credits.canPlay ? 'result' : 'reward');
    // Persist the death immediately; reveal results after the brief impact effect.
    const endedRunId = runId;
    overlay.hidden = true;
    window.setTimeout(() => {
      if (runId === endedRunId && (state === 'result' || state === 'reward')) overlay.hidden = false;
    }, 420);
    element('announcement').textContent = `ゲームオーバー。スコア${number(result.score)}。${credits.enabled ? `残り${credits.credits} CREDIT。` : 'もう一度遊べます。'}${newBest ? '自己ベスト更新。' : ''}`;
  },
});

app.addEventListener('click', event => {
  const target = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-action]');
  if (!target || target.disabled) return;
  switch (target.dataset.action) {
    case 'play': startRun(); break;
    case 'retry': startRun(true); break;
    case 'pause': case 'resume': pauseRun(); break;
    case 'mute': audio.toggle(); updateChrome(); break;
    case 'title': {
      if (credits.rewardPending) break;
      recordQuit(); controller.showTitle(); lastResult = undefined; newBest = false; setScreen('title');
      stage.focus({ preventScroll: true }); break;
    }
    case 'how': if (state === 'playing') pauseRun(); dialog.showModal(); break;
    case 'close-how': dialog.close(); stage.focus({ preventScroll: true }); break;
    case 'reward': void grantReward(); break;
  }
});

async function grantReward(): Promise<void> {
  if (state !== 'reward' || credits.rewardPending) return;
  const button = element<HTMLButtonElement>('reward-button');
  button.disabled = true;
  button.textContent = 'CREDITを補充中…';
  element<HTMLButtonElement>('title-button').disabled = true;
  const success = await credits.requestRewardedCredit(requestRewardedCredit);
  if (success) {
    element('announcement').textContent = '3 CREDITを補充しました。';
    startRun(true);
  } else {
    setScreen('reward');
    element('status-text').textContent = '補充できませんでした。もう一度お試しください。';
  }
}

const input = new InputService(stage, onAction, pauseRun);
document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'playing') pauseRun(); });
window.addEventListener('blur', () => { if (state === 'playing') pauseRun(); });
dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
document.querySelector<HTMLAnchorElement>('.brand')!.addEventListener('click', event => {
  event.preventDefault(); if (credits.rewardPending) return;
  recordQuit(); controller.showTitle(); lastResult = undefined; newBest = false; setScreen('title');
});

// Test helpers are removed by Vite from a production build; normal play uses the same controller.
if (import.meta.env.DEV) {
  Object.assign(window, { __orbitDebug: {
    snapshot: () => controller.getSnapshot(), state: () => state,
    telemetry: () => telemetry.getEvents(), inspection: () => getOrbitInspection(controller), controller,
    resetCredits: () => { credits.reset(); updateChrome(); },
  } });
  if (new URLSearchParams(location.search).has('debugReset')) { credits.reset(); updateChrome(); }
}
window.addEventListener('pagehide', event => {
  if (event.persisted) { if (state === 'playing') pauseRun(); }
  else { recordQuit(); onboarding.destroy(); input.destroy(); controller.destroy(); audio.destroy(); }
});
telemetry.trackEvent('game_open', { best, credits: credits.credits });
setScreen('title');
