// Small oscillator SFX. The context is created only from a user gesture,
// muted through a master gain and closed on pagehide.

export type Sfx = 'pick' | 'drop' | 'bad' | 'rotate' | 'undo' | 'clear' | 'complete' | 'tap';

export class BentoAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  muted: boolean;

  constructor(muted: boolean) { this.muted = muted; }

  /** Call from pointerdown/keydown handlers only. */
  unlock(): void {
    if (this.ctx) { if (this.ctx.state === 'suspended') void this.ctx.resume().catch(() => {}); return; }
    try {
      const Ctor = window.AudioContext ?? (window as unknown as {webkitAudioContext?: typeof AudioContext}).webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.5;
      this.master.connect(this.ctx.destination);
    } catch {
      this.ctx = null;
    }
  }

  setMuted(m: boolean): void {
    this.muted = m;
    if (this.master && this.ctx) this.master.gain.setValueAtTime(m ? 0 : 0.5, this.ctx.currentTime);
  }

  private tone(freq: number, start: number, dur: number, type: OscillatorType, vol: number, slideTo?: number): void {
    const ctx = this.ctx, master = this.master;
    if (!ctx || !master) return;
    const t = ctx.currentTime + start;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
    osc.onended = () => { osc.disconnect(); g.disconnect(); };
  }

  play(s: Sfx): void {
    if (this.muted || !this.ctx || this.ctx.state !== 'running') return;
    switch (s) {
      case 'tap': this.tone(660, 0, 0.05, 'triangle', 0.12); break;
      case 'pick': this.tone(520, 0, 0.07, 'triangle', 0.2, 780); break;
      case 'rotate': this.tone(880, 0, 0.05, 'square', 0.06); this.tone(1175, 0.04, 0.05, 'square', 0.05); break;
      // A wooden "tok" when food lands in the lacquer box.
      case 'drop': this.tone(240, 0, 0.09, 'sine', 0.45, 140); this.tone(1200, 0, 0.03, 'triangle', 0.08); break;
      case 'bad': this.tone(170, 0, 0.16, 'sawtooth', 0.12, 120); break;
      case 'undo': this.tone(600, 0, 0.08, 'triangle', 0.16, 360); break;
      case 'clear': [523, 659, 784, 1047].forEach((f, i) => this.tone(f, i * 0.08, 0.22, 'triangle', 0.22)); break;
      case 'complete': [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => this.tone(f, i * 0.11, 0.3, 'triangle', 0.22)); break;
    }
  }

  close(): void {
    const ctx = this.ctx;
    this.ctx = null;
    this.master = null;
    if (ctx) void ctx.close().catch(() => {});
  }
}
