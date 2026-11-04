# Game025 mobile revision · 2026-11-04

Implemented against base 70e0260e, within the eleven-game publication request.

- The 9x9 beginner board fits 320/390px without horizontal scrolling. The intermediate16x16 board retains panning. Compact header/stats leave more space for play.
- Removed the open/flag selector. Pointer hold for500ms places/removes a flag; release after the hold never opens the same cell. Movement beyond9px, pointer cancel, screen transition and pause cancel the hold. Mouse context menu and F-key flag controls remain.
- Added 6x6 mini boards with five mines, safe first cell/neighbors, and verified public-deduction solutions. All36 first cells have their own checked fallback proof. Generator failures preserve the same first-cell guarantee.
- Added a daily mode for mini/beginner, keyed by Japan date. Each day selects a verified precomputed layout and its associated start cell, so all starts/retries for that date and size match. Intermediate daily selection switches to beginner, visibly in the selector. These finite pools repeat; the interface does not promise endless unique puzzles.
- Clear results show seconds, personal best and rank among this device's ten fastest hint-free clears. Size, random/daily and daily date use separate numeric storage keys. The interface says「この端末」and does not claim a global leaderboard. Hint-assisted clears still count as clears but do not enter time ranking.
- Existing v2 snapshots remain readable; mini adds a validated difficulty and optional daily metadata without weakening history/proof replay. Practices and observer run IDs retain their separation from local result IDs.

Validation: TypeScript check;23 existing model/save tests,3 menu-gesture tests,3 generation lifecycle tests,2 new mini proof/save tests. Updated the existing lifecycle test extractor to include the new hold-cancel dependency; the initial extraction-only ReferenceError was corrected in the harness. All50 combined022/025 unit tests pass. Chromium320/390 actual pointer holds toggle flags, open first cells, and produce no page errors. Beginner board right edges300.95/370.97px fit the viewport. Mini daily repeats exact initial state; a source-informed safe-cell technical probe clears, saves best time and displays「この端末1位」(not a human speed result).

Evidence: QA screenshots and `tests/game022/mobile-20261104.mjs`, `tests/game025/mini-clear-20261104.mjs`. Explicit denied-consent fixture avoids the unrelated shared consent panel intercepting the probe. Tests do not change consent code. Mini fallback generation used `generate('mini',start,1104+start,5000,10000)` with a proof verified for every result; SHA256 `8d2d48e01650f80124cc571955292425b7c441b66afbc3f4078310ed86d7a6fc`.

Human enjoyment/physical-phone long-press feel remain unperformed. Independent review, final build/CI and production publishing belong to integration.

## Independent-review amendment: pending hold outside grid

The independent reviewer identified that a mouse press could leave/release beyond the grid without a grid move/up callback, leaving the500ms flag timeout alive. Added matching-pointer cleanup on grid `pointerleave` and window `pointerup`/`pointercancel`. These listeners do not capture the pointer or prevent default behavior, preserving the intermediate board's native touch panning.

`node tests/game025/hold-boundary-20261104.mjs` passed in Chromium: a real mouse exits in one move and releases outside; window-only release and cancellation are delivered while the physical press remains down beyond700ms; all leave flags and openings unchanged. An ordinary550ms hold still flags exactly once and release does not open the cell. TypeScript check and the affected8 generation/menu/mini regression tests passed. This amendment changes input cleanup only; existing screenshots and score/save validation remain applicable.
