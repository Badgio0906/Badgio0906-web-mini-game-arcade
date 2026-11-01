# INTEGRATION — C23「ワープ救助隊、全員まとめて！」 (WARP RESCUE)

Status: **STATIC_READY_LAUNCHER_UNVERIFIED** — implementation candidate; static package verified; launcher, Windows,
ImageGen art, human listening and author playtest NOT done. Not registered, not published. `game_id: null`.

## Source identity
| item | value |
|---|---|
| repository | `Badgio0906/Badgio0906-web-mini-game-arcade` |
| base (published main) | `6211019f64a6946d632a9b3620de24a03505410d` |
| branch (local, not pushed) | `handoff/claude/dopa3-20261031/warp_rescue` |
| verified sourceCommit (ZIP built from) | `d3d031e82671775e92e4cbd9ca5a0b67754930e4` |
| playtest ZIP | `warp_rescue_0.1.0_d3d031e_playtest.zip` sha256 `9ac92d73fc389cc559b5618e3084f61bfd7a6be284e1af0ca563c925803393a6` |
| packageId (permanent) | `org.game100garage.ct3.warp-rescue` |
| storage namespace | `web-mini-arcade:v1:ct3:warp_rescue:best:rules1` (+ `web-mini-arcade:v1:ct3:warp_rescue:settings`) |
| rulesVersion | `1` |

Commit order (apply all, in order; this docs commit follows them and changes no build input):
1. `00108b90a691ac6794310d2c32731a86ee87d140`
2. `d3d031e82671775e92e4cbd9ca5a0b67754930e4`

The branch depends only on the base. It does not depend on the other two C21–C23 branches.
Delivery: git bundle `warp_rescue.bundle` (prerequisite `6211019f64a6946d632a9b3620de24a03505410d`), see `SOURCE_HANDOFF/README.md`.

## Changed paths (all new files, all under the staging directory)
- `experiments/claude-dopa-trio/dopa3-20261031/warp_rescue/.gitignore`
- `experiments/claude-dopa-trio/dopa3-20261031/warp_rescue/LICENSES.txt`
- `experiments/claude-dopa-trio/dopa3-20261031/warp_rescue/README_BUILD.md`
- `experiments/claude-dopa-trio/dopa3-20261031/warp_rescue/index.html`
- `experiments/claude-dopa-trio/dopa3-20261031/warp_rescue/package.meta.json`
- `experiments/claude-dopa-trio/dopa3-20261031/warp_rescue/qa/plan-reading.json`
- `experiments/claude-dopa-trio/dopa3-20261031/warp_rescue/qa/strategy-comparison.json`
- `experiments/claude-dopa-trio/dopa3-20261031/warp_rescue/scripts/package.py`
- `experiments/claude-dopa-trio/dopa3-20261031/warp_rescue/src/art.ts`
- `experiments/claude-dopa-trio/dopa3-20261031/warp_rescue/src/audio.ts`
- `experiments/claude-dopa-trio/dopa3-20261031/warp_rescue/src/main.ts`
- `experiments/claude-dopa-trio/dopa3-20261031/warp_rescue/src/model.ts`
- `experiments/claude-dopa-trio/dopa3-20261031/warp_rescue/src/storage.ts`
- `experiments/claude-dopa-trio/dopa3-20261031/warp_rescue/src/style.css`
- `experiments/claude-dopa-trio/dopa3-20261031/warp_rescue/tests/e2e.mjs`
- `experiments/claude-dopa-trio/dopa3-20261031/warp_rescue/tests/model.test.ts`
- `experiments/claude-dopa-trio/dopa3-20261031/warp_rescue/tests/node-shim.d.ts`
- `experiments/claude-dopa-trio/dopa3-20261031/warp_rescue/tsconfig.json`
- `experiments/claude-dopa-trio/dopa3-20261031/warp_rescue/vite.config.ts`

No shared Catalog / Portal / Vite / package.json / lockfile / CURRENT_STATUS / guides / navigation / ads / analytics /
records file was changed.

## Entry and build
- HTML entry: `experiments/claude-dopa-trio/dopa3-20261031/warp_rescue/index.html` → `./src/main.ts` (module). Dedicated config: `experiments/claude-dopa-trio/dopa3-20261031/warp_rescue/vite.config.ts` (`root` = this dir, `base: './'`, `assetsDir: assets/warp_rescue`).
- Rebuild/test commands: `README_BUILD.md` in the staging directory. Commands actually run on the verified commit:
  `tsc -p tsconfig.json` (pass), `vitest run` (12/12 pass), `BUILD_MODE=native vite build`, `BUILD_MODE=preview vite build`,
  `python3 -I scripts/package.py <sha> <out>`, ZIP structure check + fresh extraction into a path with Japanese and spaces,
  static HTTP smoke at `/` and `/games/warp_rescue/` × 1280×720, 390×844, 320×568, 844×390 (pass), `node tests/e2e.mjs` on the extracted bytes (28/28 pass).
- Restore check: fresh `git clone` of the base + `git fetch warp_rescue.bundle` + `npm ci` → tsc/vitest/build/package reproduced the **byte-identical ZIP** (same sha256).

## Path map (staging → native; Codex applies after assigning NNN)
| staging | native |
|---|---|
| `experiments/claude-dopa-trio/dopa3-20261031/warp_rescue/index.html` | `gameNNN.html` (adjust script path to `./src/games/gameNNN/main.ts`) |
| `experiments/claude-dopa-trio/dopa3-20261031/warp_rescue/src/*.ts`, `src/style.css` | `src/games/gameNNN/` |
| `experiments/claude-dopa-trio/dopa3-20261031/warp_rescue/tests/model.test.ts` (+ helpers) | `tests/unit/gameNNN.*.test.ts` (fix relative imports) |
| `experiments/claude-dopa-trio/dopa3-20261031/warp_rescue/tests/e2e.mjs`, `qa/plan-*.json` | `tests/gameNNN/` |
| `experiments/claude-dopa-trio/dopa3-20261031/warp_rescue/docs/*`, `game.manifest.candidate.json`, `integration_requests.json` | `docs/gameNNN/` / `src/games/gameNNN/game.manifest.json` |
| `experiments/claude-dopa-trio/dopa3-20261031/warp_rescue/vite.config.ts`, `scripts/package.py`, `package.meta.json`, `LICENSES.txt` | keep for playtest packaging, or drop when using the root build |

The game number appears nowhere in the logic. Only `storage.ts` holds the namespace (keep the ct3 value, or use an agreed
existing convention plus a one-time read of the ct3 key; the ct3 BEST is per-origin and is **not** migrated to production automatically).

## Preview vs native
`__BUILD_MODE__` only shows or hides the preview UI (「試遊を終了」 → stops audio/clock and tells the player to close the tab;
playtest note). Rules, input, art and audio are identical. Native return to portal: wire the current common header / portal URL
(integration owner). No `window.close()`, launcher API or custom URI is assumed.

## Rules summary (implementation facts)
- Mechanic: 60 capsules in 12 waves on a fixed integer-ms timetable fall at 100px/s to 3 inlet sensors. Inlet selection (Q/W/E) captures; the outlet (A/S/D) selected at the crossing is fixed and the capsule arrives 450ms later. Dock i is OPEN when (t−1000−1800i) mod 5400 < 2700.
- Inputs:
- **select**: 6 DOM buttons: round 入口 (mint) and square 出口 (coral), pointerdown; each selector has its own 80ms cooldown
- **keyboard**: Q/W/E inlet, A/S/D outlet (no repeat)
- **pause**: button / Esc / P; blur and hidden auto-pause
- Scoring: Rescue: 100×min(3, 1+floor(streak/10)); reroute or inlet miss resets streak. Wave of 5 all rescued: +300, all same dock: +500 instead. Clear (≥42) +1000; all 60 +1000. Reading plan: 21,200.
- Rank: S: 60 rescued; A: ≥54; B: ≥42 (clear); C: <42
- Practice: Waves 1–2 (10 capsules), separate score, no BEST
- Strategy comparison (model input lists, not humans): Inlet+arrival reading (spec reference schedule): 60/60, 21,200, S. Inlet only with fixed exit A/S/D: 32/31/28 rescued (C). Inlet fixed centre, no other input: 7 (C). Matches the spec design preflight (32/31/28).

## Catalog / route / tags (candidates)
- route: `gameNNN.html`; tags: timing, reflex, score-attack (choose from existing tag vocabulary)
- manifest candidate: `game.manifest.candidate.json`; thumbnail candidates (real play screenshots in SOURCE_HANDOFF qa): `phone-play.png`, `pc-ready.png`, `pc-result.png`, `pc-title.png`
- guide draft: `docs/GUIDE_DRAFT.md`; asset provenance: `docs/ASSET_LEDGER.md`; QA: `docs/QA_REPORT.md`; promo shotlist: `docs/PROMO_SHOTLIST.md`

## Known limits
- Inlet misses (cushion) also reset the streak; the spec states only 回送 explicitly — interpretation recorded here.
- Capsule crossing at the same ms as a selection uses the new selection (input → crossing).
- Art is procedural placeholder (BLOCKED_ART). Visual score here is the implementer's self-check only.
- Performance (update+draw p95) not instrumented; no diagnostic hook shipped. Retry leak check by code inspection only.
- No Windows launcher was available: launcher_import / launcher_windows_e2e = NOT_RUN.

## Re-verify after integration
Unit tests, native build, the e2e plan through real input, 4 viewports, storage key unchanged, BEST survives a presentation update,
no network requests, pause/blur behaviour, and author playtest.
