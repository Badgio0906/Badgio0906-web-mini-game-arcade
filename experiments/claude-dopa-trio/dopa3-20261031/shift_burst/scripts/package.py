#!/usr/bin/env python3
"""Packs dist/preview into one launcher playtest ZIP (fallback layout; launcher contract UNVERIFIED).
usage: python3 -I scripts/package.py <sourceCommit> <outDir>
Deterministic: sorted entries, fixed timestamps, Deflate, UTF-8 names. No self-hash inside the ZIP."""
import json, sys, zipfile
from pathlib import Path

GAME = Path(__file__).resolve().parent.parent
META = json.loads((GAME / 'package.meta.json').read_text(encoding='utf-8'))
commit, out_dir = sys.argv[1], Path(sys.argv[2])
dist = GAME / 'dist' / 'preview'
if not (dist / 'index.html').is_file():
    sys.exit('dist/preview/index.html missing: run BUILD_MODE=preview vite build first')
meta = {**META, 'sourceCommit': commit, 'buildMode': 'preview', 'entry': 'index.html', 'requiredServer': 'static',
        'networkPolicy': 'none', 'launcherContractStatus': 'LAUNCHER_CONTRACT_UNVERIFIED',
        'note': 'Helper sidecar for humans/Codex. Not a launcher API; a launcher is not assumed to read it.'}
files = {p.relative_to(dist).as_posix(): p.read_bytes() for p in sorted(dist.rglob('*')) if p.is_file()}
files['preview-meta.json'] = (json.dumps(meta, ensure_ascii=False, indent=2) + '\n').encode('utf-8')
files['LICENSES.txt'] = (GAME / 'LICENSES.txt').read_bytes()
out_dir.mkdir(parents=True, exist_ok=True)
name = f"{META['slug']}_{META['version']}_{commit[:7]}_playtest.zip"
target = out_dir / name
with zipfile.ZipFile(target, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
    for rel in sorted(files):
        info = zipfile.ZipInfo(rel, date_time=(2026, 10, 31, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = 0o644 << 16
        info.flag_bits |= 0x800  # UTF-8 names
        z.writestr(info, files[rel])
print(target)
