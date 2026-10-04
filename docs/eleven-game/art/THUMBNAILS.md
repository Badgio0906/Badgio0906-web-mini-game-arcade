# Truthful portal thumbnails

All11 public thumbnails use actual saved gameplay screenshots. Pixel proportions and visible gameplay geometry are preserved; only source cropping, proportional resizing, solid letterbox padding and WebP compression are applied. No fictional promotional scene or image-generated poster is used.007/008/010/011 now use Root’s final pre-QA actual stage captures, replacing interim images. Game011 depicts one real question and its two actual choices; it does not invent a state with both category icons.

Canonical public contract: `public/assets/portal/game001.webp`…`game011.webp`,640×360. Source/crop/hash/bytes records: `assets/portal/thumbnails/asset-index.json`. Game001 actual capture is preserved under assets so a source ZIP without the transient artifacts directory remains auditable.

| Game | Actual source | Crop [x0,y0,x1,y1] | Bytes | State |
| --- | --- | --- | ---: | --- |
| game001 | `assets/portal/thumbnails/game001-actual-source.png` | [358, 171, 958, 771] | 4282 | actual saved gameplay visual |
| game002 | `docs/visual/after/game002-desktop.png` | [164, 114, 1280, 785] | 25264 | actual saved gameplay visual |
| game003 | `docs/visual/after/game003-desktop.png` | [175, 112, 1270, 771] | 14918 | actual saved gameplay visual |
| game004 | `docs/visual/after/game004-desktop.png` | [236, 184, 1204, 788] | 8386 | actual saved gameplay visual |
| game005 | `docs/visual/after/game005-desktop.png` | [216, 158, 1228, 758] | 20238 | actual saved gameplay visual |
| game006 | `docs/ten-game/screenshots/game006/desktop-gameplay.png` | [380, 73, 1205, 935] | 3014 | actual saved gameplay visual |
| game007 | `docs/eleven-game/screenshots/game007/desktop-stage.png` | [0, 0, 1350, 706] | 10048 | final actual root pre-QA stage capture; adopted for truthful portal thumbnail |
| game008 | `docs/eleven-game/screenshots/game008/desktop-stage.png` | [0, 0, 1368, 733] | 25360 | final actual root pre-QA stage capture; adopted for truthful portal thumbnail |
| game009 | `docs/ten-game/screenshots/game009/desktop-gameplay.png` | [255, 91, 1665, 505] | 7000 | actual saved gameplay visual |
| game010 | `docs/eleven-game/screenshots/game010/desktop-stage.png` | [0, 0, 1085, 633] | 19214 | final actual root pre-QA stage capture; adopted for truthful portal thumbnail |
| game011 | `docs/eleven-game/screenshots/game011/desktop-stage.png` | [0, 0, 1000, 689] | 6172 | final actual root pre-QA stage capture; adopted for truthful portal thumbnail |

Final11 total: **143896 bytes**. Each file is below45KB. The manifest is authoritative for final source/crop contracts; `assets/extract-portal-thumbnails.py` preserves only the initial crop history.
