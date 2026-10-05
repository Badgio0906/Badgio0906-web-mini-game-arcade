# Game018 isolated model evidence

These records are historical isolated-model runs in `/workspace/scratch/game018/model/` before integration. Their captured absolute temporary paths identify that original run; they do not claim the integrated Repository, browser or build passed. The portable source and tests now live in `src/games/game018/` and `tests/unit/game018.test.ts`.

- `UNIT_RESULTS.json`: initial 21/24; three exact-timestamp transition failures.
- `UNIT_RETEST_RESULTS.json`: 24/24 after transition comparison tolerance.
- `UNIT_FINAL_RESULTS.json`: 24/24 after genuine consecutive break counters.
- `UNIT_GEOMETRY_RETEST_RESULTS.json`: 25/25 after descending-roof swept collision handling.
- `CALIBRATION.json`: deterministic 1,890-input finite/landing grid, category comparisons and cloud CPU timings. These timings are not smartphone FPS.
- `MODEL_NOTES.md`: model handoff and implementation boundaries. The earlier instruction to rewrite test imports was completed on integration.

Root-owned integrated validation records remain separate. No API credentials or Jev calls are part of this isolated model work.

The later [sky encounter hold revision](HOLD_REVISION.md) preserves these original records and adds separate before/after/endpoint-retest evidence. The final integrated hold-revision model tests passed29/29.
