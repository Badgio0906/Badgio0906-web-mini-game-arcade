# Game028 ぽんぽん卓球 ～TABLE TENNIS～

User source: [batch request](../classic-batch-two/REQUEST.md), [additional instructions](../classic-batch-two/ADDITIONAL_INSTRUCTIONS.md). Base `7c3d089d69da1ff076c63acb7c3ba96449728a1d`.

Core loop: serve → observe own-side bounce → position racket → contact → place return → point → freely begin next rally. CPU opponent is at the far end, player at the near end. Standard 11 points with two-point lead at 10–10, serve every 2 points and every point from deuce. Optional 5 points has no deuce. No time limit, forced retry deadline or extra modes.

Table x=[−.5,.5], y=[−1,1], net y=0, gravity=2.8, racket y=±.86. Ball stores x/y/z, all three velocities, last hitter/expected receiver, legal bounce count, service stage and net contact. Serve must first bounce on own side then opponent. Returns must land on opponent side, receiver may contact only after one bounce at racket plane. Racket offset controls horizontal return velocity. Low net collision faults; grazing net slows crossing, a valid service subsequently landing on opponent side becomes a let. Normal grazing contact is legal. Double bounce/outside/failure to reach the other side scores once. Fixed 1/120 s physics, swept net/table crossing. Ball/rackets/table entirely stay in the canvas; ball plus tabletop shadow convey height.

CPU samples only current ball x at delayed intervals, with bounded imprecision, and limited movement speed; it never reads exact future landing coordinates. All CPU state is part of current rally, no timer/promises survive retry.

PC mouse or left/right/A/D; phone horizontal drag on the table; 44px left/right controls are an alternative. Serve button/Space, pause/Escape. Hidden/blur/frame gap pauses and requires explicit manual resume. Optional score-free practice uses same physics and supports indefinite continuation; 3 returns indicates lesson success without requiring an exit. No production RUN/BEST/stats practice.

Fresh menu pointer-down + phase guard prevents a compatibility click from old gameplay pressing newly displayed menu controls. Capture listener runs before button actions. Keyboard detail0 remains available; held repeat and activation across phases rejected. Drag cancel/lost capture clears held pointer without generating return or score; actual hit depends on model contact, never pointer release.

One validated save blob contains match and ball state, scores/CPU/random state, active/reported, existing nullable Analytics observer UUID, separate local result ID, aggregate stats and bounded reporting ledger. Local result IDs never enter Analytics or restoreRun. Denied storage writes switch to memoryOnly and do not read stale backend again. Pagehide persists only active nonpractice match; quit/abandon removes it. Restore starts paused. Best is longest match rally; wins/losses/points/longest rally remain local. No old save key changed.

Existing Telemetry service; game_open/run_start/run_end/retry/best_update/return_to_portal and sparse serve/rally_milestone/point through specific_game_events. No per-frame events, no full state. New external collection intentionally disabled until root confirms Worker production registration. Advertising, CREDIT, GA4 and other games untouched.

Author estimated duration unspecified. Human enjoyment, real smartphone gestures/fps/sound and subjective difficulty remain untested; user approved prototype publication before author plays.
