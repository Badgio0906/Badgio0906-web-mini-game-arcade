# Game031 independent browser QA

Recorded 2026-10-08. Agent game031_browser_qa owns only QA scripts/evidence; product fixes and Jev calls were handled by the parent. Jev answers stayed hidden from this independent reviewer. Actual start timestamps are the `at`/`recordedAt` fields in JSON; directory labels are identifiers, not asserted execution times.

## Verified before publication

- Phase A 32³: ordinary mouse/keyboard built a one-block step and jumped onto it; a placed bridge remained after its support was mined. `independent-building-20261007T2339Z/REPORT.json`.
- Full world 128×64×128: headless Chromium touch emulation mined 10 and placed 5; trusted simultaneous joystick/look/DIG, touch cancel, actual capture acquisition/loss, landscape/narrow layouts, native save/reload, and practice isolation passed. `independent-full-mobile-20261008T0017Z/REPORT.json`. Practice mined/placed one without changing the main save or RUN.
- Final source 03: real Pointer Lock request/mining/Esc pause; light/standard/auto preserve edited world, inventory and 343-voxel neighborhood hash after fresh dirty-queue settling; real WebGL lose/restore extension preserves the world. Unsupported WebGL is explicitly a forced-null test fixture; it leaves the existing IndexedDB save unchanged and provides a Portal link. `independent-final-platform-20261008T0034Z/REPORT.json`.
- Edit rendering metric after one edit while the initial queue drains: 1.7 ms immediately, 21.6 ms after the affected neighbor was rebuilt; it remains 21.6 ms as unrelated dirty chunks finish. This is one software-GPU observation, not an all-device guarantee.
- Final source 03 mobile 390×844, 844×390 and 320×568: actual nonempty feedback has no intersection with the HUD, reticle, progress, joystick/buttons or material children. `independent-final-layout-20261008T0036Z/REPORT.json` and three PNGs.
- Compiled production preview, UI-only desktop: W+Space moves 0.867 m horizontally and lifts 1.242 m; 12 mined/5 placed. Native backup export read only in memory, then save/title/reload/continue preserves terrain and inventory hashes. Portal has 30 active cards, Game031 link, real 640×360 thumbnail, existing AdSense script and Analytics settings UI. `compiled-preview-desktop-after-20261008T0036Z/REPORT.json`.
- Compiled production preview, UI-only phone: trusted multi-touch moves 1.170 m, turns the view and mines; cancellation followed by jump lifts 1.212 m. 12 mined/5 placed and native reload hashes match. Three phone layouts have no control/material/feedback overlap. `compiled-preview-phone-20261008T0040Z/REPORT.json`. `during-dig-130ms.png` visibly shows the target-face crack and progress without blocking the controls.
- Both compiled runs have no production QA API, no browser runtime error and zero Analytics requests. Each records one console error from the unchanged external AdSense script (`ERR_TUNNEL_CONNECTION_FAILED`); this is an external network failure, not a Game031 runtime exception. Script presence is verified; ad delivery is not.

## Failures retained and resolved

All original screenshots/reports remain; success does not replace them. The initial enclosing-material-container overlap alarm and Portal count 27 were runner bugs: actual visible children did not overlap at 390 px, and valid legacy game routes 012–014 were omitted by the route regex. The lost-capture probe initially never acquired/processed capture; the corrected trusted sequence observes got/lost before asserting cancellation. The first quality check read stale previous-frame dirty=0; the corrected check waits for a fresh frame before queue settling. Independent corrective records preserve the original judgments instead of rewriting them.

A real 320 px material-label/DIG overlap was recorded with visible playing state; the parent raised controls. Later real feedback/reticle overlap and edit-metric contamination were separately corrected by the parent and rechecked on final source. Parent owns Shadow API logs and final adoption decisions. This reviewer did not make new Jev calls or inspect the answers.

## Limits and original pending publication check

These are automated actual browser controls, not a human fun review or physical iPhone/Android testing. Software rendering does not establish real-device heat, battery, audio or smoothness guarantees. The full-mobile report's 29 frame samples are only the post-reload segment, not a whole-run performance average. Unsupported-WebGL injection is a fixture, not a real unsupported-device observation.

At the initial pre-publication record, Production URL verification was pending the parent's expected commit/CI/deploy confirmation; the completed follow-up is below. The reusable public runner uses only ordinary input and official backup export in memory; no seed, local world ID, raw backup or fabricated production RUN is committed or sent to Analytics. Consent is denied and the Analytics endpoint blocked in the QA context.


## Completed production follow-up

2026-10-08, parent confirmed runtime commit `aead0cf218558cbe4ead9a8a4d15251c56070430`, official Pages workflow `37709128212` build/deploy success and independent public asset hashes. Those CI/version checks were performed by the parent; this browser report records the expected SHA without claiming to independently infer it from the screen.

- Actual `https://game100garage.com/game031.html`, desktop: report `public-desktop-20261008T0050Z/REPORT.json` began **00:47:49.332Z**. Ordinary movement 0.933 m/jump 1.174 m; **11 mined, 5 placed, 6 held**, four edited chunks. Native save/title/reload/continue retains exact terrain and inventory hashes. Backup bytes differ 676→687 because metadata/player state can vary; the terrain/inventory comparison is the relevant invariant.
- Actual same production URL, phone emulation: `public-phone-20261008T0051Z/REPORT.json` began **00:48:27.761Z**. Trusted three-finger movement/look/DIG and cancellation followed by jump; 1.170 m horizontal movement/1.177 m lift; **12 mined, 5 placed, 7 held**, four edited chunks. Native reload hashes match. Portrait390, landscape844 and narrow320 show no material/control/feedback intersections. `edited.png` and `during-dig-130ms.png` were independently viewed.
- Both production runs: no DEV QA hook, zero runtime page errors and zero Analytics requests; denial plus explicit endpoint blocking keeps test play out of production Analytics. Portal has 30 cards, Game031 link, 640×360 loaded thumbnail, original AdSense script and Analytics consent/settings UI. The only console error is the unchanged AdSense resource's external network tunnel failure. Ad serving was not verified.
- Existing configured proxy was used through optional `GAME031_USE_PROXY=1` in the reusable runner. Credentials/URL are not output or persisted; TLS validation remains enabled. No public source/settings/auth change was made to enable testing. The cloud-runtime skill, current enforced host policy and allowed destination were directly checked before the production run.

All browsers were closed after these runs. The author has not personally played this prototype; actual iPhone/Android touch feel, heating and sound remain untested. No human fun judgment is inferred from these automated checks.
