# Game060 GAPS SE — independent code and artifact review

2026-11-02. Reviewer: separate Codex worker `game060_audio_review`. Base: `7921686e`; branch: `codex/game060-gaps-se-20261102`.

Reviewed SHA-256: `audio.ts` `785debb406b7b7bee7c8dd397b41035eea5eacea84a499c5671c143c87a4d0b8`; `main.ts` `d07ce57d0992aa621a885b54455ce4cbad6615590e8ab1f059e812b4028c079d`; generation tool `04922c88c1a2db5204ec6bbf36532a9dc3c7f9e0adafec5e1a76d2bdc2c39e8f`.

## Initial finding — corrected during review

**G060-AUDIO-ASYNC-SUSPEND (medium): explicit resume can lose to a pending suspension.**

In `src/games/game060/audio.ts`, `suspend()` issues `ctx.suspend()` without tracking its pending completion. `resume()` calls `unlock()`, which only requests `ctx.resume()` when `ctx.state` already equals `suspended`. WebAudio state changes are asynchronous. If resume occurs before suspension completes, gameplay resumes while the later suspension leaves the context suspended and subsequent SE silent. Starting again later can recover audio, but normal play after the fast resume does not call unlock per reservation.

Executed reproduction used the actual `audio.ts` transpiled in memory with an explicitly deferred suspend mock, without modifying product code or test files:

```text
after unlock: running
after suspend(); resume(): running
after queued suspend completes: suspended
```

The initial unit mock's synchronous state updates concealed this ordering. A regression with a deferred suspend completion and explicit desired audio state was requested. A fix must not automatically resume audio after a later pause, pagehide, visibility loss, or close. This was a deterministic ordering reproduction, not a claim that the race was observed on a physical device. The coordinator was notified immediately. Jev/API calls were not made by this reviewer, as requested by the task owner.

## Final fix review

Final reviewed SHA-256: `audio.ts` `389213e02ab7f0815d844482cae67b3927c867371d6304b55da518c152d89c2c`; `main.ts` unchanged from the initial review; focused test `ca0f99a672f25db729b89c021913649d6cf31f88e57dfc8d98a8e13bc42c37b1`.

The coordinator added `wantsRunning`, a pending suspension promise, and a current-context identity guard. `unlock()` now requests resume synchronously from the user gesture and rechecks desired state after a pending suspension completes. `suspend()` and `close()` revoke that desired state. The completion callback checks both desired state and context identity, so a later pause or a closed/reopened device does not revive the old context.

Independently reran `npx vitest run tests/unit/game060-audio.test.ts`: **1 file / 6 tests passed**. The added sixth test uses a deferred suspension and demonstrates both immediate explicit resume winning and a subsequent pause remaining suspended when the pending transitions settle. The original finding is cleared for this reviewed source; no other code/artifact issue requiring a correction was found.

The unconditional blur listener suspends audio even during the ready phase, while the original phase-aware blur listener only pauses running play. `beginClock()` now calls `sfx.unlock()` directly inside the consumed pointerdown/Space gesture, so starting after ready-phase blur reopens the audio path. Starting consumes the gesture and returns before reservation, preserving the original input boundary. This is a code assessment; the coordinator's browser acceptance remains separate evidence.

## Executed checks and other observations

- `npx vitest run tests/unit/game060-audio.test.ts`: 1 file / 5 tests passed. Did not run the imported model tests that write existing `qa/` files.
- Independently hashed all 13 distributed WAVs: each matches its manifest SHA-256; total WAV size is 609,884 bytes. All stored signal QA records passed; all provenance entries are verified and allow redistribution; all 13 recorded reproduced asset IDs equal their expected IDs.
- No GAPS source asset IDs are fabricated. The recipes use procedural waveform/noise layers and retain deterministic seeds, requests, exported recipes, rights metadata, and approval basis. Production selection is explicitly distinguished from human listening.
- The built-route URL resolves to `games/thunder_booking/assets/gaps-20261102/…`. `scripts/build-prototype-games.ts` builds with the Game060 config, whose closeBundle copies `public/assets/game060/` into the game's `assets/`; the static path therefore agrees with the copy contract. The dev URL instead uses the root public `assets/game060/` path.
- Both samples and synthesis fallback use the tracked source map and shared master compressor. Mute, stop, suspend, and close remove tracked sources; natural onended callbacks disconnect their nodes; high-priority samples can replace lower-priority voices while notifications cannot displace a clear cue. No score/model/storage edits are present in the reviewed game diff.
- Fetch/decode failure falls back at the event time rather than queueing a delayed sound. Context identity prevents a late decode from populating a reopened context. Main wiring stops old voices on restart/title/pagehide/blur/visibility loss.
- The reproduction tool intentionally requires a fresh export workspace because GAPS exports reject overwriting packages. Its recorded repeatability IDs pass; the tool currently records those equalities without an explicit equality assertion, so the coordinator should treat the independent check above as the executed equality evidence.

## Scope and limits

This was a code/artifact review plus focused unit tests, the initial asynchronous-ordering reproduction, and a re-review of its fix. It was not a browser interaction, visual, human listening, mobile speaker, or physical-device review. Production publication and GitHub mutation were not performed by this reviewer.
