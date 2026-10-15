"""Mechanical crop/contain of actual game screenshots; no invented screen content."""
from pathlib import Path
from PIL import Image, ImageOps
import argparse, hashlib, json, shutil

parser = argparse.ArgumentParser()
parser.add_argument('game')
parser.add_argument('source')
parser.add_argument('--crop', type=int, nargs=4)
parser.add_argument('--color', default='#f7f4e9')
parser.add_argument('--nearest', action='store_true')
args = parser.parse_args()
root = Path(__file__).resolve().parents[4]
base = Path(__file__).resolve().parent
idx = root / 'assets/portal/thumbnails/asset-index.json'
data = json.loads(idx.read_text())
source = root / args.source
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
fingerprint = sha(source)
original = base / 'originals' / f'{args.game}-actual-source-{fingerprint[:12]}.png'
original.parent.mkdir(parents=True, exist_ok=True)
shutil.copy2(source, original)
dest = root / f'public/assets/portal/{args.game}.webp'
previous = base / f'{args.game}-previous.webp'
if dest.exists() and not previous.exists():
    shutil.copy2(dest, previous)
old = next((e for e in data['entries'] if e['game'] == args.game), None)
if old:
    history = base / 'entry-history'
    history.mkdir(exist_ok=True)
    (history / f"{args.game}-{old['sha256'][:12]}.json").write_text(json.dumps(old, ensure_ascii=False, indent=2) + '\n')
with Image.open(source) as im:
    dimensions = im.size
    crop = args.crop or [0, 0, *dimensions]
    resampling = Image.Resampling.NEAREST if args.nearest else Image.Resampling.LANCZOS
    panel = ImageOps.contain(im.convert('RGB').crop(crop), (640, 360), resampling)
    image = Image.new('RGB', (640, 360), args.color)
    offset = ((640 - panel.width) // 2, (360 - panel.height) // 2)
    image.paste(panel, offset)
    image.save(dest, 'WEBP', quality=90, method=6)
entry = dict(game=args.game, source=str(original.relative_to(root)), sourceSha256=sha(original),
             sourceDimensions=dimensions, crop=crop, panelDimensions=panel.size, offset=offset,
             paddingColor=args.color, dimensions=[640, 360], path=str(dest.relative_to(root)),
             bytes=dest.stat().st_size, sha256=sha(dest),
             status='actual normal-input gameplay screenshot, crop/contain only; not a Visual or human approval',
             syntheticContent=False, fixtureUsed=False, imageGenerationCalls=0,
             originalCapture=args.source, resampling='NEAREST' if args.nearest else 'LANCZOS',
             revision='reorganization-2026-10-15',
             previousEntryArchive='assets/portal/thumbnails/reorganization-2026-10-15/previous-asset-index.json',
             previousPublicImage=str(previous.relative_to(root)) if previous.exists() else None)
if old:
    data['entries'][data['entries'].index(old)] = entry
else:
    data['entries'].append(entry)
data['totalBytes'] = sum(e['bytes'] for e in data['entries'])
idx.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
(base / f'{args.game}-crop.json').write_text(json.dumps(entry, ensure_ascii=False, indent=2) + '\n')
print(args.game, dimensions, crop, panel.size, dest.stat().st_size)
