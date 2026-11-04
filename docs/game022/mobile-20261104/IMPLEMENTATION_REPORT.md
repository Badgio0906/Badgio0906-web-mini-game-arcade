# Game022 mobile revision · 2026-11-04

Implemented against base 70e0260e, within the eleven-game publication request.

- Seven tableau columns now share actual viewport width at 320/390px. Vertical scrolling and selected/dragged cards remain available; obsolete horizontal-scroll instructions were removed.
- Added an optional three-minute score challenge. Score is the maximum foundation count reached, stored separately as `challenge-best-v1`. Returning a foundation card and moving it back cannot inflate the score.
- Challenge disables undo, automatic foundation assist and one-click finish. A full manual clear ends early; otherwise the active-play clock ends at three minutes. Pause, blur, hidden page and explanations stop the clock.
- Ordinary random/daily deals and existing session/clear history keep their previous schema. Challenge does not overwrite an ordinary saved game or add ordinary clears. No external record board was changed.
- The optional two-credit pricing proposal was not activated: this game has no existing credit integration, and the global credits feature remains disabled.

Validation: TypeScript check; 17 model + 2 persistence tests; Chromium 320/390px actual clicks with explicit denied-consent fixture; seven-column overflow measurements 298/298px and 368/368px; challenge countdown 3:00, saved-session isolation, dedicated virtual-clock test of pause and three-minute completion. No page errors. Scripts: `tests/game022/mobile-20261104.mjs` (also covers025), `tests/game022/challenge-clock-20261104.mjs`. Set `MOBILE_REVIEW_BASE` to the preview origin.

Screenshots under QA show actual play at both widths. Implementation-agent visual inspection confirms all seven columns and readable rank/suit labels; independent review is handled by integration. Human enjoyment, device touch feel and physical Safari testing remain unperformed. Source changes are not themselves evidence of production deployment; integration owns build, CI and publication.
