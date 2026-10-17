# TASK ASSIGNMENT（テンプレート・実割当ではない）

> このファイルは書式のみ。Codexが `docs/agent-tasks/<task-id>/ASSIGNMENT.md` と初期 `HANDOFF.md` を作成・commitして割当を確定する。Claude自身が番号や担当scopeを推測して作業を開始しない。

## 識別
- task_id: （一意のID）
- game_id: （最新mainで確保した安定ID）
- status: assigned
- owner: codex-cloud / claude-code / other
- integrator: codex-cloud（統合責任者）
- base_branch: main
- base_sha: （40文字SHA）
- assigned_at: （タイムゾーン付きISO）
- task_branch: （専用branch）
- upstream_pr: （作成済みならURL）

## 今回の固定要件
- brief: （コアループ、入力、難度、得点、失敗、再挑戦、素材、練習の説明）
- acceptance_criteria: （実操作・モデル・ブラウザ幅・保存・未実装の境界）
- preserve: （既存ゲーム・記録・既存assets等）
- record_rules: （旧BEST、ruleset、board、practice分離）
- integration_requests: （Codexが後で変更するCatalog、Vite、サムネイル、Analytics等）

## 許可する編集範囲（実際のゲーム番号に書き換える）
- `src/games/gameNNN/**`
- `gameNNN.html`
- `tests/gameNNN/**`、`tests/unit/gameNNN*.test.ts`
- `docs/gameNNN/**`
- `assets/gameNNN/**`（画像/音声の原本、プロンプト、来歴）、`public/assets/gameNNN/**`（実配信用の画像/音声）
- `docs/agent-tasks/<task-id>/HANDOFF.md` とそのレビュー証拠（ASSIGNMENT.mdはCodexのみ変更）

## 禁止する編集範囲
- `main`、他game、`src/data/**`、`src/records/**`、`src/analytics/**`、`src/portal/**`、`src/arcade/**`
- `analytics-worker/**`、`vite.config.ts`、`.github/**`、`.claude/**`、`AGENTS.md`、`CLAUDE.md`、`docs/CURRENT_STATUS.md`、`GAME_COMMON_SPEC.md`、`package.json`、`package-lock.json`、`assets/portal/**`、`public/assets/portal/**`、共通の正式サムネイル台帳
- 実Secretと本番DB/Worker/広告の操作

## 独立実行と受け渡し
- node_version: （推奨24、実行環境の実測）
- install: `npm ci`
- unit_test: （対象の実コマンド）
- isolated_preview: （原則 `tests/gameNNN/` の限定Vite設定。共有Viteを触らず起動できる構成・ポート・制約）
- publish_policy: Claude側からmainへpushしない。Codexが統合登録・正式サムネイル・公開を行う
- scope_check: `git diff --name-only <base_sha>...<branch_head_sha>` をCodexがallowed pathsに照合
- milestone_push: 仕様確定／最初の起動／素材採用／QA前後のcommit+pushを義務付ける
- static_assets: （素材保存場所、来歴、出典、hash）
- handoff: `docs/agent-tasks/<task-id>/HANDOFF.md`
- merge_gate: Codexが範囲監査、必要な共通登録、QA、本番公開を実施
