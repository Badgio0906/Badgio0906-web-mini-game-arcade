# Game026 出世すごろく ～UP & DOWN～

Source request: batch-two REQUEST §6/7 and ADDITIONAL_INSTRUCTIONS §1–10. Base7c3d089. Own files only; root integrates catalog/Telemetry registration/publication. No external materials or rules engines.

Core loop: on your turn, roll1–6, move across original snake-numbered1–100 board, resolve at most one promotion/transfer, watch the next participant. No countdown, penalties, unrelated mode or timeBEST. Luck and shared anticipation are the core; this game does not claim strategic depth.

Start at1. Exact100 wins. Over100 means no move;6 grants no extra turn. Event starts are disjoint, none at100, no chaining on destination. The original board mappings are the exported frozen tables in model.ts, not reference-image numbers. uint32 rejection sampling avoids modulo bias.

Modes: one human+oneCPU, local2/3/4 humans. Same-position markers use circle/square/triangle/hexagon, colors and four separate offsets. Finished participants skip later turns. Once only one remains, its last place is fixed at its current position and labeled explicitly. This completes full standings without making a finished human watch an AI-only tail.

Dice is decided once before220ms settlement (70ms reduced-motion). Logical and visual position both remain at the old cell until atomic settlement, then both show the new cell; no separately progressing false token animation. Pausing/hidden cancels callbacks while retaining pending die and player. Resume completes that same move without a redraw. CPU waiting440ms uses the same invalidatable scheduler. Newmatch/abandon/retry invalidates work; pagehide cannot resurrect abandoned matches.

Game-local save_version1: atomic envelope includes replayable history, pending die, lastdie, observerRUN UUID|null, separate local resultUUID, stats/reported ledger. Restore replays rules and rejects impossible history, foreignversion/IDs or mismatched results. Restore waits at explicit pause. Failed writes/reads, validJSON invalidsnapshot or overlarge backend switch to page memory; reload persistence cannot be guaranteed when storage is denied. Local result accounting does not require Analytics consent/observer. No prior save keys changed.

PC click and Enter/Space (commit on release). Physical controls require fresh same-target pointerdown in same screen epoch. Cancel/premature lostcapture/drag clears the gesture; ordinary post-up implicit capture loss is allowed. Held keys and old compatibility clicks cannot activate a new screen; keyboard/supportive detail0 click remains possible. Optional dedicated two-roll practice starts at labeled practice positions16 and1 with die2 to demonstrate transfer then promotion. It uses actual model, no statistics, BEST, productionRUN or productionTelemetry.

Presentation: quiet ivory/teal, readable full square board, light tile borders, one-line event copy, native controls>=44CSSpx, independent original vector graphics. Mobile board is overview, not100 tiny action targets. The interactive dice/pause remain native large targets. Short-landscape uses side-by-side270px overview.

Telemetry: existing service remoteCollectionEnabled:false pending root Worker authorization; game_open/run_start/run_end/retry/pause/resume/return_to_portal plus specific_game_events dice_roll, promotion, transfer, finish (other settle descriptions use primitive event strings). Payload includes only visible die/player/position and aggregate counters. Never local resultId, board history or user identifiers in game-specific payload. CPU/human dice obey identical model.
