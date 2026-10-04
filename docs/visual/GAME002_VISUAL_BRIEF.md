# GAME002 — WORKDAY DODGE Visual Brief

Art Director decision, 2026-10-04. Art Mode: **ASSET DRIVEN / COMIC URBAN**. Gameplay, model, inputs, CREDIT, telemetry and persistence are immutable.

## Current Screenshot Review

Actually viewed `before/game002-desktop.png` (1440×900), `before/game002-mobile.png` (390×844), and desktop title. The hierarchy is usable, but identical flat houses repeat, people are tiny primitive dolls, the palette is nearly monochrome, and the huge quiet desktop margin reads as a prototype/editorial landing page. Preserve the clear road and distance hierarchy; replace its material language and city detail.

## Design Goal

Instantly communicate a serious commuter negotiating a comically busy Japanese morning. Produce a small illustrated arcade, not a corporate productivity page. Human silhouettes and street edges carry the art; the central roadway remains easy to read.

## Mood

Morning paper, warm sunlight, ink outlines, adult comic understatement. Deep navy suits contrast against pale stone pavement. Palette: paper `#fff3df`, ink `#24384a`, coral `#e86c50`, mustard `#edb849`, leaf `#6d9179`, pale sky `#b9d9df`. Limit saturated decoration near hazards.

## Composition

- Keep the virtual 600×600 camera, lane positions, player centre and existing controls unchanged. Generated people use the established approximately 52×63 visual envelope, with a code shadow around the same centre; do not enlarge apparent collision bodies.
- Central road x120–480 is a quiet cream surface drawn in code. Generated city texture appears only in side flanks x0–90 and x510–600; kerbs and lane guides stay code. Side-flank seams are softened with repeated code foliage and sidewalk furniture outside gameplay lanes.
- Desktop: compact comic masthead, strong Japanese title, a narrow four-stop route diagram, and framed game window. Mobile: masthead → distance → tiny route strip → game. Avoid a large new picture above the live game.
- The `438 m` distance is the first HUD reading; CREDIT, best, mute and pause are subordinate. A small stamped itinerary/ticket language makes overlays belong to the street world.

## Character/Object Design

Generated transparent atlas: one navy-suited commuter facing UP with mustard business bag, plus five distinct approaching pedestrians facing DOWN: broad businessperson, newspaper reader, phone reader, rushed office worker, laden shopper. Overhead/three-quarter illustration, two-and-a-half heads high, visible hair/shoulder/foot direction, thick dark outline and limited large colour areas. Not childish babies. No enemy type is defined by costume: select visual variation by existing id only. Directional warning arrows, footprint destination, hit feedback and shadow are code, always above texture.

## Background

Generated coherent four-district side-building set: residential pitched roofs/hedges; shopping awnings/baskets; station canopy/bike racks; glass offices/planters. Building details have a top-down/near-overhead game-map view matching people. Each district uses the same paper/ink style and scale. Existing 250m boundaries select visuals; no new timing or world logic. Prefer repeatable side fragments to one cinematic background. No readable storefront labels in images.

## UI

Use a heavier rounded Japanese sans for the comic headline (`Arial Rounded MT Bold`/system Japanese fallback), regular humanist sans for instructions and condensed bold sans for distance; do not use the retro monospace treatment of Game004. White paper/ink outlines, modest offset print shadows, mostly square corners with small rounding. Replace the floating generic title card with a work ticket/stamped destination treatment at the same overlay bounds. Existing button ids/listeners and 44px action targets stay intact. Small orange route dots indicate district; no coloured decoration that could resemble an enemy warning.

## Animation

Image sprites may gently bob and tilt to the existing visual walk phase; sprite position always comes directly from the model. Hero bag movement is a visual secondary layer if feasible, otherwise whole sprite slight lean. Existing collision event drives a small comic burst/recoil. Dodge lettering is ink/coral and brief. Existing pause freezes visuals; reduced-motion removes bob/tilt/shake. Do not change event timing, queue or collision geometry.

## ImageGen Plan

1. **Generate characters:** six-cell transparent atlas (two rows × three columns), generous equal gutters, full figures uncut. Cell order: hero facing UP, broad pedestrian, newspaper reader, phone reader, hurried worker, loaded shopper. Prompt: “Professional small browser arcade sprite sheet, sophisticated warm comic illustration of Japanese morning commuters, six isolated full-body overhead three-quarter characters, consistent thick navy ink outline, limited paper/coral/mustard/navy palette, two-and-a-half-head proportions, businesslike expressions. First character is back-facing walking north in navy suit carrying mustard briefcase; other five face south and have distinct readable silhouettes. Transparent background, six evenly separated equal cells, no floor scene, no cast shadows, no text, no watermark, no UI.”
2. **Generate districts:** four equal separated illustrated neighbourhood panels or reusable side-strip motifs, same style reference as characters. Prompt: “Reusable top-down Japanese morning city building-edge art for a 2D comic arcade. Four distinct clearly separated panels in a two by two layout: residential roofs/hedges; shop awnings/produce; station canopy/bicycle racks; office glass facades/planters. Draw buildings and props around outer edges, quiet empty cream walkway space, thick fine navy ink and warm paper texture, consistent near-overhead view, no people, no vehicles in walking space, no text, no logos, no watermark.” Crop/adopt only side motifs; road/hit geometry is never generated.
3. **Hybrid:** generated sprites + code shadows/warnings; generated flank tiles + code road/foliage; HTML title/HUD over illustrated frame.
4. **Never generate:** scores, metres, buttons, arrows needed for gameplay, exact lane coordinates, critical text.

Runtime budget: character atlas ≤512×768 or equivalent separated sprites; city tiles roughly128×512 per district, with two mirrored/adapted sides acceptable. Optimised adopted assets target ≤500KB total, maximum750KB only with measured justification. Originals/concepts stay outside public build. One local thumbnail is a faithful actual-screen composition: hero, two pedestrians and street flanks, code title outside the game image; 640×360 WebP, no promise of unseen content.

## Avoid List

Emoji humans, colour-swapped clone cast, flat repeated houses, large black HUD, generic mint SaaS cards, isometric perspective mismatched to lanes, dense central-road art, tiny decorative text, excessive impact particles, character stretch, new enemies, implied extra collision area, and promotional thumbnail scenes absent from gameplay.

## Actual Generated Reference Decision

Art Director viewed generated commuter and four-district originals, optimised `hero.webp`, residential/station flank WebPs, and the initial390×844 integrated gameplay capture. Accepted coherent adult comic silhouettes, north-facing hero and clearly distinct district edges. The six transparent people and eight flanks total254,412bytes. Hero's actual body is narrower than the padded52×63 sprite canvas, close to the former suit body; do not enlarge it simply to fill the padding. The first integrated image preserves a quiet road and recognisable walking direction. Full UI review remains independent and pending. Small former flat green foliage circles can be removed or given ink/leaf detail to match illustrated streets; this is cosmetic only.

## Visual Gate / Revision

Review actual desktop1440×900 and mobile390×844 title/gameplay/result, plus small/landscape bounds. Required total≥80, Readability≥12/15, Production≥12/15. Revision priority: readable people and B/C warning shapes first; coherent street materials second; print/UI polish third. Maximum3 iterations, then `HUMAN ART REVIEW REQUIRED`. Any future gameplay idea belongs only in `FUTURE_GAMEPLAY_SUGGESTIONS.md`.
