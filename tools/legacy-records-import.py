#!/usr/bin/env python3
"""Import audited regular source exports, retaining versioned managed shells."""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import subprocess

ROOT=Path(__file__).resolve().parents[1]
PINS={
 'game012':('yokodori-days','50a97c339076d3bcadf38ad6be8acade16a8e882','お前の仕事は俺の仕事'),
 'game013':('tachibana-task-heaven','ddc854b67c6c4efe17e0777ec7de1ce01d4f1ac0','タスク天国'),
 'game014':('finger-heart-challenge','36877d55bb44a41087a61bfd38f3ec395040cb3c','指ハートチャレンジ'),
}
REQUIRED={'index.html','index.js','index.pck','index.wasm','index.audio.worklet.js','index.audio.position.worklet.js','index.png','index.icon.png','index.apple-touch-icon.png'}
COMPILER='4.5.1.stable.official.f62fdbde1'
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def within(root,name):
 p=(root/name).resolve()
 if not p.is_relative_to(root.resolve()):raise ValueError('Path outside reviewed root')
 return p
def validate(folder,game_id,sources):
 slug,pin,_=PINS[game_id];repo=sources/slug
 if subprocess.check_output(['git','-C',str(repo),'rev-parse','HEAD'],text=True).strip()!=pin:raise ValueError(f'{game_id}: source pin mismatch')
 metadata=json.loads((folder/'export-metadata.json').read_text())
 if metadata.get('schema_version')!=1 or metadata.get('game_id')!=game_id or metadata.get('slug')!=slug or metadata.get('source_revision')!=pin or metadata.get('compiler')!=COMPILER or metadata.get('regular_source_export') is not True or metadata.get('threads_enabled') is not False:raise ValueError(f'{game_id}: invalid export provenance')
 overlays=metadata.get('source_overlay',[])
 if not overlays or not any(str(row.get('path','')).endswith(f'legacy-record-patches/{game_id}/game_manager.gd.patch' if game_id!='game014' else 'legacy-record-patches/game014/main.gd.patch') for row in overlays):raise ValueError(f'{game_id}: missing native bridge patch')
 for row in overlays:
  source=within(ROOT,row['path'])
  if sha(source)!=row['sha256']:raise ValueError(f'{game_id}: overlay hash mismatch')
 rows=metadata.get('runtime_files',[]);names={row['name'] for row in rows}
 if not REQUIRED<=names or len(names)!=len(rows):raise ValueError(f'{game_id}: incomplete runtime')
 for row in rows:
  p=within(folder,row['name'])
  if p.stat().st_size!=row['bytes'] or sha(p)!=row['sha256']:raise ValueError(f'{game_id}: runtime hash mismatch')
 shell=ROOT/'tools/legacy-record-shells'/slug
 for name in ('index.html','portal-return.css'):
  if not (shell/name).is_file():raise ValueError(f'{game_id}: missing managed shell')
 wrapper=(shell/'index.html').read_text()
 if 'legacy-records.js' not in wrapper or 'records_session' not in wrapper or 'すぐ遊ぶ' not in wrapper:raise ValueError(f'{game_id}: obsolete shell')
 return metadata
def main():
 ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('--exports',type=Path,required=True);ap.add_argument('--sources',type=Path,default=Path('/workspace/legacy-games'));ap.add_argument('--validate-only',action='store_true');args=ap.parse_args()
 # Validate every game and overlay before mutating any public delivery.
 approved={game:validate(args.exports/slug,game,args.sources) for game,(slug,_,_)in PINS.items()}
 if args.validate_only:print('PASS: all three pinned full exports, overlays, runtimes and managed shells validated');return
 manifest=json.loads((ROOT/'public/games/export-manifest.json').read_text());manifest['schemaVersion']=2;manifest['description']='Pinned Godot4.5.1 full source exports with versioned optional native-record overlays; original game assets/rules/saves retained.'
 manifest['recordsBridge']={'path':'public/games/native-record-bridge.js','sha256':sha(ROOT/'public/games/native-record-bridge.js'),'schemaVersion':1}
 for entry in manifest['games']:
  game=entry['id'];slug,pin,title=PINS[game];metadata=approved[game];folder=args.exports/slug;dest=ROOT/'public/games'/slug;shell=ROOT/'tools/legacy-record-shells'/slug
  records=[]
  for row in metadata['runtime_files']:
   name=row['name'];target=dest/('game.html' if name=='index.html' else name);target.parent.mkdir(parents=True,exist_ok=True)
   if name=='index.html':
    html=(folder/name).read_text();html=html.replace('<head>','<head>\n<script src="../native-record-bridge.js"></script>',1);target.write_text(html)
   else:shutil.copy2(folder/name,target)
   records.append({'source':name,'path':str(target.relative_to(ROOT)),'bytes':target.stat().st_size,'sourceSha256':row['sha256'],'sha256':sha(target),'byteIdentical':sha(target)==row['sha256']})
  for name in ('index.html','portal-return.css'):shutil.copy2(shell/name,dest/name)
  entry.update({'titleJa':title,'revision':pin,'sourceExport':'regular-source-export+versioned-record-overlay','sourceOverlay':metadata['source_overlay'],'compiler':COMPILER,'recordsBridgeSchema':1,'runtimeFiles':records,'runtimeBytes':sum(r['bytes']for r in records),'shellFiles':[{'path':str((dest/name).relative_to(ROOT)),'bytes':(dest/name).stat().st_size,'sha256':sha(dest/name)}for name in ('index.html','portal-return.css')]})
 manifest['totalRuntimeBytes']=sum(g['runtimeBytes']for g in manifest['games']);(ROOT/'public/games/export-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n');print('Imported three verified full source exports; managed wrappers/start choices/bridge retained')
if __name__=='__main__':main()
