# QA_REPORT — C22 ずらして、全段ぶち抜け。

Verified source commit `0d2c68ae0d09108767074f660718ff1dafde899d`. Evidence files are in the delivery `SOURCE_HANDOFF/shift_burst/qa/`.
Implementer self-checks are NOT a substitute for independent QA / Visual / Feel / human playtest.

| gate | result | evidence |
|---|---|---|
| core | PASS | vitest 15/15 on the clean commit (boundaries, duplicates, timing, end conditions, frame-rate invariance) |
| types | PASS | `tsc -p tsconfig.json` |
| build | PASS | native + preview builds |
| static_package | PASS | ZIP structure check, fresh extraction into `展開 テスト shift_burst`, HTTP root + `/games/shift_burst/`, 4 viewports, no external requests / 404 / bad MIME / console errors / horizontal overflow |
| browser e2e (static HTTP, Chromium headless, fake clock) | PASS 24/24 | real mouse / keyboard / touch input on the extracted ZIP bytes: plan → rank S, BEST persists after reload, pause, retry, practice, preview exit, 44px targets |
| launcher_import | NOT_RUN | no launcher found (LAUNCHER_CONTRACT_UNVERIFIED) |
| launcher_windows_e2e | NOT_RUN | no Windows environment |
| source_handoff | PASS | fresh base clone + bundle + `npm ci` → byte-identical ZIP |
| visual | SELF_CHECK_ONLY / BLOCKED_ART | screenshots reviewed by the implementer; no ImageGen art; no independent Visual 80/100 · F12/15 · H12/15 scoring |
| audio_functional | PARTIAL | synthesized SE code runs during headless e2e without errors; not listened to by a human |
| performance | NOT_RUN | no p95 instrumentation in shipped code; headless timing would not represent real GPUs |
| fun_design | MODEL_EVIDENCE_ONLY | Full-alignment plan (19 moves, 6 shots): S, 14,920. "Break lowest row by chasing the cannon" (no moves): runs out of shells after 3 rooms, 1,800, C. |
| human_acceptance | NOT_RUN | author playtest pending |
| publication | NOT_RUN | not requested |
