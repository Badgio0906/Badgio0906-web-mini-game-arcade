import { MeetingRun } from './MeetingRun';
import type { MeetingController, MeetingHooks, MeetingSnapshot } from './contracts';

const INK = '#343f46'; const WALL = '#e4e5de'; const WOOD = '#77594b'; const SUIT = '#48696b';
const names = ['boss-talk', 'boss-glance', 'boss-question', 'colleague-one', 'colleague-two', 'colleague-three', 'foreground-listen', 'foreground-work'] as const;

/** Generated actors sit in a code-rendered eye-level room; pose and typing follow only the actual model. */
export function createMeetingGame(parent: HTMLElement, hooks: MeetingHooks): MeetingController {
  const root = document.createElement('div'); root.className = 'meeting-board';
  root.innerHTML = `<div class="meeting-window"><canvas width="1200" height="800" role="img" aria-label="会議室の上司と参加者。質問の前兆は文字でも表示します。"></canvas><div class="boss-caption" role="status"></div><div class="attention-label"></div></div><div class="meeting-controls"><button type="button" id="toggle-button"><strong></strong><span></span></button></div>`;
  parent.append(root);
  const canvas = root.querySelector<HTMLCanvasElement>('canvas')!; const ctx = canvas.getContext('2d')!; ctx.setTransform(2, 0, 0, 2, 0, 0);
  const caption = root.querySelector<HTMLElement>('.boss-caption')!; const attention = root.querySelector<HTMLElement>('.attention-label')!;
  const button = root.querySelector<HTMLButtonElement>('#toggle-button')!; const label = button.querySelector('strong')!; const hint = button.querySelector('span')!;
  const images = new Map<string, HTMLImageElement>();
  for (const name of names) { const image = new Image(); image.decoding = 'async'; image.src = `./assets/game010/${name}.webp`; images.set(name, image); }
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const abort = new AbortController(); const options = { signal: abort.signal };
  const run = new MeetingRun(event => hooks.onEvent(event));
  let paused = false; let title = true; let destroyed = false; let notified = false; let frame = 0; let last = performance.now();
  let signature = ''; let guardUntil = 0; let spaceHeld = false; const buttonKeys = new Set<string>();
  const modifiers = (event: MouseEvent | KeyboardEvent): boolean => event.altKey || event.ctrlKey || event.shiftKey || event.metaKey;
  const available = (): boolean => !destroyed && !title && !paused && run.snapshot().alive && !run.snapshot().pending && performance.now() >= guardUntil && !document.querySelector('dialog[open]');
  function clearInput(): void { spaceHeld = false; buttonKeys.clear(); }
  function toggle(): boolean { if (!available() || !run.toggle()) return false; publish(); return true; }
  function actor(name: string, x: number, y: number, width: number, height: number): void {
    const image = images.get(name);
    if (image?.complete && image.naturalWidth) { ctx.drawImage(image, x, y, width, height); return; }
    // Missing textures remain playable: the definitive cue is readable DOM text in addition to the pose.
    const boss = name.startsWith('boss'); const cx = x + width / 2;
    ctx.fillStyle = boss ? '#62666a' : SUIT; ctx.beginPath(); ctx.roundRect(x + width * 0.1, y + height * 0.55, width * 0.8, height * 0.45, width * 0.12); ctx.fill();
    ctx.fillStyle = '#d8b69c'; ctx.beginPath(); ctx.ellipse(cx, y + height * 0.4, width * 0.19, height * 0.2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = INK; for (const side of [-1, 1]) { ctx.beginPath(); ctx.arc(cx + side * width * 0.065, y + height * 0.4, Math.max(1, width * 0.012), 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#a78386'; ctx.beginPath(); ctx.moveTo(cx, y + height * 0.64); ctx.lineTo(cx + width * 0.035, y + height * 0.79); ctx.lineTo(cx - width * 0.035, y + height * 0.79); ctx.closePath(); ctx.fill();
  }
  function paint(s: MeetingSnapshot): void {
    ctx.clearRect(0, 0, 600, 400); ctx.fillStyle = WALL; ctx.fillRect(0, 0, 600, 400);
    // Quiet conference-room architecture, not a warning-colored dashboard.
    ctx.fillStyle = '#d1d8d3'; ctx.fillRect(20, 36, 128, 124); ctx.fillRect(452, 36, 128, 124);
    ctx.fillStyle = '#dbe4e2'; ctx.fillRect(26, 42, 116, 112); ctx.fillRect(458, 42, 116, 112);
    ctx.strokeStyle = '#a5b2ad'; ctx.lineWidth = 2;
    for (const x of [20, 452]) { for (let i = 1; i < 8; i++) { const y = 36 + i * 15; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 128, y); ctx.stroke(); } }
    ctx.strokeStyle = '#bec3bd'; ctx.beginPath(); ctx.moveTo(0, 202); ctx.lineTo(600, 202); ctx.stroke();
    ctx.fillStyle = '#ccd0c9'; ctx.fillRect(0, 204, 600, 196);
    ctx.fillStyle = '#4b5254'; ctx.beginPath(); ctx.roundRect(218, 83, 164, 225, 36); ctx.fill();
    const seats = [[62, 247, 102], [538, 247, 102], [150, 247, 92], [450, 247, 92], [23, 189, 78], [577, 189, 78], [189, 177, 72], [411, 177, 72]];
    // Additional participants are actual visible portraits; older rows remain small and away from the boss's face.
    for (let i = s.participants - 1; i >= 0; i--) {
      const [x, baseline, width] = seats[i]; const height = width * 4 / 3;
      ctx.fillStyle = '#677a78'; ctx.beginPath(); ctx.roundRect(x - width / 2 - 5, baseline - height * 0.72, width + 10, height * 0.85, 12); ctx.fill();
      actor(names[3 + i % 3], x - width / 2, baseline - height, width, height);
    }
    ctx.fillStyle = WOOD; ctx.beginPath(); ctx.moveTo(193, 226); ctx.lineTo(407, 226); ctx.lineTo(622, 400); ctx.lineTo(-22, 400); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#a48774'; ctx.lineWidth = 1;
    for (const x of [110, 220, 330, 440]) { ctx.beginPath(); ctx.moveTo(300 + (x - 300) * 0.2, 227); ctx.lineTo(x, 400); ctx.stroke(); }
    const pose = s.phase === 'answer' || s.phase === 'ended' && run.result()?.outcome === 'caught' || s.currentCue?.kind === 'question' && s.phase === 'cue' ? 'boss-question' : s.currentCue?.kind === 'feint' && s.phase === 'cue' ? 'boss-glance' : 'boss-talk';
    actor(pose, 140, -52, 320, 400);
    const foreground = images.get(s.mode === 'work' && !title ? 'foreground-work' : 'foreground-listen');
    if (!foreground?.complete || !foreground.naturalWidth) {
    // Foreground belongs to the player's own work, and never covers the upper/central question pose.
    ctx.fillStyle = '#8a6b59'; ctx.beginPath(); ctx.moveTo(70, 306); ctx.lineTo(530, 306); ctx.lineTo(612, 400); ctx.lineTo(-12, 400); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#b69880'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(72, 307); ctx.lineTo(528, 307); ctx.stroke();
    ctx.fillStyle = '#eee9dc'; ctx.save(); ctx.translate(450, 353); ctx.rotate(-0.06); ctx.fillRect(-40, -35, 80, 65);
    ctx.strokeStyle = '#b4ac9b'; ctx.lineWidth = 1; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-28, -20 + i * 10); ctx.lineTo(24, -20 + i * 10); ctx.stroke(); } ctx.restore();
    ctx.fillStyle = '#404e52'; ctx.beginPath(); ctx.roundRect(149, 307, 204, 68, 5); ctx.fill();
    ctx.fillStyle = s.mode === 'work' && !title ? '#bfd1c5' : '#a9b6b6'; ctx.fillRect(157, 314, 188, 52);
    ctx.fillStyle = '#485f59'; ctx.font = '12px monospace'; ctx.textAlign = 'left';
    const lines = s.mode === 'work' && !title ? 2 + Math.floor(s.workSeconds * 2) % 4 : 1;
    for (let i = 0; i < lines; i++) { ctx.fillRect(168, 323 + i * 8, 95 + i % 2 * 46, 2); }
    ctx.fillStyle = '#344146'; ctx.beginPath(); ctx.moveTo(149, 377); ctx.lineTo(353, 377); ctx.lineTo(381, 400); ctx.lineTo(120, 400); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#82908d'; ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(145 - i * 4, 383 + i * 6); ctx.lineTo(362 + i * 4, 383 + i * 6); ctx.stroke(); }
    if (s.mode === 'work' && !title) {
      const motion = reduced ? 0 : Math.sin(s.workSeconds * 22) * 2;
      ctx.fillStyle = '#48696b'; ctx.fillRect(73, 386, 48, 14); ctx.fillRect(382, 386, 48, 14);
      ctx.fillStyle = '#d8b69c'; ctx.beginPath(); ctx.roundRect(109, 384 + motion, 53, 14, 6); ctx.roundRect(339, 384 - motion, 53, 14, 6); ctx.fill();
    } else {
      ctx.fillStyle = '#d8b69c'; ctx.beginPath(); ctx.roundRect(408, 371, 54, 12, 6); ctx.fill();
      ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(454, 373); ctx.lineTo(472, 342); ctx.stroke();
    }
    }
    // Actual generated player artwork shares the portraits' ink/shading and keeps the boss cue clear.
    if (foreground?.complete && foreground.naturalWidth) {
      const motion = s.mode === 'work' && !title && !reduced ? Math.sin(s.workSeconds * 22) * 0.9 : 0;
      ctx.drawImage(foreground, 0, 250 + motion, 600, 150);
    }
    if (s.meetingMode === 'board') { ctx.strokeStyle = '#c3a160'; ctx.lineWidth = 3; ctx.strokeRect(2, 2, 596, 396); }
  }
  function draw(): void {
    const s = run.snapshot();
    const captionText = title ? 'まずは聞く。仕事を進めるなら、こっそり。' : !s.alive ? run.result()?.reason ?? '' : s.pending ? '会議が予定時間を超過しました。' : s.phase === 'answer' ? '「はい、その方針で進めましょう。」' : s.currentCue?.text ?? '続いて、今月の進捗について……';
    const nextLabel = s.mode === 'listen' ? 'LISTEN ／ 聞いています' : 'SIDE WORK ／ 内職中';
    const nextHint = s.mode === 'listen' ? `押すと内職 · +${10 * s.multiplier}点/秒` : '押すと聞く · 質問前に戻る';
    const key = [title, paused, s.phase, s.mode, s.meetingMode, s.pending, captionText, nextHint].join('|');
    if (key !== signature) {
      signature = key; root.dataset.phase = title ? 'title' : s.phase; root.dataset.paused = String(paused); root.dataset.mode = s.mode; root.dataset.meetingMode = s.meetingMode;
      caption.textContent = captionText; caption.dataset.cue = s.currentCue?.kind ?? 'none';
      attention.textContent = title ? 'LISTEN → SIDE WORK' : s.pending ? '選択中：会議時計停止' : paused ? 'PAUSE' : nextLabel;
      label.textContent = nextLabel; hint.textContent = nextHint; button.setAttribute('aria-pressed', String(s.mode === 'work'));
      button.setAttribute('aria-label', s.mode === 'listen' ? '内職を始める' : '会議を聞く');
    }
    const disabled = !available(); if (button.disabled !== disabled) button.disabled = disabled;
    paint(s);
  }
  function publish(): void {
    draw(); hooks.onUpdate(run.snapshot());
    if (!title && !notified && !run.snapshot().alive) { const result = run.result(); if (result) { notified = true; clearInput(); hooks.onEnd(result); } }
  }
  root.querySelector<HTMLElement>('.meeting-window')!.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0 || modifiers(event) || (event.target as Element).closest('button,a') || !available()) return;
    event.preventDefault(); toggle();
  }, options);
  button.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0 || modifiers(event) || !available()) return;
    event.preventDefault(); button.focus({ preventScroll: true }); toggle();
  }, options);
  button.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault(); if (event.repeat || modifiers(event) || buttonKeys.has(event.key)) return;
    buttonKeys.add(event.key); toggle();
  }, options);
  button.addEventListener('keyup', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); buttonKeys.delete(event.key); } }, options);
  button.addEventListener('click', event => {
    const pointer = event as PointerEvent; if (event.detail > 0 || pointer.pointerType || modifiers(event)) return;
    toggle(); // Assistive activation; ordinary pointer and native keyboard gestures were consumed already.
  }, options);
  document.addEventListener('keydown', event => {
    if (event.key !== ' ' || modifiers(event) || (event.target as Element)?.closest('button,a,input,textarea,select,[contenteditable="true"]')) return;
    if (!available()) return;
    event.preventDefault(); if (event.repeat || spaceHeld) return; spaceHeld = true; toggle();
  }, options);
  document.addEventListener('keyup', event => { if (event.key === ' ') spaceHeld = false; }, options);
  window.addEventListener('blur', clearInput, options);
  document.addEventListener('visibilitychange', () => { if (document.hidden) clearInput(); }, options);
  function tick(now: number): void {
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
    if (!paused && !title) run.step(dt); publish(); if (!destroyed) frame = requestAnimationFrame(tick);
  }
  draw(); frame = requestAnimationFrame(tick);
  return {
    start() { title = false; paused = false; notified = false; clearInput(); run.start(); last = performance.now(); signature = ''; publish(); },
    title() { title = true; paused = false; clearInput(); run.reset(); signature = ''; publish(); },
    toggle,
    choose(choice) { if (destroyed || paused || title || !run.choose(choice)) return false; clearInput(); guardUntil = performance.now() + 350; last = performance.now(); signature = ''; publish(); return true; },
    pause(value) { paused = value; clearInput(); last = performance.now(); signature = ''; publish(); },
    snapshot: () => run.snapshot(), inspection: () => run.inspection(),
    destroy() { if (destroyed) return; destroyed = true; abort.abort(); cancelAnimationFrame(frame); clearInput(); images.clear(); root.remove(); },
  };
}
