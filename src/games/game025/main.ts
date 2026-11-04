import './style.css';
import { Mines, candidate, type Difficulty, type Deduction, type Proof } from './Mines';
import fallbacks from './fallbacks.json';
import miniFallbacks from './mini-fallbacks.json';
import { SaveStore, snapshot, reportResult, type Stats } from './Save';
import { StorageService } from '../../core/StorageService';
import { AudioService } from '../../core/AudioService';
import { TelemetryService, type EventName } from '../../core/TelemetryService';
import { uuid } from '../../analytics/runtime';
import { analyticsConfig } from '../../analytics/config';
const el = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const app = el('app'), grid = el('board'), menu = el<HTMLDialogElement>('menu');
const local = new StorageService(undefined, 'web-mini-arcade:v1:game025:');
const audio = new AudioService(local);
let boardMode: 'random' | 'daily' = 'random', dailyId = '';
const today = () => new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const daySeed = (date: string) => [...date].reduce((n,c)=>(Math.imul(n,31)+c.charCodeAt(0))>>>0,0);
const bestKey = () => `best-time-v1-${board.difficulty}-${boardMode}${boardMode==='daily'?`-${dailyId}`:''}`;
let bestTimes: number[] = [];
function readTimes(): number[] { return Array.from({length:10},(_,i)=>local.readNumber(`${bestKey()}-${i}`,0,0,31536000000)).filter(n=>n>0).sort((a,b)=>a-b); }
let holdTimer: ReturnType<typeof setTimeout> | null = null;
function cancelHold(): void { if(holdTimer!==null)clearTimeout(holdTimer);holdTimer=null; }
const telemetry = new TelemetryService(undefined, 'game025', undefined, { remoteCollectionEnabled: false });
const store = new SaveStore(); let available = store.read();
let stats: Stats = available?.saved.stats ?? { won: 0, lost: 0, reported: [] };
let board = new Mines('beginner'), difficulty: Difficulty = available?.board.difficulty ?? 'beginner';
let state = 'title', prior = 'playing', runId: string | null = null, resultId: string | null = null, reported = false, elapsedMs = 0, ticking = 0, hints = 0;
let focus = 0, hinted: Deduction | null = null, feedback = '好きなマスからどうぞ。';
let worker: Worker | null = null, job = 0, deadline: ReturnType<typeof setTimeout> | null = null, pending: number | null = null;
let gesture: { pointer: number; x: number; y: number; cell: number; time: number; epoch: number } | null = null;
let lastPointerType = 'mouse';
let generationPaused = false, deferredFirstOpen: number | null = null;
let menuDown: { epoch: number; target: HTMLElement } | null = null;
let epoch = 0, suppressClickUntil = 0, practiceFlag = false, practiceOpen = false;
const playable = () => ['playing','practice'].includes(state);
const training = () => state === 'practice' || prior === 'practice' && ['paused','help','generating'].includes(state);
const elapsed = () => elapsedMs + (ticking ? performance.now() - ticking : 0);
function stopClock(): void { elapsedMs = elapsed(); ticking = 0; }
function save(): void { if (!training()) store.write({...snapshot(board, elapsed(), hints, runId, reported, stats, resultId, deferredFirstOpen),boardMode,dailyId}); }
function event(name: EventName, data: Record<string, string | number | boolean> = {}): void { if (!training()) telemetry.trackEvent(name, data); else if (analyticsConfig.environment !== 'production') telemetry.trackEvent(name, { ...data, mode: 'practice' }); }
function specific(action: string): void { if (state === 'playing') event('specific_game_events', { event: action, difficulty, guaranteed: !!board.proof, opened: board.openedCount, flags: board.flagCount, flag_operations: board.history.filter(a => a.type === 'flag').length, hints }); }
function cancelJob(): void { job++; worker?.terminate(); worker = null; if (deadline) clearTimeout(deadline); deadline = null; pending = null; generationPaused = false; }
function mode(next: string): void {
  stopClock(); cancelHold(); epoch++; gesture = null; menuDown = null; state = next; app.dataset.state = next;
  grid.inert = !playable(); if (playable() && !training() && board.outcome === 'active' && !document.hidden) ticking = performance.now();
  if (playable() && menu.open) menu.close(); render();
}
function show(html: string, next: string): void {
  mode(next); menu.innerHTML = html + '<p class="menu-return"><a id="menu-portal" href="./index.html" class="arcade-portal-return">← ゲーム一覧へ</a></p>'; if (!menu.open) menu.show();
  el('menu-portal').onclick = () => { cancelJob(); stopClock(); save(); telemetry.trackEvent('return_to_portal', { source: state }); };
  menu.querySelector<HTMLElement>('button')?.focus();
}
function render(): void {
  const restoreFocus = grid.contains(document.activeElement);
  grid.style.setProperty('--cols', String(board.width)); grid.dataset.size = board.difficulty;
  grid.setAttribute('aria-rowcount', String(board.height)); grid.setAttribute('aria-colcount', String(board.width));
  grid.innerHTML = board.opened.map((opened, i) => {
    const mineShown = board.outcome === 'lost' && board.mines[i], value = opened ? board.numbers[i] : null;
    const wrongFlag = board.outcome === 'lost' && board.flags[i] && !board.mines[i];
    const symbol = mineShown ? '✹' : wrongFlag ? '×' : board.flags[i] ? '⚑' : opened && value ? String(value) : '';
    const label = `${Math.floor(i / board.width) + 1}行${i % board.width + 1}列、${mineShown ? '地雷' : wrongFlag ? '誤った旗' : board.flags[i] ? '旗' : opened ? value ? `周りの地雷${value}個` : '空きマス' : '未開封'}`;
    return `<button type="button" role="gridcell" class="cell" data-game-interaction data-cell="${i}" data-open="${opened}" data-flag="${board.flags[i]}" data-value="${value}" data-hint="${hinted?.cell === i}" tabindex="${i === focus ? 0 : -1}" aria-label="${label}" aria-rowindex="${Math.floor(i / board.width) + 1}" aria-colindex="${i % board.width + 1}">${symbol}</button>`;
  }).join('');
  if (restoreFocus && playable()) focusCell();
  el('remaining').textContent = String(board.total - board.flagCount); el('opened').textContent = String(board.openedCount); updateClock();
  el('caption').textContent = training() ? '練習 · 旗と開封 · 記録には入りません' : `${board.difficulty === 'mini' ? 'ミニ · 6 × 6 · 地雷5個' : board.difficulty === 'beginner' ? '初級 · 9 × 9 · 地雷10個' : '中級 · 16 × 16 · 地雷40個'} · ${board.proof ? '推測不要・検証済み' : board.difficulty !== 'intermediate' ? '初手と周囲が安全・推測不要の盤面を用意' : '初手と周囲が安全（推測不要は未保証）'}`;
  el('status').textContent = feedback;
  if(!training()&&boardMode==='daily')el('caption').textContent=`今日の盤面 ${dailyId} · `+el('caption').textContent;
  for (const id of ['hint','chord','pause','retry','help']) el<HTMLButtonElement>(id).disabled = !playable();
  el('practice-note').hidden = !training();

}
function updateClock(): void { const sec = Math.floor(elapsed() / 1000); el('clock').textContent = `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2,'0')}`; }
function focusCell(): void { grid.querySelector<HTMLElement>(`[data-cell="${focus}"]`)?.focus({ preventScroll: true }); }
function abandon(): void {
  cancelJob(); stopClock();
  if (resultId && !reported && board.outcome === 'active') event('run_end', { outcome: 'quit', opened: board.openedCount, seconds: elapsedMs / 1000, completed: false });
  runId = null; resultId = null; deferredFirstOpen = null; reported = false;
}
function start(): void {
  abandon(); prior = 'playing'; board = new Mines(difficulty); elapsedMs = 0; hints = 0; focus = 0; hinted = null; dailyId=boardMode==='daily'?today():'';bestTimes=readTimes();
  telemetry.trackEvent('run_start', { difficulty, guaranteed: difficulty === 'beginner' });
  runId = telemetry.getActiveRunId(); resultId = uuid();
  feedback = 'タップで開く、長押しで旗。初手と周囲は安全です。'; available = null; mode('playing'); save(); focusCell(); void audio.unlock();
  if(boardMode==='daily'){
    const pool=board.difficulty==='mini'?miniFallbacks:fallbacks;
    const data=pool[daySeed(dailyId)%pool.length];
    if(board.initialize(data.mines,data.proof.start,data.proof as Proof))move('open',data.proof.start);
  }
}
function title(initial = false): void {
  if (!initial) { abandon(); prior = 'playing'; board = new Mines(difficulty); elapsedMs = 0; hints = 0; save(); available = null; }
  show(`<p class="eyebrow">MINESWEEPER</p><h2 id="menu-title">こつこつマインスイーパー</h2><p>数字を手がかりに、ひとマスずつ。<br>ミニ盤面でひと息。タイムの自己ベストを更新しよう。</p><label>盤面<select id="difficulty"><option value="mini" ${difficulty === 'mini' ? 'selected' : ''}>ミニ · 6 × 6 / 地雷5 · 推測不要</option><option value="beginner" ${difficulty === 'beginner' ? 'selected' : ''}>初級 · 9 × 9 / 地雷10 · 推測不要</option><option value="intermediate" ${difficulty === 'intermediate' ? 'selected' : ''}>中級 · 16 × 16 / 地雷40 · 初手安全</option></select></label><label>配札<select id="board-mode"><option value="random" ${boardMode==='random'?'selected':''}>毎回新しい盤面</option><option value="daily" ${boardMode==='daily'?'selected':''}>今日の盤面（日本時間）</option></select></label><div class="menu-actions">${available?.saved.resultId && available.board.outcome === 'active' ? '<button id="restore" class="primary">保存した盤面を続ける</button>' : ''}<button id="play" class="primary">すぐ遊ぶ</button><button id="explain">説明を見る</button><button id="practice">練習する</button></div><p>クリア ${stats.won}回 · 終了 ${stats.lost}回<br>途中の盤面は保存します。復元は休憩状態から。</p>`, 'title');
  el<HTMLSelectElement>('difficulty').onchange = e => { difficulty = (e.target as HTMLSelectElement).value as Difficulty; if(boardMode==='daily'&&difficulty==='intermediate'){difficulty='beginner';el<HTMLSelectElement>('difficulty').value=difficulty;} };
  el<HTMLSelectElement>('board-mode').onchange=e=>{boardMode=(e.target as HTMLSelectElement).value as 'random'|'daily';if(boardMode==='daily'&&difficulty==='intermediate'){difficulty='beginner';el<HTMLSelectElement>('difficulty').value=difficulty;}};
  el('play').onclick = start; el('explain').onclick = () => help(false); el('practice').onclick = practice;
  if (available?.saved.resultId && available.board.outcome === 'active') el('restore').onclick = () => {
    const loaded = available!; boardMode=loaded.saved.boardMode??'random';dailyId=loaded.saved.dailyId??''; board = loaded.board;bestTimes=readTimes(); difficulty = board.difficulty; runId = loaded.saved.runId; resultId = loaded.saved.resultId; deferredFirstOpen = loaded.saved.firstOpenPending; reported = loaded.saved.reported; elapsedMs = loaded.saved.elapsedMs; hints = loaded.saved.hints; prior = 'playing';
    if (runId) telemetry.restoreRun(runId); available = null; feedback = '保存した盤面です。続けると時計が進みます。'; pauseMenu();
  };
}
function help(inRun: boolean): void {
  if (inRun) prior = state; event('tutorial_view', { source: inRun ? 'playing' : 'title' });
  show('<h2 id="menu-title">数字は、周り8マスの地雷の数。</h2><ol><li>安全だと思うマスを開こう。0の周りはまとめて開きます。</li><li>地雷かもしれないマスに旗を置こう。旗だけではクリアになりません。</li><li>すべての安全マスを開くとクリア。地雷を開くと終了です。</li><li>開いた数字を選んで「周囲を開く」。周りの旗数と数字が同じなら、旗以外を開きます。旗が間違っていると地雷を開くこともあります。</li><li>ヒントは見えている数字と地雷総数から証明できることだけ。旗は正解と決めつけません。証明できないときは、その旨を伝えます。</li></ol><p>初級は推測不要と検証できた固定盤面。中級は初手安全が基本です。プレイ中に地雷を動かしません。タップで開封、約0.5秒の長押しで旗を置く／外す。ミニと初級は推測不要。今日の盤面は日本時間で共通の開始位置・配置です。タイムはこの端末の上位10回を保存（ヒントなしのクリアのみ）。</p><div class="menu-actions"><button id="continue" class="primary">盤面へ</button><button id="practice">練習する</button></div>', 'help');
  el('continue').onclick = () => { if (inRun) { mode(prior); focusCell(); } else start(); }; el('practice').onclick = practice;
}
function practice(): void {
  abandon(); prior = 'practice'; board = new Mines('beginner'); const data = fallbacks[40]; board.initialize(data.mines, 40, data.proof as Proof); focus = 40;
  elapsedMs = 0; hints = 0; practiceFlag = practiceOpen = false; hinted = null; feedback = '練習：中央のマスに旗を置こう。'; mode('practice'); event('practice_start'); focusCell(); void audio.unlock();
}
function conclude(): void {
  stopClock();
  if (state === 'practice') {
    feedback = board.outcome === 'won' ? '練習の盤面をクリアしました。' : '練習：地雷を開きました。新しい盤面でやり直せます。'; render(); return;
  }
  if (!reported && resultId) {
    stats = reportResult(board, resultId, stats); reported = true;
    if(board.outcome==='won'&&hints===0){bestTimes=[...readTimes(),Math.max(1,Math.round(elapsedMs))].sort((a,b)=>a-b).slice(0,10);bestTimes.forEach((time,i)=>local.writeNumber(`${bestKey()}-${i}`,time));}
    save(); event('run_end', { outcome: board.outcome === 'won' ? 'clear' : 'over', completed: board.outcome === 'won', difficulty, guaranteed: !!board.proof, opened: board.openedCount, flags: board.flagCount, flag_operations: board.history.filter(a => a.type === 'flag').length, hints, seconds: elapsedMs / 1000 });
  }
  feedback = board.outcome === 'won' ? 'すべての安全マスを開けました。' : '地雷のマスでした。盤面はこのまま確認できます。';
  show(`<h2 id="menu-title">${board.outcome === 'won' ? 'こつこつ、クリア。' : 'ここで、ひと区切り。'}</h2><p>${feedback}<br>タイム ${(elapsedMs/1000).toFixed(2)}秒${board.outcome==='won'?hints?'（ヒントあり・タイム順位対象外）':` · この端末 ${bestTimes.indexOf(Math.max(1,Math.round(elapsedMs)))>=0?`${bestTimes.indexOf(Math.max(1,Math.round(elapsedMs)))+1}位`:'10位圏外'}`: ''}<br>${bestTimes.length?`自己ベスト ${(bestTimes[0]/1000).toFixed(2)}秒<br>`:''}開封 ${board.openedCount}マス · ヒント ${hints}回<br>クリア ${stats.won}回</p><div class="menu-actions"><button id="inspect">盤面を確認</button><button id="next" class="primary">新しい盤面</button><button id="result-title">タイトルへ</button></div>`, 'result');
  el('next').onclick = () => { telemetry.trackEvent('retry'); start(); }; el('result-title').onclick = () => title(); el('inspect').onclick = () => { menu.close(); mode('result-view'); };
}
function move(type: 'open' | 'flag' | 'chord', cell: number): void {
  if (!playable() || board.outcome !== 'active') return;
  focus = cell;
  if (type === 'open' && !board.initialized && !board.flags[cell]) { prepare(cell); return; }
  if (!board.act(type, cell)) return;
  hinted = null; feedback = type === 'flag' ? '旗は自分の目印です。安全マスに置いた旗は開封を止めます。' : '数字の周りを見ながら、ひとマスずつ。';
  if (training()) {
    if (type === 'flag' && board.flags[cell]) { practiceFlag = true; feedback = '旗を置けました。同じマスを長押しして旗を外し、タップで開こう。'; }
    if (type === 'open' && practiceFlag && !practiceOpen) { practiceOpen = true; event('practice_complete'); feedback = '旗と開封を練習できました。タイトルから本番を遊べます。'; }
  } else { specific(type === 'flag' ? 'flag' : type === 'chord' ? 'chord' : 'open'); save(); }
  audio.tone(380, 430, .04, 'sine', 0, .009); render(); if (board.outcome !== 'active') conclude();
}
function prepare(startCell: number): void {
  prior = 'playing'; pending = startCell; const id = ++job, seed = Math.floor(Math.random() * 0x7fffffff);
  stopClock(); show('<h2 id="menu-title">盤面を用意しています。</h2><p>初手の周りが安全な配置を作り、初級は数字だけで解けることを確認します。</p><div class="menu-actions"><button id="cancel-generation">タイトルへ</button></div>', 'generating');
  el('cancel-generation').onclick = () => title();
  const apply = (mines: boolean[] | null, proof: Proof | null) => {
    if (id !== job || state !== 'generating' || pending !== startCell) return;
    let initialized = mines && board.initialize(mines, startCell, proof);
    if (!initialized && board.difficulty !== 'intermediate') { const fallback = board.difficulty==='mini'?miniFallbacks[startCell]:fallbacks[startCell]; initialized = board.initialize(fallback.mines, startCell, fallback.proof as Proof); }
    if (!initialized && board.difficulty === 'intermediate') initialized = board.initialize(candidate('intermediate', startCell, seed), startCell);
    const stayPaused = generationPaused || document.hidden;
    cancelJob();
    if (!initialized) { feedback = '盤面を用意できませんでした。新しい盤面を選んでください。'; mode('playing'); return; }
    if (stayPaused) { deferredFirstOpen = startCell; prior = 'playing'; feedback = '盤面を用意しました。休憩中です。続けると初手を開きます。'; pauseMenu(); return; }
    mode('playing'); move('open', startCell); focusCell();
  };
  deadline = setTimeout(() => apply(null, null), 1000);
  try {
    worker = new Worker(new URL('./generator.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent<{ id: number; start: number; mines: boolean[] | null; proof: Proof | null }>) => { if (e.data.id === id && e.data.start === startCell) apply(e.data.mines, e.data.proof); };
    worker.onerror = () => apply(null, null); worker.postMessage({ id, difficulty: board.difficulty, start: startCell, seed });
  } catch { apply(null, null); }
}
function pauseMenu(): void {
  show('<h2 id="menu-title">ひと休み。</h2><p>盤面と時計は止まっています。</p><div class="menu-actions"><button id="resume" class="primary">続ける</button><button id="pause-title">タイトルへ</button></div>', 'paused');
  save(); el('resume').onclick = () => { event('resume'); const first = deferredFirstOpen; deferredFirstOpen = null; mode(prior); if (first !== null && prior === 'playing') move('open', first); focusCell(); }; el('pause-title').onclick = () => title();
}
function pause(): void { if (state === 'generating') { generationPaused = true; stopClock(); save(); return; } if (playable()) { prior = state; event('pause'); pauseMenu(); } }
grid.addEventListener('pointerdown', e => {
  lastPointerType = e.pointerType;
  const cell = (e.target as HTMLElement).closest<HTMLElement>('[data-cell]');
  if (playable() && cell && e.isPrimary && e.button === 0) {
    cancelHold();gesture = { pointer: e.pointerId, x: e.clientX, y: e.clientY, cell: Number(cell.dataset.cell), time: performance.now(), epoch };
    const down=gesture;
    holdTimer=setTimeout(()=>{holdTimer=null;if(gesture===down&&down.epoch===epoch&&playable()){gesture=null;suppressClickUntil=performance.now()+650;move('flag',down.cell);}},500);
  }
});
grid.addEventListener('pointermove', e => { if (gesture && e.pointerId === gesture.pointer && Math.hypot(e.clientX - gesture.x, e.clientY - gesture.y) > 9) { cancelHold();gesture = null; suppressClickUntil = performance.now() + 450; } });
grid.addEventListener('pointercancel', () => { cancelHold();gesture = null; suppressClickUntil = performance.now() + 450; });
// Do not capture the pointer: cells retain native touch panning. A mouse can
// leave the grid without delivering a grid move/up, so release/cancel also
// terminates its pending hold at the window boundary.
grid.addEventListener('pointerleave', e => {
  if (gesture?.pointer !== e.pointerId) return;
  cancelHold(); gesture = null; suppressClickUntil = performance.now() + 450;
});
for (const name of ['pointerup','pointercancel'] as const) window.addEventListener(name, e => {
  if (gesture?.pointer !== e.pointerId) return;
  cancelHold(); gesture = null; suppressClickUntil = performance.now() + 450;
});

grid.addEventListener('pointerup', e => {
  cancelHold();const g = gesture; gesture = null;
  if (!g || g.pointer !== e.pointerId || g.epoch !== epoch || Math.hypot(e.clientX - g.x, e.clientY - g.y) > 9 || performance.now() - g.time > 550) { suppressClickUntil = performance.now() + 450; return; }
  suppressClickUntil = performance.now() + 450; move('open', g.cell);
});
grid.addEventListener('click', e => { if (e.detail === 0 && playable()) { const cell = (e.target as HTMLElement).closest<HTMLElement>('[data-cell]'); if (cell) move('open', Number(cell.dataset.cell)); } else if (performance.now() >= suppressClickUntil) { /* Pointer gestures alone activate physical input. */ } });
grid.addEventListener('contextmenu', e => { e.preventDefault(); if (lastPointerType !== 'mouse') return; const cell = (e.target as HTMLElement).closest<HTMLElement>('[data-cell]'); if (cell) move('flag', Number(cell.dataset.cell)); });
grid.addEventListener('keydown', e => {
  if (!playable()) return;
  const cell = (e.target as HTMLElement).closest<HTMLElement>('[data-cell]'); if (!cell) return; focus = Number(cell.dataset.cell);
  if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) { e.preventDefault(); const delta = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' ? -board.width : board.width; focus = Math.max(0,Math.min(board.opened.length - 1, focus + delta)); render(); focusCell(); grid.querySelector<HTMLElement>(`[data-cell="${focus}"]`)?.scrollIntoView({ block:'nearest', inline:'nearest' }); }
  if ([' ','Enter','f','F'].includes(e.key)) { e.preventDefault(); if (!e.repeat) move(e.key.toLowerCase() === 'f' ? 'flag' : 'open', focus); }
});
grid.addEventListener('focusin', e => { const cell = (e.target as HTMLElement).closest<HTMLElement>('[data-cell]'); if (cell) focus = Number(cell.dataset.cell); });

el('hint').onclick = () => { if (!playable()) return; hinted = board.hint(); hints++; feedback = hinted ? `${Math.floor(hinted.cell / board.width) + 1}行${hinted.cell % board.width + 1}列：${hinted.reason}${board.flags[hinted.cell] && hinted.kind === 'safe' ? '旗が置かれていますが、安全と証明されています。旗を外して開けます。' : ''}` : '今見えている数字と地雷総数からは、次のマスを確定できません。正解配置を見て答えることはしません。'; specific('hint'); save(); render(); };
el('chord').onclick = () => move('chord', focus);
el('pause').onclick = pause; el('help').onclick = () => { if (playable()) help(true); };
el('retry').onclick = () => { if (playable()) { if (training()) practice(); else { event('retry'); start(); } } };
el('title').onclick = () => title();
el('mute').onclick = () => { el('mute').textContent = audio.toggle() ? '音 OFF' : '音 ON'; }; el('mute').textContent = audio.muted ? '音 OFF' : '音 ON';
el('portal').onclick = () => { cancelJob(); stopClock(); save(); telemetry.trackEvent('return_to_portal', { source: state }); };
document.addEventListener('keydown', e => { if (e.key === 'Escape' && playable()) { e.preventDefault(); pause(); } });
// A cell's pointerup can display a menu before the browser sends its compatibility
// click. Menu actions require their own fresh press in this screen, never that tap.
menu.addEventListener('pointerdown', e => {
  const target = (e.target as HTMLElement).closest<HTMLElement>('button,a');
  menuDown = target && e.isPrimary && e.button === 0 ? { epoch, target } : null;
});
menu.addEventListener('pointercancel', () => { menuDown = null; });
menu.addEventListener('click', e => {
  const target = (e.target as HTMLElement).closest<HTMLElement>('button,a');
  if (!target) return;
  const fresh = menuDown !== null && menuDown.epoch === epoch && menuDown.target === target;
  menuDown = null;
  if (e.detail > 0 && !fresh) { e.preventDefault(); e.stopImmediatePropagation(); }
}, true);
menu.addEventListener('cancel', e => e.preventDefault());
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); }); window.addEventListener('blur', pause);
window.addEventListener('pagehide', () => { cancelJob(); stopClock(); save(); audio.destroy(); }, { once: true });
setInterval(updateClock, 1000);
telemetry.trackEvent('game_open'); title(true);
if (import.meta.env.DEV) Object.defineProperty(window, '__game025', { get: () => ({ state, boardMode,dailyId,bestTimes:[...bestTimes],difficulty: board.difficulty, opened: [...board.opened], flags: [...board.flags], outcome: board.outcome, guaranteed: !!board.proof, elapsedMs: elapsed(), hints, stats: { ...stats }, telemetry: telemetry.getEvents() }) });
