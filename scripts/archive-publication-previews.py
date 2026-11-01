from pathlib import Path
import shutil,json,zipfile,hashlib,subprocess
root=Path(__file__).resolve().parent.parent;preview=Path('/tmp/100gare-publication-preview-20261101-r1');held=Path('/tmp/100gare-game048-experimental-20261101-r1');g=held/'games/neon-courier';g.mkdir(parents=True,exist_ok=True);shutil.copytree('/tmp/experimental048-publication',g,dirs_exist_ok=True);shutil.copy2(g/'game048.html',g/'index.html')
for n in ['preview.mjs','preview-paths.mjs','START_PREVIEW.cmd']:shutil.copy2(preview/n,held/n)
(held/'index.html').write_text('<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ネオン急便・公開保留の実験候補</title><body style="background:#102237;color:white;font:18px/1.6 system-ui;padding:24px"><h1>ネオン急便：公開保留の実験候補</h1><p>練習・起動は確認済みですが、通常入力による本番完走を確認できていません。正式版・本番公開版ではありません。</p><p><a style="color:cyan;display:inline-block;padding:16px" href="games/neon-courier/index.html">操作を試す</a></p><p>押して掴み、押したまま振り、離して飛びます。取得可能な緑の輪を目印にします。入力の許容時間・案内の分かりやすさは作者確認待ちです。</p></body></html>')
(held/'README.txt').write_text('Game048 experimental/on-hold. Native full-run not verified. No public release or formal completion.\nExtract to a new folder and run START_PREVIEW.cmd. Node.js required.\nOpen http://127.0.0.1:8479/ or use node preview.mjs --port 8480.\nSource game commit9252ffadcb6238e406aa508e6004d0345c79f6d6.\n')
files={str(p.relative_to(held)):hashlib.sha256(p.read_bytes()).hexdigest()for p in sorted(held.rglob('*'))if p.is_file()and p.name!='BUILD_MANIFEST.json'};(held/'BUILD_MANIFEST.json').write_text(json.dumps({'sourceCommit':'9252ffadcb6238e406aa508e6004d0345c79f6d6','state':'ON_HOLD_EXPERIMENTAL','files':files},indent=2))
outputs=[]
for folder,name in [(preview,'100gare-revised-GAPS-22games-20261101-r1.zip'),(held,'100gare-game048-experimental-20261101-r1.zip')]:
 out=Path('/tmp')/name
 with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED,compresslevel=6)as z:
  for p in sorted(folder.rglob('*')):
   if p.is_file():z.write(p,str(p.relative_to(folder)))
 with zipfile.ZipFile(out)as z:
  assert z.testzip()is None
  m=json.loads(z.read('BUILD_MANIFEST.json'))
  for file,sha in m['files'].items():assert hashlib.sha256(z.read(file)).hexdigest()==sha,file
 outputs.append({'path':str(out),'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'bytes':out.stat().st_size,'verified_files':len(m['files'])});print(out,out.stat().st_size,flush=True)
Path('/tmp/100gare-publication-DELIVERY_20261101.json').write_text(json.dumps({'game_source':'9252ffadcb6238e406aa508e6004d0345c79f6d6','branch_head':subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip(),'runtime_packages':outputs,'main_unchanged':True,'pushed':False},indent=2))
