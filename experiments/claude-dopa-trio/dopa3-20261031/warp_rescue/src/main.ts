import './style.css';
import {
  CLEAR_RESCUES, LANE_X, SENSOR_Y, WARP_MS, advanceTo, createState, dockFlipIn, dockOpen, drainEvents, endMs, podY, result,
  select, type GameEvent, type Mode, type State,
} from './model';
import { Sfx } from './audio';
import { CORAL, INK, MINT, buildSprites, type Sprites } from './art';
import { isPersistent, loadBest, loadSettings, saveBestIfHigher, saveSettings } from './storage';

declare const __BUILD_MODE__: 'preview' | 'native';

const L = 480;
const DOCK_Y = 364;
const SHIP_Y = 410;
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
let rejectFlash = { in: -1e9, out: -1e9 };

interface Fx { kind: 'pop' | 'boing' | 'text' | 'cutin' | 'cushion' | 'spark'; at: number; dur: number; x: number; y: number; text?: string; face?: number; vx?: number; vy?: number; color?: string }
let fx: Fx[] = [];
const shipSeats: { face: number; at: number }[] = [];
const MAX_PARTICLES = 240;
const faceOf = (id: string) => { const [w, j] = id.split('-').map(Number); return (w * 2 + j) % 3; };

function resize() {
  const wrap = $('stage-wrap');
  const size = Math.max(180, Math.floor(Math.min(wrap.clientWidth, wrap.clientHeight)));
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.style.width = `${size}px`; canvas.style.height = `${size}px`;
  canvas.width = Math.round(size * dpr); canvas.height = Math.round(size * dpr);
  sprites = buildSprites(Math.max(1, (size * dpr) / L));
}
window.addEventListener('resize', resize);

function inputTime(ts: number) {
  const now = performance.now();
  if (Math.abs(ts - now) > 1000) ts = now;
  return Math.round(gameTime + (Math.min(Math.max(ts, lastFrame), now) - lastFrame));
}
function choose(selector: 'in' | 'out', value: number, ts: number) {
  if (phase !== 'running') return;
  select(state, inputTime(ts), selector, value);
  handleEvents(drainEvents(state));
  syncSelectors();
}

// ---------- input ----------
canvas.addEventListener('pointerdown', e => { e.preventDefault(); if (phase === 'ready') beginClock(); });
canvas.addEventListener('contextmenu', e => e.preventDefault());
const keyMap: Record<string, ['in' | 'out', number]> = { q: ['in', 0], w: ['in', 1], e: ['in', 2], a: ['out', 0], s: ['out', 1], d: ['out', 2] };
window.addEventListener('keydown', e => {
  if (e.key === ' ' && (phase === 'ready' || phase === 'running')) e.preventDefault();
  if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') { if (phase === 'running') pause(); return; }
  if (e.repeat) return;
  if (phase === 'ready' && e.key === ' ') { beginClock(); return; }
  const m = keyMap[e.key.toLowerCase()];
  if (m) choose(m[0], m[1], e.timeStamp);
});
window.addEventListener('blur', () => { if (phase === 'running') pause(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && phase === 'running') pause(); });

/** Pointer-driven buttons act on pointerdown; `click` only for keyboard activation (detail === 0). */
function pressable(el: HTMLElement, fn: (ts: number) => void) {
  el.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse' && e.button !== 0) return; e.preventDefault(); fn(e.timeStamp); });
  el.addEventListener('click', e => { if (e.detail === 0) fn(e.timeStamp); });
}
const selButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-sel]'));
selButtons.forEach(b => pressable(b, ts => choose(b.dataset.sel as 'in' | 'out', Number(b.dataset.v), ts)));
function syncSelectors() {
  selButtons.forEach(b => b.setAttribute('aria-pressed', String((b.dataset.sel === 'in' ? state.inlet : state.outlet) === Number(b.dataset.v))));
}

// ---------- phases ----------
function show(id: string | null) {
  for (const el of document.querySelectorAll<HTMLElement>('.overlay')) el.hidden = el.id !== id;
  $('controls').classList.toggle('inactive', id !== null && id !== 'ready');
  (document.activeElement as HTMLElement | null)?.blur?.();
}
function startRun(m: Mode) {
  sfx.unlock();
  mode = m; state = createState(m); gameTime = 0; fx = []; shipSeats.length = 0; rejectFlash = { in: -1e9, out: -1e9 };
  phase = 'ready';
  $('mode-label').textContent = m === 'practice' ? '練習（2便・記録なし）' : '本番';
  syncSelectors();
  show('ready');
}
function beginClock() { phase = 'running'; lastFrame = performance.now(); show(null); }
function pause() { if (phase !== 'running') return; phase = 'paused'; sfx.suspend(); show('paused'); }
function resume() { if (phase !== 'paused') return; sfx.resume(); phase = 'running'; lastFrame = performance.now(); show(null); }
function endRun() {
  phase = 'result';
  const r = result(state);
  let isBest = false;
  if (mode === 'run') isBest = saveBestIfHigher({ score: r.score, rank: r.rank, at: new Date().toISOString() });
  if (r.cleared || mode === 'practice') sfx.fanfare(); else sfx.fail();
  const best = loadBest();
  $('result-title').textContent = mode === 'practice' ? '練習おわり' : r.rescued === r.total ? '全員、まとめて救助！' : r.cleared ? '救助任務クリア！' : `あと${CLEAR_RESCUES - r.rescued}体…（未達）`;
  $('result-rank').textContent = mode === 'practice' ? '-' : r.rank;
  const rows: [string, string][] = [
    ['SCORE', r.score.toLocaleString()],
    ['救助数', `${r.rescued}/${r.total}`],
    ['同じ便を完全救助', `${r.fullWaves}便`],
    ['同じ出口で5体', `${r.sameDockWaves}便`],
    ['最大連続', `${r.maxStreak}`],
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
      case 'select': if (ev.selector === 'in') sfx.inlet(); else sfx.outlet(); break;
      case 'reject': rejectFlash[ev.selector] = gameTime + 200; break;
      case 'warp': sfx.warp(); break;
      case 'cushion':
        sfx.boing();
        fx.push({ kind: 'cushion', at: ev.at, dur: 900, x: LANE_X[ev.lane], y: SENSOR_Y, face: faceOf(ev.id) });
        fx.push({ kind: 'text', at: ev.at, dur: 900, x: LANE_X[ev.lane], y: SENSOR_Y - 34, text: '通常便へ回送', color: '#6a7d96' });
        break;
      case 'rescue': {
        sfx.pop(ev.streak);
        const x = LANE_X[ev.dock];
        fx.push({ kind: 'pop', at: ev.at, dur: 350, x, y: DOCK_Y, face: faceOf(ev.id) });
        fx.push({ kind: 'text', at: ev.at, dur: 700, x, y: DOCK_Y - 36, text: `+${ev.points}`, color: '#0e8f74' });
        const n = settings.reducedMotion ? 2 : 6;
        for (let i = 0; i < n && fx.length < MAX_PARTICLES; i++) { const a = (i / n) * Math.PI * 2; fx.push({ kind: 'spark', at: ev.at, dur: 420, x, y: DOCK_Y, vx: Math.cos(a) * 120, vy: Math.sin(a) * 90 - 40, color: i % 2 ? MINT : CORAL }); }
        shipSeats.push({ face: faceOf(ev.id), at: ev.at });
        if (shipSeats.length > 10) shipSeats.shift();
        break;
      }
      case 'reroute':
        sfx.boing();
        fx.push({ kind: 'boing', at: ev.at, dur: 800, x: LANE_X[ev.dock], y: DOCK_Y, face: faceOf(ev.id) });
        fx.push({ kind: 'text', at: ev.at, dur: 900, x: LANE_X[ev.dock], y: DOCK_Y - 40, text: 'CLOSED→通常便へ', color: '#c4513f' });
        break;
      case 'wave':
        sfx.groupBonus(ev.sameDock);
        fx.push({ kind: 'text', at: ev.at + 120, dur: 1000, x: 240, y: 330, text: ev.sameDock ? '同じ出口で5体！ +500' : '便まるごと救助 +300', color: ev.sameDock ? '#e8665a' : '#0e8f74' });
        if (ev.sameDock) fx.push({ kind: 'cutin', at: ev.at + 150, dur: 900, x: 0, y: 0 });
        break;
      case 'end': phase = 'result'; window.setTimeout(endRun, 600); break;
    }
  }
}

// ---------- frame ----------
function frame(now: number) {
  if (phase === 'running') {
    const dt = Math.min(100, Math.max(0, now - lastFrame));
    lastFrame = now;
    gameTime = Math.min(gameTime + dt, endMs(mode));
    advanceTo(state, Math.round(gameTime));
    handleEvents(drainEvents(state));
  } else lastFrame = now;
  draw();
  requestAnimationFrame(frame);
}

function draw() {
  const s = canvas.width / L;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.drawImage(sprites.bg, 0, 0, canvas.width, canvas.height);
  g.setTransform(s, 0, 0, s, 0, 0);
  const t = gameTime;
  // lanes + inlet portals
  for (let i = 0; i < 3; i++) {
    const x = LANE_X[i], on = state.inlet === i;
    g.fillStyle = on ? 'rgba(63,217,176,0.16)' : 'rgba(33,50,74,0.05)'; g.fillRect(x - 34, 40, 68, SENSOR_Y - 40);
    g.strokeStyle = on ? MINT : 'rgba(33,50,74,0.25)'; g.lineWidth = on ? 6 : 3;
    g.beginPath(); g.ellipse(x, SENSOR_Y, 40, 12, 0, 0, Math.PI * 2); g.stroke();
    if (on) { g.strokeStyle = 'rgba(63,217,176,0.5)'; g.lineWidth = 2; g.beginPath(); g.ellipse(x, SENSOR_Y, 30 + 6 * Math.sin(t / 120), 8, 0, 0, Math.PI * 2); g.stroke(); }
    g.fillStyle = on ? '#0e8f74' : '#6a7d96'; g.font = 'bold 12px system-ui, sans-serif'; g.textAlign = 'center';
    g.fillText(on ? `入口${'QWE'[i]}・開` : `入口${'QWE'[i]}`, x, 56);
  }
  // warp routes for capsules in flight (inlet → fixed outlet)
  for (const p of state.pods) {
    if (p.status !== 'warping') continue;
    const k = Math.max(0, Math.min(1, (t - p.tin) / WARP_MS));
    const x0 = LANE_X[p.lane], x1 = LANE_X[p.outlet!];
    g.strokeStyle = 'rgba(63,217,176,0.45)'; g.lineWidth = 3; g.setLineDash([5, 5]);
    g.beginPath(); g.moveTo(x0, SENSOR_Y); g.quadraticCurveTo((x0 + x1) / 2, SENSOR_Y + 70, x1, DOCK_Y); g.stroke(); g.setLineDash([]);
    const u = 1 - k;
    const px = u * u * x0 + 2 * u * k * ((x0 + x1) / 2) + k * k * x1, py = u * u * SENSOR_Y + 2 * u * k * (SENSOR_Y + 70) + k * k * DOCK_Y;
    g.globalAlpha = 0.85; g.drawImage(sprites.capsules[faceOf(p.id)], px - 14, py - 17, 28, 33); g.globalAlpha = 1;
    // arrival marker on the target dock
    g.strokeStyle = dockOpen(p.outlet!, p.arriveAt!) ? MINT : CORAL; g.lineWidth = 2; g.beginPath(); g.arc(x1, DOCK_Y, 34 - 10 * k, 0, Math.PI * 2); g.stroke();
  }
  // falling capsules (visual interpolation of the timetable)
  for (const p of state.pods) {
    if (p.status !== 'falling') continue;
    const y = podY(p, t);
    if (y < 30) continue;
    g.drawImage(sprites.capsules[faceOf(p.id)], LANE_X[p.lane] - 22, y - 46, 44, 52);
  }
  drawDocks(t);
  drawShip(t);
  drawFx(t);
  drawHud(t);
}

function drawDocks(t: number) {
  for (let i = 0; i < 3; i++) {
    const x = LANE_X[i], open = dockOpen(i, t), sel = state.outlet === i;
    const arrive = dockOpen(i, t + WARP_MS);
    g.fillStyle = sel ? 'rgba(255,122,107,0.18)' : 'rgba(255,255,255,0.75)'; g.fillRect(x - 56, DOCK_Y - 30, 112, 66);
    g.strokeStyle = sel ? CORAL : 'rgba(33,50,74,0.3)'; g.lineWidth = sel ? 4 : 2; g.strokeRect(x - 56, DOCK_Y - 30, 112, 66);
    g.fillStyle = sel ? '#c4513f' : '#6a7d96'; g.font = 'bold 10px system-ui, sans-serif'; g.textAlign = 'left';
    g.fillText(`出口${'ASD'[i]}`, x - 52, DOCK_Y - 19);
    // gate: two doors slide open — the drawn opening matches the logical OPEN window
    const gap = open ? 18 : 0;
    g.fillStyle = open ? MINT : CORAL;
    g.fillRect(x - 22 - gap, DOCK_Y - 26, 22, 26); g.fillRect(x + gap, DOCK_Y - 26, 22, 26);
    g.fillStyle = open ? '#0b2a22' : '#fff'; g.font = 'bold 11px system-ui, sans-serif'; g.textAlign = 'center';
    g.fillText(open ? 'OPEN' : 'CLOSED', x, DOCK_Y - 9);
    // the 0.45 s-ahead forecast is a separate, labelled line from the current state
    g.fillStyle = arrive ? '#0e8f74' : '#c4513f'; g.font = 'bold 12px system-ui, sans-serif';
    g.fillText(`到着時 ${arrive ? '○開' : '×閉'}`, x, DOCK_Y + 14);
    g.fillStyle = INK; g.font = 'bold 10px system-ui, sans-serif';
    g.fillText(`今:${open ? '開' : '閉'} ${open ? '閉まる' : '開く'}まで${(dockFlipIn(i, t) / 1000).toFixed(1)}s`, x, DOCK_Y + 29);
  }
}

function drawShip(t: number) {
  g.drawImage(sprites.ship, 0, SHIP_Y, L, 70);
  const seats = 10;
  for (let i = 0; i < seats; i++) {
    const x = 70 + i * 36, y = SHIP_Y + 32;
    g.fillStyle = 'rgba(159,216,232,0.55)'; g.beginPath(); g.arc(x, y, 13, 0, Math.PI * 2); g.fill();
    const seat = shipSeats[i];
    if (seat) {
      const wave = Math.sin((t - seat.at) / 160) * 2;
      g.drawImage(sprites.capsules[seat.face], x - 11, y - 15 + wave, 22, 26);
    }
  }
}

function drawFx(t: number) {
  fx = fx.filter(f => t < f.at + f.dur);
  for (const f of fx) {
    const age = t - f.at; if (age < 0) continue;
    const k = age / f.dur;
    if (f.kind === 'pop') {
      g.globalAlpha = 1 - k; g.strokeStyle = MINT; g.lineWidth = 4; g.beginPath(); g.arc(f.x, f.y, 12 + k * 30, 0, Math.PI * 2); g.stroke(); g.globalAlpha = 1;
      g.drawImage(sprites.capsules[f.face ?? 0], f.x - 16, f.y - 20 + k * 60, 32, 38);
    } else if (f.kind === 'boing' || f.kind === 'cushion') {
      const dir = f.x < 240 ? -1 : 1;
      const x = f.x + dir * k * 70, y = f.y - Math.sin(k * Math.PI) * 50 + k * 30;
      g.globalAlpha = 1 - k * 0.6;
      g.fillStyle = '#ffd9a8'; g.beginPath(); g.ellipse(f.x + dir * 70, f.y + 46, 26, 8, 0, 0, Math.PI * 2); g.fill();
      g.drawImage(sprites.capsules[f.face ?? 0], x - 16, y - 20, 32, 38);
      g.globalAlpha = 1;
    } else if (f.kind === 'spark') {
      const s = age / 1000; g.globalAlpha = 1 - k; g.fillStyle = f.color ?? MINT;
      g.beginPath(); g.arc(f.x + (f.vx ?? 0) * s, f.y + (f.vy ?? 0) * s + 200 * s * s, 3, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1;
    } else if (f.kind === 'text') {
      g.globalAlpha = 1 - k * k; g.font = 'bold 16px system-ui, sans-serif'; g.textAlign = 'center';
      g.strokeStyle = 'rgba(255,255,255,0.95)'; g.lineWidth = 4; g.strokeText(f.text ?? '', f.x, f.y - k * 18);
      g.fillStyle = f.color ?? INK; g.fillText(f.text ?? '', f.x, f.y - k * 18); g.globalAlpha = 1;
    } else if (f.kind === 'cutin') {
      const slide = Math.min(1, age / 120), fade = k > 0.7 ? 1 - (k - 0.7) / 0.3 : 1;
      g.globalAlpha = fade;
      const x = -300 + slide * 300;
      g.fillStyle = 'rgba(255,255,255,0.95)'; g.fillRect(x, 120, 300, 86);
      g.fillStyle = MINT; g.fillRect(x, 120, 300, 4); g.fillStyle = CORAL; g.fillRect(x, 202, 300, 4);
      g.drawImage(sprites.controllerCheer, x + 4, 116, 90, 90);
      g.fillStyle = '#e8665a'; g.font = '900 22px system-ui, sans-serif'; g.textAlign = 'left'; g.fillText('団体さま、到着！', x + 100, 160);
      g.fillStyle = INK; g.font = 'bold 12px system-ui, sans-serif'; g.fillText('同じ便が窓に並びました', x + 102, 184);
      g.globalAlpha = 1;
    }
  }
}

function drawHud(t: number) {
  g.fillStyle = 'rgba(255,255,255,0.92)'; g.fillRect(0, 0, L, 38);
  g.fillStyle = INK; g.font = 'bold 16px system-ui, sans-serif'; g.textAlign = 'left';
  g.fillText(`SCORE ${state.score.toLocaleString()}`, 10, 26);
  g.textAlign = 'center';
  g.fillText(`${(Math.max(0, endMs(mode) - t) / 1000).toFixed(1)}s`, 214, 26);
  g.fillStyle = '#0e8f74'; g.fillText(`救助 ${state.rescued}/${state.pods.length}`, 312, 26);
  g.textAlign = 'right'; g.fillStyle = '#e8665a'; g.fillText(`連続 ${state.streak}`, 470, 26);
  if (mode === 'run') {
    const k = Math.min(1, state.rescued / CLEAR_RESCUES);
    g.fillStyle = 'rgba(33,50,74,0.12)'; g.fillRect(0, 38, L, 4); g.fillStyle = MINT; g.fillRect(0, 38, L * k, 4);
  }
  g.drawImage(sprites.controller, 2, 44, 56, 56);
  if (t < rejectFlash.in || t < rejectFlash.out) { g.fillStyle = '#c4513f'; g.font = 'bold 12px system-ui, sans-serif'; g.textAlign = 'left'; g.fillText('切替が速すぎます', 62, 80); }
  if (phase === 'running' && t < 3000 && mode === 'run') {
    g.fillStyle = INK; g.font = 'bold 12px system-ui, sans-serif'; g.textAlign = 'left';
    g.fillText('入口を合わせて拾い、0.45秒後に開いている出口へ', 62, 66);
  }
}

// ---------- wiring ----------
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

resize(); syncToggles(); refreshBest(); syncSelectors(); show('title');
requestAnimationFrame(t => { lastFrame = t; requestAnimationFrame(frame); });
document.body.dataset.ready = '1';
