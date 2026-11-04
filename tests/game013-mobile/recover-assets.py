"""Recover unchanged WebP image payloads/data from the retained original PCKs.
No PCK resource is rewritten. This is an extraction, not an image transformation.
"""
from pathlib import Path
import re
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'tools'))
from rename_legacy_titles import unpack
ROOT = Path(__file__).resolve().parents[2]
for slug in ('finger-heart-challenge', 'tachibana-task-heaven'):
    folder = ROOT / 'public/games' / slug
    resources = unpack((folder / 'index.pck').read_bytes())
    output = folder / 'mobile-assets'
    output.mkdir(exist_ok=True)
    for name, data in resources.items():
        if name.startswith('data/') and name.endswith('.json'):
            (output / Path(name).name).write_bytes(data)
        if not name.endswith('.import') or 'approved_poses' in name:
            continue
        match = re.search(r'path="res://([^\"]+\.ctex)"', data.decode())
        if not match:
            continue
        texture = resources[match[1]]
        start = texture.find(b'RIFF')
        if start < 0:
            continue
        filename = Path(name).name.removesuffix('.import').replace('.png', '.webp').replace('.svg', '.webp')
        if slug == 'finger-heart-challenge' and filename in ('failure.webp', 'clear.webp', 'icon.webp'):
            continue
        size = int.from_bytes(texture[start+4:start+8], 'little') + 8
        image = texture[start:start+size]
        if image[8:12] != b'WEBP':
            raise ValueError('Unexpected RIFF format')
        (output / filename).write_bytes(image)
