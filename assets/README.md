# Visual source assets

These are the actual image-generation source results used during the 2026-10-04 visual redesign. They are intentionally outside `public/` and are excluded from the runtime production build.

The exact prompts, tool outputs, inspection decisions and adopted versions are in [IMAGEGEN_LOG.md](../docs/visual/IMAGEGEN_LOG.md). Art direction is recorded in each `docs/visual/GAME00N_VISUAL_BRIEF.md`.

- `game002`: coherent transparent commuter sheet and four-district source atlas. `asset-index.json` records equal-cell extraction, alpha bounding crops and the eight building-edge strips.
- `game003`: five front-elevation modules and city/sky reference. `asset-index.json` records central 4:1 facade crop coordinates; all final body geometry stays in code.
- `game004/concept/device-reference.png`: concept-only retro instrument reference. The playable device is HTML/CSS; this concept is never shipped as fake controls or a runtime backdrop.
- `game005`: coherent light/dark round/angular product sheet and factory reference. `asset-index.json` records sprite extraction and optimized environment.

Only accepted optimized WebPs are under `public/assets/game00N/`. Thumbnail assets are faithful actual-screen derivatives generated later in the screenshot/review stage; no cinematic reference is substituted for real gameplay.

## Local Japanese UI font

`fonts/source/MPLUSRounded1c-Medium.ttf` is the upstream M PLUS Rounded 1c Medium source, licensed under SIL OFL 1.1 (`fonts/OFL.txt`). `scripts/subset-ui-font.py` produces the renamed Arcade Rounded WOFF2 under `public/fonts/`, retaining copyright/license metadata. `fonts/font-index.json` records source provenance, SHA-256, byte count and glyph coverage. Only the subset and license are shipped; font sources stay outside the runtime build.
