# Truthful gameplay thumbnails

All four thumbnails are complete and adopted **after the independent visual quality gate passed** on Iteration 1. Each is a crop of an accepted actual gameplay screenshot, never a generated concept or promotional reconstruction. Images remain under `assets/game00N/ui/` as library/source artifacts; they are not runtime imports and do not add a portal or extra public image requests.

All source captures are desktop 1440×900. The selected game composition includes the live primary HUD, real playable surface and its existing art/context. It is resized proportionally, then padded to 640×360; objects, geometry, text, layout and aspect ratio are preserved. No fabricated characters, products, scores or effects are added. Matching JSON metadata alongside each image records the source SHA-256, exact crop, scaling, padding and encoded bytes.

Coordinates are source-pixel `[left, top, right, bottom]`, with right/bottom exclusive. Encoded bytes refer to the final WebP.

| Game | Independent gate | Actual screenshot | Source crop | Scaled panel / padding | Thumbnail | Bytes |
|---|---|---|---|---|---|---:|
| Game002 | Iteration 1 PASS: 82, F14/15, H12/15 | `after/game002-desktop.png` | `[164,114,1280,785]` | 599×360; x20/y0; paper `#fff3df` | `assets/game002/ui/thumbnail.webp` | 35,172 |
| Game003 | Iteration 1 PASS: 85, F13/15, H13/15 | `after/game003-desktop.png` | `[175,112,1270,771]` | 598×360; x21/y0; concrete `#e9e3d5` | `assets/game003/ui/thumbnail.webp` | 20,012 |
| Game004 | Iteration 1 PASS: 85, F14/15, H13/15 | `after/game004-desktop.png` | `[236,184,1204,788]` | 577×360; x31/y0; graphite `#222827` | `assets/game004/ui/thumbnail.webp` | 11,076 |
| Game005 | Iteration 1 PASS: 88, F14/15, H13/15 | `after/game005-desktop.png` | `[216,158,1228,758]` | 607×360; x16/y0; ivory `#fff1d3` | `assets/game005/ui/thumbnail.webp` | 25,456 |

Game002 retains the 277m commercial-street gameplay screenshot, the two actual approaching commuters, the rear-facing hero, the quiet lanes and the existing route/heading. The preview was directly viewed after export to check that the image is truthful and readable at its actual 640×360 size.

Game003 retains the actual 8-floor / 5.5m stack, hanging architectural module, crane, foreground support edges, height ruler, sky/city and original industrial HUD/heading. The accepted image is used without inventing additional floors or shortening/cutting the physical bodies. The export was viewed at 640×360.

Game004 crops the actual completed physical enclosure, LEVEL 1/WATCH readout, nine numbered native keys and adjacent instruction plate. Exactly one amber key is lit in the source capture; the thumbnail preserves that real sequence state, without fake controls, extra knobs or a generated device substitute. The export was viewed at 640×360.

Game005 retains the actual SORTED 8 / COMBO 8 inspection, LIGHT→left / DARK→right rule, a single angular LIGHT parcel with its coded × symbol, factory sides, belt, deadline and native left/right actions. It does not add incoming parcels, new rules or decorative products that suggest different gameplay. The export was viewed at 640×360.

Total encoded thumbnail cost is **91,716 bytes** for the four 640×360 WebPs. Source-file hashes, exact dimensions, crop coordinates and byte counts were verified after export. Thumbnails are documentation/library artifacts and add **zero runtime image bytes** to the game pages.
