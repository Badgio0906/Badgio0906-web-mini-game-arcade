# QA_REPORT — C21 雷、予約しました。

Verified source commit `1d56b8f91f34cf5afb8d4a5bff6c11b4d4f17587`. Evidence files are in the delivery `SOURCE_HANDOFF/thunder_booking/qa/`.
Implementer self-checks are NOT a substitute for independent QA / Visual / Feel / human playtest.

| gate | result | evidence |
|---|---|---|
| core | PASS | vitest 17/17 on the clean commit (boundaries, duplicates, timing, end conditions, frame-rate invariance) |
| types | PASS | `tsc -p tsconfig.json` |
| build | PASS | native + preview builds |
| static_package | PASS | ZIP structure check, fresh extraction into `展開 テスト thunder_booking`, HTTP root + `/games/thunder_booking/`, 4 viewports, no external requests / 404 / bad MIME / console errors / horizontal overflow |
| browser e2e (static HTTP, Chromium headless, fake clock) | PASS 26/26 | real mouse / keyboard / touch input on the extracted ZIP bytes: plan → rank S, BEST persists after reload, pause, retry, practice, preview exit, 44px targets |
| launcher_import | NOT_RUN | no launcher found (LAUNCHER_CONTRACT_UNVERIFIED) |
| launcher_windows_e2e | NOT_RUN | no Windows environment |
| source_handoff | PASS | fresh base clone + bundle + `npm ci` → byte-identical ZIP |
| visual | SELF_CHECK_ONLY / BLOCKED_ART | screenshots reviewed by the implementer; no ImageGen art; no independent Visual 80/100 · F12/15 · H12/15 scoring |
| audio_functional | PARTIAL | synthesized SE code runs during headless e2e without errors; not listened to by a human |
| performance | NOT_RUN | no p95 instrumentation in shipped code; headless timing would not represent real GPUs |
| fun_design | MODEL_EVIDENCE_ONLY | Predictive plan (11 strikes): S, 20,400, 8 six-kills. Reactive "tap where they are now" every 150/300/600ms: rank A, 14,300–14,600, 34–54 strikes, 2 six-kills. Prediction matters for score/efficiency, but reactive spam still clears (see limits). |
| human_acceptance | NOT_RUN | author playtest pending |
| publication | NOT_RUN | not requested |
