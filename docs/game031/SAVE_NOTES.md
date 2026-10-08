# Game031 local save implementation

Base: `dd31ed5818893c1e45c0af304a55f61aab7acc2d`. Storage implementation delegated to `/root/game031_storage`; validation completed 2026-10-07 23:25 UTC. Files: `src/games/game031/Save.ts`, `tests/unit/game031-save.test.ts`. This document records component tests; native browser saving and publication remain separate QA stages.

## Data and transactions

- IndexedDB database `game100garage-game031`, database version 1, object store `worlds`, key `current`. One read/write transaction atomically replaces the complete coherent snapshot. No voxel operation journal and no world JSON in localStorage.
- Snapshot schema, generator, block definition versions are each 1. Final dimensions are X128/Y64/Z128; the Phase A X32/Y32/Z32 prototype is also accepted. Practice dimensions are deliberately rejected by persistence.
- Terrain consists of final differences per changed chunk. Chunk keys are `cx,cy,cz`; a local cell index is `x + 16*(z + 16*y)`. `World.exportDiffs()` omits coordinates reverted to their original terrain. Snapshot inventory, statistics, player state, revision, and timestamp travel with those differences.
- `save()` validates and copies all fields before waiting for IndexedDB. Editing the live arrays during the save cannot change the captured snapshot. The promise resolves only on transaction completion; request success alone never means the save committed. Failed transactions preserve the prior committed snapshot. Live-state dirty revision clearing belongs to the caller and must compare the captured revision.
- `load()` returns a validated snapshot or null for an absent save. Corruption, unavailable storage, blocked opening, denied access, and transaction failures reject with a safe `SaveError.code`. No failed save reports success. The UI is responsible for preserving the in-memory world and showing retry/export choices.
- `exportStoredBackup()` can retrieve the existing record as JSON even when a future generator/schema is unsupported. It does not erase or migrate the record. World replacement must use a successfully generated/validated new snapshot and a successful `save()` before dropping the old world; `remove()` is not a prerequisite for replacement.

## Import boundaries

`parseBackup()` enforces a 16 MiB UTF-8 file limit and parses JSON as data. `validateSnapshot()` checks versions, supported dimensions, bounded world ID/seed/revision, timestamp, finite player state, inventory type/range, selected material, nonnegative statistics, material discoveries, chunk count/coordinates, duplicate chunks/cells, local indices, and BlockID 0–8. The bottom, external walls, and protected return pad cannot be edited through an import. Inventory entries 0/AIR and 9/BOUNDARY must be zero.

Finite positions outside the world or inside terrain are retained for `Physics` to restore safely to the return pad, rather than discarding the saved terrain. Nonfinite values are rejected. Import validation happens before any database write; a bad import cannot clear the existing save. Save data remains local and is not sent to Analytics.

## Component verification

`npx vitest run tests/unit/game031-save.test.ts`: **41 passed**, duration 2.65 seconds (test execution 2.38 seconds). The 1,000 / 5,000 / 10,000 edited-voxel restore checks are explicitly synthetic fixtures, not a claim that a person mined that many blocks. Final differences are parsed, restored to a generated `World`, and compared exactly alongside inventory/statistics. Transaction-contract fixtures cover an aborted write, read failure, unavailable/denied storage, snapshot capture during later edits, preservation/export of unsupported versions, bad-import preservation, and explicit removal.

Targeted strict TypeScript compilation of `Save.ts` passed. The first compilation reported the ordinary `unknown`-to-boolean narrowing error on the already guarded `grounded` property; its annotation was corrected and compilation rerun successfully. This is a type/schema correction excluded from Jev routing by `JEV_REVIEW_RULES`; no unknown semantic failure or Jev API call occurred in this component stage.

These unit fixtures do not simulate actual browser quota allocation, mobile termination, or blocked multi-tab upgrade timing. Native IndexedDB roundtrip, failed-write behavior, save-size/time measurement, invalid-position recovery, and browser import/export are to be recorded by the root QA stage. Browser closing/pagehide saving remains best effort; periodic saving is the primary mechanism. No cross-device synchronization or server backup is implemented.

## Reproducible native browser stress harness

`tests/game031/storage-browser.mjs` imports the actual World/Save/Engine modules into an isolated local-origin browser harness. It requires a **new, nonexistent** output directory and records source SHA256, incremental per-step results, and the first failure's screenshot/state. Example (with the local Vite server running):

```sh
GAME031_URL=http://127.0.0.1:4311/game031.html \
GAME031_QA_OUT=docs/game031/QA/storage-native-UNIQUE_UTC \
node tests/game031/storage-browser.mjs
```

Its 1,000 / 5,000 / 10,000 modifications are synthetic mixed mining/placement fixtures in the full X128/Y64/Z128 world, checked against native IndexedDB, restored voxels, inventory, statistics, and parsed backup. Timing distinguishes generation/edit preparation, save completion, load completion, and restoration/comparison. `serializedBackupBytes` measures UTF-8 JSON backup size, not the browser's opaque physical IndexedDB allocation.

Failure coverage uses an actual native transaction abort and an actual native upgrade blocked by another held connection. Quota and SecurityError are explicitly injected faults; they do not establish real-device storage exhaustion or permission behavior. Additional cases check reverted differences, snapshot capture before later edits, corrupt record preservation/export, invalid-import preservation, and safe-return of an invalid restored position. The harness rejects production URLs and loads no gameplay or external analytics. Its screenshot depicts the fixture harness, not gameplay.

Harness syntax validation passed; native execution results must be cited from its distinct `REPORT.json` after the root grants the exclusive browser QA slot. This paragraph does not claim execution.
