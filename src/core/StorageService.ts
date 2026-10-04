/** A small, defensive boundary around browser storage. Gameplay survives denied writes. */
export class StorageService {
  private backend?: Storage;
  private memory = new Map<string, string | null>();
  constructor(backend?: Storage, private readonly prefix = 'orbit-shift:v1:') {
    try { this.backend = backend ?? window.localStorage; } catch { this.backend = undefined; }
  }

  private read(key: string): string | null {
    if (this.memory.has(key)) return this.memory.get(key)!;
    try { return this.backend?.getItem(this.prefix + key) ?? this.memory.get(key) ?? null; }
    catch { return this.memory.get(key) ?? null; }
  }

  private write(key: string, value: string): void {
    this.memory.set(key, value);
    try { this.backend?.setItem(this.prefix + key, value); } catch { /* memory remains usable */ }
  }

  readNumber(key: string, fallback: number, min = 0, max = Number.MAX_SAFE_INTEGER): number {
    const value = this.read(key);
    if (value === null || value.trim() === '') return fallback;
    const parsed = Number(value);
    return Number.isFinite(parsed) && Number.isInteger(parsed) && parsed >= min && parsed <= max ? parsed : fallback;
  }
  writeNumber(key: string, value: number): void { if (Number.isFinite(value)) this.write(key, String(value)); }
  readBoolean(key: string, fallback: boolean): boolean {
    const value = this.read(key);
    return value === 'true' ? true : value === 'false' ? false : fallback;
  }
  writeBoolean(key: string, value: boolean): void { this.write(key, String(value)); }
  remove(key: string): void {
    this.memory.set(key, null);
    try { this.backend?.removeItem(this.prefix + key); } catch { /* optional storage */ }
  }
}
