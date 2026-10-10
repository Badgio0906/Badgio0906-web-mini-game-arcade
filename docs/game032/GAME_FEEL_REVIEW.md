# Game032 independent control and loop review

Reviewer: `fishing_independent_qa`, separate from implementation and blind to Jev answers. This is a Codex technical control review using browser input and screenshots, supported by deterministic rule simulations. It is **not** human playtesting, a fun verdict, physical phone handling, audio listening or device heat measurement.

## Decisions supported by the implemented loop

- River points are mechanically distinct: shallow near casts favor small fish, rock medium casts favor yamame, shaded near casts favor amago/iwana, and far pool casts favor larger fish. Independent all-species simulations verify that a landed fish is earned through the fight rather than being awarded merely for choosing a point.
- Hold duration selects near/medium/far. Far casts are not universally better because point matching changes bite probability and fish selection. The displayed distance and cast animation are visible before waiting.
- Waiting, small nibble and full bite are separate phases. The persistent status text differentiates the warning from the actual hook opportunity; Enter during the visible full bite successfully hooks in the ordinary browser run.
- The fight has a readable choice: release on a strong pull, hold during calm. Independent deliberate-input simulations land every species; always hold breaks the line and never hold fails to land. The ordinary PC browser sequence also lands a catch using these cues.
- Misses return to another cast without ending the outing or imposing an extra score penalty. A bounded no-catch retry in the automation is not reclassified as product failure or a guaranteed-catch requirement.
- Optional unlimited practice exercises the same cast/bite/fight flow, with BEST and completed-standard result records kept separate. The standard outing uses five active minutes; pause freezes the same outing rather than starting another one.

## Readability and continuity actually inspected

The fixed-candidate PC bite/fight/land PNGs are under [QA/candidate-02/browser-independent-01/](QA/candidate-02/browser-independent-01/). The character, connected rod/line, visible river and controls stay in one scene across phases. The fixed near-cast float sits on visible shallow water; the previous candidate's partly shore-blended float is retained as before evidence. Persistent labels and tension/charge meters supplement the animation, so the required timing is not communicated only through a small image change.

Final independent browser execution passed **93/93 checks** across 1280×900, 390×844, 320×740 and 844×390; source hashes stayed fixed, page errors and POST attempts were zero. [Browser receipt](QA/candidate-02/browser-independent-01/REPORT.json) and [technical QA](INDEPENDENT_QA.md) distinguish ordinary random-catch flow from the separate scripted-RNG latest-catch display regression.

CDP touch press/release successfully selected cast distance and reeled during calm at all three phone-equivalent widths. The original93-check run used keyboard Enter for the hook. The later [candidate03b supplement](QA/candidate-03/browser-supplement-01/REPORT.json) additionally completed a phone-equivalent **entirely-touch CAST/HOOK/REEL catch**, with no keyboard hook and no practice BEST write. This establishes browser input plumbing, not physical-thumb comfort. PC continuous arrow movement reached all four points; mobile touch movement reached the next point and returned. Persistent labels and charge/tension meters remained visible in the archived width-specific bite/fight/land images. The PC standard outing completed its five-minute virtual clock, retained only its completed score as BEST, and restarted/reloaded correctly. A second same-species catch updated both measured size and points in the journal.

No human reaction-time or novice catch-rate conclusion is inferred from scripted inputs. Simulation uses ideal policy timing, while browser automation reads exposed phase/pull DOM cues. Neither measures whether a person finds this relaxing, suspenseful or worth replaying.

## Limits for human follow-up

Human play should assess whether the warning/full-bite distinction is easy without reading the status continuously, whether release/reel rhythm remains pleasant for five minutes, whether mobile scrolling and controls feel comfortable, whether the float is easy to follow on an actual phone, and whether ambience/short cues are balanced. Physical iPhone/Android touch, audio listening, fatigue and subjective enjoyment are not verified by the present automated evidence.

Technical control acceptance in the measured cases and human enjoyment remain separate. A real-clock automated [9-second motion clip](QA/candidate-03/motion-02/movement-cast-reel-9s.webm) and [event timeline](QA/candidate-03/motion-02/REPORT.json) are now available for motion review; capture alone does not establish human comfort or sound timing. The original still review is not retroactively described as a video review.

The final desktop dialog-size correction was independently rechecked by [ordinary help/Portal operations](QA/release-candidate/dialog-reachability-01/REPORT.json) at all four widths: Practice and the scrolled lower-menu Portal actions worked with normal click/tap, and the previously offscreen PC link fits. This resolves that measured navigation defect; it does not change the human-review limits above.
