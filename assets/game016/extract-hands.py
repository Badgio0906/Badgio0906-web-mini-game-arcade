"""Crop/normalize actual generated whole hands; no drawn replacement art."""
from pathlib import Path
from PIL import Image
import json,hashlib,shutil
root=Path(__file__).resolve().parents[2];folder=root/'assets/game016';stage=folder/'staging';stage.mkdir(parents=True,exist_ok=True)
raw=Path('/workspace/generated_images/exec-a7c8bf66-cf11-4791-aae9-dd19f6ea1cde.png');source=folder/'source.png'
if raw.exists():shutil.copyfile(raw,source)
im=Image.open(source).convert('RGBA');sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();entries=[]
for i,name in enumerate(['rock','scissors','paper']):
 rect=[i*724,0,(i+1)*724,724];cell=im.crop(rect);bbox=cell.getchannel('A').point(lambda a:255 if a>=24 else 0).getbbox();crop=cell.crop(bbox);scale=208/max(crop.size);dims=[round(n*scale) for n in crop.size];offset=[(256-dims[0])//2,(256-dims[1])//2];canvas=Image.new('RGBA',(256,256));canvas.paste(crop.resize(dims,Image.Resampling.LANCZOS),offset);filename=f'hand-{name}.webp';out=stage/filename;canvas.save(out,'WEBP',quality=86,method=6)
 entries.append({'id':name,'name':filename,'path':f'public/assets/game016/{filename}','source':'assets/game016/source.png','sourceSha256':sha(source),'sourceDimensions':list(im.size),'cellRect':rect,'sourceBbox':[bbox[0]+rect[0],bbox[1],bbox[2]+rect[0],bbox[3]],'dimensions':[256,256],'contentDimensions':dims,'offset':offset,'anchor':[128,128],'bytes':out.stat().st_size,'sha256':sha(out),'stagedPath':str(out.relative_to(root)),'alpha':True,'status':'staged; pending Art Director optimized acceptance'})
m={'tool':'image_gen__imagegen','actualCalls':1,'transparentBackground':True,'provenance':'Original actual OpenAI ImageGen output; no external stock or copied emoji retrieved. Applicable OpenAI terms, no invented CC0 license claim. Technical crop, proportional resize, WebP only.','totalBytes':sum(e['bytes'] for e in entries),'entries':entries};(folder/'asset-index.json').write_text(json.dumps(m,indent=2)+'\n');print(json.dumps({'count':3,'bytes':m['totalBytes']}))
