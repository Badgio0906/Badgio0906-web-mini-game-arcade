# LAUNCHER_CONTRACT — status: **LAUNCHER_CONTRACT_UNVERIFIED**

No launcher was found or operated in this task. This file does **not** define a launcher schema.

## Where it was looked for (2026-10-31)
- `Badgio0906/Badgio0906-web-mini-game-arcade` main `6211019f64a6946d632a9b3620de24a03505410d`: only the older Game015 preview launcher
  (`docs/game015/mobile-ux/main-integration-20261022/QA/launcher/launcher-smoke.mjs`, WINDOWS_IPHONE_PREVIEW.md). It is not a ZIP-managing
  launcher and was not used as one.
- Repositories visible to the account (`list_repos`): no repository identifiable as a ZIP playtest launcher. The private
  `ONEGAME-Craft2` and other unrelated repos were not opened (names unrelated; not assumed).
- Execution environment: Linux cloud container, no Windows desktop, no local user machine attached.

Unknown (therefore not assumed): HTML entry detection, manifest file name/schema, required fields, same-game update key,
thumbnail rule, static root, host/port persistence, ZIP size limit, supported media types.

## What was verified instead (static HTTP only — not launcher PASS)
`tests/batches/dopa3-20261031/fixture/launcher_fixture_0.1.0_playtest.zip`: structure check (`verify-zip.py`), fresh extraction into
a path with Japanese and spaces, served by a minimal GET/HEAD server at `/` and `/games/<slug>/`, 4 viewports, localStorage write
(`package-smoke.mjs`). The same checks then ran on the three real playtest ZIPs.

## Fixed distribution layout (fallback from the brief, used because no real contract exists)
```
<slug>_<version>_<sha7>_playtest.zip
  index.html            single root entry, relative ./assets/... references (Vite base './')
  assets/<slug>/...     JS + CSS only (art and SE are generated at runtime)
  preview-meta.json     helper sidecar for humans/Codex — NOT assumed to be read by a launcher
  LICENSES.txt
```
Deflate, UTF-8 names, fixed timestamps, no folders above root, no nested ZIP, no source/node_modules/.git/scripts.
ZIP SHA256 values are kept outside the ZIP in `SHA256SUMS.txt`.

## To do when a real launcher is available
1. Import the fixture, then each game ZIP: add → entry recognised → PLAY → close → PLAY again.
2. Normal play, launcher restart, BEST still shown.
3. Update test with a metadata-only v0.1.1 of the same packageId in a **test library** (not the author's library): same-game update,
   replay, BEST kept, rollback to v0.1.0.
4. Record launcher version/commit, parser file, manifest schema, and map `preview-meta.json` fields onto it (no second source of truth).
