# FALL KING — authored pixel asset index

Production authority: [`src/games/game015/art.ts`](../../src/games/game015/art.ts). No external image loading, generated high-resolution illustration, shrinking, pixel filter, browser font dependency or third-party stock is used. These sprites and tiles are original, intentionally authored pixel-token rows. ImageGen exploration is optional under specification42 and was not executed for Game015.

Final native gameplay canvas: **256×448** (16×28 background tiles). All sprites render with integer coordinates and nearest-neighbor scaling. Canvas CSS must use `image-rendering: pixelated`; the scene renderer must keep `imageSmoothingEnabled=false`. Physics stays in its own unrounded coordinates. Art rounds only the visible coordinates and does not change movement or collision.

## Palette

One `.` transparent token and exactly16 opaque colors. The hex values in `art.ts` are authoritative.

| Token | Hex | Use |
| --- | --- | --- |
| 0 | #111525 | outline / deep void |
| 1 | #1b253e | distant background |
| 2 | #34445b | masonry / structure shadow |
| 3 | #647580 | masonry / metal midtone |
| 4 | #adbaae | hard platform highlight |
| 5 | #fff1c2 | face / HUD / contact surface |
| 6 | #f3b677 | skin |
| 7 | #f5cf64 | crown / moving beam top |
| 8 | #ac7639 | boots / gold shadow / work details |
| 9 | #66c6b4 | tunic / small deep inlay |
| a | #287c7b | tunic shadow / fabric support |
| b | #d45b70 | cape |
| c | #743953 | cape shadow / mattress body |
| d | #a999d1 | soft mattress / distant strange accents |
| e | #d88456 | optional effect color in the shared limited palette |
| f | #759876 | cave moss / roots |

Background subsets: tower4, works4, cave5, strange6 opaque colors. The gold/cream/teal/rose king remains brighter than those low-contrast distant structures. Platform identity uses both structure and color; the platform silhouette is not merely a background palette change.

## Crown king

`KING_FRAMES`, each **16×24**. `KING_ANCHOR={x:8,y:24}` is bottom center; `drawKing` receives **sprite left/top**. The renderer subtracts that anchor from its physical foot position. Air poses can lift their boots inside that same fixed canvas; the crown, robe and body never resize to fake physics.

| State | Frames | Visible purpose |
| --- | ---: | --- |
| idle | 2 | tiny cape shift and blink |
| drop | 2 | anticipation crouch and boots parting |
| falling | 4 | raised arms, separated boots, cape flare |
| left | 2 | left gaze/lean, cape trailing right |
| right | 2 | mirrored drift, cape trailing left |
| landing | 3 | squat → rise → neutral |
| hard | 3 | one-knee crouch and tired blink |
| death | 4 | crouch → knee → comic squash → loose crown and stars |

Total22 frames. No gore. Frame changes are discrete, generally8–10Hz; movement/input need not run at that rate. For one-shot landing/death, the caller should hold the final frame or return to the appropriate gameplay state. Sprite animation is presentation and does not disable or grant movement.

## Background tiles

`TILE_FRAMES`: **32 exact16×16 grids**, grouped through `BIOME_TILES`, eight per biome. `drawBackdrop` uses deterministic tile placement and quarter-speed **integer-pixel** parallax. After the independent actual screen review, detail is confined to the left/right48px walls; central **x48–208** is a solid palette1 void. Edge motifs cycle through all seven accent tiles, with the base tile and rarer1/19 near-wall accents; all eight authored tiles per biome are actually displayed. No central brick repetition or horizontal decorative false landing surface remains. This is distant noncolliding scenery, never the platform generator.

| Biome | Names |
| --- | --- |
| tower | brick, window, ashlar, chipped, grate, arch, column, rivets |
| works | beam, pipe, bolted, elbow, tee, cable, mesh, valve |
| cave | cave, rock, moss, fissure, stalactite, pebbles, pocket, roots |
| strange | glyph, pillars, circuit, gate, inlay, crystal, chevrons, buried |

These reflect the gameplay depth bands0–250m /250–500m /500–1000m /1000m onward. The gameplay renderer selects the biome; the art module does not expose future gameplay routes or prematurely choose a depth band.

## Platforms

`PLATFORM_FRAMES`:16×8 motifs, eight total. `drawPlatform` tiles/crops the motif to the actual physical width and clips **all** artwork to `{x,y,width,height}`. Rounded top position is exactly `y`; the soft compression state retains its top contact row. End caps stay inside the hitbox. No decorative overhang enlarges an apparently safe target.

| Type | Frames | Structure |
| --- | ---: | --- |
| normal | 1 | cream solid contact row and blocky gray stone |
| soft | 2 | pale violet quilt dots, burgundy padded body, teal underside |
| crumble | 3 | angular cracks grow into separated pieces; gameplay decides removal |
| moving | 2 | gold striped metal beam, rivets, dark underside; position follows model |

Default platform height8. If physics uses another height, pass that exact value; a taller underside is ink-filled inside the physical rectangle. `phase` selects/clamps the motif variant, so the renderer can explicitly map its crumble timer and soft reaction rather than inventing a second animation clock.

## Bitmap HUD

`BITMAP_GLYPHS`: **51 deliberate5×7 binary glyphs**, A–Z,0–9, punctuation, arrows/star and lowercase meter `m`. `drawBitmapText` and `measureBitmapText` use integer scale1 or2, 1pixel letter gap and narrower4pixel space advance. Unknown characters become `?`; Japanese instructions/title remain in the accessible HTML overlay. Suggested HUD: labels1× and depth/best numbers2×. No `fillText` or anti-aliased vector type is used for the canvas HUD.

## Stable API

```ts
drawKing(ctx,x,y,{state,frame?,facing?:-1|1,ghost?});
drawTile(ctx,id,x,y);
drawBackdrop(ctx,biome,{width?,height?,scrollY?});
drawPlatform(ctx,{x,y,width,height?:8,type,phase?});
drawBitmapText(ctx,text,x,y,{color?,scale?:1,align?:'left'});
measureBitmapText(text,scale?:1);
```

The exact TypeScript signatures in `art.ts` allow integer scales beyond1 if required. Cached native canvases are built from these same rows, drawn without smoothing and keyed by content; all possible source and mirrored sprite patterns are bounded (at most84 tiny canvases). Scores/fonts never create an unbounded image cache. No asynchronous texture request blocks the first play.

## Verification and review

[`ASSET_AUDIT.json`](ASSET_AUDIT.json) records the actual source SHA256, byte count, dimensions, palette, eight required states,22 king frames,32 tiles,8 platform frames and51 glyphs. **Actual Node module import executed every grid validator**; all62 pixel grids matched their fixed dimensions and allowed palette. Death rows were checked after intentional padding, so no row can silently exceed16. All325 recorded test drawing rectangles used integer coordinates. A non-multiple-of16 platform width25 used the exact native clip rectangle `[10,13,25,8]`. `npx tsc --noEmit` passed.

Recheck module/grid initialization without a browser:

```sh
node --experimental-strip-types --input-type=module -e "import('./src/games/game015/art.ts').then(a=>console.log({states:Object.fromEntries(Object.entries(a.KING_FRAMES).map(([k,v])=>[k,v.length])),tiles:Object.keys(a.TILE_FRAMES).length,glyphs:Object.keys(a.BITMAP_GLYPHS).length}))"
npx tsc --noEmit
```

[`ASSET_PREVIEW.png`](ASSET_PREVIEW.png) is an actual diagnostic render of those source rows: native256×400, enlarged exactly3× by nearest neighbor. It shows every authored king frame, tile and platform motif. It is **not** a fabricated gameplay screenshot and is kept outside public/dist. The portal thumbnail must come from Root’s actual integrated falling gameplay capture later. Asset/grid verification does not replace the independent gameplay Visual/Game Feel/QA gates.

The bounded backdrop repair is additionally shown in [`BACKDROP_PREVIEW.png`](BACKDROP_PREVIEW.png): four actual `drawBackdrop` pixel outputs, each native256×448, placed side by side without resizing. The asset audit rasterized the actual drawing calls, observed all eight matching authored tile patterns in each biome's walls, verified zero central detail rectangles and integer drawing for all four biomes. King/platform/HUD rows, palette, physics and camera were unchanged by this background repair.
