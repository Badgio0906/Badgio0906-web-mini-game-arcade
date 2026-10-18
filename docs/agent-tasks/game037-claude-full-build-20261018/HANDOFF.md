# HANDOFF — game037-claude-full-build-20261018

## 状態と参照
- task_id: `game037-claude-full-build-20261018`
- game_id: `game037`（暫定予約・正式採用/公開なし）
- current_status: `ready_for_integration`（Claude Codeの制作は完了候補。独立評価・統合はCodex）
- current_owner: `codex-cloud`（独立評価待ち）／実装: `claude-code`
- upstream_base_sha: `9e96d557779c5de099fe54c51731ceb131e591a1`
- branch: `claude/game037-bento-full-build-20261018`
- remote_head: 後任が `git fetch origin && git rev-parse origin/claude/game037-bento-full-build-20261018` で実測。**HANDOFF自身を含むcommit SHAは自己埋込しない。**
- last_verified_source_commit: `fd3eca9ce3f05653f3bfed0d3fa95d0b184ddd15`（単体・tsc・個別build・ブラウザQAを実行したソース。以後のcommitは `docs/game037/**` とこのHANDOFFのみ）
- pr_url: https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/pull/9（**Draftのまま・未マージ**）
- handoff_updated_at: `2026-10-18T03:50:00Z`
- base_to_head_changed_files: `git diff --name-only 9e96d557779c5de099fe54c51731ceb131e591a1 HEAD` → 全て許可path内（`game037.html`、`src/games/game037/**`、`tests/game037/**`、`tests/unit/game037-*.test.ts`、`docs/game037/**`、`assets/game037/**`、`public/assets/game037/**`、このHANDOFF、Codex作成のASSIGNMENT）。共有ファイル・他ゲームの変更0（`fd3eca9`時点で44ファイルを確認）。

## 仕様と完成条件
- spec_refs: [ASSIGNMENT](ASSIGNMENT.md)、[IMPLEMENTATION_SPEC](../../game037/IMPLEMENTATION_SPEC.md)、`docs/AGENT_COLLABORATION.md`、`docs/GAME_DEVELOPMENT_RULES.md`
- original_decisions: 仮Game037、4×4テトロミノ型弁当箱6面（固定順）、回転のみ、オリジナルSVG主体、独立静的プレビュー、無料試作、正式統合無し。仕様変更なし。
- protected_invariants: Game001〜035のソース、保存、BEST、Portal、ゲーム番号、画像台帳、Analytics/Cloudflare/D1/Ads/CREDIT/Secret、main/Pagesを変更していない。
- acceptance_checklist:
  - [x] Claudeによる仕様読込と環境/権限の実測（node v22.22.0、npm ci、Chromium `/opt/pw-browsers/chromium`、push権限）
  - [x] 6面の解検証・pure model・**18件**の単体PASS（12件以上）
  - [x] 実ブラウザPC/タッチ/キーボード、入力持越し無し、6面完走（4画面幅＋保存拒否、574 checks PASS）
  - [x] 説明・練習・本番・休憩・結果・BEST/音・retry・一覧帰還
  - [x] 原本・配信用オリジナル素材と来歴（画像生成不使用）、実スクリーンショット
  - [x] Visual/Feel/QA実施（**全て実装者本人の自己評価**。独立レビューではない）
  - [x] 独立Vite build、型チェック、実行コマンド証拠
  - [x] 共有変更無しでbranch push、再開可能なHANDOFF
- user_playtest: NOT_RUN

## 進行と再開
- done:
  - pure model（`src/games/game037/model.ts`）：回転/衝突/充填/exact-cover solver/時計/得点/pause/6面遷移/練習隔離。単体18件。
  - UI（`main.ts`、`pieceView.ts`、`style.css`、`game037.html`）：title/遊び方/練習/本番/休憩/面完成/結果/retry/mute/一覧帰還、drag（マス吸着・緑/赤プレビュー）、tap、keyboard、マス占有ベースの当たり判定、本番進行の「お品書き」札。
  - 保存（`save.ts`）：BEST・muteの2キーのみ、メモリfallbackと非永続表示。効果音（`audio.ts`）。
  - 素材：手書きSVG 13点（[ASSET_INDEX](../../game037/ASSET_INDEX.md)、hash `assets/game037/asset-hashes.json`）。
  - 検証：[IMPLEMENTATION_REPORT](../../game037/IMPLEMENTATION_REPORT.md)、[QA](../../game037/QA/README.md)、自己Visual 82/F13/H13（[VISUAL_REVIEW](../../game037/VISUAL_REVIEW.md)）、自己Feel、[WORK_LOG](../../game037/WORK_LOG.jsonl)。
- incomplete:
  - 独立Feel/Visual/QA（Codex）、人間試遊、物理端末、音の聴感、実FPS。
  - 本物のタブ切替による`document.hidden`（QAはvisibilitychangeの擬似のみ）。
- known_failures:
  - game037の検証：なし。
  - 参考：全体`npx vitest run`で `tests/unit/participant-identity.test.ts` の3件がNode 22.22環境で失敗（共有記録系・本branch未変更）。CI(Node 24)では未確認。
- open_decisions: 正式採用、ゲーム番号の最終確定、Catalog/記録/公開、作者の完成判断（Codex/ユーザー）。Visual gateの独立判定。
- next_3_actions:
  1. Codexが新しいcheckoutで `npm ci` → `npx vitest run tests/unit/game037*.test.ts` → `npx tsc --noEmit` → `GAME037_REPORT=<新しいdir> node tests/game037/browser.mjs` を独立実行し、許可path監査を行う。
  2. Codexが実画面で独立Feel/Visual判定（自己評価82/F13/H13の検証）。必要なら修正指示。
  3. 採用する場合のみCodexがCatalog/Vite入力/Portal/正式サムネイル/記録の登録と公開検証。人間試遊は別途。
- integration_requests:
  - 採用時：`src/data/gameCatalog.ts`へgame037（`titleJa: お弁当つめつめ！ ～BENTO BOX～`、`titleEn: BENTO BOX`、`tagline: おかずを回して、ぴったり詰める。全6弁当。`、route `game037.html`）、`vite.config.ts`の入力regexへ037、ポータルmeta/件数、route検証の期待数、`CURRENT_STATUS.md`。
  - サムネイル候補（未登録）：`docs/game037/QA/browser-final/desktop-stage6-clear.png`（実プレイの完成画面）。
  - Records/Analytics/CREDITは未接続のまま（割当どおり）。接続するならCodex側の別工程。
- blockers: なし（Claude側）。
- rollback_ref: `9e96d557779c5de099fe54c51731ceb131e591a1`

## 再現環境
- node_version: v22.22.0（実測。リポジトリ推奨はNode 24）／npm 10.9.4
- dependencies: `npm ci`（実施、exit 0）
- command_to_check: `npx vitest run tests/unit/game037*.test.ts`、`npx tsc --noEmit`
- command_to_preview: `npx vite build --config tests/game037/vite.config.mjs && npx vite preview --config tests/game037/vite.config.mjs --port 4937`（→ http://127.0.0.1:4937/game037.html）。dev: `npx vite --config tests/game037/vite.config.mjs --port 4937`。出力先は`GAME037_BUILD_DIR`（既定 `$TMPDIR/game037-dist`）。
- command_to_run_qa: `node tests/game037/browser.mjs`（build→preview→QA一括。Chromium未検出ならUNTESTED/exit 2）。`GAME037_REPORT=<dir>`で出力先指定。
- exact_files_tested: `docs/game037/QA/SOURCE_BLOBS.txt`（git blob id）、build成果物は`docs/game037/QA/BUILD_HASHES.txt`
- observed_results: unit 18/18 PASS、tsc exit 0、build OK、browser 574/574 PASS（2026-10-18T03:43:56Z〜03:45:13Z）
- device_limits: headless Chromium（mobile emulation含む）のみ。物理PC/スマホ・Safari未確認。
- cost_usage: { "model": null, "input_tokens": null, "cached_tokens": null, "output_tokens": null, "wall_time_seconds": null, "cost": null, "source": null }（Claude側で直接取得できる値なし。作業ログの時刻はcommit/コマンド出力の実時刻）

## 必要な素材
- committed_assets: `assets/game037/source/*.svg`（原本13）、`public/assets/game037/*.svg`（配信13）、`assets/game037/tools/build-assets.mjs`、`assets/game037/asset-hashes.json`
- uncommitted_assets: なし
- image_generation: NOT_USED（手書きオリジナルSVGのみ）
- unavailable_tools: 画像生成ツールは使用せず（必要としなかった）。物理端末なし。

## Codex引き継ぎ確認
- [x] ASSIGNMENTが許可範囲と完成条件を固定した
- [x] Claudeの途中成果がremote branchへpushされた
- [x] branchの最新commitにHANDOFF・ゲームソース・必要素材が含まれる
- [x] 共有・他ゲームへの変更がない（Claude側で確認。Codexの再監査が必要）
- [x] Claudeの会話や未push資産なしで復元可能
- [ ] Codexが独立した実ブラウザQAで検証可能（コマンドは用意済み。Codexの実行待ち）
- [x] 本番操作・公開をしていない
