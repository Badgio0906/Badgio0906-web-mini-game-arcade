#!/usr/bin/env python3
"""Read-only original worktree and task-scope verification to a NEW receipt."""
import argparse,datetime,hashlib,json,subprocess
from pathlib import Path

ap=argparse.ArgumentParser(description=__doc__)
ap.add_argument('--baseline',type=Path,default=Path('docs/legacy-records/QA/BASELINE.json'))
ap.add_argument('--output',type=Path,required=True)
args=ap.parse_args()
if args.output.exists():raise SystemExit('Use a new receipt path; previous evidence is immutable')
base=json.loads(args.baseline.read_text());results=[]
for row in base['protected']:
 root=Path(row['path'])
 if root.resolve()==Path.cwd():continue
 head=subprocess.check_output(['git','-C',str(root),'rev-parse','HEAD'],text=True).strip()
 b=subprocess.run(['git','-C',str(root),'symbolic-ref','-q','HEAD'],capture_output=True,text=True)
 branch=b.stdout.strip() if b.returncode==0 else None
 status=subprocess.check_output(['git','-C',str(root),'status','--porcelain=v1','-z','--untracked-files=all']).decode()
 changed=[name for name,digest in row.get('files',{}).items()if not(root/name).is_file()or hashlib.sha256((root/name).read_bytes()).hexdigest()!=digest]
 ok=head==row['head']and branch==row['branch']and status==row['status']and not changed
 results.append({'path':str(root),'head':head,'branch':branch,'status_identical':status==row['status'],'dirty_files_checked':len(row.get('files',{})),'changed_files':changed,'pass':ok})
files=subprocess.check_output(['git','diff',base['base'],'--name-only'],text=True).splitlines()
expected={'src/data/recordDefinitions.ts','src/records/PortalRecords.ts','src/records/RecordSharing.ts','src/records/localRecords.ts','src/records/LegacyGameRecords.ts','src/records/legacyEntry.ts','src/records/legacyProtocol.ts','src/records/legacyStore.ts','vite.config.ts','tools/import_legacy_games.py','tools/export_legacy_records.py','tools/legacy-records-import.py','tests/fourteen-game/audit-legacy-migration.mjs','tests/records/native-game-browser.mjs','tests/records/portal-browser.mjs','tests/records/public-browser.mjs','tests/records/verify-public.mjs','tests/unit/record-definitions.test.ts','tests/unit/records-client.test.ts','tests/unit/legacy-records.test.ts','analytics-worker/tests/records-local-d1.mjs','docs/records/GAME_RECORD_MATRIX.md','docs/CURRENT_STATUS.md','public/games/export-manifest.json','public/games/native-record-bridge.js'}
prefixes=['docs/legacy-records/','tests/legacy-records/','tools/legacy-record-patches/','tools/legacy-record-shells/',*[f'public/games/{slug}/'for slug in ['yokodori-days','tachibana-task-heaven','finger-heart-challenge']]]
unexpected=[f for f in files if f not in expected and not any(f.startswith(p)for p in prefixes)]
protected=['src/games','src/analytics','src/credit','src/data/gameCatalog.ts','src/data/tagCatalog.ts','analytics-worker/src','analytics-worker/wrangler.jsonc','.github/workflows','package.json','package-lock.json','index.html','privacy.html']
protected_changes=subprocess.check_output(['git','diff',base['base'],'--name-only','--',*protected],text=True).splitlines()
r={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'baseline_commit':base['base'],'checked_head':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'protected_worktrees':results,'protected_source_and_config_changes':protected_changes,'unexpected_task_changes':unexpected,'task_changes':files,'status':'PASS'if all(x['pass']for x in results)and not protected_changes and not unexpected else'FAIL','limit':'Dirty source files are hashed against initial baseline. Ignored dependency caches are not a bytewise package-cache audit. Own task additions are scope-checked relative to original base, not rejected after first commit.'}
args.output.parent.mkdir(parents=True,exist_ok=True);args.output.write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n')
print({'status':r['status'],'other_worktrees':len(results),'unexpected':unexpected,'protected_changes':protected_changes})
raise SystemExit(0 if r['status']=='PASS'else 1)
