import { describe, it, expect, vi, afterEach } from 'vitest';
import { recordBoards } from '../../src/data/recordDefinitions';
const mocks=vi.hoisted(()=>({readLocalRecord:vi.fn(),load:vi.fn()}));
vi.mock('../../src/records/localRecords',()=>({readLocalRecord:mocks.readLocalRecord}));
vi.mock('../../src/records/Leaderboards',()=>({Leaderboards:class {load(...args:unknown[]){return mocks.load(...args);}}}));
vi.mock('../../src/records/PortalRecords',()=>({formatRecordValue:(v:number)=>String(v),localRecordLabel:(r:{value:number})=>String(r.value)}));
import {createLeaderboardDialog} from '../../src/records/LeaderboardDialog';

// A deliberately small DOM transport double: this verifies async cancellation,
// not native dialog behavior, layout, keyboard behavior, or visual quality.
class ElementDouble {
  className='';id='';tabIndex=0;textContent='';open=false;type='';style={overflow:''};children:ElementDouble[]=[];
  handlers=new Map<string,()=>void>();
  setAttribute(){} append(...nodes:ElementDouble[]){this.children.push(...nodes);} replaceChildren(){this.children=[];}
  addEventListener(name:string,fn:()=>void){this.handlers.set(name,fn);} focus(){}
  showModal(){this.open=true;}close(){this.open=false;this.handlers.get('close')?.();}
}
afterEach(()=>vi.unstubAllGlobals());
describe('independent leaderboard dialog cancellation boundaries',()=>{
 it('finishes personal BEST even when a public BEST refresh reconciles during local storage lookup',async()=>{
   const body=new ElementDouble();vi.stubGlobal('document',{body,createElement:()=>new ElementDouble()});
   let resolveLocal!:(v:{status:string;value:number})=>void;
   mocks.readLocalRecord.mockReturnValue(new Promise(resolve=>{resolveLocal=resolve;}));
   mocks.load.mockResolvedValue({status:'preparing'});
   const api={getState:()=>({boards:new Map()}),acceptLeaderboardSnapshot:()=>true};
   const controller=createLeaderboardDialog(api as never,()=>{});
   const definition=recordBoards.find(d=>d.gameId==='game012')!;
   controller.open(definition,new ElementDouble() as never);
   controller.reconcile();
   resolveLocal({status:'record',value:123});
   await Promise.resolve();await Promise.resolve();
   const dialog=body.children[0],personal=dialog.children[1].children[1];
   expect(personal.textContent).toContain('123');
   expect(personal.textContent).not.toContain('読み込み中');
 });
 it('does not display an old game personal BEST after closing and opening a different game',async()=>{
   const body=new ElementDouble();vi.stubGlobal('document',{body,createElement:()=>new ElementDouble()});
   let resolveOld!:(v:{status:string;value:number})=>void,resolveNew!:(v:{status:string;value:number})=>void;
   mocks.readLocalRecord.mockReturnValueOnce(new Promise(resolve=>{resolveOld=resolve;})).mockReturnValueOnce(new Promise(resolve=>{resolveNew=resolve;}));
   mocks.load.mockResolvedValue({status:'preparing'});
   const api={getState:()=>({boards:new Map()}),acceptLeaderboardSnapshot:()=>true};
   const controller=createLeaderboardDialog(api as never,()=>{});
   controller.open(recordBoards.find(d=>d.gameId==='game012')!,new ElementDouble() as never);
   const dialog=body.children[0];dialog.close();
   controller.open(recordBoards.find(d=>d.gameId==='game013')!,new ElementDouble() as never);
   resolveNew({status:'record',value:456});await Promise.resolve();await Promise.resolve();
   const personal=dialog.children[1].children[1];expect(personal.textContent).toContain('456');
   resolveOld({status:'record',value:123});await Promise.resolve();await Promise.resolve();
   expect(personal.textContent).toContain('456');expect(personal.textContent).not.toContain('123');
 });
});
