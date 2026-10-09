# Game014 — independent actual-image and technical-feel review

Reviewer `legacy_source_audit`, 2026-10-09T02:36:22Z–02:38:21Z (11:36–11:38 JST). Read-only inspection; no browser / API / Jev answer / production request or implementation change. Root supplied `prototype014-03` browser evidence. Source authority is separately reviewed in [REVIEW_014_CODE.md](REVIEW_014_CODE.md); original source commit `36877d55bb44a41087a61bfd38f3ec395040cb3c`, arcade baseline488916c.

## Exact receipt and provenance

`prototype014-03/REPORT.json` at02:34:30.573Z records **30 checks PASS**, specifically seven checks for each of PC1300×900, phone390×844,320×720 and844×390 plus no external POST / no JS exception. All four ordinary native runs record successful HEART1 followed by ordinary nonheart failure, one final message, native retry / local BEST reload / Portal agreement / Portal reload. Result value is1, not invented stage / point conversion. This reviewer did not execute those operations.

Source `tests/legacy-records/prototype014.mjs` serves the baseline native files through `git show 488916c:public/...` and the changed build through `dist`; it uses ordinary Space / touchscreen input. Normal native URL asserts the original opt-in observer is absent; the separate `qa=1` page uses the already-existing readonly `__fingerHeart` snapshot to observe phases. It does not force game state or expose a new production result control. QA requests are route-fixture isolated and all POSTs abort; reported external POST count is0.

## Actual images opened with view_image

Under `prototype014-03/`:

- `before-desktop-playing.png` / `after-desktop-playing.png`: both native playing, stage1 / success0, HEART pose. They visibly preserve woman / cardigan / flower / hand connection, target hand example, instruction card, title and pink full-width stop control. No new character or hand drawing appears.
- `before-desktop-result.png` / `after-desktop-result.png`: both actual failure, stage1 / success1 of25. Original covered-face pose, Failure headline, Japanese failure copy and native retry are retained. The new outside one-line preparing status shifts / slightly reduces native content, with no cut-off result or overlapping buttons at1300×900.
- `after-desktop-retry.png`: actual playing with palm pose, stage1 / success0 and no previous sharing strip. Different hand is normal timed progression, not a replacement hand design.
- `after-phone-390x844-{playing,result,retry}.png`: genuine portrait playing / failure / renewed playing. Character, hands, current target / success text, full-width stop and retry remain distinct and readable; record strip only during final result. The result still shows success1, then retry shows0. Original moving hand changes to OK pose in the retry capture.
- `after-phone-320x720-{playing,result,retry}.png`: same verified phase sequence on320px width, without horizontal overflow or overlapping outside controls. Playing copy and detailed instruction are smaller than390, but essential title / success / target / stop and result retry remain identifiable. Retry capture is peace-sign pose, not a gameplay rule change.
- `after-phone-844x390-{playing,result,retry}.png`: genuine landscape phases, final success1 then new0; preparing line appears only at result and disappears after retry. Character / hand and original pink card remain visible, but the original native content scales very small in this short-height viewport, including detailed text and retry.

Analytics settings / Privacy footer and top return / optional help controls are visible in these captures. Screenshot presence establishes visible controls, not separate click execution or unchanged privacy code.

## Visual judgment and preserved limitation

For the reviewed record-layer scope, PC and portrait screens preserve the original art / phases / readable result / retry without new overlap: **Desktop85/100, F13/15, H13/15;390px portrait84/100, F13/15, H12/15;320px portrait81/100, F12/15, H12/15.** The outside preparing status is a readable18px noninteractive line, not an unusable large button. Its endpoint-configured sharing branch retains the existing button / status source path; live configured sharing was not tested here.

The landscape screenshot is **not** evidence that the whole native game is comfortably readable on every phone. Its Failure / detailed success count / retry label are very small. The original project uses540×960 viewport with `canvas_items` / `expand` (`project.godot:10–15`) and existing responsive `_layout` (`scripts/main.gd:272–278`); the record patch leaves this untouched. Report03 records native height960 and result canvas256, so original retry62 maps to approximately16.5 CSSpx. This is source / receipt derivation, not a DOM measurement of the Godot button. Playing landscape game area is274px high, while result is256px because of the18px status.

No **before-landscape** screenshot is present in03, therefore exact baseline-to-after landscape visual comparison is unconfirmed. This review cannot certify that all low text readability was already identical before integration; unchanged native source and the small new18px strip support a retained-layout constraint, not a direct image-pair proof. Root was notified promptly. This narrow record integration is visually accepted for PC / portrait and for outside status visibility / teardown, while **full landscape native readability remains a limitation**, not a blanket Visual PASS. No unsolicited native art / gameplay redesign is recommended within this request; preserve original assets and separately prioritize portrait / any later approved layout work.

## Technical-feel evidence and failed probes

Normal success→ordinary failure→retry, original0.65 stage1 interval in readonly snapshots, one authoritative terminal result and stable saved / Portal record are corroborated by root03 ordinary-input trace. The patch source does not change the five stage intervals, HEART success rule, nonheart failure,0.8-second result delay or native controls. This supports preserving existing operation semantics, not a human reaction-time / emotional quality assessment. No human enjoyment or tactile / audio score is assigned.

- `prototype014-01` failure remains preserved; independent [REVIEW_014_PROBE.md](REVIEW_014_PROBE.md) documents old baseline score0 / FAILED / handOK and missing exact input-time snapshot / focus / processing timing. A normal failure screenshot alone does not prove the record integration broke operation. Initial precise cause remains unmeasured; do not retroactively substitute03 input traces.
- `prototype014-02` contains11 checks, the first10 PASS and phone390 retry-control hidden check false. Its retained failureState is already RUNNING state0 / score0, showing native retry succeeded; parent result UI had not satisfied that immediate assertion. Current probe03 waits for `#legacy-record-result` hidden after the native state0 assertion. Parent cross-frame message delivery is asynchronous, and this synchronization change is consistent with source behavior. It establishes the03 positive observation, not a measured02 message-delivery duration. No product input / timer change was needed.
- Report03 input logs record HEART0 / score0 before first input and nonheart / score1 before second for each tested context. DOM capture timestamps are useful trace but do not claim exact Godot frame processing simultaneity. The final authoritative native score and phase supply the outcome evidence.

## Resource / test boundary and remaining unknowns

The original character / hand resources remain visible and source unchanged. Toolchain audit independently reports only three of16384 icon pixels differ by at most1RGB with identical alpha, no source SVG change; that bounded icon import fact is not a visual guarantee for all assets. Native original12156 and added68 tests are another agent's executed source receipts; neither is a full25-success human clear.

Not independently verified here: actual iPhone / Android, sound / intervals perceived by a person, human enjoyment, live public deployment, configured records endpoint submission, full native clear25 in a browser, direct before/after landscape pair, native concurrent-tab ConfigFile behavior. Source / unit protections of0..25 and missing-versus0 are reviewed separately; ordinary browser receipt here tested1. No new product bug requiring a gameplay change was established by this checkpoint.

SHA256 snapshots:

```text
tools/legacy-record-patches/game014/main.gd.patch b112e78396347ff3ba4d6804e3fee1ca1bc55abfaa930a275d6c2c570f9085c6
tests/legacy-records/prototype014.mjs 99e1850d5ffe653e9d89cdfa0b09f7e2337550b84fef93517ec6710f3cec81b4
public/games/finger-heart-challenge/portal-return.css 033a9dc3a21330f645079c36689d69b9597f0d59bac4ec55cd8f8f91f391a1be
QA/prototype014-03/REPORT.json 5350f73a2a8cfa7fadba42497dbe97d7720e8bf8ea352cf82619a91bf2b5cb7b
```


## Checkpoint02 — direct phone baseline comparison, 2026-10-09T02:40Z / 11:40 JST

The original checkpoint's missing-before-landscape limitation was correct at its review time and remains recorded above. New evidence now resolves that specific gap; it does not erase the observed small landscape text or certify physical-device comfort.

Read `baseline-phone014-01/REPORT.json` at02:38:55.225Z, status PASS, no POST / JS errors, and `tests/legacy-records/baseline-phone014.mjs`. The baseline script routes **all** `/games/finger-heart-challenge/` files, including original wrapper CSS / native export, from `git show 488916c:public...`. It uses a normal touchscreen tap during nonHEART and the existing readonly `qa=1` snapshot. No forced score / phase is used. Recorded baseline failure is stage1 / success0 of25, which is a distinct ordinary RUN from changed03 stage1 / success1; same phase and device, not identical score-state trial.

Actually opened six new baseline images using view_image:

- `baseline-phone014-01/before-phone-844x390-playing.png` / `before-phone-844x390-result.png`.
- `baseline-phone014-01/before-phone-320x720-playing.png` / `before-phone-320x720-result.png`.
- `baseline-phone014-01/before-phone-390x844-playing.png` / `before-phone-390x844-result.png`.

Compared with already-opened03 corresponding playing / result images:

1. All three before / after playing pairs preserve the same native layout, characters, hair / flower / cardigan, connected HEART hand, target reference, success0 display, stop instructions, return / help and footer. The playing layout has no result strip in either version.
2. Both before and after landscape result already show a small centered covered-face character, small Failure / failure copy / success count and small retry button. Thus the baseline directly confirms the underlying **short-height native readability constraint predates this record integration**. No original character / hand / expression replacement or fresh UI overlap appears. The new status occupies18px above the game; it is legible and remains outside native art.
3. Baseline result canvas844×274 at y52 versus changed844×256 at y70 differs by exactly18px in height / top offset. Baseline390×728→changed390×710 and baseline320×604→changed320×586 likewise differ by18px. This geometry is independently read from both receipts, not guessed from filenames. Native content correspondingly shifts / scales slightly while keeping all essential result elements visible. Baseline retry itself was already only about17.7CSSpx in landscape (62×274/960); current about16.5px is the same retained legacy scaling with the small informational line added.
4. The result-success text0 before versus1 after is ordinary run variation; it does not prove a modified scoring formula, and source review independently confirms the formula / intervals remain unchanged.

For this user's requested **existing native UI / operation preservation**, the scoped integration comparison is accepted: original playing / result art and controls persist, new record status consumes18px, and retry clears it. No baseline layout / input / character redesign is needed within this task. This conclusion is intentionally **not** a new-game-style all-devices Visual Gate PASS, a44px-native-target guarantee, or a physical phone / human touch assertion. The existing landscape comfort limitation remains explicitly disclosed; portrait remains the more readable observed presentation. Earlier unknown initial input timing and unmeasured02 postMessage delay remain unknown.

Baseline receipt SHA256 `7850c93ae3f4360c8f6f399699c2843e115e5d531588fc6bdc29eab75f4095e6`.
