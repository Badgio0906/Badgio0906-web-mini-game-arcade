# Game012 prototype — independent code review, first checkpoint

Reviewer: `legacy_source_audit`; read-only inspection 2026-10-09T01:49:40Z–01:51:01Z (10:49–10:51 JST), base `488916c2966710d34233cd212ff970c5501b1091`. The current prototype was uncommitted. Current request and instruction provenance: [SOURCE_AUDIT_013_014](../SOURCE_AUDIT_013_014.md). No Jev response / Shadow log was read, and no API, browser, implementation edit or commit was made by this reviewer. Findings were reported to the root as observed, before root fixes. This is an initial source checkpoint, not final acceptance.

## Concrete findings

| Finding | Observed source / independent conclusion | Required evidence / impact |
|---|---|---|
| R012-01: comparable imported BEST drops after a weaker result | `legacyStore.ts:44–45` checks normal first, legacy only otherwise. A stored mirror `{normal:2,legacy:100}` therefore returns2. Game012 legacy is explicitly classified comparable by the next branch, while original high_score remains100. **PRODUCT_BUG; CODEX_ACTION_REQUIRED=true.** | AUTOMATED_TEST: imported100 + finalized2→Portal100; stronger101→101; both concurrent tabs and0. Unresolved release risk=true because core personal BEST is incorrect. No browser reproduction claimed. |
| R012-02: IDB read error displayed as absence | `open(false)` (`legacyStore.ts:14–20`) returns null for genuine first creation, blocked, error, thrown denied-access and timeout. `readLegacyMirror:40` maps all null outcomes to `none`. **PRODUCT_BUG; CODEX_ACTION_REQUIRED=true.** | AUTOMATED_TEST: genuine nonexistent DB→none without initialization; denied/error/blocked/timeout→unavailable; valid zero→record0. Unresolved major release risk=false (game still runs), but the requested absent/error distinction is incorrect. |
| R012-03: kind is string-coerced instead of primitive-validated | `legacyProtocol.ts:15,19` uses `String(p.kind)`. A structured-clone-safe array `kind:['result']` passes kind/schema field selection, but `LegacyGameRecords.ts:21–25` exact-kind checks miss it and `:26–32` falls through to finalized result processing after a matching start. **PRODUCT_BUG; CODEX_ACTION_REQUIRED=true.** | AUTOMATED_TEST: array/object/null kind rejected; legitimate primitive kinds still accepted; dispatch never processes invalid message. Unresolved major release risk=false: this weakens the exact schema contract, but does not bypass required same-origin/frame/session checks or make legitimate client scores cryptographically trustworthy. |

Forward-scope note (not proof of a live Game013 fault): `LegacyGameRecords.ts:22–23` currently mirrors any `current_best` as normal regardless of mode. Before enabling013, either constrain current_best to normal or route an explicitly versioned OJT best separately. The original source OJT-history finding remains in the earlier audit;012 does not use OJT.

## Source protections found

- Parent checks exact `event.origin===location.origin`, actual iframe `event.source`, visible frame, same-origin `/game.html`, matching session UUID and expected game / rules / mode (`LegacyGameRecords.ts:17–20`, protocol). New launch mints a fresh nonce; original engine saves / state are not scraped. Wrong-origin/window/session rejection must still be tested.
- Parent requires active start/result ID and suppresses finalized replay; practice start/result is excluded. Parent and child bound their ID sets. Child formal functions never notify every frame, and finish deletes its active run. Source proof is not browser replay QA or tamper-proof scoring.
- Native patches preserve original high_score cfg read/write and game score calculation; only notify legitimate cfg values, missing sentinel−1, storage errors and one native final signal. A missing sentinel does not synthesize a zero result. Original Godot end/save callbacks retain their existing behavior.
- Atomic IDB read-max-write transaction isolates each game key and mode field; lower writes cannot replace a higher value within the same field. It still needs concurrent real-browser testing. These are mirror values in a new database, not modifications of original cfg.
- Historic `legacy_best` / `current_best` handlers only mirror data; no `sharing.complete` or `startRun`, so no automatic retrospective submission from imported saves.
- Current sharing requires a fresh native start. Added strict automatic permission captures ON state and settings epoch at start; enabling automatic after that start cannot auto-submit that RUN. Manual confirmation remains separate. Analytics consent / identifiers are not used.
- Native retry sends another start, clearing prior result controls. Menu hides/unloads iframe; observer / legacy lifecycle clear controls. Keyboard / click handlers on sharing controls stop propagation, leaving original engine controls separate.
- Current012 definition is integer score, higher better, rules1 / mode normal, maximum safe integer, pending review above1000000. No invented hard cap or score formula.

## Reviewed source snapshot

SHA256 captured at `2026-10-09T01:51:01.831538+00:00`:

```text
src/records/legacyProtocol.ts acd0cf1750aaf04a2bcd2c92322e3ac8bf64c69429be18070d5e28adc841d9d0
src/records/legacyStore.ts 267253f45b9847b03f75f5fda185df884c0bd95e4f0073ad45dc9ea02b381026
src/records/LegacyGameRecords.ts f6097a4811d6f2c6e30173ae1b2a09a9744b88f3343f352a5cd21b6e0507140a
src/records/RecordSharing.ts 3310e00c09350e6fd70a4012d0eac53d1cb145f1017db8d8002261a336c22697
public/games/native-record-bridge.js 03c604cd4430da7e4a837a75b8ab51b013c1cfa09d68990dfc93c8445efc326b
public/games/yokodori-days/index.html b4d16eeed1d3d355f0e35f55fc9cd6f8038a42436ffdc6ac455c591c6194c8ad
src/data/recordDefinitions.ts d8b29922efea3bd7eb172c9c740cbde85e992d8754bed84852b941825e37795e
tools/legacy-record-patches/RecordBridge.gd 898e67592b7f666cc299d4cf9fb00edce69d826ef0911c23cd2a134bd414ecf4
tools/legacy-record-patches/game012/high_score_manager.gd.patch b60110d09d09a63d4451d5bcfd8f4ab6fd753c1db53206afb6d1fed7b30881bf
tools/legacy-record-patches/game012/game_manager.gd.patch 1d85f992a22bc4c737d348002af59a4e057afb1c3053d33e11966256034b02ce
tools/legacy-record-patches/game012/main.gd.patch d81c7b9f55be63abacff237c9b2de9f6156638ea4ddaeedd67208cbfe646d59b
```

## Acceptance remaining

The three findings need fixes and meaningful regressions before012 prototype acceptance. Godot compilation, save flush/reload, actual normal finish, frame native retry, Portal imported/current BEST, phone layout / menu controls, original audio / images and production endpoint absence remain root/QA work. No013/014 implementation or deployment is authorized by this review’s PASS; those wait for actual012 end-to-end success.

## Re-review checkpoint 02 — root fixes, 2026-10-09T01:54:34Z

The initial findings and initial hashes above remain unchanged as historical evidence. This re-review did not read Jev logs or repeat browser / automated tests. Root reports its separate regressions / browser work; this reviewer assessed the changed source only.

| Initial finding | Changed branch inspected | Independent source conclusion |
|---|---|---|
| R012-01 | `legacyStore.ts:45` now returns `Math.max(p.normal??0,p.legacy??0)` for012 when either field exists | Correctly preserves comparable imported100 against normal2 and lets101 supersede100. Existence checks preserve missing-vs-zero. Other games do not merge legacy unknown-mode data into normal. Fixed at source level; concurrent transaction / browser persistence remain separate evidence. |
| R012-02 | New discriminated `OpenResult` (`:14–21`) separates intentional aborted absent database from unavailable error, blocked, timeout or throw; `readLegacyMirror:41` maps these separately | Fixed at source level. Read-only absent database opens then aborts its upgrade transaction, rather than persisting a new database. Reader transaction errors also remain unavailable. |
| R012-03 | `legacyProtocol.ts:14` rejects non-string kind before field selection | Array/object kind can no longer reach String-based allowlist or result fallthrough. Exact field set / typed values retained. Fixed at source level. |

Forward013 current_best routing note is also constrained at `legacyProtocol.ts:22`: snapshot / storage_error notifications require mode normal; explicit OJT current snapshot cannot be promoted via this route.

Additional requested lifecycle / source checks:

- `runPractice` is captured at start. Either start practice=true **or** result practice=true resets / excludes the result (`LegacyGameRecords.ts:25,28`), so a practiced RUN cannot regain eligibility by flipping its final practice flag.
- Start mode=ojt followed by result mode=normal is rejected (`:26`). Start normal followed by final ojt is saved only to OJT, with sharing cleared (`:29–33`). This parent does not observe intermediate OJT toggles, so native per-RUN sticky OJT tracking remains required before013; it is not solved by final-mode validation alone.
- Shared automatic eligibility captures ON at start and the settings epoch. OFF→ON or enable-at-result cannot automatically submit the already-started native run; explicit manual sharing remains separate. Historic snapshots never call complete.
- Wrong origin, wrong `WindowProxy`, hidden frame, wrong game, missing / wrong nonce, wrong rules, unknown fields, noninteger / nonfinite score are rejected before recording. Current nonce is read from the actual iframe URL, not trusted from a message. Old-page nonce cannot match a fresh launched URL even though the iframe's WindowProxy itself is reused.
- Formal result requires active matching RUN and is finalized once within the bounded64-id parent ledger; child finish deletes its own active id. This is duplicate handling for the intended native lifecycle, not a guarantee against a compromised same-origin page. No secrets / Analytics IDs enter the result message.
- Record bridge absence outside web returns no interface, empty RUN id and no finish notification. Storage failure returns warnings rather than blocking original engine controls. The optional parent handler catches its own errors. Successful native controls / actual audio / unload-save timing still require live QA.

Re-reviewed source hashes (SHA256):

```text
src/records/legacyProtocol.ts bc9fc5713e1a09b51eb915e54512d8005d71b5dde6a9eaf6580213b65e7746be
src/records/legacyStore.ts 88fc0eb5c916a2acdf807282fe5385ed3fcc73c8119a425ae2cc6fe0e98a3ddf
src/records/LegacyGameRecords.ts f6097a4811d6f2c6e30173ae1b2a09a9744b88f3343f352a5cd21b6e0507140a
src/records/RecordSharing.ts 3310e00c09350e6fd70a4012d0eac53d1cb145f1017db8d8002261a336c22697
public/games/native-record-bridge.js 03c604cd4430da7e4a837a75b8ab51b013c1cfa09d68990dfc93c8445efc326b
```

No additional012 source finding arose in these requested checks. This conclusion is a narrow code re-review; no browser / human / release PASS is asserted.
