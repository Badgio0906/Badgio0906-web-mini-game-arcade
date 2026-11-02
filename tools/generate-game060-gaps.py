"""Reproduce Game060's procedural SE using the installed GAPS CLI (no external APIs)."""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'assets/game060/gaps-20261102'
PUBLIC = ROOT / 'public/assets/game060/gaps-20261102'


def save(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def tone(hz, end, duration, gain=-15, delay=0, wave='sine'):
    return dict(wave=wave, frequency=hz, end_frequency=end, duration=duration,
                gain_db=gain, delay=delay,
                envelope=dict(attack=.003, decay=duration*.18, sustain=.22, release=duration*.65))


def noise(duration, gain, low, high=30, delay=0):
    return dict(wave='noise', duration=duration, gain_db=gain, delay=delay,
                effects=dict(highpass_hz=high, lowpass_hz=low),
                envelope=dict(attack=.002, decay=duration*.12, sustain=.18, release=duration*.8))


def layers(cue, variant):
    k = 1 + variant * .025
    if cue == 'reserve':
        return [tone(880, 1320, .085, -17, wave='triangle'), tone(1760, 1760, .1, -23, .035), noise(.022, -19, 6500, 1800)]
    if cue == 'reject':
        return [tone(220, 150, .12, -17, wave='triangle'), tone(165, 120, .1, -23, .015)]
    if cue == 'slotReady':
        return [tone(1320, 1320, .09, -22), tone(1980, 1980, .075, -29, .025)]
    if cue.startswith('thunder') or cue == 'miss':
        size = {'miss':.42, 'thunder':.58, 'thunderCluster':.72, 'thunderSix':.92}[cue]
        ls = [noise(.075, -5 if cue != 'miss' else -13, 8500, 1400),
              tone(125*k, 38, size*.65, -7 if cue != 'miss' else -16),
              noise(size, -5 if cue != 'miss' else -15, 1150, 45, .012),
              noise(.035, -15, 6200, 900, .026), noise(.025, -18, 7200, 1900, .069)]
        if cue in ('thunderCluster', 'thunderSix'):
            ls += [tone(h*k, h*1.03*k, .15, -22, .055+i*.048, 'triangle')
                   for i, h in enumerate([784, 988, 1175] if cue == 'thunderCluster' else [659, 831, 988, 1319])]
        if cue == 'thunderSix':
            ls += [tone(66, 29, .72, -12, .025), noise(.12, -16, 4400, 600, .16),
                   tone(1319, 1568, .24, -24, .28)]
        return ls
    if cue == 'shield':
        return [tone(320, 100, .28, -15, wave='triangle'), noise(.12, -16, 2100, 180), tone(160, 85, .28, -20, .045)]
    if cue == 'bossHit':
        return [noise(.055, -9, 6200, 1100), tone(190, 68, .29, -10),
                tone(1175, 587, .16, -20, .018, 'triangle'), tone(1760, 880, .2, -24, .03)]
    if cue == 'fanfare':
        return [tone(h, h, .32 if i < 3 else .48, -17, i*.105, 'triangle')
                for i, h in enumerate([523.25, 659.25, 783.99, 1046.5])] + [tone(261.63, 261.63, .65, -23, .12)]
    if cue == 'fail':
        return [tone(h, h*.94, .27, -20, i*.15, 'triangle') for i, h in enumerate([392, 330, 262])]
    raise ValueError(cue)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--gaps-root', type=Path, default=os.environ.get('GAPS_ROOT'))
    parser.add_argument('--work-dir', type=Path, default=ROOT/'artifacts/game060-gaps')
    args = parser.parse_args()
    if not args.gaps_root:
        parser.error('set GAPS_ROOT or --gaps-root to the installed GAPS checkout')
    python = args.gaps_root/('.venv/Scripts/python.exe' if os.name == 'nt' else '.venv/bin/python')
    library = args.work_dir/'library'
    env = {**os.environ, 'PYTHONUTF8':'1', 'PYTHONDONTWRITEBYTECODE':'1'}

    def cli(*params, request=None):
        proc = subprocess.run([str(python), '-m', 'gaps', '--library', str(library), *params],
                              input=json.dumps(request) if request else None, capture_output=True,
                              text=True, encoding='utf-8', env=env, cwd=ROOT)
        if proc.returncode:
            raise RuntimeError(proc.stderr or proc.stdout)
        return json.loads(proc.stdout)

    save(args.work_dir/'library-search.json', cli('search'))
    cues = ['reserve', 'reject', 'slotReady', 'thunder', 'thunderCluster', 'thunderSix', 'miss', 'shield', 'bossHit', 'fanfare', 'fail']
    selected = {}
    PUBLIC.mkdir(parents=True, exist_ok=True)
    # Export directories are always new: GAPS never overwrites an old package.
    for index, cue in enumerate(cues):
        for variant in range(2 if cue in ('thunder', 'thunderCluster') else 1):
            key = cue + (str(variant+1) if cue in ('thunder', 'thunderCluster') else '')
            seed = 202611026000 + index*10 + variant
            request = dict(version=1, name='game060_'+key, tags=['game060', cue],
                           recipe=dict(version=1, seed=seed, sample_rate=48000, name=key,
                                       category='impact', layers=layers(cue, variant),
                                       effects=dict(gain_db=-2, fade_in=.002, fade_out=.015)))
            save(ASSETS/'requests'/f'{key}.json', request)
            out = cli('request', request=request)
            if not out['qa']['passed']:
                raise RuntimeError(f'{key}: {out["qa"]}')
            asset = out['asset']
            cli('approve', asset['id'])
            dest = args.work_dir/'exports'/key
            exported = cli('export', asset['id'], str(dest), '--target', 'web', '--priority', '70', '--polyphony', '10')
            if not exported['qa']['passed']:
                raise RuntimeError(exported)
            filename = f'{key}-{exported["sha256"][:10]}.wav'
            shutil.copyfile(dest/exported['file'], PUBLIC/filename)
            save(ASSETS/'exports'/f'{key}.json', exported)
            selected[key] = dict(file=filename, asset_id=asset['id'], seed=seed, sha256=exported['sha256'],
                                 qa=exported['qa'], provenance=exported['lineage'],
                                 approval='user-authorized production selection; human listening unverified')
            print(key, asset['id'][:12], 'QA PASS', flush=True)
    save(ASSETS/'selected.json', selected)
    save(PUBLIC/'manifest.json', dict(version=1, generator='GAPS local CLI', sample_rate=48000,
                                    format='PCM16 WAV', human_listening='unverified', sounds=selected))
    repeatability = {
        key: dict(asset_id=cli('request', request=json.loads((ASSETS/'requests'/f'{key}.json').read_text('utf-8')))['asset']['id'],
                  expected=meta['asset_id']) for key, meta in selected.items()}
    save(ASSETS/'repeatability.json', repeatability)
    assert all(row['asset_id'] == row['expected'] for row in repeatability.values())
    for key, meta in selected.items():
        assert hashlib.sha256((PUBLIC/meta['file']).read_bytes()).hexdigest() == meta['sha256'], key


if __name__ == '__main__':
    main()
