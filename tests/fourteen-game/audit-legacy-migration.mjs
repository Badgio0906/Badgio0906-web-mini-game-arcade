import { createHash } from 'node:crypto';
import { readdir,readFile,mkdir,writeFile } from 'node:fs/promises';
import { join,relative,basename } from 'node:path';
import { execFileSync } from 'node:child_process';

const sourceRoot=process.env.LEGACY_SOURCES??'/workspace/legacy-games';
const entries=[
  {id:'yokodori-days',source:join(sourceRoot,'yokodori-days/build/web')},
  {id:'tachibana-task-heaven',source:join(sourceRoot,'tachibana-task-heaven/docs')},
  {id:'finger-heart-challenge',source:join(sourceRoot,'finger-heart-challenge/web')},
];
const metadata=name=>name.endsWith('.import')||['.gdignore','.nojekyll'].includes(basename(name));
const hash=b=>createHash('sha256').update(b).digest('hex');
const manifest=JSON.parse(await readFile('public/games/export-manifest.json','utf8'));
const titleResources={
  'yokodori-days':['project.binary','scripts/hud.gdc','scripts/title_screen.gdc'],
  'tachibana-task-heaven':['project.binary','scripts/office_view.gdc','scripts/game_manager.gdc'],
  'finger-heart-challenge':['project.binary','scripts/main.gdc'],
};
function packed(data,raw=false){
  if(data.toString('ascii',0,4)!=='GDPC'||data.readUInt32LE(4)!==3)throw Error('Expected PCK v3');
  const base=Number(data.readBigUInt64LE(24));let p=Number(data.readBigUInt64LE(32));
  const count=data.readUInt32LE(p);p+=4;const result=new Map();
  for(let i=0;i<count;i++){
    const size=data.readUInt32LE(p);p+=4;const name=data.subarray(p,p+size).toString().replace(/\0+$/,'');p+=size;
    const offset=Number(data.readBigUInt64LE(p)),length=Number(data.readBigUInt64LE(p+8)),md5=data.subarray(p+16,p+32).toString('hex'),flags=data.readUInt32LE(p+32);p+=36;
    const bytes=data.subarray(base+offset,base+offset+length);
    if(flags||createHash('md5').update(bytes).digest('hex')!==md5)throw Error(`Invalid packed resource ${name}`);
    result.set(name,raw?bytes:hash(bytes));
  }
  return result;
}
const titlePairs={
  'yokodori-days':['澤野さんの横取りデイズ','お前の仕事は俺の仕事'],
  'tachibana-task-heaven':['立花さんのタスク天国','タスク天国'],
  'finger-heart-challenge':['畑島さんの指ハートチャレンジ','指ハートチャレンジ'],
};
const recordHooks={
  'yokodori-days':['scripts/game_manager.gdc','scripts/high_score_manager.gdc','scripts/main.gdc'],
  'tachibana-task-heaven':['scripts/game_manager.gdc'],
  'finger-heart-challenge':['scripts/main.gdc'],
};
const recordHelpers=slug=>['scripts/RecordBridge.gdc','scripts/RecordBridge.gd.remap',...(slug==='yokodori-days'?[]:['scripts/CurrentRecordSave.gdc','scripts/CurrentRecordSave.gd.remap'])].sort();
const newUidPaths=slug=>['res://scripts/RecordBridge.gd',...(slug==='yokodori-days'?['res://tests/test_bridge.gd']:['res://scripts/CurrentRecordSave.gd','res://tests/test_current_records.gd'])];
function uidMap(bytes){
  let p=4;const result=new Map(),count=bytes.readUInt32LE(0);
  if(count>10000)throw Error('Unexpected UID cache size');
  for(let i=0;i<count;i++){
    const value=bytes.readBigUInt64LE(p).toString(),length=bytes.readUInt32LE(p+8);p+=12;
    if(length>8192||p+length>bytes.length)throw Error('Invalid UID cache entry');
    const name=bytes.subarray(p,p+length).toString();p+=length;
    if(result.has(name))throw Error('Duplicate UID cache path');
    result.set(name,value);
  }
  if(p!==bytes.length)throw Error('Trailing UID cache bytes');
  return result;
}
function iconDelta(before,after,width=256,height=256){
  // Read-only image decoding. Missing Pillow or any decoder error fails closed.
  const code=`import sys,json,base64,io
from PIL import Image
v=json.load(sys.stdin)
a=[]
for key in ('before','after'):
 b=base64.b64decode(v[key])
 if b.startswith(b'GST2'):
  p=b.find(b'RIFF')
  if p<0: raise ValueError('Expected lossless WebP ctex image')
  b=b[p:]
 a.append(Image.open(io.BytesIO(b)).convert('RGBA'))
expected=(v['width'],v['height'])
if a[0].size!=expected or a[1].size!=expected: raise ValueError('Unexpected icon dimensions')
n=0;m=[0,0,0,0]
for x,y in zip(a[0].getdata(),a[1].getdata()):
 if x!=y:
  n+=1
  m=[max(m[i],abs(x[i]-y[i])) for i in range(4)]
print(json.dumps({'changed_pixels':n,'total_pixels':v['width']*v['height'],'max_rgb_delta':max(m[:3]),'max_alpha_delta':m[3],'numeric_cause':'UNKNOWN'}))`;
  return JSON.parse(execFileSync('python3',['-c',code],{input:JSON.stringify({before:before.toString('base64'),after:after.toString('base64'),width,height}),encoding:'utf8',stdio:['pipe','pipe','pipe'],timeout:10000,maxBuffer:1024*1024}));
}
async function authorizedSourceRebuild(entry,game,source,delivered,record){
  if(manifest.schemaVersion!==2||manifest.threadsEnabled!==false||game.recordsBridgeSchema!==1||game.compiler!=='4.5.1.stable.official.f62fdbde1')return false;
  if(!Array.isArray(game.sourceOverlay)||!game.sourceOverlay.length)return false;
  for(const overlay of game.sourceOverlay){
    if(typeof overlay.path!=='string'||overlay.path.includes('..')||overlay.path.startsWith('/')||hash(await readFile(overlay.path))!==overlay.sha256)return false;
  }
  const expected=game.runtimeFiles.find(row=>row.path.endsWith('/'+record.targetName));
  if(!expected||expected.sha256!==hash(delivered)||expected.bytes!==delivered.length)return false;
  if(record.sourceName==='index.html'){
    record.allowedHtmlChanges=['Current titles/description','Regular export PCK size','Fixed native-record script before engine start'];
    const [oldTitle,newTitle]=titlePairs[entry.id];
    const packageBytes=(await readFile(join(dist?'dist/games':'public/games',entry.id,'index.pck'))).length;
    const expectedHtml=source.toString().replaceAll(oldTitle,newTitle).replaceAll('畑島さんと指ハートにチャレンジ！','指ハートにチャレンジ！').replace(/"index\.pck":\d+/,`"index.pck":${packageBytes}`).replace('<head>','<head>\n<script src="../native-record-bridge.js"></script>');
    return delivered.toString()===expectedHtml;
  }
  if(['tachibana-task-heaven','finger-heart-challenge'].includes(entry.id)&&['index.icon.png','index.apple-touch-icon.png'].includes(record.sourceName)){
    const apple=record.sourceName==='index.apple-touch-icon.png',finger=entry.id==='finger-heart-challenge';
    const dimension=apple?180:finger?128:256,limit=finger?3:apple?8:10;
    record.iconRasterizationDelta=iconDelta(source,delivered,dimension,dimension);
    const delta=record.iconRasterizationDelta;
    return delta.changed_pixels<=limit&&delta.max_rgb_delta<=1&&delta.max_alpha_delta===0;
  }
  if(record.sourceName!=='index.pck')return false;
  const original=packed(source,true),revised=packed(delivered,true);
  const allowed=new Set([...titleResources[entry.id],...recordHooks[entry.id],'.godot/uid_cache.bin']);
  const changed=[...original].filter(([path,bytes])=>!revised.has(path)||hash(revised.get(path))!==hash(bytes)).map(([path])=>path).sort();
  const added=[...revised.keys()].filter(path=>!original.has(path)).sort();
  record.changedPackedResources=changed;record.addedPackedResources=added;
  if(JSON.stringify(added)!==JSON.stringify(recordHelpers(entry.id)))return false;
  for(const path of changed){
    if(!revised.has(path))return false;
    if(allowed.has(path))continue;
    const svgIcon={
      'tachibana-task-heaven':{path:'.godot/imported/icon.svg-56083ea2a1f1a4f1e49773bdc6d7826c.ctex',dimension:256,limit:10},
      'finger-heart-challenge':{path:'.godot/imported/icon.svg-6c8e7c7a8dcdd81e58bcb0386e6e4017.ctex',dimension:128,limit:3},
    }[entry.id];
    if(svgIcon&&path===svgIcon.path){
      record.iconRasterizationDelta=iconDelta(original.get(path),revised.get(path),svgIcon.dimension,svgIcon.dimension);
      const delta=record.iconRasterizationDelta;
      if(delta.changed_pixels<=svgIcon.limit&&delta.max_rgb_delta<=1&&delta.max_alpha_delta===0)continue;
    }
    return false; // No blanket asset/data/resource exemption.
  }
  const beforeUids=uidMap(original.get('.godot/uid_cache.bin')),afterUids=uidMap(revised.get('.godot/uid_cache.bin'));
  // Game014's old editor cache retained excluded QA/document/export images.
  // An image UID is nonruntime only when the pinned preset excludes its directory
  // and neither PCK contains the image, import/remap, or derived imported texture.
  const excludedPreset=entry.id==='finger-heart-challenge'&&(await readFile(join(sourceRoot,entry.id,'export_presets.cfg'),'utf8')).includes('exclude_filter="tests/*,tools/*,web/*,docs/*"');
  const excludedEditorImage=path=>{
    if(!excludedPreset||!/^res:\/\/(?:docs\/|tests\/artifacts\/|web\/).+\.png$/.test(path))return false;
    const asset=path.slice(6),imported=`.godot/imported/${basename(asset)}-${createHash('md5').update(path).digest('hex')}.ctex`;
    return ![asset,asset+'.import',asset+'.remap',imported].some(name=>original.has(name)||revised.has(name));
  };
  record.excludedEditorUidChanges=[];
  for(const [path,value] of beforeUids){
    if(afterUids.get(path)===value)continue;
    if(!excludedEditorImage(path))return false;
    record.excludedEditorUidChanges.push({path,before_uid:value,after_uid:afterUids.get(path)??null,kind:afterUids.has(path)?'changed':'removed',reason:'Pinned export preset excludes PNG; image/import/remap/imported texture absent from both PCKs.'});
  }
  record.addedUidPaths=[...afterUids.keys()].filter(path=>!beforeUids.has(path)).sort();
  for(const path of record.addedUidPaths){
    if(newUidPaths(entry.id).includes(path))continue;
    if(!excludedEditorImage(path))return false;
    record.excludedEditorUidChanges.push({path,before_uid:null,after_uid:afterUids.get(path),kind:'added',reason:'Pinned export preset excludes PNG; image/import/remap/imported texture absent from both PCKs.'});
  }
  record.originalRuntimeUidIdentitiesPreserved=true;
  // Earlier title-only revisions remain exact wherever a records hook did not replace them.
  for(const revision of game.titleRevision?.changedPackedResources??[]){
    if(recordHooks[entry.id].includes(revision.path))continue;
    if(hash(original.get(revision.path))!==revision.sourceSha256||hash(revised.get(revision.path))!==revision.sha256)return false;
  }
  record.sourcePreservation='Original resources retained; only enumerated title/hooks/helper/UID metadata and bounded Game013/014 icon rasterization differences permitted.';
  return true;
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
    if(!record.equal&&delivered&&['index.pck','index.html','index.icon.png','index.apple-touch-icon.png'].includes(name)){
      const game=manifest.games.find(g=>g.slug===entry.id),expected=game.runtimeFiles.find(r=>r.path.endsWith('/'+destination));
      if(game.recordsBridgeSchema===1){
        record.authorizedSourceRebuild=await authorizedSourceRebuild(entry,game,source,delivered,record);
      }else{
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
    }
    assets.push(record);if(!record.equal&&!record.authorizedTitleRevision&&!record.authorizedSourceRebuild)issues.push(`${entry.id}/${destination}: missing or unexpected difference from original export`);
  }
  records.push({...entry,target,assets,excludedMetadata,totalBytes:assets.reduce((n,r)=>n+r.bytes,0)});
}
await mkdir('docs/fourteen-game/QA',{recursive:true});
await writeFile(process.env.LEGACY_BINARY_REPORT??`docs/legacy-games/title-revision/QA/${dist?'LEGACY_DIST_BINARY_AUDIT':'LEGACY_BINARY_AUDIT'}.json`,JSON.stringify({checkedUtc:new Date().toISOString(),scope:'Engine/WASM/audio/worklets remain byte-exact. Title-only or reviewed regular-source records rebuild follows manifest schema2, hashes and enumerated resource changes. Runtime UID identities and unrelated resources stay exact; only014excluded editor-image UIDcache changes are enumerated after preset/packed-resource absence proof. Game013 icon ctex/256px icon only may differ by at most10/65536 pixels; 180px apple icon at most8/32400 pixels, RGB1/255, identical alpha; cause unknown. Game014128px icon/ctex and180px apple icon at most3pixels each with sameRGB1/255/alpha0 limit. Every other external asset stays byte-exact. Unused editor/hosting markers excluded.',records,issues},null,2)+'\n');
console.log(`${records.length} exports /${records.reduce((n,r)=>n+r.assets.length,0)} original files;${issues.length} issues`);
if(issues.length){console.error(issues.join('\n'));process.exitCode=1;}
