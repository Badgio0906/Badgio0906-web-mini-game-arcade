import json,subprocess,hashlib,pathlib,sys,datetime
base=json.loads(pathlib.Path('docs/game031/QA/BASELINE.json').read_text());errors=[]
for r in base['protected_worktrees']:
 p=r['path'];head=subprocess.check_output(['git','rev-parse','HEAD'],cwd=p,text=True).strip();branch=subprocess.check_output(['git','symbolic-ref','HEAD'],cwd=p,text=True).strip();status=subprocess.check_output(['git','status','--porcelain=v1','-z','--untracked-files=all'],cwd=p).decode()
 if(head,branch,status)!=(r['head'],r['branch'],r['status']):errors.append({'path':p,'kind':'gitstate_changed'})
 for path,sha in r['files'].items():
  f=pathlib.Path(p)/path
  if not f.is_file() or hashlib.sha256(f.read_bytes()).hexdigest()!=sha:errors.append({'path':str(f),'kind':'dirtyfile_changed'})
result={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'protected_worktrees':len(base['protected_worktrees']),'errors':errors,'result':'PASS'if not errors else'FAIL'}
print(json.dumps(result,ensure_ascii=False));sys.exit(bool(errors))
