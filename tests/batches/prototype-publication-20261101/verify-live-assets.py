from pathlib import Path
import json,urllib.request,urllib.parse,hashlib,concurrent.futures,re,time
root=Path(__file__).resolve().parents[3];task=root/'docs/agent-tasks/prototype-publication-20261101';base='https://game100garage.com/';plan=json.loads((task/'PUBLICATION_PLAN.json').read_text())['entries'];checks=[]
for e in plan:
 if e['id']=='game048':continue
 local=root/'dist/games'/e['slug'];url=urllib.parse.urljoin(base,e['route']);html=(local/'index.html').read_text();checks.append((url,local/'index.html','html',e['id']))
 for asset in re.findall(r'(?:src|href)="([^"<>]+\.(?:js|css))"',html):
  if asset.startswith('http'):continue
  checks.append((urllib.parse.urljoin(url,asset),local/asset,'code',e['id']))
 if e['id']in ['game040','game041','game042','game043','game044','game045','game046','game047','game049']:
  bank=(local/'assets/game040/gaps/bank.json')if e['id']=='game040'else(local/'assets/gaps/bank.json');bankurl=urllib.parse.urljoin(url,str(bank.relative_to(local)));checks.append((bankurl,bank,'bank',e['id']))
  for cue,s in json.loads(bank.read_text())['sounds'].items():checks.append((urllib.parse.urljoin(bankurl,s['file']),bank.parent/s['file'],'wav',e['id']))
def fetch(row):
 url,p,kind,gid=row;before=hashlib.sha256(p.read_bytes()).hexdigest();req=urllib.request.Request(url,headers={'User-Agent':'100gare-publication-verification/20261101','Accept-Encoding':'identity'})
 with urllib.request.urlopen(req,timeout=40)as response:data=response.read();status=response.status;final=response.url
 actual=hashlib.sha256(data).hexdigest();return{'url':url,'game':gid,'kind':kind,'http':status,'final_url':final,'expected_sha256':before,'sha256':actual,'match':actual==before,'bytes':len(data)}
with concurrent.futures.ThreadPoolExecutor(max_workers=3)as pool:results=list(pool.map(fetch,checks))
report={'main':'7209da2f92a61c1137466192f0a5ecd9238005e8','scope':'canonical HTTPS byte comparison;no JS/ad/Telemetry execution','checks':results,'checked':len(results),'wav_count':sum(r['kind']=='wav'for r in results),'status':'PASS'if all(r['match']and r['http']==200 and r['final_url'].startswith(base)for r in results)else'FAIL'}
(task/'QA/LIVE_ASSET_INTEGRITY.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(report['status'],report['checked'],'files',report['wav_count'],'WAVs');print([(r['game'],r['kind'],r['url'])for r in results if not r['match']]);assert report['status']=='PASS'
