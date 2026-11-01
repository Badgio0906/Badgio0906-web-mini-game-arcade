# README_BUILD — C22「ずらして、全段ぶち抜け。」 (`shift_burst`)

Staging path (game_id 未定): `experiments/claude-dopa-trio/dopa3-20261031/shift_burst/`
Base: `Badgio0906/Badgio0906-web-mini-game-arcade` main `6211019f64a6946d632a9b3620de24a03505410d`.
This directory is self-contained: it does **not** import shared Catalog/Portal/Vite/records/analytics code and is
not part of the root MPA build. It uses only the repository's existing locked devDependencies (vite, vitest,
typescript, playwright) installed by `npm ci` at the repository root. No new dependency was added.

## Rebuild (developer side; players never do this)

```bash
npm ci                                   # at repository root, existing package-lock.json
cd experiments/claude-dopa-trio/dopa3-20261031/shift_burst
../../../../node_modules/.bin/tsc -p tsconfig.json          # types
../../../../node_modules/.bin/vitest run                    # model tests (also regenerates qa/*.json plans)
BUILD_MODE=preview ../../../../node_modules/.bin/vite build # → dist/preview (launcher playtest)
BUILD_MODE=native  ../../../../node_modules/.bin/vite build # → dist/native  (integration build, same source)
python3 -I scripts/package.py <sourceCommitSHA> <outDir>    # → <outDir>/shift_burst_<version>_<sha7>_playtest.zip
node tests/e2e.mjs <extracted-or-dist-dir> <qaOutDir> <port> # browser QA (static HTTP + fake clock)
```

`scripts/package.py` is deterministic (sorted entries, fixed timestamps, Deflate, UTF-8 names), so the same
source commit + same lockfile produces byte-identical ZIPs; compare with `sha256sum`.

## Build modes
`__BUILD_MODE__` (`vite.config.ts` define) only toggles the preview-only UI (「試遊を終了」 and the playtest note).
Physics/rules/score/input/art/audio are identical. No post-build HTML patching.

## Files
- `src/model.ts` pure rules (integer-ms time injected, no DOM, no randomness)
- `src/main.ts` input/phases/render loop, `src/art.ts` procedural sprites, `src/audio.ts` synthesized SE, `src/storage.ts` BEST/settings
- `tests/model.test.ts` (+ helpers) vitest, `tests/e2e.mjs` Playwright browser QA, `qa/plan-optimal.json` timed input plan used by e2e
- `scripts/package.py`, `package.meta.json`, `LICENSES.txt`
