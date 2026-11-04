import './style.css';
import { attackDuration, freshChallenge, rewardPair } from './challenge';
import { StorageService } from '../../core/StorageService';
import { AudioService } from '../../core/AudioService';
import { TelemetryService, type EventName } from '../../core/TelemetryService';
import { analyticsConfig } from '../../analytics/config';
import { PairBoard, isFree, type Difficulty, type Pair } from './PairBoard';
import { faceNames, faceSvg } from './icons';

type State = 'title' | 'explanation' | 'playing' | 'practice' | 'paused' | 'result' | 'confirm';
const el = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;
const app = el('app'), tray = el('tile-board'), menu = el<HTMLDialogElement>('menu');
const storage = new StorageService(undefined, 'web-mini-arcade:v1:game020:');
const audio = new AudioService(storage), telemetry = new TelemetryService(storage, 'game020');
let difficulty: Difficulty = storage.readBoolean('regular', false) ? 'regular' : 'mini';
difficulty = (['mini', 'small', 'regular'] as Difficulty[])[storage.readNumber('mobileBoardSize', difficulty === 'regular' ? 2 : 0, 0, 2)];
let timeAttack = storage.readBoolean('mobileTimeAttack', false), challenge = freshChallenge();
const elapsed = () => activeMs + (runStarted ? performance.now() - runStarted : 0);
const scoreKey = () => `comboV1Best:${difficulty}:${timeAttack ? 'attack' : 'relaxed'}`;
const scoreBest = () => storage.readNumber(scoreKey(), 0, 0, 100000);
const legacyClears = () => difficulty !== 'mini' && !timeAttack;
const modeClearKey = () => `mobileV1Clears:${difficulty}:${timeAttack ? 'attack' : 'relaxed'}`;
const displayedClears = () => legacyClears() ? clears : storage.readNumber(modeClearKey(), 0, 0, 1000000);
let board = new PairBoard(difficulty), state: State = 'title', returnState: 'playing' | 'practice' = 'playing';
let best = storage.readNumber('bestPairs', 0, 0, 24), clears = storage.readNumber('clearedBoards', 0, 0, 1000000);
let hinted: Pair | null = null, runActive = false, runId = 0, runStarted = 0, activeMs = 0, lastRemoved = -Infinity;
let helpCount = 0, undoCount = 0, shuffleCount = 0;
const playing = () => state === 'playing' || state === 'practice';
const practice = () => state === 'practice' || returnState === 'practice' && ['paused','explanation','confirm'].includes(state);
const pairs = () => (board.tiles.length - board.remaining) / 2;
function trainingEvent(name: EventName, data: Record<string, string | number | boolean> = {}): void {
  // Practice is excluded from production event collection, as well as BEST and run statistics.
  if (analyticsConfig.environment !== 'production') telemetry.trackEvent(name, { ...data, mode: 'practice' });
}
function actionEvent(event: string, data: Record<string, string | number | boolean> = {}): void {
  if (state !== 'playing' || !runActive) return;
  telemetry.trackEvent('specific_game_events', { event, remaining: board.remaining, count: pairs(), level: difficulty === 'small' ? 1 : 2, run_id: runId, ...data });
}
function accumulate(): void { if (runStarted) { activeMs += performance.now() - runStarted; runStarted = 0; } }
function finish(outcome: 'clear' | 'timeout' | 'quit' | 'restart'): void {
  if (!runActive) return; accumulate(); runActive = false;
  storage.writeNumber(scoreKey(), Math.max(scoreBest(), challenge.score));
  telemetry.trackEvent('run_end', { outcome, score: pairs(), unit: 'pairs', remaining: board.remaining, seconds: Number((activeMs / 1000).toFixed(2)), completed: outcome === 'clear', run_id: runId });
}
function mode(next: State): void {
  if (state === 'playing' && next !== 'playing') accumulate();
  state = next; app.dataset.state = state; tray.inert = !playing();
  if (state === 'playing' && runActive && !runStarted) runStarted = performance.now();
  if (menu.open && playing()) menu.close();
  sync();
}
function show(html: string, next: State): void {
  // State/inert guards isolate the board. A nonmodal dialog leaves the shared
  // consent panel and settings reachable without changing analytics UI or logic.
  mode(next); menu.innerHTML = html + '<p class="menu-return"><a id="menu-portal-link" href="./index.html" class="arcade-portal-return">← ゲーム一覧へ</a></p>'; if (!menu.open) menu.show();
  el('menu-portal-link').onclick = returnToPortal;
}
function sync(): void {
  const focused = document.activeElement instanceof HTMLElement ? document.activeElement.dataset.tileId : undefined;
  const activeTiles = board.tiles.filter(tile => !tile.removed);
  const css = getComputedStyle(document.documentElement), stepX = parseFloat(css.getPropertyValue('--tile-w')) || Math.min(68, (innerWidth - 62) / 4);
  const tileW = innerWidth <= 600 ? Math.min(68, Math.max(52, (innerWidth - 62) / 4)) : stepX;
  const xStep = tileW + 2, yStep = tileW + 4;
  const width = Math.max(4, ...activeTiles.map(t => t.x + 1)) * xStep + 12;
  const height = Math.max(2, ...activeTiles.map(t => t.y + 1)) * yStep + 12;
  tray.style.width = width + 'px'; tray.style.height = height + 'px';
  tray.innerHTML = activeTiles.map(tile => {
    const free = isFree(board.tiles, tile.id), selected = board.selected === tile.id;
    return `<button class="tile" type="button" data-game-interaction data-tile-id="${tile.id}" data-face="${tile.face}" data-free="${free}" data-hint="${hinted?.includes(tile.id) ?? false}" aria-pressed="${selected}" aria-disabled="${!free}" aria-label="${faceNames[tile.face]}, ${free ? '選べる牌' : '今は選べない牌'}${selected ? ', 選択中' : ''}" style="left:${tile.x * xStep + tile.z * 3}px;top:${tile.y * yStep - tile.z * 5 + 10}px;z-index:${tile.z + 1}">${faceSvg(tile.face)}</button>`;
  }).join('');
  if (focused !== undefined && playing()) tray.querySelector<HTMLElement>(`[data-tile-id="${focused}"]`)?.focus({ preventScroll: true });
  el('remaining-value').textContent = String(board.remaining);
  el('pairs-value').textContent = String(pairs()); el('clear-value').textContent = String(displayedClears());
  el('board-caption').textContent = practice() ? '練習の盤面 · 記録には入りません' : `${difficulty === 'mini' ? 'ミニ・12枚' : difficulty === 'small' ? '小さめ・24枚' : 'じっくり・48枚'} · ${timeAttack ? 'タイムアタック' : '時間制限なし'}`;
  syncChallenge();
  el('live-status').textContent = board.feedback;
  for (const id of ['hint-button','shuffle-button']) el<HTMLButtonElement>(id).disabled = !playing() || board.cleared;
  el<HTMLButtonElement>('undo-button').disabled = !playing() || !board.history.length || board.cleared;
  for (const id of ['restart-button','next-button','help-button']) el<HTMLButtonElement>(id).disabled = !playing();
  el<HTMLButtonElement>('pause-button').disabled = !playing(); el('practice-actions').hidden = state !== 'practice';
}
function focusTile(): void { tray.querySelector<HTMLElement>('[data-free="true"]')?.focus({ preventScroll: true }); }
function start(source = 'direct', same = false): void {
  finish('restart'); hinted = null; returnState = 'playing';
  if (same) board.restart(); else board = new PairBoard(difficulty);
  challenge = freshChallenge();
  runId++; runActive = true; activeMs = 0; runStarted = performance.now(); helpCount = undoCount = shuffleCount = 0; lastRemoved = -Infinity;
  telemetry.trackEvent('run_start', { source, run_id: runId, count: board.remaining, level: difficulty === 'small' ? 1 : 2 });
  mode('playing'); focusTile(); void audio.unlock();
}
function title(): void {
  finish('quit'); hinted = null; returnState = 'playing'; board = new PairBoard(difficulty);
  show(`<p class="eyebrow">PAIR TILE</p><h2 id="menu-title">すっきり牌合わせ</h2><p>同じ柄を、ひと組ずつ。<br>ミニなら12枚。連続で消して得点アップ。</p><label>盤面<select id="size-choice"><option value="mini" ${difficulty === 'mini' ? 'selected' : ''}>ミニ · 12枚（約1分）</option><option value="small" ${difficulty === 'small' ? 'selected' : ''}>小さめ · 24枚</option><option value="regular" ${difficulty === 'regular' ? 'selected' : ''}>じっくり · 48枚</option></select></label><label><input id="attack-choice" type="checkbox" ${timeAttack ? 'checked' : ''}> タイムアタック（ミニ60秒 / 他180秒）</label><p>4秒以内の連続消しで最大8倍。ラウンドBEST <span id="mode-best">${scoreBest()}</span>点</p><div class="menu-actions"><button id="play-button" class="primary" type="button">すぐ遊ぶ</button><button id="explain-button" type="button">説明を見る</button><button id="practice-button" type="button">練習する</button></div><p>通常盤面クリア ${clears}盤面 · BEST ${best}ペア<br>途中の位置は保存しません。ヒントや戻すでコンボが切れます。</p>`, 'title');
  el<HTMLSelectElement>('size-choice').onchange = event => { difficulty = (event.target as HTMLSelectElement).value as Difficulty; storage.writeBoolean('regular', difficulty === 'regular'); storage.writeNumber('mobileBoardSize', ['mini', 'small', 'regular'].indexOf(difficulty)); el('mode-best').textContent = String(scoreBest()); board = new PairBoard(difficulty); sync(); };
  el<HTMLInputElement>('attack-choice').onchange = event => { timeAttack = (event.target as HTMLInputElement).checked; storage.writeBoolean('mobileTimeAttack', timeAttack); el('mode-best').textContent = String(scoreBest()); syncChallenge(); };
  el('play-button').onclick = () => { telemetry.trackEvent('tutorial_skip', { source: 'title' }); start(); };
  el('explain-button').onclick = () => explain(false); el('practice-button').onclick = startPractice;
}
function explain(inRun: boolean): void {
  if (inRun) returnState = state === 'practice' ? 'practice' : 'playing';
  if (!practice()) telemetry.trackEvent('tutorial_view', { source: inRun ? 'playing' : 'title' });
  show(`<p class="eyebrow">HOW TO PLAY</p><h2 id="menu-title">同じ柄の自由な牌を2枚。</h2><ol><li><b>上が空いていること。</b>上に重なった牌があると選べません。</li><li><b>左右どちらかが空いていること。</b>両側が塞がれている牌は、先に周囲を片付けます。</li><li><b>形と中の模様を合わせる。</b>輪、三角、星など。同じ形でも中の模様が違えば別の牌です。</li><li>明るい牌と下の小さな点が選べる目印。金色の枠は選択中。間違えても罰はありません。</li><li>ヒントは点線の枠で2枚を示します。1手戻すで取り直し。並べ替えは残りの牌を解ける並びにし、戻す履歴をリセットします。必要な場合は残牌を平らに並べ直します。</li></ol><p>通常は時間制限なし。任意のタイムアタックはミニ60秒、他180秒です。4秒以内の連続消しで最大8倍。ヒント・戻す・並べ替えでコンボが切れます。同じ牌での再加点はありません。休憩中は時計が止まります。PCはTab／矢印、Enter／Space。スマホはタップ。</p><div class="menu-actions"><button id="continue-button" class="primary" type="button">${inRun ? '盤面へ戻る' : 'すぐ遊ぶ'}</button><button id="practice-button" type="button">練習する</button>${inRun ? '' : '<button id="title-button" type="button">タイトルへ</button>'}</div>`, 'explanation');
  el('continue-button').onclick = () => { if (inRun) { mode(returnState); focusTile(); } else start('explanation'); };
  el('practice-button').onclick = startPractice; if (!inRun) el('title-button').onclick = title;
}
function startPractice(): void {
  finish('quit'); returnState = 'practice'; board = new PairBoard('small', 20);
  board.tiles = Array.from({ length: 8 }, (_, id) => ({ id, x: id % 4, y: Math.floor(id / 4), z: 0, face: [0,1,1,0,2,3,3,2][id], removed: false }));
  board.solution = [[0,3],[1,2],[4,7],[5,6]]; hinted = null; lastRemoved = -Infinity;
  board.feedback = '練習：明るい牌を2枚。両側が塞がれた牌は、周りを取ると選べます。';
  trainingEvent('practice_start'); mode('practice'); focusTile(); void audio.unlock();
}
function complete(timedOut = false): void {
  const training = state === 'practice';
  if (training) { trainingEvent('practice_complete', { count: 4 }); storage.writeBoolean('practiceCompleted', true); }
  else {
    if (runActive && !timedOut) {
      if (legacyClears()) { clears++; storage.writeNumber('clearedBoards', clears); }
      else storage.writeNumber(modeClearKey(), displayedClears() + 1);
    }
    finish(timedOut ? 'timeout' : 'clear');
  }
  show(`<p class="eyebrow">${training ? 'PRACTICE COMPLETE' : timedOut ? 'TIME UP' : 'ALL CLEAR'}</p><h2 id="menu-title">${training ? '練習できました。' : timedOut ? 'タイムアップ！' : 'すっきり、片付きました。'}</h2><p>${training ? '両側が塞がれた牌も、周りを取れば自由になります。' : `${challenge.score}点 · BEST ${scoreBest()}点<br>${pairs()}ペア / ${board.tiles.length / 2}ペア · ${(activeMs / 1000).toFixed(1)}秒<br>ヒント ${helpCount}回 · 戻す ${undoCount}回 · 並べ替え ${shuffleCount}回`}</p><div class="menu-actions"><button id="clear-next-button" class="primary" type="button">${training ? '本番を遊ぶ' : '次の盤面'}</button><button id="clear-title-button" type="button">タイトルへ</button></div>`, 'result');
  el('clear-next-button').onclick = () => start(training ? 'practice' : 'next'); el('clear-title-button').onclick = title;
}
function select(id: number): void {
  if (!playing() || performance.now() - lastRemoved < 120) return;
  if (state === 'playing' && timeAttack && elapsed() >= attackDuration(difficulty === 'mini')) { complete(true); return; }
  const result = board.select(id); hinted = null;
  if (result === 'removed') {
    lastRemoved = performance.now(); audio.tone(470, 580, .055, 'sine', 0, .014);
    if (state === 'playing') {
      challenge = rewardPair(challenge, board.lastPair!, elapsed());
      playClearEffect();
      actionEvent('tile_pair', { first_id: board.lastPair![0], second_id: board.lastPair![1] });
      if (difficulty !== 'mini' && pairs() > best) { best = pairs(); storage.writeNumber('bestPairs', best); telemetry.trackEvent('best_update', { score: best, best, unit: 'pairs', run_id: runId }); }
    } else trainingEvent('tutorial_step_complete', { step: pairs() });
  }
  sync(); if (board.cleared) complete();
}
tray.addEventListener('click', event => { const button = (event.target as HTMLElement).closest<HTMLElement>('[data-tile-id]'); if (button) select(Number(button.dataset.tileId)); });
tray.addEventListener('keydown', event => {
  if (!playing()) return;
  if (event.repeat && ['Enter',' '].includes(event.key)) { event.preventDefault(); return; }
  if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) return;
  event.preventDefault(); const buttons = [...tray.querySelectorAll<HTMLButtonElement>('[data-free="true"]')];
  const current = buttons.indexOf(document.activeElement as HTMLButtonElement), delta = ['ArrowLeft','ArrowUp'].includes(event.key) ? -1 : 1;
  buttons[(current + delta + buttons.length) % buttons.length]?.focus();
});
el('hint-button').onclick = () => { if (!playing()) return; breakCombo(); hinted = board.hint(); helpCount++; actionEvent('hint'); sync(); };
el('undo-button').onclick = () => { if (!playing()) return; if (board.undo()) { breakCombo(); undoCount++; actionEvent('undo'); hinted = null; sync(); } };
el('shuffle-button').onclick = () => { if (!playing()) return; if (board.reshuffle()) { breakCombo(); shuffleCount++; actionEvent('reshuffle', { completed: board.reshuffleRecovered }); hinted = null; sync(); } };
function confirm(action: 'restart' | 'next'): void {
  if (!playing()) return; returnState = state === 'practice' ? 'practice' : 'playing';
  show(`<h2 id="menu-title">${action === 'restart' ? 'この盤面をやり直す？' : '次の盤面へ進む？'}</h2><p>いまの途中の盤面は終わります。保存済みの記録は残ります。</p><div class="menu-actions"><button id="confirm-button" type="button">${action === 'restart' ? 'やり直す' : '次へ進む'}</button><button id="cancel-button" class="primary" type="button">盤面へ戻る</button></div>`, 'confirm');
  el('cancel-button').onclick = () => { mode(returnState); focusTile(); };
  el('confirm-button').onclick = () => { if (returnState === 'practice') startPractice(); else { telemetry.trackEvent('retry', { source: action }); start(action, action === 'restart'); } };
}
el('restart-button').onclick = () => confirm('restart'); el('next-button').onclick = () => confirm('next');
el('help-button').onclick = () => explain(true);
function pause(): void {
  if (!playing()) return; returnState = state === 'practice' ? 'practice' : 'playing';
  if (state === 'playing') telemetry.trackEvent('pause');
  show('<h2 id="menu-title">ひと休み。</h2><p>盤面はそのまま。いつでも続けられます。</p><div class="menu-actions"><button id="resume-button" class="primary" type="button">続ける</button><button id="pause-title-button" type="button">タイトルへ</button></div>', 'paused');
  el('resume-button').onclick = () => { if (returnState === 'playing') telemetry.trackEvent('resume'); mode(returnState); focusTile(); };
  el('pause-title-button').onclick = title;
}
el('pause-button').onclick = pause;
menu.addEventListener('cancel', event => { event.preventDefault(); if (['paused','explanation','confirm'].includes(state) && (runActive || returnState === 'practice')) { mode(returnState); focusTile(); } });
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  if (playing()) { event.preventDefault(); pause(); }
  else if (menu.open && ['paused','explanation','confirm'].includes(state) && (runActive || returnState === 'practice')) { event.preventDefault(); mode(returnState); focusTile(); }
});
el('practice-play-button').onclick = () => start('practice_skip'); el('practice-title-button').onclick = title;
el('mute-button').onclick = () => { el('mute-button').textContent = audio.toggle() ? '音 OFF' : '音 ON'; };
el('mute-button').textContent = audio.muted ? '音 OFF' : '音 ON';
function returnToPortal(): void { finish('quit'); telemetry.trackEvent('return_to_portal', { source: state }); }
el('portal-link').addEventListener('click', returnToPortal);
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); }); window.addEventListener('blur', pause);
window.addEventListener('resize', sync);
window.addEventListener('pagehide', () => { finish('quit'); audio.destroy(); }, { once: true });
function breakCombo(): void { challenge = { ...challenge, combo: 0, lastAt: -Infinity }; }
function syncChallenge(): void {
  let hud = document.getElementById('challenge-hud');
  if (!hud) { hud = document.createElement('div'); hud.id = 'challenge-hud'; hud.className = 'challenge-hud'; el('board-caption').after(hud); }
  hud.hidden = practice();
  hud.textContent = `${challenge.score}点 · ${challenge.combo}コンボ ×${Math.max(1, challenge.combo)}${timeAttack ? ` · 残り${Math.max(0, Math.ceil((attackDuration(difficulty === 'mini') - elapsed()) / 1000))}秒` : ''}`;
}
function playClearEffect(): void {
  tray.classList.remove('pair-pop'); void tray.offsetWidth; tray.classList.add('pair-pop');
}
const clock = window.setInterval(() => {
  if (state !== 'playing' || !runActive) return;
  syncChallenge();
  if (timeAttack && elapsed() >= attackDuration(difficulty === 'mini')) complete(true);
}, 100);
window.addEventListener('pagehide', () => clearInterval(clock), { once: true });
telemetry.trackEvent('game_open'); title();
if (import.meta.env.DEV) Object.defineProperty(window, '__game020', { get: () => ({ state, difficulty, timeAttack, challenge: { ...challenge }, elapsed: elapsed(), tiles: board.tiles.map(t => ({ ...t })), selected: board.selected, remaining: board.remaining, stuck: board.stuck, best, clears, telemetry: telemetry.getEvents() }) });
