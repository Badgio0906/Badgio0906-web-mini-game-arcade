# Independent review protocol for the ten-game expansion

This protocol implements `../IMPLEMENTATION_SPEC.md`. It is a plan, not a completed-review or approval record. New gameplay permissions in that instruction supersede the earlier visual-only restriction; the earlier visual score rubric remains applicable.

## Execution and phase boundaries

1. Existing Game002 journey/bike, Game003 C国 mode and Game005 rule/language flows: independent actual execution after each coordinated runtime freeze, followed by regression QA.
2. Game006→007→008→009→010, each separately: actual Game Feel Review, then separate actual Visual Review, corrections/review if needed, then QA. Review conclusions must identify the reviewed source/freeze and whether fixes were independently rechecked.
3. Native keyboard/mouse/touch inputs only. Read-only inspection may plan inputs. Never mutate a model, move a player, grant scores, force a milestone or accelerate a clock. Observe elapsed game time separately from wall time. Oracle play is not a human skill test.
4. View the captured rendered images, not only source or generated concepts. Observe meaningful animation transitions in the running browser. Desktop1920×1080 and mobile390×844 are the canonical capture sizes; supplementary geometry/QA evidence must identify its separate owner and method.
5. Browser slots are serialized with QA. No review run may cross HMR or implementation mutations. Close contexts and notify QA before handing over the slot. A text-only result layout fixture is permitted only if explicitly labelled as a fixture and kept separate from an earned result.

## Game Feel gates

Record actual first-ten-second experience, understandable controls, failure explanation, retry latency and interruptions, input buffering, safe-route availability, progression preview and score clarity. At each choice, examine whether threats, decision deadlines, game clock and buffered actions freeze; whether resume gives enough warning; whether safe and risky choices are intelligible; whether a choice is irreversible within the run; and whether the new mode changes the experience beyond a numeric speed increase.

For replay/CREDIT, separate the reviewer's reasoned hypothesis from human observations. A reviewer can judge that a mechanic offers a plausible replay incentive or has an obvious frustration, but must not report a measured desire to view an ad. Check the actual third failure, zero-CREDIT offer and Stub refill where feasible; identify any saved-state fixture explicitly. Successful safe exits and ordinary failure must remain distinct lifecycle events.

## Visual gates, separately recorded

| Item | Maximum |
|---|---:|
| A. Visual identity |15|
| B. Character/object appeal |15|
| C. Background quality |10|
| D. UI integration |10|
| E. Composition |10|
| F. Gameplay readability |15|
| G. Motion/effects |10|
| H. Production value |15|

PASS requires total≥80, F≥12 and H≥12. Give concrete reasons from actual desktop/mobile captures and actual motion. Do not award production value merely because image generation was used. Each new game must have a distinct visual identity, functional integrated art and readable real controls. Failure leads to concrete Art Director revision directions; after three unsuccessful iterations record `HUMAN ART REVIEW REQUIRED` instead of PASS.

## Human A–N form

All fields below start **unperformed** for this expansion. Existing historical human results must be dated and distinguished from newly changed mechanics.

| Field | Question / observation to record |
|---|---|
|A|Explain the goal and controls within5–10seconds, without assistance.|
|B|Record first natural failure time and cause; no automated survival figure substitutes for it.|
|C|Can the player explain why they failed and what to change?|
|D|Do timing, movement, feedback and input buffering feel comfortable?|
|E|Do previews and recovery give a fair chance to react?|
|F|Is a concrete BEST or performance improvement worth pursuing?|
|G|After using3CREDIT through failure, do they want another run?|
|H|Would a real rewarded ad for+3CREDIT be attractive? Make clear the present implementation is a Stub.|
|I|PC keyboard/mouse: focus, pause, repeated/held input and retry.|
|J|Real phone: one-handed touch, portrait/landscape, readability, scrolling, sound and smoothness.|
|K|Does the game-specific later development make them want to see further?|
|L|Is choosing a special mode an enjoyable dilemma?|
|M|Does entering it make the game more interesting, rather than merely faster or punishing?|
|N|Does humor stay out of the way of play and remain welcoming?|

Each game review adapts these questions to its skill axis and special choice, leaving absent human answers visibly pending.

## Initial risks to investigate, not predetermined findings

-006: angle and power need an understandable connection to final position, collision cause and parking quality. Forbidden slots must remain geometrically possible and visibly different.
-007: refusal should carry an opportunity cost; capacity and upcoming unloading must make resource choices meaningful. Overload is a readable warning, not accident spectacle.
-008: coffee must visibly lag body input; spills should be gradual. Added cups should change balancing attention and preserve predictable warnings.
-009: clutter must increase visual search without shrinking targets or hiding their clickable bounds. Cleanup trades multiplier against clarity, not only a cosmetic background swap.
-010: boss cues must be readable before failure; LISTEN protects the run while SIDE WORK rewards risk. Feints must be distinguishable enough to support learning, and the safe-exit choice must preserve the earned score.
