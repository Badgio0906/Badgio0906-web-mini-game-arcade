import './style.css';
import {
  act, checkPlacement, clockElapsed, createRun, isActive, lastStageResult, occupancy, placementCovering, resume, shapeCells, solveStage,
  stageOf, stageScore, suspend, totalScore, BOARD_SIZE, FOODS, STAGES, type Action, type Outcome, type RunState,
} from './model';
import {createPieceArt, foodLabel, layoutPieceArt, rotatedBounds} from './pieceView';
import {BentoStore} from './save';
import {BentoAudio, type Sfx} from './audio';

type Screen = 'title' | 'play' | 'result';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const app = $('app');
const screens = {title: $('title-screen'), play: $('play-screen'), result: $('result-screen')};
const grid = $('grid'), box = $('box'), tray = $('tray'), statusEl = $('status'), ghost = $('ghost');
const actions = $('actions'), clearPanel = $('clear-panel'), seal = $('seal');
const pauseBtn = $<HTMLButtonElement>('pause'), muteBtn = $<HTMLButtonElement>('mute');
const rotateBtn = $<HTMLButtonElement>('rotate'), deselectBtn = $<HTMLButtonElement>('deselect');
const dialog = $<HTMLDialogElement>('dialog');

const store = new BentoStore();
const audio = new BentoAudio(store.muted());

let screen: Screen = 'title';
let run: RunState | null = null;
let runSerial = 0;
/** Bumped on every new stage/run/screen so stale pointer gestures are dropped. */
let epoch = 0;
let paused = false;
let windowBlurred = false;
let cursor = {x: 0, y: 0};
let keyboardPreview = false;
let hudTimer: number | null = null;

const cells: HTMLElement[] = [];
const traySlots = new Map<string, HTMLButtonElement>();
const boardPieces = new Map<string, HTMLButtonElement>();
let previewMarked: number[] = [];

const now = () => performance.now();
const sfx = (s: Sfx) => audio.play(s);

// ------------------------------------------------------------------ helpers

function setStatus(text: string, tone: 'info' | 'bad' | 'good' = 'info'): void {
  statusEl.textContent = text;
  statusEl.dataset.tone = tone;
}

const REJECT_TEXT: Record<Extract<Outcome, {ok: false}>['reason'], string> = {
  inactive: '',
  unknown: '',
  placed: 'そのおかずはもう詰めてあります。',
  out: '弁当箱からはみ出します。',
  overlap: 'ほかのおかずと重なります。',
  noSelection: '先におかずを選んでください。',
  notCleared: '',
};

function duplicated(shape: string): boolean {
  return !!run && [...stageOf(run)].filter(c => c === shape).length > 1;
}

function labelOf(id: string): string {
  const p = run?.pieces.find(q => q.id === id);
  return p ? foodLabel(p, duplicated(p.shape)) : '';
}

function showScreen(next: Screen): void {
  screen = next;
  epoch++;
  cancelDrag();
  app.dataset.screen = next;
  for (const [k, el] of Object.entries(screens)) el.hidden = k !== next;
  pauseBtn.hidden = next !== 'play';
  syncClock();
}

// ------------------------------------------------------------------ clock

function shouldRun(): boolean {
  return screen === 'play' && !!run && run.phase === 'playing' && !paused && !dialog.open && !windowBlurred && document.visibilityState === 'visible';
}

function syncClock(): void {
  if (!run) return;
  const wasActive = isActive(run);
  if (shouldRun()) run = resume(run, now());
  else if (run.clock.since !== null) { run = suspend(run, now()); cancelDrag(); }
  const active = isActive(run);
  if (active && hudTimer === null) hudTimer = window.setInterval(updateHud, 250);
  if (!active && hudTimer !== null) { clearInterval(hudTimer); hudTimer = null; }
  // Enabled/disabled controls follow the clock, so redraw whenever it flips.
  if (active !== wasActive && screen === 'play') render();
  else updateHud();
}

function updateHud(): void {
  if (!run) return;
  const ms = clockElapsed(run.clock, now());
  $('hud-time').textContent = String(Math.floor(ms / 1000));
  $('hud-stage-score').textContent = String(stageScore(ms, run.rotates, run.undos));
  $('hud-total').textContent = String(totalScore(run));
  $('hud-stage').textContent = run.mode === 'run' ? `弁当 ${run.stageIndex + 1} / ${STAGES.length}` : '練習（記録なし）';
  $('hud-total-wrap').hidden = run.mode !== 'run';
}

// ------------------------------------------------------------------ stage DOM

function buildCells(): void {
  for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
    const c = document.createElement('div');
    c.className = 'cell';
    c.dataset.x = String(x);
    c.dataset.y = String(y);
    grid.append(c);
    cells.push(c);
  }
}

function buildStage(): void {
  if (!run) return;
  epoch++;
  cancelDrag();
  tray.replaceChildren();
  traySlots.clear();
  boardPieces.forEach(el => el.remove());
  boardPieces.clear();
  box.classList.remove('cleared');
  clearPanel.hidden = true;
  actions.hidden = false;
  tray.hidden = false;
  keyboardPreview = false;
  cursor = {x: 0, y: 0};
  run.pieces.forEach((p, i) => {
    const slot = document.createElement('button');
    slot.type = 'button';
    slot.className = 'slot';
    slot.dataset.id = p.id;
    slot.dataset.shape = p.shape;
    const inner = document.createElement('span');
    inner.className = 'slot-inner';
    inner.append(createPieceArt(p.shape));
    const name = document.createElement('span');
    name.className = 'slot-name';
    name.textContent = `${i + 1} ${labelOf(p.id)}`;
    slot.append(inner, name);
    tray.append(slot);
    traySlots.set(p.id, slot);

    const placed = document.createElement('button');
    placed.type = 'button';
    placed.className = 'placed';
    placed.dataset.id = p.id;
    placed.dataset.shape = p.shape;
    placed.append(createPieceArt(p.shape));
    placed.hidden = true;
    grid.append(placed);
    boardPieces.set(p.id, placed);
  });
  setStatus(run.mode === 'run' ? 'おかずを選んで、弁当箱へ詰めましょう。' : '練習です。ドラッグ、タップ、キーボードどれでも詰められます。');
  render();
}

function render(): void {
  // The stage DOM is built after the screen switch; nothing to draw until then.
  if (!run || run.pieces.some(p => !traySlots.has(p.id))) return;
  const active = isActive(run);
  for (const p of run.pieces) {
    const slot = traySlots.get(p.id)!;
    const art = slot.querySelector<HTMLElement>('.food')!;
    const {w, h} = layoutPieceArt(art, p);
    const span = Math.max(3, w, h);
    art.style.width = `${(w / span) * 100}%`;
    slot.dataset.rotation = String(p.rotation);
    slot.classList.toggle('used', !!p.at);
    slot.classList.toggle('selected', run.selectedId === p.id);
    slot.disabled = !!p.at || !active;
    slot.setAttribute('aria-pressed', String(run.selectedId === p.id));
    slot.setAttribute('aria-label', `${labelOf(p.id)}（${p.at ? '詰めた' : run.selectedId === p.id ? '選択中' : '未配置'}）`);

    const placed = boardPieces.get(p.id)!;
    placed.hidden = !p.at;
    if (p.at) {
      const pw = layoutPieceArt(placed.firstElementChild as HTMLElement, p);
      placed.dataset.x = String(p.at.x);
      placed.dataset.y = String(p.at.y);
      placed.dataset.rotation = String(p.rotation);
      placed.style.left = `${p.at.x * 25}%`;
      placed.style.top = `${p.at.y * 25}%`;
      placed.style.width = `${pw.w * 25}%`;
      placed.style.height = `${pw.h * 25}%`;
      placed.disabled = !active;
      placed.setAttribute('aria-label', `${labelOf(p.id)}（取り外す）`);
    }
  }
  const sel = run.pieces.find(p => p.id === run!.selectedId);
  rotateBtn.disabled = !active || !sel;
  deselectBtn.disabled = !active || !sel;
  app.dataset.selected = sel ? sel.id : '';
  if (sel) clampCursor();
  showPreview(sel && keyboardPreview && active ? {id: sel.id, x: cursor.x, y: cursor.y} : null);
  updateHud();
}

function clampCursor(): void {
  const sel = run?.pieces.find(p => p.id === run!.selectedId);
  if (!sel) return;
  const {w, h} = rotatedBounds(sel);
  cursor = {x: Math.min(Math.max(cursor.x, 0), BOARD_SIZE - w), y: Math.min(Math.max(cursor.y, 0), BOARD_SIZE - h)};
}

function showPreview(target: {id: string; x: number; y: number} | null): boolean {
  for (const i of previewMarked) cells[i].classList.remove('ok', 'ng');
  previewMarked = [];
  if (!target || !run) return false;
  const check = checkPlacement(run.pieces, target.id, target.x, target.y);
  for (const [x, y] of check.cells) {
    if (x < 0 || y < 0 || x >= BOARD_SIZE || y >= BOARD_SIZE) continue;
    const i = y * BOARD_SIZE + x;
    cells[i].classList.add(check.ok ? 'ok' : 'ng');
    previewMarked.push(i);
  }
  grid.dataset.preview = check.ok ? 'ok' : 'ng';
  return check.ok;
}

// ------------------------------------------------------------------ dispatch

function dispatch(a: Action): Outcome {
  if (!run) return {ok: false, reason: 'inactive'};
  const step = act(run, a, now());
  run = step.state;
  const o = step.outcome;
  if (!o.ok) {
    if (REJECT_TEXT[o.reason]) { setStatus(REJECT_TEXT[o.reason], 'bad'); sfx('bad'); }
    render();
    return o;
  }
  switch (o.event) {
    case 'selected': sfx('pick'); setStatus(`${labelOf(run.selectedId!)}を選びました。回す：⟳ / R`); break;
    case 'deselected': setStatus('選択をやめました。'); break;
    case 'rotated': sfx('rotate'); break;
    case 'placed': sfx('drop'); setStatus('ぴったり！'); bump(a); break;
    case 'removed': sfx('undo'); setStatus(`${labelOf(run.selectedId!)}を取り外しました（-50）。`); break;
    case 'cleared': render(); onCleared(); return o;
    case 'nextStage': buildStage(); syncClock(); return o;
    case 'complete': finishRun(); return o;
  }
  render();
  return o;
}

function bump(a: Action): void {
  if (a.type !== 'place') return;
  const el = boardPieces.get(a.id);
  if (!el) return;
  el.classList.remove('landed');
  void el.offsetWidth; // restart the one-shot CSS animation
  el.classList.add('landed');
}

// ------------------------------------------------------------------ clear / result

function onCleared(): void {
  if (!run) return;
  syncClock();
  cancelDrag();
  const r = lastStageResult(run)!;
  const final = run.mode === 'run' && run.stageIndex === STAGES.length - 1;
  sfx(final ? 'complete' : 'clear');
  box.classList.add('cleared');
  seal.querySelector('span')!.textContent = run.mode === 'run' ? `${r.score}点` : 'できた！';
  actions.hidden = true;
  tray.hidden = true;
  clearPanel.hidden = false;
  $('clear-title').textContent = run.mode === 'run' ? `弁当 ${run.stageIndex + 1} できあがり！` : '練習達成！ 全マス埋まりました';
  $('clear-detail').textContent = `時間 ${Math.floor(r.activeMs / 1000)}秒 ・ 回転 ${r.rotates} ・ 取外し ${r.undos}` + (run.mode === 'run' ? ` → ${r.score}点` : '（本番の記録には入りません）');
  setStatus(run.mode === 'run' ? `弁当 ${run.stageIndex + 1} 完成！` : '練習クリア！', 'good');
  const buttons = $('clear-buttons');
  buttons.replaceChildren();
  const add = (id: string, text: string, fn: () => void, primary = false) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.id = id;
    b.textContent = text;
    if (primary) b.className = 'primary';
    b.addEventListener('click', fn);
    buttons.append(b);
    return b;
  };
  let first: HTMLButtonElement;
  if (run.mode === 'run') {
    first = add('next', final ? '結果を見る' : '次の弁当へ', () => dispatch({type: 'next'}), true);
  } else {
    first = add('practice-again', 'もう一回練習', () => dispatch({type: 'next'}), true);
    add('practice-to-run', '本番を始める', startRun);
    add('practice-title', 'タイトルへ', goTitle);
  }
  first.focus({preventScroll: true});
}

function finishRun(): void {
  if (!run || run.mode !== 'run' || run.phase !== 'complete') return;
  const total = totalScore(run);
  const improved = store.offerBest(total);
  $('result-total').textContent = String(total);
  $('result-best').textContent = improved ? `NEW BEST！ ${total}` : `BEST ${store.best()}`;
  $('result-best').classList.toggle('new', improved);
  const rows = $('result-rows');
  rows.replaceChildren();
  run.results.forEach((r, i) => {
    const tr = document.createElement('tr');
    const foods = [...r.stage].map(c => FOODS[c as keyof typeof FOODS].ja).join('・');
    for (const v of [`${i + 1}. ${foods}`, `${Math.floor(r.activeMs / 1000)}秒`, String(r.rotates), String(r.undos), String(r.score)]) {
      const td = document.createElement('td');
      td.textContent = v;
      tr.append(td);
    }
    rows.append(tr);
  });
  if (improved) sfx('complete');
  updateTitleBest();
  showScreen('result');
  $('retry').focus({preventScroll: true});
}

// ------------------------------------------------------------------ flow

function startRun(): void {
  run = createRun('run', `run-${Date.now().toString(36)}-${++runSerial}`);
  paused = false;
  showScreen('play');
  buildStage();
  syncClock();
  grid.focus({preventScroll: true});
}

function startPractice(): void {
  run = createRun('practice', `practice-${++runSerial}`);
  paused = false;
  showScreen('play');
  buildStage();
  syncClock();
  grid.focus({preventScroll: true});
}

function goTitle(): void {
  paused = false;
  if (dialog.open) dialog.close();
  run = null;
  if (hudTimer !== null) { clearInterval(hudTimer); hudTimer = null; }
  showScreen('title');
  updateTitleBest();
  $('start').focus({preventScroll: true});
}

function updateTitleBest(): void {
  $('title-best').textContent = String(store.best());
  $('storage-note').hidden = store.persistent;
}

// ------------------------------------------------------------------ dialogs

type DialogButton = {id: string; text: string; primary?: boolean; fn: () => void};
let dialogClose: (() => void) | null = null;

function openDialog(title: string, body: string, buttons: DialogButton[], onDismiss: () => void): void {
  $('dialog-title').textContent = title;
  $('dialog-content').innerHTML = body;
  const row = $('dialog-buttons');
  row.replaceChildren();
  for (const b of buttons) {
    const el = document.createElement('button');
    el.type = 'button';
    el.id = b.id;
    el.textContent = b.text;
    if (b.primary) el.className = 'primary';
    el.addEventListener('click', () => { dialogClose = null; dialog.close(); b.fn(); });
    row.append(el);
  }
  dialogClose = onDismiss;
  cancelDrag();
  dialog.showModal();
  syncClock();
  (row.firstElementChild as HTMLElement | null)?.focus();
}

// A held Escape must not close the pause menu it just opened.
dialog.addEventListener('keydown', e => { if (e.key === 'Escape' && e.repeat) e.preventDefault(); });
dialog.addEventListener('close', () => {
  const fn = dialogClose;
  dialogClose = null;
  fn?.();
  syncClock();
});

function pauseGame(reason: 'button' | 'auto'): void {
  if (screen !== 'play' || !run || run.phase !== 'playing' || paused) return;
  paused = true;
  syncClock();
  render();
  const resumeFn = () => { paused = false; syncClock(); render(); grid.focus({preventScroll: true}); };
  const buttons: DialogButton[] = [{id: 'resume', text: '再開する', primary: true, fn: resumeFn}];
  if (run.mode === 'run') buttons.push({id: 'restart', text: '最初から', fn: startRun});
  buttons.push({id: 'pause-title', text: 'タイトルへ', fn: goTitle});
  openDialog('休憩中', `<p>${reason === 'auto' ? '画面から離れたので時間を止めました。' : '時間は止まっています。'}</p><p class="small">再開すると、選択中のおかずは選び直しになります。</p>`, buttons, resumeFn);
}

const HELP_HTML = `
<ul class="help">
<li><b>4×4の弁当箱</b>に、形のちがう4つのおかずを<b>隙間なく</b>詰めます。全マス埋まれば完成。</li>
<li><b>ドラッグ</b>：おかずを持ち上げて弁当箱へ。マスに吸い付き、緑なら置けます／赤は置けません。</li>
<li><b>タップ</b>：おかずをタップ→弁当箱のマスをタップ。そのマスにおかずの左上の具が入ります。</li>
<li><b>回す</b>：選んだおかずを⟳ボタンまたは<kbd>R</kbd>で90°回転（裏返しはできません）。</li>
<li><b>取り外す</b>：詰めたおかずをタップ／ドラッグすると箱から出せます。</li>
<li><b>キーボード</b>：<kbd>1</kbd>〜<kbd>4</kbd>かTabで選んで<kbd>Enter</kbd>、矢印で位置、<kbd>R</kbd>で回転、<kbd>Enter</kbd>で詰める、<kbd>Esc</kbd>で選択解除／休憩。</li>
<li><b>得点</b>：各弁当 1000点から、操作できる時間1秒ごと−3、回転1回−20、取り外し1回−50（0点未満なし）。置けない場所に置こうとしても減点はありません。</li>
<li>本番は全6弁当・最大6000点。6つ全部つくると BEST を記録します。練習は記録に入りません。</li>
</ul>`;

function openHelp(): void {
  openDialog('遊び方', HELP_HTML, [{id: 'help-close', text: 'とじる', primary: true, fn: () => {}}], () => {});
}

// ------------------------------------------------------------------ pointer input

interface DragState {
  pointerId: number;
  origin: 'tray' | 'board' | 'grid';
  id: string | null;
  startX: number; startY: number;
  lastX: number; lastY: number;
  fx: number; fy: number;
  started: boolean;
  epoch: number;
  gridRect: DOMRect;
  anchor: {x: number; y: number} | null;
  el: Element;
}
let drag: DragState | null = null;
let rafId = 0;

function cellAt(clientX: number, clientY: number, rect: DOMRect): {x: number; y: number} | null {
  const size = rect.width / BOARD_SIZE;
  const x = Math.floor((clientX - rect.left) / size), y = Math.floor((clientY - rect.top) / size);
  return x >= 0 && y >= 0 && x < BOARD_SIZE && y < BOARD_SIZE ? {x, y} : null;
}

function beginPointer(e: PointerEvent, origin: DragState['origin'], id: string | null, artEl: Element | null, captureEl: Element): void {
  if (drag || !run || !isActive(run) || (e.pointerType === 'mouse' && e.button !== 0)) return;
  e.preventDefault();
  const r = (artEl ?? captureEl).getBoundingClientRect();
  drag = {
    pointerId: e.pointerId, origin, id,
    startX: e.clientX, startY: e.clientY, lastX: e.clientX, lastY: e.clientY,
    fx: r.width ? Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) : 0.5,
    fy: r.height ? Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)) : 0.5,
    started: false, epoch, gridRect: grid.getBoundingClientRect(), anchor: null, el: captureEl,
  };
  try { captureEl.setPointerCapture(e.pointerId); } catch { /* capture is best effort */ }
}

function startDrag(): void {
  if (!drag || !run || drag.id === null) return;
  if (drag.origin === 'board') {
    if (!dispatch({type: 'remove', id: drag.id}).ok) { drag = null; return; }
  } else if (run.selectedId !== drag.id) {
    if (!dispatch({type: 'select', id: drag.id}).ok) { drag = null; return; }
  }
  drag.started = true;
  keyboardPreview = false;
  const p = run.pieces.find(q => q.id === drag!.id)!;
  ghost.replaceChildren(createPieceArt(p.shape));
  ghost.hidden = false;
  app.classList.add('dragging');
  traySlots.get(p.id)?.classList.add('lifted');
  updateDrag();
}

/** Where the lifted food would land: nearest cell origin, or null when it is off the box. */
function dragAnchor(d: DragState, w: number, h: number): {left: number; top: number; cell: number; anchor: {x: number; y: number} | null} {
  const rect = d.gridRect, cell = rect.width / BOARD_SIZE;
  const left = d.lastX - d.fx * w * cell, top = d.lastY - d.fy * h * cell;
  const near = left < rect.right - cell * 0.5 && left + w * cell > rect.left + cell * 0.5 && top < rect.bottom - cell * 0.5 && top + h * cell > rect.top + cell * 0.5;
  return {left, top, cell, anchor: near ? {x: Math.round((left - rect.left) / cell), y: Math.round((top - rect.top) / cell)} : null};
}

function updateDrag(): void {
  rafId = 0;
  if (!drag || !drag.started || !run || drag.id === null) return;
  const p = run.pieces.find(q => q.id === drag!.id);
  if (!p) return;
  const {w, h} = layoutPieceArt(ghost.firstElementChild as HTMLElement, p);
  const {left, top, cell, anchor} = dragAnchor(drag, w, h);
  drag.anchor = anchor;
  const ok = showPreview(anchor ? {id: p.id, ...anchor} : null);
  ghost.style.width = `${w * cell}px`;
  ghost.style.height = `${h * cell}px`;
  // Snap to the grid while the drop is legal so the hitbox reads exactly.
  const gx = ok && anchor ? drag.gridRect.left + anchor.x * cell : left;
  const gy = ok && anchor ? drag.gridRect.top + anchor.y * cell : top;
  ghost.style.transform = `translate(${gx}px, ${gy}px)`;
  ghost.classList.toggle('snap', ok);
}

function onPointerMove(e: PointerEvent): void {
  if (!drag || e.pointerId !== drag.pointerId) {
    if (!drag && e.pointerType === 'mouse' && run && run.selectedId && isActive(run) && !keyboardPreview) hoverPreview(e);
    return;
  }
  drag.lastX = e.clientX;
  drag.lastY = e.clientY;
  if (drag.epoch !== epoch) { cancelDrag(); return; }
  if (!drag.started && drag.origin !== 'grid' && Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) > 8) startDrag();
  if (drag?.started && !rafId) rafId = requestAnimationFrame(updateDrag);
}

function hoverPreview(e: PointerEvent): void {
  if (!run || !run.selectedId) return;
  const c = cellAt(e.clientX, e.clientY, grid.getBoundingClientRect());
  if (!c) { showPreview(null); return; }
  const p = run.pieces.find(q => q.id === run!.selectedId)!;
  // Same rule as a tap: the model's covering origin, else the first-cell origin (shown red).
  const [fx, fy] = shapeCells(p.shape, p.rotation)[0];
  const at = placementCovering(run.pieces, p.id, c.x, c.y) ?? {x: c.x - fx, y: c.y - fy};
  showPreview({id: p.id, x: at.x, y: at.y});
}

function onPointerUp(e: PointerEvent): void {
  if (!drag || e.pointerId !== drag.pointerId) return;
  const d = drag;
  drag = null;
  endDragVisuals();
  if (d.epoch !== epoch || !run || !isActive(run)) return;
  if (d.started && d.id) {
    d.lastX = e.clientX;
    d.lastY = e.clientY;
    const p = run.pieces.find(q => q.id === d.id)!;
    const {w, h} = rotatedBounds(p);
    d.anchor = dragAnchor(d, w, h).anchor;
    if (d.anchor) dispatch({type: 'place', id: d.id, x: d.anchor.x, y: d.anchor.y});
    else { setStatus('弁当箱の上で離すと詰められます。'); render(); }
    return;
  }
  if (Math.hypot(e.clientX - d.startX, e.clientY - d.startY) > 12) { render(); return; }
  // A tap.
  if (d.origin === 'tray' && d.id) {
    keyboardPreview = false;
    if (run.selectedId === d.id) dispatch({type: 'deselect'});
    else dispatch({type: 'select', id: d.id});
  } else if (d.origin === 'board' && d.id) {
    keyboardPreview = false;
    dispatch({type: 'remove', id: d.id});
  } else if (d.origin === 'grid') {
    const c = cellAt(e.clientX, e.clientY, d.gridRect);
    if (!run.selectedId) { if (c) setStatus('先に右（下）のおかずを選んでください。'); return; }
    if (c) dispatch({type: 'placeCovering', id: run.selectedId, cx: c.x, cy: c.y});
  }
}

function endDragVisuals(): void {
  if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
  ghost.hidden = true;
  ghost.replaceChildren();
  app.classList.remove('dragging');
  traySlots.forEach(s => s.classList.remove('lifted'));
  showPreview(null);
}

/** Drop any active gesture without placing anything. */
function cancelDrag(): void {
  if (drag) {
    try { (drag.el as Element).releasePointerCapture?.(drag.pointerId); } catch { /* already released */ }
    drag = null;
  }
  endDragVisuals();
}

function onPointerCancel(e: PointerEvent): void {
  if (!drag || e.pointerId !== drag.pointerId) return;
  cancelDrag();
  if (run) { setStatus('操作が中断されました。もう一度どうぞ。'); render(); }
}

tray.addEventListener('pointerdown', e => {
  const slot = (e.target as Element).closest<HTMLButtonElement>('button.slot');
  if (!slot || slot.disabled) return;
  beginPointer(e, 'tray', slot.dataset.id!, slot.querySelector('.food'), slot);
});
grid.addEventListener('pointerdown', e => {
  if (!run) return;
  // Hit-test by the model's cell occupancy, not by the dish's bounding box:
  // the empty corners of an L/T/S box belong to the board.
  const c = cellAt(e.clientX, e.clientY, grid.getBoundingClientRect());
  const owner = c ? occupancy(run.pieces)[c.y * BOARD_SIZE + c.x] : null;
  const placed = owner ? boardPieces.get(owner) : undefined;
  // A lifted placed food is hidden mid-gesture, so the grid (not the food) holds capture.
  if (placed) { if (!placed.disabled) beginPointer(e, 'board', owner!, placed, grid); return; }
  beginPointer(e, 'grid', null, grid, grid);
});
for (const el of [tray, grid]) {
  el.addEventListener('pointermove', onPointerMove);
  el.addEventListener('pointerup', onPointerUp);
  el.addEventListener('pointercancel', onPointerCancel);
  el.addEventListener('lostpointercapture', e => { if (drag && e.pointerId === drag.pointerId) onPointerCancel(e); });
}
// Pointer capture keeps moves on the source element; hover preview needs the grid too.
grid.addEventListener('pointerleave', () => { if (!drag && !keyboardPreview) showPreview(null); });

// Keyboard-activated clicks only (detail 0). Pointer taps are handled above, so a
// drag's pointerup can never be followed by a second placement from click.
tray.addEventListener('click', e => {
  const slot = (e.target as Element).closest<HTMLButtonElement>('button.slot');
  if (!slot || e.detail !== 0) return;
  keyboardPreview = true;
  if (dispatch({type: 'select', id: slot.dataset.id!}).ok) grid.focus({preventScroll: true});
  render();
});
grid.addEventListener('click', e => {
  const placed = (e.target as Element).closest<HTMLButtonElement>('button.placed');
  if (!placed || e.detail !== 0) return;
  keyboardPreview = true;
  dispatch({type: 'remove', id: placed.dataset.id!});
  grid.focus({preventScroll: true});
});

rotateBtn.addEventListener('click', () => { dispatch({type: 'rotate'}); if (drag?.started) updateDrag(); });
deselectBtn.addEventListener('click', () => {
  const id = run?.selectedId;
  dispatch({type: 'deselect'});
  if (id) traySlots.get(id)?.focus({preventScroll: true});
});

// ------------------------------------------------------------------ keyboard

document.addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (dialog.open || screen !== 'play' || !run) return;
  const k = e.key;
  const handled = ['r', 'R', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Escape', '1', '2', '3', '4', 'Enter', ' '];
  if (!handled.includes(k)) return;
  if (k === 'Enter' || k === ' ') {
    // Buttons keep their native activation; Enter/Space on the board places.
    if (document.activeElement !== grid) return;
  }
  e.preventDefault();
  if (e.repeat) return; // no held-key repeats: every action needs a fresh press
  if (k === 'Escape') {
    if (drag) { cancelDrag(); render(); return; }
    if (run.selectedId) { const id = run.selectedId; dispatch({type: 'deselect'}); traySlots.get(id)?.focus({preventScroll: true}); return; }
    pauseGame('button');
    return;
  }
  if (!isActive(run)) return;
  if (k === 'r' || k === 'R') { dispatch({type: 'rotate'}); if (drag?.started) updateDrag(); return; }
  if (/^[1-4]$/.test(k)) {
    const p = run.pieces[Number(k) - 1];
    if (!p) return;
    keyboardPreview = true;
    if (dispatch({type: 'select', id: p.id}).ok) grid.focus({preventScroll: true});
    render();
    return;
  }
  if (!run.selectedId) { if (k.startsWith('Arrow') || k === 'Enter' || k === ' ') setStatus('先におかずを選んでください（1〜4キー）。'); return; }
  if (k.startsWith('Arrow')) {
    keyboardPreview = true;
    cursor = {x: cursor.x + (k === 'ArrowLeft' ? -1 : k === 'ArrowRight' ? 1 : 0), y: cursor.y + (k === 'ArrowUp' ? -1 : k === 'ArrowDown' ? 1 : 0)};
    sfx('tap');
    render();
    return;
  }
  if (k === 'Enter' || k === ' ') {
    keyboardPreview = true;
    clampCursor();
    dispatch({type: 'place', id: run.selectedId, x: cursor.x, y: cursor.y});
  }
});

// ------------------------------------------------------------------ lifecycle

document.addEventListener('pointerdown', () => audio.unlock(), {capture: true});
document.addEventListener('keydown', () => audio.unlock(), {capture: true});
window.addEventListener('blur', () => { windowBlurred = true; cancelDrag(); pauseGame('auto'); syncClock(); });
window.addEventListener('focus', () => { windowBlurred = false; syncClock(); });
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') { cancelDrag(); pauseGame('auto'); }
  syncClock();
});
window.addEventListener('pagehide', () => {
  cancelDrag();
  if (hudTimer !== null) { clearInterval(hudTimer); hudTimer = null; }
  audio.close();
});
window.addEventListener('resize', () => { if (drag) drag.gridRect = grid.getBoundingClientRect(); });

muteBtn.addEventListener('click', () => {
  const m = !audio.muted;
  audio.setMuted(m);
  store.setMuted(m);
  syncMute();
});
function syncMute(): void {
  muteBtn.textContent = audio.muted ? '音 OFF' : '音 ON';
  muteBtn.setAttribute('aria-pressed', String(audio.muted));
}
pauseBtn.addEventListener('click', () => pauseGame('button'));
$('start').addEventListener('click', startRun);
$('practice-start').addEventListener('click', startPractice);
$('help-open').addEventListener('click', openHelp);
$('retry').addEventListener('click', startRun);
$('result-title').addEventListener('click', goTitle);

// ------------------------------------------------------------------ title hero (a solved bento, from the solver)

function buildHero(): void {
  const hero = $('hero');
  const stage = 'ILJZ';
  const [solution] = solveStage(stage);
  const boxEl = document.createElement('div');
  boxEl.className = 'box mini';
  const g = document.createElement('div');
  g.className = 'grid';
  for (const s of solution) {
    const el = document.createElement('span');
    el.className = 'placed';
    const art = createPieceArt(s.shape);
    const {w, h} = layoutPieceArt(art, s);
    el.style.left = `${s.x * 25}%`;
    el.style.top = `${s.y * 25}%`;
    el.style.width = `${w * 25}%`;
    el.style.height = `${h * 25}%`;
    el.append(art);
    g.append(el);
  }
  boxEl.append(g);
  hero.append(boxEl);
}

buildCells();
buildHero();
syncMute();
updateTitleBest();
showScreen('title');
