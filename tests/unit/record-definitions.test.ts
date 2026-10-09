import {describe,it,expect} from 'vitest';
import {gameCatalog} from '../../src/data/gameCatalog';
import {recordDefinitions,recordBoards,getRecordDefinition} from '../../src/data/recordDefinitions';
describe('explicit record comparison definitions',()=>{
  it('covers exactly active catalog IDs and never retired IDs',()=>{
    expect(recordDefinitions.map(d=>d.gameId).sort()).toEqual(gameCatalog.map(d=>d.id).sort());
    expect(getRecordDefinition('game010')).toBeUndefined();
    expect(getRecordDefinition('game999')).toBeUndefined();
  });
  it('has unique stable boards and safe integer bounds',()=>{
    expect(new Set(recordBoards.map(d=>d.boardId)).size).toBe(recordBoards.length);
    for(const d of recordDefinitions){expect(Number.isSafeInteger(d.maxValue)).toBe(true);expect(Number.isSafeInteger(d.pendingAbove)).toBe(true);expect(d.pendingAbove).toBeLessThanOrEqual(d.maxValue);expect(d.storageScale).toBeGreaterThan(0);}
  });
  it('keeps shoe units, snake speed and authored frog goal distinct',()=>{
    expect(getRecordDefinition('game018')).toMatchObject({metricId:'distance',storageScale:10,displayPrecision:1,modeId:'all-shoes'});
    expect(getRecordDefinition('game024')).toMatchObject({modeId:'speed-4',maxValue:397,assistancePolicy:'none'});
    expect(getRecordDefinition('game019')).toMatchObject({rulesetId:'2',maxValue:2000,storageScale:10});
  });
  it('registers only comparable native legacy metrics with assistance excluded',()=>{
    expect(getRecordDefinition('game012')).toMatchObject({metricId:'score',rulesetId:'1',modeId:'normal',publicEnabled:true,storageScale:1,assistancePolicy:'none',maxValue:Number.MAX_SAFE_INTEGER,pendingAbove:1000000});
    expect(getRecordDefinition('game013')).toMatchObject({metricId:'score',rulesetId:'1',modeId:'normal',publicEnabled:true,storageScale:1,assistancePolicy:'none',maxValue:11400,pendingAbove:11400});
    expect(getRecordDefinition('game014')).toMatchObject({metricId:'successes',rulesetId:'1',modeId:'normal',publicEnabled:true,storageScale:1,assistancePolicy:'none',maxValue:25,pendingAbove:25});
    expect(recordBoards.filter(b=>['game012','game013','game014'].includes(b.gameId)).map(b=>b.boardId)).toEqual(['game012.score.r1.normal','game013.score.r1.normal','game014.successes.r1.normal']);
  });
  it('does not invent competitive records for unranked games or a score for retired game',()=>{
    for(const id of ['game020','game021','game022','game023','game025','game026','game027','game028','game030','game031'])expect(getRecordDefinition(id)?.publicEnabled).toBe(false);
    expect(getRecordDefinition('game029')).toMatchObject({publicEnabled:true,metricId:'score'});
  });
});
