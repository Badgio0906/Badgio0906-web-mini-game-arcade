#!/usr/bin/env python3
"""Export pinned Godot projects with reviewed source overlays into a private directory.

Never writes original clones or public/. Full --export-release only; no PCK patching.
"""
from __future__ import annotations
import argparse
from datetime import datetime, timezone
import hashlib
import io
import json
from pathlib import Path
import re
import shutil
import subprocess
import tarfile

ROOT = Path(__file__).resolve().parents[1]
EXPECTED = '4.5.1.stable.official.f62fdbde1'
TEMPLATE_SHA256 = {
    'web_nothreads_debug.zip': 'db624373952bdbffef4476b248fb70e89a483b525ac6de4438bee31ca2924728',
    'web_nothreads_release.zip': '7f6c5efc9952f6f02509adfb92298161c0152a1f6a81c0bf9b9f4f913676e9c8',
}
GAMES = {
    'game012': ('yokodori-days', '50a97c339076d3bcadf38ad6be8acade16a8e882', '澤野さんの横取りデイズ', 'お前の仕事は俺の仕事', 'build/web'),
    'game013': ('tachibana-task-heaven', 'ddc854b67c6c4efe17e0777ec7de1ce01d4f1ac0', '立花さんのタスク天国', 'タスク天国', 'docs'),
    'game014': ('finger-heart-challenge', '36877d55bb44a41087a61bfd38f3ec395040cb3c', '畑島さんの指ハートチャレンジ', '指ハートチャレンジ', 'web'),
}
START_BEFORE = '''func start_run() -> void:
\tif seen_tutorial:
\t\trequest_start(1)
\telse:
\t\taudio.unlock()
\t\tshow_help()
'''
START_AFTER = '''func start_run() -> void:
\t# The surrounding arcade title lets first-time players choose practice explicitly.
\t# Skipping does not mark the native tutorial as completed.
\trequest_start(1)
'''
RUNTIME_REQUIRED = ('index.html', 'index.js', 'index.pck', 'index.wasm', 'index.audio.worklet.js', 'index.audio.position.worklet.js')


def digest(path: Path) -> str:
    with path.open('rb') as source:
        return hashlib.file_digest(source, 'sha256').hexdigest()


def captured(command: list[str], cwd: Path | None = None) -> str:
    result = subprocess.run(command, cwd=cwd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if result.returncode:
        # No environment or remote URLs are printed; local command identity suffices.
        raise RuntimeError(f'Local command failed: {command[0]} (exit {result.returncode})')
    return result.stdout.strip()


def run_logged(command: list[str], log: Path, cwd: Path | None = None) -> dict:
    with log.open('w') as stream:
        result = subprocess.run(command, cwd=cwd, stdout=stream, stderr=subprocess.STDOUT, text=True)
    text = log.read_text()
    errors = [line for line in text.splitlines() if re.search(r'(^|\s)(SCRIPT ERROR|Parse Error|ERROR):', line)]
    if result.returncode or errors:
        raise RuntimeError(f'Godot command failed; inspect {log} (exit {result.returncode}, error lines {len(errors)})')
    return {'command': command, 'exit_code': result.returncode, 'log': str(log), 'log_sha256': digest(log), 'pass_count': sum(line.startswith('PASS:') for line in text.splitlines())}


def protect_output(output: Path, sources: Path) -> None:
    if output == ROOT or ROOT in output.parents or output == sources or sources in output.parents:
        raise ValueError('Output must be outside the arcade repository and original source directory.')
    if output.exists() and any(output.iterdir()):
        raise ValueError('Output directory is not empty. Use a new unique directory; prior evidence is retained.')
    output.mkdir(parents=True, exist_ok=True)


def source_record(path: Path) -> dict:
    return {'path': str(path.relative_to(ROOT)), 'bytes': path.stat().st_size, 'sha256': digest(path)}


def overlay(project: Path, game_id: str, old_title: str, title: str, templates: Path) -> tuple[list[dict], list[str]]:
    applied: list[dict] = []
    transformations: list[str] = []
    for patch in sorted((ROOT / 'tools/legacy-title-patches' / GAMES[game_id][0]).glob('*.patch')):
        captured(['git', 'apply', str(patch)], cwd=project)
        applied.append(source_record(patch))
    config = project / 'project.godot'
    text = config.read_text()
    expected = f'config/name="{old_title}"'
    if text.count(expected) != 1:
        raise ValueError(f'{game_id}: pinned project name mismatch')
    config.write_text(text.replace(expected, f'config/name="{title}"'))
    transformations.append('Existing authorized title scripts and project name reproduced.')
    if game_id == 'game013':
        path = project / 'scripts/game_manager.gd'
        text = path.read_text()
        if text.count(START_BEFORE) != 1:
            raise ValueError('Game013 pinned first-play gate mismatch')
        path.write_text(text.replace(START_BEFORE, START_AFTER))
        transformations.append('Existing Game013 optional first-play gate source revision reproduced (tools/patch_legacy_start_choices.py).')
        applied.append(source_record(ROOT / 'tools/patch_legacy_start_choices.py'))
    # Original Windows export packed CRLF OFL. Keep exact license bytes without repacking output.
    if game_id == 'game012':
        ofl = project / 'assets/fonts/OFL.txt'
        ofl.write_bytes(ofl.read_bytes().replace(b'\r\n', b'\n').replace(b'\n', b'\r\n'))
        transformations.append('Game012 OFL line endings restored to original packed CRLF.')
    if game_id == 'game013':
        # Pinned Windows export stores these JSON resources as CRLF. Restore only
        # their line endings in the isolated source; content and scoring are unchanged.
        for name in ('stage_01.json', 'stage_02.json', 'stage_03.json', 'tutorial.json'):
            path = project / 'data' / name
            path.write_bytes(path.read_bytes().replace(b'\r\n', b'\n').replace(b'\n', b'\r\n'))
        transformations.append('Game013 four known stage/tutorial JSON line endings restored to original packed CRLF; semantic data unchanged.')
    base = ROOT / 'tools/legacy-record-patches'
    # Deterministic helper UID is mandatory, avoiding random UID metadata between exports.
    for name in ('RecordBridge.gd', 'RecordBridge.gd.uid'):
        path = base / name
        if not path.is_file():
            raise ValueError(f'Required reviewed helper missing: {name}')
        shutil.copy2(path, project / 'scripts' / name)
        applied.append(source_record(path))
    if game_id in ('game013', 'game014'):
        for name in ('CurrentRecordSave.gd', 'CurrentRecordSave.gd.uid'):
            path = base / name
            if not path.is_file():
                raise ValueError(f'Required reviewed current-save helper missing: {name}')
            shutil.copy2(path, project / 'scripts' / name)
            applied.append(source_record(path))
    game_dir = base / game_id
    patches = sorted(game_dir.glob('*.patch'))
    if not patches:
        raise ValueError(f'{game_id}: reviewed record hooks are not available; no speculative export allowed')
    for patch in patches:
        captured(['git', 'apply', str(patch)], cwd=project)
        applied.append(source_record(patch))
    for path in sorted(game_dir.rglob('*')):
        if not path.is_file() or path.suffix == '.patch':
            continue
        relative = path.relative_to(game_dir)
        if relative.parts[0] not in ('scripts', 'tests', 'assets', 'data'):
            relative = Path('scripts') / relative
        target = project / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(path, target)
        applied.append(source_record(path))
    # This fixture references Game012's own scene; other projects have game-specific fixtures.
    if game_id == 'game012':
        for path in sorted((base / 'tests').glob('test_bridge.gd*')):
            shutil.copy2(path, project / 'tests' / path.name)
            applied.append(source_record(path))
    for script in (project / 'scripts').glob('*.gd'):
        if not script.with_suffix('.gd.uid').is_file():
            raise ValueError(f'{game_id}: deterministic script UID missing for {script.name}')
    presets = project / 'export_presets.cfg'
    text = presets.read_text()
    sections = text.split('[preset.0.options]', 1)
    if len(sections) != 2:
        raise ValueError('Pinned Web preset options section missing')
    options, *tail = sections[1].split('[preset.1]', 1)
    for kind in ('debug', 'release'):
        key = f'custom_template/{kind}'
        value = f'{key}="{templates / ("web_nothreads_" + kind + ".zip")}"'
        pattern = rf'^{re.escape(key)}=.*$'
        options = re.sub(pattern, value, options, flags=re.M) if re.search(pattern, options, flags=re.M) else '\n' + value + options
    # Existing public HTML title/description revisions must survive full regular export.
    options = options.replace(old_title, title).replace('畑島さんと指ハートにチャレンジ！', '指ハートにチャレンジ！')
    presets.write_text(sections[0] + '[preset.0.options]' + options + ('[preset.1]' + tail[0] if tail else ''))
    transformations.append('Exact official single-threaded custom Web templates selected in isolated export preset only.')
    return applied, transformations


def export_game(game_id: str, args: argparse.Namespace, receipt: dict) -> None:
    slug, pin, old_title, title, source_export = GAMES[game_id]
    original = args.sources / slug
    head = captured(['git', '-C', str(original), 'rev-parse', 'HEAD'])
    if head != pin:
        raise ValueError(f'{game_id}: original clone HEAD is not pinned {pin}')
    if captured(['git', '--no-optional-locks', '-C', str(original), 'status', '--porcelain', '--untracked-files=no']):
        raise ValueError(f'{game_id}: original tracked source is dirty; preserve it and stop')
    archive = subprocess.check_output(['git', '-C', str(original), 'archive', pin])
    project = args.output / 'source' / game_id
    project.mkdir(parents=True)
    with tarfile.open(fileobj=io.BytesIO(archive)) as package:
        # Keep excluded tests/tools for matching original UID cache. Never import original clone.
        package.extractall(project, filter='data')
    # Published output folders are artifacts, not source assets. Ignore their icons/audio
    # during editor import while retaining them for the original external Web Audio copy.
    artifact = project / source_export
    artifact.mkdir(parents=True, exist_ok=True)
    (artifact / '.gdignore').write_text('')
    overlays, transformations = overlay(project, game_id, old_title, title, args.templates_dir)
    build = args.output / slug
    build.mkdir()
    log_dir = args.output / 'logs' / game_id
    log_dir.mkdir(parents=True)
    commands = [run_logged([str(args.godot), '--headless', '--path', str(project), '--editor', '--import', '--quit'], log_dir / 'import.log')]
    if args.run_native_tests:
        for path in sorted(set((project / 'tests').glob('test*.gd')) | set((project / 'tests').glob('*_test.gd'))):
            commands.append(run_logged([str(args.godot), '--headless', '--path', str(project), '--script', 'res://' + str(path.relative_to(project))], log_dir / (path.stem + '.log')))
    commands.append(run_logged([str(args.godot), '--headless', '--path', str(project), '--export-release', 'Web', str(build / 'index.html')], log_dir / 'export.log'))
    # Rhythm game has existing HTML Web Audio resources outside Godot's engine pack.
    extras: list[dict] = []
    if game_id == 'game013':
        for path in [project / source_export / 'audio.js', *sorted((project / source_export / 'audio').glob('*.wav'))]:
            if not path.is_file():
                raise ValueError('Pinned Game013 Web Audio extra missing')
            relative = path.relative_to(project / source_export)
            target = build / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(path, target)
            extras.append({'path': str(relative), 'source_sha256': digest(path), 'sha256': digest(target)})
    for name in RUNTIME_REQUIRED:
        if not (build / name).is_file():
            raise ValueError(f'{game_id}: required regular export output missing: {name}')
    game_receipt = {'schema_version': 1, 'game_id': game_id, 'slug': slug, 'title': title, 'repository': f'https://github.com/Badgio0906/{slug}.git', 'pinned_revision': pin, 'actual_source_head': head, 'source_archive_sha256': hashlib.sha256(archive).hexdigest(), 'isolated_project': str(project), 'output': str(build), 'source_overlays': overlays, 'source_transformations': transformations, 'regular_source_export': True, 'pck_resource_transplantation': False, 'original_source_written': False, 'public_written': False, 'commands': commands, 'audio_extras': extras, 'runtime_files': [{'name': str(path.relative_to(build)), 'bytes': path.stat().st_size, 'sha256': digest(path)} for path in sorted(build.rglob('*')) if path.is_file()]}
    game_receipt.update({'source_revision': pin, 'compiler': EXPECTED, 'source_overlay': overlays, 'threads_enabled': False})
    (build / 'export-metadata.json').write_text(json.dumps(game_receipt, ensure_ascii=False, indent=2) + '\n')
    receipt['games'].append(game_receipt)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--game', action='append', required=True, choices=tuple(GAMES))
    parser.add_argument('--sources', type=Path, required=True)
    parser.add_argument('--godot', type=Path, required=True)
    parser.add_argument('--templates-dir', type=Path, required=True, help='Directory with version.txt and official web_nothreads_{debug,release}.zip')
    parser.add_argument('--output', type=Path, required=True, help='New empty private output directory outside all repositories')
    parser.add_argument('--run-native-tests', action='store_true')
    args = parser.parse_args()
    args.sources = args.sources.resolve()
    args.godot = args.godot.resolve()
    args.templates_dir = args.templates_dir.resolve()
    args.output = args.output.resolve()
    version = captured([str(args.godot), '--version'])
    if version != EXPECTED:
        parser.error(f'Exact compiler {EXPECTED} required; installed version differs')
    if (args.templates_dir / 'version.txt').read_text().strip() != '4.5.1.stable':
        parser.error('Exact official 4.5.1 Web export templates required')
    for kind in ('debug', 'release'):
        if not (args.templates_dir / f'web_nothreads_{kind}.zip').is_file():
            parser.error('Both official single-threaded Web templates are required')
    for name, expected_hash in TEMPLATE_SHA256.items():
        if digest(args.templates_dir / name) != expected_hash:
            parser.error(f'Official pinned template checksum mismatch: {name}')
    protect_output(args.output, args.sources)
    receipt = {'schema_version': 1, 'created_at': datetime.now(timezone.utc).isoformat(), 'compiler': {'version': version, 'path': str(args.godot), 'sha256': digest(args.godot)}, 'templates': [{'name': name, 'sha256': digest(args.templates_dir / name)} for name in ('version.txt', 'web_nothreads_debug.zip', 'web_nothreads_release.zip')], 'exporter': source_record(Path(__file__).resolve()), 'games': []}
    for game_id in dict.fromkeys(args.game):
        export_game(game_id, args, receipt)
    path = args.output / 'export-metadata.json'
    path.write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + '\n')
    print(f'Exported {len(receipt["games"])} pinned project(s). Review receipt: {path}')


if __name__ == '__main__':
    main()
