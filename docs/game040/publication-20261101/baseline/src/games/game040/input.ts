export interface CleaningInputCallbacks {
  begin(): boolean;
  release(): void;
  cancel(): void;
  setAim(degrees: number): void;
  getAim(): number;
  pause(): void;
}
export interface CleaningInputOptions {
  pad: HTMLElement;
  canvas: HTMLCanvasElement;
  callbacks: CleaningInputCallbacks;
  /** Optional event targets make cancellation tests independent of a DOM emulator. */
  targetWindow?: Window;
  targetDocument?: Document;
}
type PointerOwner = { kind: 'pointer'; id: number; element: HTMLElement; source: 'pad'|'canvas'; x: number; angle: number; width: number };
type Owner = PointerOwner | { kind: 'keyboard' } | null;
const clamp = (x: number): number => Math.max(-60, Math.min(60, Number.isFinite(x) ? x : 0));
const aimKeys = new Set(['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD']);
const usedKeys = new Set([...aimKeys, 'Space']);
function editable(target: EventTarget|null): boolean {
  const element = target as Element|null;
  return typeof element?.closest === 'function' && !!element.closest('input,textarea,select,[contenteditable=true]');
}

/** One owner controls suction. Only a normal matching up can call release(). */
export class CleaningInput {
  private enabled = false;
  private owner: Owner = null;
  private readonly heldKeys = new Set<string>();
  private readonly blockedKeys = new Set<string>();
  private readonly blockedPointers = new Set<number>();
  private readonly remove: Array<()=>void> = [];
  private readonly win: Window;
  private readonly doc: Document;
  private disposed = false;
  private beginCount = 0;
  private releaseCount = 0;
  private cancelCount = 0;
  private readonly cb: CleaningInputCallbacks;
  constructor(private readonly options: CleaningInputOptions) {
    this.cb = options.callbacks;
    this.win = options.targetWindow ?? window;
    this.doc = options.targetDocument ?? document;
    const on = (target: EventTarget, type: string, listener: EventListener, opts?: AddEventListenerOptions|boolean): void => {
      target.addEventListener(type, listener, opts);
      this.remove.push(()=>target.removeEventListener(type, listener, typeof opts === 'boolean' ? opts : opts?.capture));
    };
    for (const [element, source] of [[options.pad, 'pad'], [options.canvas, 'canvas']] as const) {
      on(element, 'pointerdown', event=>this.pointerDown(event as PointerEvent, element, source));
      on(element, 'pointermove', event=>this.pointerMove(event as PointerEvent, source));
      on(element, 'lostpointercapture', event=>{
        const e = event as PointerEvent;
        if (this.owner?.kind === 'pointer' && this.owner.id === e.pointerId) this.cancel();
      });
      on(element, 'contextmenu', event=>{ event.preventDefault(); this.interrupt(); });
      on(element, 'selectstart', event=>event.preventDefault());
      on(element, 'dragstart', event=>event.preventDefault());
    }
    on(this.doc, 'pointerup', event=>this.pointerUp(event as PointerEvent, false), true);
    on(this.doc, 'pointercancel', event=>this.pointerUp(event as PointerEvent, true), true);
    on(this.doc, 'touchend', event=>{
      const e = event as TouchEvent;
      // A missing pointerup is a cancellation fallback, never a synthetic shot.
      if (!e.touches.length) {
        if (this.owner?.kind === 'pointer') this.cancel();
        this.blockedPointers.clear();
      }
    }, { capture: true, passive: true });
    on(this.doc, 'touchcancel', ()=>{
      if (this.owner?.kind === 'pointer') this.cancel();
      this.blockedPointers.clear();
    }, { capture: true, passive: true });
    on(this.doc, 'keydown', event=>this.keyDown(event as KeyboardEvent), true);
    on(this.doc, 'keyup', event=>this.keyUp(event as KeyboardEvent), true);
    on(this.win, 'blur', ()=>this.interrupt());
    on(this.doc, 'visibilitychange', ()=>{ if (this.doc.hidden) this.interrupt(); });
  }
  setEnabled(value: boolean): void {
    if (this.disposed) return;
    if (value !== this.enabled) { this.cancel(); this.enabled = value; }
  }
  update(deltaMs: number): void {
    if (!this.enabled || this.disposed || !Number.isFinite(deltaMs) || deltaMs <= 0) return;
    // Directions are independent of Space, so keyboard aim works before suction.
    const left = this.heldKeys.has('ArrowLeft') || this.heldKeys.has('KeyA');
    const right = this.heldKeys.has('ArrowRight') || this.heldKeys.has('KeyD');
    if (left !== right && this.owner?.kind !== 'pointer') this.cb.setAim(clamp(this.cb.getAim() + (right ? 1 : -1) * 90 * deltaMs / 1000));
  }
  cancel(): void {
    const previous = this.owner;
    this.owner = null;
    for (const code of this.heldKeys) this.blockedKeys.add(code);
    this.heldKeys.clear();
    if (!previous) return;
    this.cancelCount++;
    if (previous.kind === 'pointer') {
      this.blockedPointers.add(previous.id);
      try { if (previous.element.hasPointerCapture(previous.id)) previous.element.releasePointerCapture(previous.id); } catch { /* UA may already have canceled. */ }
    }
    this.cb.cancel();
  }
  destroy(): void {
    if (this.disposed) return;
    this.cancel();
    this.remove.splice(0).forEach(fn=>fn());
    this.enabled = false;
    this.disposed = true;
    this.blockedKeys.clear();
    this.blockedPointers.clear();
  }
  diagnostics(): { enabled: boolean; owner: 'pointer'|'keyboard'|'none'; listeners: number; begins: number; releases: number; cancellations: number; blockedKeys: number } {
    return { enabled: this.enabled, owner: this.owner?.kind ?? 'none', listeners: this.remove.length, begins: this.beginCount, releases: this.releaseCount, cancellations: this.cancelCount, blockedKeys: this.blockedKeys.size };
  }
  private interrupt(): void {
    this.cancel();
    if (this.enabled) this.cb.pause();
  }
  private aimAt(x: number, y: number): void {
    const r = this.options.canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const dx = (x-r.left)/r.width*480 - 240;
    const dy = (y-r.top)/r.height*480 - 462;
    this.cb.setAim(clamp(Math.atan2(dx, -dy)*180/Math.PI));
  }
  private pointerDown(e: PointerEvent, element: HTMLElement, source: 'pad'|'canvas'): void {
    if (!this.enabled || this.disposed || this.owner || this.blockedPointers.has(e.pointerId) || e.button !== 0 || !e.isPrimary) return;
    if (source === 'canvas' && e.pointerType === 'touch') return;
    e.preventDefault();
    if (source === 'canvas') this.aimAt(e.clientX,e.clientY);
    if (!this.cb.begin()) return;
    this.beginCount++;
    this.owner = { kind: 'pointer', id: e.pointerId, element, source, x: e.clientX, angle: this.cb.getAim(), width: Math.max(1, this.options.pad.getBoundingClientRect().width) };
    try { element.setPointerCapture(e.pointerId); } catch { /* Document up/cancel remain active. */ }
  }
  private pointerMove(e: PointerEvent, source: 'pad'|'canvas'): void {
    if (!this.enabled || this.disposed) return;
    const o = this.owner;
    if (o?.kind === 'pointer') {
      if (o.id !== e.pointerId) return;
      e.preventDefault();
      if (o.source === 'pad') this.cb.setAim(clamp(o.angle+(e.clientX-o.x)/o.width*160));
      else this.aimAt(e.clientX,e.clientY);
    } else if (!o && source === 'canvas' && e.pointerType === 'mouse') this.aimAt(e.clientX,e.clientY);
  }
  private pointerUp(e: PointerEvent, canceled: boolean): void {
    this.blockedPointers.delete(e.pointerId);
    const o = this.owner;
    if (o?.kind !== 'pointer' || o.id !== e.pointerId) return;
    if (canceled || !this.enabled) { this.cancel(); this.blockedPointers.delete(e.pointerId); return; }
    // Clear ownership before UA lostcapture or callback-driven screen changes.
    this.owner = null;
    try { if (o.element.hasPointerCapture(e.pointerId)) o.element.releasePointerCapture(e.pointerId); } catch { /* No capture remains. */ }
    this.releaseCount++;
    this.cb.release();
  }
  private keyDown(e: KeyboardEvent): void {
    if (this.disposed || editable(e.target)) return;
    if (e.code === 'Escape') { if (this.enabled) { e.preventDefault(); this.interrupt(); } return; }
    if (!usedKeys.has(e.code)) return;
    if (!this.enabled) { this.blockedKeys.add(e.code); return; }
    if (this.blockedKeys.has(e.code)) { e.preventDefault(); return; }
    const target = e.target as Element|null;
    if (typeof target?.closest === 'function' && target.closest('button,a') && target !== this.options.pad) return;
    e.preventDefault();
    if (e.repeat || this.heldKeys.has(e.code)) return;
    this.heldKeys.add(e.code);
    if (e.code !== 'Space' || this.owner) return;
    if (this.cb.begin()) { this.owner = { kind: 'keyboard' }; this.beginCount++; }
  }
  private keyUp(e: KeyboardEvent): void {
    this.blockedKeys.delete(e.code);
    this.heldKeys.delete(e.code);
    if (e.code !== 'Space' || this.owner?.kind !== 'keyboard') return;
    this.owner = null;
    if (this.enabled && !this.disposed) { this.releaseCount++; this.cb.release(); }
    else { this.cancelCount++; this.cb.cancel(); }
  }
}
