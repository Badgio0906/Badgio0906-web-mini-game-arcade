# Game014 — independent native-record source review

Reviewer `legacy_source_audit`, 2026-10-09T02:26:48Z–02:27:17Z (11:26–11:27 JST). Arcade baseline488916c; original clean source HEAD `36877d55bb44a41087a61bfd38f3ec395040cb3c`. No Jev log / response was read, no API or browser was used, and no implementation was changed. This is source review plus inspection of another agent’s executed native-test receipts, not independent execution of those tests.

## Reviewed inputs and record authority

Actual reviewed files: `tools/legacy-record-patches/game014/main.gd.patch`, shared `CurrentRecordSave.gd` / `RecordBridge.gd`, new014 native tests, `native014/export01/{export-metadata,resource-audit}.json`, original / new native test logs and the pinned014 `scripts/main.gd` previously cited in [SOURCE_AUDIT_013_014](../SOURCE_AUDIT_013_014.md).

The original game has **no persistent BEST ConfigFile / save code** in the pinned source. There is no014 historical mixed-mode saved BEST to import or promote. Its `score` already represents total successful HEART stops,0–25, and `_finish(cleared)` is the authoritative terminal event. Five successes per stage ×5 stages yields25; reaching stages is a less precise derivative. There is no invented total-point formula or time tie-break.

## Source conclusions

- Initial native `_ready` retains immediate start, assets / randomization / UI / original timers; `_record_start` follows original timer start. Reset starts a new record RUN after original reset / resume. It never invents a finalized result for the abandoned prior RUN.
- Only `_finish` calls `_record_finish`, after original final UI setup. Normal per-success `JUDGING` / `_resume` events do not finalize. `record_finished` prevents repeated finish from re-saving / notifying; reset clears it and mints a fresh RUN.
- Original HEART check / `score+=1`, nonheart immediate failure, clear at25, stage calculation and0.65 /0.55 /0.45 /0.35 /0.25 intervals remain outside the patch. Original0.8-second result delay, characters, approved poses, input handling, retry and end copy remain unchanged.
- New native authority is a small separate `user://game100_records_v1.cfg`, schema1, section `game014.normal.r1` / best0–25 / updated_at. It is not the original in-memory game score or browser mirror masquerading as a game save. No pre-existing014 game save is replaced.
- Shared ConfigFile helper loads existing whole file, retains other sections and updates only the requested key; Game013 normal/OJT and Game014 normal section names are distinct. A write-on-pending / rename failure returns error and preserves prior normal file. Max comparison keeps higher native BEST and persists genuine0 distinctly from missing−1. Corrupt schema / wrong type / out-of-range values return error without rewriting a corrupt save.
- Saved-record snapshot is a current_best message, not a new finalized RUN. It cannot automatically share historical data. Final result is saved before optional bridge finish; save error is reported but original final screen / game still proceeds. Parent atomic mirror is separate and must be tested in the actual browser.
- Native debug `--script` / `-s`, `--verify`, `--capture=` are excluded. Native014 has no practice mode: existing surrounding practice is a separate shell and does not load the native game or save its BEST. `qa=1` read-only `__fingerHeart` observations do not become a formal result API. Technical QA must use isolated contexts and keep automated candidates out of production sharing.
- Missing JavaScript bridge outside web / unavailable interface yields empty id / no notification; the native ConfigFile feature still works and the original game remains usable. This does not claim all possible browser-storage / WebAssembly failures are handled.

No new concrete source finding arose in this scoped review. Source acceptance does not establish PC / touch runtime, flush/reload, postMessage validation, actual art / sound, original save rejection or publication.

## Existing execution and export evidence read

- Original native log: **12156 checks /0 failures**. A large portion tests random pose generation; this count is not12156 human trials or browser interactions.
- New native log: **68 checks /0 failures**. Synthetic fake-endpoint tests cover0 /25 / lower score / repeated finish / intermediate success / reset / debug exclusion / corrupt-schema retention. This is not a genuine player clear or actualWeb JavaScriptBridge execution.
- Export receipt reports exact compiler `4.5.1.stable.official.f62fdbde1`, matching pin, complete regular isolated source export, original source not written, public output not written and no PCK resource transplantation.
- Resource audit38→42 entries, no removals: two helper scripts + remaps added; changed main.gdc / UID cache / icon import only. JS, WASM and both audio worklets identical. Icon differs in3 of16384 pixels, RGB±1 maximum, alpha identical; no source SVG edit. This is bounded rasterizer drift, not proof of whole-game Visual equivalence.
- `all_stage_json_exact=true` is not evidence of014 stage correctness:014 intervals / scoring are hardcoded in its source, not external stage JSON. The unchanged constants and scoring control flow support preservation here.
- Independently checked original014 `git status --porcelain`: empty at review completion.

## Source snapshot, SHA256 at2026-10-09T02:27:17Z

```text
tools/legacy-record-patches/game014/main.gd.patch b112e78396347ff3ba4d6804e3fee1ca1bc55abfaa930a275d6c2c570f9085c6
tools/legacy-record-patches/CurrentRecordSave.gd d2376fc6d456000ae5d3ff8eae4947edb0200c4b79a04691cde011cbe9aacd2c
tools/legacy-record-patches/RecordBridge.gd 5d66c1c17c5a2105372f2a34470e89865fd3f92b2d257b15df1421f78b0f956a
tools/legacy-record-patches/game014/tests/test_current_records.gd 1c341729a3de460e6c58f0777f5e5185cc4a608debd6a2ae8c3f04b8cff964f4
```

Next gate requires root’s normal PC / phone interaction and source-frozen actual images, persistence / Portal agreement,0-result distinction, reset clearing, shared controls disabled/preparing and no production POST. Human enjoyment / physical devices remain untested; no Visual score is assigned without014 screenshots.
