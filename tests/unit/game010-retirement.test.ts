import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { filterCatalog, gameCatalog, historicalGameCatalog, retiredGameCatalog, NEXT_GAME_NUMBER } from '../../src/data/gameCatalog';

describe('retired IDs remain historical, never active or reused', () => {
  it('exposes the active cards with original IDs and releaseOrder', () => {
    expect(gameCatalog).toHaveLength(historicalGameCatalog.length - 9);
    expect(gameCatalog.some(game => game.id === 'game010')).toBe(false);
    expect(filterCatalog(['meeting'])).toEqual([]);
    expect(gameCatalog.find(game => game.id === 'game011')?.releaseOrder).toBe(11);
    expect(gameCatalog.find(game => game.id === 'game020')?.id).toBe('game020');
    expect(gameCatalog.find(game => game.id === 'game020')?.releaseOrder).toBe(20);
    expect(NEXT_GAME_NUMBER).toBe(Math.max(...historicalGameCatalog.map(game => game.releaseOrder)) + 1);
    expect(historicalGameCatalog.map(game => game.releaseOrder)).toEqual([...Array.from({length:36}, (_,i)=>i+1),38]);
    expect(retiredGameCatalog.map(game => [game.id, game.status, game.releaseOrder])).toEqual([['game004', 'retired', 4], ['game007', 'retired', 7], ['game010', 'retired', 10], ['game021', 'retired', 21]]);
  });
  it('keeps the bookmark route lightweight and never starts the retired engine', () => {
    const html = readFileSync('game010.html', 'utf8');
    expect(html).toContain('noindex,nofollow');
    expect(html).toContain('href="./index.html"');
    expect(html).not.toMatch(/<script|src\/games\/game010|canvas/i);
    expect(existsSync('src/games/game010/main.ts')).toBe(true);
    expect(existsSync('jev_export/retired_game_profiles/game010.json')).toBe(true);
    expect(existsSync('jev_export/game_profiles/game010.json')).toBe(false);
    const activeExport = JSON.parse(readFileSync('jev_export/game_profiles/catalog.json', 'utf8'));
    expect(activeExport.gameCount).toBe(gameCatalog.length);
    expect(activeExport.gameCatalog.some((game: {id: string}) => game.id === 'game010')).toBe(false);
  });
});
