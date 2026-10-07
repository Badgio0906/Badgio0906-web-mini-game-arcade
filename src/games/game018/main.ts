import './style.css';
import { StorageService } from '../../core/StorageService';
import { AudioService } from '../../core/AudioService';
import { TelemetryService } from '../../core/TelemetryService';
import { CreditService } from '../../core/CreditService';
import { requestRewardedCredit } from '../../core/RewardService';
import { ShoeRun } from './ShoeRun';
import { ShoeBoard } from './ShoeBoard';
import { drawShoe } from './ShoeArt';
import { spinExplanation } from './spinGuide';
import {RARE_LABELS} from './rarePresentation';
import { SHOES, shoeFor } from './shoes';
import { formatDistance, simulate } from './physics';
import type { Inputs, Phase, PracticeStage, ShoeEvent, ShoeType } from './types';

type Screen = 'title' | 'explanation' | 'practice' | 'practice-step-complete' | 'practice-complete' | 'selection' | 'playing' | 'paused' | 'result' | 'reward';
const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;
const storage = new StorageService(undefined, 'web-mini-arcade:v1:game018:');
const telemetry = new TelemetryService(storage, 'game018'), audio = new AudioService(storage), credits = new CreditService(storage, telemetry);
const app = $('app'), menu = $('menu'), canvas = $<HTMLCanvasElement>('shoe-canvas'), abort = new AbortController();
const board = new ShoeBoard(canvas), run = new ShoeRun(onEvent), origins = new Map<number, { epoch: number; approved: boolean; handled: boolean }>(), held = new Set<string>();
let screen: Screen = 'title', previousScreen: Screen = 'playing', selected: ShoeType = 'sneaker', stage: PracticeStage = 0, epoch = 0, frame = 0, disposed = false, ended = true, runId = '', lastTone = 0;
let bestDistance = storage.readNumber('bestDistanceDecimeters', 0) / 10, bestScore = storage.readNumber('bestScore', 0);
let shoeRecordAt:number|null=null,startShoeBest=0;
const now = (): number => performance.now();
const text = (id: string, value: string): void => { const e = $(id); if (e.textContent !== value) e.textContent = value; };
const button = (id: string, value: string, primary = false): string => '<button id="' + id + '" class="' + (primary ? 'primary' : '') + '" type="button">' + value + '</button>';
const actions = (value: string): string => '<div class="menu-actions">' + value + '</div>';
const titleButton = (): string => button('title-button', 'タイトル');
const strengths: Record<ShoeType, string> = { paper: '軽さ・高度・浮遊。壁は苦手。', zori: '回転と安定。SPIN BONUS特化。', sneaker: '万能。飛距離の基本を覚える一足。', leather: '重さと貫通。低ANGLEで壁を突破。', 'iron-geta': '重い。正確なANGLE＋SPIN＋MAXで化ける。' };
const phaseLabels: Record<Phase, string> = { angle: '01 / ANGLE', 'angle-lock': 'ANGLE LOCK!', spin: '02 / SPIN', 'spin-lock': 'SPIN LOCK!', power: '03 / POWER', max: 'JUST MAX!!', kick: 'いっけぇぇぇぇ！！', flight: 'SHOE IN THE SKY!', landing: 'ポスッ。', result: 'ONE SHOE. BIG JOURNEY.', 'practice-complete': 'PRACTICE COMPLETE' };
function setScreen(next: Screen): void {
  epoch++; screen = next; app.dataset.state = next; menu.hidden = next === 'playing' || next === 'practice';
  if (document.activeElement instanceof HTMLElement && (menu.contains(document.activeElement) || document.activeElement === $('control-button'))) document.activeElement.blur();
  if (next === 'title') menu.innerHTML = '<span class="menu-eyebrow">JUST A SHOE. NOTHING ELSE.</span><h1>靴とばそ<small>～Shoe fly in the sky～</small></h1><p>角度、回転、パワー。<br/>3回止めたら、とんでもない旅へ。</p>' + actions(button('play-button', 'すぐ遊ぶ', true) + button('tutorial-explain-button', '説明を見る') + button('tutorial-again-button', '練習する')) + '<p class="menu-detail">クリック／タップ／Enter／Space<br/>無料・何度でも。BEST SCORE ' + bestScore.toLocaleString() + '</p>';
  if (next === 'explanation') menu.innerHTML = '<span class="menu-eyebrow">THREE STOPS. ONE SHOE.</span><h2>靴は履くもの？<br/>それ誰が決めた？</h2><ol><li><b>ANGLE</b> 足を止める。低く＝破壊、高く＝空。</li><li><b>SPIN</b> 足首を左へ＝←反時計回り、右へ＝→時計回り。靴の回転を見て止める。強さで安定・貫通が変わる。</li><li><b>POWER</b> MAXを狙って止める。靴、発射。</li></ol><p>ボタンも画面も同じ操作。<br/>同じ強さなら左右の飛距離は同じ。<br/>練習では本物の軌道をプレビュー。</p>' + actions(button('tutorial-practice-button', '練習する', true) + button('skip-button', 'すぐ遊ぶ') + titleButton());
  if (next === 'practice-step-complete') menu.innerHTML = '<span class="menu-eyebrow">PRACTICE ' + (stage + 1) + ' / 4</span><h2>' + ['ANGLE LOCK!', 'SPIN LOCK!', 'POWER LOCK!'][stage] + '</h2><p>' + run.feedback + '</p>' + actions(button('practice-next-button', stage === 2 ? '3つ続けて試す' : '次へ', true) + button('practice-repeat-button', 'もう一度') + button('skip-button', 'すぐ遊ぶ')) + '<p class="menu-detail">練習はSCORE・BEST・CREDITに影響しません。</p>';
  if (next === 'practice-complete') menu.innerHTML = '<span class="menu-eyebrow">ALL FOUR STEPS COMPLETE</span><h2>ただの靴。<br/>とんでもない旅。</h2><p>低く＝破壊。中くらい＝距離。高く＝空。<br/>左ひねり＝反時計、右ひねり＝時計。<br/>回転の強さで安定・貫通、POWERで初速が変わる。</p>' + actions(button('tutorial-start-button', '5つの靴を選ぶ', true) + titleButton()) + '<p class="menu-detail">練習の記録はBESTには入りません。</p>';
  if (next === 'selection') {
    menu.innerHTML = '<span class="menu-eyebrow">PICK YOUR EXPERIMENT</span><h2>今日、飛ぶのは？</h2><div class="shoe-list">' + SHOES.map(shoe => '<button class="shoe-card" data-shoe="' + shoe.id + '" aria-pressed="' + (shoe.id === selected) + '"><canvas width="130" height="68" aria-hidden="true"></canvas><span><b>' + shoe.nameJa + '</b><small>' + shoe.name + '</small><em>' + shoe.tagline + '</em></span></button>').join('') + '</div><p id="shoe-detail" class="shoe-detail"></p>' + actions(button('start-button', 'この靴で飛ばす', true) + titleButton());
    drawChoices(); updateSelection();
  }
  if (next === 'paused') menu.innerHTML = '<span class="menu-eyebrow">SHOE TAKES A BREATHER</span><h2>靴も時計も、お休み。</h2><p>入力と飛行をそのまま保っています。</p>' + actions(button('resume-button', '続きから', true) + titleButton());
  if (next === 'result' && run.result) {
    const r = run.result, s = r.score;
    menu.innerHTML = '<span class="menu-eyebrow">' + shoeFor(r.inputs.shoeType).name + ' · LANDED</span><h2>靴、そこまで行く？</h2><div class="result-metrics"><div><span>飛距離</span><strong id="result-distance">' + formatDistance(r.distance) + '</strong></div><div><span>最高高度</span><strong>' + formatDistance(r.height) + '</strong></div><div><span>BREAK / COMBO</span><strong>' + r.breaks + ' / ' + r.maxBreakCombo + '</strong></div><div><span>SPIN / POWER</span><strong>' + r.spinRating + ' / ' + r.powerRating + '</strong></div></div><p class="specials">' + ([...(run.presentation.selected?[RARE_LABELS[run.presentation.selected]]:[]),...r.specials].join(' · ') || 'NEXT: 別の組み合わせを試そう。') + '</p><p class="score-breakdown">DISTANCE ' + s.distance.toLocaleString() + ' ＋ HEIGHT ' + s.height.toLocaleString() + ' ＋ BREAK ' + s.breaks.toLocaleString() + '<br/>SPIN ' + s.spin.toLocaleString() + ' ＋ MAX ' + s.justMax.toLocaleString() + ' ＋ SPECIAL ' + s.special.toLocaleString() + '</p><p class="total-label">TOTAL <strong id="result-score">' + s.total.toLocaleString() + '</strong></p><p class="menu-detail">BEST DISTANCE ' + formatDistance(bestDistance) + ' · SCORE ' + bestScore.toLocaleString() + '</p>' + actions(button('retry-button', 'もう一回', true) + button('change-shoe-button', '靴を変える') + '<a href="./index.html">ゲームセンター</a>');
  }
  if (next === 'reward') menu.innerHTML = '<h2>CREDITを補充</h2><p>開発用Stub。本番広告はありません。</p>' + actions(button('reward-confirm-button', '+3 CREDIT', true) + titleButton());
  sync();
}
function drawChoices(): void {
  menu.querySelectorAll<HTMLButtonElement>('[data-shoe]').forEach(card => { const c = card.querySelector('canvas')!.getContext('2d')!; drawShoe(c, card.dataset.shoe as ShoeType, 64, 32, 1.12); });
}
function updateSelection(): void {
  menu.querySelectorAll<HTMLButtonElement>('[data-shoe]').forEach(card => card.setAttribute('aria-pressed', String(card.dataset.shoe === selected)));
  text('shoe-detail', strengths[selected] + ' この靴のBEST ' + formatDistance(storage.readNumber('shoeBestDecimeters:' + selected, 0) / 10));
  run.shoeType = selected;
}
function sync(): void {
  const active = screen === 'playing' || screen === 'practice';
  $('skip-practice-button').hidden = screen !== 'practice';
  text('distance-value', formatDistance(active || screen === 'paused' || screen === 'result' ? run.position.x : 0));
  text('height-value', formatDistance(active || screen === 'paused' || screen === 'result' ? run.maxHeight : 0));
  text('break-value', String(active || screen === 'paused' || screen === 'result' ? run.breaks : 0)); text('best-value', formatDistance(bestDistance));
  text('angle-value', run.locked.angle === null ? '—' : run.angle.toFixed(0) + '°'); text('spin-value', run.locked.spin === null ? '—' : Math.abs(run.spin) < .04 ? '0' : (run.spin > 0 ? '← ' : '→ ') + Math.abs(run.spin * 100).toFixed(0)); text('power-value', run.locked.power === null ? '—' : run.justMax ? 'MAX!' : run.power.toFixed(0));
  text('mute-button', audio.muted ? '音 OFF' : '音 ON'); $('mute-button').setAttribute('aria-pressed', String(audio.muted));
  $<HTMLButtonElement>('pause-button').disabled = !(active || screen === 'paused'); text('pause-button', screen === 'paused' ? '▶' : 'Ⅱ'); $('pause-button').setAttribute('aria-label', screen === 'paused' ? '再開' : '一時停止');
  $<HTMLButtonElement>('control-button').disabled = !active || !['angle', 'spin', 'power'].includes(run.phase);
  text('control-button', run.phase === 'angle' ? 'ANGLEを止める' : run.phase === 'spin' ? 'SPINを止める' : run.phase === 'power' ? 'POWERを止める · MAXを狙え！' : run.phase === 'flight' ? '靴、飛んでます。' : phaseLabels[run.phase]);
  text('phase-label', (run.practice && screen === 'practice' ? '練習 ' + (stage + 1) + '/4 · ' : '') + phaseLabels[run.phase] + (run.phase === 'flight' ? ' · ' + run.route.toUpperCase() + ' ROUTE' : ''));
  text('live-status', run.phase === 'angle' ? '低く＝破壊。中くらい＝距離。高く＝空。' : run.phase === 'spin' ? spinExplanation(run.spin) : run.phase === 'power' ? 'メーターの右端！ JUST MAXを狙え！' : run.phase === 'flight' ? (run.effects.at(-1)?.name || '靴が主役。どこまで行く？') : run.phase === 'result' ? '着地！ 次は別の角度・回転・靴で飛ばそう。' : run.phase === 'landing' ? 'ポスッ。靴の旅、ここまで。' : run.feedback || '靴は履くもの？ それ誰が決めた？');
  app.dataset.phase = run.phase; app.dataset.shoe = selected;
}
let rareShownForRun = '';
function onEvent(event: ShoeEvent): void {
  if (event.type === 'phase') {
    epoch++;
    if (event.phase === 'max') audio.tone(700, 2000, .23, 'triangle', 0, .06);
    if(event.phase==='kick')audio.tone(run.justMax?240:170,38,run.justMax?.28:.22,'sawtooth',0,run.justMax?.06:.04);
    if (event.phase === 'landing') audio.tone(110, 55, .09, 'sine', 0, .03);
    if (event.phase === 'practice-complete' && stage < 3) { telemetry.trackEvent('tutorial_step_complete', { step: stage + 1 }); setScreen('practice-step-complete'); }
    if (!run.practice && !ended) telemetry.trackEvent('phase_reached', { runId, phase: event.phase });
    if (!run.practice && !ended && event.phase === 'kick') telemetry.trackEvent('specific_game_events', { runId, event: 'kick', just:run.justMax, shoe: selected, angle: run.angle, spin: run.spin, power: run.power });
  }
  if(event.type==='presentation'&&!run.practice&&!ended)telemetry.trackEvent('specific_game_events',{runId,event:'rare_draw',presentation_id:event.draw.id,presentation_seed:event.draw.seed,eligible:true,won:event.draw.won,probability:event.draw.probability});
  if (event.type === 'lock') audio.tone(event.step === 'spin' ? 720 : 430, event.step === 'spin' ? 190 : 570, .07, 'triangle', 0, .025);
  if (event.type === 'lock' && !run.practice && !ended) telemetry.trackEvent('specific_game_events', { runId, event: 'input_lock', step: event.step, value: event.value });
  if (event.type === 'impact') audio.tone(event.effect.name === 'BREAK!' ? 230 : 95, 40, .13, 'sawtooth', 0, .035);
  if(event.type==='special'&&event.effect.name==='UFO INCIDENT'&&!run.practice)telemetry.trackEvent('specific_game_events',{runId,event:'ufo_view_hold',duration_ms:1050});
  if (event.type === 'special') { audio.tone(800, 1200, .12, 'triangle', 0, .035); if (!run.practice) telemetry.trackEvent('milestone_reached', { runId, special: event.effect.name }); }
  if (event.type === 'end') {
    if (run.practice) { telemetry.trackEvent('practice_complete'); telemetry.trackEvent('tutorial_step_complete', { step: 4 }); setScreen('practice-complete'); return; }
    if (ended) return; ended = true;
    const r = event.result, distance = Math.round(r.distance * 10) / 10;
    if (distance > bestDistance) telemetry.trackEvent('best_update', { runId, metric: 'distance', score: distance, best: distance });
    if (r.score.total > bestScore) telemetry.trackEvent('best_update', { runId, metric: 'score', score: r.score.total, best: r.score.total });
    bestDistance = Math.max(bestDistance, distance); bestScore = Math.max(bestScore, r.score.total);
    storage.writeNumber('bestDistanceDecimeters', Math.round(bestDistance * 10)); storage.writeNumber('bestScore', bestScore);
    storage.writeNumber('shoeBestDecimeters:' + selected, Math.max(storage.readNumber('shoeBestDecimeters:' + selected, 0), Math.round(r.distance * 10)));
    telemetry.trackEvent('run_end', { runId, outcome: 'clear', shoe: selected, score: r.score.total, distance: r.distance, max_height:r.height, landing_type:'landed', time: run.time }); telemetry.trackEvent('score', { runId, score: r.score.total, best: bestScore }); telemetry.trackEvent('run_duration', { runId, seconds: run.time, reason: 'landed' });
    audio.tone(660, 990, .18, 'triangle', 0, .04); setScreen('result');
  }
}
function explain(): void { quit(); telemetry.trackEvent('tutorial_start', { practiceAgain: storage.readBoolean('tutorialCompleted', false) }); setScreen('explanation'); }
function practice(which: PracticeStage): void { stage = which; setScreen('practice'); run.startPractice(now(), stage); sync(); }
function choose(): void { quit(); setScreen('selection'); }
function start(retry = false): void {
  if (disposed || screen === 'playing' || screen === 'practice' || credits.rewardPending) return;
  if (!credits.canPlay) { setScreen('reward'); return; }
  runId = 'game018-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8); if (credits.enabled && !credits.consume(runId)) return;
  ended = false;rareShownForRun='';shoeRecordAt=null;startShoeBest=storage.readNumber('shoeBestDecimeters:'+selected,0)/10; if (retry) telemetry.trackEvent('retry', { runId }); telemetry.trackEvent('run_start', { runId, shoe: selected }); void audio.unlock(); setScreen('playing'); run.start(now(), selected); sync();
}
function quit(): void { if (ended || run.practice) return; ended = true; run.pause(true, now()); telemetry.trackEvent('quit', { runId, time: run.time }); telemetry.trackEvent('run_end', { runId, outcome: 'quit', time: run.time }); }
function pause(): void { if (screen === 'playing' || screen === 'practice') { previousScreen = screen; run.pause(true, now()); if (run.paused) { telemetry.trackEvent('pause', { runId }); setScreen('paused'); } } else if (screen === 'paused') { run.pause(false, now()); telemetry.trackEvent('resume', { runId }); setScreen(previousScreen); } }
function stop(): void { if (screen === 'playing' || screen === 'practice') { void audio.unlock(); run.stop(now()); sync(); } }
app.addEventListener('pointerdown', e => {
  if (origins.size > 64) origins.clear(); const origin = { epoch, approved: e.isPrimary && e.button === 0 && !e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey, handled: false }; origins.set(e.pointerId, origin);
  if (origin.approved && ((e.target as Element).closest('#control-button') || e.target === canvas) && (screen === 'playing' || screen === 'practice')) { e.preventDefault(); origin.handled = true; stop(); }
}, { capture: true, signal: abort.signal });
app.addEventListener('click', e => { const origin = origins.get((e as PointerEvent).pointerId); origins.delete((e as PointerEvent).pointerId); if (origin && (!origin.approved || origin.handled || origin.epoch !== epoch)) { e.preventDefault(); e.stopImmediatePropagation(); } }, { capture: true, signal: abort.signal });
app.addEventListener('click', e => {
  if (e.button !== 0 || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || credits.rewardPending) return;
  const target = (e.target as Element).closest<HTMLButtonElement | HTMLAnchorElement>('button,a'); if (!target || target instanceof HTMLButtonElement && target.disabled) return;
  if (target instanceof HTMLAnchorElement) { quit(); telemetry.trackEvent('return_to_portal', { runId }); return; }
  if (target.dataset.shoe && screen === 'selection') { selected = target.dataset.shoe as ShoeType; updateSelection(); sync(); return; }
  switch (target.id) {
    case 'play-button': telemetry.trackEvent('tutorial_skip'); choose(); break; case 'start-button': start(); break; case 'retry-button': start(true); break; case 'change-shoe-button': choose(); break;
    case 'tutorial-explain-button': telemetry.trackEvent('tutorial_view'); explain(); break; case 'tutorial-again-button': quit(); telemetry.trackEvent('practice_start'); practice(0); break; case 'skip-button': case 'skip-practice-button': telemetry.trackEvent('tutorial_skip'); choose(); break; case 'tutorial-practice-button': telemetry.trackEvent('practice_start'); practice(0); break; case 'practice-repeat-button': practice(stage); break; case 'practice-next-button': practice((stage + 1) as PracticeStage); break;
    case 'tutorial-start-button': storage.writeBoolean('tutorialCompleted', true); telemetry.trackEvent('tutorial_complete'); choose(); break;
    case 'title-button': quit(); setScreen('title'); break; case 'pause-button': case 'resume-button': pause(); break; case 'mute-button': audio.toggle(); sync(); break; case 'control-button': stop(); break;
    case 'reward-confirm-button': { const pending = credits.requestRewardedCredit(requestRewardedCredit); menu.querySelectorAll<HTMLButtonElement>('button').forEach(b => { b.disabled = true; }); void pending.then(granted => { if (!disposed) setScreen(granted ? 'selection' : 'reward'); }); break; }
  }
}, { signal: abort.signal });
document.addEventListener('keydown', e => {
  if (e.repeat || held.has(e.code)) { if (e.code === 'Space' || e.code === 'Enter') e.preventDefault(); return; } held.add(e.code);
  if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
  if (e.code === 'Escape') { e.preventDefault(); pause(); return; }
  if ((e.code === 'Space' || e.code === 'Enter') && !(e.target as Element).closest('button:not(#control-button),a') && (screen === 'playing' || screen === 'practice')) { e.preventDefault(); stop(); }
}, { signal: abort.signal });
document.addEventListener('keyup', e => held.delete(e.code), { signal: abort.signal });
function blur(): void { held.clear(); if (screen === 'playing' || screen === 'practice') pause(); }
window.addEventListener('blur', blur, { signal: abort.signal }); document.addEventListener('visibilitychange', () => { if (document.hidden) blur(); }, { signal: abort.signal }); window.addEventListener('pagehide', e => { if (e.persisted) blur(); else quit(); }, { signal: abort.signal });
function tick(time: number): void {
  if (screen === 'playing' || screen === 'practice') run.settle(time);
  if(screen==='playing'&&run.phase==='flight'&&shoeRecordAt===null&&run.position.x>startShoeBest){shoeRecordAt=run.time;telemetry.trackEvent('specific_game_events',{runId,event:'shoe_best_crossed',shoe:selected,distance:run.position.x,previous_best:startShoeBest});}
  board.render(run, time, { recordAt:shoeRecordAt, title: ['title', 'explanation', 'selection', 'reward'].includes(screen) }); sync();
  const rare = run.presentation.selected;
  if (!run.practice && rare && rareShownForRun !== rare && document.visibilityState === 'visible' && ['playing','result'].includes(screen) && (rare === 'iron-meteor' ? ['landing','result'].includes(run.phase) : run.phase === 'flight')) { rareShownForRun = rare; telemetry.trackEvent('specific_game_events',{runId,event:'rare_effect_shown',presentation_id:rare,shown:true}); }
  if ((screen === 'playing' || screen === 'practice') && (run.phase === 'power' || run.phase === 'flight') && time - lastTone > (run.phase === 'power' ? 160 : 480)) { lastTone = time; audio.tone(run.phase === 'power' ? 450 + run.power * 5 : 180, run.phase === 'power' ? 450 + run.power * 5 : 600, .06, 'sine', 0, .007); }
  frame = requestAnimationFrame(tick);
}
telemetry.trackEvent('game_open'); setScreen('title'); frame = requestAnimationFrame(tick);
if (import.meta.env.DEV) (window as unknown as { __arcadeDebug: unknown }).__arcadeDebug = Object.freeze({ gameId: 'game018', state: () => screen, snapshot: () => run.snapshot(), projection: () => board.projection, telemetry: () => telemetry.getEvents(), simulate: (input: Inputs) => structuredClone(simulate(input)) });
if (import.meta.hot) import.meta.hot.dispose(() => { disposed = true; cancelAnimationFrame(frame); abort.abort(); audio.destroy(); board.destroy(); delete (window as unknown as { __arcadeDebug?: unknown }).__arcadeDebug; });
