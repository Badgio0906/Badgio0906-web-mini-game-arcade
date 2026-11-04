# Game012 mobile viewport revision — 2026-11-04

Playing-state layout hides the consent settings footer and uses a44px navigation row. The full stage keeps its960×540 render/input surface and16:9 contain sizing. Phone launch attempts fullscreen and landscape lock from the user gesture; unavailable browser APIs are optional. Fullscreen has a separate retry button. Menu restores settings and unlocks orientation; portrait interruption still destroys the child runtime and requires a new launch. A request epoch prevents an outstanding fullscreen promise from relocking after menu return.

The original PCK/WASM/engine scripts, native score/BEST, records protocol and portrait guide remain intact. Delivered shell and import template match.

Validation: Chromium390×844 portrait guide without engine launch;844×390 and1280×900 launch/frame sizing/footer hiding/menu restoration/no pageerrors. Evidence: [probe](../../mobile-eleven-20261104/QA/game012-probe.json). Initial screenshots showed the native title; refreshed screenshots advance using Enter. Optional physical iPhone fullscreen and orientation lock remain untested. Independent shell/code review found the stale fullscreen callback and it was guarded before final review.
