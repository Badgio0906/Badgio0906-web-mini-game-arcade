# Japanese titles / UI / additional features — QA

Status: **QA PASS; final runtime and QA-owned evidence frozen.** No unresolved regression blocker. Independent review passed all four revisions. Human first-time comprehension, fun, art acceptance and physical-device performance remain untested.

## Baseline and authorized scope

Baseline `ad261f9`; original protected SHA-256 values are in [TITLE_UI_BASELINE.json](TITLE_UI_BASELINE.json). Core services, Game001 and Game003–005 Run models / contracts must remain byte-identical. Prior visual QA records describe historical releases and are unchanged. Authorized changes include Game002 genuine NICE DODGE detection / final-score calculation / micro effects, pure Tower title and Echo joke helpers, four-game Japanese primary titles / larger desktop layout / local fonts, and Sort's mandatory pre-play explanation / optional practice.

Run `node tests/revisions/audit-protected.mjs` after integration. Review other source diffs manually for preserved model RNG / collision / physics, input approval and native keyboard, synchronous credit charging, storage namespaces / legacy keys, reward guard, lifecycle and telemetry. New score telemetry is separately documented by Main Agent; historic distance best and clear time must survive the new score best.

## Executed behavioral coverage

- Workday: actual threatened-lane late escape; time-window boundaries; no idle, safe-lane wiggle, fatal or duplicate-wave bonus; tier thresholds / rounding / natural terminal result; old 1000m clear and seeded fair-route tests remain.
- Tower and Echo: actual helper threshold boundaries and escalating title / required joke suffix; helpers do not mutate the protected models.
- Sort tutorial / practice: overview contains objective, left/right mapping, changing rules, failure and PC/touch inputs; round left and angular right examples; wrong practice stays, correct progression; no run time, CREDIT, best, score, run_start / run_end side effects before 本番へ; explicit once-only start; native keyboard / touch / held input and cached-pagehide behavior.
- Existing dev regressions enter Sort's real game explicitly through the new flow. Preserve all original gameplay expectations, ordinary-input planners and native production script budgets.
- Eight sizes: 1920×1080, 1440×900, 1280×720, 1024×768, 390×844, 320×568, 844×390 and 568×320. Check Japanese / English hierarchy, live field enlargement, tutorial / practice / paused / long title / comment / score / zero-credit result / pending reward fit, visible essentials and 44px native actions.
- Global runtime freeze precedes actual browser execution. Independent reviewer captures first; QA uses one worker afterwards. Final units / strict build / complete dev / five production routes plus font and asset delivery probes run on frozen source. No HMR across evidence runs.

## Evidence ledger

| Check | Actual result |
|---|---|
| Protected SHA audit | Final 18/18 byte-identical against ad261f9; [audit](TITLE_UI_PROTECTED_AUDIT.json) |
| New pure / model tests | 10/10 PASS, including exact .65s boundary, genuine escaped threat, after-pass reward, no safe-wiggle / fatal / reentry bonus, two-person wave deduplication, score tiers and title / joke bands |
| Existing + new units | 63/63 PASS across seven files, 3.33s; all original 53 retained |
| Strict build | PASS: strict TypeScript and five static pages, Main Agent final frozen build; production checks use the same output |
| Existing + new development cases | 57 PASS / 63 intentional project-duplicate skips, 120 expanded cases, 12.4min; [counts](DEVELOPMENT_AUDIT.json) |
| Five production routes | 5/5 PASS, 40.7s; no development hooks |
| Eight-size essential controls / cards | 32 control groups + eight Sort training groups (40 records), and 32 result layouts + one compact title record check (33 records), PASS / zero errors |
| Local font delivery | Four fresh-context routes PASS, one local loaded 106,532-byte WOFF2 per route; zero HTTP / request / console / page errors |
| Independent UI / game-feel review | Game002–005 all PASS; ordinary inputs at 1920×1080 and touch-emulated 390×844 |
| Human play / physical-device performance | Not performed |

## Frozen-source review observations

Workday preserves move duration, queued-move cap, substep / delta clamp, collision bounds, enemy positioning, spawn / difficulty and RNG. The new tracker arms only a real enemy contact band before vertical entry, observes actual escape and reentry, and delays one award until the complete wave passes alive. Candidate and wave bookkeeping is reset and pruned. The only scene effect is a short deterministic foot ring; existing sound / text and reduced-motion handling remain. Final distance-based tier score uses the displayed whole metres.

SortRun / SortBoard remain untouched. The new training surface is separate from the inactive title controller: explanation / practice keep the Run reset and do not start timers or telemetry. Practice uses distinct step, pointer and native-key approvals; blur / pagehide clear pending approvals. Explicit 本番へ invokes the existing guarded start path. Actual retries continue directly into ordinary gameplay. Existing reward, best, pause, terminal event and credit paths are preserved.

Tower / Echo additions select result text through pure helpers while the gameplay models remain protected. Font and layout changes are presentation-only. Workday's new bestScore key remains separate from legacy best distance, cleared and clearTimeMs; actual normal-input browser verification passed. Three genuine NICE escapes followed by natural collision produced the 110% result, one credit deduction and correct score telemetry. Legacy distance best 1000 / clearTimeMs 95555 survived, while bestScore was written separately and reloaded correctly.

## Reproduction commands

Use the repository root. Final-source checks use the frozen runtime and one browser worker; do not run GPU-heavy reviewer sessions simultaneously.

```sh
node tests/revisions/audit-protected.mjs
npm test
npm run build
npm run test:e2e
node tests/revisions/check-controls.mjs
node tests/revisions/check-results.mjs
npm run test:production
```

The control / result probes use the development server at `http://127.0.0.1:5173`. The production suite launches its configured static preview. For the separate font response-body probe, start `npm run preview -- --port 4173 --strictPort` on the same final build, then run:

```sh
TITLE_UI_QA_BASE_URL=http://127.0.0.1:4173 node tests/revisions/check-fonts.mjs
```

Each probe closes its browser contexts. Stop the QA-owned preview process when complete. Console / page errors and HTTP / failed font requests are recorded separately from expected CLI build-size warnings. JS byte budgets are unchanged; font and image response bytes are additional delivery evidence, not subtracted from the existing script budget.


## Actual browser results and scope

The complete development suite executed desktop **31**, mobile portrait **15** and mobile landscape **11** cases. Per-file counts are Game001 8, Game002 12, Game003 10, Game004 12, original Game005 10 and new tutorial 5. All original 51 executions remain; the six new executions add actual NICE/storage/telemetry proof and training behavior. No original model assertions, selectors or JS budgets were weakened. Only Sort's initial-entry actions were adapted through `enterSortPlay()` to explicitly pass explanation → 本番へ. Real retries remain direct.

Long ordinary-input coverage passed Workday's 1000m no-credit clear (1.7min), Tower's 18 accepted drops / scrolling / intact stack (1.4min), Echo reached LEVEL 8 / nine-answer zero-credit feedback at seven sizes (41.5s) and Sort's 40 decisions / rule reversals (16.8s). The new Workday late-escape score / legacy-record test passed in 27.1s. Training tests cover a wrong answer that stays, round→left / angular→right, untouched clock/CREDIT/best/events, cached pagehide, held keys, native Enter/Space and exactly one explicit real-run start.

[CONTROL_AUDIT.json](CONTROL_AUDIT.json) records the 32 game × viewport title/pending/pause groups (96 state observations) plus eight Sort tutorial/practice/completion groups. It checks actual center hit testing, 44px actions, viewport bounds, Japanese and English title visibility, the visible Stub and a frozen pause clock. On every Sort viewport, holding native Space on example two while ArrowRight completes practice and then releasing Space leaves the page in completed practice with zero run_start and a zero model clock; it cannot auto-start the real game. Saved-zero LocalStorage fixtures exercise layout; natural-death tests separately establish persistence.

[RESULT_LAYOUT_AUDIT.json](RESULT_LAYOUT_AUDIT.json) records natural failures with visible essential score / best / correction fields and native actions at all eight sizes. Tower's longest title and Echo's longest comment are **presentation text stress on an ordinary earned result**, not a claim of naturally earning those high bands; model and stored score are never injected or changed. Pure helper tests separately verify their thresholds.

### Deliberate compact clear-record exception

The first result probe stopped at Game002 568×320 because it required the historical clear-time row to be visible. New CSS deliberately hides only `.result-card .clear-record` in landscape at height ≤350px. This is an authorized compact presentation choice: the mandatory distance, NICE count, multiplier and score remain visible, and historical storage is preserved. Main Agent explicitly accepted this narrowly scoped exception; no runtime fix was made.

The corrected probe still requires that row visible and within bounds in the other seven sizes. On compact landscape it verifies the hidden row retains `95.6 s` in the result DOM and clearTimeMs remains `95555`, then returns through the actual TITLE action and verifies the historical clear record is visible there. All 32 result layouts plus this title check passed. This is not a blanket removal of a failed visibility assertion.

## Delivery and cleanup

[FONT_LOAD_AUDIT.json](FONT_LOAD_AUDIT.json) inspects actual production font responses and FontFace status, with Japanese primary / English secondary titles using `Arcade Rounded`. The shared local weight-500 WOFF2 is **106,532 encoded response-body bytes**, fetched successfully once in each fresh game context. Four test contexts do not imply four downloads per player; all routes reuse one URL. A blocked-font fallback scenario was not separately exercised. Main Agent's subset / Japanese-glyph audit is separate evidence.

[DELIVERY_AUDIT.json](DELIVERY_AUDIT.json) records exact font SHA-256 and unchanged runtime image delivery: **25 WebP / 401,502 bytes**. Current public image paths and byte sizes equal the historical inventory, and git comparison against ad261f9 confirms no image changes. Combined complete image + font files are **508,034 encoded bytes**, excluding license text and HTTP headers. Font rasterization / GPU cost is not inferred from encoded size.

Actual unique production JS response bodies were **20,758 bytes for Echo** and **26,540 bytes for Sort**. Both retained their original script budget and loaded no Phaser; actual response bodies were inspected rather than relying only on chunk names. Engine-based games retain the existing large Phaser chunk warning. All five production routes had their normal input / pause / persistence assertions pass without debug hooks.

All focused layout and font probes recorded zero page / console errors; the font probe also recorded zero failed requests / HTTP errors. All QA browser contexts are closed and the QA-owned static preview process was stopped. No FPS or physical-phone memory claim is made. Human comprehension and replay appeal still need actual human play.

Independent reports: [Game002](GAME002_TITLE_UI_REVIEW.md), [Game003](GAME003_TITLE_UI_REVIEW.md), [Game004](GAME004_TITLE_UI_REVIEW.md), [Game005](GAME005_TITLE_UI_REVIEW.md). Private Site publication and archive verification are Main Agent responsibilities; this report itself does not publish anything.
