# QA_REPORT — C23 ワープ救助隊、全員まとめて！

Verified source commit `d3d031e82671775e92e4cbd9ca5a0b67754930e4`. Evidence files are in the delivery `SOURCE_HANDOFF/warp_rescue/qa/`.
Implementer self-checks are NOT a substitute for independent QA / Visual / Feel / human playtest.

| gate | result | evidence |
|---|---|---|
| core | PASS | vitest 12/12 on the clean commit (boundaries, duplicates, timing, end conditions, frame-rate invariance) |
| types | PASS | `tsc -p tsconfig.json` |
| build | PASS | native + preview builds |
| static_package | PASS | ZIP structure check, fresh extraction into `展開 テスト warp_rescue`, HTTP root + `/games/warp_rescue/`, 4 viewports, no external requests / 404 / bad MIME / console errors / horizontal overflow |
| browser e2e (static HTTP, Chromium headless, fake clock) | PASS 28/28 | real mouse / keyboard / touch input on the extracted ZIP bytes: plan → rank S, BEST persists after reload, pause, retry, practice, preview exit, 44px targets |
| launcher_import | NOT_RUN | no launcher found (LAUNCHER_CONTRACT_UNVERIFIED) |
| launcher_windows_e2e | NOT_RUN | no Windows environment |
| source_handoff | PASS | fresh base clone + bundle + `npm ci` → byte-identical ZIP |
| visual | SELF_CHECK_ONLY / BLOCKED_ART | screenshots reviewed by the implementer; no ImageGen art; no independent Visual 80/100 · F12/15 · H12/15 scoring |
| audio_functional | PARTIAL | synthesized SE code runs during headless e2e without errors; not listened to by a human |
| performance | NOT_RUN | no p95 instrumentation in shipped code; headless timing would not represent real GPUs |
| fun_design | MODEL_EVIDENCE_ONLY | Inlet+arrival reading (spec reference schedule): 60/60, 21,200, S. Inlet only with fixed exit A/S/D: 32/31/28 rescued (C). Inlet fixed centre, no other input: 7 (C). Matches the spec design preflight (32/31/28). |
| human_acceptance | NOT_RUN | author playtest pending |
| publication | NOT_RUN | not requested |
