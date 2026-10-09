# Game012 prototype — independent desktop visual review

Reviewer: `legacy_source_audit`. Actual images opened with `view_image` on2026-10-09T02:03Z (11:03 JST), in pairs / individually, after root’s prototype browser had closed. No browser operation, API call, implementation change or Jev answer was used by this reviewer. User's gameplay / art preservation request and independent-review gate apply.

## Images actually inspected

All paths below refer to [prototype012-01](prototype012-01/REPORT.json), an isolated compiled build on simulated production origin, not a production player record:

- [Before native title](prototype012-01/before-desktop-title.png) and [after native title](prototype012-01/after-desktop-title.png).
- [Before native result](prototype012-01/before-desktop-result.png) and [after native result](prototype012-01/after-desktop-result.png).
- [After native retry](prototype012-01/after-desktop-retry.png).

The prototype report records ordinary native result100, one finalized result notification, Portal100 / reload agreement, disabled preparing sharing, retry clearing, zero external POST and zero JavaScript errors across8 checks. Those are **root browser evidence**, not operations independently repeated here. Before result0 and after result100 are different ordinary RUNs in the same phase; their score / HIGH SCORE / NEW RECORD differences must not be attributed to changed scoring.

## Visual observations

| Area | Actual image observation |
|---|---|
| Title / character | Existing Japanese title, yellow emphasis, banana, office worker pixel art, dark-teal panel and mint copy remain coherent in the before / after pair. No added person / arm / changed body proportions are visible. The blinking native Enter-start button is present in after; before was captured without it, so a still frame cannot prove an added / removed native button. |
| Result | Both images retain native GAME OVER panel, failed worker pose, Japanese explanation, current / high score labels and yellow Enter-retry button. After shows100 and NEW RECORD as expected from its different run. Main art is still legible and no sharing element overlaps the native result. |
| Outside-canvas controls | After result adds a shallow cream strip below the existing navigation with a distinct disabled `この記録を共有` button and `記録共有：準備中`. It has enough contrast / spacing at1300×900 and does not imply active sharing. The native canvas shifts down to accommodate the strip; its observed960×540 content remains intact. |
| Retry | After retry returns to the unoverlaid office scene, SCORE0 and HIGH SCORE100. The external sharing strip is gone. Three workers, desk / window / board art, instruction line and original Enter affordance remain visible. |
| Typography / layout | Native pixel text retains its original style; surrounding navigation / sharing UI uses consistent plain text. Title / result lines do not visibly clip. The outside button meets the existing44px minimum in its shared CSS; screenshot visibility is evidence of actual appearance, CSS is the supporting dimension rule. |

### Footer capture difference — evidence boundary

The Analytics / Privacy footer is visible in before-title and after-result, but absent in after-title, before-result and after-retry screenshots. The difference occurs on **both** baseline and revised captures, so these images do not establish that the feature removed or hid the footer. Root separately reports an actual later-boot DOM observation: `analytics-settings-host` visible at y836 / height64 and main area height784 at1300×900. That is separate runtime evidence, not something deduced from the still images. Capture/module-loading timing was not independently measured here; do not describe a specific cause as confirmed. Actual final PC / phone QA should retain a settled footer / menu check.

## Code / export corroboration, separate from the images

Reviewed012 wrapper diff adds the per-launch session and record module only; its existing explanations / isolated practice and controls remain. Added result CSS places controls outside the canvas. Native source patches add result initialization / calls and honest legacy-save notification, leaving original score formula, input, game-over text and update/timing branches intact.

[REPRODUCIBLE_EXPORT012](REPRODUCIBLE_EXPORT012.json) documents exact Godot4.5.1, pinned source, unchanged reviewed compiled resources,73 native checks from the prior identical prototype and complete regular source export. This is toolchain evidence read by this reviewer, not a compiler or resource-compare execution performed here. Images cannot prove preserved audio waveforms / sound output, timing equivalence or persistent save correctness.

## Scoped visual judgment

Desktop prototype: **84/100**, readability **F13/15**, completeness **H12/15**. Meets the existing80/F12/H12 visual threshold for the five actually viewed1300×900 images. Concrete basis: preserved native identity, clear native result and retry, unobtrusive external preparing controls, no observed text / character clipping. Footer capture inconsistency limits comparison confidence and remains explicitly recorded.

This is not a phone-wide Visual PASS, runtime release approval, human enjoyment assessment or author playtest. Phone portrait / landscape /320px, actual sound, continuous timings, settled Analytics footer, original cfg persistence and final production version remain the separate final QA scope. No unsolicited art remake or game mechanic change is recommended.


## Checkpoint02 — final012 browser / phone safety evidence, 2026-10-09T02:53–02:55Z / 11:53–11:55 JST

Independent read-only review of root's final built native receipts and actual images, no browser / API / Jev log / implementation mutation. Earlier prototype judgments and footer-capture uncertainties remain recorded above.

### Actual receipt, native authority and historic compatibility

`QA/final012-browser-01/REPORT.json` at02:43:43.210Z records10 checks PASS. In an isolated browser context, normal input in the old pinned export produced400 (before result image actually shows SCORE000400 / HIGH SCORE000400); new export then reported genuine native `legacy_best=400`, one start and final result0. New final native screen still shows HIGH SCORE400, and root's Portal DOM text / reload checks report `あなたのBEST400点`. The new lower final result did not erase the original high-score ConfigFile or lower the Portal mirror. Current result0 is a valid result distinct from missing / failed fetch.

`prototype012.mjs` serves old native files from `git show 488916c:public/...`, preserves the context / native save before loading the changed dist, uses ordinary native Enter and reads existing native bridge events. It does not write Godot score / save to invent a historical BEST. Its deliberate parent-origin injected duplicate result is a rejected protocol security fixture, not a production result. Final notifications omit session / run IDs from the report. Root receipts are other-agent operation evidence, not independently repeated browser interactions here.

`QA/safety-02/REPORT.json` at02:50:53.289Z contains **107 PASS checks across all three legacy games**, not107 Game012 checks. Its Game012 phone390 /320 /844 checks report shell practice has no native engine / notifications, genuine normal wrong-input result0, touch retry clears optional controls, and Portal preserves valid0. PC checks additionally cover menu teardown / route. Source `safety-browser.mjs` confirms phone012 branch uses normal canvas taps, waits actual native start / result messages, reloads parent layout after retry and observes Portal `0点`. The report's `views` array omits the three012 phone entries because that branch returns with `continue` before metadata append; the individual named checks, screenshot names and probe source supply their viewport / operation evidence. This is a receipt metadata limitation, not absence of phone operations. Root was notified; no historical report is retroactively edited here.

Both receipts report no external POST / JS exception; route interception and denied consent keep automated runs separate from production. They are not public-site deployment evidence or physical-phone trials.

### Images actually viewed

- `final012-browser-01/before-desktop-title.png`: genuine original native title, title copy / banana / worker / yellow start control.
- `final012-browser-01/after-desktop-title.png`: **native region is completely black**, while wrapper header / footer are visible. Therefore this specific before/after title pair is invalid; filename and a native loaded-BEST event do not prove title pixels are ready.
- `final012-browser-01/before-desktop-result.png` / `after-desktop-result.png`: same actual GAME OVER phase. Old natural400 / NEW RECORD versus new0 / preservedHIGH SCORE400 reflects different ordinary runs. Original crying worker, office art, failure copy, title / summary and yellow retry are retained; preparing status is a compact18px line outside the canvas. No art redraw / score rule change is inferred from the different results.
- `final012-browser-01/after-desktop-retry.png`: actual native playing, score0 / high-score400, three workers / desks / banana and original prompts. Previous optional sharing strip is gone.
- `final012-browser-01/after-desktop-portal.png`: visible Portal shell and first cards; Game012's card lies below this captured viewport, so the image alone does **not** visibly prove its400 display. That assertion is independently present in root's actual DOM / reload receipt; do not describe screenshot as showing012 card400.
- `safety-02/game012-{390x844,320x720,844x390}-native-result.png`: actual native GAME OVER content and external preparing line at the three simulated phone sizes. Native character / result text / score are partly visible; significant original-canvas content is clipped as noted below.

### Actual finding — after-title capture is black

Reported promptly before any recapture: **TEST_INFRA_BUG is first candidate; CODEX_ACTION_REQUIRED=true; NEXT_EVIDENCE=SCREENSHOT_REVIEW; RELEASE_RISK_IF_UNRESOLVED=false** for this screenshot provenance gap alone. `prototype012.mjs:24` waits `legacy_best` then immediately screenshots; Godot's early loaded-save notification does not guarantee the native title has been drawn. This supports a capture readiness problem, but actual rendering failure is not definitively ruled out by source alone. Preserve the black capture and create a distinct image after confirmed native title pixels / settled frame. Current GAME OVER / retry images and original stage/art source remain valid. Until then, no new final same-phase title Visual acceptance is issued.

### Phone visual limitation, separate from operation success

The390 /320 portrait screenshots clip native content horizontally: GAME OVER / right-hand failure copy / full summary and much of the retry control lie beyond the visible iframe. At844×390 landscape the top of the native game is clipped while the score / retry lower portion is visible. This is stronger than merely small type; these images do not show the entire native result UI. The outside status / return / optional-help / footer remain readable and do not overlap their controls.

Original fixed native layout preservation is the current requirement. Source record patches / compact status do not alter its layout; however, there is **no reviewed before-phone012 result image here**, so this checkpoint cannot directly prove identical baseline clipping. Root was notified as a preserved-native-layout constraint candidate. Do not claim all-phone full visibility / a fresh-game Visual Gate PASS, physical-device comfort or44px native targets. Touch result0 / retry / Portal0 operations can succeed despite clipped native UI and are separately supported by root's checks. No unsolicited native layout / gameplay redesign is made by this reviewer.

Reviewed final PC result / retry record-layer layout remains accepted at the earlier scoped **84/F13/H12** level; final-title evidence awaits a genuine after capture. Phone outside-wrapper / compact-status readability is accepted, while native full phone-result readability is explicitly not certified. No human enjoyment, physical phone, audio or timing feel has been independently tested.

SHA256 snapshot:

```text
src/records/LegacyGameRecords.ts 7c38684f9e54b5ccc04e1221a92284e498329419df4dd4f3674de50743bd14ae
src/records/RecordSharing.ts 590d4c37aa3697da635d8e71fbd3243c441344348d21b39ebc4678c56a5d4781
public/games/yokodori-days/portal-return.css 033a9dc3a21330f645079c36689d69b9597f0d59bac4ec55cd8f8f91f391a1be
QA/final012-browser-01/REPORT.json 4ddf5b6e32871c72b9564a44bdf4a18256ba3d2a9d83b45d2c5c45805d5ec0f1
QA/safety-02/REPORT.json dd38467c2885ceb45a50af9bda76df853c3222f3eee32e5113931d900d9d04d8
```


Source-only follow-up at02:56Z: independently read original `/workspace/legacy-games/yokodori-days/project.godot:11–16`: viewport960×540, `window/stretch/mode="canvas_items"`, `window/stretch/scale_mode="integer"`. This fixed integer scaling supports the preserved-layout-constraint interpretation for narrow / short phone viewports. It does not substitute for missing direct before-phone image comparison; root is obtaining separate original-export captures. Root acknowledged black-title finding and owns Shadow / capture readiness fix; no Jev answers were consulted here.


## Checkpoint03 — correction of black-title judgment and final direct comparison, 2026-10-09T03:03:38Z–03:06:10Z / 12:03–12:06 JST

### Explicit correction: previous black-capture finding is not supported by PNG files

The checkpoint02 claim that `final012-browser-01/after-desktop-title.png` is a black native capture was **this reviewer's mistaken interpretation of the tool-displayed image**. It must not be treated as a product rendering failure, a confirmed capture-readiness defect or proof the old evidence lacked native title pixels. Root was notified immediately when the contradiction was discovered. The historical mistaken judgment remains above for audit; this checkpoint explicitly supersedes its finding and final-title hold.

The new `capture012-01/after-1300x900-title.png` again looked black in the tool presentation despite a PASS native OCR receipt. Rather than invent a second capture failure, this reviewer inspected the actual PNG files without editing them. All four files are RGB1300×900 and have **exactly the same SHA256**:

```text
final012-browser-01/before-desktop-title.png
final012-browser-01/after-desktop-title.png
capture012-01/before-1300x900-title.png
capture012-01/after-1300x900-title.png
SHA256 4af35270c6bfb3544ec4d890bfc679e360da29192e7011e8aeb30b8cfa623ebd
```

The independently displayed before image is the genuine title. In each file, original-native region `(170,175)-(1130,715)` includes233681 pixels RGB(23,43,59),83368 pixels(42,57,62),63722 pixels(15,28,40),33143 pixels(41,69,78); pixel650,400 is(23,43,59), not black. Combined with byte-identical files and the root's OCR marker, this conclusively refutes **black PNG file** for these captures. It does not diagnose the precise tool-display / model-perception mechanism. No tool bug or capture-overwrite is asserted without evidence. Root owns its contemporaneous Shadow record / annotation; no answer or log was read by this reviewer.

Independent corrected classification: **review-evidence interpretation error, not PRODUCT_BUG**. The proposed readiness cause in checkpoint02 was an unverified hypothesis and is withdrawn. There is no remaining black-title product / capture finding and no title redesign / product fix is justified. This correction does not erase the actual API call root may have made in response to the then-incorrect observation.

### Newly read reproducible baseline / after evidence

`capture012-01/REPORT.json` at02:57:55.164Z has PASS,10 view entries and zero POST / JS errors. This is **10 view entries, not10 new checks**; the prior final012 browser receipt separately has10 checks. Source `tests/legacy-records/capture012.mjs` routes before files from488916c and after files from dist in isolated contexts, uses ordinary Enter / tap, then validates actual result0 / outside status. Desktop title captures are checked with Tesseract for original English title marker; this is a post-capture validation after1500ms, **not** an OCR polling loop or engine-state probe. Before / after ordinary failures both0 are genuine separate runs.

Actual view_image calls here opened:

- before / after1300×900 title (tool perception discrepancy corrected by exact-file evidence above).
- before / after1300×900 native result0.
- before390×844 title and result; before320×720 result; before844×390 result.
- after390×844,320×720,844×390 result.
- after Portal record captures at1300×900,390×844,320×720,844×390.

Additionally, Pillow `ImageChops.difference` on each of the four new before / after title PNG pairs finds **pixel-identical title files at all four viewport sizes**. This is an independent file comparison, not an invented human trial. No image file was changed or recreated by this reviewer.

### Direct preservation / clipping comparison

New desktop result pair shows same title / GAME OVER / crying worker / office / failure copy / score0 / HIGH SCORE0 / yellow retry. External preparing status is18px, leaving native canvas766px rather than784 and shifting its centered content slightly. No character / text redraw or cut-off desktop result appears.

New **baseline phone** results directly show the same native clipping previously seen in changed safety captures. Before390 /320 portrait already clips the right-side GAME OVER / explanation / full score / retry; before844 landscape already cuts off the top of the native result while lower score / retry are visible. The baseline title390 likewise clips the right-side portrait / start control. Therefore this specific canvas limitation is confirmed as pre-existing, not newly created by the record hooks. Source960×540 / integer scaling previously read is consistent with actual before / after evidence.

Root's measured before→after result canvas heights:

-1300×900:784→766; top52→70.
-390×844:728→710; top52→70.
-320×720:604→586; top52→70.
-844×390:274→256; top52→70.

Every height difference is18px, matching the single-line informational preparing status. Actual new result images preserve original content with the native frame's slight offset / clipping shift. Existing clipped content is not magically made readable; no all-device full-native-UI PASS is claimed. User scope prioritizes original native operation / UI preservation, so no unrelated integer-scaling redesign is appropriate here.

### Portal record visibility and final scoped decision

New Portal captures now actually include Game012's card. `あなたのBEST0点`, `みんなのBEST準備中`, `最高スコア・通常プレイ` and game title are visible and readable at PC and all three simulated phone widths. The320px card wraps descriptive content naturally without record-label overlap. Some390 /844 card thumbnail regions are still blank in these specific images; these captures prove readable record text, not completed thumbnail image loading. PC /320 images show its original gameplay thumbnail. A previous final012 Portal capture that omitted card012 remains correctly distinguished above.

**Final scoped Visual acceptance:** existing native desktop title / result / retry art preserved, phone baseline clipping preserved, external record status compact / legible and Portal record text readable. Desktop84/F13/H12 remains a record-layer score; no fresh-game-style complete phone-native Gate PASS is assigned. The previously held title comparison is now resolved by exact genuine-title PNG equivalence, not by concealing the mistaken finding. Technical old400→new0→nativeHIGH SCORE400 / Portal400 compatibility remains supported by the separate ordinary-browser receipt; these new isolated captures demonstrate valid0 only.

Remaining unverified: physical iPhone / Android, sound, human reaction / comfort / enjoyment, full phone-native result visibility (known retained constraint), native concurrent-tab ConfigFile behavior, live configured public record submission and production deployment. No human author play or fun approval is fabricated.

Snapshot SHA256:

```text
QA/capture012-01/REPORT.json ee20dc68e538d67bb2128c6344cd38b541333912e2f718aee6f02f08f7522198
tests/legacy-records/capture012.mjs c241dbbf75dfdf0bcb26c1c23f57fc4caf25131b7b802fc3a6f2eeb327685d1d
```
