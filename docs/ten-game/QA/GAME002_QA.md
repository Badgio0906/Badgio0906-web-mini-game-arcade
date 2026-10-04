# Game002 expansion — QA

Status: **PASS for the current automated / ordinary-input browser candidate**. Human milestone / bike playtests remain pending. Candidate: root's immutable DEV snapshot `/workspace/scratch/ten002-frozen`, `http://127.0.0.1:5174`. Other-game authoring did not reload this candidate.

## Executed evidence

| Check | Actual result |
|---|---|
| Targeted original model / NICE / escalation tests |25 /25 PASS,4.65s;7 new escalation tests |
| Full existing unit baseline (Main Agent executed) |77 /77 PASS,6.83s; includes the targeted cases, not additional distinct tests |
| Browser cases |13 distinct PASS: desktop8 / portrait3 / landscape2;17 deliberate cross-project duplicate skips |
| Earned company offer |Normal keys reach1000m; model/input/time freeze, actual8-size card / ≥44px actions, explicit office clear, CREDIT3 and legacy clear record persist |
| Earned bike offer |Native Enter selects journey, normal adjacent keys reach2000m; frozen through cached pagehide and8 resizes, all four actions visible / ≥44px, native double-click safe exit commits once |
| Safe exit / persistence |One run_start/end/duration/score/safe_exit, two milestone / offer events, one journey escalation acceptance; no credit_used / office_clear / quit; distance2000, bestScore saved separately, old95555ms clear time / cleared flag preserved after reload |
| Ordinary collision / reward |Three natural collisions debit once each; retry, zero offer and guarded Stub grant3, keyboard / native touch / secondary-pointer / mute / cached-pagehide tests pass |
| Genuine NICE |Three real late escapes produce110% rounded result, one natural debit, separate bestScore; old1000m best and95555ms clear time preserved |
| Candidate identity |Initial32 files exactly equal; final core / Game002 source / HTML / assets / OFL equal, sole authorized shared WOFF2 subset-growth exception |

Pure simulations additionally cover five seeds each walking / biking beyond5200m, bounded enemies≤12 / waves≤6, exact2× approach / lateral movement / distance with real run duration unchanged, office / safe_exit / collision outcomes, fresh bike collision lead>1.8 real seconds, reset and uncapped scoring.

## Reproducible commands and retained failures

```sh
npx vitest run tests/unit/game002.test.ts tests/unit/revision-features.test.ts tests/unit/workday-escalation.test.ts
npx playwright test --config tests/ten-game/workday.playwright.config.ts
npx playwright test --config tests/ten-game/workday.playwright.config.ts --project desktop --grep 'real late escapes|real journey reaches' --output artifacts/ten-game002-rerun
npx playwright test --config tests/ten-game/workday.playwright.config.ts --project desktop --grep 'real journey reaches' --output artifacts/ten-game002-journey-final
node tests/ten-game/audit-snapshot.mjs game002 /workspace/scratch/ten002-frozen --allow-font-growth
```

The initial suite took8.9m:11 PASS /2 failures /17 skips. Its traces and log are retained locally under ignored `artifacts/ten-game002-initial` and are excluded from shipping. These were test-harness defects, fixed without runtime edits or reduced result expectations:

1. The old NICE oracle left only0.35s to reposition up to two interpolated lanes. It naturally failed before earning the third bonus. Earlier ordinary positioning and safely abandoning unfinished attempts now retain the original3 NICE /110% /score/storage/CREDIT assertions; targeted rerun PASS28.2s.
2. The new journey test's `addInitScript` unconditionally restored the old best1000 on every reload, after the actual2000m safe-exit / eight layouts / saved records had already passed. Initialization now seeds missing keys only.
3. That journey rerun naturally failed367m because its per-frame assertion / API calls delayed two needed lane inputs across separate samples. The trace shows D-wave center38.75s, observations37.834s and38.334s, then collision-zone entry38.517s with the second move incomplete. The final policy reads visible enemy y (as independently demonstrated by the reviewer), batches two genuine adjacent key presses when needed, and removes per-frame assertion IPC while preserving terminal assertions and a normal-input journal. Final targeted journey PASS3.8m.

The intermediate targeted run was1 PASS /1 failure in1.4m; the last run was1 PASS in3.8m. There are13 distinct passing cases across these executions, not a claim that the initial suite was failure-free. No forced model state, RNG override, score injection or milestone timer shortcut was used in actual browser play.

## Limits

These are Chromium desktop / emulated-touch checks and ordinary-input oracle plays, not physical-phone FPS, independent human reaction skill or proof of fun. Human K–N milestone / bike evaluation is pending. Production and final ten-route font/load audits will run at the later frozen aggregate gate; this report does not claim those checks were already executed for the expansion.
