"""Technical atlas separation/resize only; no painting/background removal. Pillow12."""
from pathlib import Path
from PIL import Image
import hashlib,json
root=Path(__file__).resolve().parents[3];out=root/'public/assets/game017/revision03';out.mkdir(parents=True,exist_ok=True)
items=[]
def save(name,source,crop):
 im=Image.open(root/source).convert('RGBA').crop(crop)
 # Ignore isolated almost-transparent generator noise when trimming outer padding.
 box=im.getchannel('A').point(lambda a:255 if a>=16 else 0).getbbox()
 assert box,name
 im=im.crop(box); im.thumbnail((360,400),Image.Resampling.LANCZOS);p=out/(name+'.webp');im.save(p,'WEBP',quality=90,method=6)
 items.append(dict(id=name,source=source,crop=list(crop),trim=list(box),size=list(im.size),path=str(p.relative_to(root)),bytes=p.stat().st_size,sha256=hashlib.sha256(p.read_bytes()).hexdigest(),hasAlpha=im.mode=='RGBA'))
names=['player','elegant','tough','office-man','office-woman','student','elderly','family','rare'];ys=[0,420,834,1282]
for i,name in enumerate(names):
 col=i%3;row=i//3;save(name,'assets/game017/revision03/source/cast-v1.png',(col*409,ys[row],(col+1)*409,ys[row+1]))
for name,crop in [('home',(30,0,810,523)),('umbrella-teal',(830,20,1500,525)),('umbrella-red',(100,525,760,1024)),('rain-icon',(910,625,1120,930)),('folded-umbrella',(1150,530,1450,1024))]:save(name,'assets/game017/revision03/source/objects-v1.png',crop)
sources=[]
for name in ['cast-v1.png','objects-v1.png']:
 p=root/'assets/game017/revision03/source'/name;im=Image.open(p);sources.append(dict(path=str(p.relative_to(root)),dimensions=list(im.size),sha256=hashlib.sha256(p.read_bytes()).hexdigest(),alphaRange=list(im.getchannel('A').getextrema())))
index=dict(imageGenerationTool='OpenAI ImageGen',actualSuccessfulCalls=2,modelVersion='UNKNOWN (not exposed)',reference='assets/game017/reorganization/originals/rain-city.png',referenceSha256='197b12031b005c40caacc23197285d95b98904a613e155894f10305afcbbc14d',promptFile='docs/game017/revision03/IMAGEGEN_PROMPTS.md',originals=sources,adoption='adopted for initial playable; independent final technical Visual81/F12/H12, not human approval',generatedToolOutputs=['exec-b3423fe8-d875-4674-9564-76fe61d1d42e.png','exec-87b283be-546d-42f5-9540-60e611198ce8.png'],transparentBackgroundRequested=True,processing='Pillow crop/alpha bbox trim/LANCZOS resize/WebP90; no redraw or masking',assets=items)
(root/'assets/game017/revision03/ASSET_INDEX.json').write_text(json.dumps(index,ensure_ascii=False,indent=2)+'\n');print(len(items),'transparent assets',sum(a['bytes'] for a in items),'bytes')
