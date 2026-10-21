# TASK HANDOFF — game036-mochi-drop

## 状態と参照
- task_id: game036-mochi-drop
- game_id: game036（**暫定**。main `ac5304fa` の CURRENT_STATUS「次番号36」に基づく。Codexによる予約・ASSIGNMENT.md は未作成）
- current_status: ready_for_integration
- current_owner: claude-code（作者がClaude Codeへ直接依頼。Codex割当なし）
- upstream_base_sha: ac5304fa81361f592942c472c7fa04f668d3b4bc
- branch: claude/game036-mochi-drop
- remote_head: `git fetch origin && git rev-parse origin/claude/game036-mochi-drop` で取得
- last_verified_source_commit: null（検証はcommit前の作業ツリーで実施。検証後はドキュメントのみ追加）
- pr_url: 作成後にPR本文を参照（draft、mainへの直接pushなし）
- handoff_updated_at: 2026-10-21T22:40:00+09:00
- base_to_head_changed_files: `game036.html`、`src/games/game036/**`、`tests/game036/**`、`tests/unit/game036-model.test.ts`、`docs/game036/**`、`docs/agent-tasks/game036-mochi-drop/HANDOFF.md` のみ（共有ファイル変更なし）

## 仕様と完成条件
- spec_refs: `docs/game036/IMPLEMENTATION_SPEC.md`、`src/games/game036/game.manifest.json`
- original_decisions: 作者要件「連鎖・一気消しが容易で爽快、ぼーっと遊べてあと1回」に対し、(1) 実解決と同じ関数で全連鎖を事前計算する着地プレビュー「◯連鎖」、(2) 4味、(3) 32個ごとのこんぺいとう（着地した味を盤面から全消去）、(4) 三角数の連鎖係数、(5) 結果画面の即リトライ・BEST差・ヒント、を採用。終わりのある1モード（積み上がりで終了）
- protected_invariants: 既存ゲーム・保存キー・Catalog・記録・Analyticsに一切触れていない
- acceptance_checklist:
  - モデル単体（12件）：PASS
  - TypeScript check：PASS
  - 単独ビルド／共有ビルド：PASS
  - 4画面の通常入力ブラウザ検証：PASS
  - 全体 `npm test`：Windows作業ツリーのCRLFが原因の既存4件FAIL（無関係）。Linux CIで要確認
  - 独立Feel／Visualレビュー：UNTESTED
  - 実機・音：UNTESTED
- user_playtest: NOT_RUN（`docs/game036/HUMAN_PLAYTEST.md`）

## 進行と再開
- done: ゲーム本体（モデル・描画・演出・音・入力・練習・保存・Telemetry）、単体テスト、単独Vite設定、ブラウザ検証スクリプトとQA証拠、仕様・報告
- incomplete: Catalog等への統合登録、正式サムネイル、独立レビュー、人間試遊
- known_failures: なし（ゲーム固有）。全体テストの4件はCRLF環境要因
- next_3_actions:
  1. `npm ci && npm run check && npx vitest run tests/unit/game036-model.test.ts` と `npx vite --port 4956` → `node tests/game036/browser.mjs` で再現（`GAME036_REPORT`で出力先を新規指定）
  2. 独立Feel／Visualレビューと作者試遊を依頼し、`HUMAN_PLAYTEST.md` を更新
  3. 下記 integration_requests をCodexが実施し、未公開branchで統合プレビュー
- integration_requests:
  - `src/data/gameCatalog.ts`：`{id:'game036', titleJa:'もちっと連鎖', titleEn:'MOCHI DROP', tagline:'落として、つないで、ぽぽぽぽん。', thumbnail:'./assets/portal/game036.webp', route:'./game036.html', releaseOrder:36}`、developmentStatus は `trial`、publicationState・タグ（例：パズル／落ちもの／連鎖／のんびり）・difficulty band
  - Vite入力（Catalogのpublicationから導出される前提の確認）、ポータルmeta／fallback件数、route検証の期待数
  - 正式サムネイル：実画面から作成（候補 `docs/game036/QA/browser-20261021/phone-practice-chain2.png` など）し採用台帳へ登録
  - 記録共有を使う場合：`recordDefinitions`／`gameVersions`／Worker側の登録（現状 `createGameRecordSession('game036')` は未登録で無動作）
  - Telemetry remote有効化の判断（現状 `remoteCollectionEnabled:false`）
  - `docs/CURRENT_STATUS.md` 更新、次番号を37へ
- blockers: なし（統合はCodex判断、完成判定は作者のみ）
- rollback_ref: ac5304fa81361f592942c472c7fa04f668d3b4bc

## 再現環境
- node_version: v24.19.0（CI想定24）
- dependencies: `npm ci`
- command_to_check: `npm run check`、`npx vitest run tests/unit/game036-model.test.ts`
- command_to_preview: `npx vite --port 4956 --strictPort` → `http://127.0.0.1:4956/game036.html`（共有Vite devはルートHTMLを配信するため登録不要）。単独ビルドは `npx vite build --config tests/game036/vite.config.mjs`（出力 OS一時フォルダ/`game036-build`、`GAME036_BUILD_DIR`で変更可）
- command_to_run_qa: `GAME036_BASE=http://127.0.0.1:4956 GAME036_REPORT=docs/game036/QA/<新規> node tests/game036/browser.mjs`（Chromiumは`npx playwright install chromium`、別パスは`GAME036_CHROMIUM`）
- exact_files_tested: 本branchの初回commitと同一内容の作業ツリー
- observed_results: unit 12/12、browser 4/4、builds成功
- device_limits: 実機・GPU・音声の確認なし（headless Chromium）
- cost_usage: tool=claude-code, model=claude-opus-5-5, tokens/費用は取得不可（null）

## 必要な素材
- committed_assets: なし（全てCanvas手続き描画）。QAスクリーンショット `docs/game036/QA/browser-20261021/*.png`
- uncommitted_assets: なし
- image_generation: 未使用
- unavailable_tools: 画像生成、実機、Jev API

## Codex引き継ぎ確認
- [ ] 作業コミットがリモートbranchにある
- [ ] リモートの最新commitにHANDOFFが含まれ、内容を取得できる（先端SHAはGitから照合）
- [ ] 共有ファイル・他ゲームに許可外の変更がない
- [ ] Claude固有の実行環境・未commitファイル無しで再現できる
- [ ] 過去の失敗をPASSに書き換えていない
- [ ] 本番環境へ未許可の送信・操作をしていない
- [ ] Codexが単独で続きを実装・統合・公開できる
