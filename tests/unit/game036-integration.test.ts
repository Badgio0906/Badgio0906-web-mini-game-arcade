import {afterEach,describe,it,expect,vi} from 'vitest';
import {gameCatalog,gameDisplayNumbers,NEXT_GAME_NUMBER} from '../../src/data/gameCatalog';
import {gameVersions} from '../../src/data/gameVersions';
import {getRecordDefinition,recordBoards} from '../../src/data/recordDefinitions';
import {readLocalRecord,localRecordStorageKeys} from '../../src/records/localRecords';
import {isRemoteGameRegistered} from '../../src/analytics/remoteRegistration';
import {blankSave,SAVE_KEY} from '../../src/games/game036/save';
afterEach(()=>vi.unstubAllGlobals());
describe('Game036 publication and local-only records',()=>{
 it('publishes the next stable ID as a trial without renumbering existing games',()=>{
  expect(gameCatalog.find(g=>g.id==='game036')).toMatchObject({route:'./game036.html',publicationState:'published',developmentStatus:'trial',releaseOrder:36,difficulty:'standard'});
  expect(gameDisplayNumbers.get('game035')).toBe('026');expect(gameDisplayNumbers.get('game036')).toBe('027');expect(NEXT_GAME_NUMBER).toBe(37);
 });
 it('registers versions and personal BEST while leaving production transport closed',()=>{
  expect(gameVersions.game036).toEqual({rules_version:'1',presentation_version:'mochi-canvas-1'});
  expect(getRecordDefinition('game036')).toMatchObject({publicEnabled:false,unit:'点',maxValue:99999999});
  expect(recordBoards.some(d=>d.gameId==='game036')).toBe(false);expect(isRemoteGameRegistered('game036')).toBe(false);expect(localRecordStorageKeys).toContain(SAVE_KEY);
 });
 it('shows no confirmed record for an unfinished first run, then preserves a genuine zero',async()=>{
  let data={...blankSave()};vi.stubGlobal('window',{localStorage:{getItem:(key:string)=>key===SAVE_KEY?JSON.stringify(data):null}});
  expect(await readLocalRecord('game036')).toMatchObject({status:'none'});data.runs=1;
  expect(await readLocalRecord('game036')).toMatchObject({status:'record',value:0});data.best=12345;
  expect(await readLocalRecord('game036')).toMatchObject({status:'record',value:12345});
 });
 it('does not display malformed or other-rules records as a current BEST',async()=>{
  let data={...blankSave(),runs:1,best:100000000};vi.stubGlobal('window',{localStorage:{getItem:()=>JSON.stringify(data)}});
  expect(await readLocalRecord('game036')).toMatchObject({status:'unavailable'});
  data={...data,best:123};(data as {rules_version:string}).rules_version='2';
  expect(await readLocalRecord('game036')).toMatchObject({status:'legacy'});
 });
});
