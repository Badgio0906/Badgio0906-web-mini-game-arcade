#!/usr/bin/env python3
"""Rebuild Game031 user BaseColor textures. Requires Python 3 and Pillow.

Normal npm CI/build consumes committed WebPs and does not require this script,
Pillow, the source directory, or any Windows-specific path.
"""
import argparse
import hashlib
import io
import json
import math
import shutil
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFont, ImageStat, __version__

ROOT = Path(__file__).resolve().parents[2]
ASSETS = ROOT / 'assets/game031/textures-a/v1'
PUBLIC = ROOT / 'public/assets/game031/textures-a/v1'
QA = ROOT / 'docs/game031/textures-a/v1/QA'


def digest(data):
    return hashlib.sha256(data).hexdigest()


def write_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')


def metrics(reference, decoded):
    stats = ImageStat.Stat(ImageChops.difference(reference, decoded))
    mse = sum(v * v for v in stats.rms) / 3
    return {'mae_rgb': round(sum(stats.mean) / 3, 3),
            'psnr_db': round(10 * math.log10(255 * 255 / mse), 3) if mse else None}


def contact(materials, resolver, path, repeat=False):
    size, label = (160, 76) if repeat else (256, 76)
    panel = size * 3 if repeat else size
    columns = 2 if repeat else 4
    out = Image.new('RGB', (panel * columns, (panel + label) * math.ceil(len(materials) / columns)), '#eef0e8')
    draw = ImageDraw.Draw(out)
    font_path = Path('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc')
    font = ImageFont.truetype(str(font_path), 15) if font_path.exists() else ImageFont.load_default()
    for i, entry in enumerate(materials):
        image = resolver(entry).resize((size, size), Image.Resampling.LANCZOS)
        x, y = (i % columns) * panel, (i // columns) * (panel + label)
        for tx in range(3 if repeat else 1):
            for ty in range(3 if repeat else 1):
                out.paste(image, (x + tx * size, y + label + ty * size))
        draw.text((x + 4, y + 3), f'ID {entry["block_id"]} {entry["name"]} / {entry["key"]}', fill='#183638', font=font)
        # Split on measured glyph width; filenames include Japanese and cannot
        # be wrapped reliably using whitespace or character count alone.
        lines, current = [], ''
        for character in entry['source_file']:
            trial = current + character
            if current and draw.textlength(trial, font=font) > panel - 8:
                lines.append(current)
                current = character
            else:
                current = trial
        if current:
            lines.append(current)
        for line, text in enumerate(lines):
            draw.text((x + 4, y + 24 + line * 20), text, fill='#183638', font=font)
    out.save(path)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input', required=True, type=Path, help='Read-only folder containing the eight received originals')
    parser.add_argument('--mapping', type=Path, default=ASSETS / 'source-map.json')
    parser.add_argument('--quality', type=int, default=90)
    args = parser.parse_args()
    if not args.input.is_dir() or not 70 <= args.quality <= 100:
        parser.error('Input must be a directory and WebP quality must be 70..100')
    mapping = json.loads(args.mapping.read_text())['materials']
    if len(mapping) != 8 or sorted(m['block_id'] for m in mapping) != list(range(1, 9)):
        parser.error('The mapping must contain exactly stable BlockIDs 1..8')
    candidates = {}
    for path in args.input.iterdir():
        if path.is_file() and path.suffix.lower() == '.png':
            candidates.setdefault(digest(path.read_bytes()), []).append(path)
    for m in mapping:
        if len(candidates.get(m['sha256'], [])) != 1:
            parser.error(f'Expected exactly one source with the reviewed hash for BlockID {m["block_id"]}')
    # Validate every source before writing. The input is never edited or moved.
    for m in mapping:
        with Image.open(candidates[m['sha256']][0]) as image:
            if image.size != (m['width'], m['height']) or image.mode != m['mode']:
                parser.error(f'Source shape changed for BlockID {m["block_id"]}')
    source_dir = ASSETS / 'sources'
    source_dir.mkdir(parents=True, exist_ok=True)
    QA.mkdir(parents=True, exist_ok=True)
    runtime = {'schema_version': 1, 'presentation_version': 'textures-a-v1',
               'layout': 'texture_array', 'color_space': 'srgb', 'maps': ['base_color'], 'materials': []}
    ledger, compression = [], []
    for m in mapping:
        source = candidates[m['sha256']][0]
        copy = source_dir / m['source_file']
        if copy.exists() and digest(copy.read_bytes()) != m['sha256']:
            raise ValueError(f'Refusing to overwrite a different preserved source for BlockID {m["block_id"]}')
        if source.resolve() != copy.resolve():
            shutil.copyfile(source, copy)
        original = Image.open(copy).convert('RGB')
        entry = {**m, 'preserved_path': str(copy.relative_to(ROOT)),
                 'processing': ['RGB BaseColor', 'Full image retained; no crop/rotation/mirroring',
                                'Lanczos high-quality shrink', f'WebP quality {args.quality}, method 6',
                                'No seam correction: inspected 3x3 has no hard border requiring it',
                                'No whole-image blur/repainting/estimated PBR maps'],
                 'outputs': {}}
        public_entry = {'block_id': m['block_id'], 'key': m['key'], 'name': m['name']}
        for tier, size in [('standard', 512), ('light', 256)]:
            resized = original.resize((size, size), Image.Resampling.LANCZOS)
            data = io.BytesIO()
            resized.save(data, 'WEBP', quality=args.quality, method=6)
            payload = data.getvalue()
            output = PUBLIC / tier / f'{m["key"]}.webp'
            output.parent.mkdir(parents=True, exist_ok=True)
            output.write_bytes(payload)
            decoded = Image.open(io.BytesIO(payload)).convert('RGB')
            meta = {'path': '/' + str(output.relative_to(ROOT / 'public')),
                    'width': size, 'height': size, 'bytes': len(payload), 'sha256': digest(payload)}
            public_entry[tier] = meta
            entry['outputs'][tier] = {**meta, 'relative_to_lanczos_reference': metrics(resized, decoded)}
            if tier == 'standard':
                for quality in (82, 86, 90, 94):
                    trial = io.BytesIO()
                    resized.save(trial, 'WEBP', quality=quality, method=6)
                    compression.append({'block_id': m['block_id'], 'quality': quality,
                                        'bytes': len(trial.getvalue()),
                                        **metrics(resized, Image.open(io.BytesIO(trial.getvalue())).convert('RGB'))})
        runtime['materials'].append(public_entry)
        ledger.append(entry)
    write_json(PUBLIC / 'manifest.json', runtime)
    write_json(ASSETS / 'source-index.json', {'schema_version': 1, 'pillow_version': __version__,
               'source_kind': 'User-provided ZIP attachment; eight visually reviewed PNGs',
               'maps': ['base_color'], 'materials': ledger})
    write_json(QA / 'asset-compression.json', {'method': 'Compare decoded WebP against same-sized uncompressed Lanczos RGB reference; not a human quality score', 'candidates': compression})
    original_image = lambda m: Image.open(source_dir / m['source_file']).convert('RGB')
    standard_image = lambda m: Image.open(PUBLIC / 'standard' / f'{m["key"]}.webp').convert('RGB')
    light_image = lambda m: Image.open(PUBLIC / 'light' / f'{m["key"]}.webp').convert('RGB')
    contact(mapping, original_image, QA / 'asset-original-contact.png')
    contact(mapping, standard_image, QA / 'asset-standard-contact.png')
    contact(mapping, light_image, QA / 'asset-light-contact.png')
    contact(mapping, original_image, QA / 'asset-repeat-before.png', repeat=True)
    contact(mapping, standard_image, QA / 'asset-repeat-after.png', repeat=True)
    contact(mapping, light_image, QA / 'asset-repeat-light.png', repeat=True)
    totals = {tier: sum(m[tier]['bytes'] for m in runtime['materials']) for tier in ['standard', 'light']}
    write_json(QA / 'asset-budget.json', {
        'original_png_bytes': sum(m['bytes'] for m in mapping), 'webp_bytes_by_tier': totals,
        'manifest_bytes': (PUBLIC / 'manifest.json').stat().st_size,
        'format': 'Decoded RGBA8 array, 10 layers (AIR + 8 BaseColor + code boundary), full mip chain',
        'gpu_estimate_bytes': {tier: round(10 * size * size * 4 * 4 / 3) for tier, size in [('standard', 512), ('light', 256)]},
        'estimate_limit': 'GPU allocation estimate only; excludes driver overhead, canvas decode buffers and transient tier-switch double allocation. Smaller WebP bytes alone do not reduce decoded GPU memory.',
        'public_original_png_count': 0, 'individual_webp_count': 16, 'maps': ['base_color']})
    print(json.dumps({'status': 'ok', 'materials': 8, 'public_webps': 16, 'bytes': totals}))


if __name__ == '__main__':
    main()
