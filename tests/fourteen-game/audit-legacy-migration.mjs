import { createHash } from 'node:crypto';
import { readdir,readFile,mkdir,writeFile } from 'node:fs/promises';
import { join,relative,basename } from 'node:path';

const entries=[
  {id:'yokodori-days',source:'/workspace/legacy-games/yokodori-days/build/web'},
  {id:'tachibana-task-heaven',source:'/workspace/legacy-games/tachibana-task-heaven/docs'},
  {id:'finger-heart-challenge',source:'/workspace/legacy-games/finger-heart-challenge/web'},
];
const metadata=name=>name.endsWith('.import')||['.gdignore','.nojekyll'].includes(basename(name));
const hash=b=>createHash('sha256').update(b).digest('hex');
const manifest=JSON.parse(await readFile('public/games/export-manifest.json','utf8'));
const titleResources={
  'yokodori-days':['project.binary','scripts/hud.gdc','scripts/title_screen.gdc'],
  'tachibana-task-heaven':['project.binary','scripts/office_view.gdc','scripts/game_manager.gdc'],
  'finger-heart-challenge':['project.binary','scripts/main.gdc'],
};
function packed(data){
  if(data.toString('ascii',0,4)!=='GDPC'||data.readUInt32LE(4)!==3)throw Error('Expected PCK v3');
  const base=Number(data.readBigUInt64LE(24));let p=Number(data.readBigUInt64LE(32));
  const count=data.readUInt32LE(p);p+=4;const result=new Map();
  for(let i=0;i<count;i++){
    const size=data.readUInt32LE(p);p+=4;const name=data.subarray(p,p+size).toString().replace(/\0+$/,'');p+=size;
    const offset=Number(data.readBigUInt64LE(p)),length=Number(data.readBigUInt64LE(p+8)),md5=data.subarray(p+16,p+32).toString('hex'),flags=data.readUInt32LE(p+32);p+=36;
    const bytes=data.subarray(base+offset,base+offset+length);
    if(flags||createHash('md5').update(bytes).digest('hex')!==md5)throw Error(`Invalid packed resource ${name}`);
    result.set(name,hash(bytes));
  }
  return result;
}
async function files(root,dir=root){const result=[];for(const item of await readdir(dir,{withFileTypes:true})){const p=join(dir,item.name);if(item.isDirectory())result.push(...await files(root,p));else result.push(relative(root,p));}return result.sort();}
const dist=process.argv.includes('--dist');
const records=[],issues=[];
for(const entry of entries){
  const target=join(dist?'dist/games':'public/games',entry.id),assets=[],excludedMetadata=[];
  for(const name of await files(entry.source)){
    if(metadata(name)){excludedMetadata.push({name,reason:name.endsWith('.import')?'Unused Godot editor import metadata':name.endsWith('.gdignore')?'Godot editor directory marker':'Original standalone hosting marker; parent Pages artifact is deployed directly without Jekyll'});continue;}
    const source=await readFile(join(entry.source,name)),destination=name==='index.html'?'game.html':name;
    let delivered=null;try{delivered=await readFile(join(target,destination));}catch{}
    const record={sourceName:name,targetName:destination,bytes:source.length,sha256:hash(source),equal:delivered!==null&&hash(delivered)===hash(source)};
    if(!record.equal&&delivered&&['index.pck','index.html'].includes(name)){
      const game=manifest.games.find(g=>g.slug===entry.id),expected=game.runtimeFiles.find(r=>r.path.endsWith('/'+destination));
      record.authorizedTitleRevision=expected.sourceSha256===hash(source)&&expected.sha256===hash(delivered)&&expected.byteIdentical===false;
      if(name==='index.pck'){
        const original=packed(source),revised=packed(delivered),changed=[];
        if(original.size!==revised.size)record.authorizedTitleRevision=false;
        for(const [path,digest] of original)if(revised.get(path)!==digest)changed.push(path);
        record.changedPackedResources=changed.sort();
        record.authorizedTitleRevision&&=JSON.stringify(changed.sort())===JSON.stringify(titleResources[entry.id].slice().sort());
        for(const resource of [...game.titleRevision.changedPackedResources,...(game.startChoicesRevision?.changedResources??[]).map(r=>({...r,sourceSha256:r.previousSha256}))]){
          record.authorizedTitleRevision&&=original.get(resource.path)===resource.sourceSha256&&revised.get(resource.path)===resource.sha256;
        }
      }
    }
    assets.push(record);if(!record.equal&&!record.authorizedTitleRevision)issues.push(`${entry.id}/${destination}: missing or unexpected difference from original export`);
  }
  records.push({...entry,target,assets,excludedMetadata,totalBytes:assets.reduce((n,r)=>n+r.bytes,0)});
}
await mkdir('docs/fourteen-game/QA',{recursive:true});
await writeFile(process.env.LEGACY_BINARY_REPORT??`docs/legacy-games/title-revision/QA/${dist?'LEGACY_DIST_BINARY_AUDIT':'LEGACY_BINARY_AUDIT'}.json`,JSON.stringify({checkedUtc:new Date().toISOString(),scope:'Engine/WASM/audio/worklets/icons remain byte-exact. Authorized title and start-choice HTML/PCK differences match the current manifest; changed PCK resources are restricted to title scripts/project metadata and Game013 first-play gate and all unrelated resources remain byte-exact. Unused editor and original hosting markers are excluded.',records,issues},null,2)+'\n');
console.log(`${records.length} exports /${records.reduce((n,r)=>n+r.assets.length,0)} original files;${issues.length} issues`);
if(issues.length){console.error(issues.join('\n'));process.exitCode=1;}
