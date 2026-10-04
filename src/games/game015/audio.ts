import type { StorageService } from '../../core/StorageService';
/** Unscheduled chip voices can be stopped immediately on pause, mute or navigation. */
export class FallAudio {
  private context?: AudioContext;
  private voices = new Set<OscillatorNode>();
  private running = false;
  private beat = 0;
  private nextBeat = 0;
  private silent: boolean;
  constructor(private storage: StorageService) { this.silent = storage.readBoolean('muted', false); }
  get muted(): boolean { return this.silent; }
  async unlock(): Promise<void> { if (this.silent) return; try { this.context ??= new AudioContext(); if (this.context.state === 'suspended') await this.context.resume(); } catch { /* audio is optional */ } }
  toggle(): boolean { this.silent = !this.silent; this.storage.writeBoolean('muted', this.silent); if (this.silent) this.stopVoices(); else void this.unlock(); return this.silent; }
  setPlaying(value: boolean): void { this.running = value; this.nextBeat = 0; if (!value) this.stopVoices(); }
  private stopVoices(): void { for (const v of this.voices) { try { v.stop(); } catch { /* already ended */ } } this.voices.clear(); }
  tone(from: number, to: number, duration = .08, volume = .025, wave: OscillatorType = 'square'): void {
    const c = this.context; if (this.silent || !c || c.state !== 'running') return;
    try {
      const o = c.createOscillator(), g = c.createGain(), now = c.currentTime;
      o.type = wave; o.frequency.setValueAtTime(from, now); o.frequency.exponentialRampToValueAtTime(Math.max(30, to), now + duration);
      g.gain.setValueAtTime(volume, now); g.gain.exponentialRampToValueAtTime(.0001, now + duration);
      o.connect(g); g.connect(c.destination); this.voices.add(o); o.start(); o.stop(now + duration);
      o.onended = () => { this.voices.delete(o); o.disconnect(); g.disconnect(); };
    } catch { /* browser shutdown */ }
  }
  tick(seconds: number, depth: number, falling: boolean): void {
    if (!this.running || this.silent || seconds < this.nextBeat) return;
    this.nextBeat = seconds + .24;
    const notes = depth < 500 ? [262, 330, 392, 330, 294, 349, 440, 349] : [220, 262, 311, 247, 196, 247, 294, 233];
    const note = notes[this.beat++ % notes.length]; this.tone(note, note, .085, .009, 'triangle');
    if (falling && this.beat % 2 === 0) this.tone(90, 60, .06, .004, 'sawtooth');
  }
  destroy(): void { this.running = false; this.stopVoices(); void this.context?.close().catch(() => undefined); }
}
