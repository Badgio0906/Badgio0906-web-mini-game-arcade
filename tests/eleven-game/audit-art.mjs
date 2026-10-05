#!/usr/bin/env node
// Read-only image verification; only writes the reproducible audit report.
// node tests/eleven-game/audit-art.mjs [--dist] [--final]
import {spawnSync} from 'node:child_process';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const flags=process.argv.slice(2);
if(flags.some(f=>!['--dist','--final'].includes(f)))throw Error('Unknown audit option');
const python=String.raw`
from pathlib import Path
from PIL import Image
import json,hashlib,sys,datetime
root=Path(sys.argv[1]);flags=set(sys.argv[3:]);errors=[];images=[];check=lambda v,m:errors.append(m) if not v else None
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
load=lambda p:json.loads((root/p).read_text())
legacy=load('assets/eleven-game-baseline.json')['images'];expected={r['file']:r for r in legacy}
sets=[];sources=set()
for index,count in [('assets/game011/icons/asset-index.json',20),('assets/game010/foreground/asset-index.json',2),('assets/game016/asset-index.json',3),('assets/portal/thumbnails/asset-index.json',16 if '--final' in flags else 15)]:
 m=load(index);rows=m['entries'];check(len(rows)>=count,index+': missing expected records');check(m['totalBytes']==sum(r['bytes'] for r in rows),index+': wrong byte total');sets.append({'index':index,'count':len(rows),'bytes':m['totalBytes']})
 for r in rows:
  check(r['path'] not in expected,'Duplicate path '+r['path']);expected[r['path']]={**r,'file':r['path']};src=root/r['source'];check(src.exists(),'Missing source '+r['source']);sources.add(r['source'])
  if src.exists():check(sha(src)==r['sourceSha256'],'Source hash changed '+r['source'])
  if 'stagedPath' in r:
   stage=root/r['stagedPath'];check(stage.exists(),'Missing staging '+r['stagedPath']);check(stage.exists() and sha(stage)==r['sha256'],'Staging differs '+r['path'])
  if 'sourceBbox' in r and src.exists():
   with Image.open(src) as im:x0,y0,x1,y1=r['sourceBbox'];check(0<=x0<x1<=im.width and 0<=y0<y1<=im.height,'Source rect out of bounds '+r['path'])
 for r in rows:
  if r.get('alpha'):check(r['status'].startswith('adopted'),'Unaccepted art '+r['path'])
  if '--final' in flags:check('interim' not in r['status'],'Interim thumbnail must be refreshed '+r['path'])
icons=load('assets/game011/icons/asset-index.json')['entries'];check(len({r['sha256'] for r in icons})==20,'Icons must20 distinct byte assets');check(sum(r['category']=='unko' for r in icons)==10 and sum(r['category']=='ukon' for r in icons)==10,'Expected10+10categories')
for name,r in expected.items():
 p=root/name;check(p.exists(),'Missing public '+name)
 if not p.exists():continue
 check(p.stat().st_size==r['bytes'],'Byte mismatch '+name);check(sha(p)==r['sha256'],'Hash mismatch '+name)
 with Image.open(p) as im:
  check(list(im.size)==r['dimensions'],'Dimensions mismatch '+name);has='A' in im.getbands();entry={'path':name,'bytes':p.stat().st_size,'sha256':sha(p),'dimensions':list(im.size),'mode':im.mode}
  if r.get('alpha'):
   check(has,'Missing alpha '+name)
   if has:
    a=im.getchannel('A');entry['alphaRange']=list(a.getextrema());check(a.getextrema()[0]==0,'No actual transparency '+name)
    if name.startswith('public/assets/game011'):
     bbox=a.point(lambda v:255 if v>=24 else 0).getbbox();entry['visibleBBox']=list(bbox);check(bbox[0]>=22 and bbox[1]>=22 and bbox[2]<=234 and bbox[3]<=234,'Unsafe icon margin '+name)
    if '/foreground-' in name:check(a.crop((0,0,1200,30)).getextrema()==(0,0),'Unsafe foreground upper margin '+name)
  images.append(entry)
actual={str(p.relative_to(root)) for p in (root/'public/assets').rglob('*.webp')};check(actual==set(expected),'Unexpected/missing public WebPs: '+str(sorted(actual.symmetric_difference(expected))))
check(not list((root/'public/assets').rglob('*.png')),'SourcePNG unexpectedly in public assets')
log=(root/'docs/eleven-game/art/IMAGEGEN_LOG.md').read_text();check(log.count('Tool: '+chr(96)+'image_gen__imagegen'+chr(96)+' (actually executed, successful output).')==3,'Expected3 actual calls logged')
dist={'status':'pending final build'}
if '--dist' in flags:
 dist={'status':'checked','matched':0}
 for name,r in expected.items():
  p=root/'dist'/name.removeprefix('public/');check(p.exists(),'Missing dist '+str(p.relative_to(root)))
  if p.exists():check(sha(p)==r['sha256'],'Wrong dist bytes '+name);dist['matched']+=1
 paths={str(p.relative_to(root/'dist')) for p in (root/'dist/assets').rglob('*.webp')};check(paths=={p.removeprefix('public/') for p in expected},'Unexpected dist WebPs')
 forbidden=[str(p.relative_to(root/'dist')) for p in (root/'dist/assets').rglob('*') if p.is_file() and (p.suffix.lower()=='.png' or p.name=='asset-index.json' or 'source' in p.name or 'staging' in p.parts)];check(not forbidden,'Unadopted originals/metadata in dist '+str(forbidden));dist['forbidden']=forbidden
report={'generatedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'status':'FAIL' if errors else 'PASS','command':'node tests/eleven-game/audit-art.mjs '+' '.join(sorted(flags)),'legacy56Preserved':len(legacy),'historicalElevenGameImageGenCalls':3,'game016ImageGenCalls':load('assets/game016/asset-index.json')['actualCalls'],'sets':sets,'sourceCount':len(sources),'publicWebPCount':len(actual),'publicWebPBytes':sum(r['bytes'] for r in expected.values()),'images':images,'dist':dist,'finalThumbnailGate':'required and checked' if '--final' in flags else 'Game011 and updated007008010 capture pending','errors':errors,'limits':'Checks actual bytes/decoded dimensions/alpha/hash/source rectangles; does not claim gameplay Visual Gate or human playtesting.'}
out=root/(sys.argv[2] or 'docs/eleven-game/art/ASSET_AUDIT.json');out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({k:report[k] for k in ['status','legacy56Preserved','historicalElevenGameImageGenCalls','game016ImageGenCalls','publicWebPCount','errors']}));sys.exit(1 if errors else 0)
`;
const r=spawnSync('python',['-c',python,root,process.env.ARCADE_ASSET_AUDIT_REPORT??'',...flags],{encoding:'utf8',maxBuffer:5*1024*1024});
process.stdout.write(r.stdout??'');process.stderr.write(r.stderr??'');process.exit(r.status??1);
