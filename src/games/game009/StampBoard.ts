import { calculateDeskLayout, StampRun } from './StampRun';
import type { DeskLayout, DeskObject, StampController, StampHooks } from './contracts';

const labels = { paper: '紙束', pen: 'ペン', clip: 'クリップ', memo: 'メモ', calculator: '電卓', cup: 'コーヒー', stapler: 'ホッチキス', stamp: '印鑑' };
const objectLabel = (o: DeskObject): string => o.kind === 'stamp' ? `${o.color === 'red' ? '赤い' : '青い'}${o.shape === 'round' ? '丸' : '四角'}印鑑` : `${labels[o.kind]}${o.stackCount > 1 ? `と紙${o.stackCount - 1}枚` : ''}`;
const asset = (o: DeskObject): string => o.kind === 'stamp' ? `./assets/game009/stamp-${o.shape}-${o.color}.webp` : `./assets/game009/desk-${o.kind}.webp`;

/** Hit rectangles are unrotated native CSS-pixel buttons; only generated artwork rotates within them. */
export function createStampGame(parent: HTMLElement, hooks: StampHooks): StampController {
  const root = document.createElement('div'); root.className = 'stamp-board';
  root.innerHTML = `<div class="request-slip"><span class="request-sample" aria-hidden="true"></span><strong></strong><small class="round-label"></small></div><div class="search-meter"><div class="search-track"><i></i></div><span></span></div><div class="desk-field" aria-label="机の上の印鑑と文具"></div><div class="desk-note" role="status"></div>`;
  parent.append(root);
  const request = root.querySelector<HTMLElement>('.request-slip strong')!; const sample = root.querySelector<HTMLElement>('.request-sample')!;
  const round = root.querySelector<HTMLElement>('.round-label')!; const field = root.querySelector<HTMLElement>('.desk-field')!;
  const fill = root.querySelector<HTMLElement>('.search-track i')!; const timer = root.querySelector<HTMLElement>('.search-meter span')!;
  const note = root.querySelector<HTMLElement>('.desk-note')!;
  let objectAbort = new AbortController();
  const run = new StampRun(event => hooks.onEvent(event));
  let paused = false; let title = true; let destroyed = false; let notified = false; let frame = 0; let last = performance.now();
  let width = field.clientWidth || parent.clientWidth || 300; let layout: DeskLayout = calculateDeskLayout(run.snapshot().objects, width);
  let signature = ''; let timerSignature = ''; let guardUntil = 0;
  const buttons = new Map<number, HTMLButtonElement>();
  const modifiers = (event: MouseEvent | KeyboardEvent): boolean => event.altKey || event.ctrlKey || event.shiftKey || event.metaKey;
  const available = (): boolean => {
    const s = run.snapshot(); return !destroyed && !title && !paused && s.alive && !s.pending && s.phase === 'searching' && performance.now() >= guardUntil && !document.querySelector('dialog[open]');
  };
  function pick(id: number): boolean {
    if (!available() || !run.pick(id)) return false;
    publish(); return true;
  }
  function artwork(source: string, size: number, rotation: number, offset = 0): HTMLImageElement {
    const image = document.createElement('img'); image.src = source; image.alt = ''; image.draggable = false; image.decoding = 'async';
    image.style.cssText = `position:absolute;left:calc(50% + ${offset}px);top:calc(50% + ${offset}px);width:${size}px;height:auto;pointer-events:none;transform:translate(-50%,-50%) rotate(${rotation}deg)`;
    image.addEventListener('error', () => { image.hidden = true; }, { once: true }); return image;
  }
  function makeObject(object: DeskObject): HTMLButtonElement {
    const options = { signal: objectAbort.signal };
    const button = document.createElement('button'); button.type = 'button'; button.className = 'desk-object is-arriving'; button.id = `object-${object.id}`;
    button.dataset.object = String(object.id); button.dataset.kind = object.kind; button.dataset.color = object.color ?? ''; button.dataset.shape = object.shape ?? '';
    button.setAttribute('aria-label', objectLabel(object));
    const desktop = width >= 600;
    for (let layer = 1; layer < object.stackCount; layer++) {
      const image = artwork('./assets/game009/desk-paper.webp', desktop ? 60 : 46, object.rotation + (layer % 2 ? 2 : -2), (layer - 2) * 2);
      image.className = 'paper-layer'; button.append(image);
    }
    const image = artwork(asset(object), object.kind === 'stamp' ? desktop ? 60 : 48 : desktop ? 70 : 56, object.rotation);
    image.className = 'item-art'; button.append(image);
    image.addEventListener('error', () => {
      button.classList.add('asset-fallback'); const fallback = document.createElement('span'); fallback.className = 'fallback-object'; fallback.textContent = object.kind === 'stamp' ? object.shape === 'round' ? '●' : '■' : labels[object.kind]; button.append(fallback);
    }, { once: true });
    button.addEventListener('pointerdown', event => {
      if (!event.isPrimary || event.button !== 0 || modifiers(event) || !available()) return;
      event.preventDefault(); button.focus({ preventScroll: true }); pick(object.id);
    }, options);
    button.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault(); if (event.repeat || modifiers(event) || !available()) return; pick(object.id);
    }, options);
    button.addEventListener('keyup', event => { if (event.key === 'Enter' || event.key === ' ') event.preventDefault(); }, options);
    button.addEventListener('click', event => {
      const pointer = event as PointerEvent;
      if (event.detail > 0 || pointer.pointerType || modifiers(event)) return;
      pick(object.id); // Assistive activation; pointer and native key paths already consumed their own gesture.
    }, options);
    return button;
  }
  function rebuild(): void {
    // Release removed objects' handlers each round rather than retaining them on a run-long AbortSignal.
    objectAbort.abort(); objectAbort = new AbortController();
    const objects = run.snapshot().objects; layout = calculateDeskLayout(objects, width); field.style.height = `${layout.height}px`;
    buttons.clear(); field.replaceChildren(...objects.map(object => { const button = makeObject(object); buttons.set(object.id, button); return button; }));
    for (const bound of layout.bounds) {
      const button = buttons.get(bound.id)!; button.style.position = 'absolute'; button.style.left = `${bound.left}px`; button.style.top = `${bound.top}px`; button.style.width = `${bound.width}px`; button.style.height = `${bound.height}px`;
    }
  }
  function draw(): void {
    const s = run.snapshot();
    const key = [title, paused, s.phase, s.roundId, width, s.lastPicked, s.multiplier, s.clutterLevel].join('|');
    if (key !== signature) {
      const roundChanged = root.dataset.roundId !== String(s.roundId);
      signature = key; root.dataset.phase = title ? 'title' : s.phase; root.dataset.paused = String(paused); root.dataset.roundId = String(s.roundId);
      root.dataset.clutter = String(s.clutterLevel);
      if (roundChanged || buttons.size !== s.objects.length || layout.width !== width) rebuild();
      request.textContent = s.request.text; sample.dataset.color = s.request.color; sample.dataset.shape = s.request.shape;
      round.textContent = `ROUND ${s.round}`;
      const matching = run.inspection().matchingIds;
      for (const [id, button] of buttons) {
        button.disabled = !available(); button.classList.toggle('is-correct', s.phase === 'feedback' && s.lastPicked === id);
        button.classList.toggle('is-wrong', !s.alive && !title && s.lastPicked === id);
        button.classList.toggle('is-answer', !s.alive && !title && matching.includes(id));
      }
      note.textContent = title ? '見つけた印鑑を、そのまま押す。' : s.phase === 'feedback' ? `ポン！ +${s.lastPoints}点` : s.pending ? '机を片付けますか？' : !s.alive ? '条件に合う印鑑を枠で示しています。' : s.clutterLevel >= 24 ? `散らかり上限 · 今後 ×${s.multiplier}` : `机上の物 ${s.objectCount}個 · 今後 ×${s.multiplier}`;
    }
    const disabled = !available(); for (const button of buttons.values()) if (button.disabled !== disabled) button.disabled = disabled;
    const percent = !title && s.phase === 'searching' ? s.remaining / s.deadline * 100 : 0;
    const text = title ? '9秒からスタート' : s.pending ? '選択中：時計停止' : paused ? 'PAUSE' : s.phase === 'searching' ? `${s.remaining.toFixed(1)}s` : s.phase === 'feedback' ? '次の指示へ' : '—';
    const meter = percent.toFixed(1) + text;
    if (meter !== timerSignature) { timerSignature = meter; fill.style.width = `${percent}%`; timer.textContent = text; }
  }
  function publish(): void {
    draw(); hooks.onUpdate(run.snapshot());
    if (!title && !notified && !run.snapshot().alive) { const result = run.result(); if (result) { notified = true; hooks.onEnd(result); } }
  }
  const resize = new ResizeObserver(() => {
    const nextWidth = field.clientWidth || parent.clientWidth || 300;
    if (Math.abs(width - nextWidth) < 0.5) return;
    width = nextWidth; rebuild(); signature = ''; draw();
  });
  resize.observe(field);
  function tick(now: number): void {
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
    if (!paused && !title) run.step(dt); publish(); if (!destroyed) frame = requestAnimationFrame(tick);
  }
  rebuild(); draw(); frame = requestAnimationFrame(tick);
  return {
    start() { title = false; paused = false; notified = false; run.start(); last = performance.now(); signature = ''; publish(); },
    title() { title = true; paused = false; run.reset(); signature = ''; publish(); },
    pick,
    choose(choice) { if (title || paused || destroyed || !run.choose(choice)) return false; guardUntil = performance.now() + 350; last = performance.now(); signature = ''; publish(); return true; },
    pause(value) { paused = value; last = performance.now(); signature = ''; publish(); },
    snapshot: () => run.snapshot(),
    inspection: () => ({ ...run.inspection(), layout: { ...layout, bounds: layout.bounds.map(b => ({ ...b })) } }),
    destroy() { if (destroyed) return; destroyed = true; objectAbort.abort(); resize.disconnect(); cancelAnimationFrame(frame); buttons.clear(); root.remove(); },
  };
}
