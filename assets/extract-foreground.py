"""Isolate two actual ImageGen foreground bodies; technical atlas extraction."""
from pathlib import Path
from PIL import Image
from scipy import ndimage
import numpy as np
import json,hashlib,shutil
root=Path(__file__).resolve().parents[1];folder=root/'assets/game010/foreground';stage=folder/'staging';folder.mkdir(parents=True,exist_ok=True);stage.mkdir(exist_ok=True)
source=folder/'source.png';raw=Path('/workspace/generated_images/exec-e7477b6f-5a7a-4621-802f-ee53cbd43860.png')
if raw.exists():shutil.copyfile(raw,source)
im=Image.open(source).convert('RGBA');sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();entries=[]
for state,rect in [('listen',[18,13,1956,400]),('work',[18,406,1956,793])]:
 crop=im.crop(rect);pixels=np.array(crop);labels,count=ndimage.label(pixels[:,:,3]>=24,np.ones((3,3)));sizes=np.bincount(labels.ravel());sizes[0]=0;body=labels==sizes.argmax();keep=ndimage.binary_dilation(body,iterations=2);discarded=int(((pixels[:,:,3]>=24)&~keep).sum());pixels[~keep,3]=0
 crop=Image.fromarray(pixels);dims=(1200,240);canvas=Image.new('RGBA',(1200,300));canvas.paste(crop.resize(dims,Image.Resampling.LANCZOS),(0,60));name=f'foreground-{state}.webp';out=stage/name;canvas.save(out,'WEBP',quality=84,method=6);check=Image.open(out);assert check.getchannel('A').crop((0,0,1200,30)).getextrema()==(0,0)
 entries.append({'name':name,'state':state,'source':str(source.relative_to(root)),'sourceSha256':sha(source),'sourceDimensions':list(im.size),'sourceBbox':rect,'extraction':'Largest connected body at alpha>=24, expand2px to retain antialias; omit isolated atlas separator specks only','discardedNoisePixels':discarded,'path':f'public/assets/game010/{name}','dimensions':[1200,300],'contentDimensions':list(dims),'offset':[0,60],'anchor':[600,300],'bytes':out.stat().st_size,'sha256':sha(out),'alpha':True,'status':'staged awaiting optimized art acceptance'})
m={'tool':'image_gen__imagegen','calls':1,'provenance':'Generated through actual OpenAI ImageGen with existing original generated portraits as style reference. No third-party stock; applicable OpenAI terms.','reference':'assets/game010/portraits/source.png','totalBytes':sum(e['bytes'] for e in entries),'entries':entries};(folder/'asset-index.json').write_text(json.dumps(m,indent=2)+'\n');print(m['totalBytes'])
