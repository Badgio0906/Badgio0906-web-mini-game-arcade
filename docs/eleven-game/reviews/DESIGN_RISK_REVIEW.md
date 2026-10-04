# Eleven-game design risk review

Independent Game Feel / UI reviewer. Specification fully read; **design review only, no browser or runtime acceptance yet**. Existing source was inspected for Game007 information and Game008 liquid signs. Implementation remains with the main/gameplay/UI agents.

## Requirements with the highest failure risk

1. **Practice must teach the actual input and consequence.** A button acknowledgment, highlighted answer or animation that succeeds regardless of input is insufficient. Keep one forgiving scenario, a clear mistake explanation and another attempt without Game Over. Target 5–20 seconds for an ordinary successful attempt; slow reading or a held input need not fail. Show completion only after the action is demonstrated, then save the per-game completion flag. A repeat launch offers both direct play and practice again.
2. **Practice is outside the real run.** SCORE, BEST, run identifiers and gameplay telemetry must remain unchanged. Game010 may show a clearly labelled practice-only score example. Tutorial events identify their own session/step. Clear held keys/pointers and reset the real game before starting it, so a final practice tap does not move, drop or answer in the new run. This prototype disables CREDIT restrictions and ads; old three-death/refill tests and historical ten-game reports do not describe the new UX. A returning browser with previously saved zero CREDIT must still start/retry freely and see no reward gate or advertising prompt.
3. **Teach the minimum; preserve discovery.** Do not mention Game002 journey/bike, Game003 C-country mode, Game006 forbidden parking, Game007 fast mode, Game008 extra cups, Game010 board meeting or Game011 final-mode mechanics in the first practice. Current portal taglines may hint at surprises without explaining choices. No practice step should require reaching a long-run milestone.
4. **Game011 deadlines must describe usable visible time.** Five seconds for image one, one second for images two–ten, unlimited text reading, 0.8 seconds after choices appear, and real 0.5-second final rounds. Preload/decode the image pool so a timed question is not mostly a blank image. Native PC inputs choose the displayed left/right position; no category shortcut should bypass the randomized labels. Equal-color/shape/size/font answer buttons must remain equal during every phase.
5. **READY must be a distinct gesture.** Prefer revealing timed text choices on release of the readiness key/pointer. Holding Space should not expend the 0.8 seconds before an answer is possible. The same down/up/click sequence must never both reveal and answer; held-repeat, double-click, stale-pointer, pause, blur, retry and new-question epochs require explicit handling. Guard the gesture without secretly extending final-round deadlines. Actual event/visibility timestamps and native inputs are required later; model simulation alone cannot certify usable time.

## Minimum practice acceptance

|Game|Required demonstrated action/consequence|
|---|---|
|001|Actually change orbit before the slow INNER blocker and survive its pass.|
|002|Move from CENTER to avoid the first fixed person, then avoid the second encounter.|
|003|Release one slow block onto a broad foundation; ordinary success is sufficient.|
|004|Watch two separated flashes, then repeat them; WATCH taps do not count.|
|005|Round → LEFT, angular → RIGHT, followed by a short notice that the rule can change.|
|006|Stop angle and power with two gestures, then see a forgiving actual parking path/landing.|
|007|Accept 200+60=260/450, then reject 410+80=490/450, explicitly 40 over.|
|008|Observe a fixed slow LEFT liquid/risk tilt, use RIGHT correction, then release as the same HUD returns toward center.|
|009|Find one requested object among a few visible distractors.|
|010|Start WORK with a labelled practice-only score demonstration, then return to LISTEN for a visible question cue.|
|011|Identify one unambiguous image with untimed, randomly placed identical-style choices.|

The real game should begin in its normal fresh initial state, with no hidden practice progression. A failed practice remains retryable. The framework may be shared; the teaching scene and actual input should preserve each game's identity.

## Readability and asset risks

**Game007:** Current/max, remaining capacity, current party weight and projected total must be together in the gameplay area. Distinguish the party waiting **now** from the upcoming NEXT party. Show unloading as a visible delta before the next decision, rather than silently changing load. Keep destination/roster details secondary; do not shrink the required arithmetic to retain a decorative manifest. Text and units must remain intact for actual three-digit weights, including projected overload, across portrait and landscape. Labels『見送る』『乗せる』must match PC left/right and phone controls.

**Game008:** Current source uses `surfaceTilt = liquidAngle − bodyLean`. Positive surface tilt draws the high/spilling edge on LEFT; negative means RIGHT. A body-lean arrow can contradict the current liquid during inertia. UI/gameplay/main agents have confirmed the convention: show actual cup surface/risk, distinguish it from the corrective input, focus the spilling/highest-risk cup with its name, and keep individual cup readings so opposite waves do not cancel in an average. The same sign and HUD should appear in practice. Actual opposite-direction corrections and transient overshoot still need browser review. Distance, balance and remaining coffee belong inside the game window; outside SCORE must not be required for control. Retain readable 0%/red terminal states and unclipped distance/unit text.

**Game010:** New LISTEN/WORK foregrounds must have compatible linework, shading, perspective and hand anatomy with the existing portraits. Hands must not obscure the boss/question caption. Different work items/hand positions should communicate the mode without relying only on color; transitions should not delay input or cue visibility. A practice prompt may assist once; regular play should retain the existing fair question-versus-feint distinction.

**Portal:** Each card needs an honest actual-game thumbnail, readable Japanese/English titles, tagline and clear play target. No fake rankings, unavailable content or generated luxury scene posing as the implementation. Compact cards must preserve title wraps and useful thumbnail size. Return-to-portal controls belong in safe header/pause/result locations, outside the main input area. Asset links and direct game refresh must work under a repository subpath; this requires final production-path review, not merely localhost root success.

## Later independent evidence

Wait for the parent's exclusive source-freeze/browser handoff. Review initial explanation → real practice → success → fresh main start for all eleven, with real native PC/touch input, score/BEST separation, second-launch direct play and practice replay. Capture actual Game007 arithmetic/unloading, Game008 liquid/risk/correction and in-window HUD, Game010 both foregrounds, Game011 three genuine timed phases, and portal navigation/cards on desktop 1440×900 or larger and mobile 390×844. Keep earned outcomes separate from any explicit DOM-only layout fixture. Human fun and first-time understanding cannot be established by a read-only answer oracle.

The new specification changes human **K–N** to explanation comprehension, practice comprehension, acceptable practice duration and knowing what to do at main start. Earlier ten-game K–N discovery/risk/joke questions remain historical and must not be copied as the new onboarding checklist. Human A–N and publication approval are pending.

### Initial Game011 source follow-up

Read-only `UnkoRun`/`UnkoBoard` inspection found full elapsed-time synchronization before native answers and release-latched READY, both appropriate design choices. Two prefreeze risks were sent to Gameplay Engineer: asynchronous image-cache startup spending visible-answer time on loading, and Arrow/A-D being excluded after an answer button retains focus. The engineer reports a decode/loading gate with reset/destroy epoch cancellation is being added, and focused answer-button side keys have been corrected. These are implementation-in-progress responses, **not browser-tested fixes or a Feel PASS**. Final native pointer/keyboard, visibility/deadline, asset and reset checks remain required.

### Initial common-onboarding source findings

Three concrete prefreeze findings were sent to the main agent without edits: Game007 practice taught LEFT=board/RIGHT=reject, opposite the actual game and specification; Game008 practice drew its positive/high-LEFT risk pointer on the RIGHT side of a labelled gauge; and unlimited chrome marked entire `.result-note` containers for hiding when their descendant text contained CREDIT. All require final source and native confirmation. Lower-priority teaching checks: keep Game003 drawn support/success geometry consistent, and ensure Game006 stopped gauge values visibly affect the parking demonstration rather than acknowledging two inputs with an invariant path. This is diagnosis of source under construction, not a claim about a frozen runtime.

Subsequent browser-free source reread confirms the three fixes are now present: practice007 buttons and keys agree with actual LEFT refusal / RIGHT acceptance; practice008's pointer uses `298 - tilt * 200`; credit-note filtering is limited to `p.result-note`/`small.result-note` instead of whole result containers. Practice003's accepted center range now agrees with its drawn support; practice006 stores stopped angle and power, uses them in the visible path and checks a broad parking containment. Navigation now has a wrapping/two-row mobile header budget. Final actual viewport and native-input transfer checks still apply. A phone portal-return `min-height:38px` was flagged for checking/restoring the 44px navigation target; computed actual bounds have not been observed.

The independent native capture harness is [capture-practice-review.mjs](capture-practice-review.mjs). Its syntax check passed; it has **not been run**. It requires an explicitly supplied frozen candidate URL. It imports no QA implementation, mutates no storage/model/score/time, and records mechanical completion times separately from human learning. Native Chromium held-touch emulation is identified and does not certify physical phone latency.
