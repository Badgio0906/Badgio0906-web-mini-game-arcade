# FALL KING: Game015 gameplay revision

The revised simulation is frozen for independent native review. This document covers gameplay changes only; renderer and practice integration belong to their respective owners.

## King and retained physics

The physical king is 18 × 33 logical pixels, exactly 1.5 times the previous 12 × 22 body. The authored sprite is 24 × 36, with a bottom-center foot anchor. The model clamps the king center to 12…244 in the 256-pixel world, preserving the entire visible sprite at both walls. The initial foot plane remains112px and the camera follows downward only.

Gravity180px/s², terminal velocity145px/s, horizontal inertia/braking, DROP skipping only the current support, no jump, moving-platform carry, 0.32s HARD recovery and 1.25s crumble lifetime retain their existing behavior. Normal landing thresholds remain SAFE≤6m, HARD>6m and<9m, fatal≥9m. Soft thresholds remain9m/12m. NICE still means a survived landing at≥85% of that material's fatal threshold:7.65m normal or10.2m soft. No hidden midair distance limit was added.

## Authored routes without full-width safety floors

The initial160px support and every generated support are narrower than the256px world. Former full-width catch floors are replaced by ordinary finite landing bays; no generation branch creates a full-width safe floor. Four-row chunks retain bounded authored horizontal shapes and safe individual vertical gaps. Introduction supports are104px wide, with centers128→104→164→176. The next chunk supplies a deliberate96→188→156→128 bend. Later widths progress120→92→76→64→56px. Moving/crumbling/soft materials remain route-specific.

Paired spike banks occupy the same plane on both sides of selected landing bays. The first pair is visible at the second introductory landing,7.6m below the start; another appears at15.6m. Later every fourth row has a paired bay, plus selected intermediate rows. A player cannot substitute permanent neutral descent for steering: even the introductory15.6m bay excludes the neutral body's complete left edge. There is no whole-world catch that erases that choice.

`safeLinkIssues()` includes the enlarged18px body,8px landing reserve, both moving-platform extremes and4px reach reserve. This geometric screen is supplemented by actual public-input simulations including takeoff velocity, braking, material transitions and bird timing. The proof is reachability; human ease and enjoyment require native play.

## Actual hazards and readable timing

All hazards have stable IDs and copied readonly snapshot rectangles/state. `snapshot().hazards` supplies `kind`, `x`, `y`, `width`, `height`, `state`, `warningRemaining`, motion parameters and support association. States are `idle`, `warning`, `active`, `cooldown`; only `active` rectangles cause damage. Events announce `hazard_warning` and `hazard_active`. Outcomes separately identify `spike`, `needle`, `bird`, or retained fatal-landing `impact`, with a Japanese explanation. End remains once per run.

### Spikes

Each bank is8px tall immediately above its associated support plane. Collision tests the complete18 × 33 king body rather than a center-point landing. In a56px bay beginning atx100, centers109 and147 exactly fit;108.99 and147.01 touch a spike bank and fail. Spikes damage their upper floor faces; a head passing under an already departed floor does not meet invisible underside teeth. A hazardous contact produces no NICE reward; DEPTH still records the actual reached depth.

### Wall needles

Needles occupy exact18 × 44px edge rectangles. Visible sockets start idle. They warn when the king approaches within90px vertically and its body edge is within36px of the corresponding world edge. The90px forward trigger makes the trap meaningful at terminal falling speed: warning starts before the entire collision transit has already passed.

A full0.9s warning precedes active needles, followed by0.65s active time and1.25s cooldown. Leaving the wall during warning avoids collision. An ordinary continuous LEFT or RIGHT input from the initial position reaches genuine needle death before8m, rather than merely dying to a later spike row. Needle death occurs on actual contact and explains that the player should leave during the warning.

### Birds

There is no bird in the first four-row introduction. Later chunks place one18 × 10px bird in their first flight gap, horizontally oscillating with amplitude88px and period6s. Its phase is determined by chunk index; decoration does not consume extra model randomness. The previous support is always a regular normal row, so the king can wait indefinitely before DROP. The bird receives1s of actual visible warning before activation.

Vertical placement is `previousY + (gap − PLAYER_HEIGHT − birdHeight)/2`. It leaves equal clearances above the previous standing foot plane and below the next standing king's head. The shortest56px gap leaves6.5px at each end; both waiting supports are safe throughout the bird's horizontal cycle. A correct timed flight can therefore land and rest without an unavoidable post-landing bird collision.

Collision uses a relative-motion slab sweep of the entire king body and moving bird at the simulation substep. It catches crossings even when both endpoint rectangles miss. Landing truncates the flight segment at the actual support-plane crossing, so hazards after that physical landing are not tested against a fictitious continued descent. A visible-window forecast in the test policy waits on the normal support for a safe flight, then uses ordinary DROP/steer/brake; no model state is injected.

## Bounds and evidence

The simulation retains120Hz substeps and the existing50ms frame cap. Generation remains ahead of the player and culls platforms/hazards above the camera. In the legal route tests, platform lists remain below30 and hazard lists below100. Snapshot mutation cannot alter either world objects or player physics.

Final gameplay checkpoint: `npm run check` passed. `npx vitest run tests/unit/game015.test.ts` passed18/18 cases,4.01s test time. Retained tests cover exact impact thresholds, no queued DROP, air inertia/reversal, moving carry, crumble timing after HARD, descending camera and copied events. Revision tests add full-body paired-bay edges, needle warning/escape/contact, natural initial wall death, moving-bird sweep, alternate legal safe/unsafe bird timing, safe waiting-plane clearance and absence of full-width generation.

The conservative ordinary-input policy reached5000m with seed1 and1200m with seeds17/77, including bird waiting, moving and crumble landings, bounded arrays and a once-only nonblocking1000m event. This is deterministic reachability evidence, not a human game-feel or timing-skill result.

Independent native QA/Feel, actual phone control, sprite readability, final hazard telegraph quality, human playtest answers and physical-device FPS were still pending at this source-freeze checkpoint. Browser reviews and their final evidence belong in the independent review reports.
