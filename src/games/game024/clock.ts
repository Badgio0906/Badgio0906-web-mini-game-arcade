import type { Speed } from './model';
/** Frame timestamps never become game rules. Long gaps request an explicit pause. */
export class SnakeClock {
  private previous: number | null = null;
  private running = false;
  remainder = 0;
  elapsed = 0;
  constructor(readonly speed: Speed) {}
  resume(): void { this.previous = null; this.running = true; }
  pause(): void { this.previous = null; this.running = false; }
  restart(): void { this.remainder = 0; this.elapsed = 0; this.previous = null; }
  frame(now: number, tick: () => boolean): 'normal' | 'gap' {
    if (!this.running || !Number.isFinite(now)) return 'normal';
    if (this.previous === null) { this.previous = now; return 'normal'; }
    const dt = now - this.previous; this.previous = now;
    if (dt < 0 || dt > 500) { this.pause(); return 'gap'; }
    this.elapsed += dt; this.remainder += dt;
    const interval = 1000 / this.speed;
    while (this.remainder + 1e-7 >= interval) {
      this.remainder = Math.max(0,this.remainder-interval);
      if (!tick()) { this.pause(); break; }
    }
    return 'normal';
  }
}
