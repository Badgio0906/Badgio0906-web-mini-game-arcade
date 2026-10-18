const PREFIX = 'web-mini-arcade:v1:game017:umbrella-r3:';
export class RainStore {
  private memory = new Map<string, string>();
  persistent = true;
  constructor(private backend: Pick<Storage, 'getItem' | 'setItem'> | null) { if (!backend) this.persistent = false; }
  private get(key: string): string | null { if (this.memory.has(key)) return this.memory.get(key)!; try { return this.backend?.getItem(PREFIX + key) ?? null; } catch { this.persistent = false; return null; } }
  private set(key: string, value: string): void { this.memory.set(key, value); try { if (!this.backend) throw Error('memory'); this.backend.setItem(PREFIX + key, value); } catch { this.persistent = false; } }
  best(): number | null { const raw = this.get('best'); if (raw === null || !/^-?\d{1,6}$/.test(raw)) return null; const v = Number(raw); return v >= -100000 && v <= 100000 ? v : null; }
  offer(score: number, won: boolean, practice: boolean): boolean { if (!won || practice || !Number.isInteger(score) || Math.abs(score) > 100000 || score <= (this.best() ?? -Infinity)) return false; this.set('best', String(score)); return true; }
  legacyBests(): { original: number | null; relay: number | null } {
    const read = (key: string): number | null => {
      try { const raw = this.backend?.getItem('web-mini-arcade:v1:game017:' + key); if (!raw || !/^\d{1,15}$/.test(raw)) return null; const value = Number(raw); return Number.isSafeInteger(value) ? value : null; }
      catch { this.persistent = false; return null; }
    };
    return { original: read('best'), relay: read('bestRelayV2') };
  }
  muted(): boolean { return this.get('mute') === '1'; }
  mute(value: boolean): void { this.set('mute', value ? '1' : '0'); }
  learned(): boolean { return this.get('learned') === '1'; }
  learn(): void { this.set('learned', '1'); }
}
