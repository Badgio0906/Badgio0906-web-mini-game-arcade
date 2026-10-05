import './style.css';
import { StorageService } from '../../core/StorageService';
import { TelemetryService } from '../../core/TelemetryService';
import { AudioService } from '../../core/AudioService';
import { CreditService } from '../../core/CreditService';
import { requestRewardedCredit } from '../../core/RewardService';
import { LoseRun } from './LoseRun';
import { createRunWallet } from './runWallet';
import { loseTitle, loseComment } from './resultFlavor';
import { createLoseOnboarding } from './onboarding';
import { handLabel, handHiragana, handMarkup, hydrateHands, showHand, preloadHands } from './handVisual';
import { HANDS, type Hand, type LoseEvent, type LoseResult, type LoseStage } from './types';

type Screen = 'title' | 'explanation' | 'practice' | 'practice-complete' | 'playing' | 'paused' | 'result' | 'reward';
const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;
const app = $('app'), tv = $('tv-content'), abort = new AbortController();
const storage = new StorageService(undefined, 'web-mini-arcade:v1:game016:');
const telemetry = new TelemetryService(storage, 'game016'), audio = new AudioService(storage), credits = new CreditService(storage, telemetry), wallet = createRunWallet(credits);
const practice = createLoseOnboarding(storage, telemetry);
const stageLabel: Record<LoseStage, string> = { illustration: 'PHASE 1 · イラスト', hiragana: 'PHASE 2 · ひらがな', text: 'PHASE 3 · 文章', speed: 'REFLEX · 0.8秒' };
let state: Screen = 'title', screenEpoch = 0, best = storage.readNumber('best', 0), runId = '', ended = true, disposed = false, newBest = false;
let result: LoseResult | null = null, contentSignature = '', assetReady = false, loading = true, frame = 0, lastQuestion = '', rewardExposure = false;
const reachedStages = new Set<LoseStage>();
const text = (id: string, value: string): void => { const e = $(id); if (e && e.textContent !== value) e.textContent = value; };
const button = (id: string, label: string, primary = false): string => `<button id="${id}" type="button" class="${primary ? 'primary' : ''}">${label}</button>`;
const titleButton = (): string => button('title-button', 'タイトル');
const portalButton = (): string => `<a class="result-portal" href="${import.meta.env.BASE_URL}index.html">ゲームセンター</a>`;
const run = new LoseRun(onEvent);
const token = (): string => `${screenEpoch}/${state === 'playing' || state === 'paused' ? run.snapshot().epoch : state === 'practice' ? practice.snapshot().step : state}`;
function setContent(signature: string, markup: string): void { if (contentSignature === signature) return; contentSignature = signature; tv.innerHTML = markup; hydrateHands(tv); }
function sync(): void {
  app.dataset.state = state; text('best-value', String(best)); text('mute-button', audio.muted ? '音 OFF' : '音 ON'); $('mute-button').setAttribute('aria-pressed', String(audio.muted));
  $('mute-button').setAttribute('aria-label', audio.muted ? '音声をオンにする' : '音声をミュート');
  const pause = $<HTMLButtonElement>('pause-button'); pause.disabled = state !== 'playing' && state !== 'paused'; pause.textContent = state === 'paused' ? '▶' : 'Ⅱ'; pause.setAttribute('aria-label', state === 'paused' ? '再開' : '一時停止');
  $('credit-label').hidden = !wallet.creditsEnabled; text('credit-count', String(credits.credits));
}
function screen(next: Screen): void { screenEpoch++; state = next; contentSignature = ''; sync(); draw(); }
function draw(): void {
  const s = run.snapshot(), p = practice.snapshot(), real = state === 'playing';
  app.dataset.phase = real ? s.phase : state; app.dataset.stage = real ? s.stage : 'illustration';
  text('score-value', state === 'practice' || state === 'explanation' || state === 'practice-complete' || state === 'title' ? '0' : String(s.score));
  text('streak-value', state === 'practice' || state === 'explanation' || state === 'practice-complete' || state === 'title' ? '0' : String(s.correct));
  text('phase-value', real ? stageLabel[s.stage] : state === 'practice' ? `練習 ${p.step + 1} / 3` : state === 'result' && result ? stageLabel[result.stage] : 'ON AIR');
  const textPads = real && (s.stage === 'hiragana' || s.stage === 'text');
  for (const hand of HANDS) {
    const pad = $<HTMLButtonElement>(`${hand}-button`); pad.disabled = !(state === 'practice' || real && s.phase === 'answer');
    showHand(pad.querySelector<HTMLElement>('.pad-art')!, hand, textPads); pad.querySelector('strong')!.textContent = textPads ? handHiragana(hand) : handLabel(hand);
    pad.classList.toggle('selected', real && s.phase === 'feedback' && s.feedback?.playerHand === hand);
  }
  const remaining = real ? s.remainingMs : null, maximum = s.stage === 'speed' ? 800 : 2000;
  $('timer-fill').style.width = `${remaining === null ? 100 : Math.max(0, Math.min(100, remaining / maximum * 100))}%`;
  $('timer-track').setAttribute('aria-valuenow', String(remaining === null ? 100 : Math.round(remaining / maximum * 100)));
  text('timer-value', remaining === null ? '時間制限なし' : `${(remaining / 1000).toFixed(1)} 秒`); $('timer-value').classList.toggle('untimed', remaining === null);
  if (state === 'title') setContent(`title/${loading}/${assetReady}/${credits.canPlay}`, `<article class="show-card"><span class="eyebrow">THE LOSING GAME SHOW</span><h1>負けじゃんけん<small>～LOSE TO WIN～</small></h1><p class="tagline">勝ったら負け。負ければ勝ち。</p><p>相手に負ける手を、左・中央・右から。<br/>勝つ・あいこ・時間切れで終了です。</p><div class="menu-actions">${button(credits.canPlay ? 'play-button' : 'reward-button', loading ? 'イラスト準備中…' : credits.canPlay ? 'すぐ遊ぶ' : '+3 CREDIT / Stub', true)}${button('tutorial-explain-button', '説明を見る')}${button('tutorial-again-button', '練習する')}</div><small>${loading ? '3つの手がそろったら開始できます。' : !assetReady ? '手の画像を読み込めませんでした。再読み込みしてください。' : '← グー · ↓ チョキ · → パー / A S D / Space'}${!credits.canPlay ? '<br/>補充は開発用Stubです。実際の広告は表示しません。' : ''}</small></article>`);
  else if (state === 'explanation') setContent('explanation', `<article class="show-card"><span class="eyebrow">まずは操作練習</span><h2>相手に勝ってはいけません。</h2><p>相手が出す手に、<strong>負ける手</strong>を選んでください。</p><p>左はグー、中央はチョキ、右はパー。<br/>時間制限なしの3問で試してみよう。</p><div class="menu-actions">${button('tutorial-practice-button', '操作を練習する', true)}${titleButton()}</div></article>`);
  else if (state === 'practice') setContent(`practice/${p.step}/${p.feedback}`, `<article class="show-card"><span class="opponent-label">相手 · 練習 ${p.step + 1} / 3</span><div class="practice-opponent">${handMarkup(p.opponentHand)}</div><p class="practice-copy">時間制限なし。</p><p class="practice-feedback" role="status">${p.feedback}</p></article>`);
  else if (state === 'practice-complete') setContent('practice-complete', `<article class="show-card"><span class="eyebrow">PRACTICE COMPLETE</span><h2>OK！ 勝ったら負けです。<br/>負ければ正解です。</h2><p>練習の得点は記録されません。<br/>本番へ進むまでRUNは始まりません。</p><div class="menu-actions">${button('tutorial-start-button', '本番へ', true)}${titleButton()}</div></article>`);
  else if (state === 'paused') setContent('paused', `<article class="show-card"><span class="eyebrow">PAUSE</span><h2>番組を一時停止。</h2><p>問題と残り時間を止めています。<br/>再開後は、もう一度押してください。</p><div class="menu-actions">${button('resume-button', '続きから', true)}${titleButton()}</div></article>`);
  else if (state === 'reward') setContent(`reward/${credits.rewardPending}`, `<article class="show-card"><span class="eyebrow">DEVELOPMENT STUB</span><h2>${credits.rewardPending ? '補充しています…' : 'CREDITを補充'}</h2><p class="stub-note">開発用Stubです。実際の広告は表示しません。<br/>約0.9秒後に3 CREDITを補充します。</p><div class="menu-actions">${button('reward-confirm-button', credits.rewardPending ? '処理中…' : '+3 CREDIT', true)}${titleButton()}</div></article>`);
  else if (state === 'result' && result) setContent('result', `<article class="show-card result-card"><div class="result-intro"><span class="eyebrow">${result.outcome === 'win' ? 'YOU WON… OOPS!' : result.outcome === 'draw' ? 'DRAW… OOPS!' : 'TIME UP!'}</span><h2>${result.reason}</h2></div><div class="result-score"><span>SCORE</span><strong id="result-score">${result.score}</strong>${newBest ? '<mark>NEW BEST</mark>' : ''}</div><dl><div><dt>連敗</dt><dd id="result-streak">${result.correct}</dd></div><div><dt>BEST</dt><dd>${best}</dd></div><div><dt>到達Phase</dt><dd id="result-phase">${result.stage === 'speed' ? 'REFLEX' : result.stage === 'text' ? '3' : result.stage === 'hiragana' ? '2' : '1'}</dd></div><div><dt>REFLEX STREAK</dt><dd id="result-reflex">${result.speedCorrect}</dd></div></dl><div class="result-flavor"><strong id="result-title">${loseTitle(result.correct)}</strong><p>${loseComment(result.correct, result.speedCorrect)}</p></div><p class="result-answers">相手 ${handLabel(result.opponentHand)} ／ あなた ${result.playerHand ? handLabel(result.playerHand) : '時間切れ'}<br/>負ける正解：${handLabel(result.expectedHand)}</p><div class="menu-actions">${button(credits.canPlay ? 'retry-button' : 'reward-button', credits.canPlay ? 'もう一回' : '+3 / Stub', true)}${titleButton()}${portalButton()}</div>${!credits.canPlay ? '<small class="stub-note">補充は開発用Stub。実際の広告はありません。</small>' : ''}</article>`);
  else if (real && s.phase === 'transition') {
    const copy = s.stage === 'hiragana' ? 'イラストなら余裕ですね。次は文字で負けてください。' : s.stage === 'text' ? '文字も大丈夫そうですね。では少し遠回しに言います。' : '30連敗。もう考える必要はありません。ここからは反射神経です。';
    setContent(`transition/${s.epoch}`, `<article class="show-card read-card"><span class="eyebrow">${stageLabel[s.stage]}</span><h2>${copy}</h2><p>時間制限なし。準備ができたら続けよう。</p><div class="menu-actions">${button('continue-button', s.stage === 'speed' ? 'REFLEXへ' : '次へ', true)}</div></article>`);
    $<HTMLButtonElement>('continue-button').disabled = (s.transitionRemainingMs ?? 0) > 0;
  } else if (real && (s.phase === 'read' || s.stage === 'text' && s.phase === 'answer') && s.question) setContent(`${s.phase}/${s.epoch}`, `<article class="show-card read-card"><span class="opponent-label">相手の言葉 · 問題 ${s.questionNumber}</span><p class="question-copy">${s.question.text}</p><p class="tv-caption">${s.phase === 'read' ? '読む時間は無制限。分かったら進もう。' : 'あなたの番：相手に負ける手を。'}</p>${s.phase === 'read' ? `<div class="menu-actions">${button('continue-button', '読めたら進む', true)}</div>` : ''}</article>`);
  else if (real && s.phase === 'feedback' && s.feedback) setContent(`feedback/${s.epoch}`, `<div class="correct-feedback"><strong>負け！</strong><p>LOSE! +${s.feedback.points}</p></div>`);
  else if (real && s.question) setContent(`answer/${s.epoch}`, `<div class="opponent"><span class="opponent-label">相手 · 問題 ${s.questionNumber}</span><div class="opponent-art" id="opponent-hand">${handMarkup(s.question.opponentHand, s.stage === 'hiragana')}</div></div>`);
  if (state === 'title') { const play = $<HTMLButtonElement>('play-button'); if (play) play.disabled = loading || !assetReady; }
  if (state === 'reward') tv.querySelectorAll<HTMLButtonElement>('button').forEach(b => { b.disabled = credits.rewardPending; });
  const visibleReward = !credits.canPlay && (state === 'title' || state === 'result' || state === 'reward');
  if (visibleReward && !rewardExposure) telemetry.trackEvent('reward_offer_shown'); rewardExposure = visibleReward;
}
function onEvent(e: LoseEvent): void {
  if (e.type === 'phase' && !reachedStages.has(e.stage)) { reachedStages.add(e.stage); telemetry.trackEvent('phase_reached', { runId, phase: e.stage }); }
  if (e.type === 'question') { const id = `${e.question.number}/${e.question.id}`; if (id !== lastQuestion) { lastQuestion = id; telemetry.trackEvent('round_reached', { runId, round: e.question.number, phase: e.question.stage }); telemetry.trackEvent('opponent_hand', { runId, round: e.question.number, hand: e.question.opponentHand }); } }
  if (e.type === 'correct') { telemetry.trackEvent('player_hand', { runId, hand: e.feedback.playerHand }); telemetry.trackEvent('lose_success', { runId, streak: e.correct, score: e.score, points: e.feedback.points }); telemetry.trackEvent('response_latency_ms', { runId, ms: e.feedback.reactionMs }); if (e.correct > 30) telemetry.trackEvent('reflex_streak', { runId, streak: e.correct - 30 }); audio.tone(660, 990, .075, 'triangle', 0, .035); }
  if (e.type === 'end' && !ended) {
    ended = true; result = e.result; newBest = result.score > best; best = Math.max(best, result.score); storage.writeNumber('best', best);
    telemetry.trackEvent(result.outcome === 'win' ? 'accidental_win' : result.outcome === 'draw' ? 'draw' : 'timeout', { runId, phase: result.stage, round: result.question.number });
    if (result.playerHand) telemetry.trackEvent('player_hand', { runId, hand: result.playerHand }); if (result.reactionMs !== null) telemetry.trackEvent('response_latency_ms', { runId, ms: result.reactionMs });
    telemetry.trackEvent('run_end', { runId, outcome: 'over', score: result.score, time: result.time, failure_reason: result.outcome, phase: result.stage, streak: result.correct, reflex_streak: result.speedCorrect, highest_reflex_streak: result.highestReflexStreak, response_latency_total_ms: result.responseLatencyTotalMs, response_count: result.responseCount });
    telemetry.trackEvent('score', { runId, score: result.score, best, newBest }); telemetry.trackEvent('run_duration', { runId, seconds: result.time, reason: 'over', failure_reason: result.outcome });
    audio.tone(result.outcome === 'win' ? 540 : result.outcome === 'draw' ? 300 : 180, result.outcome === 'draw' ? 300 : 70, result.outcome === 'timeout' ? .2 : .14, result.outcome === 'win' ? 'square' : 'sine', 0, .035);
    screen('result');
  }
}
function start(retry = false): void {
  if (disposed || loading || !assetReady || credits.rewardPending || state === 'playing' || state === 'paused') return;
  if (state === 'title') telemetry.trackEvent('tutorial_skip', { startMethod: 'immediate', completedBefore: !practice.needed() });
  const id = `game016-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; if (!wallet.start(id)) { screen('reward'); return; }
  runId = id; ended = false; result = null; newBest = false; lastQuestion = ''; reachedStages.clear(); void audio.unlock();
  if (retry) telemetry.trackEvent('retry', { runId }); telemetry.trackEvent('run_start', { runId }); screenEpoch++; state = 'playing'; contentSignature = ''; run.start(performance.now()); sync(); draw();
}
function pause(): void {
  if (state === 'playing') { if (run.pause(true, performance.now()) && !ended) { telemetry.trackEvent('pause', { runId }); screen('paused'); } }
  else if (state === 'paused') { void audio.unlock(); if (run.pause(false, performance.now())) { telemetry.trackEvent('resume', { runId }); screen('playing'); } }
}
function quit(): void {
  if (ended || state !== 'playing' && state !== 'paused') return;
  run.pause(true, performance.now()); if (ended) return; ended = true; const s = run.snapshot();
  telemetry.trackEvent('quit', { runId, score: s.score, time: s.time }); telemetry.trackEvent('run_end', { runId, outcome: 'quit', score: s.score, time: s.time, phase: s.stage, streak: s.correct, reflex_streak: s.speedCorrect }); telemetry.trackEvent('run_duration', { runId, seconds: s.time, reason: 'quit' });
}
function title(): void { if (credits.rewardPending) return; quit(); practice.close(); run.reset(); result = null; screen('title'); }
function answer(hand: Hand): void { void audio.unlock(); if (state === 'practice') { practice.answer(hand); if (practice.snapshot().complete) screen('practice-complete'); else draw(); } else if (state === 'playing') { const epoch = run.snapshot().epoch; run.answer(hand, performance.now(), epoch); draw(); } }
function advance(): void { if (state !== 'playing') return; const s = run.snapshot(); if (s.phase === 'read') run.ready(performance.now(), s.epoch); else if (s.phase === 'transition') run.advance(performance.now(), s.epoch); draw(); }
async function reward(): Promise<void> { if (credits.rewardPending || !wallet.creditsEnabled) return; screen('reward'); const task = credits.requestRewardedCredit(requestRewardedCredit); draw(); const granted = await task; if (disposed) return; if (granted) { run.reset(); screen('title'); } else { contentSignature = ''; draw(); } }

// Epochs cover question changes as well as menus. Retain pointer origin through its click.
const gestures = new Map<number, { token: string; approved: boolean; releasedAt: number | null }>(); let lastRelease: number | undefined; let cleanup: ReturnType<typeof window.setTimeout> | undefined;
function prune(): void { const now = performance.now(); for (const [id, g] of gestures) if (g.releasedAt !== null && now - g.releasedAt > 5000) gestures.delete(id); if (lastRelease !== undefined && !gestures.has(lastRelease)) lastRelease = undefined; }
function scheduleCleanup(): void { if (cleanup !== undefined) return; cleanup = window.setTimeout(() => { cleanup = undefined; prune(); if ([...gestures.values()].some(g => g.releasedAt !== null)) scheduleCleanup(); }, 5100); }
document.addEventListener('pointerdown', e => { if (!(e.target instanceof Node) || !app.contains(e.target)) return; prune(); if (gestures.size >= 32 && !gestures.has(e.pointerId)) gestures.delete([...gestures].find(([, g]) => g.releasedAt !== null)?.[0] ?? gestures.keys().next().value!); gestures.set(e.pointerId, { token: token(), approved: e.button === 0 && e.isPrimary && !e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey, releasedAt: null }); }, { capture: true, signal: abort.signal });
const pointerRelease = (e: PointerEvent): void => { const g = gestures.get(e.pointerId); if (g) { g.releasedAt = performance.now(); lastRelease = e.pointerId; scheduleCleanup(); } };
document.addEventListener('pointerup', pointerRelease, { capture: true, signal: abort.signal }); document.addEventListener('pointercancel', pointerRelease, { capture: true, signal: abort.signal });
app.addEventListener('click', e => { prune(); const id = (e as MouseEvent & { pointerId?: number }).pointerId; const originId = id !== undefined && gestures.has(id) ? id : e.detail > 0 ? lastRelease : undefined; const g = originId !== undefined ? gestures.get(originId) : undefined; if (originId !== undefined) gestures.delete(originId); if (originId === lastRelease) lastRelease = undefined; if (g && (!g.approved || g.token !== token())) { e.preventDefault(); e.stopImmediatePropagation(); } }, { capture: true, signal: abort.signal });
app.addEventListener('click', e => {
  if (e.button !== 0 || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || credits.rewardPending) { e.preventDefault(); return; }
  const target = (e.target as Element).closest<HTMLButtonElement | HTMLAnchorElement>('button,a'); if (!target || target instanceof HTMLButtonElement && target.disabled) return;
  if (target instanceof HTMLAnchorElement) { quit(); telemetry.trackEvent('return_to_portal', { runId }); return; }
  if (target.dataset.hand) { answer(target.dataset.hand as Hand); return; }
  switch (target.id) { case 'play-button': start(); break; case 'retry-button': start(true); break; case 'title-button': title(); break; case 'tutorial-explain-button': practice.explain(); screen('explanation'); break; case 'tutorial-again-button': practice.practice(); screen('practice'); break; case 'tutorial-practice-button': practice.practice(); screen('practice'); break; case 'tutorial-start-button': if (practice.finish()) start(); break; case 'pause-button': case 'resume-button': pause(); break; case 'mute-button': audio.toggle(); sync(); break; case 'continue-button': advance(); break; case 'reward-button': screen('reward'); break; case 'reward-confirm-button': void reward(); break; }
}, { signal: abort.signal });
const held = new Map<string, { token: string; consumed: boolean }>(); let pendingAdvance: { key: string; token: string } | undefined;
const keyHand = (key: string): Hand | null => key === 'arrowleft' || key === 'a' ? 'rock' : key === 'arrowdown' || key === 's' || key === ' ' ? 'scissors' : key === 'arrowright' || key === 'd' ? 'paper' : null;
document.addEventListener('keydown', e => {
  const key = e.key.toLowerCase(), hand = keyHand(key);
  if (e.repeat || held.has(key)) { if (hand || key === 'enter') e.preventDefault(); return; }
  const origin = { token: token(), consumed: false }; held.set(key, origin);
  const consume = (): void => { origin.consumed = true; e.preventDefault(); };
  if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || credits.rewardPending) return;
  if (key === 'escape' && (state === 'playing' || state === 'paused')) { consume(); pause(); return; }
  // Direction keys remain gameplay controls after header focus. Space/Enter keep native navigation.
  if (hand && key !== ' ' && (state === 'playing' || state === 'practice')) { consume(); answer(hand); return; }
  const native = (e.target as Element).closest('button,a');
  if (native && !native.hasAttribute('data-hand') && native.id !== 'continue-button') return;
  if (state === 'playing' && (run.snapshot().phase === 'read' || run.snapshot().phase === 'transition') && (key === 'enter' || key === ' ')) { consume(); pendingAdvance = { key, token: token() }; return; }
  if (hand && (state === 'playing' || state === 'practice')) { consume(); answer(hand); }
}, { signal: abort.signal });
document.addEventListener('keyup', e => {
  const key = e.key.toLowerCase(), origin = held.get(key); held.delete(key);
  if (pendingAdvance?.key === key) { e.preventDefault(); const pending = pendingAdvance; pendingAdvance = undefined; if (pending.token === token()) advance(); }
  else if (origin && (origin.consumed || origin.token !== token()) && (key === ' ' || key === 'enter')) e.preventDefault();
}, { signal: abort.signal });
const blur = (): void => { held.clear(); pendingAdvance = undefined; if (state === 'playing') pause(); };
window.addEventListener('blur', blur, { signal: abort.signal }); document.addEventListener('visibilitychange', () => { if (document.hidden) blur(); }, { signal: abort.signal });
window.addEventListener('pagehide', e => { if (e.persisted) blur(); else quit(); }, { signal: abort.signal });
function tick(now: number): void { if (state === 'playing') run.settle(now); draw(); frame = requestAnimationFrame(tick); }
telemetry.trackEvent('game_open'); screen('title'); frame = requestAnimationFrame(tick);
void preloadHands().then(ok => { if (disposed) return; loading = false; assetReady = ok; contentSignature = ''; draw(); });
if (import.meta.env.DEV) (window as unknown as { __arcadeDebug: unknown }).__arcadeDebug = Object.freeze({ gameId: 'game016', snapshot: () => run.snapshot(), inspection: () => run.inspection(), practice: () => practice.snapshot(), state: () => state, telemetry: () => telemetry.getEvents() });
if (import.meta.hot) import.meta.hot.dispose(() => { disposed = true; cancelAnimationFrame(frame); if (cleanup !== undefined) clearTimeout(cleanup); gestures.clear(); abort.abort(); audio.destroy(); delete (window as unknown as { __arcadeDebug?: unknown }).__arcadeDebug; });
