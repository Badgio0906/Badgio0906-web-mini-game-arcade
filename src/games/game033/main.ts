import './style.css';
import { FireworkRun, RUN_SECONDS, type FireworkEvent, type FireworkSnapshot } from './FireworkRun';
import { paintFireworks } from './renderer';
import { StorageService } from '../../core/StorageService';
import { AudioService } from '../../core/AudioService';
import { TelemetryService } from '../../core/TelemetryService';
import { createGameRecordSession } from '../../records/RecordSharing';
const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;
const canvas = $<HTMLCanvasElement>('night'), menu = $<HTMLDialogElement>('menu'), launch = $<HTMLButtonElement>('launch');
const storage = new StorageService(undefined, 'web-mini-arcade:v1:game033:');
const audio = new AudioService(storage), telemetry = new TelemetryService(storage, 'game033', undefined, { remoteCollectionEnabled: false });
const records = createGameRecordSession('game033');
let state: 'title' | 'playing' | 'paused' | 'result' | 'help' = 'title';
let best = storage.readNumber('best', 0), practice = false, runId = '', runOpen = false, pointer: number | null = null, key: string | null = null, practiceNotified = false;
const run = new FireworkRun(onEvent);
const actions = (html: string) => `<div class="actions">${html}</div>`;
const button = (action: string, label: string, primary = false) => `<button data-action="${action}"${primary ? ' class="primary"' : ''}>${label}</button>`;
function syncAudio(): void { $('mute').textContent = audio.muted ? '音 OFF' : '音 ON'; $('mute').setAttribute('aria-pressed', String(audio.muted)); }
function cancelInput(): void { pointer = null; key = null; run.cancelCharge(); launch.dataset.holding = 'false'; }
function showDialog(next: typeof state, html: string): void {
  cancelInput(); state = next; $('app').dataset.state = next; launch.disabled = true; $<HTMLButtonElement>('pause').disabled = next !== 'paused';
  // The title must leave the independent Analytics settings actionable.
  // Close first: an already-open modeless dialog cannot become modal in place.
  if (menu.open) menu.close();
  menu.innerHTML = html; menu.dataset.presentation = next === 'title' ? 'title' : 'modal';
  if (next === 'title') menu.show(); else menu.showModal();
  menu.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
}
function showTitle(): void {
  quit(); run.reset();
  showDialog('title', `<span class="eyebrow">FIREWORK MAKER</span><h2 id="menu-title">夜空に、ひと発。</h2><p>押してためて、離して咲かす。<br>目印の高さに光を重ねる、100秒の花火大会。</p><small>あなたのBEST ${best} · 無料・回数制限なし</small>${actions(button('play', 'すぐ遊ぶ · 100秒', true) + button('how', '説明を見る') + button('practice', '練習する · 時間無制限'))}`);
}
function help(): void {
  const s = run.snapshot(); if (state === 'playing') pause();
  showDialog('help', `<span class="eyebrow">ひとつのボタンで、夜空をつくる</span><h2 id="menu-title">ためて、離す。</h2><p>① ボタン／Spaceを押し続けると高さが上がります。<br>② 光の印が点線の輪に重なったら、離して発射。<br>③ 次の花を、残光が消える前に咲かせて連鎖。</p><p>高すぎても低すぎても、目印から外れます。<br>連続成功でコンボ、4回目には特別な八重咲き。<br>練習は時間無制限。BESTやランキングを変更しません。</p>${actions(button('play', '100秒の本番へ', true) + button('practice', '練習してみる') + (runOpen || practice && s.phase === 'playing' ? button('resume', '花火に戻る') : '') + button('title', 'タイトル'))}`);
  telemetry.trackEvent('tutorial_view');
}
function start(training = false, retry = false): void {
  quit(); practice = training; practiceNotified = false; cancelInput(); run.start(training); state = 'playing'; $('app').dataset.state = 'playing'; menu.close(); launch.disabled = false; launch.focus({ preventScroll: true }); $<HTMLButtonElement>('pause').disabled = false; $('practice-banner').hidden = !practice;
  void audio.unlock();
  if (practice) telemetry.trackEvent('practice_start');
  else { runId = `game033-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; runOpen = true; records.startRun(); if (retry) telemetry.trackEvent('retry', { runId }); telemetry.trackEvent('run_start', { runId }); }
}
function pause(): void {
  if (state !== 'playing') return;
  if (!practice) telemetry.trackEvent('pause', { runId });
  showDialog('paused', `<span class="eyebrow">夜空も、少しひと休み。</span><h2 id="menu-title">一時停止</h2><p>時計と花火は止まっています。<br>再開後、もう一度押して打ち上げましょう。</p>${actions(button('resume', '続きから', true) + button('title', 'タイトル'))}`);
}
function resume(): void { cancelInput(); state = 'playing'; $('app').dataset.state = state; menu.close(); launch.disabled = false; launch.focus({ preventScroll: true }); $<HTMLButtonElement>('pause').disabled = false; if (!practice) telemetry.trackEvent('resume', { runId }); }
function quit(): void {
  cancelInput();
  if (runOpen) { const s = run.snapshot(); telemetry.trackEvent('quit', { runId, score: s.score, time: s.time }); telemetry.trackEvent('run_end', { runId, outcome: 'quit', score: s.score, time: s.time }); runOpen = false; }
  if (practice) { telemetry.trackEvent('specific_game_events', { event: 'practice_exit', mode: 'practice' }); practice = false; $('practice-banner').hidden = true; }
}
function onEvent(e: FireworkEvent): void {
  if (e.type === 'launch') { audio.tone(200, 900, .2, 'sine', 0, .025); return; }
  if (e.type === 'bloom') {
    audio.tone(78, 38, .35, 'sine', 0, .07); audio.tone(e.bloom.special ? 880 : 660, 330, .3, 'triangle', .03, .025);
    if (!practice) telemetry.trackEvent('specific_game_events', { runId, event: 'firework_bloom', quality: e.bloom.quality, chain: e.bloom.chain, special: e.bloom.special });
    if (practice && !practiceNotified && run.snapshot().successes >= 3) { practiceNotified = true; storage.writeBoolean('tutorialCompleted', true); telemetry.trackEvent('practice_complete'); $('status').textContent = '練習成功！ 説明／練習から100秒の本番へ進めます。'; }
    return;
  }
  if (practice || !runOpen) return;
  runOpen = false; const r = e.result, improved = r.score > best; best = Math.max(best, r.score); storage.writeNumber('best', best);
  records.complete(r.score, { metadata: { duration_seconds: r.duration, outcome: 'complete' } });
  telemetry.trackEvent('score', { runId, score: r.score, best, newBest: improved }); if (improved) telemetry.trackEvent('best_update', { runId, score: r.score, best });
  telemetry.trackEvent('run_end', { runId, outcome: 'complete', score: r.score, time: r.duration });
  showDialog('result', `<span class="eyebrow">今夜の、あなたの夜空。</span><h2 id="menu-title">花火大会、おしまい。</h2><div class="result-score" id="result-score">${r.score}</div><small>${improved ? 'NEW BEST · ' : ''}あなたのBEST ${best}</small><dl><div><dt>きれいに開花</dt><dd>${r.successes} / ${r.launches} 発</dd></div><div><dt>ぴったり</dt><dd>${r.perfects} 発</dd></div><div><dt>最大コンボ</dt><dd>${r.maxCombo}</dd></div><div><dt>最大連鎖</dt><dd>${r.maxChain} CHAIN</dd></div></dl>${actions(button('retry', 'もう一度、咲かせる', true) + button('title', 'タイトル'))}`);
  records.mount(menu);
}
function update(s: FireworkSnapshot): void {
  $('time').innerHTML = practice ? '∞<small>練習</small>' : `${Math.ceil(s.remaining)}<small>秒</small>`; $('score').textContent = String(s.score); $('best').textContent = String(best);
  $('power').style.width = `${s.charge * 100}%`; $('target-mark').style.left = `${s.target.power * 100}%`; $('power').parentElement?.setAttribute('aria-valuenow', String(Math.round(s.charge * 100)));
  launch.dataset.holding = String(s.holding); $('combo').textContent = s.combo > 1 ? `${s.combo} COMBO · ${s.maxChain} CHAIN` : '';
  if (state === 'playing') {
    launch.disabled = s.phase !== 'playing';
    $('status').textContent = s.phase === 'settling' ? '最後のひと花を、見届けよう。' : practiceNotified ? '練習成功！ 説明／練習から100秒の本番へ。' : s.holding ? '光の印が目標の輪に来たら、離そう。' : practice ? `練習：目印に3回咲かせよう（${Math.min(3, s.successes)}/3）` : '残光に次の花を重ねると、連鎖。';
  }
}
function press(): void { if (state !== 'playing' || menu.open) return; void audio.unlock(); run.press(); }
function release(): void { if (state === 'playing' && !menu.open) run.release(); }
launch.addEventListener('pointerdown', e => { if (e.button !== 0 || pointer !== null || key !== null || !e.isPrimary) return; e.preventDefault(); pointer = e.pointerId; press(); try { launch.setPointerCapture(e.pointerId); } catch { /* global release */ } });
window.addEventListener('pointerup', e => { if (e.pointerId === pointer) { e.preventDefault(); pointer = null; release(); } });
window.addEventListener('pointercancel', e => { if (e.pointerId === pointer) cancelInput(); });
launch.addEventListener('lostpointercapture', () => { if (pointer !== null) cancelInput(); });
launch.addEventListener('contextmenu', e => e.preventDefault());
window.addEventListener('keydown', e => { if (state !== 'playing' || menu.open || e.altKey || e.ctrlKey || e.metaKey || !['Space','Enter'].includes(e.code) || (e.target instanceof HTMLButtonElement && e.target !== launch)) return; e.preventDefault(); if (e.repeat || key || pointer !== null) return; key = e.code; press(); });
window.addEventListener('keyup', e => { if (key === e.code) { e.preventDefault(); key = null; release(); } });
menu.addEventListener('click', e => { const action = (e.target as Element).closest<HTMLButtonElement>('button[data-action]')?.dataset.action; if (!action) return; switch (action) { case 'play': start(); break; case 'retry': start(false, true); break; case 'practice': start(true); break; case 'resume': resume(); break; case 'title': showTitle(); break; case 'how': help(); break; } });
menu.addEventListener('cancel', e => { e.preventDefault(); if (state === 'paused' || state === 'help' && (runOpen || practice)) resume(); });
$('mute').addEventListener('click', () => { audio.toggle(); syncAudio(); }); $('pause').addEventListener('click', pause); $('help').addEventListener('click', help);
window.addEventListener('blur', pause); document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
window.addEventListener('pagehide', quit); window.addEventListener('arcade:portal-return', quit);
let previous = performance.now();
function tick(now: number): void { const dt = Math.min(.05, Math.max(0, (now - previous) / 1000)); previous = now; if (state === 'playing' && !document.hidden) run.step(dt); const s = run.snapshot(); update(s); paintFireworks(canvas, s); requestAnimationFrame(tick); }
if (import.meta.env.DEV) Object.assign(window, { __fireworkInspection: () => ({ state, best, ...run.snapshot(), duration: RUN_SECONDS }) });
telemetry.trackEvent('game_open'); syncAudio(); showTitle(); requestAnimationFrame(tick);
