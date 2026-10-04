# Visual redesign — regression QA

Status: **technical QA PASS — final source frozen, no unresolved regression blocker**. Source audit, 53 units, 51 development browser executions, five production routes and focused visual / asset probes passed. Independent visual review passed all four games on the first iteration. Human art acceptance and physical-device performance remain untested.

## Baseline and allowed edits

Original commit: `27562df57b1ebf33ecab7961d9bd86a017cedc31`. [GAMEPLAY_BASELINE.json](GAMEPLAY_BASELINE.json) records SHA-256 of 37 source files; 24 are immutable. [Before captures](before/README.md) contain 24 actual screenshots at desktop 1440×900 and touch-emulated mobile 390×844. All 37 hashes matched after the final baseline capture.

Final protected-file comparison: **20 files byte-identical**, including four Run models, contracts, all core services and protected Game001 source. The remaining **four manifests changed only `visual_identity`**, after visual PASS and Main Agent authorization. Every other manifest field compares equal; original baseline hashes remain unchanged in the record.

Permitted presentation changes: new assets / loading, CSS / HTML structure and labels, renderer graphics / sprites / decoration / effects, and presentation portions of new-game main files. Input coordinates, hit regions, timing, RNG, rules, physics, score, difficulty, pattern generation, CREDIT, storage, Reward and telemetry must remain equivalent. Decorative scene movement cannot move a physics object or hide a warning.

## Source audit

Run `node tests/visual/audit-gameplay.mjs` after integration. It writes [GAMEPLAY_AUDIT.json](GAMEPLAY_AUDIT.json), checks exact immutable hashes, and compares TypeScript AST regions against the original git source. Initial audit: **24 immutable match, 0 changed presentation files, 0 changed protected regions**.

The collector includes model / service construction, model mutation and time updates, hooks, CREDIT / storage / events, timers, named lifecycle / input functions, returned controller properties, and event listener registrations. Formatting and comments are normalized. It reports differences for human source review rather than silently erasing strings, draw calls or new effect callbacks. New DOM / assets can legitimately affect a mixed function, but that does not automatically authorize changes to its control flow.

Review the complete diff as well; AST checks do not cover every possible expression or top-level declaration. Record each affected file and why its changes are presentation only. In particular verify:

- Model constructor and RNG parameters, `dt` clamp, `run.step`, snapshot update, and synchronous once-only `onEnd` remain unchanged.
- Controller start / title / input / pause / destroy, pending start state, alive / phase / ended gates, and model reset are preserved.
- Primary pointer approval, pointer ID / cell / LEVEL / parcel epochs, native click handling, repeat / modifier suppression, half-stage coordinates and button bubbling remain equivalent.
- CREDIT use and best save still happen at decisive failure before delayed results; 300ms / 420ms guards, fast retry, 1000m clear exception and reward pending locks remain unchanged.
- Audio behavior, Storage namespace / keys, telemetry names / payload / run IDs / duration, pagehide persisted pause vs terminal quit, blur / visibility and explicit resume are preserved.
- Sprite bounds align with actual Workday collision sizes, Tower full cargo geometry / mass / projected shadow, exact Echo 3×3 hit areas and Sort four visible attributes. No visual cue extends an off gap or shortens a warning.
- Cleanup releases new textures / objects / listeners / RAF / tweens appropriately; pools stay bounded and do not grow on retry or off-screen progression.

### Shared global RNG must be preserved

The original TowerScene `effect(land)` emits **10 sparks × 3 `Math.random()` calls = 30 shared global RNG draws per accepted landing** when the top crate exists. It consumes random x offset, vx and vy in that order. TowerRun uses the same global Math.random stream for later cargo width / height / mass, so deleting sparks, changing their count, skipping them under reduced-motion or adding another random cosmetic draw would change future gameplay even with byte-identical TowerRun.

Preserve this original loop, its land/top condition and consumption order. New object variation / effects must derive deterministically from IDs, position or a separate RNG that does not advance global Math.random. WorkdayScene / EchoBoard / SortBoard originally have no `Math.random()` calls. Each new game's main file consumes one existing random draw for runId on start; preserve those call sites and order too.

The AST audit now includes the full `effect` method, every global random call/reference and enclosing loop/conditional. A changed controlling region requires review even if the three random call expressions look identical. Review the full diff for new aliases, imported helpers or callback paths that indirectly draw from global Math.random; the inventory alone is not a proof of equivalent consumption.

## Freeze and execution order

1. Receive per-game source freeze and coordinate with Visual Reviewer. No HMR across a review RUN. Stop browsers before an authorized fix window, then repeat affected evidence.
2. Immutable hash / source-diff audit and strict TypeScript / `npm run build`.
3. Existing **53 unit tests**; preserve existing expectations and selectors. Do not retune mechanics to pass a visual integration.
4. Existing development browser cases for the integrated games. Final all-game run checks Game001 regression and cross-game isolation once. Use one worker, generous existing long-run timeouts, and avoid simultaneous GPU-heavy Tower / Workday reviewers.
5. Added asset/load and visual-state checks where existing tests do not cover new art. Keep the original gameplay assertions; presentation-specific expectations may change only with documented, approved redesign rationale.
6. Final build and all five production route cases on the same output. Existing script-byte budgets measure JS and must not be weakened to accommodate image assets. Collect image budgets separately.
7. Record actual counters, source audit, screenshots, image bytes, dimensions, errors and remaining limitations. Technical PASS plus independent Visual Gate PASS is required; human art review flag applies if the three-iteration visual limit is exhausted.

## Browser and screenshot coverage

Preserve existing keyboard / touch tests: natural deaths and timeout, all three CREDIT deductions, reward +3 / repeated-click guard, pause / cached pagehide, best / mute / reload, all district rules / tower camera / maximum sequence / reversals. Use read-only diagnostic planners and ordinary input. No forced deaths or model writes.

Use 1440×900 and 390×844 for the final canonical comparison. Also check established edge sizes 1366×900, 1280×720, 1024×768, 320×568, 844×390 and 568×320. Review title, live play, gameover, NEW BEST + CREDIT 0, pause, saved zero and reward pending. Controls and essential explanations must fit the viewport with 44px targets. Exact stage containment may vary by the game's existing layout; do not replace viewport requirements with inappropriate generic card geometry.

Echo: actual cue, dark off gap, repeated same-cell cue, correct / wrong / expected cells and replay contrast. Decorative lamps must not look like actionable cues. Nine-cell positions and native focus must remain usable, and the full correct sequence must stay visible alongside its replay.

Sort: round vs angular, light vs dark, small vs large, circle vs cross; each of the four normal and inverted mappings must be legible on phone. Rule / direction text is code, not image text. Dispatch and rule-change decorations must not imply that input is accepted. Pending reward and worst result cards require compact portrait and landscape checks.

Workday: actual sprite / collision relationship, lane-change arrows and feints, two-person obstacles, player orientation and all four districts. Tower: intact width / height, supporting edges, drop shadow, load marker, tip vs tower collapse, accepted floors vs Perfect, upper-camera visuals and bounded objects.

## Asset and performance evidence

Collect actual production requests for images and JS; fail on failed requests / HTTP errors / page errors / console errors. Inspect successful image dimensions and report encoded bytes, decoded pixel cost, asset count and reused URLs. CSS backgrounds and Phaser-loaded images count too. Check no unused concept / iteration files are shipped as runtime assets.

`tests/visual/check-loaded-assets.mjs` observes ordinary startup, captures actual image responses, decodes their dimensions, and records errors / transferred bytes. Run against the final static preview using `VISUAL_QA_BASE_URL=http://127.0.0.1:4173 node tests/visual/check-loaded-assets.mjs`. Lazy variants are listed separately from the complete on-disk runtime asset inventory. Its pixel-size arithmetic does not claim measured GPU memory or FPS.

Use dimensions appropriate to displayed size, optimize generated masters into runtime WebP / PNG, and avoid oversized sheets. Initial review targets are at most 2048px per texture axis and roughly 1.5 MiB initial image transfer per game; these are QA investigation thresholds, not a change to mechanics or a substitute for actual device measurement. Exceptions require an explicit size / quality reason and evidence in this ledger. All delivered textures are at most 768px per axis; each route is below the initial-image investigation threshold. Actual measurements follow below.

Inspect resource growth over ordinary retry / title and representative progression; sprites should be reused or destroyed, off-screen pools bounded, and no RAF / listener / tween accumulation. Do not claim physical smartphone 60fps from headless timing, cached download timing or a single screenshot.

## Results ledger

| Evidence | Baseline | Integration result |
|---|---|---|
| Immutable source hashes | 24 match | 20 byte-identical + four approved `visual_identity`-only exceptions |
| Full source / protected AST diff | No changes | 9 presentation files changed; 0 protected AST region differences |
| Units | Existing 53 tests available | 53/53 PASS, 4.16s |
| TypeScript / static build | Existing 5 routes | Final PASS, strict TypeScript + Vite 5.01s |
| Development browser regressions | Prior accepted suites | 51 PASS / 57 intentional duplicate skips, 108 expanded cases, 11.7min |
| Final production routes | Prior 5/5 | 5/5 PASS on final build, 40.0s |
| After screenshots / visual gate | Before 24 images saved | First-iteration PASS: Game002 82, Game003 85, Game004 85, Game005 88 |
| Focused controls / geometry | Existing compact-layout requirements | 32 game × viewport groups PASS, 96 title / pending / pause observations |
| Echo cue / off-gap / replay | Existing WATCH timing | Two viewport probes PASS; 5.93:1 minimum contrast, opacity 1, off-gap transition 0s |
| Actual production image requests | No generated runtime assets | Four route probes PASS; zero request / HTTP / page / console errors |
| Human physical device / art review | New redesigned visuals untested | Not performed; remains required for human acceptance |

## Frozen source audit observations

WorkdayScene adds 14 image loads, six building Images and sixteen person Images allocated once. The generated character keeps the prior 52×63 visual envelope and physics coordinates; lane warning logic / update / effect / model hooks / controllers / RNG are unchanged. Background graphics, person art and sign styling are presentation only.

TowerScene adds six image loads, one city Image and a fixed pool of 26 module Images. A module is drawn at exact cargo width / height, position and rotation; code outlines remain at full physics boundaries. Module choice is `cargo.id % 5`, and cloud drift is deterministic. `effect`, its ten-particle / thirty-random-draw loop, model update / end hooks, camera control and controller functions remain unchanged. Height-dependent scenery and mass-label placement are visual changes.

Main002 / Main003 change pause and reward wrappers only; Main004 changes its reward wrapper only; Main005 is byte-identical. EchoBoard / SortBoard are byte-identical. Four CSS files add presentation rules; native IDs and underlying handlers remain unchanged. HTML changes theme colors, display copy and Game002's decorative route layout. The final manifest audit accepts exactly four `visual_identity` edits and verifies equality of every other JSON field. Final [GAMEPLAY_AUDIT.json](GAMEPLAY_AUDIT.json) reports 24 protected comparisons accepted, nine changed mixed presentation files and zero changed protected AST regions. Exact hashes and the approved metadata exceptions are distinguished in that evidence.

The full global-freeze unit run passed six files / 53 tests. Strict TypeScript and all five static pages built successfully. Phaser's existing approximately 1.21 MB chunk warning remains; no engine-budget relaxation was made.

Executed `check-controls.mjs`: four games × eight viewports, each checking saved-zero title, pending reward and pause. All **32 groups / 96 state observations passed**: viewport fit, no horizontal overflow, 44px controls, actual center hit testing, visible Stub note and frozen pause clock. See [CONTROL_AUDIT.json](CONTROL_AUDIT.json). LocalStorage zero-credit fixtures here exercise presentation; the existing natural-death browser cases independently verify credit persistence. Bounds and hit tests are sampled atomically so the unchanged 900ms reward Stub cannot complete between measurements; pending progress is the CTA text, while the intentionally empty error-status element is not treated as visible content.

Executed `check-echo-cues.mjs` at desktop 1440×900 and compact portrait 320×568. Actual WATCH → off-gap → ordinary wrong input → replay passed twice: lit and replay opacity 1, minimum text/gradient-stop contrast **5.9319:1**, off-gap highlight removed and transition **0s**, natural credit deduction to 2 and no errors. See [ECHO_CUE_AUDIT.json](ECHO_CUE_AUDIT.json).

The unchanged development suite ran **8 / 11 / 10 / 12 / 10 distinct executions** for Game001–005 respectively. Its ordinary-input coverage includes Workday's 1000m clear without credit consumption, Tower's 18 accepted drops and camera progression, Echo's level 8 / nine-cell worst-card layouts and Sort's 40 deliveries / reversal. Keyboard, native touch, multi-touch approval, held / repeated inputs, three natural failures, reward guards, best / reload / mute, pause / cached pagehide and telemetry assertions remain intact. No existing selectors, gameplay assertions or script-byte budgets were weakened.

Final production checks used the final five-page build. Native Echo loaded **19,900 JS body bytes** and Sort **22,128 bytes**; actual response-body inspection and request records confirmed no Phaser chunk for those routes. Production debug hooks were absent. The approximately 1.21 MB Phaser chunk warning remains for engine-based games.

### Final image delivery

[LOADED_ASSET_AUDIT.json](LOADED_ASSET_AUDIT.json) records actual successful startup image responses and decoded dimensions on the final production preview. [RUNTIME_ASSET_INVENTORY.json](RUNTIME_ASSET_INVENTORY.json) separately records every shipped runtime image.

| Game | Actual startup images | Startup encoded bytes | Startup base RGBA bytes | Complete runtime images | Complete encoded bytes | Complete base RGBA bytes |
|---|---:|---:|---:|---:|---:|---:|
| Game002 | 14 | 254,412 | 2,949,120 | 14 | 254,412 | 2,949,120 |
| Game003 | 6 | 57,098 | 1,691,648 | 6 | 57,098 | 1,691,648 |
| Game004 | 0 | 0 | 0 | 0 | 0 | 0 |
| Game005 | 2 | 54,490 | 1,589,248 | 5 | 89,992 | 2,375,680 |

Game005 startup loaded the factory and the selected round/light product; three other product variants are lazy assets. Game004 translates its generated visual reference into native DOM / CSS and ships no raster image. The complete runtime inventory is **25 WebP files, 401,502 encoded bytes and 7,016,448 base RGBA bytes**. Generated concept masters and comparison captures are outside public runtime assets. RGBA values are width × height × 4 estimates, not measured browser/GPU allocations. All four route probes had zero failed requests, HTTP errors, page errors or console errors.

Fixed renderer pools and unchanged cleanup paths were reviewed alongside ordinary retry / progression. No new per-frame GameObject allocation or unbounded pool was found. This does not establish physical-phone FPS or a measured heap bound. All QA browser contexts were closed and the QA-owned production preview process was stopped after the probes.

Independent reports: [Game002](GAME002_VISUAL_REVIEW.md), [Game003](GAME003_VISUAL_REVIEW.md), [Game004](GAME004_VISUAL_REVIEW.md), [Game005](GAME005_VISUAL_REVIEW.md). All meet total ≥80, readability ≥12/15 and production suitability ≥12/15; no visual runtime revision was requested after the final review. Human redesigned-art / real-device acceptance remains pending. QA PASS does not publish the games.
