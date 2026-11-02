// GAPS samples, with the original synthesis as a loading/error fallback. Scoring never waits for audio.
import bank from '../../../public/assets/game060/gaps-20261102/manifest.json';
const MAX_VOICES = 10;
type Cue = keyof typeof bank.sounds;
type Voice = { out: GainNode; nodes: AudioNode[]; priority: number };

export class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private voices = new Map<AudioScheduledSourceNode, Voice>();
  private buffers = new Map<Cue, AudioBuffer>();
  private bytes: Promise<Map<Cue, ArrayBuffer>>;
  private decoding: Promise<void> | null = null;
  private last = new Map<Cue, number>();
  private variation = 0;
  private _muted = false;
  private wantsRunning = false;
  private suspending: Promise<void> | null = null;

  constructor() {
    const base = new URL(import.meta.env.DEV ? './assets/game060/gaps-20261102/' : './assets/gaps-20261102/', document.baseURI);
    this.bytes = Promise.all((Object.entries(bank.sounds) as [Cue, { file: string }][]).map(async ([cue, sound]) => {
      try {
        const response = await fetch(new URL(sound.file, base));
        if (!response.ok) return null;
        return [cue, await response.arrayBuffer()] as const;
      } catch { return null; }
    })).then(rows => new Map(rows.filter((row): row is readonly [Cue, ArrayBuffer] => row !== null)));
  }

  get muted() { return this._muted; }
  set muted(value: boolean) {
    this._muted = value;
    if (value) this.stop();
    if (this.master) this.master.gain.value = value ? 0 : 0.55;
  }

  /** Must be called from a user gesture. */
  unlock() {
    this.wantsRunning = true;
    try { if (!this.ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -14; comp.ratio.value = 8; comp.attack.value = 0.002; comp.release.value = 0.12;
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.55;
      this.master.connect(comp).connect(this.ctx.destination);
      const len = Math.floor(this.ctx.sampleRate * 0.6);
      this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = this.noise.getChannelData(0);
      let seed = 12345;
      for (let i = 0; i < len; i++) { seed = (seed * 1103515245 + 12345) & 0x7fffffff; data[i] = (seed / 0x3fffffff - 1); }
    }
    const context = this.ctx;
    const resume = () => {
      if (this.ctx === context && this.wantsRunning) void context.resume().catch(() => {});
    };
    resume();
    // suspend() changes state asynchronously. An immediate explicit resume must win over it.
    if (this.suspending) void this.suspending.then(resume);
    this.decoding ??= this.bytes.then(async bytes => {
      await Promise.all([...bytes].map(async ([cue, data]) => {
        try {
          const buffer = await context.decodeAudioData(data.slice(0));
          if (this.ctx === context) this.buffers.set(cue, buffer);
        } catch { /* The original cue remains available if decoding is refused. */ }
      }));
    });
    } catch { /* A denied audio device must leave the game playable. */ }
  }
  suspend() {
    this.wantsRunning = false;
    this.stop();
    if (this.ctx && this.ctx.state !== 'closed') {
      const pending = this.ctx.suspend().catch(() => {});
      this.suspending = pending;
      void pending.then(() => { if (this.suspending === pending) this.suspending = null; });
    }
  }
  resume() { this.unlock(); }
  close() {
    this.wantsRunning = false;
    this.stop();
    void this.ctx?.close().catch(() => {});
    this.ctx = null; this.master = null; this.noise = null;
    this.decoding = null; this.suspending = null; this.buffers.clear();
  }
  get state() { return this.ctx?.state ?? 'none'; }

  stop() {
    for (const source of [...this.voices.keys()]) this.finish(source, true);
    this.last.clear();
  }

  private finish(source: AudioScheduledSourceNode, stop = false) {
    const voice = this.voices.get(source);
    if (!voice) return;
    this.voices.delete(source);
    source.onended = null;
    if (stop) try { source.stop(); } catch { /* Already ended. */ }
    source.disconnect();
    for (const node of voice.nodes) node.disconnect();
    voice.out.disconnect();
  }

  private track(source: AudioScheduledSourceNode, out: GainNode, nodes: AudioNode[], priority: number) {
    this.voices.set(source, { out, nodes, priority });
    source.onended = () => this.finish(source);
  }

  /** Missing samples fall back immediately; no sound is queued across a pause or a new run. */
  private sample(cue: Cue, priority = 50) {
    if (this.muted || this.ctx?.state !== 'running') return true;
    const buffer = this.buffers.get(cue);
    if (!buffer) return false;
    const now = this.ctx.currentTime;
    // A simultaneous cooldown completion produces one soft notification.
    const gap = cue === 'slotReady' ? .08 : cue === 'reject' ? .07 : .015;
    if (now - (this.last.get(cue) ?? -100) < gap) return true;
    this.last.set(cue, now);
    const v = this.voice(priority);
    if (!v) return true;
    const source = v.ctx.createBufferSource();
    source.buffer = buffer;
    v.out.gain.value = cue === 'slotReady' ? .75 : .95;
    source.connect(v.out);
    this.track(source, v.out, [], priority);
    source.start(v.t);
    return true;
  }

  private voice(priority = 40): { ctx: AudioContext; out: GainNode; t: number } | null {
    if (this.muted || !this.ctx || !this.master || this.ctx.state !== 'running') return null;
    if (this.voices.size >= MAX_VOICES) {
      const victim = [...this.voices].sort((a, b) => a[1].priority - b[1].priority)[0];
      if (victim[1].priority > priority) return null;
      this.finish(victim[0], true);
    }
    const out = this.ctx.createGain();
    out.connect(this.master);
    const t = this.ctx.currentTime;
    return { ctx: this.ctx, out, t };
  }

  private tone(type: OscillatorType, f0: number, f1: number, dur: number, vol: number, delay = 0) {
    const v = this.voice(); if (!v) return;
    const o = v.ctx.createOscillator(); const g = v.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, v.t + delay); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), v.t + delay + dur);
    g.gain.setValueAtTime(0.0001, v.t + delay); g.gain.exponentialRampToValueAtTime(vol, v.t + delay + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, v.t + delay + dur);
    o.connect(g).connect(v.out); this.track(o, v.out, [g], 40); o.start(v.t + delay); o.stop(v.t + delay + dur + 0.02);
  }

  private burst(dur: number, vol: number, hp: number, delay = 0) {
    const v = this.voice(); if (!v || !this.noise) return;
    const src = v.ctx.createBufferSource(); src.buffer = this.noise;
    const f = v.ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp;
    const g = v.ctx.createGain();
    g.gain.setValueAtTime(vol, v.t + delay); g.gain.exponentialRampToValueAtTime(0.0001, v.t + delay + dur);
    src.connect(f).connect(g).connect(v.out); this.track(src, v.out, [f, g], 40); src.start(v.t + delay); src.stop(v.t + delay + dur + 0.02);
  }

  reserve() { if (this.sample('reserve', 50)) return; this.tone('square', 1320, 1760, 0.07, 0.12); this.tone('sine', 660, 660, 0.09, 0.08, 0.03); }
  reject() { if (this.sample('reject', 25)) return; this.tone('triangle', 220, 180, 0.08, 0.1); }
  slotReady() { if (this.sample('slotReady', 20)) return; this.tone('sine', 1500, 1500, 0.05, 0.05); }
  /** Crack (high noise) + low thump + metallic pickups that rise with chain length. */
  thunder(kills: number) {
    const variant = ++this.variation % 2 + 1;
    const cue: Cue = kills >= 6 ? 'thunderSix' : kills >= 3 ? (variant === 1 ? 'thunderCluster1' : 'thunderCluster2') : (variant === 1 ? 'thunder1' : 'thunder2');
    if (this.sample(cue, kills >= 6 ? 90 : 70)) return;
    this.burst(0.18, 0.5, 2400);
    this.tone('sine', 120, 42, 0.42, 0.55);
    this.burst(0.5, 0.18, 300, 0.03);
    for (let i = 0; i < Math.min(kills, 6); i++) this.tone('triangle', 880 * 2 ** (i / 6), 1200 * 2 ** (i / 6), 0.09, 0.14, 0.08 + i * 0.06);
    if (kills >= 6) this.tone('sawtooth', 220, 880, 0.35, 0.12, 0.45);
  }
  miss() { if (this.sample('miss', 45)) return; this.burst(0.12, 0.25, 1800); this.tone('sine', 90, 50, 0.2, 0.25); }
  shield() { if (this.sample('shield', 85)) return; this.tone('square', 300, 120, 0.3, 0.16); }
  bossHit() { if (this.sample('bossHit', 85)) return; this.tone('square', 180, 90, 0.25, 0.25); this.tone('triangle', 1400, 700, 0.2, 0.12, 0.05); }
  fanfare() { if (this.sample('fanfare', 100)) return; [523, 659, 784, 1047].forEach((f, i) => this.tone('triangle', f, f, 0.22, 0.16, i * 0.12)); }
  fail() { if (this.sample('fail', 100)) return; [392, 330, 262].forEach((f, i) => this.tone('triangle', f, f * 0.98, 0.25, 0.14, i * 0.16)); }
}
