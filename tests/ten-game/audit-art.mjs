#!/usr/bin/env node
// Read-only art audit; output is docs/ten-game/art/ASSET_AUDIT.json only.
// node tests/ten-game/audit-art.mjs [--dist] [--references] [--require-routes]
// Python3/Pillow decode real alpha. No git, browser, image edit or build.
import {readFile,writeFile,readdir,stat} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve,relative,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
try {
const flags=new Set(process.argv.slice(2));
for(const f of flags)if(!['--dist','--references','--require-routes'].includes(f))throw Error('Unknown flag '+f);
const baselineCommit='6c3357f';
const preservedHashes={
  "game002/commuter-broad.webp": "249b0f2a875b67a7b2ae37bfb0a5eea6fcf0ec988576adee4fa949d34dc4719d",
  "game002/commuter-hurried.webp": "0c7d440f8dfd1b070e3228c8418f5c1242d69ecd21d4711205f38b6fcd069839",
  "game002/commuter-newspaper.webp": "892801526bf704b05722d6114d0caaf7b7927d59770068efcbd6b9e93af67169",
  "game002/commuter-phone.webp": "6333c518371771a32fe74380a018230b6709383ea9038925fa85a1f6e3fc380c",
  "game002/commuter-shopping.webp": "59d3df2e048b1db3ab8da88cb9001918b64f50a37d3a217c663875bc4a914fe1",
  "game002/district-office-left.webp": "c1eadd3973057352ad5ce4dbf689de9d293d7691d3d05940baa034593a0647c6",
  "game002/district-office-right.webp": "2275d5395e7367134f84b2f6fb908fa4f80c37e747170a93fdbce582817fce2e",
  "game002/district-residential-left.webp": "ee6f6d05ae679fa7a398e9e3fc64bce25e724e1c9a76f2f5cc49862682368e96",
  "game002/district-residential-right.webp": "4c5cb5f582c8071b014d99acfadf3a7435414b5e8fcb5e4b9d6ed1bd55de7ebd",
  "game002/district-shopping-left.webp": "503e966ff0b84f227a8b809af44e8de0d436aedeb957ed747d8cbb128480a59e",
  "game002/district-shopping-right.webp": "200a7ef60b19183f530d327227a09c7d119b9e75abfa182d3ebbbd78243c3bf1",
  "game002/district-station-left.webp": "644a915911f86c7d631641b7be4c37e4b5779ce93b5df88a69c3503a6757436a",
  "game002/district-station-right.webp": "76473f677a5409b5dabf41712ae72a6105feaacf58542060522cb2f01c171966",
  "game002/hero.webp": "5d2aeeba0ed619a118a6ad9b34ad14137fad42575ad5d25943b85ac2a6448959",
  "game003/city-sky.webp": "739f55d5862a1d40cdb669b46ea4c279e1637c2f7c855ef6180ad405f60c86cd",
  "game003/module-apartment.webp": "cb6b2f32fbf89c73ff4485562d67038d8d2557fcc63ab8c2fa34bfe030d54fb5",
  "game003/module-cafe.webp": "9bff1eaf2f1d036d3e4b23771dc435f51f2627c2aaee33ca26fe40b14e196816",
  "game003/module-mechanical.webp": "9563935331cea363c2f5e3dea9dcf3cba3c899dc64d1657745c5c75b8b56636c",
  "game003/module-office.webp": "95b5182e11ae6b629699a58ceea333b9a7e0c2b8c678ce4f9022b25ae4a18a56",
  "game003/module-utility.webp": "53dca772133d6106a78ab37b39489b5d4bd78d27fa8e87f0bd40321a1991e9cf",
  "game005/factory.webp": "ed6446d8c91aa6e26a262145e80a3f2badc13a69fbe5dfce6ac59ad26210009b",
  "game005/product-angular-dark.webp": "c22b13accf752a8e9058362b7fd74cd60061ce98364763415492d78cbd32df3b",
  "game005/product-angular-light.webp": "d8fc8772cd4ee7bc6f3faa3428bee15577e75536198934f798be32a399127764",
  "game005/product-round-dark.webp": "d9b89d710e186c2d002c75bad1cf1d38b88eed27429e7b808b35f87177aabf12",
  "game005/product-round-light.webp": "87250e3ebfe218e4ff5c215c40eb045046cd4680e53d11748023570498e51f99"
};
const expected=[
 ['game002-journey','assets/game002/journey/asset-index.json',3,40072],
 ['game006','assets/game006/cars/asset-index.json',3,52134],
 ['game007','assets/game007/occupants/asset-index.json',7,88394],
 ['game008','assets/game008/environment/asset-index.json',1,67398],
 ['game009','assets/game009/desk/asset-index.json',11,149816],
 ['game010','assets/game010/portraits/asset-index.json',6,92040],
];
const errors=[],records=[],sets=[];
const check=(v,m)=>{if(!v)errors.push(m);};
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const json=async p=>JSON.parse(await readFile(resolve(root,p),'utf8'));
const hash=b=>createHash('sha256').update(b).digest('hex');
for(const[id,index,count,totalBytes]of expected){
 const rows=await json(index);
 check(rows.length===count,id+': metadata count mismatch');
 check(rows.reduce((s,r)=>s+r.bytes,0)===totalBytes,id+': metadata byte total mismatch');
 sets.push({id,index,count,totalBytes});
 for(const r of rows)records.push({...r,set:id,index,new:true});
}
for(const game of ['game002','game003','game005']){
 const index='assets/'+game+'/asset-index.json';
 for(const r of await json(index)){
  const name=r.file.split('/').at(-1);
  const source=game==='game002'
   ?'assets/game002/'+(name.startsWith('district-')?'backgrounds/districts-source.png':'characters/commuters-source.png')
   :game==='game003'?'assets/game003/'+(name==='city-sky.webp'?'city-source.png':'modules-source.png')
   :'assets/game005/'+(name==='factory.webp'?'factory-source.png':'products-source.png');
  records.push({...r,set:game+'-preserved',index,new:false,source,sourceInferred:true});
 }
}
check(records.filter(r=>r.new).length===31,'Expected31 new metadata records');
check(records.filter(r=>!r.new).length===25,'Expected25 preserved metadata records');
check(new Set(records.map(r=>r.file)).size===56,'Metadata paths must be56 unique files');
const files=[...new Set(records.flatMap(r=>[r.file,r.source,...(r.stagedFile?[r.stagedFile]:[])]))];
for(const p of files)check(existsSync(resolve(root,p)),'Missing '+p);
const py=[
 "import sys,json",
 "from pathlib import Path",
 "from PIL import Image",
 "req=json.load(sys.stdin);result={}",
 "for name in req['files']:",
 " p=Path(req['root'])/name",
 " if not p.exists():",
 "  result[name]={'error':'missing'};continue",
 " try:",
 "  with Image.open(p) as im:",
 "   has='A' in im.getbands()",
 "   if has:",
 "    a=im.getchannel('A');hist=a.histogram();lo,hi=a.getextrema()",
 "    bbox=a.point(lambda x:255 if x>=24 else 0).getbbox()",
 "    zero=hist[0];partial=sum(hist[1:255])",
 "   else:",
 "    lo=hi=255;bbox=(0,0,im.width,im.height);zero=partial=0",
 "   result[name]={'dimensions':list(im.size),'mode':im.mode,'format':im.format,",
 "    'hasAlphaChannel':has,'alphaRange':[lo,hi],'zeroAlphaPixels':zero,",
 "    'partialAlphaPixels':partial,'visibleAlpha24BBox':list(bbox) if bbox else None}",
 " except Exception as e:result[name]={'error':str(e)}",
 "json.dump(result,sys.stdout)",
].join('\n');
const proc=spawnSync('python3',['-c',py],{input:JSON.stringify({root,files}),encoding:'utf8',maxBuffer:4*1024*1024});
if(proc.status!==0)throw Error('Actual image decode requires Python3+Pillow: '+proc.stderr.trim());
const decoded=JSON.parse(proc.stdout),cache=new Map();
async function bytes(p){if(!cache.has(p))cache.set(p,await readFile(resolve(root,p)));return cache.get(p);}
const rect=(r,w,h)=>Array.isArray(r)&&r.length===4&&r.every(Number.isFinite)&&r[0]>=0&&r[1]>=0&&r[0]<r[2]&&r[1]<r[3]&&r[2]<=w&&r[3]<=h;
const images=[],sources=new Map();
for(const r of records){
 const im=decoded[r.file],src=decoded[r.source];
 if(im?.error||src?.error){check(false,r.file+': image/source decode failed');continue;}
 const buf=await bytes(r.file),sha256=hash(buf),[w,h]=im.dimensions,[sw,sh]=src.dimensions;
 check(buf.length===r.bytes,r.file+': encoded byte mismatch');
 check(eq(im.dimensions,r.dimensions),r.file+': dimension mismatch');
 check(im.format==='WEBP',r.file+': expected WebP');
 check(src.format==='PNG',r.source+': expected PNG source');
 if(r.originalDimensions)check(eq(src.dimensions,r.originalDimensions),r.source+': original dimension mismatch');
 for(const name of ['sourceCell','sourceCrop','sourcePanel'])if(r[name])check(rect(r[name],sw,sh),r.file+': '+name+' outside source');
 if(r.alphaCropWithinCell&&r.sourceCell)check(rect(r.alphaCropWithinCell,r.sourceCell[2]-r.sourceCell[0],r.sourceCell[3]-r.sourceCell[1]),r.file+': alpha crop outside cell');
 if(r.cropWithinPanel&&r.sourcePanel)check(rect(r.cropWithinPanel,r.sourcePanel[2]-r.sourcePanel[0],r.sourcePanel[3]-r.sourcePanel[1]),r.file+': crop outside panel');
 if(r.contentDimensions&&r.contentOffset){
  const[cw,ch]=r.contentDimensions,[x,y]=r.contentOffset;
  check(x>=0&&y>=0&&x+cw<=w&&y+ch<=h,r.file+': padded content outside canvas');
 }
 if(r.anchor)check(r.anchor.length===2&&r.anchor.every(n=>Number.isFinite(n)&&n>=0&&n<=1),r.file+': invalid anchor');
 if(r.new&&r.set!=='game008'){
  check(im.hasAlphaChannel&&im.alphaRange[0]===0&&im.alphaRange[1]>=200,r.file+': transparent sprite background/visible content missing');
  check(src.hasAlphaChannel&&src.alphaRange[0]===0,r.source+': source lacks actual transparency');
 }else if(r.set==='game008')check(!im.hasAlphaChannel&&eq(im.alphaRange,[255,255]),r.file+': environment should be opaque');
 if(r.visibleContentBBox)check(im.visibleAlpha24BBox&&im.visibleAlpha24BBox.every((n,i)=>Math.abs(n-r.visibleContentBBox[i])<=2),r.file+': visible bbox drift >2px after encoding');
 let staging=null,preserved=null;
 if(r.stagedFile){
  const b=await bytes(r.stagedFile);staging={file:r.stagedFile,sha256:hash(b),sameBytes:buf.equals(b)};
  check(staging.sameBytes,r.file+': staging/public mismatch');
 }
 if(!r.new){
  const key=r.file.replace(/^public\/assets\//,'');
  preserved={baselineCommit,baselineSha256:preservedHashes[key],sameBytes:preservedHashes[key]===sha256};
  check(preserved.sameBytes,r.file+': old pinned baseline mismatch');
 }
 sources.set(r.source,{file:r.source,bytes:(await bytes(r.source)).length,sha256:hash(await bytes(r.source)),...src});
 images.push({file:r.file,index:r.index,set:r.set,new:r.new,bytes:buf.length,sha256,...im,
  metadataDimensions:r.dimensions,anchor:r.anchor??null,source:r.source,sourceInferred:!!r.sourceInferred,staging,preserved});
}
async function walk(dir){
 if(!existsSync(dir))return[];
 const out=[];for(const e of await readdir(dir,{withFileTypes:true})){
  const p=resolve(dir,e.name);if(e.isDirectory())out.push(...await walk(p));else if(e.isFile())out.push(p);
 }return out;
}
const imageRegex=/\.(?:webp|png|jpe?g|gif|avif)$/i,approved=new Set(records.map(r=>r.file));
const distinctNewSources=new Set(records.filter(r=>r.new).map(r=>r.source));
check(distinctNewSources.size===6,'Expected six distinct new generated source PNGs');
check(sources.size===12,'Expected six preserved and six new source PNGs');
const publicImages=(await walk(resolve(root,'public/assets'))).filter(p=>imageRegex.test(p)).map(p=>relative(root,p));
const unexpectedPublic=publicImages.filter(p=>!approved.has(p));
check(publicImages.length===56,'Expected56 public game-art images');
check(unexpectedPublic.length===0,'Unapproved public images: '+unexpectedPublic.join(', '));
const logFile='docs/ten-game/art/IMAGEGEN_LOG.md',log=await readFile(resolve(root,logFile),'utf8'),tick=String.fromCharCode(96);
const headings=[...log.matchAll(/^## Game(?:002 journey|00[6-9]|010)$/gm)].map(m=>m[0]);
const outputs=[...log.matchAll(new RegExp('Real generator output: '+tick+'([^'+tick+']+)'+tick,'g'))].map(m=>m[1]);
check(headings.length===6,'Expected6 per-call log sections');
check(outputs.length===6&&new Set(outputs).size===6,'Expected6 distinct generator output paths');
check((log.match(/Exact submitted prompt:/g)||[]).length===6,'Expected6 prompt blocks');
for(const s of sets)check(log.includes(tick+s.index+tick),'Log missing metadata index '+s.index);
let dist={checked:false,reason:'Run --dist after final production build; a stale earlier build is not a pass.'};
if(flags.has('--dist')){
 const directory=resolve(root,'dist');check(existsSync(directory),'dist missing: run npm run build');
 const all=await walk(directory),actual=all.filter(p=>imageRegex.test(p)).map(p=>relative(root,p));
 const expectedPaths=new Set(records.map(r=>r.file.replace(/^public\//,'dist/')));
 const unexpected=actual.filter(p=>!expectedPaths.has(p)),missing=[...expectedPaths].filter(p=>!existsSync(resolve(root,p))),mismatches=[];
 for(const p of expectedPaths)if(existsSync(resolve(root,p))&&!Buffer.from(await readFile(resolve(root,p))).equals(await bytes(p.replace(/^dist\//,'public/'))))mismatches.push(p);
 const forbidden=all.map(p=>relative(root,p)).filter(p=>/\/asset-index\.json$|\/(?:ASSET_AUDIT|IMAGEGEN_LOG)\.(?:json|md)$|\/(?:staging|concept)\//.test(p));
 check(unexpected.length===0,'dist unadopted images/originals: '+unexpected.join(', '));
 check(missing.length===0,'dist missing accepted images: '+missing.join(', '));
 check(mismatches.length===0,'dist/public byte mismatch: '+mismatches.join(', '));
 check(forbidden.length===0,'dist source/metadata/staging artifacts: '+forbidden.join(', '));
 dist={checked:true,imageCount:actual.length,expectedImageCount:56,unexpected,missing,mismatches,forbidden,
  imageBytes:(await Promise.all(actual.map(async p=>(await stat(resolve(root,p))).size))).reduce((a,b)=>a+b,0)};
}
let references={checked:false,reason:'Pending all Game006–010 implementations. Run --references or --require-routes after integration. Dynamic paths need production network QA.'};
if(flags.has('--references')||flags.has('--require-routes')){
 const routes=[];
 for(const game of ['game006','game007','game008','game009','game010']){
  const files=(await walk(resolve(root,'src/games',game))).filter(p=>/\.(?:ts|css|html)$/.test(p));
  const html=resolve(root,game+'.html');if(existsSync(html))files.push(html);
  const literal=[],dynamic=[];
  for(const file of files){
   const content=await readFile(file,'utf8');
   for(const m of content.matchAll(/\/assets\/game0(?:0[2-9]|10)\/[^"\x60'()\s<>]+/g)){
    const pathname=m[0],item={source:relative(root,file),pathname};
    if(pathname.includes('$'+'{')){
     dynamic.push({...item,kind:'template filename; runtime resolution pending'});continue;
    }
    if(!/\.(?:webp|png|jpe?g|avif)$/.test(pathname)){
     dynamic.push({...item,kind:'directory/concatenated prefix; runtime resolution pending'});continue;
    }
    item.exists=existsSync(resolve(root,'public'+pathname));check(item.exists,game+': unresolved literal '+pathname);
    literal.push(item);
   }
  }
  if(flags.has('--require-routes')){
   check(files.length>0,game+': no implemented source');
   check(existsSync(html),game+': HTML route missing');
   check(literal.length+dynamic.length>0,game+': no generated asset reference');
  }
  routes.push({game,sourceFiles:files.length,literalReferences:literal,dynamicReferences:dynamic});
 }
 references={checked:true,strictRoutes:flags.has('--require-routes'),routes,
  limitation:'Checks literal source paths; template/computed paths are recorded, not claimed runtime-verified. Production network QA remains required.'};
}
const result={
 generatedAt:new Date().toISOString(),status:errors.length?'FAIL':'PASS',
 command:'node tests/ten-game/audit-art.mjs'+(flags.size?' '+[...flags].join(' '):''),
 checks:{newFiles:31,preservedFiles:25,publicFiles:publicImages.length,newBytes:489854,baselineCommit,
  preservedHashesVerified:Object.keys(preservedHashes).length,sourcePNGCount:sources.size,newSourcePNGCount:distinctNewSources.size,
  loggedImageGenCalls:headings.length,stagingPublicCopiesChecked:records.filter(r=>r.stagedFile).length,unexpectedPublic},
 sets,sources:[...sources.values()],images,
 imageGenLog:{file:logFile,distinctRecordedOutputs:outputs,limitation:'Validates recorded tool-output/prompt/source entries, not independent proof or recreation of historical tool execution.'},
 dist,references,errors,
 dependencies:{node:'Node ESM builtins; no git dependency',imageDecode:'python3 + Pillow for real PNG/WebP alpha; no image mutation'},
 limits:['No browser launched; no game/runtime/fonts/core/config edited.','Asset audit does not replace integrated visual quality, gameplay/hit-area QA or real-device performance.'],
};
await writeFile(resolve(root,'docs/ten-game/art/ASSET_AUDIT.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({status:result.status,newFiles:31,preservedFiles:25,newBytes:489854,sourcePNGCount:sources.size,
 distChecked:dist.checked,referencesChecked:references.checked,errors}));
if(errors.length)process.exitCode=1;
} catch(error) {
 const failure={generatedAt:new Date().toISOString(),status:'FAIL',
  command:'node tests/ten-game/audit-art.mjs '+process.argv.slice(2).join(' '),
  errors:[String(error)],checks:null,
  limitation:'Audit could not complete; this replaces any previous PASS report.'};
 await writeFile(resolve(root,'docs/ten-game/art/ASSET_AUDIT.json'),JSON.stringify(failure,null,2)+'\n');
 console.error(JSON.stringify(failure));
 process.exitCode=1;
}
