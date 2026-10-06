#!/usr/bin/env python3
"""Copy pinned, already-published Godot exports without rebuilding their games."""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[1]
GAMES = (
    ('game012', 'yokodori-days', 'build/web', '50a97c339076d3bcadf38ad6be8acade16a8e882', '澤野さんの横取りデイズ'),
    ('game013', 'tachibana-task-heaven', 'docs', 'ddc854b67c6c4efe17e0777ec7de1ce01d4f1ac0', '立花さんのタスク天国'),
    ('game014', 'finger-heart-challenge', 'web', '36877d55bb44a41087a61bfd38f3ec395040cb3c', '畑島さんの指ハートチャレンジ'),
)
RUNTIME_FILES = (
    'index.html', 'index.js', 'index.pck', 'index.wasm', 'index.audio.worklet.js',
    'index.audio.position.worklet.js', 'index.png', 'index.icon.png', 'index.apple-touch-icon.png',
)
RETURN_STYLE = '''/* Only the surrounding navigation shell is styled here. */
html,body{margin:0;width:100%;height:100%;background:#fff2d7}
.legacy-page{height:100dvh;display:grid;grid-template-rows:calc(52px + env(safe-area-inset-top,0px)) minmax(0,1fr);color:#263949}
.legacy-navigation{box-sizing:border-box;display:flex;align-items:center;padding:env(safe-area-inset-top,0px) max(8px,env(safe-area-inset-right,0px)) 0 max(8px,env(safe-area-inset-left,0px));background:#fff2d7;border-bottom:1px solid #26394940}
#legacy-portal-return{box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;min-height:44px;min-width:44px;padding:8px 12px;color:#263949;text-decoration:none;border:1px solid #26394970;border-radius:6px;font:500 13px system-ui,'Yu Gothic',sans-serif;line-height:1.3;touch-action:manipulation}
#legacy-portal-return:hover{background:#f5dfab}
#legacy-portal-return:focus-visible{outline:3px solid #bc573e;outline-offset:2px}
.legacy-play-area{min-width:0;min-height:0}
#legacy-game-frame{display:block;border:0;width:100%;height:100%}
'''


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def copy_record(source: Path, target: Path, source_root: Path) -> dict:
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, target)
    source_hash, target_hash = digest(source), digest(target)
    if source_hash != target_hash:
        raise RuntimeError(f'Copy mismatch: {source}')
    return {'source': str(source.relative_to(source_root)), 'path': str(target.relative_to(ROOT)),
            'bytes': target.stat().st_size, 'sourceSha256': source_hash, 'sha256': target_hash,
            'byteIdentical': True}


def wrapper(title: str) -> str:
    return f'''<!doctype html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <title>{title} — 100ガレ ～GAME100 GARAGE～</title>
  <link rel="icon" type="image/png" href="./index.icon.png" />
  <link rel="stylesheet" href="./portal-return.css" />
</head>
<body class="legacy-page">
  <header class="legacy-navigation"><a id="legacy-portal-return" href="../../index.html" target="_top">← ゲームセンターへ</a></header>
  <main class="legacy-play-area"><iframe id="legacy-game-frame" src="./game.html" title="{title}のゲーム画面" allow="autoplay; fullscreen; gamepad" allowfullscreen></iframe></main>
</body>
</html>
'''


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--sources', type=Path, default=Path('/workspace/legacy-games'))
    args = parser.parse_args()
    manifest = {'description': 'Pinned existing Godot 4.5.1 single-threaded web exports. Runtime and original HTML copied byte-for-byte; only a separate navigation wrapper is added.',
                'schemaVersion': 1, 'godotVersion': '4.5.1', 'threadsEnabled': False, 'games': []}
    # Validate all revisions and files before writing any destination.
    for _, slug, export_dir, revision, _ in GAMES:
        repo = args.sources / slug
        actual = subprocess.check_output(['git', '-C', str(repo), 'rev-parse', 'HEAD'], text=True).strip()
        if actual != revision:
            raise SystemExit(f'{slug}: expected pinned {revision}, found {actual}. Review and update the pin before refreshing.')
        for name in RUNTIME_FILES:
            if not (repo / export_dir / name).is_file():
                raise SystemExit(f'Missing published runtime: {repo / export_dir / name}')
    godot_license = args.sources / 'tachibana-task-heaven' / 'GODOT_LICENSE.txt'
    shared_license = copy_record(godot_license, ROOT / 'public/games/licenses/GODOT_MIT.txt', args.sources / 'tachibana-task-heaven')
    manifest['godotLicense'] = shared_license
    for game_id, slug, export_dir, revision, title in GAMES:
        repo, destination = args.sources / slug, ROOT / 'public/games' / slug
        files = [repo / export_dir / name for name in RUNTIME_FILES]
        if slug == 'tachibana-task-heaven':
            files.append(repo / export_dir / 'audio.js')
            files.extend(sorted((repo / export_dir / 'audio').glob('*.wav')))
        records = []
        for source in files:
            relative = source.relative_to(repo / export_dir)
            name = Path('game.html') if str(relative) == 'index.html' else relative
            records.append(copy_record(source, destination / name, repo))
        font_license = copy_record(repo / 'assets/fonts/OFL.txt', destination / 'licenses/FONT_OFL.txt', repo)
        destination.joinpath('index.html').write_text(wrapper(title), encoding='utf-8')
        destination.joinpath('portal-return.css').write_text(RETURN_STYLE, encoding='utf-8')
        shell = [{'path': str((destination / name).relative_to(ROOT)), 'bytes': (destination / name).stat().st_size,
                  'sha256': digest(destination / name)} for name in ('index.html', 'portal-return.css')]
        manifest['games'].append({'id': game_id, 'slug': slug, 'titleJa': title,
                                 'repository': subprocess.check_output(['git', '-C', str(repo), 'remote', 'get-url', 'origin'], text=True).strip(),
                                 'revision': revision, 'sourceExport': export_dir,
                                 'route': f'./games/{slug}/index.html', 'originalDocument': f'./games/{slug}/game.html',
                                 'runtimeFiles': records, 'fontLicense': font_license, 'shellFiles': shell,
                                 'runtimeBytes': sum(r['bytes'] for r in records)})
    manifest['totalRuntimeBytes'] = sum(g['runtimeBytes'] for g in manifest['games'])
    ROOT.joinpath('public/games/export-manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f"Copied {len(GAMES)} pinned exports: {manifest['totalRuntimeBytes']:,} runtime bytes. All copied file hashes match.")


if __name__ == '__main__':
    main()
