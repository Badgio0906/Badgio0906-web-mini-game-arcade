#!/usr/bin/env python3
import argparse,json,hashlib,subprocess,shutil,tempfile
from pathlib import Path
ap=argparse.ArgumentParser();ap.add_argument('--exports',type=Path,required=True);ap.add_argument('--out',type=Path,required=True);a=ap.parse_args();a.out.mkdir(exist_ok=False)
def snapshot():return {str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in Path('public/games').rglob('*') if p.is_file()}
checks=[]
def run(args,expected):
 p=subprocess.run(['python3',*args],capture_output=True,text=True);ok=(p.returncode==0)==expected;checks.append({'command':args[:2],'expected_success':expected,'actual_exit':p.returncode,'pass':ok});assert ok
before=snapshot();run(['tools/import_legacy_games.py','--exports',str(a.exports),'--validate-only'],True)
run(['tools/import_legacy_games.py','--exports',str(a.exports)],True);assert snapshot()==before;checks.append({'name':'verified importer rerun retains identical wrappers/bridge/current packs/audio/font/license/manifest','pass':True})
run(['tools/import_legacy_games.py'],False);assert snapshot()==before
with tempfile.TemporaryDirectory(prefix='legacy-import-invalid-')as temp:
 root=Path(temp)
 for folder in a.exports.iterdir():
  if folder.is_dir():shutil.copytree(folder,root/folder.name,copy_function=shutil.copyfile)
 m=root/'yokodori-days/export-metadata.json';d=json.loads(m.read_text());d['source_overlay'][0]['sha256']='0'*64;m.write_text(json.dumps(d))
 run(['tools/import_legacy_games.py','--exports',str(root)],False);assert snapshot()==before;checks.append({'name':'invalid overlay rejects before any public file write','pass':True})
(a.out/'REPORT.json').write_text(json.dumps({'provenance':'local importer validation/mismatch fixture only, no originals/gameplay/network modifications','checks':checks,'public_files_checked':len(before),'status':'PASS'},indent=2)+'\n')
