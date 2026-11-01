# INTEGRATION — C21「雷、予約しました。」 (THUNDER BOOKING)

Status: **STATIC_READY_LAUNCHER_UNVERIFIED** — implementation candidate; static package verified; launcher, Windows,
ImageGen art, human listening and author playtest NOT done. Not registered, not published. `game_id: null`.

## Source identity
| item | value |
|---|---|
| repository | `Badgio0906/Badgio0906-web-mini-game-arcade` |
| base (published main) | `6211019f64a6946d632a9b3620de24a03505410d` |
| branch (local, not pushed) | `handoff/claude/dopa3-20261031/thunder_booking` |
| verified sourceCommit (ZIP built from) | `1d56b8f91f34cf5afb8d4a5bff6c11b4d4f17587` |
| playtest ZIP | `thunder_booking_0.1.0_1d56b8f_playtest.zip` sha256 `e1ff7e4f0a27e340344f23db33a0233fd07251a212d9a8dd750a0246ec757360` |
| packageId (permanent) | `org.game100garage.ct3.thunder-booking` |
| storage namespace | `web-mini-arcade:v1:ct3:thunder_booking:best:rules1` (+ `web-mini-arcade:v1:ct3:thunder_booking:settings`) |
| rulesVersion | `1` |

Commit order (apply all, in order; this docs commit follows them and changes no build input):
1. `9fa35806f1714b1029e09674c654d1a46b544198`
2. `1d56b8f91f34cf5afb8d4a5bff6c11b4d4f17587`

The branch depends only on the base. It does not depend on the other two C21–C23 branches.
Delivery: git bundle `thunder_booking.bundle` (prerequisite `6211019f64a6946d632a9b3620de24a03505410d`), see `SOURCE_HANDOFF/README.md`.

## Changed paths (all new files, all under the staging directory)
- `experiments/claude-dopa-trio/dopa3-20261031/thunder_booking/.gitignore`
- `experiments/claude-dopa-trio/dopa3-20261031/thunder_booking/LICENSES.txt`
- `experiments/claude-dopa-trio/dopa3-20261031/thunder_booking/README_BUILD.md`
- `experiments/claude-dopa-trio/dopa3-20261031/thunder_booking/index.html`
- `experiments/claude-dopa-trio/dopa3-20261031/thunder_booking/package.meta.json`
- `experiments/claude-dopa-trio/dopa3-20261031/thunder_booking/qa/plan-predictive.json`
- `experiments/claude-dopa-trio/dopa3-20261031/thunder_booking/qa/strategy-comparison.json`
- `experiments/claude-dopa-trio/dopa3-20261031/thunder_booking/scripts/package.py`
- `experiments/claude-dopa-trio/dopa3-20261031/thunder_booking/src/art.ts`
- `experiments/claude-dopa-trio/dopa3-20261031/thunder_booking/src/audio.ts`
- `experiments/claude-dopa-trio/dopa3-20261031/thunder_booking/src/main.ts`
- `experiments/claude-dopa-trio/dopa3-20261031/thunder_booking/src/model.ts`
- `experiments/claude-dopa-trio/dopa3-20261031/thunder_booking/src/storage.ts`
- `experiments/claude-dopa-trio/dopa3-20261031/thunder_booking/src/style.css`
- `experiments/claude-dopa-trio/dopa3-20261031/thunder_booking/tests/e2e.mjs`
- `experiments/claude-dopa-trio/dopa3-20261031/thunder_booking/tests/model.test.ts`
- `experiments/claude-dopa-trio/dopa3-20261031/thunder_booking/tests/node-shim.d.ts`
- `experiments/claude-dopa-trio/dopa3-20261031/thunder_booking/tests/strategies.ts`
- `experiments/claude-dopa-trio/dopa3-20261031/thunder_booking/tsconfig.json`
- `experiments/claude-dopa-trio/dopa3-20261031/thunder_booking/vite.config.ts`

No shared Catalog / Portal / Vite / package.json / lockfile / CURRENT_STATUS / guides / navigation / ads / analytics /
records file was changed.

## Entry and build
- HTML entry: `experiments/claude-dopa-trio/dopa3-20261031/thunder_booking/index.html` → `./src/main.ts` (module). Dedicated config: `experiments/claude-dopa-trio/dopa3-20261031/thunder_booking/vite.config.ts` (`root` = this dir, `base: './'`, `assetsDir: assets/thunder_booking`).
- Rebuild/test commands: `README_BUILD.md` in the staging directory. Commands actually run on the verified commit:
  `tsc -p tsconfig.json` (pass), `vitest run` (17/17 pass), `BUILD_MODE=native vite build`, `BUILD_MODE=preview vite build`,
  `python3 -I scripts/package.py <sha> <out>`, ZIP structure check + fresh extraction into a path with Japanese and spaces,
  static HTTP smoke at `/` and `/games/thunder_booking/` × 1280×720, 390×844, 320×568, 844×390 (pass), `node tests/e2e.mjs` on the extracted bytes (26/26 pass).
- Restore check: fresh `git clone` of the base + `git fetch thunder_booking.bundle` + `npm ci` → tsc/vitest/build/package reproduced the **byte-identical ZIP** (same sha256).

## Path map (staging → native; Codex applies after assigning NNN)
| staging | native |
|---|---|
| `experiments/claude-dopa-trio/dopa3-20261031/thunder_booking/index.html` | `gameNNN.html` (adjust script path to `./src/games/gameNNN/main.ts`) |
| `experiments/claude-dopa-trio/dopa3-20261031/thunder_booking/src/*.ts`, `src/style.css` | `src/games/gameNNN/` |
| `experiments/claude-dopa-trio/dopa3-20261031/thunder_booking/tests/model.test.ts` (+ helpers) | `tests/unit/gameNNN.*.test.ts` (fix relative imports) |
| `experiments/claude-dopa-trio/dopa3-20261031/thunder_booking/tests/e2e.mjs`, `qa/plan-*.json` | `tests/gameNNN/` |
| `experiments/claude-dopa-trio/dopa3-20261031/thunder_booking/docs/*`, `game.manifest.candidate.json`, `integration_requests.json` | `docs/gameNNN/` / `src/games/gameNNN/game.manifest.json` |
| `experiments/claude-dopa-trio/dopa3-20261031/thunder_booking/vite.config.ts`, `scripts/package.py`, `package.meta.json`, `LICENSES.txt` | keep for playtest packaging, or drop when using the root build |

The game number appears nowhere in the logic. Only `storage.ts` holds the namespace (keep the ct3 value, or use an agreed
existing convention plus a one-time read of the ct3 key; the ct3 BEST is per-origin and is **not** migrated to production automatically).

## Preview vs native
`__BUILD_MODE__` only shows or hides the preview UI (「試遊を終了」 → stops audio/clock and tells the player to close the tab;
playtest note). Rules, input, art and audio are identical. Native return to portal: wire the current common header / portal URL
(integration owner). No `window.close()`, launcher API or custom URI is assumed.

## Rules summary (implementation facts)
- Mechanic: Tap/click reserves a lightning strike at that point 900ms later (radius 68). 3 slots: READY→PENDING 900ms→COOLDOWN 1200ms; 120ms global gap. 8 fixed six-drone formations × 5.5s, then boss HP3 with 800ms post-hit shield until 54s.
- Inputs:
- **reserve**: pointerdown on the battlefield (clamped, no snap); 1 tap = 1 slot
- **keyboard**: arrows move cursor 300px/s, Space (non-repeat) reserves; Space also starts the clock from the READY screen
- **pause**: button / Esc / P; blur, visibilitychange hidden and pointercancel auto-pause; explicit 再開
- Scoring: Per strike n kills: 100n+50n(n-1) (6 → 2100). Boss kill 2000; clear bonus shield×300 + floor(remaining s)×100. Each once. Formation <3 kills → shield −1 once. Validation max observed by plan: 20400.
- Rank: S: clear + ≥3 six-kills + 0 formation fails; A: clear + ≥1 six-kill; B: other clear; C: fail
- Practice: Formation 1 three times (16.5s), separate score, no shield loss, no BEST
- Strategy comparison (model input lists, not humans): Predictive plan (11 strikes): S, 20,400, 8 six-kills. Reactive "tap where they are now" every 150/300/600ms: rank A, 14,300–14,600, 34–54 strikes, 2 six-kills. Prediction matters for score/efficiency, but reactive spam still clears (see limits).

## Catalog / route / tags (candidates)
- route: `gameNNN.html`; tags: action, timing, shooting, score-attack (choose from existing tag vocabulary)
- manifest candidate: `game.manifest.candidate.json`; thumbnail candidates (real play screenshots in SOURCE_HANDOFF qa): `pc-impact.png`, `phone-pending.png`, `pc-result.png`, `touch-390x844-title.png`
- guide draft: `docs/GUIDE_DRAFT.md`; asset provenance: `docs/ASSET_LEDGER.md`; QA: `docs/QA_REPORT.md`; promo shotlist: `docs/PROMO_SHOTLIST.md`

## Known limits
- Reactive spamming of the current centroid still clears with rank A (design pressure on survival is weak; consider fewer slots, faster later formations, or a strike-count factor — design decision for the author).
- Six-kill time windows vary a lot per formation (150 ms for 横流れ and 斜め急襲, 3240 ms for 包囲); difficulty curve is untuned by humans.
- Same-tick order implemented as: scheduled impacts at time t are processed, then the input at t (spec says input first); a new reservation can never affect an impact at the same ms, so no scoring difference.
- Art is procedural placeholder (BLOCKED_ART). Visual score here is the implementer's self-check only.
- Performance (update+draw p95) not instrumented; no diagnostic hook shipped. Retry leak check by code inspection only.
- No Windows launcher was available: launcher_import / launcher_windows_e2e = NOT_RUN.

## Re-verify after integration
Unit tests, native build, the e2e plan through real input, 4 viewports, storage key unchanged, BEST survives a presentation update,
no network requests, pause/blur behaviour, and author playtest.
