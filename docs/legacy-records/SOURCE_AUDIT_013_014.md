# Game013 / Game014 — independent source audit

Read-only source review by `legacy_source_audit`; completed 2026-10-09T01:41:20Z (2026-10-09 10:41 JST). Arcade baseline: `488916c2966710d34233cd212ff970c5501b1091`. No original repository, game implementation, binary, browser state, API, commit or deployment was changed in this review. This document records source observations, not a successful browser run or human playtest.

## Read provenance

The first instruction/source reads preceded the first measured clock checkpoint `2026-10-09T01:40:02Z`; exact per-file read instants were not independently captured. The continued reads and final manifest/hash inspection finished at `2026-10-09T01:41:20Z`. This time window is the reviewer’s current audit, not a claim that an earlier task read these documents.

| Repository / paths read | Revision / applicability |
|---|---|
| Arcade `AGENTS.md`, `docs/PROJECT_CONTEXT.md`, `docs/CURRENT_STATUS.md`, `docs/GAME_DEVELOPMENT_RULES.md`, `docs/JEV_REVIEW_RULES.md` | Baseline `488916c`; preserve originals, delegate independent review, finding-only Shadow flow, separate source / actual play / human evaluation |
| Arcade `docs/legacy-records/REQUEST.md` | Current user request, newly staged documentation; implement 012 first, then 013 / 014; rules / scoring / art / timing / original saves stay intact |
| Arcade `docs/records/GAME_RECORD_MATRIX.md`, `IMPLEMENTATION_REPORT.md`, `API_AND_VALIDATION.md`, `OPERATIONS.md`, `src/data/recordDefinitions.ts` | Baseline `488916c`; current local adapters unsupported for 012–014, existing public records service remains preparing |
| Arcade `docs/legacy-games/MIGRATION.md`, `tools/import_legacy_games.py`, `public/games/export-manifest.json` | Same baseline; immutable source pins and single-threaded Godot 4.5.1 exports |
| Arcade title patch files for 013 / 014 | Last changing commit `803a88423a6024923e7061fbd9436e6c4d405ede` |
| Arcade `tools/patch_legacy_start_choices.py`, `docs/start-choices/game_manager.gd.patch`, `GAME013_PACKED_RESOURCE_AUDIT.json` | Last changing commit `44f51c2540e8da8453b9c8d3813f4744f2b5f9a1`; retain authorized 013 first-play gate removal |
| `/workspace/legacy-games/tachibana-task-heaven`: `project.godot`, `export_presets.cfg`, `README.md`, `scripts/{game_manager,score_manager,rhythm_manager,stage_loader,office_view}.gd`, `data/settings.json`, `data/stage_01.json`–`stage_03.json`, `tests/test_game.gd` | Actual clean HEAD `ddc854b67c6c4efe17e0777ec7de1ce01d4f1ac0` (matches importer / manifest pin) |
| `/workspace/legacy-games/finger-heart-challenge`: `project.godot`, `export_presets.cfg`, `README.md`, `scripts/main.gd`, `tests/game_test.gd` | Actual clean HEAD `36877d55bb44a41087a61bfd38f3ec395040cb3c` (matches importer / manifest pin) |

Some initial batched tool output was truncated; gameplay / settings / patches / manifest sections were subsequently read in focused calls. Source files and tests were inspected, not executed. References below use pinned source line numbers and can be reconstructed from those commits.

## Game013 authoritative score and lifecycle

- `scripts/score_manager.gd:16–36`: PERFECT ≤90ms =100, GOOD ≤180ms =70, OK ≤280ms =40, MISS =0. Successful notes increase TASK2.5; MISS lowers it6 and resets combo. TASK starts40, clamps0–100. Clear requires TASK≥70 and misses<15 (`data/settings.json`). Combo is not a score multiplier.
- `scripts/rhythm_manager.gd:19–49`: each scheduled note resolves once; omissions automatically MISS, wrong channel consumes matching-time note, extra / distant taps MISS without consuming a distant note. Existing offset correction remains part of the rhythm engine.
- `game_manager.gd:213–235`: `begin_stage(0 or 1)` resets `scoring`; stages2 / 3 retain it. Therefore practice score cannot carry into stage1. The standard run spans three stages, including the two `between` screens.
- `:307–319` and `:351–385`: 15 misses in a standard stage finalizes failure. Finishing stage1 / 2 is intermediate, not a finalized result. Stage3 reaches `finishing`, then after1.3s `show_result(scoring.cleared())`. Only that final result / standard failure is a current score candidate.
- `:351–365`: native tutorial index0 becomes `practice_result`; it has no standard 15-miss ending. No practice result should enter current normal BEST or sharing.
- Direct JSON inspection counted stage1=26, stage2=34, stage3=54 notes, total114. Hence the existing standard theoretical score maximum is **11400 points** (114×100); this is a source-derived bound, not observed player distribution or a new score system. README independently states the same maximum.
- `:375–380`: original result updates `best_score=max(best_score,scoring.score)` and saves preferences. Failure scores are legitimate finalized scores as well as clear scores.
- `:118–135`: preserve `user://task_heaven.cfg`, `[game] tutorial`, `best`, `ojt_mode`, `[audio] offset_ms`, `volume`. Stored `[game] best` has no condition / mode / rule version; stored `ojt_mode` is the current preference, not historical provenance of that best.

### OJT semantics and observed integration hazard

OJT is a **live assistance setting**, not the practice stage. `:253–255`, `:321–330`, `office_view.gd:114–115` reveal the correct next channel from one beat before its target. It does not alter scoring windows or awards (`tests/test_game.gd:76–90` asserts these semantics).

Source-observed finding: `toggle_ojt` (`:183–187`) can be used in pause (`:396–399`), so a RUN may use OJT earlier and switch it OFF before result. The final `ojt_mode` alone cannot prove an unassisted run. This was sent to the root for its shared Shadow process before implementation; no Jev request was made by this reviewer.

Proposed minimum comparison contract, for root to finalize:

- Normal board: highest finalized standard-run score, integer points, higher is better, all three stages under existing rules, **OJT unused throughout that RUN**. Per-RUN sticky assistance state must survive stage transitions / pause; switching OFF must not restore normal eligibility.
- Tutorial: practice and no standard candidate.
- OJT-assisted standard result: preserve original gameplay and original combined `best`; label / store separately if a local OJT record is useful, or exclude it from the representative normal record. Do not infer normal provenance from old combined cfg BEST. A separate public OJT board is unnecessary for this minimal task.
- Old combined BEST: retain and optionally display as mode-unknown legacy data; never upgrade it to the current unassisted board merely because the present preference is OFF.
- `test_mode` excludes `--verify`; also examine debug `--capture` independently: `:423–430` can synthesize score12340 then call `show_result(true)`. Excluding only `test_mode` would be insufficient for a debug capture. Source diagnostic `TaskHeavenStatus` is not a formal result API.

## Game014 authoritative result and record

- `scripts/main.gd:3–8`, `:348–381`: score counts successful HEART stops exactly once. A non-HEART stop immediately finalizes failure. Successful stop adds1; exactly25 (5 successes ×5 stages) finalizes clear. Inputs while `JUDGING`, `FAILED` or `CLEARED` do not increment.
- `:383–396`: stage follows integer `score/5`, max index4. Timer intervals stay0.65 /0.55 /0.45 /0.35 /0.25 seconds; result pause0.8 seconds. Do not count per-stage display `score-stage*5` as total success count.
- `:398–412`: `_finish(cleared)` is authoritative finalization. The final screen already exposes `score` /25, or25/25 clear. Failure at zero is a real result, distinct from no record.
- `:414–427`: reset returns score0 / stage0 and initial speed, cancels pending animation / result timer. Reset during unfinished gameplay abandons it; it does not itself produce a finalized result.
- Full `main.gd` and repository-wide source search found **no ConfigFile / save / BEST persistence**. Score is in memory only in this pinned project. A small separate versioned persistent record is authorized by request §17; no existing game save needs replacement.
- `:55–86`: native game starts immediately; no native practice stage or alternate mode exists. Surrounding shared onboarding / practice should keep practice results out of the normal bridge. `browser_qa` (`:58–59`, `:311–323`) gates read-only `__fingerHeart` status and is not a formal current result / sharing API.

Recommended representative record is **total successful stops in one finalized normal RUN**, integer0–25, unit回, higher is better, rules tied to the unchanged five-stage intervals. This is the existing game’s score, not a new award. Reached stage is a derived / less precise display; score distinguishes0 through24 failures and25 clear. A public board can use the same conditions if enabled later; no time-based tie-break or invented points.

## Existing export overlays and preservation

Both pins target Godot4.5-compatible sources; existing manifest / patch compiler is exactly `4.5.1.stable.official.f62fdbde1`. Both export presets have `variant/thread_support=false`. This review did not run a compiler or prove rebuild success.

013 baseline overlays: `office_view.gdc` title strings and `project.binary` branding via title patch, then `game_manager.gdc` first-play gate removal. Effective `start_run()` directly `request_start(1)`; it must not revert to original first-time forced help. Native help, `request_start(0)` practice, tutorial flag and original preferences remain intact.

014 baseline overlay: `main.gdc` two visible title strings plus `project.binary` branding; preserve these when adding a bridge. Do not copy unpatched source titles back into rebuilt delivery.

The delivered packages matched their current manifest SHA256 at audit time:

- 013 `index.pck`: `ff66ea36f195e6a352a94084c3d8b2d51d5b61ce5dd7dfaa9a06aa2bfd2a253b`.
- 014 `index.pck`: `e4c6791c03800df3a1686d2f41f0da4bc83e83127bc867b24276936f4fe82a81`.

These hashes establish the reviewed baseline package, not that source gameplay has been live-tested. Root should regenerate into an isolated export, compare non-code resources / runtime / audio, retain original cfg namespace and save content, and record the intentional bridge-only changes.

## Not established by this audit

No PC / phone interaction, save rejection, Godot↔JS callback, postMessage validation, duplicate handling, IndexedDB flush / reload, new current record, shared record API, actual sound, actual visuals or public deployment was tested here. Human / physical device feel remains untested. 013 /014 implementation must wait until the root’s Game012 prototype passes its end-to-end QA.
