import {describe,it,expect} from 'vitest';
import {autoChoice,autoFocus,choose,createCareer,stepMonth,summarize,type Career} from '../../src/games/game038/model';
import {blankSave,validateSave} from '../../src/games/game038/save';

function atFarewell(seed=3):Career {
 const c=createCareer('保存さん','talk',seed);
 for(let n=0;!c.ended&&n<400;n++){autoFocus(c);if(c.pending)choose(c,autoChoice(c));else stepMonth(c);}
 expect(c.ended).not.toBeNull();expect(c.pending?.kind).toBe('end');return c;
}
const unfinished=(c:Career)=>({...blankSave(),runs:2,bestRank:120,snapshot:c,reported:false,runId:'038-unfinished'});

describe('Game038 save recovery at decisions',()=>{
 it('resumes a genuine ending awaiting its farewell and preserves the final result',()=>{
  const c=atFarewell(),copy=validateSave(JSON.parse(JSON.stringify(unfinished(c))))!;
  expect(copy.snapshot).toEqual(JSON.parse(JSON.stringify(c)));expect(copy.reported).toBe(false);expect(copy.bestRank).toBe(120);
  choose(copy.snapshot!,0,'またね');expect(copy.snapshot!.farewell).toBe('またね');
  expect(summarize(copy.snapshot!).rank).toBe(summarize(c).rank);
  expect(validateSave(unfinished(copy.snapshot!))?.snapshot).toBeNull();
 });
 it('filters malformed summary fields that history and result rendering consume',()=>{
  const c=atFarewell();choose(c,0,'ありがとう');const good=summarize(c);
  const bad=[{...good,reason:'unknown'},{...good,reason:undefined},{...good,agency:'unknown'},
   {...good,job:'unknown'},{...good,peakCcv:NaN},{...good,monetized:'yes'},
   {...good,peers:[null]},{...good,notes:[{month:-1,text:'x'}]},{...good,endedAt:'not-a-date'}];
  const result=validateSave({...blankSave(),history:[...bad,good]});
  expect(result?.history).toEqual([good]);
 });
 it('drops unknown or inconsistent decisions and unsafe log presentation values',()=>{
  const c=createCareer('決断','talk',21);stepMonth(c);expect(c.pending?.id).toBe('debut');
  for(const patch of [
   {pending:{...c.pending,id:'unknown'}},
   {pending:{...c.pending,choices:c.pending!.choices.slice(0,1)}},
   {pending:{...c.pending,kind:'question',id:'q999',choices:[{label:'次へ'}]}},
   {pending:{...c.pending,id:'retire'},retireKind:null},
   {log:[{month:1,text:'x',tone:'bad" data-untrusted="yes'}]},
  ])expect(validateSave(unfinished({...c,...patch} as Career))?.snapshot).toBeNull();
  const ended=atFarewell();
  expect(validateSave(unfinished({...ended,ended:{...ended.ended!,month:ended.month+1}}))?.snapshot).toBeNull();
 });
 it('continues identically after JSON restore at every step across seeded careers',()=>{
  let checked=0;
  for(let seed=0;seed<25;seed++){
   const c=createCareer('通常','talk',seed);let resumed=structuredClone(c);
   for(let n=0;n<400;n++){
    const value=validateSave(JSON.parse(JSON.stringify(unfinished(resumed))));
    expect(value?.snapshot,`seed ${seed}, month ${c.month}, pending ${c.pending?.id}`).toEqual(JSON.parse(JSON.stringify(c)));checked++;
    resumed=value!.snapshot!;
    if(c.ended)break;
    autoFocus(c);autoFocus(resumed);
    if(c.pending){const pick=autoChoice(c);choose(c,pick);choose(resumed,pick);}else{stepMonth(c);stepMonth(resumed);}
   }
  }
  expect(checked).toBeGreaterThan(100);
 });
});
