# Game023 author implementation report

**伏字ことば ～KANA GUESS～** / candidate No.30 / game023. Implementation author candidate is complete and frozen for independent root review. This is not a publication record or a human playtest approval.

Baseline `af2edf70cdf8fe46175f4fcf38fec607dda997d0`, isolated `/workspace/classic-author-023`. Only `game023.html`, `src/games/game023/`, `tests/unit/game023*.test.ts` and `docs/game023/` are delivery files. Temporary `TelemetryService.ts`/`analytics/runtime.ts` changes were copied by root for its shared continuation API and are excluded from author delivery. Untracked `node_modules` is the supplied dependency link. No commit, push, deploy, catalog, other-game, Worker, Sheet or CURRENT_STATUS edit was made by this author.

The implementation preserves category-plus-blank kana guessing, all matching-position reveals, duplicate no-op, only incorrect new choices consuming eight chances, once-only correct/ended result and optional one-letter hint. The 180 original common readings are distributed across six categories and share the same fixed complete keyboard. Clear/voiced/small tabs, five-column phone keys, desktop arrows and native activation accompany an original cream/teal notebook and eight dots. No timer, harm art, BEST, aggregate statistics or score was added. Optional explanation and real two-word practice are independent of production RUNs/history.

The pure model and defensive one-JSON persistence are separate from rendering. Current question, guessed kana, hint, remaining, outcome, seed, history, existing run UUID and reported ledger restore consistently. Completion report flag and ledger share a single write; restored results do not re-report. Reload/pagehide do not end a RUN or start another one. Storage denial remains playable in page memory. Existing audio/mute, TouchGuard and Telemetry services are reused; only word IDs, category tokens, counts, hint and outcome are measured. Answers, free text and guessed kana history are never telemetry payloads. New-ID remote collection is explicitly disabled until root verifies Worker registration.

Executed verification:

- `npm test -- tests/unit/game023-model.test.ts tests/unit/game023-persistence.test.ts`: **27/27 pass**. Full dataset/key validation, all-word solve, NFC, voiced/semi/small/long distinctions, repeated-position reveal, duplicate handling, eighth miss, last-letter hint, deterministic 400-question sequence, 180-question non-repeat cycle, semantic restore, privacy and result-ledger/storage-denial boundaries. [Result](QA/unit-final.txt).
- `npm run check`: pass, including root-supplied continuation service. [Final check](QA/check-freeze.txt).
- `npm run build`: baseline build passes. Existing Vite input regex excludes new IDs until root integration, so a second Vite build merged the physical Game023 input without editing shared config: `node --input-type=module` importing Vite `build` with `build.rollupOptions.input.game023`. The compiled Game023 HTML/JS/CSS were generated successfully. Existing CSS/chunk warnings remain in other games. [Baseline](QA/build-baseline.txt), [Game023 final](QA/build-freeze.txt).
- Production Game023 chunk has no `__game023` diagnostic hook. Source, test and compiled hashes are recorded in [SOURCE_FREEZE](QA/SOURCE_FREEZE.json); frozen source-set SHA256 is `00c7410a92f18991422db55fbd927fe0b13dcdac33583ab544de914cddd5546e`.
- `git diff --check`: pass. Dependency link and temporary shared overlay are not deliverables.

The first vocabulary test found three two-character readings below the specified 3–8 limit. Original [failure](QA/unit-initial.txt) is preserved. Replacements use distinct common 3+ readings with original clues, and the full set now passes. This was a direct numeric/content-schema comparison, excluded from Jev by the正本 simple comparison rules; [finding/exclusion](QA/CONTENT_LENGTH_FINDING.json) documents the contemporaneous observations. No ambiguous finding requiring Shadow routing was observed by this author. No Jev PASS quota was sent.

Pending root work: independent code, Feel and actual-image Visual reviews; ordinary-input desktop/portrait/320px/landscape QA; long press/cancel/repeat, practice, result, save/reload, pause/mute and Portal round trips; catalog/build/profile registration and real-screen thumbnail; public-title name collision searches; official integration/publication and distribution hashes; external Worker/API registration; candidate Sheet cell update after public verification. Human subjective and actual iPhone/phone playtests remain unperformed. [Human checklist](HUMAN_PLAYTEST.md), [rights limits](RIGHTS_NOTE.md), [spec](IMPLEMENTATION_SPEC.md). Author candidate files alone do not mean any pending work succeeded.

## Root統合追補

最新main cc7f851から当ゲーム固有のみ統合。main最終SHA610db177、author最初freeze・混合入力guard・横向き答えscrollの修正前状態は保持。通常Keyboard46/26/13と180語、root486テスト／52file、check／build成功、Worker check／実ローカルD117events5RUN。独立compiled4画面、root統合4画面の説明／練習／同字重複／全位置／wrong8／hint／保存UUID／結果再読込／Portal往復を確認。Visual83/F14/H13。native入力が答えを知るモデルQAと本人の推測体験は区別。

公開は当commit後、CI期待SHA成功→公開4画面・Portal22と配信thumb→候補表A31だけ済の順。QA/PUBLICATION.jsonとSHEET_UPDATE.jsonで実完了を証明する。新作Worker本番は認証blocker・外部収集停止。旧001〜020保存・コード、広告／GA4／CREDIT／権限は不変。実機／本人試遊未確認の公開はユーザー承認済み。
