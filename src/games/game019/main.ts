import './style.css';
import { AudioService } from '../../core/AudioService';
import { StorageService } from '../../core/StorageService';
import { TelemetryService } from '../../core/TelemetryService';
import { FrogBoard } from './FrogBoard';
import { FrogPractice } from './FrogPractice';
import { FrogRun } from './FrogRun';
import type { Direction, FrogEvent, JumpForecast, JumpSize } from './types';

type State = 'title' | 'explanation' | 'playing' | 'practice' | 'paused' | 'result';
const element = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;
const app = element('app'), menu = element('menu'), canvas = element<HTMLCanvasElement>('frog-canvas');
const heightValue = element('height-value'), maxValue = element('max-value'), bestValue = element('best-value');
const live = element('live-status'), chapter = element('chapter-label'), wind = element('wind-label'), nextWindLabel = element('next-wind-label');
const pauseButton = element<HTMLButtonElement>('pause-button'), muteButton = element<HTMLButtonElement>('mute-button');
const practiceActions = element('practice-actions'), nextPractice = element<HTMLButtonElement>('next-practice-button');
const storage = new StorageService(undefined, 'web-mini-arcade:v1:game019:');
const audio = new AudioService(storage), telemetry = new TelemetryService(storage, 'game019');
const board = new FrogBoard(canvas);
let best = storage.readNumber('bestHeightDm', 0, 0, 2000);
let state: State = 'title', previousState: 'playing' | 'practice' = 'playing';
let direction: Direction = 0, size: JumpSize = 'medium';
let charge: { size: JumpSize; direction: Direction; remaining: number } | null = null;
let blockedUntil = 0, activeRun = false, seed = 1;
let practice: FrogPractice | null = null;
let preview: JumpForecast | undefined, previewKey = '';
const run = new FrogRun(onRunEvent);
run.start(1);
const directionButtons = [...document.querySelectorAll<HTMLButtonElement>('[data-direction]')];
const sizeButtons = [...document.querySelectorAll<HTMLButtonElement>('[data-size]')];
const fmt = (value: number) => `${Math.max(0, value).toFixed(1)} m`;
function currentRun() { return state === 'practice' || state === 'paused' && previousState === 'practice' ? practice!.run : run; }
function active() { return state === 'playing' || state === 'practice'; }
function setState(next: State) {
  state = next; app.dataset.state = next; charge = null; blockedUntil = performance.now() + 140;
  pauseButton.disabled = !active(); practiceActions.hidden = next !== 'practice';
  menu.hidden = active(); previewKey = '';
  for (const button of [...directionButtons, ...sizeButtons]) button.disabled = !active();
}
function updateDirection(next: Direction) {
  direction = next; previewKey = '';
  for (const button of directionButtons) button.setAttribute('aria-pressed', String(Number(button.dataset.direction) === next));
}
function onRunEvent(event: FrogEvent) {
  if (!activeRun) return;
  if (event.type === 'jump') {
    telemetry.trackEvent('specific_game_events', { event: 'jump', size: event.size, direction: event.direction, height: event.height });
    audio.tone(event.size === 'small' ? 200 : event.size === 'medium' ? 280 : 350, 600, .1, 'square', 0, .025);
  } else if (event.type === 'land') {
    telemetry.trackEvent('specific_game_events', { event: 'land', height: event.height, drop: event.drop });
    audio.tone(180, 100, .05, 'triangle', 0, .03); previewKey = '';
  } else if (event.type === 'fall') {
    telemetry.trackEvent('specific_game_events', { event: 'fall_recovery', drop: event.drop, height: event.height });
    audio.tone(180, 60, .18, 'sawtooth', 0, .018);
  } else if (event.type === 'bump') {
    telemetry.trackEvent('specific_game_events', { event: 'ceiling_bump', obstacle_id: event.obstacleId });
    audio.tone(85, 40, .07, 'square', 0, .018);
  } else if (event.type === 'milestone' || event.type === 'sky') {
    telemetry.trackEvent('phase_reached', { phase: event.type === 'milestone' ? 'shore' : 'sky', height: event.height });
    if (event.type === 'milestone') { audio.tone(330, 660, .15, 'square', 0, .025); audio.tone(440, 880, .15, 'square', .15, .025); }
  } else if (event.type === 'clear') {
    telemetry.trackEvent('phase_reached', { phase: 'space', height: event.height });
    finishRun('clear'); showResult();
  }
}
function finishRun(outcome: 'clear' | 'quit' | 'restart') {
  if (!activeRun) return;
  const s = run.snapshot(); activeRun = false;
  const score = Math.min(2000, Math.floor(s.maxHeight * 10 + 1e-7));
  const newBest = score > best;
  telemetry.trackEvent('score', { score: score / 10, unit: 'meters', newBest });
  if (newBest) { best = score; storage.writeNumber('bestHeightDm', best); telemetry.trackEvent('best_update', { score: score / 10, best: best / 10, unit: 'meters' }); }
  telemetry.trackEvent('run_end', { outcome, score: score / 10, seconds: Number(s.time.toFixed(2)), falls: s.falls, phase: s.chapter });
}
function beginRun(source = 'direct') {
  finishRun('restart'); if (run.alive) run.quit();
  practice = null; preview = undefined; updateDirection(0); size = 'medium';
  seed = (Date.now() % 2147483646) + 1; run.start(seed); activeRun = true;
  telemetry.trackEvent('run_start', { seed, source }); telemetry.trackEvent('phase_reached', { phase: 'well', height: 0 });
  setState('playing'); menu.innerHTML = ''; canvas.focus({ preventScroll: true }); void audio.unlock();
}
function showTitle() {
  finishRun('quit'); if (run.alive) run.quit(); practice = null;
  run.start(1); updateDirection(0); setState('title');
  menu.innerHTML = `<span class="eyebrow">A FROG. A WELL. THEN…</span><h1>井の中の蛙、<br>大海を目指す<small>WELL TO SPACE</small></h1><p>井戸を出たら、今度は宇宙でした。</p><p>方向 × 小・中・大。着地点を考えて跳ぶ。<br>落ちても、その場からやり直せる。</p><div class="menu-actions"><button id="play-button" class="primary" type="button">すぐ遊ぶ</button><button id="tutorial-explain-button" type="button">説明を見る</button><button id="tutorial-again-button" type="button">練習する</button></div><p class="menu-detail">保存は最高到達点だけ。位置のセーブはありません。</p>`;
  element('play-button').onclick = () => { telemetry.trackEvent('tutorial_skip', { source: 'title', practiced: storage.readBoolean('practiceCompleted', false) }); beginRun(); };
  element('tutorial-explain-button').onclick = showExplanation;
  element('tutorial-again-button').onclick = beginPractice;
}
function showExplanation() {
  setState('explanation'); telemetry.trackEvent('tutorial_view', { source: 'title' });
  menu.innerHTML = `<span class="eyebrow">HOW TO HOP</span><h2>跳ぶ前に、着地点を選ぶ。</h2><ol><li><b>方向</b>を←・↑・→から選ぶ。</li><li><b>小</b>は横の位置調整。<b>中</b>は普段の登り。<b>大</b>は高く、遠くへ。</li><li>ジャンプ中の方向変更はできない。点線は選んだジャンプの見通し。</li><li>苔は滑り、ひびの足場は崩れる。天井に大ジャンプでぶつかることも。</li><li>落ちても終了しない。足場か井戸の底から再挑戦。井戸の外では風を読む。</li></ol><p>PC：矢印 / A・D・Wで方向、Z・X・C / 1・2・3で小・中・大。Spaceは前と同じ大きさ。Escで一時停止。</p><div class="menu-actions"><button id="play-button" class="primary" type="button">すぐ遊ぶ</button><button id="practice-button" type="button">練習する</button><button id="title-button" type="button">タイトルへ</button></div>`;
  element('play-button').onclick = () => beginRun('explanation'); element('practice-button').onclick = beginPractice; element('title-button').onclick = showTitle;
}
function beginPractice() {
  finishRun('quit'); if (run.alive) run.quit();
  practice = new FrogPractice(stage => { telemetry.trackEvent('tutorial_step_complete', { step: stage + 1, mode: 'practice' }); audio.tone(360, 720, .12, 'square', 0, .025); });
  updateDirection(0); size = 'medium'; setState('practice');
  telemetry.trackEvent('practice_start', { source: 'menu' }); menu.innerHTML = ''; void audio.unlock(); canvas.focus({ preventScroll: true });
}
function completePractice() {
  telemetry.trackEvent('practice_complete', { steps: 4 }); storage.writeBoolean('practiceCompleted', true);
  setState('result'); menu.innerHTML = `<span class="eyebrow">PRACTICE COMPLETE</span><h2>跳び方、分かった！</h2><p>小で位置を整え、中で登り、大で狙う。<br>風が吹いたら、着地点を見直そう。</p><div class="menu-actions"><button id="play-button" type="button" class="primary">すぐ遊ぶ</button><button id="title-button" type="button">タイトルへ</button></div>`;
  element('play-button').onclick = () => beginRun('practice'); element('title-button').onclick = showTitle;
}
function showResult() {
  const s = run.snapshot(); setState('result');
  menu.innerHTML = `<span class="eyebrow">WELL → SEA → SPACE</span><h2>宇宙だ！ ……次はどこ？</h2><p class="result-height">${fmt(s.maxHeight)}</p><p>転落 ${s.falls}回。落ちても、ここまで来た。<br>BEST ${fmt(best / 10)}</p><div class="menu-actions"><button id="retry-button" class="primary" type="button">もう一度、井戸から</button><button id="title-button" type="button">タイトルへ</button><a href="./index.html">ゲームセンターへ</a></div>`;
  element('retry-button').onclick = () => { telemetry.trackEvent('retry'); beginRun('retry'); }; element('title-button').onclick = showTitle;
}
function pause() {
  if (!active()) return; previousState = state as 'playing' | 'practice'; setState('paused');
  telemetry.trackEvent('pause', { mode: previousState });
  menu.innerHTML = `<span class="eyebrow">TAKE A BREATH</span><h2>一時停止</h2><p>落ちた分も、次のジャンプの材料。</p><div class="menu-actions"><button id="resume-button" class="primary" type="button">続ける</button><button id="retry-button" type="button">${previousState === 'practice' ? '練習を最初から' : '井戸の底からやり直す'}</button><button id="title-button" type="button">タイトルへ</button></div>`;
  element('resume-button').onclick = resume;
  element('retry-button').onclick = () => { telemetry.trackEvent('retry', { mode: previousState }); if (previousState === 'practice') beginPractice(); else beginRun('retry'); };
  element('title-button').onclick = showTitle;
}
function resume() { if (state !== 'paused') return; setState(previousState); telemetry.trackEvent('resume', { mode: previousState }); canvas.focus({ preventScroll: true }); }
function requestJump(next: JumpSize) {
  if (!active() || performance.now() < blockedUntil || charge || !currentRun().snapshot().player.grounded || practice?.passed && state === 'practice') return;
  canvas.focus({ preventScroll: true }); size = next; previewKey = ''; charge = { size, direction, remaining: .09 }; void audio.unlock();
}
for (const button of directionButtons) button.onclick = () => { if (active() && !charge) { updateDirection(Number(button.dataset.direction) as Direction); canvas.focus({ preventScroll: true }); } };
for (const button of sizeButtons) button.onclick = () => requestJump(button.dataset.size as JumpSize);
pauseButton.onclick = pause;
muteButton.onclick = () => { muteButton.textContent = audio.toggle() ? '音 OFF' : '音 ON'; };
muteButton.textContent = audio.muted ? '音 OFF' : '音 ON';
nextPractice.onclick = () => { if (!practice || state !== 'practice') return; if (practice.next() && practice.complete) completePractice(); previewKey = ''; charge = null; blockedUntil = performance.now() + 140; };
element('skip-practice-button').onclick = () => { telemetry.trackEvent('tutorial_skip', { source: 'practice', step: (practice?.stage ?? 0) + 1 }); beginRun('practice_skip'); };
element('portal-link').addEventListener('click', () => { finishRun('quit'); telemetry.trackEvent('return_to_portal', { source: state }); });
window.addEventListener('keydown', event => {
  if (event.repeat || event.isComposing || event.ctrlKey || event.metaKey || event.altKey || (event.target as HTMLElement)?.closest('input,textarea,select,button,a')) return;
  if (event.code === 'Escape') { event.preventDefault(); if (active()) pause(); else if (state === 'paused') resume(); return; }
  if (!active() || performance.now() < blockedUntil) return;
  const directions: Record<string, Direction> = { ArrowLeft: -1, KeyA: -1, ArrowRight: 1, KeyD: 1, ArrowUp: 0, KeyW: 0 };
  const sizes: Record<string, JumpSize> = { KeyZ: 'small', Digit1: 'small', KeyX: 'medium', Digit2: 'medium', KeyC: 'large', Digit3: 'large' };
  if (event.code in directions) { event.preventDefault(); if (!charge) updateDirection(directions[event.code]); }
  else if (event.code in sizes || event.code === 'Space') { event.preventDefault(); requestJump(sizes[event.code] ?? size); }
});
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
window.addEventListener('blur', () => pause());
window.addEventListener('pagehide', () => { finishRun('quit'); audio.destroy(); }, { once: true });
let previousTime = performance.now();
function frame(now: number) {
  const dt = Math.min(.05, Math.max(0, (now - previousTime) / 1000)); previousTime = now;
  if (active()) {
    if (charge) { charge.remaining -= dt; if (charge.remaining <= 0) { const pending = charge; charge = null; if (state === 'practice') practice!.jump(pending.size, pending.direction); else run.jump(pending.size, pending.direction); previewKey = ''; } }
    if (state === 'practice') practice!.update(dt); else run.update(dt);
  }
  const model = currentRun(), s = model.snapshot();
  if (active() && s.player.grounded) {
    const key = `${state}:${s.player.platformId}:${Math.round(s.player.x)}:${direction}:${size}`;
    if (previewKey !== key) { previewKey = key; preview = model.forecast(size, direction); }
  } else preview = undefined;
  board.draw(s, { charging: !!charge, direction, forecast: preview, title: state === 'title' });
  heightValue.textContent = fmt(s.height); maxValue.textContent = fmt(s.maxHeight); bestValue.textContent = fmt(best / 10);
  chapter.textContent = state === 'practice' ? `練習 ${(practice?.stage ?? 0) + 1} / 4：${practice?.lesson.title}` : s.chapter === 'well' ? '井戸の中 / 0 → 100 m' : s.chapter === 'shore' ? '井戸を出た！' : s.chapter === 'sky' ? '井の外の蛙、宇宙を目指す / 100 → 200 m' : '宇宙に到着！';
  const nextWind = s.wind.find(w => w.yMin > s.player.y);
  wind.textContent = s.activeWind ? `${s.activeWind.x > 0 ? '→' : '←'} ${s.activeWind.label}${s.activeWind.y > 0 ? ' ↑' : s.activeWind.y < 0 ? ' ↓' : ''}` : '風なし';
  nextWindLabel.hidden = !nextWind || s.chapter === 'well';
  nextWindLabel.textContent = nextWind ? `次の風 ${Math.round(nextWind.yMin / 10)}m〜：${nextWind.x > 0 ? '→' : '←'} ${nextWind.label}${nextWind.y > 0 ? ' ↑' : nextWind.y < 0 ? ' ↓' : ''}` : '';
  wind.title = nextWind ? `次の風：${nextWind.label}` : '井戸の中は風なし';
  live.textContent = state === 'practice' ? practice!.passed ? '着地できた！ 「次へ」で新しい練習へ。' : practice!.lesson.text : s.feedback;
  if (state === 'practice') { nextPractice.disabled = !practice!.passed; nextPractice.textContent = practice!.stage === 3 ? '練習を完了' : 'できた！ 次へ'; }
  for (const button of sizeButtons) button.disabled = !active() || !s.player.grounded || !!charge || (state === 'practice' && practice!.passed);
  requestAnimationFrame(frame);
}
telemetry.trackEvent('game_open'); showTitle(); requestAnimationFrame(frame);
if (import.meta.env.DEV) {
  Object.defineProperty(window, '__game019', { get: () => ({ state, direction, size, charging: !!charge, run: currentRun().snapshot(), practice: practice ? { stage: practice.stage, passed: practice.passed, complete: practice.complete } : null, forecast: currentRun().forecast(size, direction), forecasts: (['small', 'medium', 'large'] as JumpSize[]).flatMap(jumpSize => ([-1, 0, 1] as Direction[]).map(jumpDirection => currentRun().forecast(jumpSize, jumpDirection))), telemetry: telemetry.getEvents() }), configurable: false });
}
