import {it,expect,vi,afterEach} from 'vitest';
import {createGameRecordSession} from '../../src/records/RecordSharing';
import {getRecordDefinition} from '../../src/data/recordDefinitions';
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
it('new persistent-rule sessions retain the old eligible candidate verbatim and create a separate current slot',()=>{
 vi.stubEnv('PROD',true);vi.stubGlobal('location',{protocol:'https:',hostname:'game100garage.com'});vi.stubGlobal('navigator',{webdriver:false});
 const values=new Map<string,string>();const backend={getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>values.set(k,v),removeItem:(k:string)=>values.delete(k),key:(i:number)=>[...values.keys()][i]??null,get length(){return values.size}};
 vi.stubGlobal('localStorage',backend);vi.stubGlobal('window',{localStorage:backend,addEventListener:()=>{},dispatchEvent:()=>{}});vi.stubGlobal('document',{addEventListener:()=>{},visibilityState:'visible'});const fetcher=vi.fn();vi.stubGlobal('fetch',fetcher);
 for(const id of ['game002','game003','game005','game006','game009','game015','game017','game024']){
  const key=`game100:records:eligible:v1:${id}`,original=JSON.stringify({schema:1,rulesetId:'historical',candidate:{kept:true}});values.set(key,original);
  const session=createGameRecordSession(id);session.startRun('new-persistent-run');expect(values.get(key)).toBe(original);
  const current=values.get(key+':rules-'+getRecordDefinition(id)!.rulesetId);expect(current).toBeDefined();expect(JSON.parse(current!).identity).toBe('new-persistent-run');session.clear();
 }
 expect(fetcher).not.toHaveBeenCalled();
});
