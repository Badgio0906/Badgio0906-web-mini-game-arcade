# Game013 — independent source / initial desktop-image checkpoint

Reviewer `legacy_source_audit`, 2026-10-09T02:11Z–02:13Z (11:11–11:13 JST), arcade base488916c / original source `ddc854b67c6c4efe17e0777ec7de1ce01d4f1ac0`. No Jev logs or responses were read. No API, browser operation, implementation edit or commit was performed. Root’s currently running probe is not this reviewer’s independent execution.

## Source actually reviewed

- `tools/legacy-record-patches/game013/game_manager.gd.patch`.
- Shared `tools/legacy-record-patches/CurrentRecordSave.gd` and `RecordBridge.gd`.
- Parent `src/records/LegacyGameRecords.ts`, protocol and previous source / OJT audits.
- Native synthetic tests `game013/tests/test_current_records.gd`; original pinned source line references in [SOURCE_AUDIT_013_014](../SOURCE_AUDIT_013_014.md).
- Toolchain `native013/export05/resource-audit.json`, native source receipt, root `prototype013-01/REPORT.json`, probe coordinate transform source. These logs / counts were read as other agents’ evidence, not executed here.

### Supported source behavior

1. Standard stage1 initializes a new record RUN, current OJT flag and per-RUN sticky `record_ojt_used`. Enabling OJT while `record_active` sets sticky true. Stages2 /3 do not reset it. OFF after earlier ON cannot regain normal eligibility. Original rhythm, score and preference calls stay intact.
2. `_record_finish` runs after original `show_result` save, guards active / finished / allowed, records once and marks inactive. Normal and OJT use distinct versioned sections; mode derives from sticky history. Between stages do not finalize.
3. Stage0 initializes inactive and no bridge start, so practice scores cannot become standard records. Native debug verification / `--script` and synthetic `--capture=` are excluded separately. This is original debug-only handling, not a production skip / force-clear control.
4. Original `task_heaven.cfg` remains untouched by the new helper. Original mixed-mode old BEST is reported legacy and never silently becomes normal. New `game100_records_v1.cfg` holds schema1 metadata and explicit `game013.normal.r1` / `game013.ojt.r1` section values. The helper loads the full existing ConfigFile before writing the selected section, so other sections are retained. Each app’s user-directory namespace remains Godot’s existing one; no global filesystem scraping is introduced.
5. Missing file / section gives−1 sentinel, genuine0 is saved, boolean / out-of-range record and corrupt schema reject. Failed write / rename does not report success; `.pending` write precedes replacement. Parent mirror remains a distinct atomic maximum, not original cfg modification. Actual browser flush / reload and simultaneous native tab-save behavior are not established by source review.
6. TITLE abort sets native `record_active=false`, so abandoned native game cannot synthesize a later final result. Original title / score / audio / buttons remain. However, parent control teardown has a gap below.

## Concrete findings reported before root fixes

### R013-UI-TITLE: stale outside-result controls

`show_title()` clears native activity but sends no parent message. `LegacyGameRecords` clears only for new start, frame hidden / menu unload, parent return / launch or pagehide. Therefore native final→native TITLE leaves the iframe visible and previous outside-result sharing controls mounted. Native pause→TITLE leaves a stale parent active RUN (native finalization guard still prevents false score). Source-observed integration gap; no browser reproduction was performed by this reviewer.

Independent judgment: **PRODUCT_BUG; CODEX_ACTION_REQUIRED=true; NEXT_EVIDENCE=LIVE_INTERACTION; major unresolved RELEASE_RISK=false**. This is confusing result-context teardown, not a demonstrated score corruption / gameplay lock. Verify normal-result TITLE and pause TITLE, then fresh start; do not remove legitimate retry controls or finalize an abandoned RUN. Root was notified promptly; root owns Shadow and fixes.

### R013-QA-TITLE: named after-title image is splash

Actually viewed `prototype013-02/after-desktop-title.png`: GODOT logo and loading bar, rather than native task title. The paired before image is native title. Probe waits `#status` hidden plus350ms, which does not guarantee native first-frame state. Image provenance is therefore not same-phase title comparison.

Independent judgment: **TEST_INFRA_BUG; CODEX_ACTION_REQUIRED=true; NEXT_EVIDENCE=CODE_INSPECTION; major unresolved RELEASE_RISK=false**. Do not redraw the native title or call its image missing. Retain this capture and take a new native-title capture only after actual native title state / rendered frame is ready. Root was notified before recapture.

### R013-QA-RETRY: initial coordinate misses the native retry button

Root’s `prototype013-01/REPORT.json` records real normal70 / preparing success, then25-second timeout; failure screenshot was retained. Original `show_result` creates RETRY `Rect2(376,615,302,61)`. Probe input `(620,579)` is outside it above the button. Root’s revised `(527,645)` is inside. The actual failure screenshot still shows the normal native failure screen / RETRY; it does not establish native operation failure.

Independent judgment: **TEST_INFRA_BUG; CODEX_ACTION_REQUIRED=true; NEXT_EVIDENCE=CODE_INSPECTION; major unresolved RELEASE_RISK=false**. Correct probe coordinates / assert fresh native start; preserve failure evidence. This reviewer read the source transform and actual image, but did not execute the corrected probe.

## Actual images reviewed

`view_image` opened:

- `prototype013-02/before-desktop-title.png` and `after-desktop-title.png` (invalid same-phase pair as recorded above).
- `prototype013-02/before-desktop-result.png` and `after-desktop-normal-result.png`.
- `prototype013-01/failure.png` (timeout screenshot).

Result pair retains the original crying worker, snow / mountain / sign background, failure headline and Japanese explanation, SCORE / BEST COMBO / TASK summary, native RETRY / TITLE controls. Score100 / PERFECT1 before versus70 / GOOD1 after are different ordinary RUNs, not proof of changed timing or score. Snow positions also vary over time. New preparing strip remains outside canvas; the reduced height produces slightly smaller / letterboxed native content, but native result text and buttons remain clearly readable at1300×900. Analytics / Privacy footer is visible in these images. Initial failure screenshot is consistent with that same final result screen, with sharing controls still present.

No complete013 Visual score / PASS is assigned at this checkpoint because its new-title image is a loading frame and phone / OJT images have not been viewed. The native result portion is visually consistent and legible. Actual sound / audio timing, human rhythm feel and physical devices were not tested here.

## Resource preservation boundary

Read export05 audit: JS / WASM / both worklets identical; all original stage / tutorial JSON exact; no packed resources removed; only helper additions / game_manager hook / UID-cache / icon import drift changed. Icon drift is10 of65536 pixels, RGB maximum1, alpha identical, without source SVG change. This is a bounded rasterizer/export artifact reported by the toolchain, not a new icon drawing or a broad Visual equivalence proof. Original packed image / sound preservation and normal audio operation must remain separately checked by the root.

Reviewed SHA256 snapshot at2026-10-09T02:13:37Z:

```text
tools/legacy-record-patches/game013/game_manager.gd.patch 4762e568113d71b55315a0ede90b08a685b0dfa339a26799d7cdcdc96c34cb40
tools/legacy-record-patches/CurrentRecordSave.gd d2376fc6d456000ae5d3ff8eae4947edb0200c4b79a04691cde011cbe9aacd2c
src/records/LegacyGameRecords.ts f6097a4811d6f2c6e30173ae1b2a09a9744b88f3343f352a5cd21b6e0507140a
src/records/legacyProtocol.ts bc9fc5713e1a09b51eb915e54512d8005d71b5dde6a9eaf6580213b65e7746be
tests/legacy-records/prototype013.mjs 3ddac1ccf4a41839f42cafe1168d0d63a8cf81b7a9547439d67c51e071ea4294
```

## Checkpoint02 — final01304 source / genuine phase images, 2026-10-09T02:22Z

Earlier findings, failed captures and judgments above remain preserved. Read final `prototype013-04/REPORT.json` and selected operations from01303, not Jev logs. Root's report04 records20 successful PC / phone checks, native normal100 /40 and sticky OJT0, native TITLE teardown, native-save reload / Portal agreement, no POST / JS errors. These are root operations, not browser interactions repeated by this reviewer.

### Scope teardown fix source review

Native `show_title` now calls fixed `record_bridge.cancel_run('game013')`. Shared helper forwards to child `cancelRun`: clears child run IDs and emits the closed primitive `scope_end` message. Parent validates the same game / origin / source / nonce / schema before resetting active candidate / host; scope_end cannot save a value or post a score. Native score, original preference writes, scoring engine, stage data, timing / art functions remain unchanged by this narrow cancellation. Native abandoned RUN remains inactive. Source-level teardown finding is fixed, with root04 actual-title assertions supplying live corroboration.

### Images actually opened for this checkpoint

- `prototype013-04/before-desktop-title.png`, `after-desktop-title.png`: both now show native **タスク天国** title / two characters / START / help, not Godot splash. The new native BEST70 versus old0 is a prior ordinary RUN in the shared browser context, not a title redesign.
- `prototype013-04/before-desktop-result.png`, `after-desktop-normal-result.png`: same native failure phase, before70 / GOOD1 versus after100 / PERFECT1; score and snow differences arise from distinct ordinary runs / time. Existing character, sign, failure copy and controls remain consistent.
- `prototype013-04/after-phone-title.png`, `after-phone-normal-result.png`, `after-phone-ojt-result.png`, `after-phone-native-title-return.png`: actual844×390 horizontal phone images. Native TITLE return is genuine title with previous optional result strip gone. The OJT result explains exclusion and has no sharing button.
- `prototype013-02/failure.png`: actual stage1 playing display, TASK0 / MISS12/15 and nativeⅡ visible; **not** a paused-overlay capture.

### Retry / pause probe failure evidence boundary

01301's originally requested board-coordinate retry620,579 lies outside the source rectangle615..676; that is source-coordinate reasoning, not a screen tap trace measured at its failure. 01302 records timeout and11 checks but has no `operations` / `failureState` trace. Its failure image alone cannot establish where the prior pause tap landed or prove a game pause failure.

01303 and04 now record actual canvas bounds and transformed input positions. After retry the probe waits400ms for geometry to settle. Successful phone pause: canvas `(0,52,844,274)`, board input `(1208,47)` → screen `(638.1556,69.8861)`, followed by paused / OJT ON / OFF / resume assertions. Phone RETRY: result canvas `(0,127.1875,844,199)`, board `(527,645)` → screen `(390.7681,305.4583)`. The subsequent successful trace supports a stable-resize / probe timing fix. It does **not** retroactively supply missing failed-run measurements or prove the precise earlier tap cause. No native pause timing change was needed.

### New actual-phone visual finding: result strip consumes native canvas

Final `after-phone-normal-result.png` visibly compresses the native failure screen into a small354×199 region because the external disabled button plus preparing label occupy about75px. Operations04 confirms canvas height274 normally,199 with normal-result controls; OJT's simple explanation consumes18px and leaves256px. The new normal strip therefore reduces the already small native layout by about27% in height.

The native RETRY source height61 maps to approximately16.9 CSSpx at scale199/720 (derived from source rectangle and recorded canvas bounds, not a DOM measurement of a Godot button). Score / detailed result text also becomes extremely small in the actual image. The existing landscape baseline already has small scaled native controls; the new optional strip must not worsen that by consuming substantial game space while sharing is unavailable.

Finding sent promptly to root before adjustment: **VISUAL_OR_FEEL_ISSUE; CODEX_ACTION_REQUIRED=true; NEXT_EVIDENCE=SCREENSHOT_REVIEW; RELEASE_RISK_IF_UNRESOLVED=true** under the stated readability gate. Suggested boundary is compact preparing status / nonintrusive optional controls in short-height layouts, not changing native art / game controls / rules. Actual remedy belongs to root; this reviewer made no implementation change.

### Scoped judgment

Desktop1300×900 final images: **84/100, F13/15, H12/15**, preservation and outside-control readability confirmed. Horizontal phone844×390 normal-result: **76/100, F10/15, H12/15**, current optional strip fails readability gate. Therefore no full013 Visual acceptance is issued yet despite the20 technical checks. Native TITLE teardown and correct title-phase capture are confirmed as fixed at this checkpoint. Human enjoyment, actual sound / rhythm feel and physical device tests remain unperformed.

Source SHA256 checkpoint at2026-10-09T02:22:53Z:

```text
tools/legacy-record-patches/game013/game_manager.gd.patch afcb1540625b598608e7a483ef6597643ff90965d5541c7533f01685b9dc2502
tools/legacy-record-patches/RecordBridge.gd 5d66c1c17c5a2105372f2a34470e89865fd3f92b2d257b15df1421f78b0f956a
src/records/LegacyGameRecords.ts 8f7e81fbbc5923e876d38084aec995b1b196d2287f6b8ae74e51fea856fe6d01
src/records/legacyProtocol.ts 11ffda803a840456f3c5c64b85c87a495c6037818fa018a1425b73f79f9ccc7b
public/games/native-record-bridge.js abc097e373fc619aa6b9235c0ab865f5737f5d50919fb2a916d5306f9b859ce1
tests/legacy-records/prototype013.mjs 70779b1fd5c0e25cd85c641c84bd71cf29afc81c343c6f904b9c157bb1b5f634
```


## Checkpoint03 — compact unavailable-sharing fix, 2026-10-09T02:31–02:35Z / 11:31–11:35JST

The preceding76/F10 phone finding and failing / inaccurate early probe evidence remain intact. This checkpoint reads the revised source and independently opens actual `prototype013-05` images; it does not run a browser or call Jev. Root report05 at02:28:41.110Z records20 checks PASS, desktop normal70 / OJT0 and phone normal100 / OJT0, no external POST and no JS exception. These are root's operations, not this reviewer's operations.

### Reviewed change and scope

`src/records/RecordSharing.ts:126–133` adds an optional `compactWhenUnavailable` mount option. Only when the configured records endpoint is absent **and** this option is true does the control append a status paragraph alone; it omits the disabled, unusable sharing button. `src/records/LegacyGameRecords.ts:33` supplies that option for the legacy record layer. Existing other-game calls use the default false and retain their former UI. When an endpoint is configured the code still appends button plus status and preserves the existing sharing logic; no configured-endpoint live interaction is established by this checkpoint.

The three legacy wrapper CSS files constrain only `.record-share-preparing` to zero margin and18px status line. This class is applied only in the unavailable compact branch. Original native art / score / button rectangles and stage timing are not changed by this fix. The18px line is information with no interaction target, so absence of a44px button here is appropriate. Existing configured sharing buttons remain the existing operation UI.

### Images actually opened

- `prototype013-05/before-desktop-title.png` and `after-desktop-title.png`: both genuine native title, not loading splash. Original two characters, title, START / help and task panel remain consistent. Original BEST0 versus40 represents prior ordinary runs, not art / rule change.
- `prototype013-05/after-desktop-normal-result.png`: genuine native failure result, score70 / GOOD1. Character, snow / mountain / sign, result copy and native RETRY / TITLE remain clearly readable; the new one-line preparing status is above the canvas. Analytics settings / Privacy footer is visible.
- `prototype013-05/after-phone-normal-result.png`: genuine horizontal844×390 native failure result, score100 / PERFECT1. The new18px preparing line leaves256px game area, materially recovering native result size from the199px previous checkpoint. Native result headline, summary and RETRY / TITLE are visible and separated; no disabled large sharing button remains.
- `prototype013-05/after-phone-ojt-result.png`: genuine OJT failure result, score0. Its18px explanatory line remains legible and explicitly excludes ordinary / public BEST; no sharing button appears.
- `prototype013-05/after-phone-native-title-return.png`: genuine native task title after return; previous result status strip is absent, native game area restored. Current title BEST100 follows ordinary play in this context.

Report05 independently records normal-result phone canvas `(0,70,844,256)`, versus normal playable `(0,52,844,274)`. The observed preparing line therefore consumes18px rather than the previous75px. RETRY board point527,645 now transforms to381.8222,299.3333 and root reports retry / TITLE success. This is corroboration of the new capture's geometry and root input trace, not a new human touch measurement.

### Independent scoped conclusion

The specific integration regression in checkpoint02 is resolved in these actual images. **Desktop84/100, F13/15, H12/15; horizontal phone81/100, F12/15, H12/15** for this record-layer scope. Visual acceptance is issued for the reviewed title / normal result / OJT exclusion / TITLE teardown / outside status layouts at these two viewport sizes. It is not a gameplay, audio or human-enjoyment score.

The legacy Godot controls themselves still scale down on a short-height landscape viewport: source RETRY61px at256/720 corresponds to about21.7 CSSpx, compared with23.2px at the old274px baseline. This is a retained legacy-canvas constraint rather than a newly added tiny native button; do not claim every original native touch target meets44px or that physical-device usability has been proven. The record-layer fix does not redesign native controls or gameplay. Configured sharing UI, phone portrait, actual iPhone / Android, audio / rhythm feel and human enjoyment are not independently verified in this screenshot checkpoint. Earlier absent failed-tap measurements are still unknown, not backfilled by report05 success.

Reviewed SHA256 snapshot:

```text
src/records/RecordSharing.ts 590d4c37aa3697da635d8e71fbd3243c441344348d21b39ebc4678c56a5d4781
src/records/LegacyGameRecords.ts 7c38684f9e54b5ccc04e1221a92284e498329419df4dd4f3674de50743bd14ae
public/games/tachibana-task-heaven/portal-return.css 033a9dc3a21330f645079c36689d69b9597f0d59bac4ec55cd8f8f91f391a1be
QA/prototype013-05/REPORT.json cac9a008ef056d3cdecc8adb248dfacd5bf9fe45d8d9d7f88009969c1ba4c4db
```
