# Game032 independent technical QA

Reviewer: `fishing_independent_qa`, separate from implementation. The reviewer did not read Jev answers or use Jev to determine pass/fail. Source, requirements, boundary simulation and actual browser automation are separate evidence; human fun, physical touch, hearing and sustained-device heat are not evaluated here.

## Independent model and persistence boundary checks

Command: `npx vitest run --config tests/game032/independent.vitest.config.ts`

Result: **12 tests passed**, independent of the author's model suite. Source HEAD/hashes and test receipt: [QA/INDEPENDENT_MODEL_RECEIPT.json](QA/INDEPENDENT_MODEL_RECEIPT.json).

- Each of the seven fish can be landed with release during pull / reel during calm. Always reeling loses the line for each species, and never reeling does not earn a free catch. These are deterministic synthetic policies, not a novice success-rate or fun claim.
- The same deterministic catch completed two frames before expiry is scored, while two frames after expiry is omitted. No duplicate terminal event or catch is emitted.
- Pause in idle, charge, cast, waiting, nibble, bite and fight freezes the active clock and score. An unfinished charge is canceled; stale releases do not launch it after resume.
- Repeated releases after a canceled or already released charge cannot duplicate the cast.
- Practice and partial standard catches do not write BEST. A completed standard outing writes the score and survives a new store instance. Denied writes retain only page memory; reload persistence is not claimed.

## Source observations delivered before diagnosis or patch

The first source read found two display predicates in the original candidate; these were sent to the main agent before making an independent conclusion or altering product code:

1. The latest-fish DOM updated only when fish ID changed, so a second catch of the same species with a different size/score skipped that update branch.
2. Formatting `floor(remaining / 60)` with `ceil(remaining % 60)` gave `4:60` at 299.98 seconds.

These are source observations. They were not described as browser-observed until actually reproduced. Product patches belong to the main implementation agent. The pure minute/second predicate is a mechanical check, distinct from the latest-catch semantic finding.

## Browser scope

Reproducible script: [../../tests/game032/browser.mjs](../../tests/game032/browser.mjs), with required unique `GAME032_QA_OUT` and `GAME032_QA_URL`. It blocks every POST, records source hashes, preserves failure screenshot/state before stopping, and closes browser contexts.

Prepared checks cover 1280×900, 390×844, 320×740 and 844×390; optional practice, fresh cast input, keyboard hook, CDP touch charge/reel on phone equivalents, explicit synthetic pointer cancellation, pause/stale-key release, catch, practice exclusion, targets/overflow and Portal return. PC additionally runs the five-minute active clock with Playwright virtual time, completes one ordinary catch, checks exact BEST, retry and reload. Virtual time is synthetic technical evidence, not five real minutes of human play.

Fixed candidate02 browser execution: **93/93 checks passed**, four viewports, page errors 0, POST attempts 0. The browser closed after completion, and all recorded runtime/input source hashes still matched. Receipt: [QA/candidate-02/browser-independent-01/REPORT.json](QA/candidate-02/browser-independent-01/REPORT.json).

The PC standard outing completed one ordinary catch, reached its result after 300 virtual active seconds, persisted that score, restarted at zero and retained BEST on reload. The three phone-equivalent widths used CDP touch for actual browser pointer charge/reel input and keyboard Enter for the hook; this does not simulate a physical thumb or claim an all-touch human run. Optional practice landed a catch without writing BEST, and its score did not carry into standard play. The separate scripted-RNG regression caught the same species twice: journal **オイカワ 9.0 cm / +38 points → 15.2 cm / +93 points**. This proves the updated display predicate with synthetic fish draws, not ordinary catch odds.

Representative screenshots: `pc/phone/small/landscape-{title,practice,play,bite,fight,land}.png`, `pc-result.png`, and `same-species-fixture-catch-{1,2}.png` in that immutable receipt directory. No video was recorded. The fixed near-cast PC float visibly sits on shallow water instead of the previously observed partly shore-blended position.

The earlier observations are retained rather than overwritten:

- `candidate-01/browser-independent-01`: 3/4 checks before a stale rendered-frame assertion on resume. Failure-state after screenshot already showed idle. The runner subsequently waited one frame; product input code was unchanged.
- `candidate-01/browser-independent-02`: 20/20 completed checks before an overly strict first-standard-cast bite expectation timed out. The historical failed-phase reason was not captured and is **unknown**. The runner now retains visible no-catch outcomes and makes bounded fresh casts rather than demanding a guaranteed bite.
- `candidate-01/browser-independent-03`: parent-requested interruption during the virtual standard clock after 22 successful checks. `INTERRUPTED.json` distinguishes the resulting target-closed error from a gameplay failure; no complete-run pass is claimed.

## Focused candidate03b supplement

[QA/candidate-03/browser-supplement-01/REPORT.json](QA/candidate-03/browser-supplement-01/REPORT.json): **33/33 checks**, errors 0 / POST attempts 0. All four viewports have the river shell equal to the actual canvas height and the entire action/left/right/pause targets inside the initial viewport. At 844×390 the canvas/shell are 170px high; main actions end at 350.95px and pause ends at 44.95px. PC continuous ArrowRight traverses all four points; mobile CDP touch moves right then left and completes **CAST → touch HOOK → touch REEL → landed without a keyboard hook**. Practice still writes no BEST.

All four help/pause/result images are retained. The result images come from one genuine zero-catch standard model after 300 virtual active seconds, resized across the four viewports, explicitly a technical layout fixture. Their original checks establish display/existence, not that every lower result control is reachable after scrolling. `actual-canvas.png` is a direct actual canvas capture suitable for thumbnail sourcing.

The follow-up [dialog reachability probe](QA/candidate-03/dialog-reachability-01/REPORT.json) preserved a real PC help issue: after scrolling the dialog to maximum, duplicate `menu-portal` ended at 922.28px in a 900px viewport and its center hit no element. Actual Practice click/tap succeeded at all four widths; all lower targets' centers worked on phone/320/landscape. The common header return is a separate safe route; this finding does not establish that the whole game or all return navigation is blocked. Main performed the desktop dialog-size correction.

### Final fixed-candidate coverage

The [release-candidate recheck](QA/release-candidate/dialog-reachability-01/REPORT.json) succeeded at all four widths. All four lower help targets were inside the viewport with the correct center hit; normal Practice click/tap entered practice, and normal lower-menu Portal click/tap actually reached the Portal. At 1280×900 the corrected duplicate Portal link now ends at **774.28px**, versus the preserved original922.28px. Errors and POST attempts were zero; the browser closed after the run. After screenshots are in the same immutable directory.

Reproduction: `GAME032_QA_URL=http://127.0.0.1:4432 GAME032_QA_RETURN=1 GAME032_QA_OUT=<new-directory> node tests/game032/dialog-reachability.mjs` after building/serving the recorded candidate. Release source/build is pinned by [QA/release-candidate/SOURCE.json](QA/release-candidate/SOURCE.json).

This targeted recheck covers the new desktop modal budget. The two final `run_end` payloads' explicit `mode: standard` and actual-canvas thumbnail are final source/integration changes checked by the main agent; this reviewer did not claim a new complete300-second outing or all93 browser checks against that final build. Gameplay/model/save/controller beyond the named payload remained the previously tested implementations.

## Real-clock motion capture

[QA/candidate-03/motion-02/REPORT.json](QA/candidate-03/motion-02/REPORT.json) records 9.056 real seconds of automated ordinary movement/cast/hook/reel input, without a virtual clock or forced fish draws. The recorded phase timeline includes casting, waiting, nibble, bite, fight and a reel-down gesture. Errors and POST attempts were zero. Raw10.76s video is retained; [movement-cast-reel-9s.webm](QA/candidate-03/motion-02/movement-cast-reel-9s.webm) contains its actual final9 seconds. [VIDEO_RECEIPT](QA/candidate-03/motion-02/VIDEO_RECEIPT.json) pins hashes/source and the trim method. No frames or audio were invented. This is recorded motion evidence, not a human feeling or hearing verdict.

The first recorder attempt is preserved in `motion-01/REPORT.json`: Playwright's cache FFmpeg executable was absent. The system FFmpeg was already installed; a dependency-cache symlink enabled the second attempt without adding a package or modifying repository/runtime code.

Independent finding judgments before Jev comparison are in [QA/independent-judgments/](QA/independent-judgments/). Human subjective enjoyment, physical iPhone/Android handling, hearing, device heat, and production receiving/sharing are not verified by this local browser run. No production data, raw player identifiers, source gameplay changes or new secrets are part of this independent review.
