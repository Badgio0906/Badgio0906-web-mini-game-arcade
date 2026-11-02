import './style.css';
import {
  BLAST_R, BOSS_R, BOX, DRONE_R, FIELD_BOTTOM, FIELD_TOP, FORMATIONS, FORMATION_ACTIVE_MS, FORMATION_MS, LOGICAL, PENDING_MS,
  COOLDOWN_MS, BOSS_START_MS, BOSS_HP, advanceTo, bossActive, bossPos, createState, currentRound, drainEvents,
  dronePosAt, reserve, result, runEndMs, type GameEvent, type Mode, type State,
} from './model';
import { Sfx } from './audio';
import { loadHudPortrait, buildSprites, type Sprites } from './art';
import { isPersistent, loadBest, loadSettings, saveBestIfHigher, saveSettings } from './storage';

declare const __BUILD_MODE__: 'preview' | 'native';

type Phase = 'title' | 'ready' | 'running' | 'paused' | 'result' | 'exited';
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const canvas = $<HTMLCanvasElement>('stage');
const g = canvas.getContext('2d')!;
const sfx = new Sfx();
const settings = loadSettings();
sfx.muted = settings.muted;

await loadHudPortrait();
let sprites: Sprites;
let dpr = 1;
let phase: Phase = 'title';
let mode: Mode = 'run';
let state: State = createState('run');
let gameTime = 0;
let lastFrame = 0;
let cursor = { x: 240, y: 230, visible: false };
const held = new Set<string>();

interface Fx { kind: 'bolt' | 'ring' | 'spark' | 'text' | 'cutin' | 'pop'; x: number; y: number; at: number; dur: number; n?: number; text?: string; seed?: number; vx?: number; vy?: number; color?: string }
let fx: Fx[] = [];
const MAX_PARTICLES = 240;

// ---------- layout ----------
function resize() {
  const wrap = $('stage-wrap');
  const size = Math.max(200, Math.floor(Math.min(wrap.clientWidth, wrap.clientHeight)));
  dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.style.width = `${size}px`;
  canvas.style.height = `${size}px`;
  canvas.width = Math.round(size * dpr);
  canvas.height = Math.round(size * dpr);
  sprites = buildSprites(Math.max(1, (size * dpr) / LOGICAL));
}
window.addEventListener('resize', resize);

function toLogical(clientX: number, clientY: number) {
  const r = canvas.getBoundingClientRect();
  return { x: ((clientX - r.left) / r.width) * LOGICAL, y: ((clientY - r.top) / r.height) * LOGICAL };
}

// ---------- clock / input timing ----------
/** Converts an input event's timestamp into game time without letting it precede already-simulated time. */
function inputTime(ts: number) {
  const now = performance.now();
  if (Math.abs(ts - now) > 1000) ts = now; // event clock on a different timebase: fall back to handler time
  const clamped = Math.min(Math.max(ts, lastFrame), now);
  return Math.round(gameTime + (clamped - lastFrame));
}

function tryReserve(x: number, y: number, ts: number) {
  if (phase !== 'running') return;
  const t = inputTime(ts);
  reserve(state, t, x, y);
  handleEvents(drainEvents(state));
}

canvas.addEventListener('pointerdown', e => {
  e.preventDefault();
  if (phase === 'ready') { beginClock(); return; }
  if (phase !== 'running') return; // start/resume gestures happen on other elements and never reach here
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  const p = toLogical(e.clientX, e.clientY);
  cursor = { x: p.x, y: p.y, visible: false };
  tryReserve(p.x, p.y, e.timeStamp);
});
canvas.addEventListener('contextmenu', e => e.preventDefault());

window.addEventListener('keydown', e => {
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key) && (phase === 'running' || phase === 'ready')) e.preventDefault();
  if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') { if (phase === 'running') pause(); return; }
  if (e.repeat) return;
  if (e.key.startsWith('Arrow')) { held.add(e.key); cursor.visible = true; }
  if (e.key === ' ') {
    if (phase === 'ready') { beginClock(); return; }
    if (phase === 'running') { cursor.visible = true; tryReserve(cursor.x, cursor.y, e.timeStamp); }
  }
});
window.addEventListener('keyup', e => held.delete(e.key));
window.addEventListener('blur', () => { held.clear(); if (phase === 'running') pause(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && phase === 'running') pause(); });
canvas.addEventListener('pointercancel', () => { if (phase === 'running') pause(); });

// ---------- phases ----------
function show(id: string | null) {
  for (const el of document.querySelectorAll<HTMLElement>('.overlay')) el.hidden = el.id !== id;
  (document.activeElement as HTMLElement | null)?.blur?.();
}

function startRun(m: Mode) {
  sfx.stop();
  sfx.unlock();
  mode = m;
  state = createState(m);
  gameTime = 0;
  fx = [];
  held.clear();
  cursor = { x: 240, y: 230, visible: false };
  phase = 'ready';
  $('mode-label').textContent = m === 'practice' ? '練習（記録なし）' : '本番';
  show('ready');
}

/** The gesture that starts the clock is consumed here and is never a reservation. */
function beginClock() {
  sfx.unlock();
  phase = 'running';
  lastFrame = performance.now();
  show(null);
}

function pause() {
  if (phase !== 'running') return;
  phase = 'paused';
  held.clear();
  sfx.suspend();
  show('paused');
}

function resume() {
  if (phase !== 'paused') return;
  sfx.resume();
  phase = 'running';
  lastFrame = performance.now();
  show(null);
}

function endRun() {
  phase = 'result';
  const r = result(state);

  let isBest = false;
  if (mode === 'run') isBest = saveBestIfHigher({ score: r.score, rank: r.rank, maxOneShot: r.maxOneShot, at: new Date().toISOString() });
  if (r.cleared) sfx.fanfare(); else if (mode === 'run') sfx.fail();
  const best = loadBest();
  const title = mode === 'practice' ? '練習おわり' : r.cleared ? '定刻どおり、倉庫まで処理！' : r.reason === 'shield' ? 'シールド切れ…' : '時間切れ…';
  $('result-title').textContent = title;
  $('result-rank').textContent = mode === 'practice' ? '-' : r.rank;
  $('result-body').innerHTML = [
    ['SCORE', r.score.toLocaleString()],
    ['最大一撃', `${r.maxOneShot}機`],
    ['6機一撃', `${r.sixShots}回`],
    ['雷の予約数', `${r.thunderCount}本`],
    ['編隊防衛', `${r.formationSuccess}/${mode === 'run' ? 8 : 3}`],
    ...(mode === 'run' ? [['ボス', r.bossDefeated ? '撃破' : '未撃破'], ['BEST', `${(best?.score ?? 0).toLocaleString()}${isBest ? '（更新！）' : ''}`]] : [['記録', '練習は保存しません']]),
  ].map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
  $('result-best-note').hidden = isPersistent();
  show('result');
  refreshBest();
}

function exitPreview() {
  phase = 'exited';
  sfx.close();
  show('exited');
}

function refreshBest() {
  const b = loadBest();
  $('title-best').textContent = b ? `BEST ${b.score.toLocaleString()}（${b.rank}）` : 'BEST —';
  $('storage-note').hidden = isPersistent();
}

// ---------- events → sound / fx ----------
function handleEvents(events: GameEvent[]) {
  for (const ev of events) {
    switch (ev.type) {
      case 'reserve': sfx.reserve(); break;
      case 'reject': sfx.reject(); flashSlots(); break;
      case 'slot-ready': sfx.slotReady(); break;
      case 'impact': {
        if (ev.kills.length || ev.bossHit) sfx.thunder(ev.kills.length); else sfx.miss();
        pushFx({ kind: 'bolt', x: ev.x, y: ev.y, at: ev.at, dur: 260, seed: ev.id, n: ev.kills.length });
        pushFx({ kind: 'ring', x: ev.x, y: ev.y, at: ev.at, dur: ev.kills.length >= 6 ? 520 : 320, n: ev.kills.length });
        ev.kills.forEach((k, i) => {
          const delay = i * 60; // visual stagger only; logical kills were all decided at impact time
          pushFx({ kind: 'pop', x: k.x, y: k.y, at: ev.at + delay, dur: 300 });
          const sparks = settings.reducedMotion ? 3 : 8;
          for (let j = 0; j < sparks; j++) {
            const a = (j / sparks) * Math.PI * 2 + i;
            pushFx({ kind: 'spark', x: k.x, y: k.y, at: ev.at + delay, dur: 420, vx: Math.cos(a) * 160, vy: Math.sin(a) * 160 - 40, color: j % 2 ? '#ffc531' : '#bfe9ff' });
          }
        });
        if (ev.points > 0) pushFx({ kind: 'text', x: ev.x, y: ev.y - 20, at: ev.at, dur: 800, text: `+${ev.points}${ev.kills.length > 1 ? ` ×${ev.kills.length}` : ''}` });
        if (ev.kills.length >= 6) pushFx({ kind: 'cutin', x: 0, y: 0, at: ev.at, dur: 1100 });
        break;
      }
      case 'formation': if (!ev.success && mode === 'run') pushFx({ kind: 'text', x: 240, y: 90, at: ev.at, dur: 900, text: `防衛失敗 ${ev.kills}/6`, color: '#ff8a8a' }); break;
      case 'shield': sfx.shield(); break;
      case 'boss-hit': sfx.bossHit(); pushFx({ kind: 'text', x: bossPos(ev.at).x, y: 110, at: ev.at, dur: 700, text: `HIT 残り${ev.hp}` }); break;
      case 'boss-down': pushFx({ kind: 'cutin', x: 0, y: 0, at: ev.at, dur: 1100 }); break;
      case 'end': window.setTimeout(endRun, 700); phase = 'result'; break;
    }
  }
}
function pushFx(f: Fx) {
  if (f.kind === 'spark' && fx.filter(x => x.kind === 'spark').length >= MAX_PARTICLES) return;
  fx.push(f);
}
let slotFlashUntil = 0;
function flashSlots() { slotFlashUntil = gameTime + 250; }

// ---------- frame ----------
function frame(now: number) {
  if (phase === 'running') {
    const dt = Math.min(100, Math.max(0, now - lastFrame)); // no large dt injection after stalls
    lastFrame = now;
    const step = dt / 1000;
    const kx = (held.has('ArrowRight') ? 1 : 0) - (held.has('ArrowLeft') ? 1 : 0);
    const ky = (held.has('ArrowDown') ? 1 : 0) - (held.has('ArrowUp') ? 1 : 0);
    cursor.x = Math.min(LOGICAL, Math.max(0, cursor.x + kx * 300 * step));
    cursor.y = Math.min(FIELD_BOTTOM, Math.max(FIELD_TOP, cursor.y + ky * 300 * step));
    gameTime = Math.min(gameTime + dt, runEndMs(mode));
    advanceTo(state, Math.round(gameTime));
    handleEvents(drainEvents(state));
  } else {
    lastFrame = now;
  }
  draw();
  requestAnimationFrame(frame);
}

function draw() {
  const s = canvas.width / LOGICAL;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.drawImage(sprites.bg, 0, 0, canvas.width, canvas.height);
  g.setTransform(s, 0, 0, s, 0, 0);
  const t = state.t;
  // reflection walls
  g.strokeStyle = 'rgba(56,224,255,0.35)'; g.setLineDash([6, 6]); g.lineWidth = 1.5;
  g.strokeRect(BOX.minX - DRONE_R, BOX.minY - DRONE_R, BOX.maxX - BOX.minX + DRONE_R * 2, BOX.maxY - BOX.minY + DRONE_R * 2);
  g.setLineDash([]);
  drawEnemies(t);
  drawReservations(t);
  drawFx(t);
  if (cursor.visible && (phase === 'running' || phase === 'ready')) {
    g.strokeStyle = '#ffc531'; g.lineWidth = 2;
    g.beginPath(); g.arc(cursor.x, cursor.y, BLAST_R, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.moveTo(cursor.x - 10, cursor.y); g.lineTo(cursor.x + 10, cursor.y); g.moveTo(cursor.x, cursor.y - 10); g.lineTo(cursor.x, cursor.y + 10); g.stroke();
  }
  drawHud(t);
}

function drawEnemies(t: number) {
  const round = currentRound(state, t);
  if (round >= 0) {
    const run = state.runs[round];
    const local = t - run.start;
    for (const d of state.drones) {
      if (d.round !== round || !d.alive) continue;
      const p = dronePosAt(state, d, t);
      const exiting = local > FORMATION_ACTIVE_MS;
      g.globalAlpha = exiting ? Math.max(0, 1 - (local - FORMATION_ACTIVE_MS) / 500) : 1;
      const ex = exiting ? (local - FORMATION_ACTIVE_MS) * 0.3 : 0;
      // heading arrow (direction only, never the future answer)
      const q = dronePosAt(state, d, t + 120);
      const dx = q.x - p.x, dy = q.y - p.y, len = Math.hypot(dx, dy) || 1;
      if (!exiting) {
        g.strokeStyle = 'rgba(255,197,49,0.85)'; g.lineWidth = 2;
        g.beginPath(); g.moveTo(p.x + (dx / len) * 16, p.y + (dy / len) * 16); g.lineTo(p.x + (dx / len) * 26, p.y + (dy / len) * 26); g.stroke();
      }
      g.drawImage(sprites.drone, p.x - 20, p.y - 20 - ex, 40, 40);
      g.globalAlpha = 1;
    }
    if (local > FORMATION_ACTIVE_MS && local < FORMATION_MS) {
      g.fillStyle = 'rgba(255,255,255,0.8)'; g.font = 'bold 14px system-ui, sans-serif'; g.textAlign = 'center';
      g.fillText('残存機は退場（加点なし）', 240, 72);
    }
    // countdown to this formation's decision
    if (local <= FORMATION_ACTIVE_MS) {
      const w = 120 * (1 - local / FORMATION_ACTIVE_MS);
      g.fillStyle = 'rgba(255,255,255,0.2)'; g.fillRect(180, 54, 120, 5);
      g.fillStyle = run.kills >= 3 ? '#5dffb0' : '#ffc531'; g.fillRect(180, 54, w, 5);
      g.font = 'bold 12px system-ui, sans-serif'; g.textAlign = 'center'; g.fillStyle = '#fff';
      g.fillText(`編隊${run.round + 1} ${FORMATIONS[run.formation].name}  撃破${run.kills}/6（3機で防衛）`, 240, 72);
    }
  }
  if (bossActive(state, t) || (state.boss.defeated && t < (state.ended?.at ?? 0) + 600)) {
    const b = bossPos(t);
    const shielded = t < state.boss.shieldUntil;
    g.drawImage(state.boss.hp < BOSS_HP ? sprites.bossDamaged : sprites.boss, b.x - 45, b.y - 48, 90, 90);
    if (shielded) { g.strokeStyle = 'rgba(120,240,255,0.9)'; g.lineWidth = 3; g.beginPath(); g.arc(b.x, b.y, BOSS_R + 10, 0, Math.PI * 2); g.stroke(); }
    g.fillStyle = '#fff'; g.font = 'bold 13px system-ui, sans-serif'; g.textAlign = 'center';
    g.fillText(`雷避け倉庫 HP ${'■'.repeat(state.boss.hp)}${'□'.repeat(BOSS_HP - state.boss.hp)}${shielded ? ' シールド中' : ''}`, 240, 78);
    // horizontal swing rail
    g.strokeStyle = 'rgba(255,255,255,0.25)'; g.beginPath(); g.moveTo(140, 160); g.lineTo(340, 160); g.stroke();
  }
}

function drawReservations(t: number) {
  for (const r of state.reservations) {
    if (r.resolved) continue;
    const left = r.impactAt - t;
    const k = Math.max(0, Math.min(1, left / PENDING_MS));
    g.strokeStyle = 'rgba(255,230,120,0.95)'; g.lineWidth = 1.5; g.setLineDash([4, 4]);
    g.beginPath(); g.arc(r.x, r.y, BLAST_R, 0, Math.PI * 2); g.stroke(); g.setLineDash([]);
    g.strokeStyle = 'rgba(56,224,255,0.95)'; g.lineWidth = 3;
    g.beginPath(); g.arc(r.x, r.y, BLAST_R * k + 4, 0, Math.PI * 2); g.stroke();
    g.fillStyle = '#ffe680'; g.font = 'bold 12px system-ui, sans-serif'; g.textAlign = 'center';
    g.fillText(`${(left / 1000).toFixed(1)}`, r.x, r.y + 4);
  }
}

function boltPath(x: number, y: number, seed: number) {
  const pts: [number, number][] = [[x + ((seed * 37) % 40) - 20, 0]];
  let a = seed * 9301 + 49297;
  for (let i = 1; i < 9; i++) { a = (a * 9301 + 49297) % 233280; pts.push([x + ((a / 233280) - 0.5) * 50 * (1 - i / 9), (y * i) / 9]); }
  pts.push([x, y]);
  return pts;
}

function drawFx(t: number) {
  fx = fx.filter(f => t < f.at + f.dur);
  for (const f of fx) {
    const age = t - f.at;
    if (age < 0) continue;
    const k = age / f.dur;
    if (f.kind === 'bolt') {
      const pts = boltPath(f.x, f.y, f.seed ?? 1);
      for (const [w, c] of [[10, 'rgba(56,224,255,0.35)'], [4, '#bff4ff'], [1.5, '#ffffff']] as const) {
        g.strokeStyle = c; g.lineWidth = w * (1 - k * 0.6); g.globalAlpha = 1 - k;
        g.beginPath(); pts.forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py))); g.stroke();
      }
      g.globalAlpha = 1;
    } else if (f.kind === 'ring') {
      const big = (f.n ?? 0) >= 6;
      g.strokeStyle = big ? `rgba(255,197,49,${1 - k})` : `rgba(160,230,255,${1 - k})`;
      g.lineWidth = big ? 8 * (1 - k) + 1 : 3;
      g.beginPath(); g.arc(f.x, f.y, BLAST_R * (0.4 + k * (big ? 1.4 : 0.8)), 0, Math.PI * 2); g.stroke();
      if (big && !settings.reducedMotion) { g.strokeStyle = `rgba(56,224,255,${0.8 - k * 0.8})`; g.lineWidth = 3; g.beginPath(); g.arc(f.x, f.y, BLAST_R * (0.2 + k * 2), 0, Math.PI * 2); g.stroke(); }
    } else if (f.kind === 'pop') {
      g.fillStyle = `rgba(255,240,200,${1 - k})`; g.beginPath(); g.arc(f.x, f.y, 6 + k * 18, 0, Math.PI * 2); g.fill();
    } else if (f.kind === 'spark') {
      const s = age / 1000;
      g.fillStyle = f.color ?? '#fff'; g.globalAlpha = 1 - k;
      g.fillRect(f.x + (f.vx ?? 0) * s - 2, f.y + (f.vy ?? 0) * s + 200 * s * s - 2, 4, 4);
      g.globalAlpha = 1;
    } else if (f.kind === 'text') {
      g.fillStyle = f.color ?? '#ffe680'; g.globalAlpha = 1 - k * k; g.font = 'bold 18px system-ui, sans-serif'; g.textAlign = 'center';
      g.strokeStyle = 'rgba(10,15,50,0.85)'; g.lineWidth = 4; g.strokeText(f.text ?? '', f.x, f.y - k * 24); g.fillText(f.text ?? '', f.x, f.y - k * 24);
      g.globalAlpha = 1;
    } else if (f.kind === 'cutin') {
      const slide = Math.min(1, age / 140);
      const fade = k > 0.75 ? 1 - (k - 0.75) / 0.25 : 1;
      g.globalAlpha = fade;
      const x = -200 + slide * 200;
      g.fillStyle = 'rgba(20,30,90,0.92)'; g.fillRect(x, 300, 300, 96);
      g.fillStyle = '#ffc531'; g.fillRect(x, 300, 300, 4); g.fillRect(x, 392, 300, 4);
      g.drawImage(sprites.heroSmug, x + 4, 300, 96, 96);
      g.fillStyle = '#fff'; g.font = 'bold 20px system-ui, sans-serif'; g.textAlign = 'left';
      g.fillText('着弾、定刻です。', x + 106, 342);
      g.fillStyle = '#7fe9ff'; g.font = 'bold 14px system-ui, sans-serif';
      g.fillText(state.boss.defeated ? '倉庫ごと、処理完了。' : '6機まとめて処理しました', x + 106, 368);
      g.globalAlpha = 1;
    }
  }
}

function drawHud(t: number) {
  g.fillStyle = 'rgba(8,12,40,0.86)'; g.fillRect(0, 0, LOGICAL, FIELD_TOP); g.fillRect(0, FIELD_BOTTOM, LOGICAL, LOGICAL - FIELD_BOTTOM);
  g.fillStyle = '#fff'; g.font = 'bold 18px system-ui, sans-serif'; g.textAlign = 'left';
  g.fillText(`SCORE ${state.score.toLocaleString()}`, 12, 31);
  g.textAlign = 'center';
  const remain = Math.max(0, runEndMs(mode) - t) / 1000;
  g.fillText(`${remain.toFixed(1)}s`, 260, 31);
  g.textAlign = 'right';
  g.fillStyle = '#7fe9ff';
  g.fillText(mode === 'run' ? `SHIELD ${'◆'.repeat(Math.max(0, state.shield))}${'◇'.repeat(Math.max(0, 3 - state.shield))}` : '練習', 470, 31);
  // hero + slots in the bottom strip (outside the battlefield)
  g.drawImage(sprites.heroNormal, 4, FIELD_BOTTOM - 10, 84, 84);
  g.textAlign = 'left'; g.font = 'bold 12px system-ui, sans-serif'; g.fillStyle = '#cfe0ff';
  g.fillText('予約枠', 98, FIELD_BOTTOM + 18);
  state.slots.forEach((sl, i) => {
    const x = 100 + i * 96, y = FIELD_BOTTOM + 26, w = 86, h = 34;
    const flash = t < slotFlashUntil;
    g.fillStyle = sl.state === 'ready' ? '#1d6f8f' : sl.state === 'pending' ? '#6f5a12' : '#2a2f55';
    g.fillRect(x, y, w, h);
    g.strokeStyle = flash ? '#ff7a7a' : sl.state === 'ready' ? '#38e0ff' : '#5560a0'; g.lineWidth = 2; g.strokeRect(x, y, w, h);
    let label = 'READY', fill = 1;
    if (sl.state === 'pending') { label = `着弾 ${(Math.max(0, sl.until - t) / 1000).toFixed(1)}`; fill = 1 - (sl.until - t) / PENDING_MS; }
    if (sl.state === 'cooldown') { label = `充電 ${(Math.max(0, sl.until - t) / 1000).toFixed(1)}`; fill = 1 - (sl.until - t) / COOLDOWN_MS; }
    if (sl.state !== 'ready') { g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(x, y + h - 5, w * Math.max(0, Math.min(1, fill)), 5); }
    g.fillStyle = '#fff'; g.font = 'bold 13px system-ui, sans-serif'; g.textAlign = 'center';
    g.fillText(label, x + w / 2, y + 22);
  });
  if (phase === 'running' && t < 2600 && mode === 'run' && !fx.some(f => f.kind === 'cutin')) {
    g.fillStyle = 'rgba(255,255,255,0.85)'; g.font = 'bold 13px system-ui, sans-serif'; g.textAlign = 'center';
    g.fillText('0.9秒後に敵が来る場所をタップ', 240, 395);
  }
  if (t >= BOSS_START_MS - 1500 && t < BOSS_START_MS && mode === 'run') {
    g.fillStyle = '#ffc531'; g.font = 'bold 22px system-ui, sans-serif'; g.textAlign = 'center';
    g.fillText('警告：雷避け倉庫 接近', 240, 230);
  }
}

// ---------- wiring ----------
function bind(id: string, fn: (e: MouseEvent) => void) { $(id).addEventListener('click', fn); }
bind('btn-play', () => startRun('run'));
bind('btn-practice', () => startRun('practice'));
bind('btn-howto', () => show('howto'));
bind('btn-howto-back', () => show('title'));
bind('btn-pause', () => pause());
bind('btn-resume', () => resume());
bind('btn-quit', () => { sfx.suspend(); phase = 'title'; show('title'); refreshBest(); });
bind('btn-retry', () => startRun(mode));
bind('btn-to-title', () => { sfx.suspend(); phase = 'title'; show('title'); refreshBest(); });
window.addEventListener('pagehide', () => sfx.suspend());
window.addEventListener('blur', () => sfx.suspend());
document.addEventListener('visibilitychange', () => { if (document.hidden) sfx.suspend(); });
for (const id of ['btn-exit', 'btn-exit-2']) bind(id, () => exitPreview());
const muteBtn = $<HTMLButtonElement>('btn-mute');
const motionBtn = $<HTMLButtonElement>('btn-motion');
function syncToggles() {
  muteBtn.textContent = settings.muted ? '音：OFF' : '音：ON';
  muteBtn.setAttribute('aria-pressed', String(settings.muted));
  motionBtn.textContent = settings.reducedMotion ? '演出軽減：ON' : '演出軽減：OFF';
  motionBtn.setAttribute('aria-pressed', String(settings.reducedMotion));
}
muteBtn.addEventListener('click', () => { settings.muted = !settings.muted; sfx.muted = settings.muted; saveSettings(settings); syncToggles(); });
motionBtn.addEventListener('click', () => { settings.reducedMotion = !settings.reducedMotion; saveSettings(settings); syncToggles(); });
if (__BUILD_MODE__ === 'preview') document.body.classList.add('preview');

resize();
syncToggles();
refreshBest();
show('title');
requestAnimationFrame(t => { lastFrame = t; requestAnimationFrame(frame); });
document.body.dataset.ready = '1';

if(import.meta.env.MODE==='qa')Object.defineProperty(window,'__GAME__',{get:()=>JSON.parse(JSON.stringify({id:'game060',phase,state,gameTime,fx:fx.length}))});
