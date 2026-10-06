import {describe,it,expect} from 'vitest';
import {gameVersions} from '../../src/data/gameVersions';
import {summarizeEvents} from '../../src/data/telemetryAnalytics';
describe('analytics version and retired history',()=>{
 it('keeps revised007 rules2 and separate018 presentation2/unchanged rules1',()=>{expect(gameVersions.game007.rules_version).toBe('2');expect(gameVersions.game018).toEqual({rules_version:'1',presentation_version:'2'});});
 it('retains historic010 local records as retired without mapping them onto another game',()=>{const s=summarizeEvents([{name:'run_start',at:'2026-10-05T00:00:00.000Z',data:{game_id:'game010',session_id:'old-page'}}]);expect(s.byGame.find(g=>g.gameId==='game010')).toMatchObject({status:'retired',playCount:1});expect(s.byGame.find(g=>g.gameId==='game019')?.playCount).toBe(0);});
});
