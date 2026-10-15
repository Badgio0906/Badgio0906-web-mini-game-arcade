import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { gameCatalog, historicalGameCatalog, hiddenGameCatalog, retiredGameCatalog, gameDisplayNumbers, filterGames, displayNumbersFor } from '../../src/data/gameCatalog';
import { prioritizeFavorites } from '../../src/portal/discovery';
const expected = [1,2,3,5,6,8,9,11,12,13,14,15,16,17,18,19,20,22,23,24,25,27,31,32].map(n=>`game${String(n).padStart(3,'0')}`);
describe('author catalog reorganization',()=>{
 it('preserves stable identities and contiguous display identity despite sorting/filtering',()=>{
  expect(gameCatalog.slice(0,24).map(g=>g.id)).toEqual(expected);
  expect(expected.map(id=>gameDisplayNumbers.get(id))).toEqual(Array.from({length:24},(_,i)=>String(i+1).padStart(3,'0')));
  for(const game of prioritizeFavorites(gameCatalog,new Set(['game032','game019']))) expect(gameDisplayNumbers.get(game.id)).toBe(displayNumbersFor(historicalGameCatalog).get(game.id));
  for(const game of filterGames(gameCatalog,['physics'],'or')) expect(gameDisplayNumbers.get(game.id)).toBe(displayNumbersFor(historicalGameCatalog).get(game.id));
  for(const game of historicalGameCatalog) expect(game.releaseOrder).toBe(Number(game.id.slice(4)));
 });
 it('distinguishes hidden playable URLs and retired lightweight notice',()=>{
  expect(hiddenGameCatalog.map(g=>g.id)).toEqual(['game026','game028','game029','game030']);
  expect(retiredGameCatalog.map(g=>g.id)).toEqual(['game004','game007','game010','game021']);
  expect(filterGames(hiddenGameCatalog)).toEqual([]);
  for(const game of hiddenGameCatalog) expect(readFileSync(game.route.slice(2),'utf8')).toContain('<script');
  for(const game of retiredGameCatalog) {const html=readFileSync(game.route.slice(2),'utf8');expect(html).toContain('noindex,nofollow');expect(html).toContain('./index.html');expect(html).not.toMatch(/<script|<canvas/);}
  expect(gameDisplayNumbers.has('game026')).toBe(false);
  expect(gameCatalog.some(g=>g.id==='game008')).toBe(true);
 });
});
