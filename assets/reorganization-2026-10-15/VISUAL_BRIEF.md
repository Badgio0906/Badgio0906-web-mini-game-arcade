# Reorganization / Art Director brief

2026-10-15 JST. Static asset art direction and production by a separate Art Director worker. No game implementation files were edited by this worker.

## Game003 — architectural collage

Matte gouache city, cream sky, teal/mustard/coral facade palette. Ten facade materials are square atlas cells, not baked rectangular buildings: the renderer clips a facade to each actual compound collider silhouette and draws its silhouette edge. Roof equipment, center-of-mass hints, ground and construction feedback remain renderer overlays. The background is deliberately distant and low in frame to separate the active tower. Title uses the real gameplay scene; a portal thumbnail must come from an actual built screenshot.

`public/assets/game003/buildings-atlas.webp` is 1280 × 512, five columns and two rows of 256-square cells. `physics-city.webp` is 1600 × 1000. Identical canonical evidence outputs are under `public/assets/game003/reorganization/`.

## Game017 — blue-hour shelter relay

Animation-background rain street, indigo architecture, amber windows, a wet gray-blue pavement band. No generated person, sign text, shelter collider or gameplay cues are baked into the image. Shelters, player, wetness, wind and rain changes must be distinct renderer layers. Opaque shelter edges and solid character contrast are essential on the patterned reflections. `relay-city.webp` is the integration alias for `reorganization/rain-city.webp`, 1536 × 768.

## Game033 — cinema after dark

Restrained photographic summer river night: midnight navy, distant amber windows and bridge lights, calm reflections. Large empty sky gives live particles visual priority. No firework is baked into the background. Dynamic light, smoke, trails and river reflection are independent Canvas/WebGL layers. Main static image: `public/assets/game033/reorganization/night-river.webp`, 1536 × 1024. It may be fitted to the portrait canvas to preserve the horizon, or cropped with explicit horizon control; do not blindly center-cover away the river.

## Game034 — tactile toy workshop

Warm stop-motion miniature craft identity, sage backdrop and honey workbench, terracotta and teal painted wooden blocks. Workshop decorations live at the extreme margins, with the puzzle unobstructed in the center. Material atlas is three columns of 512-square surfaces (wood, terracotta, teal paint) at `public/assets/game034/reorganization/material-atlas.webp`. Actual parts must clip their texture to their physics geometry and show legible supports/selection overlays. Background is `toy-workshop.webp`, 1536 × 1024. Toys are fictional and should read as miniature craft objects.

## Game035 — quiet ice sport

Cool photographic ice, restrained navy boards, tactile granite red/blue stones. True overhead projection preserves the meaning of distance, collision and aim. `public/assets/game035/reorganization/ice-arena.webp`, 1024 × 1536, contains no targets or trajectories: draw those precisely above the ice. Individual `stone-red.webp` and `stone-blue.webp` are transparent 256-square crops, retain material grain and slight alpha margins. Team color handles and outlined target rings should remain distinguishable on the pale ice. Exact collision boundaries are controlled by the renderer/model.

## Production evidence and acceptance limits

Eight real `image_gen__imagegen` calls succeeded: five backgrounds, Game003 facade atlas, Game034 material atlas, Game035 stone atlas. No failed or discarded generation. Tool is OpenAI ImageGen / GPT Image family; the exact backend model/version was not disclosed and is not inferred.

Every generated image was actually inspected from returned image content or `view_image`. The optimized WebP outputs were then actually opened with `view_image`, including the two derived stone crops. Static assets are accepted for integration, with the contrast/horizon notes above. This is not an integrated Visual score, a desktop/mobile layout review, a Feel approval, or human approval.

Original PNGs are kept under each `assets/gameNNN/reorganization/originals/`, outside `public/`. The central `asset-index.json` and per-image provenance include exact prompt, source path, original/output dimensions, SHA-256, optimization and adoption rationale. Source images are new text-prompt generations with no third-party reference art; provider terms apply. No independent third-party license is claimed. Reproduction uses Pillow 12.3.0, LANCZOS resizing, WebP quality 86/method 6, with alpha retained for stone sprites; stone derivatives use quality 90. No creative repainting or image compositing was performed during optimization.

Thumbnails must be captured from actual integrated gameplay after implementation. This worker has not substituted an invented game screen for a thumbnail.
