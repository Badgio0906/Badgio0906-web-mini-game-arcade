# Independent source review — Game023

Reviewer: Game022 author reviewing Game023, independent of its implementation. Source review only; no browser, actual-image, human-play or legal-clearance verdict. Reviewed the isolated author source at base `af2edf70cdf8fe46175f4fcf38fec607dda997d0`. Read no Jev logs, answers or earlier product findings. During the initial review product files were not changed; the later root-authorized revision is described below. No commit/push was made.

**No actionable source defect observed in this review.** The author's 27 tests pass and TypeScript passes. Five separately written reviewer tests also pass; they exercise every one of the 180 words through final-distinct-letter hint completion and eighth-new-miss completion, duplicate/no-op input and semantic restoration, plus 1000 question transitions and atomic persisted report/UUID handling.

The dataset contains 180 unique IDs and readings, six categories with 30 each, NFC hiragana/long-mark readings of 3–8 code points and complete keyboard coverage. 清音, voiced/semi-voiced, small kana and long-mark sets are fixed across all questions. Manual content inspection found ordinary vocabulary and independently phrased short clues; this is not exhaustive external originality/trademark verification.

Matching guesses expose every occurrence and do not spend a chance. A duplicate hit/miss is unchanged, only new wrong kana spend a chance, the eighth miss terminates, and terminal input/hints do nothing. Hints are free, once per question, expose all copies of the chosen letter and correctly finish the last hidden letter. Recent history filters invalid IDs, prevents immediate repeats and safely resets at exhaustion. The question and hint seed persist.

Save validation rejects wrong game/version, incomplete/wrong history, invalid UUID, duplicate/tampered guessed data and inconsistent completed/report state. The ongoing saved question resumes its existing shared UUID via `restoreRun` without `run_start`; `pagehide` persists without `run_end`. Finished restoration takes the result branch and `markReported` prevents another report. No visible BEST/stat totals are introduced, so once-only reporting rather than a scoreboard is the deduplication boundary. One JSON write stores the report flag and bounded ledger. Denied writes use protected page memory.

Practice uses two actual known words (`おにぎり`, `きゃべつ`) and real model guesses/hints, including voiced/small kana. It does not replace a production question snapshot or emit production practice/RUN events. Explicitly entering practice from an active production question abandons that question once; starting production from practice chooses a new seeded question.

Nonmodal dialogs keep shared consent reachable by source structure. The fixed keyboard uses native buttons, arrow navigation, used-key shapes, capture-phase transition epoch guards and repeat-key rejection. Actual tap, long press, keyboard focus, screen geometry, consent overlay hit testing, reload and Portal behaviour still require browser verification. Source inspection is not evidence of their full behaviour.

Commands executed against the author checkout:

```sh
npm test -- --run tests/unit/game023-model.test.ts tests/unit/game023-persistence.test.ts
npm run check
```

Reviewer test (explicit config required because the repository default includes only `tests/unit`):

```sh
GAME023_SOURCE=/workspace/classic-author-023/src/games/game023 ./node_modules/.bin/vitest run --config docs/game023/QA/independent/vitest.config.mjs
```

After ordered integration, omit GAME023_SOURCE to check the canonical `src/games/game023` tree. The first invocation without the explicit config discovered no tests; this was a known include-pattern mismatch, recorded separately from the passing execution and not attributed to the product.

Evidence: SOURCE_HASHES.json, model-tests.txt, model-tests-final.txt and source-review.test.ts. Actual browser/Visual/Feel judgment is pending the shared browser handoff.

Initial compiled browser runs verified the full workflow on desktop and 390px, but the 320px practice loop remained in practice at its expected result check. The original failure is preserved; one four-question Shadow request was recorded with answers hidden before targeted investigation. Four later isolated 320px native practice replays (two without extra per-key waits, two with 200ms cadence) all completed both words. This limits the first observation: it has not yet been reproduced or classified as a product defect. Exact-workflow instrumentation and the remaining 320px/landscape collector pass are pending browser handback. No product edits or speculative fixes were made.

## Root-authorized revision after actual event evidence

The full earlier-result→title→practice path reproduced a missing `り`. Passive native event capture showed a `detail=2` click on the previously unguessed key after the collector mixed a mouse tab click with a touch key tap and moved its scroll position. The product globally rejected every `detail>1` click. Consistent touchscreen input completed the exact workflow. The initial reviewer interpretation was a hybrid-driver condition; root independently identified that hybrid mouse/touch is itself a supported device workflow and the global filter therefore blocks a legitimate DIFFERENT action. Both interpretations and their chronology are archived in HYBRID_INTERPRETATIONS.json; the initial conclusion is not silently replaced.

Root authorized a minimal product revision in the author checkout: remove the blanket `event.detail > 1` condition only. Pointer epoch, 180ms transition guard, native detail>0 validation and repeat-key guard remain. The pure model already rejects duplicate guesses without chance/selection changes. Main SHA changed from `0365a8e1078be6d4ef50bf8d5c3ba20311a5695559000cb286966f772942f3ce` to `e33a35bd39e78b64cf1866692899dff8411462fa3cb0105ed1514354df2b57c7`. Author27 tests, typecheck and separate compiled revision build passed. Native mixed-input, same-key double-click and held-pointer phase-transition regression are prepared and awaiting the sequential browser handoff. No physical human touch behaviour is claimed.


Final disposition: actual mixed-input regression passed after the click repair. A separate actual844×390 image finding established initially clipped result answer/heading; root authorized the menu heading-focus/scroll reset repair. Both findings have preserved contemporaneous Shadow requests with answers unread, retained before evidence, final judgments and source diffs. Final27 unit/typecheck/build and all four native browser workflows pass. See OPERATIONS.md, VISUAL_FINAL.json and FINAL_SOURCE_FREEZE.json for final evidence, authorship limits and remaining human/integrated-public work. Initial source-only and TEST_INFRA interpretations above remain dated history, not final claims.
