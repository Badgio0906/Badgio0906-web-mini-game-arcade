import type { GameCatalogEntry } from '../data/gameCatalog';
import { tagCatalog } from '../data/tagCatalog';

export const FAVORITES_KEY = 'game100garage:favorites:v1';
export type FavoriteStorage = Pick<Storage, 'getItem' | 'setItem'>;

/** Only stable, currently active IDs survive untrusted browser storage. */
export function parseFavorites(raw: string | null, knownIds: ReadonlySet<string>): Set<string> {
  try {
    const value: unknown = JSON.parse(raw ?? '[]');
    return new Set(Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string' && knownIds.has(id)) : []);
  } catch { return new Set(); }
}

export function readFavorites(storage: FavoriteStorage | undefined, knownIds: ReadonlySet<string>): Set<string> {
  try { return parseFavorites(storage?.getItem(FAVORITES_KEY) ?? null, knownIds); }
  catch { return new Set(); }
}

export function saveFavorites(storage: FavoriteStorage | undefined, favorites: ReadonlySet<string>): boolean {
  if (!storage) return false;
  try { storage.setItem(FAVORITES_KEY, JSON.stringify([...favorites])); return true; }
  catch { return false; }
}

/** Prioritization never removes non-favorites, including newly released games. */
export function prioritizeFavorites(games: readonly GameCatalogEntry[], favorites: ReadonlySet<string>): GameCatalogEntry[] {
  return [...games].sort((a, b) => Number(favorites.has(b.id)) - Number(favorites.has(a.id)) || a.releaseOrder - b.releaseOrder);
}

export function activeTagOptions(games: readonly GameCatalogEntry[]) {
  return tagCatalog.map(tag => ({ ...tag, count: games.filter(game => game.status === 'active' && game.tags.some(t => t.id === tag.id)).length })).filter(tag => tag.count > 0);
}
