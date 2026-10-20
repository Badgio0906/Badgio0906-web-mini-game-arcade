import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { gameCatalog, historicalGameCatalog, hiddenGameCatalog, removedGameCatalog, onHoldGameCatalog, retiredGameCatalog, distributedGameCatalog, NEXT_GAME_NUMBER, REMOVED_GAME_IDS, filterGames, displayNumbersFor } from '../../src/data/gameCatalog';
import { activeTagOptions, readFavorites, saveFavorites } from '../../src/portal/discovery';
import { getRecordDefinition } from '../../src/data/recordDefinitions';
import preservation from '../../docs/adsense/catalog-quality-20261020/PRESERVATION_MANIFEST.json';

describe('author publication cleanup and retained contracts', () => {
  it('publishes exactly 26 identities and reserves all removed/held IDs', () => {
    expect(gameCatalog).toHaveLength(26);
    expect(gameCatalog.filter(g => g.developmentStatus === 'complete')).toHaveLength(9);
    expect(gameCatalog.filter(g => g.developmentStatus === 'trial')).toHaveLength(17);
    expect(historicalGameCatalog).toHaveLength(35);
    expect(new Set(historicalGameCatalog.map(g => g.id)).size).toBe(35);
    expect(NEXT_GAME_NUMBER).toBe(36);
    expect(removedGameCatalog.map(g => g.id)).toEqual(REMOVED_GAME_IDS);
    expect(onHoldGameCatalog.map(g => g.id)).toEqual(['game031']);
    expect(hiddenGameCatalog).toEqual([]);
    expect(retiredGameCatalog.map(g => g.id)).toEqual(['game004','game007','game010','game021']);
    expect(distributedGameCatalog).toHaveLength(30);
    for (const game of [...removedGameCatalog, ...onHoldGameCatalog]) expect(distributedGameCatalog).not.toContain(game);
  });
  it('applies the public gate even when discovery receives the complete history', () => {
    expect(filterGames(historicalGameCatalog)).toEqual(gameCatalog);
    expect(activeTagOptions(historicalGameCatalog)).toEqual(activeTagOptions(gameCatalog));
    expect(displayNumbersFor(historicalGameCatalog).size).toBe(26);
    const numbers = displayNumbersFor(historicalGameCatalog);
    expect(['game032','game033','game034','game035'].map(id => numbers.get(id))).toEqual(['023','024','025','026']);
    for (const game of [...removedGameCatalog,...onHoldGameCatalog]) expect(numbers.has(game.id)).toBe(false);
  });
  it('keeps legacy API status, IDs, boards, saves and versions intact', () => {
    for (const game of removedGameCatalog) expect(game.status).toBe('hidden');
    expect(onHoldGameCatalog[0].status).toBe('active');
    expect(getRecordDefinition('game029')).toMatchObject({ boardId:'game029.score.r1.all',publicEnabled:true });
    for (const path of ['src/data/recordDefinitions.ts','src/data/gameVersions.ts','src/records/localRecords.ts','analytics-worker/src/records.ts','analytics-worker/src/aggregate.ts','src/games/game031/Save.ts','src/games/game031/World.ts','src/games/game015/main.ts','src/games/game015/style.css']) {
      const content=readFileSync(path);
      expect(createHash('sha1').update(`blob ${content.length}\0`).update(content).digest('hex'),path).toBe(preservation.protected[path as keyof typeof preservation.protected]);
    }
  });
  it('retains former favorites without showing or deleting their history', () => {
    let raw='["game026","game028","game029","game030","game031","game032"]';
    const storage={getItem:()=>raw,setItem:(_key:string,value:string)=>{raw=value;}};
    const favorites=readFavorites(storage,new Set(historicalGameCatalog.map(g=>g.id)));
    saveFavorites(storage,favorites);
    expect(JSON.parse(raw)).toEqual(['game026','game028','game029','game030','game031','game032']);
    expect(gameCatalog.filter(g=>favorites.has(g.id)).map(g=>g.id)).toEqual(['game032']);
  });
  it('removes dedicated HTML/source while keeping the Game031 development entry', () => {
    for (const id of REMOVED_GAME_IDS) {
      expect(existsSync(`${id}.html`)).toBe(false);
      expect(existsSync(`src/games/${id}/main.ts`)).toBe(false);
      expect(existsSync(`public/assets/portal/${id}.webp`)).toBe(false);
    }
    expect(existsSync('game031.html')).toBe(true);
    expect(existsSync('src/games/game031/main.ts')).toBe(true);
    expect(existsSync('public/assets/game031/textures-a/v1/manifest.json')).toBe(true);
  });
});
