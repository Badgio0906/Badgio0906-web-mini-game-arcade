import {describe, expect, it} from 'vitest';
import {BentoStore, BEST_KEY, MUTE_KEY, parseBest} from '../../src/games/game037/save';

class MapStorage {
  data = new Map<string, string>();
  getItem(k: string) { return this.data.has(k) ? this.data.get(k)! : null; }
  setItem(k: string, v: string) { this.data.set(k, String(v)); }
}

describe('game037 storage', () => {
  it('only touches the two game037 keys and keeps the higher BEST', () => {
    const backend = new MapStorage();
    backend.setItem('web-mini-arcade:v1:game035:state', 'untouched');
    const store = new BentoStore(backend);
    expect(store.best()).toBe(0);
    expect(store.offerBest(4200)).toBe(true);
    expect(store.offerBest(4100)).toBe(false);
    expect(store.offerBest(6001)).toBe(false);
    store.setMuted(true);
    expect([...backend.data.keys()].sort()).toEqual([BEST_KEY, MUTE_KEY, 'web-mini-arcade:v1:game035:state'].sort());
    expect(backend.getItem('web-mini-arcade:v1:game035:state')).toBe('untouched');
    expect(new BentoStore(backend).best()).toBe(4200);
    expect(new BentoStore(backend).muted()).toBe(true);
    expect(store.persistent).toBe(true);
  });

  it('treats corrupt or out-of-range BEST as 0', () => {
    for (const raw of ['', '{', 'null', '{"best":-1}', '{"best":6001}', '{"best":12.5}', '"9"', 'x'.repeat(100)]) expect(parseBest(raw)).toBe(0);
    expect(parseBest('{"best":5999}')).toBe(5999);
  });

  it('falls back to memory when storage refuses and reports non-persistent', () => {
    const throwing = {getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); }};
    const store = new BentoStore(throwing);
    expect(store.best()).toBe(0);
    expect(store.offerBest(3000)).toBe(true);
    expect(store.best()).toBe(3000);
    expect(store.persistent).toBe(false);
    const none = new BentoStore(null);
    expect(none.persistent).toBe(false);
    none.setMuted(true);
    expect(none.muted()).toBe(true);
  });
});
