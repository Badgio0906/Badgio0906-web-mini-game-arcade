import './style.css';
import {
  COLS, MIN_STEPS, MOVE_LOCK_MS, ROWS, RUN_MS, advanceTo, createState, drainEvents, fire, isLocked, partnerOf, result,
  room, roomsFor, score, selectCannon, shift, type GameEvent, type Mode, type State,
} from './model';
import { Sfx } from './audio';
import { BRASS, CREAM, TURQ, buildSprites, type Sprites } from './art';
import { isPersistent, loadBest, loadSettings, saveBestIfHigher, saveSettings } from './storage';

declare const __BUILD_MODE__: 'preview' | 'native';

// Logical layout (480×480)
const L = 480;
const BX = 60, BY = 62, CELL = 72, ROW_H = 62;
const BOARD_W = CELL * COLS, BOARD_H = ROW_H * ROWS;
const CANNON_Y = BY + BOARD_H + 8; // 318
const STRIP_Y = 404;

type Phase = 'title' | 'ready' | 'running' | 'paused' | 'result' | 'exited';
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const canvas = $<HTMLCanvasElement>('stage');
const g = canvas.getContext('2d')!;
const sfx = new Sfx();
const settings = loadSettings();
sfx.muted = settings.muted;

let sprites: Sprites;
let phase: Phase = 'title';
let mode: Mode = 'run';
let state: State = createState();
let gameTime = 0;
let lastFrame = 0;
let selectedRow = 3;
let drag: { pointerId: number; row: number; startX: number; dx: number } | null = null;
const rowAnim: { from: number; at: number }[] = Array.from({ length: ROWS }, () => ({ from: 0, at: -1e9 }));
let lockFlashUntil = -1e9;

interface Fx { kind: 'beam' | 'break' | 'text' | 'cutin' | 'debris'; at: number; dur: number; col?: number; row?: number; stop?: number | null; text?: string; x?: number; y?: number; vx?: number; vy?: number; big?: boolean }
let fx: Fx[] = [];
const MAX_PARTICLES = 240;

// ---------- layout ----------
function resize() {
  const wrap = $('stage-wrap');
  const size = Math.max(180, Math.floor(Math.min(wrap.clientWidth, wrap.clientHeight)));
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.style.width = `${size}px`; canvas.style.height = `${size}px`;
  canvas.width = Math.round(size * dpr); canvas.height = Math.round(size * dpr);
  $('controls').style.width = `${Math.max(size, Math.min(wrap.clientWidth, 480))}px`;
  sprites = buildSprites(Math.max(1, (size * dpr) / L));
}
window.addEventListener('resize', resize);
const toLogical = (cx: number, cy: number) => { const r = canvas.getBoundingClientRect(); return { x: ((cx - r.left) / r.width) * L, y: ((cy - r.top) / r.height) * L }; };

function inputTime(ts: number) {
  const now = performance.now();
  if (Math.abs(ts - now) > 1000) ts = now;
  return Math.round(gameTime + (Math.min(Math.max(ts, lastFrame), now) - lastFrame));
}

// ---------- input ----------
canvas.addEventListener('pointerdown', e => {
  e.preventDefault();
  if (phase === 'ready') { beginClock(); return; }
  if (phase !== 'running' || drag) return; // one owner at a time; extra fingers are ignored
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  const p = toLogical(e.clientX, e.clientY);
  if (p.y >= BY && p.y < BY + BOARD_H && p.x >= BX - 40 && p.x <= BX + BOARD_W + 40) {
    const row = Math.floor((p.y - BY) / ROW_H);
    selectedRow = row;
    drag = { pointerId: e.pointerId, row, startX: p.x, dx: 0 };
    canvas.setPointerCapture?.(e.pointerId);
  } else if (p.y >= CANNON_Y && p.y < STRIP_Y && p.x >= BX && p.x < BX + BOARD_W) {
    chooseCannon(Math.floor((p.x - BX) / CELL));
  }
});
canvas.addEventListener('pointermove', e => {
  if (!drag || e.pointerId !== drag.pointerId) return;
  drag.dx = Math.max(-2.4 * CELL, Math.min(2.4 * CELL, toLogical(e.clientX, e.clientY).x - drag.startX));
});
canvas.addEventListener('pointerup', e => {
  if (!drag || e.pointerId !== drag.pointerId) return;
  const d = Math.max(-2, Math.min(2, Math.round(drag.dx / CELL)));
  const row = drag.row;
  drag = null;
  if (d !== 0 && phase === 'running') doShift(row, d, e.timeStamp);
});
canvas.addEventListener('pointercancel', e => { if (drag && e.pointerId === drag.pointerId) drag = null; }); // discard unconfirmed move
canvas.addEventListener('contextmenu', e => e.preventDefault());

function doShift(row: number, d: number, ts: number) {
  shift(state, inputTime(ts), row, d);
  handleEvents(drainEvents(state));
}
function chooseCannon(col: number) {
  if (phase !== 'running') return;
  selectCannon(state, col);
  sfx.select();
  syncCannonButtons();
}
function doFire(ts: number) {
  if (phase !== 'running') return;
  fire(state, inputTime(ts));
  handleEvents(drainEvents(state));
}

window.addEventListener('keydown', e => {
  const k = e.key;
  if ((phase === 'running' || phase === 'ready') && [' ', 'ArrowLeft', 'ArrowRight'].includes(k)) e.preventDefault();
  if (k === 'Escape' || k === 'p' || k === 'P') { if (phase === 'running') pause(); return; }
  if (e.repeat) return; // no auto-repeat moves or shots
  if (phase === 'ready' && k === ' ') { beginClock(); return; }
  if (phase !== 'running') return;
  if (k >= '1' && k <= '4') selectedRow = Number(k) - 1;
  else if (k === 'ArrowLeft') doShift(selectedRow, -1, e.timeStamp);
  else if (k === 'ArrowRight') doShift(selectedRow, 1, e.timeStamp);
  else if (k === 'q' || k === 'Q') chooseCannon(Math.max(0, state.cannon - 1));
  else if (k === 'e' || k === 'E') chooseCannon(Math.min(COLS - 1, state.cannon + 1));
  else if (k === ' ') doFire(e.timeStamp);
});
window.addEventListener('blur', () => { drag = null; if (phase === 'running') pause(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && phase === 'running') pause(); });

// ---------- phases ----------
function show(id: string | null) {
  for (const el of document.querySelectorAll<HTMLElement>('.overlay')) el.hidden = el.id !== id;
  $('controls').classList.toggle('inactive', id !== null && id !== 'ready');
  (document.activeElement as HTMLElement | null)?.blur?.();
}
function startRun(m: Mode) {
  sfx.unlock();
  mode = m; state = createState(m); gameTime = 0; fx = []; drag = null; selectedRow = 3;
  rowAnim.forEach(a => { a.from = 0; a.at = -1e9; });
  phase = 'ready';
  $('mode-label').textContent = m === 'practice' ? '練習（第1室・記録なし）' : '本番';
  syncCannonButtons();
  show('ready');
}
function beginClock() { phase = 'running'; lastFrame = performance.now(); show(null); }
function pause() { if (phase !== 'running') return; phase = 'paused'; drag = null; sfx.suspend(); show('paused'); }
function resume() { if (phase !== 'paused') return; sfx.resume(); phase = 'running'; lastFrame = performance.now(); show(null); }
function endRun() {
  phase = 'result';
  const r = result(state);
  let isBest = false;
  if (mode === 'run') isBest = saveBestIfHigher({ score: r.score, rank: r.rank, at: new Date().toISOString() });
  if (r.cleared || r.reason === 'practice-clear') sfx.fanfare(); else sfx.fail();
  const best = loadBest();
  const titles: Record<string, string> = { clear: '全室、開通！', ammo: '弾切れ…', time: '時間切れ…', 'practice-clear': '練習：開通！', 'practice-ammo': '練習：弾切れ' };
  $('result-title').textContent = titles[r.reason];
  $('result-rank').textContent = mode === 'practice' ? '-' : r.rank;
  const rows: [string, string][] = [
    ['SCORE', r.score.toLocaleString()],
    ['全貫通の室', `${r.onePierceRooms}/${roomsFor(mode)}`],
    ['突破した室', `${r.roomsCleared}/${roomsFor(mode)}`],
    ['使用弾数', `${r.shotsUsed}発`],
    ['総移動段数', `${r.moveSteps}段（最短合計 ${mode === 'run' ? MIN_STEPS.reduce((a, b) => a + b, 0) : MIN_STEPS[0]}）`],
    ['クリア時間', r.clearMs === null ? '—' : `${(r.clearMs / 1000).toFixed(1)}秒`],
  ];
  if (mode === 'run') rows.push(['BEST', `${(best?.score ?? 0).toLocaleString()}${isBest ? '（更新！）' : ''}`]); else rows.push(['記録', '練習は保存しません']);
  $('result-body').innerHTML = rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
  $('result-best-note').hidden = isPersistent();
  show('result');
  refreshBest();
}
function exitPreview() { phase = 'exited'; sfx.close(); show('exited'); }
function refreshBest() {
  const b = loadBest();
  $('title-best').textContent = b ? `BEST ${b.score.toLocaleString()}（${b.rank}）` : 'BEST —';
  $('storage-note').hidden = isPersistent();
}

// ---------- events ----------
function handleEvents(events: GameEvent[]) {
  for (const ev of events) {
    switch (ev.type) {
      case 'shift':
        rowAnim[ev.row] = { from: -ev.d * CELL, at: ev.at };
        if (ev.partner !== null) rowAnim[ev.partner] = { from: ev.d * CELL, at: ev.at };
        sfx.slide(ev.partner !== null);
        break;
      case 'reject': if (ev.reason === 'locked' || ev.reason === 'ammo') { lockFlashUntil = gameTime + 250; sfx.locked(); } break;
      case 'fire': {
        sfx.fire(ev.broken.length);
        fx.push({ kind: 'beam', at: ev.at, dur: 350, col: ev.col, stop: ev.stoppedAt, big: ev.broken.length === ROWS });
        ev.broken.forEach((row, i) => {
          const at = ev.at + i * 90; // visual stagger only; logic was decided at the shot
          fx.push({ kind: 'break', at, dur: 300, col: ev.col, row });
          fx.push({ kind: 'text', at, dur: 600, text: i === 3 ? 'ドガーン！' : 'ガン', x: BX + ev.col * CELL + CELL / 2 + (i % 2 ? 36 : -36), y: BY + row * ROW_H + 36, big: i === 3 });
          const n = settings.reducedMotion ? 3 : 10;
          for (let j = 0; j < n && fx.length < MAX_PARTICLES; j++) {
            const a = (j / n) * Math.PI * 2;
            fx.push({ kind: 'debris', at, dur: 500, x: BX + ev.col * CELL + CELL / 2, y: BY + row * ROW_H + ROW_H / 2, vx: Math.cos(a) * 170, vy: Math.sin(a) * 120 - 60 });
          }
        });
        if (ev.points) fx.push({ kind: 'text', at: ev.at, dur: 800, text: `+${ev.points}`, x: BX + ev.col * CELL + CELL / 2, y: CANNON_Y - 6 });
        break;
      }
      case 'room-clear': sfx.roomClear(ev.onePierce); if (ev.onePierce) fx.push({ kind: 'cutin', at: ev.at + 200, dur: 700 }); break;
      case 'end': phase = 'result'; window.setTimeout(endRun, 900); break;
      case 'room-enter': break;
    }
  }
}

// ---------- frame ----------
function frame(now: number) {
  if (phase === 'running') {
    const dt = Math.min(100, Math.max(0, now - lastFrame));
    lastFrame = now;
    gameTime += dt;
    if (mode === 'run') gameTime = Math.min(gameTime, RUN_MS);
    advanceTo(state, Math.round(gameTime));
    handleEvents(drainEvents(state));
    syncFireButton();
  } else lastFrame = now;
  draw();
  requestAnimationFrame(frame);
}

function rowOffset(r: number, t: number) {
  const a = rowAnim[r];
  const k = Math.min(1, (t - a.at) / MOVE_LOCK_MS);
  let off = k >= 1 ? 0 : a.from * (1 - k);
  if (drag) {
    if (drag.row === r) off += drag.dx;
    const p = partnerOf(room(state), drag.row);
    if (p === r) off -= drag.dx;
  }
  return off;
}

function draw() {
  const s = canvas.width / L;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.drawImage(sprites.bg, 0, 0, canvas.width, canvas.height);
  g.setTransform(s, 0, 0, s, 0, 0);
  const t = gameTime;
  const rm = room(state);
  // shutter frame
  g.fillStyle = 'rgba(20,10,6,0.6)'; g.fillRect(BX - 6, BY - 6, BOARD_W + 12, BOARD_H + 12);
  g.strokeStyle = BRASS; g.lineWidth = 3; g.strokeRect(BX - 6, BY - 6, BOARD_W + 12, BOARD_H + 12);
  // gear belts linking pairs (left side) with opposite arrows
  rm.gears.forEach(([a, b], i) => {
    const x = 9 + i * 15;
    const ya = BY + a * ROW_H + ROW_H / 2, yb = BY + b * ROW_H + ROW_H / 2;
    g.strokeStyle = TURQ; g.lineWidth = 4; g.beginPath(); g.moveTo(BX - 8, ya); g.lineTo(x, ya); g.lineTo(x, yb); g.lineTo(BX - 8, yb); g.stroke();
    const spin = (t / 400) % (Math.PI * 2);
    for (const [y, dir] of [[ya, 1], [yb, -1]] as const) {
      g.save(); g.translate(x, y); g.rotate(spin * dir); g.drawImage(sprites.gear, -11, -11, 22, 22); g.restore();
    }
    g.fillStyle = CREAM; g.font = 'bold 10px system-ui, sans-serif'; g.textAlign = 'center';
    g.fillText('⇄', x, (ya + yb) / 2 + 4);
  });
  // rows
  for (let r = 0; r < ROWS; r++) {
    const y = BY + r * ROW_H;
    const off = rowOffset(r, t);
    g.save(); g.beginPath(); g.rect(BX, y, BOARD_W, ROW_H); g.clip();
    for (let c = 0; c < COLS; c++) {
      const isCore = state.cores[r] === c && !state.broken[r];
      const img = state.broken[r] ? sprites.armorBroken : isCore ? sprites.core : sprites.armor;
      for (const wrap of [-BOARD_W, 0, BOARD_W]) g.drawImage(img, BX + c * CELL + off + wrap, y, CELL, ROW_H);
    }
    g.restore();
    // wrap arrows on both ends
    g.fillStyle = r === selectedRow && phase === 'running' ? '#ffe7a3' : 'rgba(246,234,210,0.55)';
    g.font = 'bold 18px system-ui, sans-serif'; g.textAlign = 'center';
    g.fillText('⟲', BX - 16, y + ROW_H / 2 + 6);
    g.fillText('⟳', BX + BOARD_W + 16, y + ROW_H / 2 + 6);
    if (r === selectedRow && phase === 'running') { g.strokeStyle = '#ffe7a3'; g.lineWidth = 2; g.strokeRect(BX - 2, y + 1, BOARD_W + 4, ROW_H - 2); }
  }
  // column guide + cannon
  const cx = BX + state.cannon * CELL + CELL / 2;
  g.fillStyle = 'rgba(47,224,200,0.08)'; g.fillRect(BX + state.cannon * CELL, BY, CELL, BOARD_H);
  for (let c = 0; c < COLS; c++) {
    g.fillStyle = c === state.cannon ? 'rgba(47,224,200,0.25)' : 'rgba(246,234,210,0.08)';
    g.fillRect(BX + c * CELL + 4, CANNON_Y + 46, CELL - 8, 30);
    g.fillStyle = c === state.cannon ? TURQ : 'rgba(246,234,210,0.6)'; g.font = 'bold 14px system-ui, sans-serif'; g.textAlign = 'center';
    g.fillText(`${c + 1}`, BX + c * CELL + CELL / 2, CANNON_Y + 66);
  }
  g.drawImage(sprites.cannon, cx - 28, CANNON_Y - 6, 56, 60);
  drawFx(t);
  drawHud(t);
}

function drawFx(t: number) {
  fx = fx.filter(f => t < f.at + f.dur);
  for (const f of fx) {
    const age = t - f.at; if (age < 0) continue;
    const k = age / f.dur;
    if (f.kind === 'beam') {
      const x = BX + (f.col ?? 0) * CELL + CELL / 2;
      const topY = f.stop === null || f.stop === undefined ? 0 : BY + f.stop * ROW_H + ROW_H;
      const w = (f.big ? 26 : 14) * (1 - k * 0.7);
      const grad = g.createLinearGradient(x - w, 0, x + w, 0);
      grad.addColorStop(0, 'rgba(47,224,200,0)'); grad.addColorStop(0.5, f.big ? '#ffffff' : '#bafff3'); grad.addColorStop(1, 'rgba(47,224,200,0)');
      g.globalAlpha = 1 - k; g.fillStyle = grad; g.fillRect(x - w, topY, w * 2, CANNON_Y - topY); g.globalAlpha = 1;
      if (f.stop !== null && f.stop !== undefined) { g.fillStyle = `rgba(255,200,120,${1 - k})`; g.beginPath(); g.arc(x, topY, 14 * (1 - k) + 4, 0, Math.PI * 2); g.fill(); }
    } else if (f.kind === 'break') {
      const x = BX + (f.col ?? 0) * CELL, y = BY + (f.row ?? 0) * ROW_H;
      g.fillStyle = `rgba(233,255,251,${0.8 * (1 - k)})`; g.fillRect(x, y, CELL, ROW_H);
    } else if (f.kind === 'debris') {
      const s = age / 1000;
      g.globalAlpha = 1 - k; g.fillStyle = (f.vx ?? 0) > 0 ? '#d98a5a' : BRASS;
      g.fillRect((f.x ?? 0) + (f.vx ?? 0) * s - 3, (f.y ?? 0) + (f.vy ?? 0) * s + 260 * s * s - 3, 6, 5); g.globalAlpha = 1;
    } else if (f.kind === 'text') {
      g.globalAlpha = 1 - k * k; g.font = `900 ${f.big ? 26 : 18}px system-ui, sans-serif`; g.textAlign = 'center';
      g.strokeStyle = '#2a1208'; g.lineWidth = 5; g.strokeText(f.text ?? '', f.x ?? 0, (f.y ?? 0) - k * 20);
      g.fillStyle = f.big ? '#ffe066' : CREAM; g.fillText(f.text ?? '', f.x ?? 0, (f.y ?? 0) - k * 20); g.globalAlpha = 1;
    } else if (f.kind === 'cutin') {
      const slide = Math.min(1, age / 120), fade = k > 0.7 ? 1 - (k - 0.7) / 0.3 : 1;
      g.globalAlpha = fade;
      const x = L - slide * 290;
      g.fillStyle = 'rgba(58,26,16,0.94)'; g.fillRect(x, 150, 300, 90);
      g.fillStyle = TURQ; g.fillRect(x, 150, 300, 4); g.fillRect(x, 236, 300, 4);
      g.drawImage(sprites.gunnerWin, x + 4, 146, 92, 92);
      g.fillStyle = '#ffe066'; g.font = '900 24px system-ui, sans-serif'; g.textAlign = 'left'; g.fillText('全段、開通！', x + 102, 192);
      g.fillStyle = CREAM; g.font = 'bold 13px system-ui, sans-serif'; g.fillText('一発で4段ぶち抜き', x + 104, 218);
      g.globalAlpha = 1;
    }
  }
}

function drawHud(t: number) {
  g.fillStyle = 'rgba(30,14,8,0.88)'; g.fillRect(0, 0, L, 46); g.fillRect(0, STRIP_Y, L, L - STRIP_Y);
  g.fillStyle = CREAM; g.font = 'bold 17px system-ui, sans-serif'; g.textAlign = 'left';
  g.fillText(`SCORE ${score(state).toLocaleString()}`, 10, 30);
  g.textAlign = 'center';
  g.fillText(mode === 'run' ? `${(Math.max(0, RUN_MS - t) / 1000).toFixed(1)}s` : '練習', 228, 30);
  g.fillText(`室 ${Math.min(state.roomsCleared + 1, roomsFor(mode))}/${roomsFor(mode)}`, 312, 30);
  g.textAlign = 'right'; g.fillStyle = TURQ; g.fillText(`弾 ${state.ammo}`, 470, 30);
  g.drawImage(sprites.gunner, 2, STRIP_Y - 8, 80, 80);
  g.textAlign = 'left'; g.fillStyle = CREAM; g.font = 'bold 13px system-ui, sans-serif';
  g.fillText(`移動 ${state.moveSteps}段（コスト -${state.moveSteps * 20}）`, 88, STRIP_Y + 24);
  const locked = isLocked(state, Math.round(t));
  g.fillStyle = t < lockFlashUntil ? '#ff8a6a' : locked ? '#ffd28a' : '#9ff5e6';
  g.fillText(locked ? (state.lockKind === 'room' ? '次の室へ移動中…' : '作動中（ロック）') : '操作OK：行をドラッグ／列を選んでFIRE', 88, STRIP_Y + 46);
  if (phase === 'running' && mode === 'run' && t < 4000 && state.roomsCleared === 0) {
    g.fillStyle = 'rgba(255,231,163,0.95)'; g.font = 'bold 13px system-ui, sans-serif'; g.textAlign = 'center';
    g.fillText('光るコアを縦1列に揃えて一発で4段抜き', 240, CANNON_Y + 92 - 4);
  }
}

// ---------- wiring ----------
const colButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-col]'));
/** Pointer-driven buttons act on pointerdown (no lost/duplicated synthetic clicks after touch drags);
 *  `click` is honoured only for keyboard activation (detail === 0). */
function pressable(el: HTMLElement, fn: (ts: number) => void) {
  el.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse' && e.button !== 0) return; e.preventDefault(); fn(e.timeStamp); });
  el.addEventListener('click', e => { if (e.detail === 0) fn(e.timeStamp); });
}
colButtons.forEach(b => pressable(b, () => chooseCannon(Number(b.dataset.col))));
function syncCannonButtons() { colButtons.forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.col) === state.cannon))); }
const fireBtn = $<HTMLButtonElement>('btn-fire');
pressable(fireBtn, ts => doFire(ts));
function syncFireButton() { fireBtn.classList.toggle('locked', isLocked(state, Math.round(gameTime))); fireBtn.textContent = `FIRE（残${state.ammo}）`; }

const bind = (id: string, fn: () => void) => $(id).addEventListener('click', fn);
bind('btn-play', () => startRun('run'));
bind('btn-practice', () => startRun('practice'));
bind('btn-howto', () => show('howto'));
bind('btn-howto-back', () => show('title'));
bind('btn-pause', () => pause());
bind('btn-resume', () => resume());
bind('btn-quit', () => { phase = 'title'; show('title'); refreshBest(); });
bind('btn-retry', () => startRun(mode));
bind('btn-to-title', () => { phase = 'title'; show('title'); refreshBest(); });
for (const id of ['btn-exit', 'btn-exit-2']) bind(id, () => exitPreview());
const muteBtn = $<HTMLButtonElement>('btn-mute');
const motionBtn = $<HTMLButtonElement>('btn-motion');
function syncToggles() {
  muteBtn.textContent = settings.muted ? '音：OFF' : '音：ON'; muteBtn.setAttribute('aria-pressed', String(settings.muted));
  motionBtn.textContent = settings.reducedMotion ? '演出軽減：ON' : '演出軽減：OFF'; motionBtn.setAttribute('aria-pressed', String(settings.reducedMotion));
}
muteBtn.addEventListener('click', () => { settings.muted = !settings.muted; sfx.muted = settings.muted; saveSettings(settings); syncToggles(); });
motionBtn.addEventListener('click', () => { settings.reducedMotion = !settings.reducedMotion; saveSettings(settings); syncToggles(); });
if (__BUILD_MODE__ === 'preview') document.body.classList.add('preview');

resize(); syncToggles(); refreshBest(); syncCannonButtons(); syncFireButton(); show('title');
requestAnimationFrame(t => { lastFrame = t; requestAnimationFrame(frame); });
document.body.dataset.ready = '1';

if(import.meta.env.MODE==='qa')Object.defineProperty(window,'__GAME__',{get:()=>JSON.parse(JSON.stringify({id:'game061',phase,state,gameTime,fx:fx.length}))});
