# Existing Godot games in the arcade

The three existing games use pinned Godot web exports. The 2026-10-05 user-requested [title revision](title-revision/IMPLEMENTATION_REPORT.md) changes four title scripts and project names inside PCKs; every unrelated packed resource and engine/WASM/audio file remains byte-identical. Gameplay, saving and controls are unchanged.

| Catalog | Game | Pinned source export | Arcade route |
|---|---|---|---|
| Game012 | お前の仕事は俺の仕事 | `yokodori-days/build/web` | `games/yokodori-days/index.html` |
| Game013 | タスク天国 | `tachibana-task-heaven/docs` | `games/tachibana-task-heaven/index.html` |
| Game014 | 指ハートチャレンジ | `finger-heart-challenge/web` | `games/finger-heart-challenge/index.html` |

The source repositories remain intact. Exact commit revisions, source paths, byte counts and SHA-256 hashes are recorded in [the published export manifest](../../public/games/export-manifest.json).

## Navigation and original UI

Each new `index.html` is a small Japanese navigation shell. Its ordinary anchor `#legacy-portal-return` points to `../../index.html`, which also resolves correctly under a project subpath. The return bar reserves 52px plus the device's top safe area outside the game; its anchor has a minimum 44px target.

The original export's `index.html` becomes `game.html`; its title/description are updated by the title revision. A same-origin iframe (`#legacy-game-frame`) fills the remaining space. The existing Godot `canvasResizePolicy: 2` therefore receives the actual game viewport through the iframe, rather than drawing beneath an overlaid link. Original loading notices, engine configuration and bootstrap code stay intact. Native fullscreen is allowed; the browser's fullscreen exit returns to the navigation shell. Touch and keyboard input inside the frame continue to use the original game's handlers.

These are the original single-threaded Godot 4.5.1 exports (`GODOT_THREADS_ENABLED = false`). They are not connected to the arcade's CREDIT, onboarding or telemetry controllers. Existing game persistence uses the original Godot project names and filenames; no save migration or shared score namespace is introduced. The rhythm game's portrait guidance and pause behavior remain part of its original UI.

The rhythm export also requires its existing `audio.js` and `audio/*.wav`. The copy includes these files, both Godot audio worklets, icons and loading image. Editor-only `.import` sidecars, `.gdignore` and GitHub Pages `.nojekyll` are omitted. Runtime WASM/PCK copies are kept separate to avoid rewriting any engine executable or worklet paths.

## Refreshing a published export

Run from the arcade repository:

```sh
python3 tools/import_legacy_games.py --sources /workspace/legacy-games
python3 tools/rename_legacy_titles.py --sources /workspace/legacy-games --godot /path/to/Godot_v4.5.1-stable_linux.x86_64
npm run check
npm run build
```

The tool first checks all three clone revisions against its pins and validates the required runtime files. It then copies the exports, verifies each source/destination hash, writes only the external navigation shells, and updates `public/games/export-manifest.json`. The clones are read-only inputs. It does not build Godot games or modify either repository's saved gameplay files.

For an intentional version update, review the source repository change, update the commit pin in the import tool, refresh the copies, and repeat native browser QA before publishing. Verify root and subpath loading, original keyboard/touch controls, retry/reload, audio, fullscreen and the reserved return link. Static hash checks establish byte preservation; they do not establish gameplay or browser compatibility.

## Thumbnails and notices

Game012–014 thumbnails use authentic saved gameplay screenshots from the pinned repositories, resized to 640×360 at their existing 16:9 ratio. The retained source PNGs and all transformations/hashes are listed in [the portal asset index](../../assets/portal/thumbnails/asset-index.json). They are not synthetic play scenes.

[Godot's MIT notice](../../public/games/licenses/GODOT_MIT.txt) is copied from the Task Heaven repository. Each game's `licenses/FONT_OFL.txt` preserves the source font's SIL Open Font License notice. Original copyright and font notices in the game packages remain intact.
