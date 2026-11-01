# INTEGRATION — C22「ずらして、全段ぶち抜け。」 (SHIFT BURST)

Status: **STATIC_READY_LAUNCHER_UNVERIFIED** — implementation candidate; static package verified; launcher, Windows,
ImageGen art, human listening and author playtest NOT done. Not registered, not published. `game_id: null`.

## Source identity
| item | value |
|---|---|
| repository | `Badgio0906/Badgio0906-web-mini-game-arcade` |
| base (published main) | `6211019f64a6946d632a9b3620de24a03505410d` |
| branch (local, not pushed) | `handoff/claude/dopa3-20261031/shift_burst` |
| verified sourceCommit (ZIP built from) | `0d2c68ae0d09108767074f660718ff1dafde899d` |
| playtest ZIP | `shift_burst_0.1.0_0d2c68a_playtest.zip` sha256 `7fb83f0ff1418f5bd2c56ba1dbfe16dce625d1b1a5b3d52756c3a96944554944` |
| packageId (permanent) | `org.game100garage.ct3.shift-burst` |
| storage namespace | `web-mini-arcade:v1:ct3:shift_burst:best:rules1` (+ `web-mini-arcade:v1:ct3:shift_burst:settings`) |
| rulesVersion | `1` |

Commit order (apply all, in order; this docs commit follows them and changes no build input):
1. `c07f5721a10582869199d23393f99801ca2c772b`
2. `0216a324aef52ea1b89c6527249e6454c2431a7c`
3. `0d2c68ae0d09108767074f660718ff1dafde899d`

The branch depends only on the base. It does not depend on the other two C21–C23 branches.
Delivery: git bundle `shift_burst.bundle` (prerequisite `6211019f64a6946d632a9b3620de24a03505410d`), see `SOURCE_HANDOFF/README.md`.

## Changed paths (all new files, all under the staging directory)
- `experiments/claude-dopa-trio/dopa3-20261031/shift_burst/.gitignore`
- `experiments/claude-dopa-trio/dopa3-20261031/shift_burst/LICENSES.txt`
- `experiments/claude-dopa-trio/dopa3-20261031/shift_burst/README_BUILD.md`
- `experiments/claude-dopa-trio/dopa3-20261031/shift_burst/index.html`
- `experiments/claude-dopa-trio/dopa3-20261031/shift_burst/package.meta.json`
- `experiments/claude-dopa-trio/dopa3-20261031/shift_burst/qa/plan-optimal.json`
- `experiments/claude-dopa-trio/dopa3-20261031/shift_burst/qa/strategy-comparison.json`
- `experiments/claude-dopa-trio/dopa3-20261031/shift_burst/scripts/package.py`
- `experiments/claude-dopa-trio/dopa3-20261031/shift_burst/src/art.ts`
- `experiments/claude-dopa-trio/dopa3-20261031/shift_burst/src/audio.ts`
- `experiments/claude-dopa-trio/dopa3-20261031/shift_burst/src/main.ts`
- `experiments/claude-dopa-trio/dopa3-20261031/shift_burst/src/model.ts`
- `experiments/claude-dopa-trio/dopa3-20261031/shift_burst/src/storage.ts`
- `experiments/claude-dopa-trio/dopa3-20261031/shift_burst/src/style.css`
- `experiments/claude-dopa-trio/dopa3-20261031/shift_burst/tests/e2e.mjs`
- `experiments/claude-dopa-trio/dopa3-20261031/shift_burst/tests/model.test.ts`
- `experiments/claude-dopa-trio/dopa3-20261031/shift_burst/tests/node-shim.d.ts`
- `experiments/claude-dopa-trio/dopa3-20261031/shift_burst/tsconfig.json`
- `experiments/claude-dopa-trio/dopa3-20261031/shift_burst/vite.config.ts`

No shared Catalog / Portal / Vite / package.json / lockfile / CURRENT_STATUS / guides / navigation / ads / analytics /
records file was changed.

## Entry and build
- HTML entry: `experiments/claude-dopa-trio/dopa3-20261031/shift_burst/index.html` → `./src/main.ts` (module). Dedicated config: `experiments/claude-dopa-trio/dopa3-20261031/shift_burst/vite.config.ts` (`root` = this dir, `base: './'`, `assetsDir: assets/shift_burst`).
- Rebuild/test commands: `README_BUILD.md` in the staging directory. Commands actually run on the verified commit:
  `tsc -p tsconfig.json` (pass), `vitest run` (15/15 pass), `BUILD_MODE=native vite build`, `BUILD_MODE=preview vite build`,
  `python3 -I scripts/package.py <sha> <out>`, ZIP structure check + fresh extraction into a path with Japanese and spaces,
  static HTTP smoke at `/` and `/games/shift_burst/` × 1280×720, 390×844, 320×568, 844×390 (pass), `node tests/e2e.mjs` on the extracted bytes (24/24 pass).
- Restore check: fresh `git clone` of the base + `git fetch shift_burst.bundle` + `npm ci` → tsc/vitest/build/package reproduced the **byte-identical ZIP** (same sha256).

## Path map (staging → native; Codex applies after assigning NNN)
| staging | native |
|---|---|
| `experiments/claude-dopa-trio/dopa3-20261031/shift_burst/index.html` | `gameNNN.html` (adjust script path to `./src/games/gameNNN/main.ts`) |
| `experiments/claude-dopa-trio/dopa3-20261031/shift_burst/src/*.ts`, `src/style.css` | `src/games/gameNNN/` |
| `experiments/claude-dopa-trio/dopa3-20261031/shift_burst/tests/model.test.ts` (+ helpers) | `tests/unit/gameNNN.*.test.ts` (fix relative imports) |
| `experiments/claude-dopa-trio/dopa3-20261031/shift_burst/tests/e2e.mjs`, `qa/plan-*.json` | `tests/gameNNN/` |
| `experiments/claude-dopa-trio/dopa3-20261031/shift_burst/docs/*`, `game.manifest.candidate.json`, `integration_requests.json` | `docs/gameNNN/` / `src/games/gameNNN/game.manifest.json` |
| `experiments/claude-dopa-trio/dopa3-20261031/shift_burst/vite.config.ts`, `scripts/package.py`, `package.meta.json`, `LICENSES.txt` | keep for playtest packaging, or drop when using the root build |

The game number appears nowhere in the logic. Only `storage.ts` holds the namespace (keep the ct3 value, or use an agreed
existing convention plus a one-time read of the ct3 key; the ct3 BEST is per-origin and is **not** migrated to production automatically).

## Preview vs native
`__BUILD_MODE__` only shows or hides the preview UI (「試遊を終了」 → stops audio/clock and tells the player to close the tab;
playtest note). Rules, input, art and audio are identical. Native return to portal: wire the current common header / portal URL
(integration owner). No `window.close()`, launcher API or custom URI is assumed.

## Rules summary (implementation facts)
- Mechanic: 4×5 armour shutter, one core per row. Drag a row ±1..2 (wrap); gear-linked rows move opposite (cost counted once). Cannon column 1–5, FIRE: beam bottom→top breaks aligned cores, stops at hard armour. 6 fixed rooms, 12 shells, 50s.
- Inputs:
- **shift**: pointer drag on a row; on release round(dx/cell) clamped to −2..2; one owner pointer; pointercancel discards
- **cannon**: column buttons 列1–5 or tap below the board (pointerdown)
- **fire**: FIRE button (pointerdown; click only for keyboard activation)
- **keyboard**: 1–4 row, ←→ shift 1 step, Q/E cannon, Space fire (no repeat)
- **pause**: button / Esc / P; blur and hidden auto-pause
- Scoring: Shot breaking n rows: 100n². Room cleared by its first shot with 4 rows: +400, other room clear +100. All rooms: 1000 + shells×50 + floor(remaining s)×50. Score = max(0, destroy + bonuses − 20×moveSteps) computed from totals. Optimal plan: 14,920.
- Rank: S: all 6 rooms with one shot each and moves ≤ min total (19) + 6; A: clear + ≥4 one-shot rooms; B: other clear; C: fail
- Practice: Room 1 only with 3 shells, separate score, no BEST
- Strategy comparison (model input lists, not humans): Full-alignment plan (19 moves, 6 shots): S, 14,920. "Break lowest row by chasing the cannon" (no moves): runs out of shells after 3 rooms, 1,800, C.

## Catalog / route / tags (candidates)
- route: `gameNNN.html`; tags: puzzle, action, score-attack (choose from existing tag vocabulary)
- manifest candidate: `game.manifest.candidate.json`; thumbnail candidates (real play screenshots in SOURCE_HANDOFF qa): `phone-pierce.png`, `touch-320x568-play.png`, `pc-result.png`, `pc-title.png`
- guide draft: `docs/GUIDE_DRAFT.md`; asset provenance: `docs/ASSET_LEDGER.md`; QA: `docs/QA_REPORT.md`; promo shotlist: `docs/PROMO_SHOTLIST.md`

## Known limits
- Locks are rejected inputs, not queued (spec: ロック表示); players may need to re-tap after the 120ms move animation.
- Rooms are fixed; with the solver-optimal 19 steps the run ends at ~9s in the plan — human pace is untested.
- Art is procedural placeholder (BLOCKED_ART). Visual score here is the implementer's self-check only.
- Performance (update+draw p95) not instrumented; no diagnostic hook shipped. Retry leak check by code inspection only.
- No Windows launcher was available: launcher_import / launcher_windows_e2e = NOT_RUN.

## Re-verify after integration
Unit tests, native build, the e2e plan through real input, 4 viewports, storage key unchanged, BEST survives a presentation update,
no network requests, pause/blur behaviour, and author playtest.
