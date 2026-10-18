# Game038 — Independent technical visual review

Reviewer: Art Director / visual-review sub-agent, independent from product implementation and ImageGen execution. Reviewed source supplied by main: runtime `963956a`; this revision changes the wide-screen CSS fill after runtime `7d0287b`. The reviewer viewed supplied captures directly with `view_image`; no reviewer browser interaction is claimed.

**Final technical visual gate: PASS — 81/100, F12/15, H12/15.** This review is technical visual assessment, not human appeal, enjoyment, physical-device approval, or publication authorization.

## Actual viewed evidence

- Source background and both ImageGen sheets: see [ART_REVIEW.md](ART_REVIEW.md) for actual-view findings and crop precautions.
- Intermediate first integration: `QA/first-desktop-play.png`, `QA/first-phone-title.png`, `QA/first-phone-play.png`.
- Revised first-120ms practice layouts: `QA/layout-1280.png`, `QA/layout-390.png`, `QA/layout-320.png`, `QA/layout-844.png`.
- Runtime `963956a` desktop states: `QA/browser-fixed/desktop-title.png`, `desktop-lost.png`, `desktop-practice-clear.png`, `desktop-play.png`, `desktop-motion-1.png`, `desktop-motion-2.png`.

The intermediate first-integration lane contrast finding was resolved by visible 上/中/下 markers in all four revised layouts. The former desktop offscreen controls were resolved in those layouts. Runtime `963956a` additionally fills the wide composition, resolving the previous unused right-hand area.

## Initial desktop assessment

The painted anime cast matches the original rainy-city background: cool wet clothes, restrained warm reflections and coherent perspective. The small ochre player retains a distinct coat and warm foot ring. All supplied current desktop states contain the HUD, street, shelter caption and three lane buttons. The native crowd screenshot preserves readable umbrella shapes, canopy tops, grounded feet and positive/negative score tags. Dense shelter overlap is intentional; the warm player ring and current-shelter caption provide useful disambiguation.

The title, failure and practice-clear panels contain readable Japanese glyphs and reachable-looking controls within their bounds. Some long result headings wrap their last short syllables onto a separate line; this is a typography polish limit rather than observed clipping. No urgent static visual blocker was identified in these desktop states.

The three sequential desktop play/motion captures, supplied as approximately 180ms apart at the normal frame clock, show pedestrians translating and entering/exiting the scene on consistent ground baselines. This establishes sampled position continuity only. Figures retain one walking pose with small visible presentation changes; no full walk cycle, continuous frame pacing, FPS, audio or perceived smoothness is established by still frames.

At this desktop checkpoint, final phone, narrow and short-landscape multi-state evidence plus home arrival were pending. Final inspection and score follow below.

## Final inspection

Final frozen source: `963956abf095492e17dd58bfee148388c3e29f56`. [Browser receipt](QA/browser-fixed/RESULTS.json) records identical source-before and source-after hashes. The receipt identifies Linux headless Chromium, native keyboard/touch input, read-only DEV snapshot-guided automatic lane choices and no clock acceleration. Those technical runs were performed by the main agent; this reviewer independently viewed their actual resulting images. This is not independent manual gameplay or a human reaction test.

In addition to the six desktop images above, all of these final PNGs were actually viewed directly with `view_image`:

| Viewport/evidence | Images under `QA/browser-fixed/` |
|---|---|
| Desktop 1280×800 | `desktop-home.png` |
| Phone 390×844 | `phone-title.png`, `phone-lost.png`, `phone-practice-clear.png`, `phone-play.png`, `phone-motion-1.png`, `phone-motion-2.png`, `phone-home.png` |
| Narrow 320×568 | `narrow-title.png`, `narrow-lost.png`, `narrow-practice-clear.png`, `narrow-play.png`, `narrow-motion-1.png`, `narrow-motion-2.png`, `narrow-pause.png` |
| Short landscape 844×390 | `landscape-title.png`, `landscape-lost.png`, `landscape-practice-clear.png`, `landscape-play.png`, `landscape-motion-1.png`, `landscape-motion-2.png`, `landscape-pause.png` |
| Storage-denied phone | `denied-storage.png` |

All inspected final states contain their essential controls and text. Narrow practice-clear wraps its third action onto a second row, but it remains within the panel. Short-landscape panels fit their smaller scene without hiding the left status area or lower controls. The storage-denied message is readable. The two earned full-run home images show the arrival result, score and retry/title actions. The home illustration sits behind the result panel and is partly obscured; the result text communicates arrival clearly. These screenshots do not establish how the home approach felt before the modal appeared.

At phone and narrow scale the cast is dense around the sheltered player, and some bodies overlap heavily. The ochre coat, warm player ring, active shelter ring, 上/中/下 labels and current-shelter caption retain sufficient technical readability. Distinguishing every character type instantly from clothing alone remains a human comprehension question. The original low-contrast lane concern and desktop fold concern are resolved in the final images.

## A–H score

| Item | Score | Actual evidence and limitations |
|---|---:|---|
| A. Visual identity |13/15|Blue rainy-city street, amber windows, umbrellas and small ochre traveler create a coherent rainy commute. The background is deliberately shared with the existing reference, so novelty comes mainly from the cast and shelter presentation.|
| B. Character/object appeal |13/15|Detailed painted cast and isolated home match the reference's light/materials. Closed player umbrella and open NPC canopies are distinct; adult/child and elderly silhouettes add variety. Fine detail reduces at small scales.|
| C. Background quality |9/10|The unchanged source has strong environmental detail, wet-road reflections and a coherent palette across all views. Narrow framing necessarily shows less of the street.|
| D. UI integration |8/10|Navy panels, cream text, amber primary actions and mint active-lane controls fit the art. Japanese glyphs are visible. Some long result headings wrap awkwardly, and the wetness meter relies on its numeric label for meaning.|
| E. Composition |8/10|Wide-fill correction restores balanced desktop composition; portrait and short-landscape retain status and primary actions. Small-screen crowd overlap and modal-covered arrival art limit staging clarity.|
| F. Gameplay readability |12/15|All four sizes show player/shelter rings, lane markers, current shelter, numeric wetness/distance/score and visible lane buttons. Dense overlapping pedestrians and small score tags remain less immediate than isolated silhouettes; human recognition speed is unverified.|
| G. Motion/effects |6/10|Actually viewed sequential play/motion1/motion2 frames in all four viewports show coherent translations, entry/exit, rain and grounded baselines. Figures retain a single walking pose; no continuous recording, perceived smoothness, FPS or full walk cycle is claimed.|
| H. Production value |12/15|Consistent title, practice-clear, loss, pause, full-run arrival, storage feedback and responsive controls form a complete prototype presentation in the viewed states. Heading wraps, limited character animation and partly hidden arrival art leave polish opportunities.|
| **Total** |**81/100**|**Meets total ≥80, F≥12 and H≥12 for this bounded independent technical visual assessment.**|

No final hard visual blocker was observed in the inspected evidence. Further presentation changes would need a scoped re-review. Human visual preference, fun, actual rule comprehension, motion comfort, audio, continuous frame pacing, physical-device safe areas and touch ergonomics remain unperformed/unverified. This PASS does not designate the game human-approved, complete, published or fun.
