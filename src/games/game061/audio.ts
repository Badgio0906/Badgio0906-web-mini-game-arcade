// Small game-specific WebAudio layer: synthesized SE only, voice cap, master limiter, mute, cleanup.
// Sound success never affects scoring.
const MAX_VOICES = 10;

export class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private voices = 0;
  muted = false;

  /** Must be called from a user gesture. */
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -14; comp.ratio.value = 8; comp.attack.value = 0.002; comp.release.value = 0.12;
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.55;
      this.master.connect(comp).connect(this.ctx.destination);
      const len = Math.floor(this.ctx.sampleRate * 0.6);
      this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = this.noise.getChannelData(0);
      let seed = 12345;
      for (let i = 0; i < len; i++) { seed = (seed * 1103515245 + 12345) & 0x7fffffff; data[i] = (seed / 0x3fffffff - 1); }
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }
  suspend() { if (this.ctx && this.ctx.state === 'running') void this.ctx.suspend(); }
  resume() { if (this.ctx && this.ctx.state === 'suspended') void this.ctx.resume(); }
  close() { void this.ctx?.close(); this.ctx = null; this.master = null; this.voices = 0; }
  get state() { return this.ctx?.state ?? 'none'; }

  private voice(dur: number): { ctx: AudioContext; out: GainNode; t: number } | null {
    if (this.muted || !this.ctx || !this.master || this.ctx.state !== 'running' || this.voices >= MAX_VOICES) return null;
    this.voices++;
    const out = this.ctx.createGain();
    out.connect(this.master);
    const t = this.ctx.currentTime;
    window.setTimeout(() => { this.voices--; out.disconnect(); }, (dur + 0.1) * 1000);
    return { ctx: this.ctx, out, t };
  }

  private tone(type: OscillatorType, f0: number, f1: number, dur: number, vol: number, delay = 0) {
    const v = this.voice(dur + delay); if (!v) return;
    const o = v.ctx.createOscillator(); const g = v.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, v.t + delay); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), v.t + delay + dur);
    g.gain.setValueAtTime(0.0001, v.t + delay); g.gain.exponentialRampToValueAtTime(vol, v.t + delay + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, v.t + delay + dur);
    o.connect(g).connect(v.out); o.start(v.t + delay); o.stop(v.t + delay + dur + 0.02);
  }

  private burst(dur: number, vol: number, hp: number, delay = 0) {
    const v = this.voice(dur + delay); if (!v || !this.noise) return;
    const src = v.ctx.createBufferSource(); src.buffer = this.noise;
    const f = v.ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp;
    const g = v.ctx.createGain();
    g.gain.setValueAtTime(vol, v.t + delay); g.gain.exponentialRampToValueAtTime(0.0001, v.t + delay + dur);
    src.connect(f).connect(g).connect(v.out); src.start(v.t + delay); src.stop(v.t + delay + dur + 0.02);
  }

  /** Heavy shutter clack for a slide; gear pairs add a second, lower clack. */
  slide(gear: boolean) { this.burst(0.06, 0.35, 900); this.tone('square', 140, 90, 0.08, 0.2); if (gear) { this.burst(0.06, 0.25, 500, 0.05); this.tone('square', 95, 70, 0.08, 0.16, 0.05); } }
  select() { this.tone('triangle', 900, 900, 0.04, 0.08); }
  locked() { this.tone('triangle', 200, 170, 0.06, 0.08); }
  /** Each broken row rises in pitch (ガン、ガン、ガン); the 4th is a low ドガーン. */
  fire(rows: number) {
    this.burst(0.08, 0.3, 1500);
    for (let i = 0; i < rows; i++) {
      if (i === 3) { this.tone('sine', 110, 38, 0.6, 0.6, 0.27); this.burst(0.5, 0.35, 120, 0.27); }
      else { this.tone('square', 330 * 2 ** (i / 4), 250 * 2 ** (i / 4), 0.1, 0.22, i * 0.09); this.burst(0.07, 0.25, 2600, i * 0.09); }
    }
    if (rows === 0) this.tone('square', 160, 120, 0.12, 0.2, 0.03);
  }
  roomClear(full: boolean) { (full ? [523, 784, 1047] : [523, 659]).forEach((f, i) => this.tone('triangle', f, f, 0.18, 0.14, 0.5 + i * 0.09)); }
  fanfare() { [392, 523, 659, 784, 1047].forEach((f, i) => this.tone('triangle', f, f, 0.24, 0.16, i * 0.11)); }
  fail() { [392, 330, 262].forEach((f, i) => this.tone('triangle', f, f * 0.98, 0.25, 0.14, i * 0.16)); }
}
