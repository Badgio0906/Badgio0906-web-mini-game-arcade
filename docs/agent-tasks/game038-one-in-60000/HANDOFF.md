# 最新のCodex統合工程

2026-10-22 JST：game038/releaseOrder38を正式採用。作者の明示承認によりgame036と同時公開。統合担当Codex、最新状態と再開方法は [PUBLICATION_20261022](../../game038/PUBLICATION_20261022.md) およびPR17へ記録。以下は原作者45f7f1a受領時の未統合履歴。

# TASK HANDOFF — game038-one-in-60000

## 状態と参照
- task_id: game038-one-in-60000
- game_id: game038（**暫定**。036はPR #8/#16、037はPR #9の未統合draftで使用中のため回避。Codexによる予約・ASSIGNMENT.md は未作成）
- current_status: ready_for_integration
- current_owner: claude-code（作者がClaude Codeへ直接依頼。Codex割当なし）
- upstream_base_sha: ac5304fa81361f592942c472c7fa04f668d3b4bc
- branch: claude/game038-one-in-60000
- remote_head: `git fetch origin && git rev-parse origin/claude/game038-one-in-60000` で取得
- last_verified_source_commit: null（検証はcommit前の作業ツリーで実施。検証後はmanifest・ドキュメントのみ追加）
- pr_url: PR本文を参照（draft、mainへの直接pushなし）
- handoff_updated_at: 2026-10-21T23:58:00+09:00
- base_to_head_changed_files: `game038.html`、`src/games/game038/**`、`tests/game038/**`、`tests/unit/game038-model.test.ts`、`docs/game038/**`、`docs/agent-tasks/game038-one-in-60000/HANDOFF.md` のみ

## 仕様と完成条件
- spec_refs: `docs/game038/IMPLEMENTATION_SPEC.md`、`src/games/game038/game.manifest.json`
- original_decisions: 『80億分の1』の構造（ランダムな生まれ・自動進行と速度・4状態値・重点・決断・節目の問いかけ・おまかせ・最期のカード・同時に生まれた人・地図）をVTuber活動へ置き換え。差分は自由入力の名前＋目指すジャンル。ジャンルは初期傾向と隠れた適性・毎月の反響で動くため、方向性は約25%でずれる。順位は仮定の分布曲線から算出し、実データでないと明記
- protected_invariants: 既存ゲーム・保存キー・Catalog・記録・Analyticsに触れていない。元作品のコード・文章・素材は不使用、実在のVTuber・事務所名なし
- acceptance_checklist:
  - モデル単体（13件）：PASS
  - TypeScript check／単独・共有ビルド：PASS
  - 4画面の通常入力ブラウザ検証：PASS
  - 全体 `npm test`：Windows固有の既知失敗のみ（本変更と無関係）。Linux CIで要確認
  - 独立Feel／Visualレビュー、実機、人間試遊：UNTESTED
- user_playtest: NOT_RUN（`docs/game038/HUMAN_PLAYTEST.md`）

## 進行と再開
- done: ゲーム本体、単体テスト、単独Vite設定、ブラウザ検証とQA証拠、仕様・報告
- incomplete: Catalog等への統合登録、正式サムネイル、独立レビュー、人間試遊、決断文言の表現レビュー（炎上・DM・体調不良を含む）
- known_failures: なし（ゲーム固有）
- next_3_actions:
  1. `npm ci && npm run check && npx vitest run tests/unit/game038-model.test.ts`、`npx vite --port 4957` → `node tests/game038/browser.mjs`（`GAME038_REPORT` で新しい出力先）
  2. 作者試遊と表現レビューを行い `HUMAN_PLAYTEST.md` を更新。必要なら `RATE_*`・`CHURN`・`hazard` を調整
  3. 下記 integration_requests をCodexが実施
- integration_requests:
  - `src/data/gameCatalog.ts`：`{id:'game038', titleJa:'6万分の1', titleEn:'ONE IN 60,000', tagline:'世界に約6万人いるVTuberの、ひとりになる。', thumbnail:'./assets/portal/game038.webp', route:'./game038.html', releaseOrder:<採番>}`、developmentStatus `trial`、タグ（例：シミュレーション／人生／VTuber／のんびり）、難度band
  - ID・releaseOrderの確定（036/037の未統合PRとの整合）、Vite入力・ポータルmeta/fallback件数・route検証
  - 正式サムネイル（実画面から。候補 `docs/game038/QA/browser-20261021/desktop-card.png`）と採用台帳
  - 記録共有は非競争寄りのため不要の想定（使う場合は「最高順位」の定義が必要）
  - Telemetry remote有効化の判断、`docs/CURRENT_STATUS.md` 更新
- blockers: なし（完成判定は作者のみ）
- rollback_ref: ac5304fa81361f592942c472c7fa04f668d3b4bc

## 再現環境
- node_version: v24.19.0（CI想定24）
- dependencies: `npm ci`
- command_to_check: `npm run check`、`npx vitest run tests/unit/game038-model.test.ts`
- command_to_preview: `npx vite --port 4957 --strictPort` → `http://127.0.0.1:4957/game038.html`。単独ビルドは `npx vite build --config tests/game038/vite.config.mjs`（出力 OS一時フォルダ/`game038-build`、`GAME038_BUILD_DIR` で変更可）
- command_to_run_qa: `GAME038_BASE=http://127.0.0.1:4957 GAME038_REPORT=docs/game038/QA/<新規> node tests/game038/browser.mjs`（`npx playwright install chromium`、別パスは `GAME038_CHROMIUM`）
- exact_files_tested: 本branch初回commitと同一のソース
- observed_results: unit 13/13、browser 4/4、builds成功
- device_limits: 実機・音声の確認なし（headless Chromium）
- cost_usage: tool=claude-code, model=claude-opus-5-5, tokens/費用は取得不可（null）

## 必要な素材
- committed_assets: なし（CSS・emoji）。QAスクリーンショット `docs/game038/QA/browser-20261021/*.png`
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
