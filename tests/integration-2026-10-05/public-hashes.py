from pathlib import Path
from urllib.request import urlopen,Request
from concurrent.futures import ThreadPoolExecutor
import hashlib,json,re,sys,datetime
out=Path(sys.argv[1]);out.mkdir(parents=True,exist_ok=True)
pages=['index.html','game015.html','game018.html','game019.html','games/yokodori-days/index.html','games/tachibana-task-heaven/index.html','games/finger-heart-challenge/index.html']
paths=set(pages+['fonts/arcade-rounded-jp.woff2','assets/portal/game015.webp','assets/portal/game018.webp','assets/portal/game019.webp','games/tachibana-task-heaven/index.pck'])
for p in pages:
 for r in re.findall(r'(?:src|href)="([^"]+)"',Path('dist',p).read_text()):
  if r.startswith('./assets/') or r.startswith('/assets/'): paths.add(r.lstrip('./'))
def probe(p):
 expected=Path('dist',p).read_bytes()
 with urlopen(Request('https://game100garage.com/'+p,headers={'Cache-Control':'no-cache'}),timeout=30) as r: b=r.read();status=r.status
 return {'path':p,'status':status,'expectedSha256':hashlib.sha256(expected).hexdigest(),'publishedSha256':hashlib.sha256(b).hexdigest(),'bytes':len(b),'match':b==expected}
with ThreadPoolExecutor(max_workers=4) as pool:rows=list(pool.map(probe,sorted(paths)))
report={'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'base':'https://game100garage.com/','files':rows,'status':'PASS' if all(r['match'] for r in rows) else 'FAIL'}
(out/'asset-hashes.json').write_text(json.dumps(report,indent=2)+'\n');print(report['status'],len(rows),'published files');sys.exit(report['status']!='PASS')
