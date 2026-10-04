# GAME005 — SORT SHIFT Visual Brief

Art Director decision, 2026-10-04. Art Mode: **HYBRID / COLORFUL FACTORY**. Rule order/inversions, decision deadlines, parcel attributes, dispatch lock, inputs, scoring, services and run conditions are immutable.

## Current Screenshot Review

Actually viewed final desktop1440×900 and mobile390×844 BEFORE during brightness rule after8sorts, after existing arrival animation completed. The rule and light/dark contrast read well, but products are basic circle/square software shapes, the mint conveyor feels like a UI card, and desktop duplicates the wide editorial pattern of other games. An earlier transient capture was faint during entrance; this is existing animation, not a steady-state readability defect. Replace product/conveyor material and strengthen factory character while preserving rule dominance.

## Design Goal

Run a cheerful, slightly strange mechanical sorting factory. Products feel like manufactured capsules and parts, yet their round/angular, light/dark, small/large and symbol states are recognised immediately. The rule sign outranks all illustration.

## Mood

Mechanical pop, warm industrial toy precision, colourful but not childish. Palette: ivory `#fff1d3`, deep purple ink `#3d334f`, coral `#ec775d`, mintmetal `#65aaa1`, bright yellow `#efc64b`, darkproduct `#433b62`, lightproduct `#f6e6bd`. Light/dark differentiate actual luminance, never merely colour hue.

## Composition

- Existing native left/right buttons and stage half-tap semantics stay. Persistent rule sign is a bright ivory/ink rectangular overhead factory routing sign, large labels/arrows, no image background under its text.
- Conveyor is a physical belt with bounded generated machine detail at its sides/back and code ribs/rollers/rails. Current parcel occupies a quiet central inspection zone, clearly separated from environmental art.
- Four attributes all remain visually available; active dimension label remains clear. Shape comes from silhouette; brightness from material luminance; size from existingrelative small/large dimensions; circle/cross is bold code marking, never generated.
- Desktop factory brand uses bold grotesk/display type and compact routing motifs. Mobile prioritises RULE → parcel/belt → deadline →44px sidecontrols, then compact score and CTA as existing responsive bounds allow. No decorative art panel consuming extra screenheight.

## Character/Object Design

Generated four transparent coherent parts: light ROUND capsule, dark ROUND capsule, light ANGULAR container, dark ANGULAR container. Round outline is truly circular/rounded with no angular exterior protrusions; angular outline is square with distinct sharp corners, not highly chamfered. Chunky toy-like machine material, shallow seam/rivet detail confined inside silhouette, clean blank central marking area. Same style and camera angle/front view, no cast shadows. Two sizes come from existing code dimensions, not a separate extra appearance/state. Code symbol is placed on contrasting real plaque while readableproductbrightness remains around it; no colouredwash that makesLIGHT/DARK ambiguous.

## Background

Generated colourful factory environment supplies sidewall mechanical arms, guards, pipework and warning lamp motifs. Quiet central inspection belt remains code. Mechanical motion is decorative, slow, only in periphery and pause-aware; it must not suggest an extra incoming playable parcel. A finite production image or cropped motif atlas is enough; do not ship a cinematic oversized background.

## UI

Heavy sans display (`Trebuchet MS`/bold system sans) with chunky purple ink, mustard/coral flat mechanical switch details, square routing sign. Different from002comicpaper,003thinblueprint and004monospaceinstrument. RULE is always highestcontrast. Arrows, attribute names, inversion notice, elapsed/deadline, correct-side indicator and small trait annotation remain real text/code. Result appears as a compact printed inspection tag, does not hide lastparcel/correction. Colour alone never encodes answers. All original action ids/handlers and44px targets stay.

## Animation

Existing dispatch classes drive short physical parcel slide/pop exactly within existing dispatchduration; current sorting parcel stays stable after arrival. Belt texture glides gently independently but never disguises remainingtime. Rule change existing freeze uses an ivory-and-yellow sign response; no new pause or timing. Correct event can trigger tiny bolt/confetti spark visual at belt edge, not over rule. Wrong displays exact existing answer text plusoutline. CSS reducedmotion removes travel/flair without altering modelperiods.

## ImageGen Plan

1. **Generate object atlas:** “Four isolated manufactured products for a colourful strange small sorting factory arcade, consistent tactile illustrated toy-machine style with deep purple outline, subtle ink texture and large clean surfaces. Four equal spaced cells two by two: pale ivory truly ROUND circular capsule; deep purple truly ROUND circular capsule; pale ivory ANGULAR square container with unmistakable sharp square corners; deep purple ANGULAR square container. Flat straight-on view, simple interior seams and small rivets entirely INSIDE exact silhouette, central area blank for coded symbol. Light objects high luminance, dark objects genuinely dark. No projecting handles, no legs, no gears outside edge, no casts shadows, transparent background, no text, no marks/symbols, no logos, no watermark.”
2. **Generate factory:** “Colourful unusual illustrated sorting factory environment for a compact front-view arcade, restrained coral machine arms, teal steel rails, mustard lamps, cream wall and purple ink outlines, tactile manufactured surfaces. A large quiet central inspection conveyor zone, machinery framing LEFT/RIGHT edges and rear, mechanical pop style matching capsule and square parts. No parcels in environment, no characters, no text, no arrows, no holograms, no neon, no watermark. Clear coherent depth and lowcontrast central space.”
3. **Code:** product silhouette clipping/exactexisting dimensions, sizes, bold circle/cross, rule/arrows, labels, timer, belt animation, buttons, answerfeedback.
4. **Hybrid:** generated product material within honest silhouette; generated peripheralfactory + codebelt/currentparcel and persistentcodeRule.

Runtime target≤300KB (maximum450KB measured), productatlas≤768×768, environment≤768×512. If generated shape edges fail clarity, crop its interior material into the exact code silhouette while preserving coherent object style; never accept ambiguous geometry just to use the picture. Originals/concepts outsideproduction. Thumbnail640×360WebP faithfully combinesactualRULEsign, one product and conveyor; no fictional mass of simultaneous gameplayobjects.

## Avoid List

Faint primitive parcels, pasted pictorial factory behind unrelated softwarecards, blue holograms, same mintpaper002UI, round-looking ANGULAR bevels, handles altering shape, chromaticLIGHT/DARKwithsame luminance, unreadable generated symbols, decorative parts resembling playableparcel, moving centraltarget, hugeillustration blockingrule, rewritten rules/timing.

## Actual Generated Reference Decision

Art Director actually viewed and accepted the four-product source: truly circular ROUND capsules, unmistakably square ANGULAR containers, high-luminance ivory versus low-luminance purple, coherent coral/yellow internal mechanical trim and blank centres for code symbols. Tiny outer corner rounding is acceptable only inside the exact code square silhouette. Production separate256px transparent WebPs are appropriate; do not ship the large source atlas. Final actual small/large and light/dark parcels must pass readability independently after integration.

The final256px `product-angular-dark.webp` and768×432 `factory.webp` were then actually viewed and accepted. Their tactile purple/coral/teal mechanical material matches. Align code belt/rails to the generated factory rollers rather than retaining the previous unrelated mint software-card surface. Four products plus factory total89,992bytes, excluding later thumbnail. Rule contrast, exact parcel dimensions and small-size attributes require the independent after gate.

## Visual Gate / Revision

Actual desktop/mobile title/game/result plus at least LIGHT/DARK/ROUND/ANGULAR and reversed-rule evidence. Total≥80, Readability≥12/15, Production≥12/15. Priorities: shape/luminance/symbol clarity; RULEcontrast; coherent factory/material/typography. Maximum3iterations, then `HUMAN ART REVIEW REQUIRED`.
