# Ten-game expansion — QA ledger

Status: **final technical QA complete; human playtests pending**. Existing Game001–005 regression gates pass63 distinct actual cases. Game006 closes through8 pure tests /5 native Playwright passes plus separately documented actual long-branch /semantic-rendering composite (original long executions remain historical FAIL); independent Visual82. Game007 now passes7 pure tests /6 distinct native cases /8 persisted-zero menu fixtures; independent Feel /Visual85. Game008 passes9 pure tests /5 native cases /16 result-rendering fixtures /8 persisted-zero menu fixtures and independent Feel /Visual83. Game009 passes7 pure tests /6 distinct native cases /8 persisted-zero menu fixtures; its repaired pending images independently pass Feel /Visual85. Game010 passes7 pure /5 distinct native cases /8 persisted-zero menu fixtures and independent Feel /Visual83. Final all-ten production10/10 and ten fresh-context resource audits pass. Baseline: `6c3357f`; old title/UI /visual reports and model hashes remain historical.

## Protection and execution

[PROTECTED_BASELINE.json](PROTECTED_BASELINE.json) records24 protected files: the original22 core / Game001 / Game004 files including HTML / styles / manifests, plus unchanged Game005 SortRun / contracts. `node tests/ten-game/audit-protected.mjs` requires byte equality, with one authorized exception: TelemetryService's EventName union may add names while retaining existing names and all other normalized AST unchanged. Shared font refresh and root-owned build/browser configs are separately authorized.

Implementation order is existing Game002 → Game003 → Game005, followed by full regression, then Game006 → Game007 → Game008 → Game009 → Game010. Each new candidate needs independent visual/game-feel review and actual QA before the next candidate gate. Global runtime/asset/text freeze precedes actual browser work; independent capture browsers close before QA's exclusive one-worker slot. Root owns global configs, font refresh, archive and deployment. QA owns tests / this evidence only.

## Planned coverage

- Workday: actual 1000m company / 2000m bike offers, input and clock freeze, once-only choices/events, office clear / journey / safe exit / walk / bike; bike 2× movement / obstacle / distance, real duration; old best / clear time and score separation; retry reset; genuine NICE eligibility remains; model runs past 5000m with bounded enemies / waves / bonus tracking.
- Tower: 15m once-only offer, phase/cargo/clock freeze, normal choice, latched C mode, 2× hanger speed and 3× existing Perfect bonus; physics / full cargo / mass / support / RNG preserved, reset mode on retry.
- Sort: larger bilingual rules, default Japanese, English toggle persists and covers tutorial / practice / live rules / result / HUD; mode switch creates no extra run, score, credit or best side effects; per-game storage isolation.
- New games: public-input pure fairness / skill / progression / escalation tests plus actual ordinary desktop / native touch inputs, truthful failure / safe exit, three deaths → zero → one guarded Stub refill, best / reload / pause / cached-pagehide / mute, eight viewport layouts, no console/load errors, production no debug hooks and actual script-body budget checks. No injected milestone distances / scores / time.
- Eight sizes: 1920×1080, 1440×900, 1280×720, 1024×768, 390×844, 320×568, 844×390, 568×320. Essential choice text, mappings, score and 44px actions must remain visible / usable.
- Fast pure simulations establish model behavior; they do not establish human fun, real device FPS, cognitive ease or actual browser milestone timing. Human A–N remains unperformed unless user reports it.

## State ledger

| Candidate | API / source freeze | Unit evidence | Actual browser / production | Independent gate | Human |
|---|---|---|---|---|---|
| Game002 expansion | Frozen immutableDEV5174 | 25 targeted tests passed (7 new) | 13 distinct PASS;3 retained harness failures across initial / targeted runs | Independent PASS86 | Not performed |
| Game003 C mode | Frozen immutableDEV5175 | 23 targeted tests passed (4 new) | 11 distinct PASS;3 retained harness failures | Independent PASS85 | Not performed |
| Game005 localization | Frozen repaired immutableDEV5175 | 3 localization tests passed | 14 native cases +5 training cases PASS;16 JA/EN pending layout records PASS | Independent PASS88 revision3 | Not performed |
| Game006 PARK IT! | Frozen repaired immutableDEV5176 |8 tests passed |5 distinct native PASS; separate accepted actual+800 /render/reset composite; original long FAIL retained | Independent Feel PASS /Visual82 | Not performed |
| Game007 ELEVATOR | Frozen repaired immutableDEV5177 |7 tests passed |6 distinct native PASS;8 persisted-zero menu fixtures;23 files exact | Independent Feel PASS /Visual85 | Not performed |
| Game008 COFFEE | Frozen repaired immutableDEV5178 |9 tests passed |5 distinct native PASS;16 result DOM /8 persisted-zero fixtures;17 files exact | Independent Feel PASS /Visual83 | Not performed |
| Game009 STAMP | Frozen repaired immutableDEV5179 |7 tests passed |6 distinct native PASS;8 persisted-zero fixtures;27 files exact | Feel PASS /Visual85 | Not performed |
| Game010 MEETING | Frozen repaired immutableDEV5180 |7 tests passed |5 distinct native PASS;8 persisted-zero fixtures;22 files exact | Feel PASS /Visual83 | Not performed |

## Reproducible commands

From the repository root, after the relevant freeze:

```sh
node tests/ten-game/audit-protected.mjs
npm test
npm run build
npm run test:e2e
npm run test:production
```

New route tests use `tests/e2e/game006.spec.ts` … `game010.spec.ts` and corresponding `game006.production.spec.ts` … `game010.production.spec.ts`. Root extends explicit global test matches only when a route is ready. Existing expectations and script budgets are retained; tests explicitly select normal milestone branches when preserving earlier default-run checks.

Actual counts, elapsed time, commands, error records, load bytes and narrow harness corrections will be appended per executed gate. Current baseline audit passes23 byte-identical files and one EventName-only union extension; final frozen audit remains required.

## Game002 model checkpoint

Executed `npx vitest run tests/unit/game002.test.ts tests/unit/revision-features.test.ts tests/unit/workday-escalation.test.ts`: **25 / 25 passed**, three files, 4.65s (2026-10-04 UTC). Existing five seeded 1000m routes and genuine NICE tests retain their original assertions and now explicitly select `office` at the new pause.

Seven new tests use public `step`, adjacent `move` and `choose`, with read-only inspection. They verify 1000m / 2000m live pauses freeze all inspected state and reject other choices, once-only office / safe-exit outcomes, fresh-segment lead above 1.8 real seconds even on bike, 2× approach / lateral motion / distance while real duration is unchanged, five seeds each for walking / biking beyond 5200m with ≤12 enemies and ≤6 waves, ordinary post-5100m collision and retry reset, and uncapped tier / rounding / finite-score behavior. Pure simulations establish model behavior, not browser milestone or human-play evidence.

The existing actual 1000m browser route now asserts the frozen company offer before clicking its normal office action. The additional actual-key route now passes journey to2000m safe exit, cached-pagehide pause, native choice guards, event counts, CREDIT preservation, legacy clear-time persistence and independent best-score storage; the actual gate below records its harness corrections.

## Game003 model checkpoint

Executed `npx vitest run tests/unit/game003.test.ts tests/unit/tower-escalation.test.ts tests/unit/revision-features.test.ts`: **23 / 23 passed**, three files, 452ms. Existing 60-floor physics policies explicitly choose normal continuation at the new offer, retaining all original mass / support / full-width / bounded-drift expectations.

Four new tests establish the strict height boundary through ordinary center drops: RNG 1/7 produces 23 accepted floors at exactly 15m without an offer; the 24th produces 15.65m and the live pause. Full inspection and clock freeze, no queued drops, normal continuation with no later offer, latched challenge / reset, previously earned bonus preservation and future 2400-point Perfect (ordinary capped 800 ×3), exact2× hanger angular progression with real-time / vertical gravity / full cargo preserved all pass. The long actual-input route now passes the offer and an earned prospective C-mode Perfect award; its final actual gate is recorded below.

### Isolated Game002 browser candidate

Root supplied frozen DEV snapshot `/workspace/scratch/ten002-frozen` at `http://127.0.0.1:5174`, keeping the read-only inspection hook while preventing unrelated Game003 Vite edits from reloading long milestone runs. QA-owned `tests/ten-game/workday.playwright.config.ts` imports the standard root configuration and only changes route match / base URL / server reuse. Command after independent reviewer closes contexts:

```sh
npx playwright test --config tests/ten-game/workday.playwright.config.ts
```

[GAME002_SNAPSHOT_AUDIT.json](GAME002_SNAPSHOT_AUDIT.json) records32 snapshot-versus-live core / Game002 runtime / HTML / asset / local-font hashes (all equal at preparation); final equality must also be checked after the milestone browser gate. No browser PASS is inferred from discovery or this hash comparison.

Source review of `git diff 6c3357f -- src/games/game003/TowerScene.ts` confirms the existing land-spark loop remains ten particles with three global `Math.random()` draws per particle (30 calls per accepted landing). New mode labeling / pending freeze / choice controller code adds no global RNG draws, preserving later cargo RNG consumption. The targeted new Tower test was rerun after adding explicit once-only milestone / choice event assertions: 4 /4 passed,80ms test time (457ms runner).

Snapshot audit reproduction:

```sh
node tests/ten-game/audit-snapshot.mjs game002 /workspace/scratch/ten002-frozen
```

Root authorizes subsequent shared-font subset growth as new game strings arrive. [GAME002_SNAPSHOT_INITIAL_AUDIT.json](GAME002_SNAPSHOT_INITIAL_AUDIT.json) preserves the actual32-file equality checkpoint. Final source / core / HTML / assets and font-license bytes must still match the isolated candidate; only `public/fonts/arcade-rounded-jp.woff2` may differ under explicit `--allow-font-growth`. Such a font change is recorded as an exception, not byte equality, and requires final actual route loads / glyph coverage evidence.

## Game005 localization checkpoint

Executed `npx vitest run tests/unit/sort-localization.test.ts`: **3 /3 passed**,31ms test time (498ms runner). Japanese ordinary shape / brightness / size / symbol mappings and reversal announcements match the requested meaning. All16 parcel trait combinations across8 rules (four axes × inversion) resolve to the translated correct-side attribute in both languages; English mappings match the unchanged model labels, directions remain distinct, and input data remains unchanged.

At root's explicit request, fresh protected baseline coverage now adds `SortRun.ts` and `contracts.ts` for Game005 from the same6c3357f commit; the original22 hashes remain unchanged. Latest actual protection gate is **24 comparisons:23 byte-identical and1 authorized EventName-only addition**. The earlier22-file preparation checkpoint is historical evidence, not a claim that the two newly protected files were checked then.

## Parallel source implementation decision and full unit checkpoint

Main Agent executed full `npm test`: **77 /77 passed**,6.83s, and the current five-route `npm run build` passed. This covers the original63 tests plus7 Workday escalation /4 Tower escalation /3 Sort localization tests; QA does not count the overlapping targeted runs as additional distinct tests.

Under implementation-spec section76's explicit allowance for safely independent parallel work, Main Agent now authorizes Game006 source implementation while existing-game browser gates run against immutable5174 /5175 DEV snapshots. This changes source-authoring order only: Game006 independent review / actual QA remains after Game003, Game005 and unchanged Game001 /004 browser regression. No concurrent heavy browser reviewers, no shared core changes, and no new candidate PASS before its own gate.

The remaining existing routes use QA-owned `tests/ten-game/existing.playwright.config.ts` (root configs untouched) against immutable `http://127.0.0.1:5175`. Read-only candidate audits pass Game00322 files and Game00521 files, including source / HTML / core / assets / local-font license. Reproduction:

```sh
node tests/ten-game/audit-snapshot.mjs game003 /workspace/scratch/ten-existing-frozen
node tests/ten-game/audit-snapshot.mjs game005 /workspace/scratch/ten-existing-frozen
npx playwright test --config tests/ten-game/existing.playwright.config.ts
```

These snapshot/discovery comparisons establish candidate identity. Remaining existing-route browser execution subsequently passed as recorded below; neither discovery nor hashes alone are counted as browser evidence.

## Game006 final pure-model checkpoint

Executed `npx vitest run tests/unit/game006.test.ts`: **7 /7 passed**,3.98s runner /3.497s tests against the final approved curve (start−38°, amplitude38°, steering period24→18s, power9→7s). An earlier7-test pass against the previous timing curve is historical only; the final rerun is the current evidence. No runtime issues were found.

Tests solve only visibly drawn target geometry and wait on public steering / power gauges before ordinary `act()` calls, never set controls / state / score. All seven layouts are achievable in normal and narrow forbidden modes. Independent known quarter-circle / rotated-corner checks, exact touch vs separation, AABB false-positive rejection, curved-center thin-obstacle contact with clear endpoint bodies, short / long power and wrong-angle failures, real neighbor contact before endpoint, once-only ten-park full pause / prospective2× / retry reset, precision / capped Perfect streak points, 60 legal successes with≤2 retained obstacles /41 projection points and deep-copy safety pass.

At this pure-model checkpoint Game006 native input, viewport, lifecycle / storage / telemetry and production checks had not yet run; subsequent executed gates are recorded below.

## Game002 actual browser gate and handoff

[GAME002_QA.md](GAME002_QA.md) records **13 distinct PASS** (desktop8 / portrait3 / landscape2),17 intentional project duplicate skips. Initial11-pass suite8.9m retained two harness failures; first targeted rerun1.4m produced NICE PASS28.2s and an observer-latency journey failure; final targeted journey passed3.8m with unchanged runtime and all original result / persistence assertions. Actual1000m /2000m offer cards passed all8 viewport sizes with≥44px actions, frozen time/input/resize, once-only outcomes/events and no CREDIT on safe exit. All contexts closed and the exclusive browser slot was directly handed to the Game003 reviewer at04:34UTC.


## Game007 pure-model checkpoint

Executed `npx vitest run tests/unit/game007.test.ts`: **7 /7 passed**,784ms tests /1.28s runner. Ordinary public seeded input verifies exact450kg remains alive, first excess commits one terminal result on the boarding action before the650ms visual warning, unloading precedes the next boarding decision, NEXT shifts without reroll, and declining a fitting long-haul party enables the higher-value immediate delivery.

An all-refuse1000-floor run has zero score / deliveries / occupied floors; a missed decision auto-refuses without ending the run. The20F choice freezes the whole inspection and rejects inputs, fast mode affects only future delivery / occupied-travel points at1.5×, reduces real travel / deadlines, stays latched and resets on retry. Five seeds each300floors preserve actual manifest sums, queued-party identity, load≤450, aboard≤6 and all seven passenger / cargo kinds. Snapshot / result copies, finite dt clamping and phase burst rejection pass. Actual native browsers and human play remain pending.

Main Agent separately authorized Game007 source authoring while existing and Game006 review gates continue against immutable snapshots; this is source-only parallel work under section76, with no overlapping GPU browsers or skipped candidate gate.


## Game003 actual browser gate

[GAME003_QA.md](GAME003_QA.md) records **11 distinct PASS**: desktop6 / portrait3 / landscape2,13 intentional project duplicate skips. All original10 cases passed in the initial6.5m suite; the new C-mode test required three narrow input-oracle corrections with unchanged runtime and preserved assertions. Final targeted actual test passed2.4m. Its durable JSON records22floors15.0667m live offer, all eight frozen layouts /44px actions, latched2×/3× mode, then one real Space release accepting floor23 as Perfect:7→8Perfect /combo1 /BONUS1300→1600 (=100×1×3). Natural failure / CREDIT / saved floor and bonus / retry reset pass. Raw failed traces remain in ignored artifacts as harness evidence. All QA browser contexts closed; Game005 independent reviewer received the exclusive slot.


## Game008 pure-model checkpoint

`npx vitest run tests/unit/game008.test.ts` initial strengthened **7 /7 PASS**,722ms tests /1.02s runner. The later train-direction repair checkpoint adds one meaningful case and passes **8 /8**,698ms tests /995ms runner (see below). An initial7-pass20.38s run used millions of repeated per-frame assertion calls; equivalent queue / overlap maxima still sample every frame, then assert at completion, while the final version adds actual warning callback timestamps. This is test-harness optimization, not a gameplay performance claim.

Positive acceleration moves the body right and liquid left; release preserves momentum, native-style short taps expire and dt remains bounded. Overflow uses the124×82 drawn cross-section threshold, is sign-symmetric / gradual / irreversible and capped25percentage-points per second. Same-seed no-input play empties while gentle public balancing survives160active seconds.500m freezes complete body / cups / hazard / clock state and clears input; a declined second cup prevents a1000m offer; accepted second / third cups preserve previous earned score and existing liquid state, prospectively score1.5× /2×. Independent frequencies / damping produce different actual liquid states; snapshot copies are safe.

Five480-active-second single-cup simulations pass5000m, observe all five events with actual warning-to-hazard callback lead≥1.39s (1.4s minus integration quantization), no overlapping active event and queue≤5 throughout. A real empty cup ends once with its correct name and keeps other cups' nonzero levels, then retry removes added cups. Actual native / human balance skill, art / clip geometry, frontend latency and final static delivery remain pending.

## Game005 presentation repair before final QA

Independent review found the English tutorial / practice phase-label still read『準備OK』. Root coordinated a no-browser window for the sole main branch to include those states in the existing READY localization. The patched immutable5175 candidate passed the reviewer's targeted desktop / phone READY↔準備OK / untimed training / zero-run-event checks; its earlier33-sort real runs remain valid mechanics evidence.

QA now asserts that label through both training toggles in the final actual suite. [GAME005_SNAPSHOT_INITIAL_AUDIT.json](GAME005_SNAPSHOT_INITIAL_AUDIT.json) preserves the original21-file identity checkpoint; the refreshed21-file audit matches all required source / HTML / assets / core / license bytes, with only authorized shared-woff subset growth. Original SortRun / contracts remain protected6c3357f hashes.


## Existing five-route actual regression gate

[GAME005_QA.md](GAME005_QA.md) records the final localization / training / compact repair evidence. The remaining-route initial command passed37 cases, failed two genuine320×568 result-bound assertions, and skipped39 project duplicates in5.2m. A coordinated result-only CSS repair preserved fonts,44px actions, model and input logic. Only the two affected cases were rerun:2 PASS /2 duplicates in23.4s. An additional pending-card probe passes16 JA/EN ×eight-size records with no errors. Independent Visual PASS88 revision3 reviewed the earned EN40 / JA1 final images and the pending fixtures.

Across existing routes, **63 distinct cases pass**: Game0018 /Game00213 /Game00311 /Game00412 /Game00514 /Game005 training5. Canonical project expansion has69 intentional duplicate skips. Eight retained failures across initial / targeted executions comprise six documented input-oracle / harness failures for002 /003 and two genuine compact005 layout findings, now fixed. Actual rerun executions total142 entries (63 final distinct successes,8 failed executions,71 duplicate skips); this is not142 distinct tests.

```sh
npx playwright test --config tests/ten-game/existing.playwright.config.ts arcade.spec.ts game004.spec.ts game005.spec.ts game005-tutorial.spec.ts
npx playwright test --config tests/ten-game/existing.playwright.config.ts game005.spec.ts --project desktop --project mobile-portrait --grep 'forty normal decisions|mobile zero-credit feedback' --output artifacts/ten-game005-layout-final
node tests/ten-game/probe-sort-pending.mjs
```

All existing QA Chromium contexts closed before direct handoff to the Game006 independent reviewer. No old long route is rerun without a new runtime concern. Human A–N and physical-device performance remain pending. Production all-ten-route checks remain a final gate after all new candidates; old production reports are historical.

## Game008 advertised train-direction repair

Before any008 browser opened, Main Agent identified that train body / liquid forces ignored the seed-selected side displayed in the warning. Gameplay's narrow repair multiplies both train force components by that side; later sinusoidal oscillations may reverse direction. A public-input seeded twin test holds the first four hazards identical, starts from identical state immediately before the first train, and verifies the initial actual acceleration / velocity / body lean / liquid-angle deltas follow the opposite advertised sides.

Final command `npx vitest run tests/unit/game008.test.ts`: **8 /8 PASS**,698ms tests /995ms runner. A first added-test failure read acceleration from snapshot rather than the documented inspection field; fixing that harness lookup did not change the model. Main Agent copied the repaired model to the no-browser5178 candidate. [GAME008_SNAPSHOT_AUDIT.json](GAME008_SNAPSHOT_AUDIT.json) passes17 /17 byte-identical comparisons.

## Game009 final pure-model / packing checkpoint

Command `npx vitest run tests/unit/game009.test.ts`: **7 /7 PASS**,250ms tests /714ms runner, against the final approved pixel packing. Public input covers every color / shape, any visually matching duplicate, ignored stale IDs / feedback bursts, genuine wrong / timeout outcomes, each-five frozen choices, prospective dirty multiplier versus actual cleanup, deadline-aware points,1000 legal choices with bounded12 buttons /30 pieces, exact copied state and retry reset.

A pre-browser source finding showed the initial280px packing used three columns /340px height rather than the intended four columns /260px. Gameplay corrected mobile padding / final-gap allowance before freeze. Strengthened independent bounds checks at widths92 /220 /280 /300 /320 /390 /548 /600 /1024 /1440 /1920 retain64×72 or80×96 native targets, pair gaps≥2px, containment, height≤260px at280–390 and≤180px at548. No native / visual / human009 PASS is inferred from this unit checkpoint.


## Game006 actual first findings / repair hold

Initial exclusive short browser command `npx playwright test --config tests/ten-game/game006.playwright.config.ts --grep-invert 'ten actual target-gauge' --output artifacts/ten-game006-short` executes2 PASS /2 FAIL /2 project duplicate skips in1.3m. Desktop and landscape native / full paused layouts / cached-pagehide / mute cases pass. Actual three-death zero result extends to331.421875px in568×320: a genuine compact-result finding, with original failed image / trace retained. Portrait simultaneous CDP touch remained in angle; trace shows the model was already alive (not startup). A narrow actual DOM pointer-event diagnosis remains pending; no runtime input bug is asserted without that proof.

Independent reviewer also found close-correct steering with low power on a third angled bay mislabeled as wrong angle, because chosen travel distance affects final heading. A new mirrored left/right public-input unit earned two Perfect parks then locked target±0.573° /power≈.00265; it first reproduced the failure in50ms. Gameplay's reason-only branch repair leaves physics / outcomes / score untouched. All8 model tests subsequently pass (2.794s tests /3.10s runner), preserving existing short / long power, wrong-angle, neighbor-contact, seven templates, OBB, prospective mode and bounds assertions. UI coordinates a result-only short-landscape padding / gap repair without shrinking fonts or44px actions. All browsers close for root final ten-route font / build and candidate repair copy; the long ten-park QA route has not started.


## All-ten source checkpoint after closed006 repair window

Main Agent executed the combined static ten-route build successfully and full114 /114 unit tests across15 files in5.80s. Distinct count: original63 +Workday7 +Tower4 +localization3 +Parking8 +Elevator7 +Coffee8 +Stamp7 +Meeting7. Overlapping targeted runs are not counted twice. Main Agent also reports protected24 /art31 new +25 retained /distribution references and10route checks PASS. These source / unit gates do not imply native PASS for new routes.

Final Japanese font is148684B /954 glyphs. Repaired006 snapshot receives that font plus only authorized ParkingRun reason and short-landscape result CSS changes. The independent reviewer has the first repaired native reason slot; QA will then retarget the two original failed cases before the long10-parking run. Immutable010 candidate uses port5180. No heavy CPU or other browser contexts overlap the precision006 gate.


## Decisive006 portrait pointer finding

The separate readonly native-pointer probe identifies a genuine playing-UI obstruction: a primarybutton0/no-modifier touch aimed inside the board targets transparent ASIDE #overlay, outside#stage. Hiding .play-ticket leaves the absolute ticket-panel over the field. [Original event proof](GAME006_NATIVE_POINTER_INITIAL_PROOF.json) preserves actual events / live phase / working ordinary action-button fallback. The initial portrait failure is therefore a genuine P1 presentation input obstruction, not startup or absent-primary CDP behavior. Its prior fallback test pass establishes button/lifecycle behavior only, not advertised board taps.

All contexts close for root/UI narrow playing-only pointer-events repair; input handlers / physics remain unchanged. The retargeted original portrait case requires delivered primary touches to reach#stage and proves a separate native stage touch if the browser supplies no primary. A reviewer phase-only stage recheck follows QA closure before the long ten-park test. The low-power reason and568result repairs remain valid; no broad repeat is planned.


## Repaired006 targeted actual closures

Desktop three natural failures / actual3→0 / all-eight result bounds / guarded Stub3 / exact events now passes32.8s (33.8s runner). Portable [death/refill proof](GAME006_ACTUAL_DEATHS_PROOF.json) and earned568×320 image show card bottom319.796875,44px controls and no errors. Initial repaired rerun's900ms pending-DOM race is retained separately; atomic pending capture retains checks. Computed display / visibility checks are now included; the narrow persisted-zero pending fixture also executes those checks, clearly distinct from earned depletion.

Strict repaired portrait retarget passes20.7s (21.7s runner). [Final pointer proof](GAME006_NATIVE_POINTER_PROOF.json) shows actual primary and secondary touch targetsCANVAS inside#stage, first angle→power and secondary ignored with lockedPower=null. This now replaces the earlier button-fallback partial evidence as the actual advertised board-tap gate. Independent reviewer owns a short actual stage-input→parking recheck after all QA contexts close, then QA will execute the remaining fifth / ten-park native case.


## Game006 long native prefix and final choice-layout repair

Actual native Space route earns10 /1700points in100.65047active seconds, reaches and freezes the genuine forbidden offer, previews50×82, and passes the first six sizes. At844×390 the milestone card bottom410.53125 extends below390;568×320 remains untested in that failed run. [Portable initial-ten prefix](GAME006_INITIAL_TEN_OFFER_PROOF.json) retains actual trace data, marked incomplete / not PASS. All contexts close for the root/UI milestone-only landscape fit repair; future forbidden award and all existing assertions remain mandatory in the same actual rerun. No repeated full12-park independent review or passed short-case rerun is required.

## Game006 final combined coverage gate

Candidate coverage closes with **8 pure tests /5 distinct native Playwright cases PASS**, plus an explicitly separate accepted long-branch composite. The retained actual route earns10 Perfects /3500, accepts the frozen forbidden choice after all8 earned-offer checks, then earns the11th Perfect /4300: **+800=200×streak2×mode2**. It naturally fails /charges once, preserves BEST4300/CREDIT2 and logs each milestone /offer /accept /end /duration /credit event once. [Portable actual proof](GAME006_ACTUAL_FORBIDDEN_AWARD_PROOF.json) also links the independent real12-parking forbidden→normal retry bridge; this is attributed to that reviewer run, not the QA eleven-parking run.

The retained long executions remain FAIL at historical presentation checks (first shortland offer, later worst-result overflow). Independent image review subsequently identifies semantic4300 wrapping in the render-only retarget. A separate late-native-gauge harness failure is retained; public observed readiness-to-lock time compensation resolves it without model /control /score writes or widening full-car constraints.

The final exact4300 /forbidden /NEW BEST /CREDIT2 **render-only** check passes8 semantic layouts: one score line fitting its column, contained caption, no metrics overlap, all content /44px actions /viewport bounds, unchanged idle model /events. Card bottoms844×390382.4375 /568×320315.0. Fresh real parking→NEW BEST→natural death→all8 results→native retry passes39.5s test /40.5s runner with errors[]. These proofs close coverage without another ten-parking repeat after CSS-only changes; a never-run original-full-test PASS is not claimed. [Game006 final report](GAME006_QA.md) explains findings /commands /limitations. Final production passes below; human playtests remain pending.

## Game007 final actual native gate

Independent Feel PASS /Visual85 precedes the final native rerun. Root/UI's CSS-only repairs preserve26 /23px party weights /complete kg units, adapt desktop cab height /full roster, and reclaim landscape footer spacing while preserving every44px control /hint. Initial3 genuine layout failures remain retained. Repaired full runner:4 PASS /2 mobile burst-harness FAIL /6 project duplicate skips in2.2m. Locator taps had auto-waited for disabled controls to re-enable each later floor, legitimately accepting later passengers rather than testing current-dispatch bursts. The two affected cases alone retarget immediate native touchscreen taps at cached coordinates: **2 PASS in19.1s**. No runtime input /queue change. Final **6 distinct native cases pass**.

Actual public decisions reach20F at46.3231real seconds /score19 /load210, freeze all state /offers across8 layouts, choose fast with existing score preserved, and deliver cargo at25F /score614. Prospective1.5× delivery /occupied-floor points are checked from actual manifests. Natural29F overload455 /450kg ends with score1027, one terminal /credit charge /milestone /offer /accept, followed by actual normal retry. [Portable milestone /events /layouts](GAME007_ACTUAL_20F_FAST_PROOF.json) has errors[]. The other native cases prove real NEXT identity /unload-before-boarding, primary /secondary and held-approval guards, cached-pagehide /pause /mute, three true635kg overloads→0→one900ms Stub3, best reload /namespace isolation.

`node tests/ten-game/probe-native-zero-menus.mjs game007` additionally passes **8 persisted-zero title /atomic pending /native Stub fixtures** with all content /44px actions visible, disabled pending navigation /requests, model clocks /scores idle and no run_start /run_end /credit_used side effects. [Fixture-only menu proof](GAME007_ZERO_MENU_LAYOUTS.json) never claims earned depletion. All contexts close before Game008 independent review. Final production passes below; human playtests remain pending.

### Game008 precision repair — new full-model checkpoint

A genuinely earned1000m /two-cup offer displayed1249 instead of1250. The added public-input variable-frame test reproduced1250 /1249 /1249 across three legal frame schedules. Main Agent authorized exact piecewise distance anchors, preserving physics /clock /RNG /input /events. Final Coffee9 /9 passes818ms /1.08s and full root `npm test` passes115 /115 in15 files /6.00s (2026-10-04 UTC). Earlier114 and eight-test Coffee checkpoints remain historical, not rewritten. Final17-file Coffee snapshot is byte-exact; fresh actual1000 /1250 /future2× /retry and remaining touch cases are pending.

### Game008 final actual gate

Final development gate closes **5 distinct native PASS /16 geometry-only result matrices /8 persisted-zero title-pending fixtures**, with9 targeted models /root full115 and17 snapshot files byte-exact. Actual500m /47.656s /500 points and1000m /91.164s /1250 points unlock three cups with old liquids preserved; natural third-cup end1172m /1594 /105.506s consumes one CREDIT and identifies actual会長0% /empty styling while other cups remain7% /5%. Three separate genuine deaths /one Stub /BEST reload /storage isolation, native primary touch /held keyboard /release /cached pagehide /mute and eight layouts pass.

Portable evidence: [actual500/1000](GAME008_ACTUAL_500_1000_PROOF.json), [actual depletion/refill](GAME008_ACTUAL_EMPTY_REFILL_PROOF.json), [16 receipt/header DOM matrices](GAME008_REPAIRED_ZERO_LAYOUT_FIXTURE.json) and [8 persisted-zero menus](GAME008_ZERO_MENU_LAYOUTS.json). Result/header fixtures retain an idle canvas and do not establish new earned scores or liquid outcomes. Storage-zero fixtures do not establish earned depletion; three-death proof is separate.

Genuine historical failures remain: compact TITLE target43px, short-land result/caption/footer overflow, varied-frame1000score1249 and zero-title342.891px; diagnostic fixture failures /null-selector automation mistakes remain distinctly attributed in [Game008 QA](GAME008_QA.md). Final independent Feel /Visual83 (F13/H12) /menu images pass; all contexts close before Game009 review. Final production passes below; human playtests remain pending.

### Game009 actual native and menu gate

[Game009 QA](GAME009_QA.md) records **7 pure /6 distinct native PASS /8 persisted-zero title and atomic pending fixtures PASS**. The original native execution was5P/1F/6 duplicate skips in1.0m; its45-correct run failed only when ResizeObserver replaced a target between locator resolution and boundingBox. Read-only atomic ID/DOM measurement retains all target visibility, size, containment and pair-nonoverlap assertions; only the failed route reran, PASS28.4s /29.4s runner. [Portable actual proof](GAME009_ACTUAL_CLEAN_DIRTY_PROOF.json) records nine earned choices / SCORE13318 / actual dirty×3→clean×1 / duplicate matching / natural wrong / one end and retry, errors[]. Eight actual choices and eight high-clutter layouts fit; PC and844land targets80×96, portrait and568land64×72. All-eight header checks confirm audio≥44px and brand/CREDIT/audio separation. Three real wrong/deadline/wrong endings→CREDIT0 and guarded900ms Stub3, best/mute/isolation/pagehide/primary-touch guards pass.

Supplemental menu collector initially used absent `.game-title` rather than actual `.start-note h2` (eight harness failures preserved). Corrected probes found portrait reward Stub genuinely display:none at390/320 (six PASS/two FAIL). A CSS-only portrait reward-Stub override was copied while all contexts closed; final same8 PASS / no idle model or run side effects. [Final storage-zero fixture records](GAME009_ZERO_MENU_LAYOUTS.json) and initial diagnoses are portable; these are menu fixtures, not earned deaths. Independent final repaired pending images and eight atomic fixture records were assessed PASS, closing FeelPASS /Visual85 (F14/H13). Source27/27 exact; production passes below, humanA–N pending.

### Game010 actual native and menu gate

[Game010 QA](GAME010_QA.md) records **7 pure /5 distinct native PASS /8 persisted-zero title and atomic pending fixtures PASS**. Native suite:5PASS /4 duplicate project skips in2.9m; no native QA failure. Two ordinary attention policies each earn60real /300virtual seconds /SCORE478: first safe_exit banks without CREDIT, second board startsLISTEN while preserving calendar / earned score and prospective20points per real work second. Exact measured work delta6.332 /0.3166s passes; later genuine question ends at65.959687s /SCORE588 /onecredit. [Portable branch proof](GAME010_ACTUAL_OVERTIME_BRANCHES_PROOF.json) and [three genuine8s deaths](GAME010_ACTUAL_QUESTION_DEATHS_PROOF.json) distinguish actual input delay (79points each) from ideal immediate80 model score. Real3→0→guardedStub3, best/isolation/mute/pagehide/primarytouch /heldinput /eightpause+header+choice+result layouts /all nav44 /noerrors pass.

Supplemental collector originally passed7/8 but found568TITLEbottom357.28125; source CSS-only compactTITLE ledger/padding repair preserves models/fonts/rules/BEST/Stub/action44. Same8retargetPASS, final568TITLEbottom303.28125 /pending271.78125. [Final storage fixtures](GAME010_ZERO_MENU_LAYOUTS.json) have idle model / no run sideeffects and actual guarded reward events once. Initial finding/image retained; these menus do not claim earned depletion. Independent final saved-image closure confirms FeelPASS /Visual83 F14/H13. Final candidate22/22byteexact.

Total distinct actual development coverage is **90**:63 existing-game cases plus5+6+5+6+5 new-game native cases. Game006 accepted long-domain/render/reset composite remains separately labelled; no failed whole long run is reclassified as a native PASS. Supplemental DOM/storage fixtures and repeated corrective executions are excluded from this90-case total. Full115unit checkpoint remains valid; final all-ten production /fresh unique resource load audit passes below.

## Final all-ten production and resource gate

Root's final frozen strict-TypeScript / ten-entry Vite build passes71 modules /5.25s. Full model/unit checkpoint remains **115/115 /15 files /6.00s**, after Coffee's precision fix; subsequent repairs were CSS only. Root's final protected24-file audit passes23 byte-exact plus one authorized EventName-only type-union extension; source-font inventory148,684B /954 glyphs has no missing Japanese glyph. Root's art/dist/reference/ten-route audit passes old25 /new31 WebP assets (new489,854B), errors[].

Executed sequentially after every reviewer and QA candidate context closed:

```sh
npm run test:production
npm run preview -- --port 4173 --strictPort
node tests/ten-game/probe-production-first-load.mjs
```

Functional production **10/10 PASS in1.7m**, using ordinary inputs and static entries. Fresh first-load audit **10/10 PASS at09:23:26Z**, ten new isolated contexts, no developer hooks, errors[], HTTP status200. [Portable full response/timing evidence](PRODUCTION_FIRST_LOAD_AUDIT.json) preserves unique actual script/image/font URLs, encoded/decoded/transfer sizes and engine-body detection. Script budgets are unchanged: Phaser001/002/003/006≤2,000,000B decoded/body; native004/005/007/008/009/010≤300,000B decoded/body and no actual Phaser engine. Functional tests also retain their existing reload-inclusive script ceilings.

| Route | JS encoded B | JS decoded/body B | HTTP images count / B | Local font B |
|---|---:|---:|---:|---:|
| index.html | 343,404 | 1,237,133 | 0 / 0 | 0 |
| game002.html | 346,183 | 1,245,921 | 17 / 294,484 | 148,684 |
| game003.html | 345,589 | 1,243,512 | 6 / 57,098 | 148,684 |
| game004.html | 7,928 | 20,758 | 0 / 0 | 148,684 |
| game005.html | 12,353 | 34,056 | 2 / 54,490 | 148,684 |
| game006.html | 345,578 | 1,243,405 | 3 / 52,134 | 148,684 |
| game007.html | 11,478 | 31,048 | 1 / 10,526 | 148,684 |
| game008.html | 12,464 | 32,389 | 1 / 67,398 | 148,684 |
| game009.html | 10,328 | 27,146 | 7 / 105,962 | 148,684 |
| game010.html | 11,020 | 29,579 | 6 / 92,040 | 148,684 |

All image encoded and decoded HTTP body totals agree with the table; font encoded and decoded totals agree. HTTP decoded body is the transferred resource content, not expanded pixel/GPU memory. The initial audit followed Phaser's blob image decode responses, so its image network timings were0 despite nonzero image bodies. [Initial classification records](PRODUCTION_INITIAL_RESOURCE_CLASSIFICATION_FINDING.json) remain historical; the corrected probe recognizes real HTTP image MIME responses carried over XHR and excludes local blob duplicates. Script/font/budget/hooks assertions were unchanged; only the resource probe was rerun. No functional or model rerun was needed.

Resources are measured at first-title startup; future lazy sprite variants are not inferred loaded. Actual gameplay, named empty-cup0% rendering, full-car containment and milestone branches have their separate native/model evidence above. All probe contexts and QA-owned preview4173 are closed. Human A–N for Game002–010, enjoyment, physical-phone FPS and public-release acceptance remain pending. The retained Game006 whole-long-run failures stay FAIL; its accepted domain/render/reset composite is labelled separately rather than included as an extra native pass.
