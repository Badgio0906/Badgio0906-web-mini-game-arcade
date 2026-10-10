"""Crop/alpha-normalize/optimize adopted ImageGen originals; never redraw artwork.

Run: python3 assets/game032/revision01/optimize.py (requires Pillow).
The existing background and fish assets are not written by this script.
"""
from pathlib import Path
from PIL import Image, ImageDraw
import hashlib
import json

ROOT = Path(__file__).resolve().parents[3]
ART = ROOT / 'assets/game032/revision01'
OUT = ROOT / 'public/assets/game032'
poses = ['idle', 'ready', 'cast', 'hook', 'reel', 'land']
baselines = [499, 497, 495, 491, 491, 493]
feet_x = [271, 265, 258, 286, 264, 275]
hands = [(285,255), (193,163), (386,116), (192,127), (277,196), (281,238)]
scale = .45
sheet = Image.open(ART / 'originals/boy-atlas.png').convert('RGBA')
contact = Image.new('RGB', (576, 540), '#f7f3e8')
annotated = contact.copy()
manifest = {'boy': {}, 'aquarium': {'file':'aquarium.webp', 'width':512,
  'height':512, 'water_window_normalized':[.08,.21,.92,.73],
  'notes':'Actual front-glass water bounds extend .04-.96/.17-.83. The recommended swim window conservatively avoids surface, stone, plants, sand and rim.'},
  'preserved_background':{'file':'river-panorama.webp',
    'sha256':'f5a465ffe91acbc7c1c083d117f0cc7770e33139daa21fe3688c69b505c19d5d'}}
for i, pose in enumerate(poses):
    x,y = (i%3)*512,(i//3)*512
    cell = sheet.crop((x,y,x+512,y+512))
    # Tool output contains invisible brown RGB and very-low-alpha speckles.
    # Remove only alpha<8, then normalize source's maximum254 to255.
    cell.putalpha(cell.getchannel('A').point(lambda a:0 if a<8 else min(255,round(a*255/254))))
    scaled = cell.resize((230,230),Image.Resampling.LANCZOS)
    ox = round(96-feet_x[i]*scale)
    oy = round(239-baselines[i]*scale)
    sprite = Image.new('RGBA',(192,256))
    sprite.alpha_composite(scaled,(ox,oy))
    sprite.save(OUT / f'boy-{pose}.webp',lossless=True,method=6)
    hx,hy = round(hands[i][0]*scale+ox,2),round(hands[i][1]*scale+oy,2)
    manifest['boy'][pose]={'file':f'boy-{pose}.webp','width':192,'height':256,
       'feet_anchor':[96,239],'rod_hand':[hx,hy],
       'source_rect':[x,y,512,512],'scale':scale,'translation':[ox,oy],
       'notes':'Original single distinct pose; no movement frames. Rod/line are code-drawn and attach to observed gripping hand.'}
    cx,cy = (i%3)*192,(i//3)*270
    contact.paste(sprite,(cx,cy),sprite)
    annotated.paste(sprite,(cx,cy),sprite)
    for panel in [contact,annotated]:
       ImageDraw.Draw(panel).text((cx+8,cy+253),pose,fill='#164342')
    d=ImageDraw.Draw(annotated)
    d.ellipse((cx+hx-4,cy+hy-4,cx+hx+4,cy+hy+4),outline='#c73751',width=2)
    d.line((cx+88,cy+239,cx+104,cy+239),fill='#276bbc',width=2)
contact.save(ART/'boy-contact-sheet.webp',quality=92,method=6)
annotated.save(ART/'boy-anchor-sheet.webp',quality=92,method=6)
aquarium=Image.open(ART/'originals/aquarium.png').convert('RGB')
aquarium.resize((512,512),Image.Resampling.LANCZOS).save(OUT/'aquarium.webp',quality=88,method=6)
files=[]
for p in [ART/'originals/boy-atlas.png',ART/'originals/aquarium.png',
          *[OUT/f'boy-{pose}.webp' for pose in poses],OUT/'aquarium.webp']:
    im=Image.open(p)
    files.append({'path':p.relative_to(ROOT).as_posix(),'width':im.width,'height':im.height,
      'mode':im.mode,'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),
      'alpha_extrema':im.getchannel('A').getextrema() if im.mode=='RGBA' else None})
manifest['files']=files
(ART/'asset-index.json').write_text(json.dumps(manifest,indent=2)+'\n')
assert hashlib.sha256((OUT/'river-panorama.webp').read_bytes()).hexdigest()==manifest['preserved_background']['sha256']
print(json.dumps({'new_public_files':7,'public_bytes':sum(f['bytes'] for f in files if f['path'].startswith('public/')),
   'background_preserved':True,'boy_poses':6}))
