# HANDOFF — game037-claude-full-build-20261018

## 状態と参照
- task_id: `game037-claude-full-build-20261018`
- game_id: `game037`（暫定予約・正式採用/公開なし）
- current_status: `ready_for_integration`（**Rules v2＝箱が4×4→8×8へ大きくなる版**を作者の直接指示でClaude Codeが実装。v1はCodexが独立評価済み、v2は独立評価前）
- current_owner: `claude-code`（v2実装）→ 次は `codex-cloud`（v2の独立評価）
- upstream_base_sha: `9e96d557779c5de099fe54c51731ceb131e591a1`
- branch: `claude/game037-bento-full-build-20261018`
- remote_head: 後任が `git fetch origin && git rev-parse origin/claude/game037-bento-full-build-20261018` で実測。**HANDOFF自身を含むcommit SHAは自己埋込しない。**
- last_verified_source_commit: `f253a5440071b60bab30e2029dd22350f9d9337c`（v2。単体22・tsc・個別build・ブラウザQA 2553を実行したソース。以後のcommitは `docs/game037/**`、manifest記述、このHANDOFFのみ）。v1の検証ソースは `fd3eca9`、Codexの独立再実行は `4057766`（[INDEPENDENT_REVIEW](../../game037/INDEPENDENT_REVIEW.md)）
- pr_url: https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/pull/9（**Draftのまま・未マージ**）
- handoff_updated_at: `2026-10-18T05:15:00Z`
- push_status: 作者の指示（GitHub Actionsの追加費用を出さない）により、pushは課金条件の確認が済んでから。確認前はローカルcommitのみ。
- base_to_head_changed_files: `git diff --name-only 9e96d557779c5de099fe54c51731ceb131e591a1 HEAD` → 全て許可path内（`game037.html`、`src/games/game037/**`、`tests/game037/**`、`tests/unit/game037-*.test.ts`、`docs/game037/**`、`assets/game037/**`、`public/assets/game037/**`、このHANDOFF、Codex作成のASSIGNMENT）。共有ファイル・他ゲームの変更0（v2 `f253a54` 時点でも許可path外0件を確認）。

## 仕様と完成条件
- spec_refs: [ASSIGNMENT](ASSIGNMENT.md)、[IMPLEMENTATION_SPEC](../../game037/IMPLEMENTATION_SPEC.md)、`docs/AGENT_COLLABORATION.md`、`docs/GAME_DEVELOPMENT_RULES.md`
- original_decisions: 仮Game037、4×4テトロミノ型弁当箱6面（固定順）、回転のみ、オリジナルSVG主体、独立静的プレビュー、無料試作、正式統合無し。
- spec_change（2026-10-18、作者からClaude Codeへの直接指示）：箱を4×4→5×5→6×6→7×7→8×8、各6弁当・全30弁当で終了。おかずは4マスに限らず5〜8マス等。合計0〜30000、BESTは弁当ごと更新、箱ごとのつづき。詳細は [IMPLEMENTATION_SPEC](../../game037/IMPLEMENTATION_SPEC.md) Rules v2節。**ASSIGNMENT本文（6面固定・0〜6000）は未改訂**＝Codexの改訂が必要（integration_requests）。
- protected_invariants: Game001〜035のソース、保存、BEST、Portal、ゲーム番号、画像台帳、Analytics/Cloudflare/D1/Ads/CREDIT/Secret、main/Pagesを変更していない。
- acceptance_checklist:
  - [x] Claudeによる仕様読込と環境/権限の実測（node v22.22.0、npm ci、Chromium `/opt/pw-browsers/chromium`、push権限）
  - [x] v2：30面（4×4固定6＋生成24）の解検証・pure model・**22件**の単体PASS（v1は18件）
  - [x] v2：実ブラウザPC/タッチ/キーボード、入力持越し無し、desktop・phoneで30弁当完走、narrow・landscapeは8×8をfixture再開から完走（4画面幅＋保存拒否、**2553 checks PASS**）
  - [x] 説明・練習・本番・休憩・結果・BEST/音・retry・一覧帰還
  - [x] 原本・配信用オリジナル素材と来歴（画像生成不使用）、実スクリーンショット
  - [x] Visual/Feel/QA実施（**全て実装者本人の自己評価**。独立レビューではない）
  - [x] 独立Vite build、型チェック、実行コマンド証拠
  - [ ] v2のbranch push（作者の費用条件の確認待ち。ローカルcommitのみ）
- user_playtest: NOT_RUN

## 進行と再開
- done:
  - v1（4×4・6面）：実装・自己QA 574・Codex独立評価（技術的な試遊候補PASS、Visual 81/F12/H13）。
  - v2（箱が大きくなる版）：model一般化（n×n、生成面、汎用solver、箱に合わせた得点式）、任意形のおかず描画（foods.svg 10種＋角丸台紙）、rules2保存（BEST・つづき）、UI（n×n盤、最大10個トレイ、0〜9キー、箱のはしご、つづきから、箱ごと結果、2×2固定HUD）。単体22、ブラウザ2553 PASS。
  - v2で発見・修正：スマホ縦でHUDが折り返して**プレイ中に盤面がずれる**不具合（ドラッグが1マスずれる）。
  - 記録：[IMPLEMENTATION_REPORT](../../game037/IMPLEMENTATION_REPORT.md)（v2節）、[QA/rules2](../../game037/QA/rules2/)、自己Visual 81/F12/H13（[VISUAL_REVIEW](../../game037/VISUAL_REVIEW.md)）、[WORK_LOG](../../game037/WORK_LOG.jsonl)。
- incomplete:
  - v2のpush、GitHub CI、Codexの独立評価。
  - 人間試遊（30弁当の所要時間・難度の上がり方・8×8の手応え）、物理端末、音、FPS。
  - 320×568の8×8は1マス約27pxで小さい（ドラッグは吸着で可能、タップの狙いやすさは未評価）。
- known_failures:
  - game037の検証：なし。
  - 参考：全体`npx vitest run`の `tests/unit/participant-identity.test.ts` 3件はNode 22.22のみで失敗（共有記録系・本branch未変更、v1時点のPR CI（Node 24）は成功）。
- open_decisions: v2を正式な仕様として採用するか（ASSIGNMENT改訂）、正式採用・ゲーム番号・Catalog/記録/公開、作者の完成判断。
- next_3_actions:
  1. 費用条件を確認のうえv2をpush（または作者の判断待ち）。
  2. Codexがv2を独立に再構築・検証（`npm ci` → `npx vitest run tests/unit/game037*.test.ts` → `npx tsc --noEmit` → `GAME037_REPORT=<新dir> node tests/game037/browser.mjs`）、許可path監査、Feel/Visual判定。
  3. 作者の試遊（特に5×5〜8×8の難度と所要時間）。
- integration_requests:
  - **ASSIGNMENTのv2改訂**（6面固定・面追加禁止・0〜6000点・`best:rules1` を、作者指示のRules v2に合わせる）。Claudeは編集しない。
  - 採用時：`src/data/gameCatalog.ts`へgame037（`titleJa: お弁当つめつめ！ ～BENTO BOX～`、`titleEn: BENTO BOX`、`tagline: おかずを回して、ぴったり詰める。箱は4×4から8×8へ。`、route `game037.html`）、`vite.config.ts`の入力regexへ037、ポータルmeta/件数、route検証の期待数、`CURRENT_STATUS.md`。
  - 記録board/ランキングを接続する場合は、v2の合計（0〜30000）と`rules2`を前提にすること（v1の0〜6000と混ぜない）。
  - サムネイル候補（未登録）：`docs/game037/QA/rules2/browser/desktop-stage30-clear.png`（8×8の完成画面）。
  - Records/Analytics/CREDITは未接続のまま。
- blockers: v2のpushは作者の費用条件の確認待ち（Claude側の技術的blockerはなし）。
- rollback_ref: v1の最終 `6123b39`（Codexの独立評価済み）、base `9e96d557779c5de099fe54c51731ceb131e591a1`

## 再現環境
- node_version: v22.22.0（実測。リポジトリ推奨はNode 24）／npm 10.9.4
- dependencies: `npm ci`（実施、exit 0）
- command_to_check: `npx vitest run tests/unit/game037*.test.ts`、`npx tsc --noEmit`
- command_to_preview: `npx vite build --config tests/game037/vite.config.mjs && npx vite preview --config tests/game037/vite.config.mjs --port 4937`（→ http://127.0.0.1:4937/game037.html）。dev: `npx vite --config tests/game037/vite.config.mjs --port 4937`。出力先は`GAME037_BUILD_DIR`（既定 `$TMPDIR/game037-dist`）。
- command_to_run_qa: `node tests/game037/browser.mjs`（build→preview→QA一括。Chromium未検出ならUNTESTED/exit 2）。`GAME037_REPORT=<dir>`で出力先指定。
- exact_files_tested: v2は `docs/game037/QA/rules2/SOURCE_BLOBS.txt`・`BUILD_HASHES.txt`（v1は `docs/game037/QA/` 直下）
- observed_results: v2（`f253a54`）unit 22/22 PASS、tsc exit 0、build OK、browser 2553/2553 PASS（2026-10-18T05:05:35Z〜05:08:41Z）。v1は unit 18・browser 574。
- device_limits: headless Chromium（mobile emulation含む）のみ。物理PC/スマホ・Safari未確認。
- cost_usage: { "model": null, "input_tokens": null, "cached_tokens": null, "output_tokens": null, "wall_time_seconds": null, "cost": null, "source": null }（Claude側で直接取得できる値なし。作業ログの時刻はcommit/コマンド出力の実時刻）

## 必要な素材
- committed_assets: v2配信7点（`foods.svg`ほか、`public/assets/game037/`）とその原本（`assets/game037/source/`）。v1のおかず1枚絵7点は `assets/game037/source/v1/` に原本のみ。`assets/game037/tools/build-assets.mjs`、`assets/game037/asset-hashes.json`
- uncommitted_assets: なし
- image_generation: NOT_USED（手書きオリジナルSVGのみ）
- unavailable_tools: 画像生成ツールは使用せず（必要としなかった）。物理端末なし。

## Codex引き継ぎ確認
- [x] ASSIGNMENTが許可範囲と完成条件を固定した
- [ ] Claudeの途中成果がremote branchへpushされた（v1はpush済み。v2は費用条件の確認待ちでローカルのみ）
- [x] branchの最新commitにHANDOFF・ゲームソース・必要素材が含まれる
- [x] 共有・他ゲームへの変更がない（Claude側で確認。Codexの再監査が必要）
- [x] Claudeの会話や未push資産なしで復元可能
- [ ] Codexが独立した実ブラウザQAで検証可能（コマンドは用意済み。Codexの実行待ち）
- [x] 本番操作・公開をしていない

## Step 3 — Claudeからの独立受入結果（2026-10-18 / ChatGPT＋GitHub Actions）

- Claudeとは別の実行主体ChatGPTがGitHubだけを参照して独立コード監査・実スクリーンショット確認・テスト追加・実ブラウザ検証を実施した。独立した**Codex Cloud worker**や人間がレビューしたと誤記しない。
- 独立成果物：`docs/game037/INDEPENDENT_REVIEW.md`、`docs/game037/QA/INDEPENDENT_VALIDATION.json`。
- 初回の独立Chrome QAでは第2面のEsc再開直後の回転が非収束（54件通過）。疑われるnative dialog `close`の非同期再開競合を、`4c86a7ff2b30a500159bb3b85e599d9257d11947`で`cancel`イベント同期処理へ修正し、直後のキーボード入力チェックを追加。後続QA誤設定（touchでPCキー入力）も分離し修正。詳しくはレビュー記録参照。
- 最終独立CI [39096571478](https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/actions/runs/39096571478) は検証対象`4057766503f9051a9b5a0ba6c2a99d9ee648e48c`でSUCCESS、104既存+1独立テストファイル／1110件PASS、Chrome native Vite HTTP **575/575 PASS**（4幅＋保存拒否）、page errors/POST 0。独立テストは終了後`4ad5858aa3ae9f5fb43c0866b2e9a68e8bde2b8d`で削除し負荷増を残さない。
- Visualレビューは実画像ベースで独立**81/100、F12/15、H13/15**と評価し技術ゲートPASS。320幅結果表・PC下部余白等は改良余地。人間の楽しさ/操作感・実機音/FPS/Safariは未試験。
- status は`ready_for_integration`のまま、ただし**正式採用／Catalog統合・Pages公開は未承認・未実施**。PR #9 Draft／未マージ維持、main/共有設定・他ゲーム/本番を変更していない。
- 新しい`last_verified_source_commit` は`4057766503f9051a9b5a0ba6c2a99d9ee648e48c`。その後のcommitは一時CIファイル削除／担当HANDOFF・独立レビュー記録に限定し、HANDOFF自身のcommit SHAは書かない。
- token/費用/壁時計: null（直接計測できないため）。
