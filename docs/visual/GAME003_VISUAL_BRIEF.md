# GAME003 — DROP TOWER Visual Brief

Art Director decision, 2026-10-04. Art Mode: **HYBRID / ILLUSTRATED INDUSTRIAL**. Existing full-size cargo physics, all parameters, scoring, controls and services remain unchanged.

## Current Screenshot Review

Actually viewed desktop1440×900 and mobile390×844 gameplay BEFORE: three wooden cargo boxes, an almost empty warehouse wall and repetitive warning dashes. Position and projection are clear, but neither boxes nor backdrop communicate building a city. Mobile has ample vertical stage, which should become a view from ground to sky rather than more interface.

## Design Goal

Build a tiny vertical city, floor by floor, with an illustrated architectural elevation identity. Every accepted cargo becomes a complete building floor, retaining the exact original rectangular body. Looking higher changes the backdrop visually without adding world rules.

## Mood

Editorial architectural illustration, crisp outlines, weathered pastel facades, quiet construction precision. Palette: sky `#c5dfdf`, blueprint ink `#344b60`, concrete `#e9e3d5`, brick `#bd7362`, sage `#8da699`, safety ochre `#dcb451`. Warm windows add appeal; excessive caution striping does not.

## Composition

- Virtual600×720 stage, existing cargo coordinates, full width/height and camera transform preserved. Generated front-elevation module image is fitted exactly inside each cargo rectangle (height around40 virtualpx); no roof ledges, stairs, balconies or perspective extrusion outside the body.
- Low backdrop: distant illustrated town and ground foundation. As the existing camera rises, the city scrolls away; understated sky, cloud layers and later warmer upper sky appear. This is cosmetic parallax keyed to existing camera/height only, never difficulty.
- Desktop title becomes an architectural elevation/specification heading rather than another comic hero. Small thin grid/ruler lines and a narrow height ledger lead into the game. Mobile keeps FLOORS largest, then HEIGHT, best and compact pause.
- Crane gantry remains above play and line/projection stays precise. Mass label can sit on a contrasting small code tag; never disappear into generated windows. Weak-support line/load marker always drawn above modules.

## Character/Object Design

Generate five building-floor facades: brick cafe floor with blank awning; sage apartment floor; blue-gray office floor; cream mechanical/service floor with vents; pale rooftop/utility floor. All are straight-on flat rectangles of the same illustrative grammar. Broad windows and panels survive a24px-high mobile scale. Choose appearance deterministically from existing cargo id; mass/width remain model values, not material-dependent. Foundation is code steel/concrete with a few bolts; no wooden crate textures remain as the main body.

## Background

Generate quiet lower-city panorama with layered roof silhouettes, foreground construction foundation and clear sky, no signs/text or people occupying play. Crop sky/ground layers for lightweight parallax if useful. Code sky washes may extend it upward with thin clouds, a distant moon/aircraft only if tiny and non-distracting. Background contrast stays lower than tower edges; no tall skyline competes with current floor.

## UI

Condensed bold sans architectural headings (`Impact`/`Arial Narrow`/sans fallback), measured monospace numeric labels and regular Japanese sans instructions. Squared thin steel frame, restrained paper/concrete surfaces, small ochre rivet/tag accents. Primary DROP is a mechanical rectangular switch with44px minimum. Start/result look like construction inspection slips, not dashboard cards. Do not cover stack evidence or change action bounds on short screens. Exact existing label values and button semantics remain.

## Animation

Existing land event: brief thin seam shine, restrained dust settling, tiny visual snap compression restored immediately, never alter physical cargo. Existing perfect popup uses small blueprint/ochre seal style. Existing instability/collapse retains original transform timings and support diagnostic; images follow those exact visual poses. Cloud parallax is slow, pause-aware and disabled under reduced motion. No new gameplay sound/difficulty parameters.

## ImageGen Plan

1. **Generate module atlas:** “Five isolated architectural floor-module sprites for a small sophisticated illustrated construction arcade. Straight-on flat front elevation, no perspective, each is a complete horizontal rectangular facade with strong outer rectangular edges and NO elements protruding outside. Five consistent modules: brick cafe with blank striped awning, sage apartment windows, blue-gray office windows, cream mechanical vents, pale utility rooftop floor. Fine dark-blue outline, warm paper textures, broad simple windows readable at tiny size. Equal separated cells with transparent background, no cast shadows, no text, no numbers, no watermark, no crane, no labels.” Target usable facades about320×80 each, crop to exactrectangle and scale per existingcargo.
2. **Generate city/sky:** “Illustrated architectural elevation background for vertical building arcade, small Japanese-inspired town silhouettes low along bottom, distant layered roofs, pale teal sky occupying upper two-thirds, a few soft thin clouds, editorial ink and muted warm paper palette matching pastel floor-module facades. Low contrast and uncluttered central stacking space, no text, no logos, no foreground tower, no people, no objects intruding into central play.” Runtime lower-city panorama about600×360, optional small cloud fragment.
3. **Code:** exact floor rectangles and spritesize, rope/hook guides, foundation, projection, weak-support markers, mass, floor/meter text, buttons.
4. **Hybrid:** generated facade inside exact rectangle, generated lower city + code taller sky/cloud/parallax, HTML industrial inspection UI.

Adopted runtime target≤350KB (maximum500KB with measured justification); module atlas≤1024×512, city≤1024×512. Concepts/originals never copied into production. Thumbnail640×360 WebP derives from actual three-or-more-floor stack, crane, skyline and clear space; title rendered separately in code.

## Avoid List

Wood crates as final identity, clipped-overlap blocks, variable physics inferred from facade, isometric buildings, facade edges beyond collision, dense windows concealing mass, endless hazard tape, fake city floors outside accepted cargo, giant HUD, warehouse monotony, comic character styling from002, and blue glowing sci-fi.

## Actual Generated Reference Decision

Art Director actually viewed the five-facade generated source. Flat elevations, broad windows and brick/sage/office/service variation are accepted. Source rows are roughly9:1 rather than desired4:1; use a central4:1 facade segment for each320×80 production tile, preserving window aspect instead of stretching the entire row. Crop exterior alpha noise and ensure the exact full cargo perimeter is code-drawn. This changes art sampling only. Optimised small modules and the actual mobile tower still need independent visual review.

The final320×80 `module-cafe.webp` and768×384 `city-sky.webp` were then actually viewed and accepted for integration: window aspect is preserved, the awning reads at small size, and the lower-town/quiet-sky material is coherent. Six runtime WebPs total57,098bytes. All cargo widths/heights remain model-derived; final actual mobile tower readability and raised-camera composition still require the independent gate.

## Visual Gate / Revision

Actual desktop/mobile title/game/result and raised-camera evidence are required. Total≥80, Readability≥12/15, Production≥12/15. Priorities: exact apparent rectangle and support/projection contrast; city/sky depth; industrial typography. Maximum3 iterations, otherwise `HUMAN ART REVIEW REQUIRED`.
