# Web Mini Game Arcade — Visual Library

This library reserves distinct visual territory for the arcade. Game002–005 redesign direction was decided after actually viewing saved desktop1440×900 and mobile390×844 BEFORE images on2026-10-04. Individual production decisions and exact image-generation prompts/adoption are recorded in [visual briefs](visual/) and [IMAGEGEN_LOG](visual/IMAGEGEN_LOG.md). No gameplay changes are authorised by this library.

## Visual Identity Matrix

| Game | Art Mode | Visual Keywords | Main Palette | Character/Object Style | Background Style | UI Style |
| --- | --- | --- | --- | --- | --- | --- |
| Game002 WORKDAY DODGE | ASSET DRIVEN | COMIC URBAN, morning, human, street, serious-in-silly-situation | Paper#fff3df, navy#24384a, coral#e86c50, mustard#edb849, leaf#6d9179 | Overhead three-quarter adult comic commuters, distinct silhouettes, suited hero with bag | Four Japanese neighbourhood edge illustrations, clear code pavement | Comic print masthead, itinerary/work-ticket, bold metres, small CREDIT |
| Game003 DROP TOWER | HYBRID | ILLUSTRATED INDUSTRIAL, building, height, sky, precision | Sky#c5dfdf, blueprint#344b60, concrete#e9e3d5, brick#bd7362, sage#8da699, ochre#dcb451 | Complete rectangular front-elevation building floors, exact physical body visible | Low-town panorama receding into quiet sky/cloud layers with existing camera | Architectural elevation ledger, thin ruler frame, squared mechanical DROP switch |
| Game004 ECHO GRID | HYBRID / UI-FOCUSED | RETRO DEVICE, memory, machine, concentration, tactile | Charcoal#222827, warmsteel#66716a, bone#ddd3b8, keydark#38423d, amber#f2bd62, error#b55b4c | Physical instrument enclosure and exact code nine-key light surface | Quiet workshop bench, material depth and subtle cables; low-contrast context | Stamped mono instrument labels, small serif specimen title, warm hardware readout |
| Game005 SORT SHIFT | HYBRID | COLORFUL FACTORY, sorting, motion, mechanical pop | Ivory#fff1d3, purple#3d334f, coral#ec775d, teal#65aaa1, yellow#efc64b, dark#433b62 | Round capsules and sharp angular products with honest luminance and code symbols | Illustrated machine periphery + real code belt/rollers | Bold overhead routing sign, chunky mechanical controls, high-contrast RULE |

Palette entries describe the approved direction rather than immutable colour-token requirements. Final measured screenshots and scores determine acceptance; coherence and readable controls take priority over exact hex values.

## Game002 — Generated Asset List / Boundaries

Production plan: coherent transparent commuter atlas (hero facing north; five differently dressed south-facing pedestrians), four district building-edge illustrations, faithful gameplay thumbnail. The final adopted filenames and sizes are listed in IMAGEGEN_LOG; unused originals/concepts stay outside production. Code provides all lane geometry, destination warnings, shadows, score/buttons/text and collision feedback. Costumes are visual variation by existing id, never new enemy types.

Avoid: emoji people, recoloured clone cast, repeated primitive houses, corporate/SaaS cards, dense centre-road art, perspective mismatched to lane positions, oversized apparent collision bodies, excessive comic particles.

## Game003 — Generated Asset List / Boundaries

Production plan: five flat front-elevation building-floor facades, quiet lower-city/sky illustration, faithful gameplay thumbnail. Code fits facade to every existing full cargo rectangle, supplies crane/projection/support diagnostics, mass and precise text. Camera-height styling affects backdrop only; architecture has no mass/difficulty implications.

Avoid: wooden-crate identity, clipped overlap bodies, protruding balconies/cornices outside the physics rectangle, isometric perspective, lost support markers, warning-tape clutter, invented accepted floors, copied002comicpeople, neon blue technology.

## Game004 — Generated Asset List / Boundaries

Production plan: required whole-device concept reference, optional adopted quiet workshop material fragment, actual-device thumbnail. Concept-only generation is valid and must be logged as reference use. The9buttons, hitareas, numbers, phase/status, exact light classes, replay and focus are code; no generated control is interactive. Off-gap has immediate unlit state, without art-induced illumination tails.

Avoid: generic dark dashboard, mint software cards, fake controls embedded in images, generated numeric legends, phase-dependent grid movement, competing background motion, excess knobs/glow, result covering automatic replay.

## Game005 — Generated Asset List / Boundaries

Production plan: four product materials/sprites (ROUND/ANGULAR×LIGHT/DARK), factory-periphery illustration, faithful gameplay thumbnail. Existing code sets exact silhouette and sizes; if a generated exterior is ambiguous, use only its interior material clipped to the correct code silhouette. Circle/cross, arrows, rule labels, timer and correction are code. Production may reject an attractive asset if it weakens attribute recognition.

Avoid: round-looking ANGULAR bevels, projecting handles/gears, equal-luminance LIGHT/DARK, generated symbol/text, scenery products mistaken for current parcel, animated target distracting from deadline, holographic blue, repeated002paper/mint interface, decoration outranking RULE.

## Rules for Future Concept / Art Direction

- Compare proposed games against this matrix before selecting a palette, layout and art mode. Reuse technical interfaces while giving genre-appropriate material and typography.
- Decide generated/code/hybrid boundaries in the brief first; inspect a saved current image before redesigning an existing game.
- Use image generation for the identity-defining material/object/context, code for precision and every changeable or important label.
- Do not copy the same left marketing column plus rounded centre card into every game. Let the game object shape the layout: street, elevation, instrument, routing machine.
- Optimise adopted images for their actual small gameplay size. A large impressive concept is not automatically a useful runtime asset.
- Capture desktop/mobile after integration and inspect them independently. Required visual gate: total≥80/100, Gameplay Readability≥12/15, Production Value≥12/15. Maximum3 iterations; otherwise mark `HUMAN ART REVIEW REQUIRED`.
- Scores are reviewer judgements of observed screenshots/interaction, not proof of player enjoyment or physical-phone performance. Human art/playtesting remains the final publication judgement.

## Production Status

All4 BEFORE captures, Art Director briefs, image-generation steps, integrations and independent visual reviews are complete. Seven actual image-generation calls produced all4 directions. All4 games passed the independent screenshot gate on Iteration1. Art Director inspected and accepted originals/references plus optimised production samples; exact independent scores appear below. These art passes do not replace regression QA or human judgement.

| Game | Actual Generated / Adopted Assets | Runtime Image Cost Before Thumbnail | Art Director Evidence |
| --- | --- | ---: | --- |
| Game002 | `public/assets/game002/hero.webp`, five `commuter-*.webp`, eight `district-{residential,shopping,station,office}-{left,right}.webp`; two generated originals under `assets/game002/` | 254,412bytes | Original cast/districts, optimised hero/residential/station flanks, initial mobile gameplay actually viewed; accepted coherent comic material and readable direction |
| Game003 | `public/assets/game003/module-{cafe,apartment,office,mechanical,utility}.webp`, `city-sky.webp`; two generated originals under `assets/game003/` | 57,098bytes | Generated five-facade atlas plus optimised café and city/sky actually viewed; central4:1 crops accepted, exact code full-body border required |
| Game004 | `assets/game004/concept/device-reference.png` — reference only, no runtime concept image | 0bytes | Whole generated instrument actually viewed; graphite/brass/bone/amber accepted for code reconstruction, real nine native keys required |
| Game005 | `public/assets/game005/product-{round,angular}-{light,dark}.webp`, `factory.webp`; two generated originals under `assets/game005/` | 89,992bytes | Original four products plus optimised angular-dark and factory actually viewed; honest shape/luminance and coherent tactile machinery accepted |

The exact file list, generated source identifiers, prompts, crops, resolutions and optimisation evidence live in [IMAGEGEN_LOG](visual/IMAGEGEN_LOG.md) and asset-index files. Faithful actual-game thumbnails add only their measured image bytes after final screenshot acceptance. Independent A–H scores and remaining issues are recorded in [VISUAL_REDESIGN_REPORT](VISUAL_REDESIGN_REPORT.md).

## Independent Visual Gates

| Game | Iteration | A / B / C / D / E / F / G / H | Total | Gate | Evidence / Remaining Art Limits |
| --- | ---: | --- | ---: | --- | --- |
| Game002 | 1 / 3 | 14 / 12 / 8 / 8 / 8 / 14 / 6 / 12 | 82 / 100 | PASS | [Actual desktop/mobile review](visual/GAME002_VISUAL_REVIEW.md); all4districts, B/C warnings and two-person wave seen. City strips still visibly repeat; walking/bag motion is modest rather than a multi-frame character animation. No mandatory revision. |
| Game003 | 1 / 3 | 14 / 13 / 8 / 9 / 8 / 13 / 7 / 13 | 85 / 100 | PASS | [Actual desktop/mobile review](visual/GAME003_VISUAL_REVIEW.md);3/8floors, Perfect, camera rise and support-edge fall seen. Cloud/distant-city repetition remains, and fine projection/ruler visibility needs real-device/outdoor confirmation. No mandatory revision. |
| Game004 | 1 / 3 | 13 / 13 / 6 / 9 / 9 / 14 / 8 / 13 | 85 / 100 | PASS | [Actual desktop/mobile review](visual/GAME004_VISUAL_REVIEW.md); WATCH lit/off, RECALL, wrong/expected and visible replay seen throughLEVEL6. Physical code device is coherent, but workshop context is chiefly repeating material with limited laboratory depth. No mandatory revision or light-state delay. |
| Game005 | 1 / 3 | 14 / 14 / 8 / 9 / 9 / 14 / 7 / 13 | 88 / 100 | PASS | [Actual desktop/mobile review](visual/GAME005_VISUAL_REVIEW.md); all4attributes, reversed routing, wrong correction and normal dispatch frames seen through33sorts. Background machinery/rollers remain static; current parcel dispatch animates, with modest peripheral motion richness. No mandatory revision. |

Thresholds are total≥80, F≥12/15 and H≥12/15. These are independent Visual Reviewer judgements based on actually viewed1440×900 desktop and390×844 mobile scenes, not an Art Director self-score. Human art preference, first-time interpretation and physical-phone performance remain unmeasured; a reviewer PASS does not constitute final public-release approval.

## Faithful Game Thumbnails

| Game | Accepted Thumbnail | Dimensions / Bytes | Provenance |
| --- | --- | --- | --- |
| Game002 | [WORKDAY DODGE](../assets/game002/ui/thumbnail.webp) | 640×360 /35,172bytes | Accepted actual desktop gameplay crop with existing heading, liveHUD, commuter and street. No invented advertising scene. Source hash/crop recorded in adjacent `thumbnail.json`; Art Director actually viewed the final WebP. |
| Game003 | [DROP TOWER](../assets/game003/ui/thumbnail.webp) | 640×360 /20,012bytes | Accepted actual8-floor desktop crop retains liveHUD, crane, sky, city and full module bodies. Source hash/crop recorded in adjacent `thumbnail.json`; Art Director actually viewed the final WebP. |
| Game004 | [ECHO GRID](../assets/game004/ui/thumbnail.webp) | 640×360 /11,076bytes | Actual completed code device in WATCH with one amber key, liveLEVEL and instruction plate. No generated fake-control concept image used. Source hash/crop recorded in adjacent `thumbnail.json`; Art Director actually viewed the final WebP. |
| Game005 | [SORT SHIFT](../assets/game005/ui/thumbnail.webp) | 640×360 /25,456bytes | Actual completed factory face with one LIGHT angular×parcel, SORTED8, activeRULE and deadline. No additional scene products or altered geometry. Source hash/crop recorded in adjacent `thumbnail.json`; Art Director actually viewed the final WebP. |

All4 thumbnails are accepted and total91,716bytes. They are local catalogue assets under `assets/`, outside the runtime `public/` directory; they do not create a portal or add initial game-load cost. [THUMBNAILS](visual/THUMBNAILS.md) records source-crop evidence for every accepted export. The library and brief decisions are now final for this redesign: all4 gates passed Iteration1, with no mandatory art revisions; human art judgement and physical-device testing remain pending.
