// QA-only entry, explicitly added by the test build. Never a normal site route.
import {createGameRecordSession,mountRecordSharingSettings} from '../../src/records/RecordSharing';
import {PublicBests} from '../../src/records/PublicBests';
import {readLocalRecord} from '../../src/records/localRecords';
import {recordBoards} from '../../src/data/recordDefinitions';
const result=document.getElementById('result')!;
mountRecordSharingSettings(document.getElementById('settings')!);
let session=createGameRecordSession('game001');
const api=new PublicBests();
const fixture={
  start(gameId='game001',identity?:string){session.clear();session=createGameRecordSession(gameId);session.startRun(identity);},
  resume(gameId:string,identity:string){session.clear();session=createGameRecordSession(gameId);session.resumeRun(identity);},
  complete(value:number,options={}){session.complete(value,options);session.mount(result);},
  clear(){session.clear();},
  async publicRefresh(){const state=await api.refresh();return{status:state.status,boards:[...state.boards.values()],fetchedAt:state.fetchedAt};},
  localRead(gameId:string){return readLocalRecord(gameId);},
  publicState(){const s=api.getState();return{status:s.status,count:s.boards.size};},
  boards:recordBoards,
};
Object.defineProperty(window,'__RECORDS_FIXTURE__',{value:fixture});
