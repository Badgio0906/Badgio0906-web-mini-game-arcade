import {afterEach,describe,expect,it,vi} from 'vitest';
import {ParticipantIdentity,PARTICIPANT_CREDENTIAL_KEY} from '../../src/records/ParticipantIdentity';
const store=()=>{const data=new Map<string,string>();return {data,getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>{data.set(k,v);}};};
afterEach(()=>vi.unstubAllGlobals());
describe('independent cross-document identity allocation boundaries',()=>{
 it('fails closed on first participation without Web Locks and leaves storage empty',async()=>{
   vi.stubGlobal('navigator',{});const storage=store(),identity=new ParticipantIdentity(()=>storage);
   expect(await identity.forSharing(()=>true)).toBeUndefined();expect(storage.data.size).toBe(0);expect(identity.unavailable()).toBe(true);
 });
 it('keeps an existing credential usable in browsers without Web Locks',async()=>{
   vi.stubGlobal('navigator',{});const storage=store(),synthetic='1'.repeat(64);
   storage.data.set(PARTICIPANT_CREDENTIAL_KEY,JSON.stringify({schema:1,credential:synthetic}));
   const identity=new ParticipantIdentity(()=>storage);
   expect(await identity.forSharing(()=>true)).toBe(synthetic);expect(identity.unavailable()).toBe(false);
 });
 it('rechecks OFF inside a granted lock and never allocates while permission was revoked',async()=>{
   let allowed=true;const storage=store();
   vi.stubGlobal('navigator',{locks:{request:async(_name:string,callback:()=>unknown)=>{allowed=false;return callback();}}});
   const identity=new ParticipantIdentity(()=>storage);
   expect(await identity.forSharing(()=>allowed)).toBeUndefined();expect(storage.data.size).toBe(0);
 });
});
