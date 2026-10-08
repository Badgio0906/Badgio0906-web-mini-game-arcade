import { createGameRecordSession } from '../../records/RecordSharing';
import { createOnboarding } from '../../arcade/onboarding';
import './style.css';
import { StorageService } from '../../core/StorageService';
import { CreditService } from '../../core/CreditService';
import { TelemetryService } from '../../core/TelemetryService';
import { AudioService } from '../../core/AudioService';
import { requestRewardedCredit } from '../../core/RewardService';
import { createSortGame } from './SortBoard';
import { ruleText, sideText, type SortLanguage } from './localization';
import type { SortEvent, SortResult, SortSnapshot } from './contracts';
const recordSession = createGameRecordSession('game005');

type Screen = 'title' | 'playing' | 'paused' | 'result' | 'reward';
const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;
const app = $('app'); const overlay = $('overlay');
const storage = new StorageService(undefined, 'web-mini-arcade:v1:game005:');
let language: SortLanguage = storage.readBoolean('english', false) ? 'en' : 'ja';
const t = (ja: string, en: string): string => language === 'ja' ? ja : en;
const telemetry = new TelemetryService(storage, 'game005');
const onboarding = createOnboarding({ gameId: 'game005', storage, telemetry });
const credits = new CreditService(storage, telemetry); const audio = new AudioService(storage);
const listeners = new AbortController();
let state: Screen = 'title'; let runId = ''; let lastResult: SortResult | null = null;
let best = storage.readNumber('best', 0); let newBest = false; let ended = true;
let resultAvailableAt = 0; let rewardOfferVisible = false; let disposed = false;
let resultTimer: ReturnType<typeof window.setTimeout> | undefined;
const primary = (id: string, text: string) => `<button id="${id}" type="button" class="primary">${text}<span aria-hidden="true">→</span></button>`;
const titleButton = () => `<button id="title-button" type="button" class="secondary" aria-label="${t('タイトルに戻る', 'Return to title')}">${t('タイトル', 'TITLE')}</button>`;
const stub = () => `<small class="stub-note">${t('開発版 Rewarded Ad Stub<br />本番広告は表示されません。', 'Development Rewarded Ad Stub<br />No real advertising is shown.')}</small>`;
function trackRewardOffer(): void {
  if (!credits.canPlay && !rewardOfferVisible && $('reward-button')) { rewardOfferVisible = true; telemetry.trackEvent('reward_offer_shown', { runId }); }
}
function sync(): void {
  app.dataset.state = state; app.dataset.language = language; document.documentElement.lang = language;
  $('credit-count').textContent = String(credits.credits);
  $('credit-dots').textContent = Array.from({ length: 3 }, (_, i) => i < credits.credits ? '●' : '○').join(' ');
  $('best-value').textContent = String(best); $('mute-button').textContent = audio.muted ? t('音 OFF', 'Sound OFF') : t('音 ON', 'Sound ON');
  $('mute-button').setAttribute('aria-label', audio.muted ? t('音声をオンにする', 'Enable sound') : t('音声をミュート', 'Mute sound')); $('mute-button').setAttribute('aria-pressed', String(audio.muted));
  const button = $<HTMLButtonElement>('pause-button'); button.disabled = state !== 'playing' && state !== 'paused'; button.textContent = state === 'paused' ? '▶' : 'Ⅱ'; button.setAttribute('aria-label', state === 'paused' ? t('再開', 'Resume') : t('一時停止', 'Pause'));
  for (const [lang, id] of [['ja','language-ja-button'], ['en','language-en-button']] as const) { $(id).setAttribute('aria-pressed', String(language === lang)); $<HTMLButtonElement>(id).disabled = credits.rewardPending; }
  writeText('sorted-label', t('仕分け数', 'SORTED')); writeText('combo-label', t('連続', 'COMBO')); writeText('best-label', t('自己最高', 'BEST'));
  writeText('controls-label', t('← → / A D / 左右をタップ', '← → / A D / TAP LEFT OR RIGHT')); writeText('site-note', t('仕分ける前に、今のルール。', 'Check the rule before sorting.'));
  $('stage').setAttribute('aria-label', t('仕分けレーン。画面の左半分で左へ、右半分で右へ', 'Sorting lane. Tap its left or right half to sort.'));
  $('brand-button').setAttribute('aria-label', t('右往左往の仕分け術 タイトルに戻る', 'SORT SHIFT · Return to title'));
  document.querySelector('.language-controls')?.setAttribute('aria-label', t('表示言語', 'Display language'));
  document.querySelector('.arcade')?.setAttribute('aria-label', t('右往左往の仕分け術 ゲーム', 'SORT SHIFT game'));
  document.querySelector<HTMLMetaElement>('meta[name="description"]')!.content = t('今のルールを見て、左？右？荷物を次々仕分ける判断ゲーム SORT SHIFT。PC・スマートフォン対応。', 'Read the current rule and sort parcels left or right in SORT SHIFT. Play on desktop or phone.');
  const intro = document.querySelector('.intro')!;
  intro.querySelector('.eyebrow')!.textContent = t('仕分け工場へようこそ', 'WELCOME TO THE SORTING FLOOR');
  intro.querySelector('.lede')!.innerHTML = t('荷物は次々。<br />ルールは、時々変わる。', 'Parcels keep coming.<br />Rules change along the way.');
  intro.querySelector('.intro-copy')!.innerHTML = t('形、明るさ、大きさ、記号。<br />今のルールだけを見て、仕分けよう。', 'Shape, light, size and symbol.<br />Sort using the current rule.');
  const routing = intro.querySelector('.routing-note')!;
  routing.querySelector('span:first-child')!.textContent = t('見る', 'LOOK'); routing.querySelector('span:nth-of-type(2)')!.textContent = t('仕分け', 'SORT');
  routing.querySelector('small')!.textContent = t('ルールが変わったら、ひと呼吸。', 'Take a breath when the rule changes.');
  intro.querySelector('.controls-note')!.innerHTML = `<kbd>←</kbd><kbd>→</kbd> ${t('または A / D<br />スマホは画面の左・右をタップ', 'or A / D<br />Phone: tap the left or right half')}`;
  intro.querySelector('.research-note')!.innerHTML = t('Game005 / 判断とルール切替<br />あと1個、迷わず仕分けよう。', 'Game005 / Decision & Rule Switching<br />Sort one more without hesitation.');

}
function writeText(id: string, value: string): void { const element = $(id); if (element && element.textContent !== value) element.textContent = value; }
function update(snapshot: SortSnapshot): void {
  writeText('score-value', String(snapshot.sorted)); writeText('combo-value', String(snapshot.combo));
  if (app.dataset.phase !== snapshot.phase) app.dataset.phase = snapshot.phase;
  writeText('phase-label', state === 'paused' ? t('一時停止', 'PAUSED') : snapshot.phase === 'rule_change' ? t('ルール変更！', 'RULE CHANGE!') : snapshot.phase === 'dispatch' ? t('仕分け成功 ✓', 'SORTED ✓') : snapshot.phase === 'sorting' ? t('左？右？', 'LEFT OR RIGHT?') : t('ルールを確認', 'CHECK THE RULE'));
  writeText('turn-label', snapshot.phase === 'rule_change' ? t('ルールが変わる！', 'The rule is changing!') : snapshot.phase === 'dispatch' ? t('ナイス仕分け！', 'Nicely sorted!') : t('今のルールで、左？右？', 'With this rule: left or right?'));
  writeText('phase-hint', snapshot.phase === 'rule_change' ? t('新しい左右の条件を確認しよう。', 'Check the new left and right conditions.') : t('荷物の条件と、今のルールを見比べよう。', 'Compare the parcel with the current rule.'));
  writeText('rule-change-count', `${snapshot.ruleChanges} ${t('回ルール変更', 'RULE CHANGES')}`);
}
/** Renders the current view without touching the run, practice progress or result gate. */
function renderScreen(): void {
  if (state === 'playing') {
    overlay.innerHTML = `<article class="play-card"><span class="eyebrow">${t('見て → 仕分け → 次へ', 'LOOK → SORT → REPEAT')}</span><h2 id="turn-label"></h2><p id="phase-hint"></p><p>${t('← → / A D<br />または画面の左・右をタップ', '← → / A D<br />or tap the left or right half')}</p><b id="rule-change-count"></b></article>`; update(controller.snapshot()); return;
  }
  if (state === 'title') {
    overlay.innerHTML = `<article class="start-card"><span class="eyebrow">${t('仕分けの準備はいい？', 'READY FOR YOUR SHIFT?')}</span><h2 class="game-title">右往左往の仕分け術<small>SORT SHIFT</small></h2><p>${t('荷物を見て、今のルールで左か右へ。', 'Read the rule. Send each parcel left or right.')}</p><div class="mini-best">${t('自己最高', 'BEST')} <b>${best}</b> ${t('個', 'SORTED')}</div>${credits.canPlay ? primary('play-button', t('PLAY · 仕分け開始', 'PLAY · Start sorting')) : primary('reward-button', '+3 CREDIT')}<small class="input-note">${t('← → / A D / 画面の左・右をタップ', '← → / A D / TAP LEFT OR RIGHT')}</small>${credits.canPlay ? '' : stub()}</article>`;
  } else if (state === 'paused') {
    overlay.innerHTML = `<article class="start-card pause-card"><span class="eyebrow">${t('ひと息つこう', 'TAKE A SHORT BREAK')}</span><h2>${t('ひと休み。', 'Take a break.')}</h2><p>${t('荷物も時間も停止中。準備ができたら再開。', 'Parcels and the clock are paused. Resume when ready.')}</p><div class="paired-actions">${primary('resume-button', t('RESUME · 再開', 'RESUME'))}${titleButton()}</div></article>`;
  } else if (state === 'result' && lastResult) {
    const result = lastResult; const labels = ruleText(result.rule, language);
    const direction = sideText(result.expectedSide, language); const attribute = result.expectedSide === 'left' ? labels.left : labels.right;
    overlay.innerHTML = `<article class="result-card"><div class="result-heading"><span class="result-game-title">右往左往の仕分け術<small>SORT SHIFT</small></span><h2>${result.outcome === 'timeout' ? t('時間切れ！', 'Time is up!') : t('そっちじゃなかった！', 'Wrong side!')}</h2></div><div class="result-score"><b id="result-score">${result.sorted}</b><span>${t('仕分け数', 'SORTED')}</span>${newBest ? `<mark class="new-best">${t('自己新記録', 'NEW BEST')}</mark>` : ''}</div><dl class="result-details"><div><dt>${t('自己最高', 'BEST')}</dt><dd id="result-best">${best}</dd></div><div><dt>${t('連続', 'COMBO')}</dt><dd>${result.combo}</dd></div><div><dt>${t('時間', 'TIME')}</dt><dd>${result.time.toFixed(1)} s</dd></div><div><dt>CREDIT</dt><dd>${credits.credits} / 3</dd></div></dl><p class="result-reason">${result.outcome === 'timeout' ? t('仕分けの時間がなくなりました。', 'The parcel deadline expired.') : t(`${result.actualSide === 'left' ? '左' : '右'}を選びました。`, `You chose ${result.actualSide === 'left' ? 'LEFT' : 'RIGHT'}.`)}</p><div class="correct-direction">${t('正解は ', 'Correct: ')}${direction}<small>${labels.dimension} · ${attribute}</small></div><div class="result-actions">${credits.canPlay ? primary('retry-button', t('RETRY · もう1回', 'RETRY')) : primary('reward-button', '+3 CREDIT')}${titleButton()}</div><small class="result-note">${credits.canPlay ? t('次は、もう1個仕分けよう。', 'Sort one more next time.') : t('NO CREDIT · 開発版 Rewarded Ad Stub', 'NO CREDIT · Development Rewarded Ad Stub')}</small></article>`;
    recordSession.mount(overlay.firstElementChild as HTMLElement);
  } else if (state === 'reward') {
    overlay.innerHTML = `<article class="start-card reward-card"><span class="eyebrow">${t('もう一度仕分けよう', 'ONE MORE SHIFT')}</span><h2>${t('もうひと仕分け？', 'One more shift?')}</h2><p>${t('開発版の補充ボタンで<br /><b>+3 CREDIT</b>', 'Use the development refill button<br /><b>+3 CREDIT</b>')}</p><div class="paired-actions">${primary('reward-button', '+3 CREDIT')}${titleButton()}</div>${stub()}<p id="reward-status" role="status"></p></article>`;
  }
}
function setScreen(next: Screen, delay = false): void {
  if (resultTimer !== undefined) { window.clearTimeout(resultTimer); resultTimer = undefined; }
  state = next; sync(); if (credits.canPlay || next === 'playing') rewardOfferVisible = false;
  if (next === 'title') { writeText('score-value', '0'); writeText('combo-value', '0'); writeText('phase-label', t('準備OK', 'READY')); app.dataset.phase = 'ended'; }
  else if (next === 'paused') writeText('phase-label', t('一時停止', 'PAUSED'));
  else if (next === 'result' && lastResult) { writeText('phase-label', lastResult.outcome === 'timeout' ? t('時間切れ', 'TIME UP') : t('ルールを確認', 'CHECK THE RULE')); app.dataset.phase = 'ended'; }
  renderScreen();
  if (next === 'playing') return;
  if (next === 'result' && delay) {
    overlay.querySelectorAll<HTMLButtonElement>('button').forEach(button => { button.disabled = true; });
    resultTimer = window.setTimeout(() => { resultTimer = undefined; if (!disposed && state === 'result') { overlay.querySelectorAll<HTMLButtonElement>('button').forEach(button => { button.disabled = false; }); overlay.querySelector<HTMLButtonElement>('.primary')?.focus({ preventScroll: true }); } }, 300);
  }
  trackRewardOffer();
}
function changeLanguage(next: SortLanguage): void {
  if (disposed || credits.rewardPending || language === next) return;
  language = next; storage.writeBoolean('english', language === 'en'); sync(); renderScreen();
  if (state === 'playing' || state === 'paused') update(controller.snapshot());
  else if (state === 'title') writeText('phase-label', t('準備OK', 'READY'));
  else if (state === 'result' && lastResult) writeText('phase-label', lastResult.outcome === 'timeout' ? t('時間切れ', 'TIME UP') : t('ルールを確認', 'CHECK THE RULE'));
}
function sound(event: SortEvent): void {
  if (event.type === 'correct') { const pitch = 390 + Math.min(event.combo, 12) * 30; audio.tone(pitch, pitch * 1.3, 0.08, 'sine', 0, 0.045); if (event.combo > 4) audio.tone(pitch * 1.5, pitch * 1.5, 0.06, 'triangle', 0.025, 0.015); }
  if (event.type === 'rule_change') { audio.tone(520, 620, 0.12, 'triangle', 0, 0.035); audio.tone(700, 880, 0.14, 'sine', 0.11, 0.03); }
  if (event.type === 'mistake' || event.type === 'timeout') { audio.tone(230, 145, 0.18, 'triangle', 0, 0.04); audio.tone(160, 110, 0.16, 'sine', 0.06, 0.025); }
}
const controller = createSortGame($('game-canvas'), {
  onUpdate(snapshot) { if (state === 'playing' || state === 'paused') update(snapshot); }, onEvent: sound,
  onEnd(result) {
    if (state !== 'playing' || ended || disposed) return;
    ended = true; lastResult = result; newBest = result.sorted > best; best = Math.max(best, result.sorted); storage.writeNumber('best', best); credits.consume(runId); recordSession.complete(result.sorted, { metadata: { duration_seconds: result.time, outcome: result.outcome } });
    telemetry.trackEvent('run_end', { runId, outcome: 'over', score: result.sorted, time: result.time }); telemetry.trackEvent('score', { runId, score: result.sorted, best, newBest }); telemetry.trackEvent('run_duration', { runId, seconds: result.time, reason: 'over' });
    telemetry.trackEvent('sorted_count', { runId, count: result.sorted, combo: result.combo }); telemetry.trackEvent('rule_change_count', { runId, count: result.ruleChanges });
    resultAvailableAt = performance.now() + 300; setScreen('result', true);
  },
}, () => language);
function start(retry = false): void {
  if (onboarding.intercept(() => start(retry))) return;
  if (disposed || credits.rewardPending || state === 'playing' || state === 'paused' || (state === 'result' && performance.now() < resultAvailableAt)) return;
  if (!credits.canPlay) { setScreen('reward'); return; }
  void audio.unlock(); runId = `game005-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; ended = false; lastResult = null; newBest = false;
  if (retry) telemetry.trackEvent('retry', { runId }); recordSession.startRun(); telemetry.trackEvent('run_start', { runId, credits: credits.credits }); setScreen('playing'); controller.start();
}
function pause(): void {
  if (state === 'playing') { controller.pause(true); telemetry.trackEvent('pause', { runId }); setScreen('paused'); }
  else if (state === 'paused') { void audio.unlock(); controller.pause(false); telemetry.trackEvent('resume', { runId }); setScreen('playing'); update(controller.snapshot()); }
}
function recordQuit(): void {
  if ((state !== 'playing' && state !== 'paused') || ended) return; ended = true; const snapshot = controller.snapshot();
  telemetry.trackEvent('quit', { runId, score: snapshot.sorted, time: snapshot.time }); telemetry.trackEvent('run_end', { runId, outcome: 'quit', score: snapshot.sorted, time: snapshot.time }); telemetry.trackEvent('run_duration', { runId, seconds: snapshot.time, reason: 'quit' });
}
function title(): void { if (credits.rewardPending || (state === 'result' && performance.now() < resultAvailableAt)) return; recordQuit(); controller.title(); lastResult = null; newBest = false; setScreen('title'); }
async function reward(): Promise<void> {
  if (disposed || credits.rewardPending || credits.canPlay || (state === 'result' && performance.now() < resultAvailableAt)) return;
  controller.title(); if (state !== 'reward') setScreen('reward'); const button = $<HTMLButtonElement>('reward-button'); button.disabled = true; button.textContent = t('CREDIT を補充中…', 'Refilling CREDIT…'); sync(); $<HTMLButtonElement>('language-ja-button').disabled = true; $<HTMLButtonElement>('language-en-button').disabled = true; $<HTMLButtonElement>('title-button').disabled = true; $<HTMLButtonElement>('brand-button').disabled = true;
  const success = await credits.requestRewardedCredit(requestRewardedCredit); if (disposed) return; $<HTMLButtonElement>('brand-button').disabled = false;
  if (success) { controller.title(); setScreen('title'); $('play-button')?.focus({ preventScroll: true }); }
  else { setScreen('reward'); $('reward-status').textContent = t('補充できませんでした。もう一度お試しください。', 'Refill failed. Please try again.'); }
}
app.addEventListener('click', event => {
  if (state === 'result' && performance.now() < resultAvailableAt) return; if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button'); if (!button || button.disabled) return;
  switch (button.id) {
    case 'language-ja-button': changeLanguage('ja'); break; case 'language-en-button': changeLanguage('en'); break;
    case 'play-button': start(); break;
    case 'retry-button': start(true); break; case 'title-button': case 'brand-button': title(); break; case 'reward-button': void reward(); break;
    case 'mute-button': audio.toggle(); sync(); break; case 'pause-button': case 'resume-button': pause(); break;
  }
}, { signal: listeners.signal });
document.addEventListener('keydown', event => {
  const key = event.key.toLowerCase(); const action = key === 'enter' || key === ' ';
  if (event.repeat || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) { if (action) event.preventDefault(); return; }
  if (key === 'escape' && (state === 'playing' || state === 'paused')) { event.preventDefault(); pause(); }
  if (action && !(event.target as HTMLElement).closest('button,a')) event.preventDefault();
}, { signal: listeners.signal });
document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'playing') pause(); }, { signal: listeners.signal });
window.addEventListener('blur', () => { if (state === 'playing') pause(); }, { signal: listeners.signal });
window.addEventListener('pagehide', event => { if (!event.persisted) recordQuit(); if (state === 'playing') pause(); }, { signal: listeners.signal });
telemetry.trackEvent('game_open'); setScreen('title');
if (import.meta.env.DEV) (window as unknown as { __arcadeDebug: unknown }).__arcadeDebug = Object.freeze({ gameId: 'game005', snapshot: () => controller.snapshot(), inspection: () => controller.inspection(), state: () => state, language: () => language, telemetry: () => telemetry.getEvents() });
if (import.meta.hot) import.meta.hot.dispose(() => { onboarding.destroy(); disposed = true; if (resultTimer !== undefined) window.clearTimeout(resultTimer); listeners.abort(); controller.destroy(); audio.destroy(); delete (window as unknown as { __arcadeDebug?: unknown }).__arcadeDebug; });
