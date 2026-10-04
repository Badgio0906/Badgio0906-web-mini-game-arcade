# Eleven-game integration — QA ledger

Status: **47 distinct valid native cases PASS across source-bridged slices;352 clipping-aware title/training and176 actual pause/result observations PASS.24 fresh local root/subpath production contexts PASS /zero errors /zero production diagnostic hooks. All QA browsers are closed. Independent final review, remote delivery and human playtest remain separate.** Baseline `ffa433c3bd3e475235f3cc235bf9bf29292e7aaf`. Prior115-unit /90-case ten-game reports remain historical; their enabled-CREDIT and root-Game001 assumptions are not the new prototype contract.

## Protected scope

[GAMEPLAY_BASELINE.json](GAMEPLAY_BASELINE.json) contains19 byte-strict files: existing ten pure Run models plus nine score / result-flavor / localization helpers. Nine separate existing contracts carry review hashes; presentation/controller onboarding additions can be reviewed explicitly. Workday interfaces are inline in its protected Run file. Authorized portal routes, feature flags, onboarding, renderers / UI and required telemetry type additions are outside the old byte gate. No old baseline is rewritten.

```sh
node tests/eleven-game/audit-gameplay.mjs
```

Initial result:19 strict matches, zero contract changes. [GAMEPLAY_AUDIT.json](GAMEPLAY_AUDIT.json) is an executed source audit, not browser gameplay evidence. Final executed audit:19 protected gameplay files match, zero changed contracts;197 runtime files match the final frozen manifest.

## Executed targeted tests

| Command | Executed evidence | Limitation |
|---|---|---|
| `npx vitest run tests/unit/game011.test.ts` |9/9 PASS;1.310s tests /1.62s runner |Pure model only; native timing/gestures are independently covered below |
| `npx vitest run tests/unit/services.test.ts tests/unit/arcade-credits.test.ts` |22/22 PASS (17 legacy enabled-wallet /5 disabled-prototype);40ms /322ms |All11 stored-zero three-ending/retry contracts now pass separately |
| `npx vitest run tests/unit/arcade-practice.test.ts` |Latest24/24 PASS at10:43:24 UTC;13ms /283ms. Earlier23/23 checkpoint preceded the practice corrections below. |Independent practice scenarios, not actual DOM/canvas usability |
| `npx vitest run tests/unit/game002.test.ts` |8/8 PASS at10:48:38 UTC;608ms /928ms |Only future-enabled wallet fixture constructors changed; existing route/fairness assertions retained |

Game011 tests use only public start/step/input/advance/ready/chooseFinal. Pools contain20 unique balanced items; each run takes10 unique images / texts. Five-second first image, one-second later images, unlimited reading, ready starts exactly0.8s with a new input epoch, unlimited final choice and immediate0.5s final questions pass. Points100/150/250, one wrong/timeout ending, full elapsed time rather than a physics dt cap, stale epochs, deep copies/reset and invalid deltas pass. Statistical simulation takes5100 independent placements in **each** image/text/final phase; every left ratio lies47–53%, with repeated same-side streaks rather than forced alternation. This establishes deterministic seeded behavior, not human reflex timing.

Disabled CREDIT tests preserve actual stored0/1/3, permit200 attempted consumes without writes/events, never call rewarded adapters, retain no pending state and restore the saved restriction when explicitly re-enabled. Existing service fixtures now explicitly use enabled=true so future-wallet persistence/dedup/adapter regressions retain their original meaning.

Independent practice tests require real scenario actions for all11, reject idle completion, keep wrong samples available, show Echo off gaps, wait for Parking movement, counter-steer Coffee, separately display Meeting practice points and exercise randomized Quiz labels. Desktop native integration has now passed all11 production model/BEST/credit/event isolation scenarios; phone integration has also passed.

## Read-only preparation findings

- Game007 onboarding initially taught LEFT/A=board and RIGHT/D=reject, opposite the real Board and spec. Root was notified to correct explanation, button order and practice key binding; actual native right→board /left→reject is a required browser assertion.
- Game002's second practice blocker initially stayed in lane0, so a first RIGHT dodge could idle through the second encounter. Root was notified; both directional teaching paths should be checked after its final design choice.

Root corrected Game007's mapping and added a1.1-second boarding display before the overweight sample. The latest unit verifies260kg first, rejects input during that display, then permits rejecting410+80. Root changed Game002's second blocker to the lane used for the first avoidance; the latest units verify both first-LEFT and first-RIGHT paths cannot idle through the next hazard. Desktop native RIGHT-board/LEFT-refuse and two real avoidance steps have passed; phone actions have also passed.

Root's initial full153-case checkpoint found152PASS/1 future-enabled fixture failure: Game002's wallet-isolation test still used the newly disabled default. QA explicitly enabled its two services and retained its decrement/dedup/isolation assertions. Targeted8PASS followed; final full-suite success is not inferred from that partial correction.

Root subsequently executed **153/153 unit PASS in18 files at11:41:15 UTC (7.32s)** plus source/check success. Final CSS-only12-entry build took5.45s and art89-dist audit passed; pure models/source TypeScript did not change afterward. [EXECUTION_LEDGER.json](EXECUTION_LEDGER.json) preserves parent-reported and QA-executed checks with their attribution.

## Prepared actual browser gates

All candidates freeze before browsers. Root expressly released the initial integrated candidate to QA before the separate final independent reviewer slot. QA uses one worker; final acceptance still requires both independent Feel and numeric actual-image Visual assessment. No source / asset mutation or heavy parallel build during native timing checks.

1. All11: first title→short explanation→actual interactive practice→success→real run; completion saved only by deliberate success action. Practice keeps real score / BEST / production model / CREDIT / run_start / run_end untouched and uses tutorial events separately. Wrong practice stays. Reload completed title permits immediatePLAY and repeat-practice.
2. Prototype limits off: stored CREDIT0 still starts real play, three actual failures / retries remain available, no reward/offer/credit_used/credit_zero or wallet writes; BEST and namespaces remain correct.
3. Portal:11 truthful thumbnails / Japanese and English titles / taglines / launch actions, card whole-hit area,3–4 PC columns /1–2 mobile, game return links outside hazardous interaction, refresh direct entries and root/subpath routes, actual images/fonts/statuses and no fake rankings.
4. Game007: stage current/max/remaining capacity, actual next subject+weight / projection, native labeled board/refuse, visible unload people/cargo/kg and destination. Preserve450kg rules.
5. Game008: actual liquid tilt arrow/meter, distance and remaining inside play area, large legible font and correct counter-steering in practice. Preserve physics and anchored scores.
6. Game010: actual generated LISTEN/WORK foregounds and state difference, same art quality and clean image load / bounded resources; no model change.
7. Game011: ordinary keyboard/touch clears ten image /ten text questions to both final modes, real ready-key release guard, independent choices/same styling, no held/burst future input, actual deadlines/pause/background, truthful wrong/timeout, scores/BEST/reload, unrestricted retries, result fields and8 viewport layouts.

The complete47-case acceptance set is established through the source-bridged slices and affected-case retests recorded below; it is not one uninterrupted clean full run. The earlier initial13 PASS remain historical candidate evidence:

```sh
ELEVEN_ARCADE_URL=http://127.0.0.1:PORT npx playwright test --config tests/eleven-game/eleven.playwright.config.ts
```

The discovery-only `--list` command parses99 project cases across five files (47 planned active cases,52 intentional project duplicates). It opens no browser and establishes no functional PASS. Prepared cases cover22 desktop/phone first-practice integrations,11 stored-zero three-ending/retry contracts, portal cards/routes, actual weight/unloading and in-game liquid HUD, generated foreground resource loads, both quiz final modes and native ready/repeat/deadline handling. One dedicated geometry case checks352 title/explanation/practice/success observations. The11 unlimited-retry cases additionally check176 actual paused/first-natural-result observations at eight sizes; explicit primary/navigation targets remain44px. Phone Coffee practice uses native Chromium touchStart/held touchEnd with a delivered primary-touch assertion; desktop uses held ArrowRight. A separate native-Enter auto-repeat case protects the newly focused real-start button after practice success.

## Actual development checkpoints and findings

Three retained slices on frozen DEV5181 passed13 distinct cases: all11 desktop first-practice/isolation/completion/reload/repeat flows and the two held-input guards. A saved-zero storage fixture is explicit; these practice tests establish no three-death/unlimited-retry proof yet.

The responsive collector completed352 actual observations (88 active titles plus264 explanation/practice/success states), with zero HTTP/runtime errors. [INITIAL_ONBOARDING_LAYOUT_AUDIT.json](INITIAL_ONBOARDING_LAYOUT_AUDIT.json) retains64 failing observations:34 active title heights,24 practice control bounds, and six modal widths. All content/44px/containment assertions remain enabled. Native dialogs make the title underlay inert, so modal height is measured by its own visible controls and active title document height is assessed separately. Typical actual failures: Game001 PC document935/900; practice action bottom413.672/390 or341.875/320. A readonly two-RAF resize settling barrier was added before the next retarget because Game009 uses ResizeObserver packing; transient-width findings remain historical until settled evidence classifies them.

Four prior stops were harness issues, with traces retained in ignored artifacts: preserved padded Orbit score00000, inactive modal underlay height, Echo's genuine idle reached-LEVEL1 primary display, and five wrong Stamp objects sharing an action. Corrections preserve initial display/model/BEST/wallet/events and use a concrete blue-square wrong stamp. None is described as an implementation failure. Raw journals are `/workspace/eleven-native-initial.log` through`/workspace/eleven-native-fifth.log`; the compact executed ledger records the retained outcomes. No source repair occurred during an open QA context.

Fresh repaired execution subsequently passed16 desktop cases: all11 practice flows, both held-input guards, the352-observation collector and both portal cases. [FINAL_ONBOARDING_LAYOUT_AUDIT.json](FINAL_ONBOARDING_LAYOUT_AUDIT.json) retains352 PASS /zero runtime-HTTP errors. That viewport-only collector is historical in [its preserved JSON](VIEWPORT_ONLY_ONBOARDING_LAYOUT_AUDIT.json); the final linked audit is the strengthened clipping-aware retarget. Its first revised-UX case stopped at actual Game007 F2 PAUSE:1920×1080 document height1083 exceeded the existing1081 allowance. Weight65+90=155 /remaining385 and primary controls were visible; footer/padding exceeded the viewport budget. [Finding JSON](findings/GAME007_PAUSED_OVERFLOW.json) and [actual screenshot](findings/game007-paused-1920-initial.png) retain this failure. All contexts closed before root/UI repair. The CSS-only source bridge retained15 functional cases, retired the earlier collector and retested affected Game009 flows. Final evidence explicitly uses multiple slices rather than one uninterrupted clean full run.

The lifecycle retarget completed16 desktop PASS /two retained FAIL in8.1m. All11 unrestricted3-ending/retry cases passed, with [176 actual clip-aware pause/result observations](ACTUAL_PAUSE_RESULT_LAYOUT_AUDIT.json). Revised Elevator/Coffee/Meeting UX, both ordinary Quiz final modes (5500 /streak12) and eight-size real Quiz results passed. The strengthened [352 clipping-aware training observations](INITIAL_CLIP_ONBOARDING_LAYOUT_AUDIT.json) found one true practice320 issue: right-column Stamp targets extended to311 beyond the hidden-window boundary292. [Actual clipping screenshot](findings/game009-practice-clipped-320-initial.png) is retained; real Stamp packing/model is unchanged. The second failure was a harness mismatch: ended Quiz phases intentionally return `remaining:null`. The corrected test retains strict `deadline:1`, `answerElapsed:1`, one timeout run_end, unchanged score100 and rejection of a late native answer. Its corrected native retest now passes; [raw deadline proof](ACTUAL_QUIZ_DEADLINE_AUDIT.json) preserves the actual final snapshot/events.

Portrait native integration then passed14 active cases /19 skips in2.8m:11 real practices, two portal flows and both Quiz final modes. Coffee uses verified primary held touch; Quiz READY holds and answers use real touches. The landscape project executed33 intentional duplicate skips; it is not actual landscape gameplay evidence. Eight-size layout observations come from desktop-engine resize tests. The45 valid distinct cases in those slices were subsequently completed to47 by the final retarget; [CSS-only bridge](RETAINED_NATIVE_SOURCE_BRIDGE.json) explicitly retires the earlier viewport-only collector. No claim of one uninterrupted clean47-case run is made.

Final grid repair changed only shared practice CSS. Fresh Game009 desktop and phone practices, the full352 clipping-aware matrix and the corrected Quiz timeout case passed4/4 in2.2m. All352 final observations have no issues/errors; [desktop practice](ACTUAL_GAME009_DESKTOP_PRACTICE.json), [phone practice](ACTUAL_GAME009_PHONE_PRACTICE.json) and the raw deadline proof are portable. These four executions replace two prior practice passes and close two pending cases, resulting in47 distinct native PASS.52 configured duplicate skips were exercised;57 duplicate skip executions include the five repeated skips in this retarget.197 runtime files match the final frozen manifest.

Executed test-only root/subpath delivery commands:

```sh
ARCADE_STATIC_PORT=4191 node tests/eleven-game/serve-static.mjs
ARCADE_STATIC_PORT=4192 ARCADE_STATIC_MOUNT=/repo/ node tests/eleven-game/serve-static.mjs
node tests/eleven-game/probe-production.mjs
```

The static server has no SPA fallback: a missing physical game or asset returns404. The probe opens24 fresh contexts (portal plus11 games at each mount), records unique HTTP script/image/font bodies and encoded/decoded transfer sizes, excludes blob image duplication, and verifies production diagnostic hooks are absent. It retains2MB Phaser /300KB native script ceilings and observes stored-zero completed-tutorial PLAY→pause→refresh→portal through normal DOM actions. The initial24-route collector reached every functional assertion, but returned-portal response-body jobs raced context shutdown and subsequently mutated one saved errors array. [Initial collector audit](INITIAL_PRODUCTION_COLLECTOR_SHUTDOWN_AUDIT.json) retains this harness failure; the final collector waits for network idle and drains jobs before its final error assertion/close. No runtime source changed. Local/static evidence cannot certify remote GitHub Pages deployment; Root's later remote check remains separate.

For a separate remote report, set `ELEVEN_STATIC_URLS` to the deployed base and `ELEVEN_STATIC_REPORT` to a new JSON path; the default local report is preserved. Remote observations remain unexecuted.

Root final build12 HTML/check/art89 has passed. Final24 fresh local contexts PASS at12:39:57 UTC, with zero HTTP/runtime errors and zero production diagnostic hooks. The22 game contexts each use explicit saved0/completed-training storage, ordinary PLAY→pause→refresh→real11-card portal return. All local assets remain under the requested mount. [Full production audit](PRODUCTION_ROOT_SUBPATH_AUDIT.json) records HTTP bodies and encoded/decoded transfers; [compact resource summary](PRODUCTION_RESOURCE_SUMMARY.json) preserves the table below. The initial response-body shutdown race is retained separately; corrected final data has no late errors. All QA browsers closed before independent review handoff.

| Route | JS body B | JS gzip B | Images B (count) | Font B |
|---|---:|---:|---:|---:|
|portal|3842|2207|143896 (11)|154856|
|game001|1260597|352968|0 (0)|0|
|game002|1269304|355705|294484 (17)|154856|
|game003|1266864|355109|57098 (6)|154856|
|game004|44107|17448|0 (0)|154856|
|game005|51463|20094|54490 (2)|154856|
|game006|1266773|355096|52134 (3)|154856|
|game007|55768|21405|10526 (1)|154856|
|game008|57119|22435|67398 (1)|154856|
|game009|50514|19857|105962 (7)|154856|
|game010|53234|20622|160720 (8)|154856|
|game011|47930|18681|224332 (20)|154856|

Values match for root and `/repo/`.001 uses its retained system-font/procedural renderer; other routes load154856B local font. Phaser script bodies appear only on001/002/003/006; every native/portal route is below300KB and requests no Phaser engine. Script/image/font numbers are first-load unique HTTP bodies, not cumulative refresh/return traffic. Existing performance ceilings and meaningful assertions must not be weakened to accommodate a failure. Rendering-only fixtures, seeded storage fixtures, model simulations, ordinary browser play and human A–N remain separately attributed. Human playtest / physical-phone FPS / enjoyment / public-release acceptance is unperformed.
