# Godot source export and recovery

Game012–014 keep Godot **4.5.1.stable.official.f62fdbde1**, single-threaded Web, original scenes, input, audio, ConfigFile paths and project settings. `tools/export_legacy_records.py` creates a **full regular source Web export** into a new private directory. It never imports or modifies the original clones, writes `public/`, or transplants compiled resources into an old PCK. Publication remains a separate reviewed-import/QA step.

## Recreate the verified toolchain

Obtain the official `godotengine/godot` GitHub release **4.5.1-stable** only. Keep the inherited proxy, CA trust and network policy; if download access is unavailable, stop rather than use another engine version or unofficial mirror.

| Official release asset | Verified SHA256 |
|---|---|
| `Godot_v4.5.1-stable_linux.x86_64.zip` | `02ec53d1cc7dbb9cc6355393c61b9ab43d1244751a124f10248a4802830788cd` |
| `Godot_v4.5.1-stable_export_templates.tpz` | `1998af37f1387684e2c211cdb483daf492fc64dc6b12096bddcdca25b6910c86` |
| `SHA512-SUMS.txt` | `3e330c660b0d6dc21e57508ae34ba0f77d66007173ea3d9e99adc7af37a6d4c7` |

Release metadata: `https://api.github.com/repos/godotengine/godot/releases/tags/4.5.1-stable`. Release page: `https://github.com/godotengine/godot/releases/tag/4.5.1-stable`. Both archive SHA256 values and official `SHA512-SUMS.txt` were verified for this task; [TOOLCHAIN.json](QA/TOOLCHAIN.json) preserves the exact hashes and editor identity. The full template archive is about 1.36 GB. Extract only `templates/version.txt`, `templates/web_nothreads_debug.zip` and `templates/web_nothreads_release.zip`; no installation into a shared home directory is needed.

The exporter requires version `4.5.1.stable` in the template version file and checks the extracted debug/release template SHA256 values. It checks the editor version before creating output. The verified Linux editor binary SHA256 is `db07cae7de644278a1884d4552bdf2bca3f5d30131b18faf3a0c4d730080b199`.

## Source pins and overlays

Obtain separate read-only clones, or new clean clones checked out at the following pins. Do not change existing task worktrees to prepare these inputs.

| Game | Repository | Source revision |
|---|---|---|
| 012 | `Badgio0906/yokodori-days` | `50a97c339076d3bcadf38ad6be8acade16a8e882` |
| 013 | `Badgio0906/tachibana-task-heaven` | `ddc854b67c6c4efe17e0777ec7de1ce01d4f1ac0` |
| 014 | `Badgio0906/finger-heart-challenge` | `36877d55bb44a41087a61bfd38f3ec395040cb3c` |

The exporter refuses a different HEAD or tracked source modifications. It uses `git archive` into private output, retaining the original excluded tests/tools because their stable UID entries are present in the original cache. Existing output artifact directories are ignored during editor import, so exported icons do not become unrelated new source resources.

The isolated source receives, in order:

1. Existing reviewed title patches and current project name.
2. For 013, the existing optional first-play gate change from `tools/patch_legacy_start_choices.py`.
3. Shared `RecordBridge.gd` and its tracked UID; for 013/014, `CurrentRecordSave.gd` and its tracked UID.
4. The selected game's source hook patches and extra scripts/tests under `tools/legacy-record-patches/gameNNN/`.
5. The exact official single-threaded templates in isolated export presets.

012's original packed OFL uses CRLF whereas its Git blob uses LF; the isolated license is normalized to the original CRLF bytes. Game013 also restores CRLF only for the four pinned `data/{stage_01,stage_02,stage_03,tutorial}.json` resources; parsed stage and scoring data stay unchanged. Game012 baseline then reproduces **all 118 original/current packed resources**, including title changes and original save code. Old PCK container layout can differ because earlier title updates repacked it; compare resource contents separately from whole-container hashes.

Game013's exact-source icon re-import showed a small numeric rasterization difference: 10 of 65,536 pixels, RGB change at most 1/255, identical alpha. The numeric cause is unknown; source SVG and engine are unchanged. Independent Visual review must assess it. No old PCK resource or import-cache artifact is transplanted to conceal the difference.

Helper `.gd.uid` files are tracked, rather than recreated randomly. Every runtime script must have its UID sidecar. For extra game-local files, `scripts/` and `tests/` retain their relative paths; top-level helper files are copied into `scripts/`. Record-hook patches remain explicit reviewed inputs; a game with missing patches is rejected.

## Invocation

From a checkout containing the reviewed overlays, substitute actual private toolchain/source/output locations:

```sh
python3 tools/export_legacy_records.py \
  --game game012 \
  --sources /path/to/read-only-legacy-clones \
  --godot /path/to/toolchain/Godot_v4.5.1-stable_linux.x86_64 \
  --templates-dir /path/to/toolchain/templates \
  --output /path/to/new-private-export \
  --run-native-tests
```

Select only games whose overlays have been reviewed. Repeat `--game game013 --game game014` when both are ready; there is no default “export all” behavior. Output must be new/empty and outside the arcade checkout and original clone directory. A failed run retains its logs and files: use a new directory for a subsequent attempt, rather than overwrite evidence.

The exporter runs editor import, optional native `tests/test*.gd` / `tests/*_test.gd`, then `--export-release Web`. Native tests use the original game's isolated fixtures; they are technical evidence, not human playtesting. When only the exporter metadata/guards change and the native source stays identical, a new regular export without repeating native tests can be compared with the previously tested resources.

## Output and reviewed import

Each `<output>/<slug>/` contains the complete regular `index.html`, JS, WASM, PCK, worklets, icons and `export-metadata.json`. Game013 also gets original `audio.js` and `audio/*.wav`, copied byte-identically from its pinned export extras. The output root contains a combined receipt; isolated source and logs stay alongside it.

Per-game receipt fields include `schema_version: 1`, `game_id`, `slug`, `source_revision`, exact `compiler`, `source_overlay` (repository-relative path and SHA256), `runtime_files` (name/bytes/SHA256), `regular_source_export: true`, and `threads_enabled: false`. Actual source HEAD, Git archive hash, source transformations and command/log hashes are also retained. A hash receipt establishes provenance and integrity, not gameplay or release approval.

Only the reviewed importer may copy this complete output into `public/games/`. It must verify all selected source pins, current overlay hashes and runtime hashes before writing; preserve managed external shells; use the new exported `index.html` as child `game.html` with the fixed native bridge script before engine start; and retain external audio extras. Do not restore old PCK-only patching tools as the current records workflow.

If a checksum, pin, patch application, import, test or export fails, keep that run, inspect its local log, fix only the cause, and export into a new unique directory. Do not upgrade Godot, switch templates, silently edit original sources or discard old player saves. Native bridge absence/failure is designed to leave original game saving and input functional; browser/end-to-end integration and independent reviews are still required before publication.
