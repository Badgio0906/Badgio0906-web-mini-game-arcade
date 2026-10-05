# Game018 revision 01 — illustration and spin guidance

2026-10-05. User's integrated request section 3 and section 4 implemented.

## Visual direction and states

Original Canvas profile illustration takes direction from the attached boy: lively brown spiky hair, white expressive eye, grinning profile, red T-shirt, blue denim shorts, and a visible bare kicking foot. No attached image is pasted, no remote art or generated asset is used. The source paths are the production asset and remain resolution independent. Waiting/title, pendulum preparation, drawn kick with planted leg and release trails, connected ankle closeup, and result cheer share the same illustration. A title kick composition fits narrow screens without cutting off the airborne shoe. Screenshot-derived thumbnail is handled by integration.

The red toe-forward shoe attached to the foot is removed at release; its launch and brief spin lead into the production shoe flight. Existing five shoes, timing, gravity/drag/lift, scoring, run duration, storage prefix and best keys are preserved.

## Spin meaning

Production physics has positive world rotation = counterclockwise; Canvas y points downward and renders `-rotation`. Positive input is therefore **left / counterclockwise**, negative **right / clockwise**. Existing old L/R HUD text was inconsistent with visible rotation. HUD, ankle tilt, rotating left/right shoe previews, selected-direction arrow and feedback now match the actual rendering.

The integrator already uses absolute spin magnitude for flight stability and penetration: opposite signs of the same strength have **the same flight path and score**, but opposite rotation. Explanation, live feedback and practice explicitly teach that rule rather than promising a nonexistent left/right bend. The live trajectory uses the production integrator at POWER 80 and quantized angle/spin to bound preview work; it never scores or writes BEST. Actual selected shoes are used in all examples.

Practice retains four steps: angle routes, ankle direction and live trajectory, power and JUST MAX bonus, then a complete flight. Every title has `すぐ遊ぶ / 説明を見る / 練習する`. Fresh local storage can immediately select a shoe/start. Explanation, active practice and practice step completion retain a skip action; existing practice completion flags remain compatible and do not gate real runs.

## Verification evidence and limits

- Game018 model unit tests **31 PASS**, including opposite-direction path/score invariance and production-integrator preview parity.
- TypeScript check and Vite production build PASS after shared telemetry updates.
- Preliminary normal-input full runs at 1440×900, 390×844, 320×640 all reached result without page errors or horizontal overflow before final composition corrections. Title/SPIN/kick/result captures are in `QA/`.
- Final composition recapture confirmed corrected desktop and 390px title/SPIN graphics; that recapture's later phone completion was interrupted by HMR during ongoing integration and its JSON only records the desktop completion. This is preliminary evidence, not a fixed-source final QA result. Final integration/production QA must recheck fresh skip, full practice, five shoes, PC/phone and the resulting thumbnail.
- Author inspected captures separately from implementation and corrected narrow title shoe cropping and wide-layout stretched spin text. Independent Visual/Feel review and physical-device/human amusement judgments are not claimed here.

No external Jev API, live advertising, credits flag, shared catalog, font or asset ledger was changed by this implementation worker. Parent integration owns the catalog/title profile, font coverage and production publication.
