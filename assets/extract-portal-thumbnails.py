"""Truthful saved-gameplay thumbnail extraction; no generated poster imagery."""
from pathlib import Path
from PIL import Image
import json,hashlib
root=Path(__file__).resolve().parents[1];folder=root/'assets/portal/thumbnails';folder.mkdir(parents=True,exist_ok=True);public=root/'public/assets/portal';public.mkdir(parents=True,exist_ok=True);sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
specs={
1:('assets/portal/thumbnails/game001-actual-source.png',[358,171,958,771],'#0b1217'),
2:('docs/visual/after/game002-desktop.png',[164,114,1280,785],'#fff3df'),
3:('docs/visual/after/game003-desktop.png',[175,112,1270,771],'#e9e3d5'),
4:('docs/visual/after/game004-desktop.png',[236,184,1204,788],'#222827'),
5:('docs/visual/after/game005-desktop.png',[216,158,1228,758],'#fff1d3'),
6:('docs/ten-game/screenshots/game006/desktop-gameplay.png',[380,73,1205,935],'#f5ecd6'),
7:('docs/ten-game/screenshots/game007/desktop-gameplay.png',[285,76,1330,920],'#eee6d0'),
8:('docs/ten-game/screenshots/game008/desktop-3-cups.png',[225,100,1418,916],'#fff3df'),
9:('docs/ten-game/screenshots/game009/desktop-gameplay.png',[255,91,1665,505],'#fff2da'),
10:('docs/ten-game/screenshots/game010/desktop-gameplay.png',[245,95,1390,976],'#e4e6de'),
}
entries=[]
for n,(src,rect,bg) in specs.items():
 source=root/src;im=Image.open(source).convert('RGB');crop=im.crop(rect);scale=min(640/crop.width,360/crop.height);dims=tuple(round(v*scale) for v in crop.size);offset=((640-dims[0])//2,(360-dims[1])//2);canvas=Image.new('RGB',(640,360),bg);canvas.paste(crop.resize(dims,Image.Resampling.LANCZOS),offset);name=f'game{n:03}.webp';out=public/name;canvas.save(out,'WEBP',quality=85,method=6)
 entries.append({'game':f'game{n:03}','source':src,'sourceSha256':sha(source),'sourceDimensions':list(im.size),'crop':rect,'panelDimensions':list(dims),'offset':list(offset),'paddingColor':bg,'dimensions':[640,360],'path':str(out.relative_to(root)),'bytes':out.stat().st_size,'sha256':sha(out),'status':'interim actual gameplay capture; refresh after new gameplay capture' if n in [7,8,10] else 'actual saved gameplay visual','syntheticContent':False})
m={'description':'Original actual gameplay screenshots, aspect-preserving crop and solid-color letterbox only. No generated promotional scenes, compositing or redrawn HUD. Game011 pending actual render.','entries':entries,'totalBytes':sum(e['bytes'] for e in entries)};(folder/'asset-index.json').write_text(json.dumps(m,indent=2)+'\n');print(json.dumps({'count':len(entries),'bytes':m['totalBytes'],'maximum':max(e['bytes'] for e in entries)}))
