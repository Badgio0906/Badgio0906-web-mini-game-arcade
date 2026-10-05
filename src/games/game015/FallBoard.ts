import { FallRun } from './FallRun';
import { drawBackdrop, drawBitmapText, drawKing, drawPlatform, drawSpikeFloor, drawWallNeedle, drawBird, PALETTE, KING_ANCHOR } from './art';
import { WORLD_WIDTH, WORLD_HEIGHT, type FallController, type FallEvent, type FallHooks, type FallSnapshot, type HorizontalInput, SCROLL_TOP_LIMIT } from './types';
import type { PracticeSnapshot } from '../../arcade/PracticeSession';

function paint(canvas: HTMLCanvasElement, s: FallSnapshot, best: number, seconds: number, feedback: string, feedbackUntil: number, dropUntil: number): void {
  const c = canvas.getContext('2d')!; c.imageSmoothingEnabled = false; c.setTransform(1, 0, 0, 1, 0, 0);
  const biome = s.depth < 250 ? 'tower' : s.depth < 500 ? 'works' : s.depth < 1000 ? 'cave' : 'strange';
  drawBackdrop(c, biome, { scrollY: Math.floor(s.cameraY) });
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const shock = reduceMotion ? 0 : s.phase === 'stunned' ? Math.floor(seconds * 35) % 3 - 1 : s.phase === 'ended' && seconds < feedbackUntil ? Math.floor(seconds * 30) % 3 - 1 : 0;
  c.save(); c.translate(shock, 0);
  for (const p of s.platforms) { const y = Math.floor(p.y - s.cameraY); if (!p.gone && y > -16 && y < WORLD_HEIGHT) drawPlatform(c, { x: Math.round(p.x), y, width: Math.round(p.width), height: p.height, type: p.type, phase: p.crumbleAge === null ? 0 : Math.min(2, Math.floor(p.crumbleAge * 2.4)) }); }
  for (const h of s.hazards) {
    const y = Math.round(h.y - s.cameraY); if (y + h.height < 58 || y > WORLD_HEIGHT) continue;
    if (h.kind === 'spikes') drawSpikeFloor(c, { x: h.x, y, width: h.width, height: h.height });
    else if (h.kind === 'wall_needle') drawWallNeedle(c, { x: h.x, y, width: h.width, height: h.height, side: h.side < 0 ? 'left' : 'right', state: h.state === 'active' ? 'active' : h.state === 'warning' ? 'warning' : 'idle', reach: h.width, frame: Math.floor(s.time * 6) });
    else {
      drawBird(c, { x: h.x, y, width: h.width, height: h.height, frame: Math.floor(s.time * 8), facing: !h.amplitude || Math.cos(s.time * Math.PI * 2 / Math.max(.01, h.period) + h.phase) >= 0 ? 1 : -1 });
      if (h.state === 'warning') { drawBitmapText(c, '!', Math.round(h.x + h.width / 2), y - 10, { color: PALETTE['7'], align: 'center' }); }
    }
  }
  const p = s.player;
  const state = !s.alive ? 'death' : seconds < dropUntil ? 'drop' : p.stunRemaining > 0 ? 'hard' : Math.abs(p.vx) > 12 ? p.vx < 0 ? 'left' : 'right' : !p.grounded ? 'falling' : s.lastLanding && seconds < feedbackUntil ? 'landing' : 'idle';
  drawKing(c, Math.round(p.x) - KING_ANCHOR.x, Math.round(p.y - s.cameraY) - KING_ANCHOR.y, { state, frame: Math.floor(seconds * 8), facing: p.vx < 0 ? -1 : 1 });
  if (p.grounded && s.lastLanding && seconds < feedbackUntil) { c.fillStyle = PALETTE['7']; for (let i = 0; i < 4; i++) c.fillRect(Math.round(p.x - 16 + i * 10), Math.round(p.y - s.cameraY) - (i % 2 ? 3 : 1), 3, 2); }
  c.restore();
  // The screen ceiling pursues the king independently of the camera-follow speed.
  c.save(); c.translate(0, SCROLL_TOP_LIMIT); c.scale(1, -1); drawSpikeFloor(c, { x: 0, y: 0, width: WORLD_WIDTH, height: 10 }); c.restore();
  c.fillStyle = PALETTE['0']; c.fillRect(8, 7, 240, 40);
  drawBitmapText(c, `DEPTH ${Math.floor(s.depth)}M`, 14, 13, { color: PALETTE['5'], scale: 2 });
  drawBitmapText(c, `BEST ${best}M`, 242, 16, { color: PALETTE['4'], align: 'right' });
  const danger = s.danger === 'fatal' ? PALETTE.b : s.danger === 'danger' ? PALETTE['7'] : PALETTE.f;
  drawBitmapText(c, 'FALL', 14, 36, { color: danger });
  drawBitmapText(c, `${s.fallDistance.toFixed(1)}M`, 48, 31, { color: danger, scale: 2 });
  drawBitmapText(c, s.topRemaining < 48 ? 'HURRY!' : `SCROLL ${Math.round(s.scrollSpeed)}`, 242, 36, { color: s.topRemaining < 48 ? PALETTE.b : PALETTE['7'], align: 'right' });
  c.fillStyle = PALETTE['2']; c.fillRect(14, 45, 228, 2); c.fillStyle = danger; c.fillRect(14, 45, Math.round(228 * Math.min(1, s.fallDistance / 9)), 2,);
  if (feedback && seconds < feedbackUntil) { c.fillStyle = PALETTE['0']; c.fillRect(28, 418, 200, 22); drawBitmapText(c, feedback, 128, 426, { color: PALETTE['5'], align: 'center' }); }
}
export function paintFallPractice(canvas: HTMLCanvasElement, snapshot: PracticeSnapshot): void {
  const s = snapshot.fall; if (!s) return; const c = canvas.getContext('2d')!; c.imageSmoothingEnabled = false;
  drawBackdrop(c, 'tower', { scrollY: s.cameraY });
  drawPlatform(c, { ...s.startPlatform, y: s.startPlatform.y - s.cameraY, type: 'normal' });
  drawPlatform(c, { ...s.target, y: s.target.y - s.cameraY, type: 'normal' });
  for (const h of s.hazards) drawSpikeFloor(c, { ...h, y: h.y - s.cameraY });
  c.save(); c.translate(0, SCROLL_TOP_LIMIT); c.scale(1, -1); drawSpikeFloor(c, { x: 0, y: 0, width: WORLD_WIDTH, height: 10 }); c.restore();
  c.save(); c.globalAlpha = s.ghost ? .6 : 1;
  drawKing(c, Math.round(s.x) - KING_ANCHOR.x, Math.round(s.y - s.cameraY) - KING_ANCHOR.y, { state: s.phase === 'splat' ? 'death' : s.grounded ? 'idle' : s.vx > 5 ? 'right' : s.vx < -5 ? 'left' : 'falling', frame: Math.floor(snapshot.elapsed * 8) }); c.restore();
  c.fillStyle = PALETTE['0']; c.fillRect(8, 7, 240, 40);
  drawBitmapText(c, `PRACTICE ${Math.min(4, s.step + 1)}/4`, 14, 12, { color: PALETTE['5'], scale: 2 });
  const distanceColor = s.fallDistance >= 9 ? PALETTE.b : PALETTE.f;
  drawBitmapText(c, 'FALL', 14, 36, { color: distanceColor });
  drawBitmapText(c, `${s.fallDistance.toFixed(1)}M`, 56, 31, { color: distanceColor, scale: 2 });
  drawBitmapText(c, s.fallDistance >= 9 ? 'DANGER' : 'SAFE', 242, 36, { color: distanceColor, align: 'right' });
  if (s.phase === 'splat') drawBitmapText(c, s.cause === 'scroll' ? 'TOO SLOW!' : 'SPIKES!', 128, 320, { color: PALETTE.b, align: 'center' });
}
export function createFallGame(parent: HTMLElement, hooks: FallHooks, readBest = (): number => 0): FallController {
  parent.innerHTML = `<div class="fall-board"><div class="fall-window"><canvas id="fall-canvas" width="${WORLD_WIDTH}" height="${WORLD_HEIGHT}" tabindex="0" aria-label="落下キングのゲーム画面。左右で移動、DROPで下へ。"></canvas></div><div class="fall-controls"><button id="left-button" type="button" aria-label="左へ移動、押している間">← 左</button><button id="drop-button" type="button">DROP ↓</button><button id="right-button" type="button" aria-label="右へ移動、押している間">右 →</button></div></div>`;
  const canvas = parent.querySelector<HTMLCanvasElement>('canvas')!;
  const abort = new AbortController(), options = { signal: abort.signal }; let active = false, paused = false, frame = 0, previous = performance.now(), clock = 0, ended = false;
  let feedback = '', feedbackUntil = 0, dropUntil = 0, preview = true; const keys = new Map<string, HorizontalInput>(); const pointers = new Map<number, HorizontalInput>();
  const run = new FallRun((event: FallEvent) => {
    if (event.type === 'end') { feedback = event.result.outcome === 'scroll' ? 'TOO SLOW!' : event.result.outcome === 'impact' ? 'SPLAT!' : event.result.outcome === 'spike' ? 'SPIKES!' : event.result.outcome === 'needle' ? 'WALL NEEDLE!' : 'BIRD!'; feedbackUntil = clock + .65; }
    if (event.type === 'drop') dropUntil = clock + .15;
    if (event.type === 'landing') { feedback = event.landing.kind === 'fatal' ? 'SPLAT!' : event.landing.nice ? 'NICE DROP!' : event.landing.kind === 'hard' ? 'HARD LANDING' : 'LANDED'; feedbackUntil = clock + .65; }
    if (event.type === 'milestone') { feedback = '1000M! STILL NO BOTTOM'; feedbackUntil = clock + 2; }
    hooks.onEvent(event);
    if (event.type === 'end' && !ended) { ended = true; active = false; release(); hooks.onEnd(event.result); }
  });
  function release(): void { keys.clear(); pointers.clear(); run.setHorizontal(0); }
  function input(): void { if (!active || paused) return; const directions = [...keys.values(), ...pointers.values()]; const left = directions.includes(-1), right = directions.includes(1); run.setHorizontal(left === right ? 0 : right ? 1 : -1); }
  function drop(): boolean { if (!active || paused || document.querySelector('dialog[open]')) return false; return run.drop(); }
  function tick(now: number): void { const dt = Math.min(.05, (now - previous) / 1000); previous = now; if (active && !paused && !document.hidden) { clock += dt; run.step(dt); } else if (ended && !paused && clock < feedbackUntil) clock += dt; const s = run.snapshot(); const display = preview ? { ...s, alive: true, phase: 'grounded' as const } : s; paint(canvas, display, readBest(), clock, feedback, feedbackUntil, dropUntil); hooks.onUpdate(s); frame = requestAnimationFrame(tick); }
  const blocked = (e: KeyboardEvent | PointerEvent | MouseEvent): boolean => e.altKey || e.ctrlKey || e.metaKey || e.shiftKey;
  parent.addEventListener('pointerdown', e => {
    if (!active || paused || (!e.isPrimary && e.pointerType !== 'touch') || e.button !== 0 || blocked(e) || document.querySelector('dialog[open]')) return;
    const target = (e.target as Element).closest<HTMLButtonElement>('button');
    if (target?.id === 'drop-button') { e.preventDefault(); drop(); return; }
    if (target && target.id !== 'left-button' && target.id !== 'right-button') return;
    const bounds = canvas.getBoundingClientRect(); const direction = target ? target.id === 'right-button' ? 1 : -1 : e.clientX > bounds.left + bounds.width / 2 ? 1 : -1;
    e.preventDefault(); pointers.set(e.pointerId, direction); input(); try { (target ?? canvas).setPointerCapture(e.pointerId); } catch { /* global release */ }
  }, options);
  parent.addEventListener('click', e => { if (e.detail === 0 && !blocked(e) && (e.target as Element).closest('button')?.id === 'drop-button') drop(); }, options);
  const pointerEnd = (e: PointerEvent): void => { if (pointers.delete(e.pointerId)) input(); };
  window.addEventListener('pointerup', pointerEnd, options); window.addEventListener('pointercancel', pointerEnd, options); parent.addEventListener('lostpointercapture', pointerEnd, options);
  document.addEventListener('keydown', e => {
    if (!active || paused || blocked(e) || document.querySelector('dialog[open]')) return;
    const key = e.key.toLowerCase(), button = (e.target as Element).closest<HTMLButtonElement>('button,a');
    // Direction keys remain gameplay controls after pause/resume or mute keeps header focus.
    // Space/Enter on navigation still belong to the focused native control.
    if (['arrowleft', 'arrowright', 'a', 'd'].includes(key)) { e.preventDefault(); if (!e.repeat) { keys.set(key, key === 'arrowright' || key === 'd' ? 1 : -1); input(); } return; }
    if (key === 'arrowdown' || key === 's') { e.preventDefault(); if (!e.repeat) drop(); return; }
    if (button && !['left-button', 'right-button', 'drop-button'].includes(button.id)) return;
    if (key === ' ' || key === 'enter') { e.preventDefault(); if (e.repeat) return; if ((key === ' ' || key === 'enter') && button?.id === 'left-button') { keys.set(key, -1); input(); } else if ((key === ' ' || key === 'enter') && button?.id === 'right-button') { keys.set(key, 1); input(); } else if (key !== 'enter' || button?.id === 'drop-button') drop(); }
  }, options);
  document.addEventListener('keyup', e => { const key = e.key.toLowerCase(); keys.delete(key); if (key === ' ' || key === 'enter') { if (active && (e.target as Element).closest('.fall-controls')) e.preventDefault(); } input(); }, options);
  window.addEventListener('blur', release, options);
  frame = requestAnimationFrame(tick);
  return { start() { release(); preview = false; run.start(); active = true; paused = ended = false; clock = 0; feedback = ''; feedbackUntil = dropUntil = 0; previous = performance.now(); }, title() { preview = true; active = false; paused = false; ended = true; release(); run.reset(); feedback = ''; feedbackUntil = dropUntil = 0; }, pause(value) { release(); paused = value; previous = performance.now(); }, setHorizontal(direction) { if (active && !paused) run.setHorizontal(direction); }, drop, snapshot: () => run.snapshot(), inspection: () => run.inspection(), destroy() { active = false; abort.abort(); cancelAnimationFrame(frame); release(); parent.replaceChildren(); } };
}
