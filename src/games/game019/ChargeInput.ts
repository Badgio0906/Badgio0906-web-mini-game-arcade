import type { Direction } from './chargeTypes';

interface Callbacks { enabled: () => boolean; begin: () => boolean; release: () => void; cancel: () => void; direction: (d: Direction) => void; peek?: (down: boolean) => void; pause?: () => void; focus: () => void }
/** One jump owner + independent direction contacts; releases survive focus and bounds changes. */
export class ChargeInput {
  private callbacks: Callbacks;
  private keys = new Set<string>();
  private contacts = new Map<number, Direction>();
  private jumpOwner: string | null = null;
  private removers: (() => void)[] = [];
  private jump: HTMLButtonElement;
  private left: HTMLButtonElement;
  private right: HTMLButtonElement;
  private peekContacts = new Set<number>();
  private peeking = false;
  constructor(jump: HTMLButtonElement, left: HTMLButtonElement, right: HTMLButtonElement, callbacks: Callbacks, peek?: HTMLButtonElement) {
    this.jump = jump; this.left = left; this.right = right; this.callbacks = callbacks;
    const listen = <K extends keyof HTMLElementEventMap>(el: HTMLElement, name: K, f: (e: HTMLElementEventMap[K]) => void) => { el.addEventListener(name, f); this.removers.push(() => el.removeEventListener(name, f)); };
    const directionContact = (el: HTMLButtonElement, dir: Direction) => {
      listen(el, 'pointerdown', e => { if (!callbacks.enabled() || e.button !== 0) return; e.preventDefault(); callbacks.focus(); this.contacts.set(e.pointerId, dir); el.setPointerCapture(e.pointerId); this.syncDirection(); });
      const end = (e: PointerEvent) => { this.contacts.delete(e.pointerId); this.syncDirection(); };
      listen(el, 'pointerup', end); listen(el, 'pointercancel', end); listen(el, 'lostpointercapture', end);
    };
    directionContact(left, -1); directionContact(right, 1);
    listen(jump, 'pointerdown', e => {
      if (!callbacks.enabled() || e.button !== 0) return; e.preventDefault(); callbacks.focus();
      if (this.jumpOwner || !callbacks.begin()) return;
      this.jumpOwner = `pointer:${e.pointerId}`; jump.setPointerCapture(e.pointerId); this.syncJump();
    });
    const endJump = (e: PointerEvent, cancelled: boolean) => {
      if (this.jumpOwner !== `pointer:${e.pointerId}`) return;
      this.jumpOwner = null; if (cancelled || !callbacks.enabled()) callbacks.cancel(); else callbacks.release(); this.syncJump();
    };
    listen(jump, 'pointerup', e => endJump(e, false)); listen(jump, 'pointercancel', e => endJump(e, true)); listen(jump, 'lostpointercapture', e => endJump(e, true));
    if (peek) {
      listen(peek, 'pointerdown', e => { if (!callbacks.enabled() || e.button !== 0) return; e.preventDefault(); this.peekContacts.add(e.pointerId); peek.setPointerCapture(e.pointerId); this.syncPeek(); });
      const end = (e: PointerEvent) => { this.peekContacts.delete(e.pointerId); this.syncPeek(); };
      listen(peek, 'pointerup', end); listen(peek, 'pointercancel', end); listen(peek, 'lostpointercapture', end);
    }
    const keyDown = (e: KeyboardEvent) => {
      if (e.isComposing || e.ctrlKey || e.altKey || e.metaKey) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest('input,textarea,select,a') || target?.closest('button') && target !== jump) return;
      if (e.code === 'Escape') { e.preventDefault(); if (!e.repeat) callbacks.pause?.(); return; }
      if (!callbacks.enabled()) return;
      if (['ArrowLeft', 'KeyA', 'ArrowRight', 'KeyD'].includes(e.code)) { e.preventDefault(); this.keys.add(e.code); this.syncDirection(); }
      else if (['ArrowDown', 'KeyS'].includes(e.code)) { e.preventDefault(); this.keys.add(e.code); this.syncPeek(); }
      else if (e.code === 'Space') { e.preventDefault(); if (e.repeat || this.jumpOwner || !callbacks.begin()) return; this.jumpOwner = 'key:Space'; this.syncJump(); }
    };
    const keyUp = (e: KeyboardEvent) => {
      if (this.keys.delete(e.code)) { e.preventDefault(); this.syncDirection(); this.syncPeek(); }
      if (e.code === 'Space' && this.jumpOwner === 'key:Space') { e.preventDefault(); this.jumpOwner = null; if (callbacks.enabled()) callbacks.release(); else callbacks.cancel(); this.syncJump(); }
    };
    window.addEventListener('keydown', keyDown); window.addEventListener('keyup', keyUp);
    this.removers.push(() => window.removeEventListener('keydown', keyDown), () => window.removeEventListener('keyup', keyUp));
    const blur = () => this.reset(); window.addEventListener('blur', blur); this.removers.push(() => window.removeEventListener('blur', blur));
    const hidden = () => { if (document.hidden) this.reset(); }; document.addEventListener('visibilitychange', hidden); this.removers.push(() => document.removeEventListener('visibilitychange', hidden));
  }
  private syncDirection(): void {
    const directions = [...this.contacts.values()];
    const left = this.keys.has('ArrowLeft') || this.keys.has('KeyA') || directions.includes(-1), right = this.keys.has('ArrowRight') || this.keys.has('KeyD') || directions.includes(1);
    const direction: Direction = left === right ? 0 : left ? -1 : 1;
    this.left.setAttribute('aria-pressed', String(left)); this.right.setAttribute('aria-pressed', String(right)); this.callbacks.direction(direction);
  }
  private syncJump(): void { this.jump.setAttribute('aria-pressed', String(this.jumpOwner !== null)); }
  private syncPeek(): void { this.peeking = this.keys.has('ArrowDown') || this.keys.has('KeyS') || this.peekContacts.size > 0; this.callbacks.peek?.(this.peeking); }
  reset(): void { this.jumpOwner = null; this.keys.clear(); this.contacts.clear(); this.peekContacts.clear(); this.callbacks.cancel(); this.syncJump(); this.syncDirection(); this.syncPeek(); }
  destroy(): void { this.reset(); for (const remove of this.removers) remove(); }
}
