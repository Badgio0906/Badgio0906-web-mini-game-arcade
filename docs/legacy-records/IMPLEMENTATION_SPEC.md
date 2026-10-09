# Godot012–014 common record integration

Baseline arcade `488916c2966710d34233cd212ff970c5501b1091`; current user request is [REQUEST](REQUEST.md). Source pins and reading checkpoints are in [SOURCE_AUDIT](SOURCE_AUDIT_013_014.md), [READ_RECORD](QA/READ_RECORD.json), [BASELINE](QA/BASELINE.json). This task preserves the existing Godot games, original ConfigFile keys, rules, title overlays, stage timing, audio, routes, catalog order and retired010. No new gameplay or assets are commissioned.

## Staged acceptance

First012: native final result → optional bridge → common personal record → Portal → reload/retry. [Prototype012](QA/prototype012-01/REPORT.json) passed2026-10-09 with an actual normal100-point result, eight browser checks, no QA POST. 013 expansion began after that checkpoint. An agent prepared an untested014 draft during013 work; root held014 export/integration/QA until013 prototype04 passed. This is the actual order, not a claim of fully serial drafting. Original012 tests60 and added optional bridge13 checks passed with exactGodot4.5.1.

## Representative conditions

| Game | Personal/current shared board condition | Native authoritative store | Old data |
|---|---|---|---|
|012|Original integer score, higher, normal/rules1|`user://high_score.cfg`, `[scores] best`; retain original mid-RUN saving|Comparable oldBEST may be mirrored for personal display because pinned rules and resources are unchanged; never a fresh shared result|
|013|Existing standard three-stage total score0–11400, OJT unused for the entire RUN, normal/rules1|Keep `task_heaven.cfg` unchanged; separate small versioned current-normal/OJT BEST file|Old combinedBEST lacks assistance history; display separately as old mode-unknown, never compare with normal|
|014|Existing total successful HEART stops0–25 in one finalized normal RUN, normal/rules1|Small new versioned ConfigFile; no original persistentBEST exists|No historicBEST is invented|

Fresh results are only native authoritative finalization events. Startup configuration reading is a separate kind. Practice/debug/synthetic results are not production records.013 may become assisted during the RUN but cannot regain normal eligibility by switching OJT off. Intermediate stage screens are not finalized results.

## Optional bridge and local mirror

The child defines a fixed JavaScript object before the Godot engine starts. GDScript obtains it with the official `JavaScriptBridge.get_interface` and calls primitive methods; no eval, score interpolation, internal WASM probing or filesystem scraping. The parent checks exact allowed fields, finite safe integer types, game/rules/mode, origin, actual iframe window and a fresh page-session UUID. Start/result identities pair once; duplicates and stale sessions are rejected. This is lifecycle validation, not proof against deliberate client tampering.

Native ConfigFile remains the game's authority. The common IndexedDB mirror stores only tiny validated maxima/condition metadata; it never reads engine filesystem bytes or world/save contents. Atomic read/max/write prevents same-rule mirror values decreasing across tabs. Missing is not a fabricated zero. Typed record0 is valid. Refused storage is reported as unavailable and does not block play, native saving or retry. Portal adapters never load the engine. An old record can be shown only after that native game has actually loaded its own saved value.

## Shared records and external boundaries

Use existing RecordSharing, PublicBests and registered boards. Initial automatic sharing staysOFF; production records endpoint is currently unconfigured/preparing. HistoricBEST notifications never create share candidates. New Godot RUNs additionally require automatic sharing to have been enabled at start, with the same permission epoch at finalization; OFF-era results are not retroactively auto-posted. Manual explicit sharing remains the existing flow when backend is available. Optional result controls are outside the native canvas and removed on native retry/menu.

Analytics consent/identifiers are separate, generalTelemetry schemas/flags and backend permissions are not changed. No new secret, migration or Cloudflare deployment without existing capability. Keep backend disabled/preparing if unavailable. No external synthetic gameplay/record writes. AdSense/GA4/CREDIT remain unchanged.

## Export and verification

Exact compiler `4.5.1.stable.official.f62fdbde1`, official templates and immutable pins; source overlays include already authorized title/start-choice changes. Regular full source export into an isolated directory, audit packed resources and runtime hashes, then reviewed import. Preserve managed wrapper/start choices/bridge on importer rerun; fail closed on old or mismatched exports. No forced use of installed4.6.3 or manual PCK score patching.

Final acceptance requires native PC and touch-equivalent normal operations, result/retry/reload, old save retention, practice/OJT exclusions, origin/session/type/replay cases, optional storage failure, immutable artwork/audio/resources, root/check/build + Worker regressions, independent code/actual image review, then expected official commit CI and public byte/native verification. Human enjoyment and physical phone/audio are not established by automated technical QA.
