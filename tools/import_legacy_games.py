#!/usr/bin/env python3
"""Import reviewed full Godot source exports with managed wrappers and native records.

Raw pinned old exports are intentionally refused: they would remove current title,
start-choice and record overlays. See docs/legacy-records/GODOT_EXPORT.md.
"""
from pathlib import Path
import runpy

# Retain the read-only helper API imported by historical title/resource audits.
_implementation = runpy.run_path(str(Path(__file__).with_name('legacy-records-import.py')))
ROOT = _implementation['ROOT']
digest = _implementation['sha']
GAMES = tuple((game, slug, {'game012':'build/web','game013':'docs','game014':'web'}[game], pin, title)
              for game, (slug, pin, title) in _implementation['PINS'].items())
def wrapper(title: str) -> str:
    slug = next((slug for _, slug, _, _, current in GAMES if current == title), None)
    if slug is None:
        raise ValueError('Unknown managed legacy title')
    return (ROOT / 'tools/legacy-record-shells' / slug / 'index.html').read_text(encoding='utf-8')

if __name__ == '__main__':
    runpy.run_path(str(Path(__file__).with_name('legacy-records-import.py')), run_name='__main__')
