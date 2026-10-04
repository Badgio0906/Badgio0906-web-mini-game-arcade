# Independent onboarding Game Feel review

Reviewer: Game Feel Reviewer, separate from implementation and QA. Actual Chromium at 1440×900 (mouse/keyboard) and 390×844 (native emulated touch), frozen DEV5181. Initial source `9a909490…`; the subsequent `d227b99…` candidate changed only Game011 overlay-focus cleanup. No seeded completion, storage, scores, time or forced endings. Final adjacent Game011 focus retarget PASS and Game008 TIME-only result retarget PASS bridge to final fingerprint `ca8c62219c2840d1b87c99f8f001bebb83ef229f3b6e7a1fc2ec6d7c9d143683`; these tiny patches do not alter onboarding/model/clock/art. They are recorded separately in GAME011_FEEL.md and GAME007_008_READABILITY.md.

## Actual first-use and return flows: PASS

Every game 001–011 was entered through its actual portal card, then native PLAY → explanation → interactive practice → success → fresh main. Every game also returned to title, launched directly after completion, opened practice again, closed it and returned through the native portal link. All eleven actual thumbnails loaded. Practices allowed mistakes without ending the real game; Game005 intentionally received the wrong side, Game009 a document rather than the stamp, and Game011 UKON rather than its visible UNKO. Coffee used held native touch on phone. No `run_start` occurred inside practice; the real start occurred after the success button.

Desktop evidence is intentionally split: [initial 001–008 journal](../screenshots/desktop-PRACTICE_RECORD-initial-001-008-harness-selector-failure.json) and [009–011 resume](../screenshots/desktop-PRACTICE_RECORD-resume-009-011.json). The first runner stopped because its `stamp-other` selector matched five native distractors; this was a reviewer harness error. The corrected runner resumed only 009–011. [Phone journal](../screenshots/mobile-PRACTICE_RECORD.json) contains all eleven. Their final page-error arrays are empty.

The explanations introduce the immediate controls and the basic objective without disclosing later optional risk modes. The visible success step makes the transition into a fresh main run explicit. Practice005 teaches the active-rule decision, practice004 watches then recalls, and practice002 actually moves through hazards; these remain different learning actions rather than eleven text-only dialogs. Practice006 visibly retains its stopped angle before the second control. Practice007 explicitly rejects a projected overload. Practice008 teaches the high-left liquid → right correction with matching gauge sign. Practice010 gives a small WORK earning loop followed by LISTEN, and practice011 permits untimed recognition.

## Timing interpretation

| Game | PC mechanical completion, ms | Phone mechanical completion, ms |
|---|---:|---:|
|001|2340|2354|
|002|3898|3788|
|003|823|1242|
|004|2694|2727|
|005|673|530|
|006|2034|2889|
|007|1443|1297|
|008|892|895|
|009|190|148|
|010|2273|2180|
|011|322|150|

These start after explanation dwell and an initial practice capture, use already-known answers and measure native mechanical completion only. They do **not** establish average novice learning time, human understanding, or the desired 5–20-second first-use experience. Artificial waiting was not added to inflate these measurements. Human onboarding K–N remain required.

## English, unrestricted retry and scope

Fresh Game005 native EN toggle produced English explanation, practice, success and main on both devices. Normal title return/reload retained EN and completion; PLAY then entered main directly. [Desktop EN record](../screenshots/game005/independent-desktop-EN_RECORD.json) / [phone EN record](../screenshots/game005/independent-mobile-EN_RECORD.json), errors empty.

The current prototype disables CREDIT restrictions and ads. Actual natural endings in revised007/008/010/011 all exposed immediate ordinary retry; no refill or advertisement was required. Old ten-game CREDIT/reward evidence is historical and is not claimed for this candidate.

For unchanged001–006/009, this review observes practice, transition, fresh main entry and current integrated presentation, not a new long-run milestone/physics review. Protected-model, eight-size clipping, lifecycle and production/subpath QA results belong to their named QA owners. Human fun, voluntary replay, physical-phone latency and public-release approval remain pending.

## Human form (all eleven games)

A first10s; B controls understood; C failure understood; D fair difficulty; E clear score/objective; F fun; G desire to retry; H willingness to continue; I PC/phone readability; J audio/pause. New K explanation understood; L practice controls understood; M practice duration acceptable; N knows what to do when main starts. All remain unperformed for the new candidate. Game001's earlier accepted human playtest does not substitute for K–N on the new onboarding.
