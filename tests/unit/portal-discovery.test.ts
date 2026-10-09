import { describe, expect, it } from 'vitest';
import { filterCatalog, filterGames, gameCatalog, historicalGameCatalog, type GameCatalogEntry } from '../../src/data/gameCatalog';
import { tagsFor } from '../../src/data/tagCatalog';
import { activeTagOptions, FAVORITES_KEY, parseFavorites, prioritizeFavorites, readFavorites, saveFavorites } from '../../src/portal/discovery';

// Mixed states are a synthetic fixture, never a completion declaration for real games.
const fixture: readonly GameCatalogEntry[] = [
  { ...gameCatalog[0], id: 'alpha', releaseOrder: 3, developmentStatus: 'trial', tags: tagsFor(['puzzle', 'brain-training']) },
  { ...gameCatalog[0], id: 'beta', releaseOrder: 1, developmentStatus: 'complete', tags: tagsFor(['puzzle']) },
  { ...gameCatalog[0], id: 'gamma', releaseOrder: 2, developmentStatus: 'trial', tags: tagsFor(['brain-training']) },
  { ...gameCatalog[0], id: 'old', releaseOrder: 4, status: 'retired', developmentStatus: 'complete', tags: tagsFor(['puzzle', 'meeting']) },
];
const ids = (games: readonly GameCatalogEntry[]) => games.map(game => game.id);
const active = fixture.filter(game => game.status === 'active');
const knownIds = new Set(active.map(game => game.id));

describe('normal tag filtering preserves legacy AND and excludes retirement', () => {
  it('no tags returns all active games for both modes', () => {
    expect(filterCatalog()).toHaveLength(30);
    for (const mode of ['or', 'and'] as const) expect(ids(filterGames(fixture, [], mode))).toEqual(['alpha', 'beta', 'gamma']);
  });
  it('OR with one tag matches it', () => expect(ids(filterGames(fixture, ['puzzle'], 'or'))).toEqual(['alpha', 'beta']));
  it('OR with multiple tags matches either without duplication', () => expect(ids(filterGames(fixture, ['puzzle', 'brain-training'], 'or'))).toEqual(['alpha', 'beta', 'gamma']));
  it('AND with one tag matches it', () => expect(ids(filterGames(fixture, ['puzzle'], 'and'))).toEqual(['alpha', 'beta']));
  it('AND with multiple tags excludes games missing one condition', () => expect(ids(filterGames(fixture, ['puzzle', 'brain-training'], 'and'))).toEqual(['alpha']));
  it('legacy one-argument behavior remains AND', () => expect(ids(filterCatalog(['jump', 'animal']))).toEqual(['game019']));
  it('unsatisfied AND yields no results', () => expect(filterGames(fixture, ['puzzle', 'reflex'], 'and')).toEqual([]));
  it('retired games never appear, including retired-only tags', () => {
    expect(filterGames(historicalGameCatalog, ['meeting'], 'or')).toEqual([]);
    expect(filterCatalog([], 'or').some(game => game.id === 'game010')).toBe(false);
  });
  it('candidates come from tagCatalog and include full game tags beyond the card four', () => {
    const options = activeTagOptions(historicalGameCatalog);
    expect(options.some(tag => tag.id === 'meeting')).toBe(false);
    expect(options.some(tag => tag.id === 'stealth')).toBe(false);
    expect(options.find(tag => tag.id === 'wind')).toEqual({ id: 'wind', label: '風', count: 1 });
    expect(activeTagOptions(fixture).find(tag => tag.id === 'puzzle')?.count).toBe(2);
  });
});

describe('development state is distinct from tags and retirement', () => {
  it('current games default to trial without an author declaration', () => expect(historicalGameCatalog.every(game => game.developmentStatus === 'trial')).toBe(true));
  it('no selected state includes trial and complete', () => expect(ids(filterGames(fixture))).toEqual(['alpha', 'beta', 'gamma']));
  it('trial only', () => expect(ids(filterGames(fixture, [], 'or', ['trial']))).toEqual(['alpha', 'gamma']));
  it('complete only', () => expect(ids(filterGames(fixture, [], 'or', ['complete']))).toEqual(['beta']));
  it('both states includes both even in normal-tag AND mode', () => expect(ids(filterGames(fixture, [], 'and', ['trial', 'complete']))).toEqual(['alpha', 'beta', 'gamma']));
  it('state AND normal tag OR', () => expect(ids(filterGames(fixture, ['puzzle', 'brain-training'], 'or', ['complete']))).toEqual(['beta']));
  it('state AND normal tag AND', () => expect(ids(filterGames(fixture, ['puzzle', 'brain-training'], 'and', ['trial']))).toEqual(['alpha']));
  it('cannot turn retirement into a development state', () => expect(filterGames(fixture, ['meeting'], 'or', ['complete'])).toEqual([]));
});

describe('favorites prioritize without filtering or mutating the catalog', () => {
  it('favorite above every non-favorite', () => expect(ids(prioritizeFavorites(active, new Set(['alpha'])))).toEqual(['alpha', 'beta', 'gamma']));
  it('non-favorites always remain with their release order', () => {
    const sorted = prioritizeFavorites(active, new Set(['alpha']));
    expect(sorted).toHaveLength(3); expect(ids(sorted).slice(1)).toEqual(['beta', 'gamma']);
    expect(ids(active)).toEqual(['alpha', 'beta', 'gamma']);
  });
  it('multiple favorites retain release order within their group', () => expect(ids(prioritizeFavorites(active, new Set(['alpha', 'gamma'])))).toEqual(['gamma', 'alpha', 'beta']));
  it('tag filtering still prioritizes favorites', () => expect(ids(prioritizeFavorites(filterGames(fixture, ['puzzle'], 'or'), new Set(['alpha'])))).toEqual(['alpha', 'beta']));
  it('removing a favorite returns it to release order', () => {
    const favorites = new Set(['alpha']); favorites.delete('alpha');
    expect(ids(prioritizeFavorites(active, favorites))).toEqual(['beta', 'gamma', 'alpha']);
  });
  it('future non-favorite stays present after favorites', () => {
    const future = { ...active[0], id: 'future', releaseOrder: 100 };
    expect(ids(prioritizeFavorites([...active, future], new Set(['alpha'])))).toEqual(['alpha', 'beta', 'gamma', 'future']);
  });
});

describe('favorites browser storage is untrusted and optional', () => {
  it.each([null, '{', '{}', 'null', '42', '"alpha"'])('invalid/non-array value %s recovers', raw => expect([...parseFavorites(raw, knownIds)]).toEqual([]));
  it('ignores unknown, retired, non-string and duplicate values', () => expect([...parseFavorites('["alpha","missing","old",42,null,{},"alpha"]', knownIds)]).toEqual(['alpha']));
  it('reload restores stable IDs using only its dedicated key', () => {
    const values = new Map<string, string>();
    const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
    expect(saveFavorites(storage, new Set(['gamma', 'alpha']))).toBe(true);
    expect(values.get(FAVORITES_KEY)).toBe('["gamma","alpha"]');
    expect([...readFavorites(storage, knownIds)]).toEqual(['gamma', 'alpha']);
    expect([...values.keys()]).toEqual([FAVORITES_KEY]);
  });
  it('read denial, quota failure and absent storage do not crash', () => {
    const denied = { getItem: () => { throw Error('denied'); }, setItem: () => { throw Error('quota'); } };
    expect([...readFavorites(denied, knownIds)]).toEqual([]);
    expect(saveFavorites(denied, new Set(['alpha']))).toBe(false);
    expect(saveFavorites(undefined, new Set())).toBe(false);
    expect([...readFavorites(undefined, knownIds)]).toEqual([]);
  });
});
