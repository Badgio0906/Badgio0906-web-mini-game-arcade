# Game018 Canvas art handoff

Original authored Canvas2D vectors. No generated image, no external image source, no asset dependency or runtime package added. Typography uses the existing local `Arcade Rounded` when installed, then sans-serif. Code is the source of the five shoe illustrations.

## Identity

Warm turquoise park, sandy running surface, coral cap/sneaker, turquoise shirt and dark ink outline. A cheerful boy with an oversized cap balances on a planted left shoe. The right leg rotates around one stationary hip, with a bent knee and counterbalancing arms. A gold/coral launch-direction arrow shows the actual angle; the swing is a visual pose rather than a numerically literal leg/launch-angle equation.

The five silhouettes: folded angular cream paper; oval woven tan zori with coral Y strap; coral/turquoise sneaker with ivory sole/laces; dark brown leather shoe with separate heel and toe shine; slate metal geta with two teeth, yellow strap and rivets. Flight adds an ivory keyline and enlarges the shoe independently of physical world scale.

## View behavior

`new ShoeBoard(canvas)` observes actual Canvas CSS bounds, using a 1000 logical width and 400–2100 logical height. Foreground art scale rises on narrow portrait screens, bounded by available height on short landscape screens. `render(run, now, {title?, reducedMotion?})` reads current public model data and never clones a trajectory or changes gameplay. `destroy()` disconnects the observer. `projection` exposes read-only current physical camera/projection values for root's QA.

ANGLE: hinge pose and arc; ANGLE LOCK: eased foot zoom; SPIN: large close-up shoe twist and orbit indicator; SPIN LOCK: eased zoom-out; POWER: central wide colored meter and visible MAX tip; JUST MAX: frozen eye stars and large label, stronger white wash for iron geta; KICK: speech, leg follow-through and bounded small shake. Reduced motion removes shake/flash/speed streaks/debris and tracks the shoe directly.

Flight follows the actual model position with speed-based pullback and bounded lag. World scenery is bounded near the camera. Objects are drawn with actual model bounds and state. Comic holes use actual effect coordinates and only broken objects. BONK gets a bump star and `ゴツン！`, while BREAK gets fragments and `ドゴッ！`. Consecutive `breakCombo` controls the combo label.

Height changes turquoise→blue→indigo. Clouds fade out near 6.5 km. Stars appear above 6.5 km and a curved Earth above 18 km. Airplane/UFO/satellite illustrations only appear on corresponding genuine model special events, at their actual event coordinates; they never award or imply another event. Re-entry flame needs actual maximum height ≥18 km and negative vertical velocity below -200 m/s. Shoe landing remains at the actual distance.

## Verification so far

Strict TypeScript compilation against copied current model files: PASS. Real browser rendering, screenshots, clipping, native play, independent Visual/Feel assessment and human judgement have not yet been performed by this asset worker. No Visual score is assigned from code alone.

## Root integration / checks

- `ShoeBoard.ts` and `ShoeArt.ts` were integrated into `src/games/game018/` after the Game017 source freeze was released.
- Root owns Canvas accessible label, DOM HUD/menu/buttons, current value text, sound, input, storage and phase progression.
- Inspect ANGLE arrow/swing clarity and anatomy on PC/390/320/landscape; inspect SPIN foot zoom and no detached limb effect.
- Confirm Canvas text stays within the real panel and does not compete with accessible DOM instructions.
- Use `projection` to assert the flight shoe center (plus enlarged outline) stays visible on all profiles, including extreme iron/paper trajectories.
- Capture actual plane/UFO/orbit events from model reaches; don't synthesize a portal scene that never appears in gameplay.
