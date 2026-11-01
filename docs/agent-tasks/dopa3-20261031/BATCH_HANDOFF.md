# BATCH_HANDOFF — dopa3-20261031 (C21 / C22 / C23)

Resume from this file and `BATCH_STATE.json`; no conversation, memory or running server is needed.
Spec source: the user's brief「100ガレ｜Claude Codeへ1回で渡すドパ系3本制作指示書」(版1.0, 2026-10-31); its design preflight is saved in
`validation/design_preflight.py` (55/55 pass, output `validation/DESIGN_PRECHECK_RESULTS.json`).

## Where things are
| what | where |
|---|---|
| game source (each independent) | branches `handoff/claude/dopa3-20261031/<slug>` from base `6211019f64a6946d632a9b3620de24a03505410d` → bundles `SOURCE_HANDOFF/bundles/<slug>.bundle` |
| batch ledgers + QA tools | branch `handoff/claude/dopa3-20261031/batch` → `SOURCE_HANDOFF/bundles/batch.bundle` (`docs/agent-tasks/dopa3-20261031/`, `tests/batches/dopa3-20261031/`) |
| playtest ZIPs (author) | delivery `作者向け/` + `SHA256SUMS.txt` |
| per-game evidence | `SOURCE_HANDOFF/<slug>/qa/` (verify log, zipcheck, smoke, e2e report, screenshots) |

Nothing was pushed. No PR / Actions / merge / publish / billing. main, shared files and any launcher untouched.

## Status
| proposal | implementation | static ZIP | real launcher | integration prep | human playtest |
|---|---|---|---|---|---|
| C21 雷、予約しました。 | done (`1d56b8f`) | PASS (26/26 e2e on extracted bytes) | NOT_RUN | INTEGRATION.md + bundle (restore → identical ZIP) | NOT_RUN |
| C22 ずらして、全段ぶち抜け。 | done (`0d2c68a`) | PASS (24/24 e2e on extracted bytes) | NOT_RUN | INTEGRATION.md + bundle (restore → identical ZIP) | NOT_RUN |
| C23 ワープ救助隊、全員まとめて！ | done (`d3d031e`) | PASS (28/28 e2e on extracted bytes) | NOT_RUN | INTEGRATION.md + bundle (restore → identical ZIP) | NOT_RUN |

Overall: **STATIC_READY_LAUNCHER_UNVERIFIED** for each game. Not counted as 3/3 complete because art is BLOCKED_ART
(procedural placeholder), launcher/Windows are unverified, and no human has played or listened.

## Resume steps
1. `git clone https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade && git checkout 6211019f64a6946d632a9b3620de24a03505410d` (or any clone containing it).
2. `git fetch <path>/<slug>.bundle refs/heads/handoff/claude/dopa3-20261031/<slug>:refs/heads/handoff/claude/dopa3-20261031/<slug>` for each needed bundle.
3. `npm ci` at the root; then follow the staging directory's `README_BUILD.md`.
4. `bash tests/batches/dopa3-20261031/verify-game.sh <checkout> <slug> <outDir> <port>` (from the batch branch) re-runs the whole static pipeline.
5. Next work, in order: ImageGen art (needs an approved tool), launcher import/Windows E2E (needs the launcher), author playtest,
   then Codex ID assignment and integration (see each `integration_requests.json`).

## Issues found and fixed during the batch (evidence in commit messages)
- C22: lost synthetic click after a touch drag selected the wrong cannon column → buttons act on pointerdown (click only for keyboard).
- C22: last shell clearing a non-final room left the run hanging → ends as out-of-ammo; landscape panel overflowed 12px → widened.
- C22/C23: missing package metadata/licence found by the clean-commit packaging step.
- QA harness: Playwright fake clock kept flowing in real time; the C21 plan aimed at the first millisecond of each 6-kill window → clock paused, plan targets window middle.

## Design observations for the author (not fixed: design decisions)
- C21: tapping the current centroid repeatedly still clears with rank A (prediction raises score/efficiency, not survival).
- C21: six-kill windows range 150 ms → 3240 ms across formations.
- C23: inlet misses also reset the streak (interpretation).
