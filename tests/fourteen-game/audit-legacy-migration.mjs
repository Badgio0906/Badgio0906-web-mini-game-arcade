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
    assets.push(record);if(!record.equal)issues.push(`${entry.id}/${destination}: missing or differs from original export`);
  }
  records.push({...entry,target,assets,excludedMetadata,totalBytes:assets.reduce((n,r)=>n+r.bytes,0)});
}
await mkdir('docs/fourteen-game/QA',{recursive:true});
await writeFile(`docs/fourteen-game/QA/${dist?'LEGACY_DIST_BINARY_AUDIT':'LEGACY_BINARY_AUDIT'}.json`,JSON.stringify({checkedUtc:new Date().toISOString(),scope:'Original exported index.html is renamed game.html but byte-exact. Engine/WASM/PCK/audio/worklets/icons remain byte-exact. Unused editor .import/.gdignore and original standalone .nojekyll hosting markers are explicitly inventoried as exclusions; outer index.html portal wrapper is new and audited by native browser separately.',records,issues},null,2)+'\n');
console.log(`${records.length} exports /${records.reduce((n,r)=>n+r.assets.length,0)} original files;${issues.length} issues`);
if(issues.length){console.error(issues.join('\n'));process.exitCode=1;}
