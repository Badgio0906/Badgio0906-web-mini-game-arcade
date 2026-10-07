# Game024 author implementation report

Implemented **ひとマススネーク / SNAKE**, candidate No.47, at isolated base `af2edf70cdf8fe46175f4fcf38fec607dda997d0`, branch `codex/classic-model-024`. Author work began 2026-10-07 15:02:24 UTC. User explicitly selected the final Japanese title after root found the originally requested name in an existing minigame. Name research remains root-owned; no legal clearance is asserted.

Pure seeded classic model, two-turn queue, correct nongrowth tail handling, bounded free-cell food, dense completion, independent fixed simulation clock, 4/6/8 fixed speeds, Canvas/CSS screen, PC/touch controls, optional explanation/isolated practice, pause/restoration, results/retry/Portal, mute/audio, defensive atomic snapshot and milestone-only existing telemetry are implemented. See [spec](IMPLEMENTATION_SPEC.md).

## Executed author validation

[Immutable author evidence](QA/AUTHOR_MODEL_BUILD.json) records source hashes, base SHA, actual commands and timestamps. `npm test -- --run tests/unit/game024.test.ts`: **25 tests passed**. `npm run check`: passed. Explicit standalone Vite production build with `input:game024.html`: passed, output `/tmp/game024-compiled` (temporary output, not a required resume dependency). Production Game024 JS `game024-BjZhnZCW.js`, CSS `game024-BQI0oavl.css`. The base `npm run build` also passed with existing unrelated CSS/Phaser warnings; its unchanged input list excludes024, so it is not treated as Game024 packaging proof.

Tests establish reversal/queue behavior, wall/self, vacating tail/growth, seeded free food/final cell/dense clear, all three speeds at30/60/120Hz, pause/long gap/restart/death clock, corrupt snapshots and denied storage, and the actual captureSave boundary for Portal→late pagehide. Synthetic dense fixtures are model verification, not human gameplay. Browser resize/layout/input/save checks belong to the independent root review.

## Findings and review boundary

An earlier author source inspection corrected explicit quit/restart writing a reported playing snapshot **before dedicated evidence/Shadow capture**. This is a protocol deviation; no contemporaneous BEFORE artifact or retrospective Jev classification is fabricated for it. Root was notified and independently reviews the final behavior.

A subsequent distinct late-pagehide persistence finding was preserved **before its fix** in [source evidence](QA/FINDING_PORTAL_PAGEHIDE_BEFORE.json), including source SHA and exact relevant snippets. [Finding state](QA/FINDING_PORTAL_PAGEHIDE.json) was submitted once to the existing helper, four schema-v2 questions, checkpoint A; response status AVAILABLE, answers hidden and unread by author. The fixed captureSave guard keeps an abandoned playing snapshot null, preserving flags and BEST/statistics; a regression test covers this actual boundary. Root independent judgment/annotate is pending; Jev is not a release gate.

Source is frozen at the hashes in the author evidence for root compiled-browser review. No commit, push, deployment, Portal/catalog/Worker registration or shared status change was performed by author. Common TelemetryService/runtime changes were supplied by root; root owns those diffs. Local node_modules is a pre-existing linked dependency. Author modifies only game024-owned paths.

## Pending root work and human limits

Root owns independent Feel/Visual/browser QA, screenshots/real-play thumbnail, shared registration/integration, official build/deploy and production route checks, Worker/API status, and Sheets update after publication. Remote collection for024 is explicitly disabled pending existing Worker registration; prototype version is `prototype-1`, rules `1`. No production debug hooks or authored gameplay fixtures are exposed; the DEV getter is a copied read-only diagnostic.

Author subjective playtest and physical iPhone tests remain unperformed. Reference image comparison was not performed by author because it was unavailable. No enjoyment score, visual score, real-device PASS, publication success or candidate-sheet completion is claimed here. See [human checks](HUMAN_PLAYTEST.md).

## Authorized clock-save revision01

Independent source/semantic review reproduced a separate early-collision save issue: a 500ms frame at speed8 persisted terminal clock remainder375ms; restore rejected that record and reset prior BEST/runs. Contemporaneous before evidence and one hidden-answer Shadow request were saved by the independent reviewer in root `docs/game024/QA/independent/`. Root authorized a narrow captureSave correction before browser handoff. Terminal snapshots now save remainder0 before persistence inside the tick callback; simulation, active-run clock rules and other product files are unchanged. The added actual model/clock/save sequence regression and after-fix semantic reproduction retain BEST12/runs4 on reload. All **26 tests**, typecheck and standalone production build pass. Original author freeze and original findings remain preserved; current revision freeze is [AUTHOR_MODEL_BUILD_REVISION01](QA/AUTHOR_MODEL_BUILD_REVISION01.json). No source commit, browser, public deployment or human approval is claimed.

## Root統合・公開準備

最新main de5327dから当ゲームのrevision01だけ統合し、元018等未commit作業は保全。root514tests／53file、check／build、Worker check／ローカルD120events6RUN成功。追加安全primitiveはfoods/lengthとID登録のみ。中央およびページの新作remote停止を維持、本番Worker認証は利用不可。既存020登録・旧ゲーム保存・広告／CREDIT／GA4／Secret／schemaは不変。

compiled通常4画面のvisible位置に沿うnative操作で食事／BEST／逆向き拒否／2tickqueue／pause／UUID再開／retry／壁衝突／結果再読込／練習／タッチcancel／Portal→pagehideを検証。未知の頭上tab切替をheadlessで再現できなかった事実はfocus計測と初回失敗に保持、別のDOM blur fixtureによるhandler検証と実物理focus未検証を区別。26modeltestsのfill400を、実ブラウザ通常全400到達や本人試遊と混同しない。Visual83/F13/H13。

root collectorの出力先を誤って再使用し、最後のisolated final captureをroot4173 captureで上書きした点はQA/ARTIFACT_PROVENANCE_NOTE.jsonに明示。初回finding・before source／sourcefreeze／Shadowは保全、失われた原画像を復元したように扱わない。最終retained root4画像を独立担当が再確認する。

当commit後に期待SHAのPages成功→公開4操作・Portal23・thumbnail→候補表A48だけ済／読戻し。実完了はQA/PUBLICATION.jsonとSHEET_UPDATE.jsonを参照。作者未試遊の試作公開はユーザー許可済み。
