#!/usr/bin/env python3
"""Reproduce the authorized title-only revision of pinned Godot 4.5.1 exports.

Only reviewed title GDScripts and project.binary are transplanted. All other
packed resources, engine files, audio and save scripts retain their original bytes.
Requires the exact Godot 4.5.1 editor, but does not require export templates.
"""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import struct
import subprocess
import tempfile
from import_legacy_games import GAMES, ROOT, digest, wrapper

TITLES = {
    'yokodori-days': 'お前の仕事は俺の仕事',
    'tachibana-task-heaven': 'タスク天国',
    'finger-heart-challenge': '指ハートチャレンジ',
}


def unpack(data: bytes) -> dict[str, bytes]:
    if data[:4] != b'GDPC' or struct.unpack_from('<I', data, 4)[0] != 3:
        raise ValueError('Expected unencrypted Godot PCK v3')
    base, directory = struct.unpack_from('<QQ', data, 24)
    count = struct.unpack_from('<I', data, directory)[0]
    position = directory + 4
    resources = {}
    for _ in range(count):
        length = struct.unpack_from('<I', data, position)[0]
        position += 4
        name = data[position:position + length].rstrip(b'\0').decode()
        position += length
        offset, size = struct.unpack_from('<QQ', data, position)
        md5 = data[position + 16:position + 32]
        flags = struct.unpack_from('<I', data, position + 32)[0]
        position += 36
        if flags != 0:
            raise ValueError(f'Unsupported PCK resource flags: {name}')
        resource = data[base + offset:base + offset + size]
        if hashlib.md5(resource).digest() != md5:
            raise ValueError(f'PCK checksum mismatch: {name}')
        resources[name] = resource
    return resources


def pack(original: bytes, resources: dict[str, bytes]) -> bytes:
    base = struct.unpack_from('<Q', original, 24)[0]
    output = bytearray(original[:base])
    entries = []
    for name, data in resources.items():
        output.extend(b'\0' * (-len(output) % 16))
        entries.append((name, len(output) - base, data))
        output.extend(data)
    output.extend(b'\0' * (-len(output) % 16))
    struct.pack_into('<Q', output, 32, len(output))
    output.extend(struct.pack('<I', len(entries)))
    for name, offset, data in entries:
        encoded = name.encode()
        encoded += b'\0' * (-len(encoded) % 4)
        output.extend(struct.pack('<I', len(encoded)) + encoded)
        output.extend(struct.pack('<QQ', offset, len(data)))
        output.extend(hashlib.md5(data).digest() + struct.pack('<I', 0))
    return bytes(output)


def export(godot: str, project: Path, target: Path) -> dict[str, bytes]:
    for args in (['--editor', '--import', '--quit'], ['--export-pack', 'Web', str(target)]):
        result = subprocess.run([godot, '--headless', '--path', str(project), *args],
                                stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
        if result.returncode or 'SCRIPT ERROR' in result.stdout or 'Parse Error' in result.stdout:
            raise RuntimeError(result.stdout)
    return unpack(target.read_bytes())


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--sources', type=Path, default=Path('/workspace/legacy-games'))
    parser.add_argument('--godot', required=True)
    args = parser.parse_args()
    version = subprocess.check_output([args.godot, '--version'], text=True).strip()
    if version != '4.5.1.stable.official.f62fdbde1':
        raise SystemExit(f'Exact pinned compiler required, found {version}')
    manifest_path = ROOT / 'public/games/export-manifest.json'
    manifest = json.loads(manifest_path.read_text())
    manifest['schemaVersion'] = 2
    manifest['description'] = 'Pinned Godot 4.5.1 exports with authorized title-only changes. Engine/WASM/audio and every unrelated packed resource retain source bytes.'
    audit = {'godotCompiler': version, 'scope': 'Title-only revision; original gameplay/save scripts unchanged', 'games': []}
    with tempfile.TemporaryDirectory(prefix='arcade-title-') as temporary:
        for game_id, slug, export_dir, revision, old_title in GAMES:
            source = args.sources / slug
            actual = subprocess.check_output(['git', '-C', str(source), 'rev-parse', 'HEAD'], text=True).strip()
            if actual != revision:
                raise SystemExit(f'{slug}: source is not at pinned revision')
            project = Path(temporary) / slug
            shutil.copytree(source, project, ignore=shutil.ignore_patterns('.git', '.godot', 'build', 'docs', 'web', 'tests'))
            source_pck = (source / export_dir / 'index.pck').read_bytes()
            before = unpack(source_pck)
            patches = sorted((ROOT / 'tools/legacy-title-patches' / slug).glob('*.patch'))
            names = ['scripts/' + p.name.removesuffix('.patch').removesuffix('.gd') + '.gdc' for p in patches]
            baseline = export(args.godot, project, Path(temporary) / (slug + '-baseline.pck'))
            for name in names + ['project.binary']:
                if baseline[name] != before[name]:
                    raise ValueError(f'{slug}/{name}: pinned source does not reproduce original resource')
            for patch in patches:
                subprocess.run(['git', 'apply', '--unsafe-paths', str(patch)], cwd=project, check=True)
            config = project / 'project.godot'
            config.write_text(config.read_text().replace(f'config/name="{old_title}"', f'config/name="{TITLES[slug]}"'))
            revised = export(args.godot, project, Path(temporary) / (slug + '-revised.pck'))
            after = dict(before)
            changed = []
            for name in names + ['project.binary']:
                after[name] = revised[name]
                changed.append({'path': name, 'sourceSha256': hashlib.sha256(before[name]).hexdigest(),
                                'sha256': hashlib.sha256(after[name]).hexdigest()})
            target = ROOT / 'public/games' / slug
            target.joinpath('index.pck').write_bytes(pack(source_pck, after))
            delivered = unpack(target.joinpath('index.pck').read_bytes())
            if delivered != after:
                raise ValueError('Repacked resource mismatch')
            html = (source / export_dir / 'index.html').read_text()
            for old, new in [(old_title, TITLES[slug]), ('畑島さんと指ハートにチャレンジ！', '指ハートにチャレンジ！')]:
                html = html.replace(old, new)
            html = html.replace(f'"index.pck":{len(source_pck)}', f'"index.pck":{target.joinpath("index.pck").stat().st_size}')
            target.joinpath('game.html').write_text(html)
            target.joinpath('index.html').write_text(wrapper(TITLES[slug]))
            game = next(g for g in manifest['games'] if g['id'] == game_id)
            game['titleJa'] = TITLES[slug]
            game['titleRevision'] = {'compiler': version, 'patches': [str(p.relative_to(ROOT)) for p in patches],
                                     'changedPackedResources': changed, 'unchangedPackedResourceCount': len(before) - len(changed)}
            for record in game['runtimeFiles']:
                path = ROOT / record['path']
                record['bytes'], record['sha256'] = path.stat().st_size, digest(path)
                record['byteIdentical'] = record['sha256'] == record['sourceSha256']
                if not record['byteIdentical']:
                    record['transformation'] = 'Authorized display-title revision; original source hash retained'
            for record in game['shellFiles']:
                path = ROOT / record['path']
                record['bytes'], record['sha256'] = path.stat().st_size, digest(path)
            game['runtimeBytes'] = sum(r['bytes'] for r in game['runtimeFiles'])
            audit['games'].append({'id': game_id, 'titleJa': TITLES[slug], 'changedResources': changed,
                                  'unchangedResources': len(before) - len(changed), 'sourceRevision': revision,
                                  'packageSha256': digest(target / 'index.pck')})
    manifest['totalRuntimeBytes'] = sum(g['runtimeBytes'] for g in manifest['games'])
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    (ROOT / 'docs/legacy-games/title-revision/QA/PACKED_RESOURCE_AUDIT.json').write_text(json.dumps(audit, ensure_ascii=False, indent=2) + '\n')
    print('Revised 3 titles; only 4 title scripts and 3 project names changed inside PCKs.')


if __name__ == '__main__':
    main()
