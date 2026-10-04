import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StorageService } from '../../src/core/StorageService';
import { TelemetryService } from '../../src/core/TelemetryService';
import { CreditService } from '../../src/core/CreditService';

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

function services(backend: Storage = new MemoryStorage()) {
  const storage = new StorageService(backend);
  const telemetry = new TelemetryService(storage);
  // The prototype disables limits; retain meaningful regression coverage of the future enabled wallet.
  const credits = new CreditService(storage, telemetry, true);
  return { storage, telemetry, credits, backend };
}

beforeEach(() => { vi.spyOn(console, 'debug').mockImplementation(() => {}); });
afterEach(() => vi.restoreAllMocks());

describe('persistent settings and recovery', () => {
  it('preserves numeric and boolean values across service instances', () => {
    const backend = new MemoryStorage();
    const storage = new StorageService(backend);
    storage.writeNumber('best', 4567);
    storage.writeBoolean('muted', true);
    const reloaded = new StorageService(backend);
    expect(reloaded.readNumber('best', 0)).toBe(4567);
    expect(reloaded.readBoolean('muted', false)).toBe(true);
    reloaded.remove('best');
    expect(reloaded.readNumber('best', 0)).toBe(0);
  });

  it.each(['not json', 'null', 'NaN', 'Infinity', '-1', '4', '1.5', '"2"', '{}'])('invalid credit data %s recovers safely', raw => {
    const backend = new MemoryStorage();
    backend.setItem('orbit-shift:v1:credits', raw);
    const { credits } = services(backend);
    expect(Number.isInteger(credits.credits)).toBe(true);
    expect(credits.credits).toBeGreaterThanOrEqual(0);
    expect(credits.credits).toBeLessThanOrEqual(3);
  });

  it('continues in memory when reads and writes are blocked', () => {
    const unavailable = {
      get length(): number { throw new Error('blocked'); },
      clear() { throw new Error('blocked'); },
      getItem(): string | null { throw new Error('blocked'); },
      key(): string | null { throw new Error('blocked'); },
      removeItem() { throw new Error('blocked'); },
      setItem() { throw new Error('quota'); },
    };
    const { storage, credits } = services(unavailable);
    expect(credits.credits).toBe(3);
    credits.consume('one');
    expect(credits.credits).toBe(2);
    storage.writeNumber('best', 234);
    expect(storage.readNumber('best', 0)).toBe(234);
    storage.writeBoolean('muted', true);
    expect(storage.readBoolean('muted', false)).toBe(true);
    storage.remove('best');
    expect(storage.readNumber('best', 0)).toBe(0);
  });

  it('a denied write does not resurrect a stale readable backend value', () => {
    const backend = new MemoryStorage();
    backend.setItem('orbit-shift:v1:best', '12');
    vi.spyOn(backend, 'setItem').mockImplementation(() => { throw new Error('full'); });
    const storage = new StorageService(backend);
    storage.writeNumber('best', 99);
    expect(storage.readNumber('best', 0)).toBe(99);
  });

  it('a denied removal stays removed during the session despite a readable stale backend', () => {
    const backend = new MemoryStorage();
    backend.setItem('orbit-shift:v1:best', '99');
    backend.setItem('orbit-shift:v1:muted', 'true');
    vi.spyOn(backend, 'removeItem').mockImplementation(() => { throw new Error('read only'); });
    const storage = new StorageService(backend);
    expect(storage.readNumber('best', 0)).toBe(99);
    storage.remove('best');
    storage.remove('muted');
    expect(storage.readNumber('best', 0)).toBe(0);
    expect(storage.readBoolean('muted', false)).toBe(false);
  });
});

describe('telemetry retention', () => {
  it('bounds retained events and returns copies to callers', () => {
    const { telemetry } = services();
    for (let n = 0; n < 250; n++) telemetry.trackEvent('score', { score: n });
    const events = telemetry.getEvents();
    expect(events).toHaveLength(200);
    expect(events[0].data.score).toBe(50);
    expect(events[199].data.score).toBe(249);
    events[199].data.score = -1;
    expect(telemetry.getEvents()[199].data.score).toBe(249);
  });
});

describe('credit lifecycle and rewarded adapter boundary', () => {
  it('charges only once per death and persists zero across reload', () => {
    const { credits, backend, telemetry } = services();
    expect(credits.credits).toBe(3);
    expect(credits.consume('run-1')).toBe(true);
    expect(credits.consume('run-1')).toBe(false);
    expect(credits.credits).toBe(2);
    credits.consume('run-2');
    credits.consume('run-3');
    expect(credits.consume('run-4')).toBe(false);
    expect(credits.credits).toBe(0);
    expect(services(backend).credits.credits).toBe(0);
    const names = telemetry.getEvents().map(event => event.name);
    expect(names.filter(name => name === 'credit_used')).toHaveLength(3);
    expect(names.filter(name => name === 'credit_zero')).toHaveLength(1);
  });

  it('prevents duplicate rewards while adapter is pending and grants exactly three', async () => {
    const { credits, telemetry } = services();
    for (let n = 0; n < 3; n++) credits.consume(`run-${n}`);
    let finish!: (result: { granted: boolean }) => void;
    const adapter = vi.fn(() => new Promise<{ granted: boolean }>(resolve => { finish = resolve; }));
    const pending = credits.requestRewardedCredit(adapter);
    expect(credits.rewardPending).toBe(true);
    expect(await credits.requestRewardedCredit(adapter)).toBe(false);
    expect(adapter).toHaveBeenCalledTimes(1);
    expect(credits.credits).toBe(0);
    finish({ granted: true });
    expect(await pending).toBe(true);
    expect(credits.credits).toBe(3);
    expect(credits.rewardPending).toBe(false);
    const names = telemetry.getEvents().map(event => event.name);
    expect(names.filter(name => name === 'reward_requested')).toHaveLength(1);
    expect(names.filter(name => name === 'reward_granted')).toHaveLength(1);
  });

  it('failed or rejected rewards leave credits at zero and allow a later retry', async () => {
    const { credits } = services();
    for (let n = 0; n < 3; n++) credits.consume(`run-${n}`);
    expect(await credits.requestRewardedCredit(async () => ({ granted: false }))).toBe(false);
    expect(await credits.requestRewardedCredit(async () => { throw new Error('SDK failure'); })).toBe(false);
    expect(credits.credits).toBe(0);
    expect(credits.rewardPending).toBe(false);
    expect(await credits.requestRewardedCredit(async () => ({ granted: true }))).toBe(true);
    expect(credits.credits).toBe(3);
  });
});
