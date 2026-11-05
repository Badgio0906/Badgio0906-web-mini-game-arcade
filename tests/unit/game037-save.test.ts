import {describe, expect, it} from 'vitest';
import {BentoStore, BEST_KEY, CHECKPOINT_KEY, LEGACY_BEST_KEY, MUTE_KEY, parseBest, parseCheckpoint} from '../../src/games/game037/save';
import {STAGES} from '../../src/games/game037/model';

class MapStorage {
  data = new Map<string, string>();
  getItem(k: string) { return this.data.has(k) ? this.data.get(k)! : null; }
  setItem(k: string, v: string) { this.data.set(k, String(v)); }
  removeItem(k: string) { this.data.delete(k); }
}

const results = (n: number) => Array.from({length: n}, (_, i) => ({stageIndex: i, size: STAGES[i].size, activeMs: 1000, rotates: 0, undos: 0, score: 900}));

describe('game037 storage (rules v2)', () => {
  it('only touches game037 keys, keeps the v1 BEST untouched, and keeps the higher BEST', () => {
    const backend = new MapStorage();
    backend.setItem('web-mini-arcade:v1:game035:state', 'untouched');
    backend.setItem(LEGACY_BEST_KEY, '{"best":5500}');
    const store = new BentoStore(backend);
    expect(store.best()).toEqual({best: 0, cleared: 0});
    expect(store.offerBest(900, 1)).toBe(true);
    expect(store.offerBest(1800, 2)).toBe(true);
    expect(store.offerBest(1700, 2)).toBe(false);
    expect(store.offerBest(2000, 1)).toBe(false); // more than 1000 per cleared bento is impossible
    store.setMuted(true);
    store.saveCheckpoint({sizeIndex: 1, results: results(6)});
    expect([...backend.data.keys()].sort()).toEqual([BEST_KEY, CHECKPOINT_KEY, LEGACY_BEST_KEY, MUTE_KEY, 'web-mini-arcade:v1:game035:state'].sort());
    expect(backend.getItem(LEGACY_BEST_KEY)).toBe('{"best":5500}');
    expect(backend.getItem('web-mini-arcade:v1:game035:state')).toBe('untouched');
    const again = new BentoStore(backend);
    expect(again.best()).toEqual({best: 1800, cleared: 2});
    expect(again.muted()).toBe(true);
    expect(again.checkpoint()?.sizeIndex).toBe(1);
    again.saveCheckpoint(null);
    expect(backend.getItem(CHECKPOINT_KEY)).toBeNull();
  });

  it('treats corrupt or out-of-range BEST and checkpoints as absent', () => {
    for (const raw of ['', '{', 'null', '{"best":-1,"cleared":1}', '{"best":30001,"cleared":30}', '{"best":1500,"cleared":1}', '{"best":12.5,"cleared":1}', 'x'.repeat(100)]) expect(parseBest(raw)).toEqual({best: 0, cleared: 0});
    expect(parseBest('{"best":5999,"cleared":6}')).toEqual({best: 5999, cleared: 6});
    expect(parseCheckpoint(JSON.stringify({sizeIndex: 2, results: results(12)}))?.results).toHaveLength(12);
    expect(parseCheckpoint(JSON.stringify({sizeIndex: 2, results: results(11)}))).toBeNull();
    expect(parseCheckpoint(JSON.stringify({sizeIndex: 0, results: []}))).toBeNull();
    expect(parseCheckpoint(JSON.stringify({sizeIndex: 5, results: results(30)}))).toBeNull();
    const wrongSize = results(6).map((r, i) => i === 3 ? {...r, size: 5} : r);
    expect(parseCheckpoint(JSON.stringify({sizeIndex: 1, results: wrongSize}))).toBeNull();
    expect(parseCheckpoint('{')).toBeNull();
  });

  it('falls back to memory when storage refuses and reports non-persistent', () => {
    const throwing = {getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); }, removeItem() { throw new Error('denied'); }};
    const store = new BentoStore(throwing);
    expect(store.best().best).toBe(0);
    expect(store.offerBest(3000, 6)).toBe(true);
    expect(store.best().best).toBe(3000);
    expect(store.persistent).toBe(false);
    const none = new BentoStore(null);
    expect(none.persistent).toBe(false);
    none.setMuted(true);
    expect(none.muted()).toBe(true);
  });
});
