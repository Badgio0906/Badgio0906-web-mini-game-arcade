import './style.css';
import { StorageService } from '../../core/StorageService';
import { TelemetryService } from '../../core/TelemetryService';
import { AudioService } from '../../core/AudioService';
import { createElevatorGame } from './ElevatorBoard';
import type { ElevatorEvent, ElevatorSnapshot, ElevatorResult } from './contracts';
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const app = $('app'), overlay = $('overlay');
const storage = new StorageService(undefined, 'web-mini-arcade:v1:game007:');
const telemetry = new TelemetryService(storage, 'game007'), audio = new AudioService(storage);
const listeners = new AbortController();
type Screen = 'title' | 'explanation' | 'playing' | 'practice' | 'paused' | 'milestone' | 'result' | 'practice-result';
let state: Screen = 'title', beforePause: 'playing' | 'practice' = 'playing', training = false, sequence = 0, runId = 0, ended = true;
let best = storage.readNumber('best:transport:v2', 0), lastResult: ElevatorResult | null = null;
const legacy = storage.readNumber('best', 0);
const button = (id: string, text: string, primary = false) => `<button type="button" id="${id}" class="${primary ? 'primary' : 'secondary'}">${text}</button>`;
function event(e: ElevatorEvent) {
  if (training) return;
  const fields: Record<string, string | number | boolean> = { event_type: e.type, rulesVersion: 2, runId };
  for (const [key, value] of Object.entries(e)) if (value !== null && value !== undefined) fields[key] = value;
  telemetry.trackEvent('specific_game_events', fields);
  if (e.type === 'delivery') audio.tone(e.onTime ? 600 : 160, e.onTime ? 900 : 100, .12, 'sine', 0, .025);
}
function update(s: ElevatorSnapshot) {
  $('score-value').textContent = String(s.score); $('floor-value').textContent = `${s.floor}F → ${s.nextStop > s.target ? s.target : s.nextStop}F`;
  $('time-value').textContent = `${s.remaining.toFixed(1)}s`; $('best-value').textContent = String(best); app.dataset.phase = s.phase;
  $('mode-label').textContent = training ? '練習 · 記録なし' : s.mode === 'roof' ? '屋上特別便' : `通常便 ${s.scenario + 1} / 10F`;
  $('phase-label').textContent = training ? '会社員を乗せる → 余裕を残して出発 → 2Fの速達便を運ぶ。' : state === 'paused' ? 'かごも締切も停止中' : s.phase === 'boarding' ? '行先・次の待機・締切を見て、空けて出発も。' : s.phase === 'travel' ? '移動中。次の依頼を確認。' : s.phase === 'unloading' ? '行先で降車中。届いた依頼だけ得点。' : '乗車と出発の準備中';
  if (s.pending && state === 'playing') screen('milestone');
}
function finish(result: ElevatorResult) {
  lastResult = result;
  if (training) { telemetry.trackEvent('practice_complete', { success: result.score >= 550, rulesVersion: 2 }); screen('practice-result'); return; }
  if (!ended) {
    ended = true;
    if (result.score > best) { best = result.score; storage.writeNumber('best:transport:v2', best); telemetry.trackEvent('specific_game_events', { event_type: 'best_updated', best, rulesVersion: 2 }); }
    telemetry.trackEvent('run_end', { runId, score: result.score, floor: result.floor, outcome: result.outcome, seconds: result.time, rulesVersion: 2, delivered: result.delivered, expired: result.expired });
  }
  screen('result');
}
const controller = createElevatorGame($('game-canvas'), { onUpdate: update, onEnd: finish, onEvent: event });
function screen(next: Screen) {
  state = next; app.dataset.state = state; overlay.hidden = ['playing', 'practice'].includes(state);
  $('mute-button').textContent = audio.muted ? '音 OFF' : '音 ON'; $('mute-button').setAttribute('aria-pressed', String(audio.muted));
  $<HTMLButtonElement>('pause-button').disabled = !['playing', 'practice', 'paused'].includes(state);
  $<HTMLButtonElement>('pause-button').textContent = state === 'paused' ? '▶' : 'Ⅱ';
  const actions = (contents: string) => `<div class="menu-actions">${contents}</div>`;
  if (next === 'title') overlay.innerHTML = `<article class="dispatch-note"><span class="eyebrow">BUILDING SERVICES / LIFT 007</span><h1>まだ乗れます<small>ELEVATOR OVERLOAD</small></h1><p>誰を乗せ、どこで降ろす？<br>次の依頼のために、空きを残そう。</p><p class="mini-best">輸送ルール BEST <b>${best}</b>${legacy ? `<small>旧ルール BEST ${legacy}（別記録）</small>` : ''}</p>${actions(button('play-button', 'すぐ遊ぶ', true) + button('explain-button', '説明を見る') + button('practice-button', '練習する'))}<small>制限65秒 · 上昇便1F→10F · 得点は配達時だけ</small></article>`;
  if (next === 'explanation') overlay.innerHTML = `<article class="dispatch-note explanation"><h2>空きを残す、運ぶ判断</h2><p>乗車では0点。行先で降ろして依頼点！<br>次の2階の待機を見て、今は空けて出発も。</p><ul><li>← / A：候補を見送る</li><li>→ / D：450kg以内なら乗せる</li><li>Space：残りの候補を見送り、出発</li><li>同じ行先は一度の停車で降車</li><li>速達は締切までに届けると得点</li></ul><p>時計は判断中も進みます。締切はその便の開始から。<br>最短到着は、今の名簿と停止費用から計算。<br>途中で乗せたり待つと、到着は遅れます。</p>${actions(button('play-button', 'すぐ遊ぶ', true) + button('practice-button', '練習する') + button('title-button', 'タイトル'))}</article>`;
  if (next === 'paused') overlay.innerHTML = `<article class="dispatch-note"><h2>一時停止</h2><p>時計・移動・締切は停止中。</p>${actions(button('resume-button', '再開', true) + button('title-button', 'タイトル'))}</article>`;
  if (next === 'milestone') { controller.pause(true); overlay.innerHTML = `<article class="dispatch-note"><h2>通常便、お届け完了！</h2><p>屋上まで引越し荷物、まだ乗れます？<br>大きな荷物か、途中の速達か。</p>${actions(button('finish-button', 'ここで記録を確定', true) + button('roof-button', '屋上特別便へ'))}</article>`; }
  if (next === 'result' || next === 'practice-result') {
    const r = lastResult!; const pass = r.score >= 550;
    overlay.innerHTML = `<article class="dispatch-note result-note"><h2>${training ? pass ? '練習完了！' : 'もう一度、空きを残そう' : '輸送記録'}</h2><p>${r.reason}</p><div class="result-score"><strong>${r.score}</strong><span>${training ? '練習点 · BESTへ保存しません' : '配達点 / RULES 2'}</span></div><p>${r.delivered}組配達 · 期限切れ ${r.expired}組<br>${r.floor}F / ${r.time.toFixed(1)}秒</p>${actions(training ? button('play-button', '本番へ', true) + button('practice-button', '再練習') + button('title-button', 'タイトル') : button('retry-button', 'もう一便', true) + button('title-button', 'タイトル'))}</article>`;
  }
}
function start(practice = false, retry = false) {
  if (['playing', 'practice', 'paused', 'milestone'].includes(state)) return;
  training = practice; ended = practice; lastResult = null; void audio.unlock();
  if (practice) telemetry.trackEvent('practice_start', { rulesVersion: 2 });
  else { runId++; ended = false; if (retry) telemetry.trackEvent('retry', { runId, rulesVersion: 2 }); telemetry.trackEvent('run_start', { runId, rulesVersion: 2, scenario: sequence % 3 }); }
  screen(practice ? 'practice' : 'playing'); controller.start(practice ? 0 : sequence++ % 3, practice);
}
function pause() { if (state === 'playing' || state === 'practice') { beforePause = state; controller.pause(true); if (!training) telemetry.trackEvent('pause', { runId }); screen('paused'); } else if (state === 'paused') { screen(beforePause); controller.pause(false); if (!training) telemetry.trackEvent('resume', { runId }); } }
function title() {
  if (!training && !ended && ['playing', 'paused', 'milestone'].includes(state)) { const s = controller.snapshot(); telemetry.trackEvent('run_end', { runId, outcome: 'quit', score: s.score, seconds: s.time, rulesVersion: 2 }); ended = true; }
  training = false; controller.title(); screen('title');
}
app.addEventListener('click', e => {
  if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
  const b = (e.target as Element).closest<HTMLButtonElement>('button'); if (!b || b.disabled) return;
  switch (b.id) { case 'play-button': start(); break; case 'retry-button': start(false, true); break; case 'practice-button': start(true); break;
    case 'explain-button': telemetry.trackEvent('tutorial_view', { rulesVersion: 2 }); screen('explanation'); break;
    case 'title-button': case 'brand-button': title(); break; case 'pause-button': case 'resume-button': pause(); break;
    case 'mute-button': audio.toggle(); $('mute-button').textContent = audio.muted ? '音 OFF' : '音 ON'; $('mute-button').setAttribute('aria-pressed', String(audio.muted)); break;
    case 'finish-button': case 'roof-button': if (state === 'milestone') { const choice = b.id === 'roof-button' ? 'roof' : 'finish'; controller.pause(false); screen('playing'); controller.choose(choice); } break;
  }
}, { signal: listeners.signal });
document.addEventListener('keydown', e => {
  if (e.repeat || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
  if (e.key === 'Escape') { e.preventDefault(); pause(); }
  if ((e.key === ' ' || e.key === 'Enter') && !(e.target as Element)?.closest('button,a') && state === 'title') { e.preventDefault(); start(); }
}, { signal: listeners.signal });
document.addEventListener('visibilitychange', () => { if (document.hidden && ['playing', 'practice'].includes(state)) pause(); }, { signal: listeners.signal });
window.addEventListener('blur', () => { if (['playing', 'practice'].includes(state)) pause(); }, { signal: listeners.signal });
telemetry.trackEvent('game_open'); screen('title');
if (import.meta.env.DEV) (window as unknown as { __arcadeDebug: unknown }).__arcadeDebug = Object.freeze({ gameId: 'game007', snapshot: () => controller.snapshot(), inspection: () => controller.inspection(), state: () => state, telemetry: () => telemetry.getEvents() });
if (import.meta.hot) import.meta.hot.dispose(() => { listeners.abort(); controller.destroy(); audio.destroy(); delete (window as unknown as { __arcadeDebug?: unknown }).__arcadeDebug; });
