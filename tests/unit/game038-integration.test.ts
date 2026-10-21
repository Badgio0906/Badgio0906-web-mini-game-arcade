import {describe,it,expect} from 'vitest';
import {gameCatalog,gameDisplayNumbers,NEXT_GAME_NUMBER} from '../../src/data/gameCatalog';
import {gameVersions} from '../../src/data/gameVersions';
import {getRecordDefinition,recordBoards} from '../../src/data/recordDefinitions';
import {isRemoteGameRegistered} from '../../src/analytics/remoteRegistration';

describe('Game038 published as a non-competitive trial',()=>{
 it('reserves 037 and preserves the existing public identities',()=>{
  expect(gameCatalog.find(g=>g.id==='game038')).toMatchObject({route:'./game038.html',publicationState:'published',developmentStatus:'trial',releaseOrder:38,difficulty:'standard'});
  expect(gameCatalog.some(g=>g.id==='game037')).toBe(false);
  expect(gameDisplayNumbers.get('game035')).toBe('026');
  expect(gameDisplayNumbers.get('game036')).toBe('027');
  expect(gameDisplayNumbers.get('game038')).toBe('028');
  expect(NEXT_GAME_NUMBER).toBe(39);
 });
 it('adds presentation metadata without opening remote collection or comparison boards',()=>{
  expect(gameVersions.game038).toEqual({rules_version:'1',presentation_version:'night-stream-dom-1'});
  expect(getRecordDefinition('game038')).toBeUndefined();
  expect(recordBoards.some(d=>d.gameId==='game038')).toBe(false);
  expect(isRemoteGameRegistered('game038')).toBe(false);
 });
});
