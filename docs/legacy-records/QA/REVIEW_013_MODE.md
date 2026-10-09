# Game013 OJT provenance — independent judgment

Reviewer `legacy_source_audit`, recorded2026-10-09T01:54:34Z (10:54 JST). Original source pin `ddc854b67c6c4efe17e0777ec7de1ce01d4f1ac0`, clean original repository preserved. Arcade baseline `488916c2966710d34233cd212ff970c5501b1091`; current prototype review has not read any Jev log / answer. Earlier source observation and read provenance: [SOURCE_AUDIT_013_014](../SOURCE_AUDIT_013_014.md).

## Observed evidence

1. `scripts/game_manager.gd:118–135` stores `[game] best` and current `[game] ojt_mode` separately, with no historical BEST mode or rule metadata.
2. `:183–187` toggles OJT and saves the current preference.
3. `:396–399` offers the OJT toggle in pause during the same active RUN; resume (`:402–410`) does not create a new scoring state.
4. `:253–255`, `:321–330` and `office_view.gd:114–115` reveal the next task channel up to one beat early. Source tests `tests/test_game.gd:76–90` describe this as assistance without score or timing changes.
5. `:375–380` finalizes standard score and updates the single original best regardless of OJT. `begin_stage(:213–216)` retains ScoreManager across stages2 /3.

Consequently, ON while playing → pause → OFF → final result can yield final preference OFF despite assisted earlier notes. Old BEST plus current preference OFF does not prove historical unassisted conditions. This follows source control flow; it is not a performed browser sequence.

## Independent classification / next evidence

- `PRIMARY_CAUSE`: **CONTENT_OR_SPEC_ISSUE** for the prospective bridge interpretation: original mixed-mode preference / BEST are intentional native behavior and must stay intact. The integration must define comparison conditions and retain provenance instead of reinterpreting old saves. An implemented final-mode-only bridge would become a product bug, but that unimplemented defect is not claimed as observed.
- `CODEX_ACTION_REQUIRED`: **true**. Source / comparison design / constrained bridge tracking and tests are required before013 normal record support.
- `NEXT_EVIDENCE`: **CODE_INSPECTION**, actually performed on the files / lines above; next implementation verification should cover normal start, OJT-at-start, OFF→ON→OFF, stage transition, pause/resume, native tutorial0, original combined old BEST and fresh normal BEST separately.
- `RELEASE_RISK_IF_UNRESOLVED`: **true** if records are released as comparable normal BEST without this provenance separation; it violates a central user requirement by mixing assisted and ordinary results. It is not a reason to change original game scoring or stop the existing native game.
- Human judgment: **not performed**. No Jev verdict, API call, live play or release permission is used in this judgment.

## Minimum implementation boundary recommended

Maintain a new per-RUN sticky `assisted` flag initialized from OJT at standard stage1 start, set whenever OJT becomes ON during that RUN, preserved through stages2 /3 and pause, reset only for a fresh standard RUN. Finalize normal eligibility only when this flag remains false. Exclude stage0 practice and debug verify / captures independently.

Keep original cfg keys / saved best / preference unchanged. Preserve old combined BEST as legacy mode-unknown information. Store a small new current normal record separately and version it; optional OJT record remains a separate label, not a normal board candidate. Current parent protocol rejects OJT current_best snapshots, and the final parent route can save explicit OJT results separately without sharing them. Its start-mode guard does not replace native whole-RUN sticky assistance.

No013 bridge implementation exists at this checkpoint. Successful012 source re-review is not equivalent to012 end-to-end acceptance; expansion remains dependent on root’s prototype QA.
