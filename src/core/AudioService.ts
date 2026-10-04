import type { StorageService } from './StorageService';

export class AudioService {
  private context?: AudioContext;
  private silent: boolean;
  constructor(private storage: StorageService) { this.silent = storage.readBoolean('muted', false); }
  get muted(): boolean { return this.silent; }
  async unlock(): Promise<void> {
    if (this.silent) return;
    try { this.context ??= new AudioContext(); if (this.context.state === 'suspended') await this.context.resume(); }
    catch { /* Audio unsupported: the game remains playable. */ }
  }
  toggle(): boolean {
    this.silent = !this.silent;
    this.storage.writeBoolean('muted', this.silent);
    if (!this.silent) void this.unlock();
    return this.silent;
  }
  tone(frequency: number, endFrequency: number, duration: number, type: OscillatorType, offset = 0, volume = 0.05): void {
    if (this.silent || !this.context || this.context.state !== 'running') return;
    try {
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      const start = this.context.currentTime + offset;
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, start);
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, endFrequency), start + duration);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(volume, start + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      oscillator.connect(gain); gain.connect(this.context.destination);
      oscillator.start(start); oscillator.stop(start + duration + 0.02);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    } catch { /* Browser audio shutdown must not stop a run. */ }
  }
  destroy(): void { void this.context?.close().catch(() => undefined); }
}
