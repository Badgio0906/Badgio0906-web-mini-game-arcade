"""Deterministic resizing/cropping of original ImageGen artwork (no new drawing).

Run from repository root: python3 assets/game032/optimize.py
Requires Pillow. Originals remain intact and are never served by the game.
"""
from pathlib import Path
from PIL import Image
import hashlib
import json

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'assets/game032/originals'
OUT = ROOT / 'public/assets/game032'
OUT.mkdir(parents=True, exist_ok=True)

bg = Image.open(SOURCE / 'river-panorama.png').convert('RGB')
bg.save(OUT / 'river-panorama.webp', quality=88, method=6)

# Equal grid cells preserve all eight distinct poses. Move their boot baselines
# onto one common anchor; do not stretch individuals into different proportions.
angler = Image.open(SOURCE / 'angler-atlas.png').convert('RGBA')
poses = ['idle', 'walk-left', 'walk-right', 'ready', 'cast', 'hook', 'reel', 'land']
baselines = [469, 466, 463, 468, 461, 461, 461, 461]
# These are observed source hand positions, relative to original 384x512 cell.
hands = [(292,151), (278,170), (262,177), (235,121),
         (351,62), (283,32), (269,126), (273,125)]
manifest = {'background': {'file':'river-panorama.webp', 'width':1536, 'height':1024,
  'water_y':[0.38,0.72], 'near_bank_y':[0.78,0.91]}, 'angler':{}, 'fish':{}}
contact = Image.new('RGB', (768,512), '#f7f3e8')
for i,name in enumerate(poses):
    x = (i % 4) * 384
    y = (i // 4) * 512
    cell = angler.crop((x,y,x+384,y+512))
    # alpha=0 pixels retain renderer-hidden RGB; discard only those invisible RGB.
    a = cell.getchannel('A')
    cell.putalpha(a.point(lambda v:0 if v < 3 else v))
    cell = cell.resize((192,256), Image.Resampling.LANCZOS)
    shift = 239 - round(baselines[i] / 2)
    sprite = Image.new('RGBA', (192,256))
    sprite.alpha_composite(cell, (0,shift))
    sprite.save(OUT / f'angler-{name}.webp', lossless=True, method=6)
    contact.paste(sprite, ((i%4)*192,(i//4)*256), sprite)
    manifest['angler'][name] = {'file':f'angler-{name}.webp', 'width':192,'height':256,
      'feet_anchor':[96,239], 'rod_hand':[hands[i][0]/2,hands[i][1]/2+shift],
      'source_rect':[x,y,384,512], 'baseline_adjust_px':shift,
      'notes':'One distinct illustrated pose; walking uses the two distinct walk poses.'}
contact.save(ROOT / 'assets/game032/angler-contact-sheet.jpg', quality=94)

fish = Image.open(SOURCE / 'fish-atlas.png').convert('RGBA')
species = ['oikawa','ugui','yamame','amago','iwana','nijimasu']
# The generated atlas is visually inspected: row gaps sit at y=325 and y=650,
# rather than exact 1024/3. Use those gaps to avoid clipping dorsal fins.
row_y = [0,325,650,1024]
fish_contact = Image.new('RGB', (768,384), '#f7f3e8')
for i,name in enumerate(species):
    col = i % 2
    row = i // 2
    rect = (col*768,row_y[row],(col+1)*768,row_y[row+1])
    tile = fish.crop(rect)
    bounds = tile.getchannel('A').point(lambda v:255 if v>30 else 0).getbbox()
    tile = tile.crop((max(0,bounds[0]-8),max(0,bounds[1]-8),
      min(tile.width,bounds[2]+8),min(tile.height,bounds[3]+8)))
    tile.thumbnail((368,168), Image.Resampling.LANCZOS)
    panel = Image.new('RGBA',(384,192))
    panel.alpha_composite(tile,((384-tile.width)//2,(192-tile.height)//2))
    panel.save(OUT / f'fish-{name}.webp',lossless=True,method=6)
    # Inspection sheet only, not a game screenshot or portal thumbnail.
    small=panel.resize((384,128),Image.Resampling.LANCZOS)
    fish_contact.paste(small,(col*384,row*128),small)
    manifest['fish'][name]={'file':f'fish-{name}.webp','width':384,'height':192,
      'direction':'right','source_rect':list(rect)}
fish_contact.save(ROOT / 'assets/game032/fish-contact-sheet.jpg',quality=94)

files=[]
for folder in [SOURCE,OUT]:
    for p in sorted(folder.glob('*')):
        if p.is_file():
            im=Image.open(p)
            files.append({'path':p.relative_to(ROOT).as_posix(),'bytes':p.stat().st_size,
              'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),
              'width':im.width,'height':im.height,'mode':im.mode})
manifest['files']=files
(ROOT / 'assets/game032/asset-index.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps({'distributed_bytes':sum(x['bytes'] for x in files if x['path'].startswith('public/')),
    'files':len(files),'angler_poses':len(poses),'fish':len(species)}))
