# Native Godot record bridge

Official references, read2026-10-09: [JavaScriptBridge tutorial](https://docs.godotengine.org/en/4.5/tutorials/platform/web/javascript_bridge.html), [class API](https://docs.godotengine.org/en/4.5/classes/class_javascriptbridge.html), [Web export](https://docs.godotengine.org/en/4.5/tutorials/export/exporting_for_web.html). `get_interface` gets a fixed JSglobal object and primitive values cross the bridge. Calls are guarded on non-Web/missing interface.

GDScript helper: `tools/legacy-record-patches/RecordBridge.gd`. Child interface: `public/games/native-record-bridge.js`. Parent: `src/records/LegacyGameRecords.ts`; schema: `legacyProtocol.ts`; metadata mirror: `legacyStore.ts`. Public entry `legacy-records.js` is independently bundled and loaded only by these three wrappers.

| Method | Meaning |
|---|---|
|`legacyBest(gameId, value)`|Existing valid nativeBEST; -1 means missing; historic display only, never share|
|`currentBest(gameId, value)`|Versioned native normalBEST read; -1 missing; never creates a result|
|`storageError(gameId)`|Safe failure notice; no save bytes/errors with paths or secrets|
|`cancelRun(gameId)`|Native TITLE/abandon ends the optional record scope and clears result controls; no finalized result|
|`startRun(gameId, "1", mode, false)`|New native RUN; child creates and returns UUID|
|`finishRun(gameId, resultId, "1", mode, value, false)`|Finalized native result, once; no new score formula|

Payload exact fields: `channel`, `schema`, `game_id`, `session`, `kind`, `ruleset_id`, `mode_id`, `practice`; `run_result_id` only start/result, `value` only best/result. No analytics/player identifiers or full saves. Parent accepts same-origin, current iframe and wrapper-created page-session only. Values are integer0..native maximum (best missing sentinel-1); unknown kind/field/version and string/array substitutes fail closed.013 final mode may degrade normal→OJT, never OJT→normal. Practice state at either start or result excludes records.

Startup imports and newRUN results have separate trust/eligibility paths. Every native reload/retry supplies a new result identity; finalized sets are bounded. JS exceptions/storage/network failure never become gameplay prerequisites. Page session and result UUIDs mitigate stale/duplicate messages; they are not client-side anti-cheat guarantees.
