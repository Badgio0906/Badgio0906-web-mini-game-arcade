# Game005 title/UI revision — independent review

Status: **PASS for the implemented revision; first-time human comprehension and fun pending.** Actual frozen Chromium execution at 1920×1080 and touch-enabled 390×844; ordinary native clicks/taps with read-only inspection for later rule planning. `after/game005-CAPTURE_RECORD.json` records observations. No gameplay state was forced.

## Learn before the clock starts

Title PLAY now leads to explanation, then an optional two-item practice. The explanation visibly covers all five required items: compare the current condition to the parcel; select its left/right destination; rules change; wrong sorting or timeout ends the real run; PC arrows/A-D and phone left/right taps. The default example explicitly labels round→left and angular→right. The short introductory hierarchy and illustrated pair provide an understandable first ten seconds without starting the decision timer.

Both desktop and phone were exercised through a wrong first practice input, correct round-left, then correct angular-right. Wrong input stays at step 0 with reassuring guidance. Completion reaches step 2. Throughout all three observations: SORTED 0, COMBO 0, model time 0, CREDIT 3, no live run. Real play begins only through the normal 本番へ button; experienced players may bypass practice. These are observed training behaviors, not a claim that every first-time human understood them.

The immediate mobile tutorial screenshot caught the angular image before loading. A separate settled 1-second recheck shows both 85×85 illustrations correctly, with no persistent missing image. The settled capture is `game005-mobile-tutorial-settled.png`; its measurements show no page overflow and tutorial actions 44/48 pixels high. Initial loading is recorded honestly; the shape labels remain visible during it.

## Size, rule hierarchy and result

`右往左往の仕分け術` is primary, SORT SHIFT secondary. Japanese rounded text reads clearly beside digits, symbols and English rule labels. The actual conveyor at 1920 grows **560×270 → 950×460** (about 2.89× area), while the mobile conveyor stays 316×180. Desktop parcel is 190×190; the expanded board supports the larger play area instead of merely expanding blank margins.

Both native-input runs reached 33 sorted and all four dimensions, then the reversed shape mapping after 32. The RULE CHANGE view announces the new mapping; it remains outside the timed decision phase. A normal wrong-side choice ends each run and exposes the selected side and correct direction on the result. Earned result at 33, combo 33, CREDIT 2/3, retry and title fit on the phone. Current rule is above the parcel; result explanation is below the conveyor and does not cover its final item. No blocking readability or flow issue found.

## Evidence and human checks

- `after/game005-desktop-tutorial.png`, `game005-mobile-tutorial-settled.png`
- `after/game005-{desktop,mobile}-practice-{round,wrong,angular,complete}.png`
- `after/game005-{desktop,mobile}-reverse-change.png`
- `after/game005-{desktop,mobile}-over.png`
- `after/game005-tutorial-settled.json`

Human checks remain: explain the game after viewing the first screen; complete practice without assistance; identify every dimension and reversed mapping under pressure; judge whether the result joke and retry prompt feel welcoming; judge whether another CREDIT is desirable. The later 33-sort oracle run checks runtime behavior and UI only, not human cognitive difficulty or fun.
