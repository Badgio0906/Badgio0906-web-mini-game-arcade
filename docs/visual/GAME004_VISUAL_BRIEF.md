# GAME004 — ECHO GRID Visual Brief

Art Director decision, 2026-10-04. Art Mode: **HYBRID / UI-FOCUSED / RETRO DEVICE**. Sequence, flash/off-gap, recall timing, native button hitareas, inputs and lifecycle remain unchanged.

## Current Screenshot Review

Actually viewed desktop1440×900 and mobile390×844 BEFORE gameplay during WATCH. The3×3 grid is clear and flash contrasts well, but the flat navy page and nine identical software cards lack a physical object or setting. Desktop grid and side information feel like a dashboard. Preserve board position and result replay visibility; give the grid a tactile instrument enclosure.

## Design Goal

Operate a mysterious memory-testing instrument in a quiet late-night laboratory. The nine real buttons remain the exact playable surface; image generation supplies the visual reference and optional environmental texture, not fake controls.

## Mood

Analog electronics, brushed graphite, warm bone keycaps, restrained amber signal. Palette: workshop charcoal `#222827`, warm steel `#66716a`, ivory `#ddd3b8`, key-dark `#38423d`, lampamber `#f2bd62`, scarlet error `#b55b4c`. This deliberately changes the former mint-on-navy look; no all-neon theme. Lit cells remain unmistakably brighter than idle keys.

## Composition

- Instrument body surrounds existing exact3×3 native grid. No changing watch/recall grid size, key positions or spacings within a run; pause preserves play position. Result panel stays outside the grid so automatic replay remains visible.
- Code creates stepped beveled enclosure, thin screw details at exterior corners, recessed keybed, small phase/sequence readout and numbered key legends. Decorative knobs are static, clearly ornamental, never new interactive controls.
- Background suggests a real bench/wall: quiet paper diagram silhouettes, cable route, low-light texture and a horizontal bench edge. It must have low contrast and never look like an AI picture merely behind unrelated UI.
- Desktop title has a small serif specimen heading and monospace instrument subtitle; layout is an object/control panel, not the comic002 or blueprint003. Mobile shows compact LEVEL/phase then dominant device, minimal explanatory strip below.

## Character/Object Design

The device is the character: chunky rectangular enclosure with warm metal patina, symmetrical recesses, nine square physical light keys. Idle keys have subtle upper reflection and bevel; number legends are HTML and persist. Flash uses amber inner illumination, a reflected edge and existing pip response. Wrong uses scarlet etched border/shape; expected/replay remain distinguishable with contour as well as colour. No image contains or determines the real key numbers.

## Background

Generated full-device laboratory concept is required as reference. Production may use a small low-contrast bench/wall fragment from it, only outside the exact playable surface; equally valid is a entirely code-reconstructed instrument informed by the inspected concept. Optional texture should be local and tileable without visible giant grain. Dark space has material and depth, never solid black.

## UI

Device labels use `Courier New`/monospace with deliberate readable sizing; headline serif (`Georgia` + Japanese serif fallback), body legible sans. LEVEL reads like a segment/rack readout rendered as real text. Squared keys, small hardware-style action switches, thin stamped sections. No huge generic rounded sidecard; start/result is an instrument instruction/readout plate. Keep44px targets, all original aria labels/focus states, and state classes. An ornamental screw must not attract more contrast than a flashing key.

## Animation

Flash/lit/correct/replay retain exact existing timings: change only CSS material light layers and pip state, never introduce fading tails spanning an off-gap. Lit state immediately reaches clear brightness and turns off exactly with current class removal. A very small static sheen appears inside active key; avoid pulsing background during WATCH. Wrong/correct feedback contours stay distinct. No opacity animation that hides numbers; no new audio behavior. Reduced motion removes decorative effects, leaves exact light states.

## ImageGen Plan

1. **Mandatory concept generation:** “Sophisticated retro laboratory memory instrument concept, straight-on slightly overhead tabletop product illustration. Compact mysterious graphite-and-warm-metal enclosure, nine square tactile light keys in a precise three-by-three arrangement, ivory etched key faces with one warm amber inner-lit key, small analog indicator lamps, restrained screws and vents, a quiet late-night workshop bench and cables, brushed metal patina. Editorial tactile illustration with believable physical materials, controlled shadows, no neon holograms, no excessive glow, no readable text, no numbers, no brand, no watermark. The instrument dominates and has a calm orderly composition. This is a visual reference: final exact controls and labels will be coded.”
2. **Generate optional production fragment only if valuable:** low-contrast workshop material/bench texture with no controls/text, optimised as smallWebP.
3. **Code:** exact9buttons, hitarea/grid, numerictext, state classes, lamps, screws, bevels, phase, score, actions, focus and replay.
4. **Hybrid:** concept-informed code instrument; optional generated material fragment outside board. Do not place concept picture of fake ninekeys beneath the actual ninekeys.

Reference may be about1536px and belongs under concept sources only. Production environmental texture if adopted≤640×480, target≤90KB; concept-only use keeps production imagecost0. Thumbnail640×360WebP is captured from actual finished device with one lit key and tiny code caption; no imaginary controls/features.

## Avoid List

Flat black/navy page, mint software cards, fake image controls, drifting/shrinking board on phase change, lingering illumination obscuring sequence gaps, too many knobs, unlabelled live controls, intense neon glow, competing animated laboratory, generated numbers/text, hidden replay under overlay, tiny low-contrast mono instructions.

## Actual Generated Reference Decision

Art Director actually viewed the generated device concept and accepted its graphite/brass enclosure, bone tactile keys, controlled amber centre illumination and wood-bench/cable context. This is a reference-only image, not the interactive board or a picture pasted beneath live keys. UI Engineer is authorised to reconstruct those materials with exact existing native controls, real numeric legends and instantaneous state classes. Final screenshots determine whether the reference was convincingly translated.

Canonical reference path is `assets/game004/concept/device-reference.png`; runtime reference-image cost is0bytes.

## Visual Gate / Revision

Actual desktop/mobile WATCH lit/off, RECALL, title and result replay images. Total≥80, Readability≥12/15, Production≥12/15. Priority: exact signal contrast/off-gap; physical integrated device; quiet contextual background. Maximum3 iterations, then `HUMAN ART REVIEW REQUIRED`.
