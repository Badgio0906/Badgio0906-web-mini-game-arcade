# Visual baseline — Game002–005

Captured from commit `27562df57b1ebf33ecab7961d9bd86a017cedc31` before integration. All 37 recorded source files still matched their original SHA-256 hashes after capture.

| Game | Desktop gameplay (1440×900) | Mobile gameplay (390×844) |
|---|---|---|
| 002 | [game002-desktop.png](game002-desktop.png) | [game002-mobile.png](game002-mobile.png) |
| 003 | [game003-desktop.png](game003-desktop.png) | [game003-mobile.png](game003-mobile.png) |
| 004 | [game004-desktop.png](game004-desktop.png) | [game004-mobile.png](game004-mobile.png) |
| 005 | [game005-desktop.png](game005-desktop.png) | [game005-mobile.png](game005-mobile.png) |

Each pair also has `-title.png` and `-over.png` variants, for 24 screenshots. [CAPTURE_RECORD.json](CAPTURE_RECORD.json) records viewport, state and read-only model inspection at capture time. The screenshots use actual Chromium at device scale 1; mobile is browser touch emulation, not a physical device test.

Game002 shows an approaching pedestrian, then naturally collides without input. Game003 uses ordinary timed DROP inputs to accept three crates, then an off-support release naturally falls. Game004 shows an actual lit WATCH cue before an ordinary wrong cell click. Game005 makes eight ordinary correct decisions, waits for its existing entrance animation, then makes an ordinary wrong decision. No model state writes, forced endings or clock acceleration are used.

Source hashes are in [GAMEPLAY_BASELINE.json](../GAMEPLAY_BASELINE.json). Models, contracts, core and gameplay manifest fields stay immutable; presentation files require manual behavior-diff review. Main Agent may change only manifest `visual_identity` after visual acceptance; original hashes remain as evidence. The capture script is [capture-before.mjs](../capture-before.mjs), and must not overwrite this baseline after integration.
