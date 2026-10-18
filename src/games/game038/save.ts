const PREFIX = 'web-mini-arcade:v1:game038:';
export class RainStore {
  private memory = new Map<string, string>();
  persistent = true;
  constructor(private backend: Pick<Storage, 'getItem' | 'setItem'> | null) { if (!backend) this.persistent = false; }
  private get(key: string): string | null { if (this.memory.has(key)) return this.memory.get(key)!; try { return this.backend?.getItem(PREFIX + key) ?? null; } catch { this.persistent = false; return null; } }
  private set(key: string, value: string): void { this.memory.set(key, value); try { if (!this.backend) throw Error('memory'); this.backend.setItem(PREFIX + key, value); } catch { this.persistent = false; } }
  best(): number | null { const raw = this.get('best-r1'); if (raw === null || !/^-?\d{1,6}$/.test(raw)) return null; const v = Number(raw); return v >= -100000 && v <= 100000 ? v : null; }
  offer(score: number, won: boolean, practice: boolean): boolean { if (!won || practice || !Number.isInteger(score) || Math.abs(score) > 100000 || score <= (this.best() ?? -Infinity)) return false; this.set('best-r1', String(score)); return true; }
  muted(): boolean { return this.get('mute') === '1'; }
  mute(value: boolean): void { this.set('mute', value ? '1' : '0'); }
  learned(): boolean { return this.get('learned') === '1'; }
  learn(): void { this.set('learned', '1'); }
}
