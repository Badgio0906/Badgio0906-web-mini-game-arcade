#!/usr/bin/env python3
"""Compile only the authorized 013 first-play gate change using pinned Godot 4.5.1.
Engine/audio/resources and tutorial persistence stay byte-identical to revision02.
"""
from pathlib import Path
import argparse, hashlib, json, shutil, subprocess, tempfile
from rename_legacy_titles import ROOT, export, pack, unpack, digest

EXPECTED = '4.5.1.stable.official.f62fdbde1'
SCRIPT = 'scripts/game_manager.gdc'
BEFORE = '''func start_run() -> void:
\tif seen_tutorial:
\t\trequest_start(1)
\telse:
\t\taudio.unlock()
\t\tshow_help()
'''
AFTER = '''func start_run() -> void:
\t# The surrounding arcade title lets first-time players choose practice explicitly.
\t# Skipping does not mark the native tutorial as completed.
\trequest_start(1)
'''

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--godot',required=True)
    parser.add_argument('--source',type=Path,default=Path('/workspace/legacy-games/tachibana-task-heaven'))
    args=parser.parse_args()
    version=subprocess.check_output([args.godot,'--version'],text=True).strip()
    if version != EXPECTED: raise SystemExit('Exact pinned Godot4.5.1 compiler required')
    target=ROOT/'public/games/tachibana-task-heaven'
    original=target.joinpath('index.pck').read_bytes(); before=unpack(original)
    with tempfile.TemporaryDirectory(prefix='arcade-start013-') as temporary:
        project=Path(temporary)/'project'
        shutil.copytree(args.source,project,ignore=shutil.ignore_patterns('.git','.godot','build','docs','tests'))
        baseline=export(args.godot,project,Path(temporary)/'baseline.pck')
        source=project/'scripts/game_manager.gd'; text=source.read_text()
        if text.count(BEFORE)!=1: raise ValueError('Unexpected first-play gate')
        source.write_text(text.replace(BEFORE,AFTER))
        revised=export(args.godot,project,Path(temporary)/'revised.pck')
        if before[SCRIPT] not in (baseline[SCRIPT], revised[SCRIPT]): raise ValueError('Delivered game_manager is neither baseline nor reviewed start-choice revision')
        after=dict(before);after[SCRIPT]=revised[SCRIPT]
        target.joinpath('index.pck').write_bytes(pack(original,after))
        if unpack(target.joinpath('index.pck').read_bytes())!=after: raise ValueError('Repacked verification failed')
    html=target/'game.html';html.write_text(html.read_text().replace('"index.pck":'+str(len(original)), '"index.pck":'+str(target.joinpath('index.pck').stat().st_size)))
    changed=[{'path':SCRIPT,'previousSha256':hashlib.sha256(baseline[SCRIPT]).hexdigest(),'sha256':hashlib.sha256(after[SCRIPT]).hexdigest()}]
    audit={'compiler':version,'scope':'Remove Game013 forced first-play help/practice gate only; native practice/help/save unchanged','changedResources':changed,'unchangedResourceCount':len(before)-1,'packageSha256':digest(target/'index.pck')}
    manifestpath=ROOT/'public/games/export-manifest.json';manifest=json.loads(manifestpath.read_text())
    manifest['description']='Pinned Godot4.5.1 exports with authorized title revisions and Game013 optional first-play practice; engine/audio/unrelated resources preserved.'
    for game in manifest['games']:
        if game['id']=='game013': game['startChoicesRevision']=audit
        for record in game['runtimeFiles']+game['shellFiles']:
            path=ROOT/record['path'];record['bytes']=path.stat().st_size;record['sha256']=digest(path)
            if 'sourceSha256' in record:
                record['byteIdentical']=record['sourceSha256']==record['sha256']
                if not record['byteIdentical']:record['transformation']='Authorized title revision and optional start-choice shell; Game013 first-play gate change only'
        game['runtimeBytes']=sum(r['bytes'] for r in game['runtimeFiles'])
    manifest['totalRuntimeBytes']=sum(g['runtimeBytes'] for g in manifest['games']);manifestpath.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
    output=ROOT/'docs/start-choices';output.mkdir(exist_ok=True)
    (output/'GAME013_PACKED_RESOURCE_AUDIT.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2)+'\n')
    (output/'game_manager.gd.patch').write_text('--- a/scripts/game_manager.gd\n+++ b/scripts/game_manager.gd\n@@ -199,8 +199,6 @@\n'+''.join('-'+line+'\n' for line in BEFORE.rstrip('\n').split('\n'))+''.join('+'+line+'\n' for line in AFTER.rstrip('\n').split('\n')))
    print(json.dumps(audit,ensure_ascii=False))
if __name__=='__main__':main()
