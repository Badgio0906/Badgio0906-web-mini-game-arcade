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

  /** Inlet/outlet switch ticks: different timbre per selector so they are distinguishable. */
  inlet() { this.tone('sine', 700, 980, 0.06, 0.12); }
  outlet() { this.tone('triangle', 520, 420, 0.07, 0.12); }
  /** Capsule entering the inlet: シュワン. */
  warp() { this.burst(0.18, 0.12, 3000); this.tone('sine', 300, 1400, 0.2, 0.14); }
  /** Rescue pop, pitch climbs with the streak multiplier. */
  pop(step: number) { const f = 660 * 2 ** (Math.min(step, 12) / 12); this.tone('sine', f, f * 1.5, 0.09, 0.2); this.tone('triangle', f * 2, f * 2, 0.05, 0.06, 0.02); }
  /** Rerouted to the regular boat: comic ボヨン, not a failure siren. */
  boing() { this.tone('sine', 220, 140, 0.25, 0.22); this.tone('sine', 140, 260, 0.18, 0.12, 0.12); }
  groupBonus(sameDock: boolean) { (sameDock ? [784, 988, 1175, 1319, 1568] : [784, 988, 1175]).forEach((f, i) => this.tone('triangle', f, f, 0.12, 0.13, i * 0.07)); }
  fanfare() { [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone('triangle', f, f, 0.24, 0.16, i * 0.11)); }
  fail() { [392, 349, 330].forEach((f, i) => this.tone('triangle', f, f * 0.98, 0.25, 0.12, i * 0.16)); }
}
