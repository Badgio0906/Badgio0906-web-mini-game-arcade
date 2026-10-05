"""Read-only regression proof against the published fifteen-game baseline."""
import datetime
import hashlib
import json
import subprocess
from pathlib import Path

BASE = '16cfef815720cad664b33bff6e3dd63c142e1953'
root = Path(__file__).resolve().parents[2]
paths = subprocess.check_output(['git', 'ls-tree', '-r', '--name-only', BASE], cwd=root).decode().splitlines()
preserved = []
for name in paths:
    specific = name.startswith(('src/game/', 'src/games/', 'src/arcade/', 'public/games/'))
    old_html = name.startswith('game') and name.endswith('.html')
    old_assets = name.startswith('public/assets/')
    shared_unchanged = name in ['src/portal/main.ts', 'src/portal/style.css', 'src/core/CreditService.ts',
        'src/core/AudioService.ts', 'src/core/StorageService.ts', 'src/core/RewardService.ts', 'src/core/InputService.ts']
    if not (specific or old_html or old_assets or shared_unchanged):
        continue
    baseline = subprocess.check_output(['git', 'show', f'{BASE}:{name}'], cwd=root)
    actual = (root / name).read_bytes()
    assert baseline == actual, f'Existing game changed: {name}'
    preserved.append({'path': name, 'bytes': len(actual), 'sha256': hashlib.sha256(actual).hexdigest()})

index_path = 'assets/portal/thumbnails/asset-index.json'
old_index = json.loads(subprocess.check_output(['git', 'show', f'{BASE}:{index_path}'], cwd=root))
new_index = json.loads((root / index_path).read_text())
assert old_index['entries'] == new_index['entries'][:15], 'Existing thumbnail provenance changed'
report = {'checkedUtc': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'status': 'PASS',
    'baselineCommit': BASE, 'scope': 'Existing fifteen game-specific source/HTML/assets/legacy outputs, unchanged shared gameplay services and onboarding; first15 thumbnail records. Shared catalog/routing/font are tested separately.',
    'files': preserved, 'preservedFileCount': len(preserved), 'first15ThumbnailEntriesExact': True}
output = root / 'docs/game016/QA/EXISTING_GAME_PRESERVATION.json'
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'status': report['status'], 'preservedFileCount': len(preserved)}))
