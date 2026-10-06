"""Actual normal gameplay only; proportional resize and solid letterbox."""
from PIL import Image
from pathlib import Path
import hashlib,json
root=Path(__file__).resolve().parents[1];base=Path('docs/seven-games-2026-10-06')
cases={
'game003':('game003/QA/native-revised/desktop-art-pair.png',(430,400,1010,828),'#e9e3d5'),
'game006':('game006/QA/native-second/desktop-slot-choice.png',(238,128,891,781),'#f4ebd4'),
'game007':('game007/QA/limited-final/pc-gameplay.png',(64,182,1376,843),'#eee6d3'),
'game008':('game008/QA/native-isolated/pc-play.png',(180,119,1260,803),'#eee6d3'),
'game009':('game009/QA/touch-scroll-final/desktop-24-normal.png',(173,155,1268,795),'#efdfbc'),
'game010':('game010/QA/native-viewport-retest/desktop-agenda1-middle.png',(141,85,1302,648),'#dde7e2'),
'game018':('independent/018/actual-release-final-desktop/desktop-sneaker-just-release.png',(63,170,1381,760),'#fff3cd')}
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
p=root/'assets/portal/thumbnails/asset-index.json';index=json.loads(p.read_text());old={r['game']:r for r in index['entries']};rows=[]
for gid,(rel,crop,color) in cases.items():
 source=root/base/rel;im=Image.open(source).convert('RGB');panel=im.crop(crop);ratio=min(640/panel.width,360/panel.height);size=(round(panel.width*ratio),round(panel.height*ratio));offset=((640-size[0])//2,(360-size[1])//2);canvas=Image.new('RGB',(640,360),color);canvas.paste(panel.resize(size,Image.Resampling.LANCZOS),offset);output=root/f'public/assets/portal/{gid}.webp';canvas.save(output,format='WEBP',quality=88,method=6)
 row={'game':gid,'source':str(source.relative_to(root)),'sourceSha256':sha(source),'sourceDimensions':list(im.size),'crop':list(crop),'panelDimensions':list(size),'offset':list(offset),'paddingColor':color,'dimensions':[640,360],'path':str(output.relative_to(root)),'bytes':output.stat().st_size,'sha256':sha(output),'status':'actual normal native-input gameplay; seven-game revision02','syntheticContent':False,'fixtureUsed':False,'imageGenerationCalls':0};old[gid]=row;rows.append(row)
index['entries']=[old[r['game']] for r in index['entries']];p.write_text(json.dumps(index,ensure_ascii=False,indent=2)+'\n');(root/base/'QA/THUMBNAILS.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n');print('Updated7 actual640x360 thumbnails; other12 entries retained.')
