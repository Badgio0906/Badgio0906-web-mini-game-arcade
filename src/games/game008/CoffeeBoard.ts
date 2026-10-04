import { CoffeeRun, TAP_SECONDS } from './CoffeeRun';
import type { CoffeeController, CoffeeCup, CoffeeDirection, CoffeeHooks, CoffeeSnapshot } from './contracts';

const INK = '#4d4237'; const CREAM = '#fff1d9'; const COFFEE = '#6b3e27';

export function createCoffeeGame(parent: HTMLElement, hooks: CoffeeHooks): CoffeeController {
  const root = document.createElement('div'); root.className = 'coffee-board';
  root.innerHTML = `<div class="walk-window"><canvas width="1200" height="900" role="img" aria-label="朝の街と、実際の慣性で揺れるコーヒー"></canvas><div class="walk-hud"><div class="in-game-distance"><span>歩いた距離</span><strong class="walk-distance">0</strong><b>m</b></div><div class="balance-readout"><span class="tilt-owner">液面 · あなたの分</span><strong class="tilt-direction">安定</strong><div class="tilt-meter" role="img" aria-label="液面の偏り。中央ほど安定"><span class="tilt-center"></span><i class="tilt-pointer"></i><span class="tilt-left">← 左</span><span class="tilt-right">右 →</span></div></div></div><div class="hazard-notice" role="status"></div><div class="cup-meters" aria-label="各杯の残量"></div></div><div class="coffee-controls"><button type="button" id="left-button" aria-label="左へバランスを取る">← 左へ<span>押す・離す</span></button><button type="button" id="right-button" aria-label="右へバランスを取る">右へ →<span>押す・離す</span></button></div>`;
  parent.append(root);
  const canvas = root.querySelector<HTMLCanvasElement>('canvas')!; const ctx = canvas.getContext('2d')!;
  ctx.setTransform(2, 0, 0, 2, 0, 0);
  const notice = root.querySelector<HTMLElement>('.hazard-notice')!; const balance = root.querySelector<HTMLElement>('.balance-readout')!;
  const distance = root.querySelector<HTMLElement>('.walk-distance')!; const tiltOwner = root.querySelector<HTMLElement>('.tilt-owner')!;
  const tiltDirection = root.querySelector<HTMLElement>('.tilt-direction')!; const tiltPointer = root.querySelector<HTMLElement>('.tilt-pointer')!; const tiltMeter = root.querySelector<HTMLElement>('.tilt-meter')!;
  const meters = root.querySelector<HTMLElement>('.cup-meters')!;
  const left = root.querySelector<HTMLButtonElement>('#left-button')!; const right = root.querySelector<HTMLButtonElement>('#right-button')!;
  const image = new Image(); image.src = './assets/game008/morning-walk.webp';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const abort = new AbortController(); const options = { signal: abort.signal };
  const run = new CoffeeRun(event => hooks.onEvent(event));
  let paused = false; let title = true; let destroyed = false; let notified = false; let frame = 0; let last = performance.now();
  let pointer: { id: number; side: -1 | 1; began: number; epoch: number } | null = null;
  let epoch = 0; let guardUntil = 0; let stateSignature = ''; let meterSignature = ''; let noticeSignature = '';
  const keys = new Map<string, -1 | 1>();
  const modifiers = (event: MouseEvent | KeyboardEvent): boolean => event.altKey || event.ctrlKey || event.shiftKey || event.metaKey;
  const available = (): boolean => !destroyed && !title && !paused && run.snapshot().alive && !run.snapshot().pending && performance.now() >= guardUntil && !document.querySelector('dialog[open]');
  function release(): void { pointer = null; keys.clear(); run.setInput(0); epoch++; }
  function applyInput(): void {
    const values = [...keys.values()];
    const direction: CoffeeDirection = pointer?.side ?? (values.includes(-1) && values.includes(1) ? 0 : values[0] ?? 0);
    run.setInput(available() ? direction : 0);
  }
  function cup(c: CoffeeCup, index: number, count: number, s: CoffeeSnapshot): void {
    const x = count === 1 ? 300 : count === 2 ? 208 + index * 184 : 108 + index * 192;
    const y = 330; const tilt = s.bodyLean;
    ctx.save(); ctx.translate(x, y); const size = count === 1 ? 1.3 : count === 2 ? 1.08 : 1; ctx.scale(size, size); ctx.rotate(tilt);
    // All three independently simulated liquid windows stay large and visible, even at maximum lean.
    ctx.fillStyle = 'rgba(77,66,55,.15)'; ctx.beginPath(); ctx.ellipse(4, 59, 69, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = ['#f6e7ce', '#dfa083', '#b3c2a3'][index]; ctx.strokeStyle = INK; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-68, -52); ctx.quadraticCurveTo(-74, -60, -64, -65); ctx.lineTo(64, -65); ctx.quadraticCurveTo(74, -60, 68, -52);
    ctx.lineTo(56, 57); ctx.quadraticCurveTo(0, 67, -56, 57); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e9d7bc'; ctx.fillRect(-60, -49, 120, 83);
    ctx.save(); ctx.beginPath(); ctx.rect(-62, -47, 124, 82); ctx.clip();
    if (c.remaining > 0) {
      const center = 35 - 82 * 0.8 * c.remaining / 100; const slope = Math.tan(c.surfaceTilt);
      ctx.fillStyle = COFFEE; ctx.beginPath(); ctx.moveTo(-62, center - slope * 62);
      ctx.lineTo(62, center + slope * 62); ctx.lineTo(62, 35); ctx.lineTo(-62, 35); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#b87d4e'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-62, center - slope * 62); ctx.lineTo(62, center + slope * 62); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,241,217,.42)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-35, center - slope * 35 + 5); ctx.lineTo(24, center + slope * 24 + 5); ctx.stroke();
    }
    ctx.restore();
    ctx.strokeStyle = '#efe0c6'; ctx.lineWidth = 5; ctx.strokeRect(-64, -49, 128, 86);
    ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.strokeRect(-65, -50, 130, 88);
    ctx.fillStyle = CREAM; ctx.fillRect(-43, 40, 86, 13); ctx.fillStyle = INK; ctx.font = 'bold 10px "Arcade Rounded",system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.fillText(c.name, 0, 50);
    // Sleeve and supporting fingers keep the scene a daily-life object rather than a chart.
    ctx.fillStyle = ['#859d87', '#b18773', '#8698a5'][index]; ctx.beginPath(); ctx.moveTo(-38, 57); ctx.lineTo(38, 57); ctx.lineTo(51, 90); ctx.lineTo(-48, 90); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e5b992'; ctx.beginPath(); ctx.roundRect(-42, 51, 84, 12, 6); ctx.fill();
    if (c.spilling && !reduced) {
      const side = c.surfaceTilt >= 0 ? -1 : 1; const px = side * 66;
      for (let i = 0; i < 3; i++) {
        const age = (s.time + i * 0.15) % 0.45;
        ctx.globalAlpha = (1 - age / 0.45) * Math.min(1, c.spillRate / 3 + 0.2); ctx.fillStyle = COFFEE;
        ctx.beginPath(); ctx.ellipse(px + side * age * 14, -43 + age * 85 + age * age * 110, 2.1, 3.3, 0, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }
  function paint(s: CoffeeSnapshot): void {
    ctx.clearRect(0, 0, 600, 450); ctx.fillStyle = CREAM; ctx.fillRect(0, 0, 600, 450);
    if (image.complete && image.naturalWidth) ctx.drawImage(image, -12 + (reduced ? 0 : s.bodyLean * 8), 0, 624, 416);
    else {
      ctx.fillStyle = '#dce4cb'; ctx.fillRect(0, 0, 600, 260); ctx.fillStyle = '#e8d2ae'; ctx.fillRect(0, 260, 600, 190);
      for (const x of [0, 455]) { ctx.fillStyle = '#d7b99a'; ctx.fillRect(x, 65, 145, 230); ctx.fillStyle = '#859d87'; ctx.fillRect(x + 14, 96, 112, 15); }
    }
    // Pavement flow is keyed to actual distance; it stops at pause/choice along with the model.
    ctx.strokeStyle = 'rgba(107,62,39,.09)'; ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) { const p = ((s.distance / 32 + i / 5) % 1); const y = 196 + p * p * 234; ctx.beginPath(); ctx.moveTo(145 - p * 145, y); ctx.lineTo(455 + p * 145, y); ctx.stroke(); }
    const h = s.activeEvent ?? s.preview;
    if (h) {
      const approach = Math.min(1, Math.max(0, 1 - (h.onsetTime - s.time) / 1.4));
      ctx.strokeStyle = '#a66349'; ctx.lineWidth = 3; ctx.fillStyle = 'rgba(223,160,131,.22)';
      if (h.type === 'people') {
        const x = 300 + h.side * (90 - approach * 35); const y = 220 + approach * 35;
        ctx.fillStyle = '#859d87'; ctx.beginPath(); ctx.ellipse(x, y + 22, 12 + approach * 9, 25 + approach * 11, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#d8b48d'; ctx.beginPath(); ctx.arc(x, y - 10, 10 + approach * 6, 0, Math.PI * 2); ctx.fill();
      } else if (h.type === 'step') {
        const y = 239 + approach * 36; ctx.fillRect(145, y, 310, 7); ctx.strokeRect(145, y, 310, 7);
      } else if (h.type === 'door') { ctx.strokeRect(112, 150, 376, 142); ctx.beginPath(); ctx.moveTo(302, 150); ctx.lineTo(302, 265); ctx.stroke(); }
      else if (h.type === 'train') { ctx.strokeStyle = '#9d8a70'; ctx.strokeRect(20, 28, 560, 240); ctx.beginPath(); ctx.moveTo(52, 80); ctx.lineTo(52, 238); ctx.moveTo(548, 80); ctx.lineTo(548, 238); ctx.stroke(); }
      else { ctx.fillStyle = '#dfa083'; ctx.beginPath(); ctx.roundRect(227, 231, 146, 23, 5); ctx.fill(); ctx.fillStyle = INK; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center'; ctx.fillText('STOP', 300, 247); }
    }
    ctx.fillStyle = 'rgba(255,241,217,.35)'; ctx.fillRect(0, 288, 600, 162);
    for (let i = 0; i < s.cups.length; i++) cup(s.cups[i], i, s.cups.length, s);
  }
  function draw(): void {
    const s = run.snapshot();
    const state = [title, paused, s.phase, s.cupCount, s.input].join('|');
    if (state !== stateSignature) {
      stateSignature = state; root.dataset.phase = title ? 'title' : s.phase; root.dataset.paused = String(paused); root.dataset.cupCount = String(s.cupCount); root.dataset.input = String(s.input);
      if (meters.children.length !== s.cups.length) {
        meters.replaceChildren(...s.cups.map(c => {
          const node = document.createElement('div'); node.className = 'cup-meter'; node.dataset.cup = String(c.id);
          node.innerHTML = `<span></span><strong></strong><div class="cup-track"><i></i></div>`; return node;
        }));
      }
    }
    const meterKey = s.cups.map(c => `${c.id}:${c.remaining <= 0 ? 'empty' : Math.max(1, Math.ceil(c.remaining))}:${c.remaining.toFixed(1)}`).join('|');
    if (meterKey !== meterSignature) {
      meterSignature = meterKey;
      s.cups.forEach((c, i) => { const node = meters.children[i] as HTMLElement; node.querySelector('span')!.textContent = c.name;
        node.querySelector('strong')!.textContent = `${c.remaining <= 0 ? '0' : Math.max(1, Math.ceil(c.remaining))}%`;
        (node.querySelector('i') as HTMLElement).style.width = `${c.remaining}%`; node.classList.toggle('is-empty', c.remaining <= 0); });
    }
    const h = s.preview; const text = title ? '体は左右へ、液体は少し遅れて。' : s.pending ? 'カップを増やすか選んでください。' : !s.alive ? run.result()?.reason ?? '' : h ? `${h.name} · ${h.side === -1 ? '左' : '右'}へ揺れます · ${(h.onsetTime - s.time).toFixed(1)}s` : s.activeEvent ? s.activeEvent.name : '小さく補正。押しっぱなしに注意。';
    // Canvas y grows downward: positive relative slope has its high edge on the LEFT.
    // A spilling cup takes focus; otherwise use the greatest actual slope, never an average.
    const focused = s.cups.reduce((best, c) => (c.spilling ? 10 + c.spillRate : Math.abs(c.surfaceTilt)) > (best.spilling ? 10 + best.spillRate : Math.abs(best.surfaceTilt)) ? c : best, s.cups[0]);
    const tilt = focused.surfaceTilt; const side = Math.abs(tilt) < 0.08 ? 'center' : tilt > 0 ? 'left' : 'right';
    const direction = side === 'center' ? '安定 · 中央' : side === 'left' ? '← 左へ傾き' : '右へ傾き →';
    const owner = `液面 · ${focused.name}`; const travelled = String(Math.floor(s.distance));
    if (distance.textContent !== travelled) distance.textContent = travelled;
    if (tiltOwner.textContent !== owner) tiltOwner.textContent = owner;
    if (tiltDirection.textContent !== direction) tiltDirection.textContent = direction;
    balance.dataset.side = side; balance.dataset.cup = String(focused.id); balance.dataset.surfaceTilt = tilt.toFixed(3);
    tiltPointer.style.left = `${50 - Math.max(-1, Math.min(1, tilt)) * 40}%`;
    const tiltDescription = `${focused.name}の液面：${direction}`;
    if (tiltMeter.getAttribute('aria-label') !== tiltDescription) tiltMeter.setAttribute('aria-label', tiltDescription);
    const noticeKey = text;
    if (noticeKey !== noticeSignature) { noticeSignature = noticeKey; notice.textContent = text; notice.dataset.warning = String(!!h); }
    const disabled = !available(); if (left.disabled !== disabled) left.disabled = right.disabled = disabled;
    paint(s);
  }
  function publish(): void {
    const snapshot = run.snapshot(); if (snapshot.pending && (pointer || keys.size || snapshot.input)) release();
    draw(); hooks.onUpdate(run.snapshot());
    if (!title && !notified && !snapshot.alive) { const result = run.result(); if (result) { notified = true; release(); hooks.onEnd(result); } }
  }
  function beginPointer(event: PointerEvent, side: -1 | 1): void {
    if (!event.isPrimary || event.button !== 0 || modifiers(event) || !available() || pointer) return;
    event.preventDefault(); pointer = { id: event.pointerId, side, began: performance.now(), epoch };
    try { (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId); } catch { /* Window up/cancel remains the fallback. */ }
    applyInput(); publish();
  }
  const stage = parent.closest<HTMLElement>('#stage') ?? parent;
  stage.addEventListener('pointerdown', event => {
    if ((event.target as Element).closest('button,a')) return;
    const rect = stage.getBoundingClientRect(); beginPointer(event, event.clientX < rect.left + rect.width / 2 ? -1 : 1);
  }, options);
  window.addEventListener('pointerup', event => {
    if (pointer?.id !== event.pointerId) return;
    const previous = pointer; pointer = null; applyInput();
    if (previous.epoch === epoch && performance.now() - previous.began < TAP_SECONDS * 1000 && !keys.size && available()) run.tap(previous.side);
    publish();
  }, options);
  window.addEventListener('pointercancel', event => { if (pointer?.id === event.pointerId) { pointer = null; applyInput(); publish(); } }, options);
  window.addEventListener('lostpointercapture', event => { if (pointer?.id === event.pointerId) { pointer = null; applyInput(); publish(); } }, options);
  for (const [button, side] of [[left, -1], [right, 1]] as const) {
    button.addEventListener('pointerdown', event => beginPointer(event, side), options);
    button.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault(); if (event.repeat || modifiers(event) || !available()) return;
      run.tap(side); publish();
    }, options);
    button.addEventListener('click', event => {
      const pointerEvent = event as PointerEvent;
      // Pointer is handled exclusively on down/up. Native Enter/Space is handled on keydown.
      if (event.detail > 0 || pointerEvent.pointerType || modifiers(event) || !available()) return;
      run.tap(side); publish();
    }, options);
  }
  const directionForKey = (key: string): -1 | 1 | null => key === 'arrowleft' || key === 'a' ? -1 : key === 'arrowright' || key === 'd' ? 1 : null;
  document.addEventListener('keydown', event => {
    const key = event.key.toLowerCase(); const side = directionForKey(key);
    if (side === null || event.repeat || modifiers(event) || !available() || (event.target as Element)?.closest('input,textarea,select,[contenteditable="true"]')) return;
    event.preventDefault(); keys.set(key, side); applyInput(); publish();
  }, options);
  document.addEventListener('keyup', event => { const key = event.key.toLowerCase(); if (!directionForKey(key)) return; keys.delete(key); applyInput(); publish(); }, options);
  window.addEventListener('blur', () => { release(); publish(); }, options);
  document.addEventListener('visibilitychange', () => { if (document.hidden) { release(); publish(); } }, options);
  function tick(now: number): void {
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
    if (!paused && !title) run.step(dt); publish(); if (!destroyed) frame = requestAnimationFrame(tick);
  }
  void document.fonts.load('bold 10px "Arcade Rounded"', 'あなたの分部長会長').then(() => { if (!destroyed) draw(); }).catch(() => {});
  draw(); frame = requestAnimationFrame(tick);
  return {
    start() { release(); title = false; paused = false; notified = false; run.start(); last = performance.now(); stateSignature = ''; publish(); },
    title() { release(); title = true; paused = false; run.reset(); stateSignature = ''; publish(); },
    setInput(direction) { if (direction !== 0 && !available()) return false; const accepted = run.setInput(direction); publish(); return accepted; },
    tap(direction) { if (!available() || !run.tap(direction)) return false; publish(); return true; },
    choose(choice) { if (paused || title || destroyed || !run.choose(choice)) return false; release(); guardUntil = performance.now() + 350; last = performance.now(); stateSignature = ''; publish(); return true; },
    pause(value) { paused = value; release(); last = performance.now(); stateSignature = ''; publish(); },
    snapshot: () => run.snapshot(), inspection: () => run.inspection(),
    destroy() { if (destroyed) return; destroyed = true; release(); abort.abort(); cancelAnimationFrame(frame); root.remove(); },
  };
}
