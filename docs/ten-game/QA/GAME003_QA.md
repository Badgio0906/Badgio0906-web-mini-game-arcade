# Game003 C-mode QA

Status: **automated model and actual-input browser PASS; human K–N playtest pending**. Immutable DEV candidate: `http://127.0.0.1:5175`, `/workspace/scratch/ten-existing-frozen`. Independent Feel / Visual also PASS85; their phone normal branch and desktop C branch are separately attributed to the reviewer.

## Executed

`npx vitest run tests/unit/game003.test.ts tests/unit/tower-escalation.test.ts tests/unit/revision-features.test.ts`: **23 /23 passed**,452ms. Four new escalation cases cover strict>15m (exact15m remains normal), whole-state freeze / no queued drops, irreversible mode / reset, prospective3× capped Perfect,2× hanger angular rate with real clock / full cargo / gravity unchanged. Existing60-floor / support / mass / slip / collapse policies retain their assertions with an explicit normal choice. TowerScene still makes the original30 cosmetic global-RNG calls per landing.

```sh
npx playwright test --config tests/ten-game/existing.playwright.config.ts game003.spec.ts
npx playwright test --config tests/ten-game/existing.playwright.config.ts game003.spec.ts --project desktop --grep 'real drops reach15m' --output artifacts/ten-game003-C-calibrated
```

Final combined **11 distinct PASS** (desktop6 / portrait3 / landscape2),13 intentional duplicate-project skips. Initial suite10PASS /1 harness failure /13skips took6.5m. Targeted attempts2.8m and3.2m retained narrower harness failures; final targeted test passed2.4m. Fourteen executed tests across those runs include three failures; those failures are not omitted or counted as runtime fixes. Logs `/tmp/ten-game003-e2e.log`, `/tmp/ten-game003-C-final.log`, `/tmp/ten-game003-C-raf.log`, `/tmp/ten-game003-C-calibrated.log`.

## Actual observations

- Normal keyboard / native taps preserve complete cargo, reject release spam / two-finger double input, pause physics / mute / small-size layouts and persistence.
- Three natural failures consume one credit each, zero exposes one offer, repeated Stub clicks request / grant only once and refill3. Storage is isolated from other games. Persisted pagehide handler pauses / resumes without an extra quit / run_end.
-18 actual accepted normal floors scroll above ground; full stack height equals its retained cargo sum. No injected score / time / pose / RNG / force-end hook is used.
- The new actual route offers at22floors /15.0667m. The entire inspection freezes during Space / synthetic persisted pagehide /400ms / eight viewport resizes. Normal / C / Title actions remain≥44px and inside the viewport at1920×1080,1440×900,1280×720,1024×768,390×844,320×568,844×390,568×320. No credit / terminal / quit before choice.
- Native C choice preserves BONUS1300 /7Perfect. One subsequent ordinary Space release accepts floor23 /15.75m as Perfect with combo1, raising BONUS to1600 /8Perfect: actual prospective300 points (=100×1×3). No later offer. Natural failure immediately charges CREDIT2; once-only outcome / duration / milestone / offer / accepted events, separate floor best / bonus best and retry normal reset pass. Error list is empty.

Portable actual evidence: [GAME003_ACTUAL_C_PROOF.json](GAME003_ACTUAL_C_PROOF.json), copied from the executed test’s original ignored artifact without alteration. This includes every earned landing / eight actual offer bounds / events and errors. It is evidence of native automated play, not human timing skill.

## Harness history and limits

The first C attempt read the full growing stack between alignment and native Space; during that IPC delay the2× hanger advanced14–30pixels. Six legitimate stable landings were non-Perfect. A smaller Node polling predicate then missed the narrow center window; browser-RAF readiness subsequently released but still lagged14–20pixels. The final read-only planner anticipates measured native latency (initial60ms, adjusted from actual landing / velocity), waits on browser RAF, then sends the same real keyboard Space. It never edits model state or relaxes the six-pixel Perfect rule or3× assertion. All three traces / screenshots remain in ignored artifacts.

Synthetic persisted pagehide verifies the lifecycle handler, not an actual browser-history bfcache restoration. Headless Chromium touchscreen emulation is not a physical phone FPS measurement. Shared-font growth / final production10-route resource checks remain pending. Human play and fun / C-mode difficulty acceptance remain in the blank K–N forms.
