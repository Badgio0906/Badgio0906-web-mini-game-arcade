# HANDOFF — pilot-game036-handoff-20261018

## 状態と参照
- task_id: `pilot-game036-handoff-20261018`
- game_id: `game036`（仮番号・非公開の試験）
- current_status: `in_progress`（パイロットの指示により**意図的に途中で停止**。`ready_for_integration` ではない）
- current_owner: `claude-code`
- upstream_base_sha: `9e96d557779c5de099fe54c51731ceb131e591a1`
- branch: `claude/pilot-game036-handoff-20261018`
- remote_head: **引継ぎ時に** `git fetch origin && git rev-parse origin/claude/pilot-game036-handoff-20261018` で取得。HANDOFF自身のcommit SHAを記載しない。remote先端にソースcommit（下記）が無ければ、その範囲は未push＝未回収。
- last_verified_source_commit: `498edcc2c3bed1740f22336b0fad06e2cbf6485d`（このcommitの内容でテストとビルドを実行。HANDOFF.mdはそのsource commitに含まれない）
- pr_url: https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/pull/8
- handoff_updated_at: `2026-10-18T08:28:24+09:00`

## 仕様と完成条件
- spec_refs: `docs/agent-tasks/pilot-game036-handoff-20261018/ASSIGNMENT.md`、`docs/agent-tasks/PILOT_PROTOCOL.md`
- original_decisions: 3ラウンド・0〜100往復・速度35/秒・目標70/30/55・score = `max(0, round(1000 - abs(position - target) * 30))`・各ラウンド確定入力1回・不正dtでは進めない
- protected_invariants: 既存ゲーム/保存/広告/Analytics/Cloudflare/ランキングへの変更・送信なし。game036は共有モジュールを一切importしない（storage/telemetry/records/audio未使用）
- acceptance_checklist（このパイロット範囲のみ）:
  - [x] 独立モデルを作成（`src/games/game036/model.ts`）
  - [x] 5件以上の有意な単体テスト（10件、全PASS）
  - [x] `game036.html` と最小UI/入力の骨組み（`main.ts` / `style.css`。型チェックと個別ビルドのみ確認）
  - [x] 個別ビルド設定 `tests/game036/vite.config.mjs`（ビルド成功）
  - [ ] ブラウザでの実操作（**未実施**）
  - [ ] デザイン、Visual/Feel/QA、全幅確認（着手しない指示）
  - [ ] 共通登録・公開（着手しない指示。Codexの統合工程）
- user_playtest: NOT_RUN

## 進行と再開
- done:
  - モデル（マーカー往復・反射・1ラウンド1確定・スコア・ポーズ・練習モード・不正dt拒否）
  - 単体テスト10件（往復/反射、フレームレート非依存、不正dt、ポーズ、スコア式と境界、1回確定、3ラウンド完走、リトライ初期化、練習が記録しないこと、100通りの有界性）
  - 最小UI骨組み（タイトル／プレイ／休憩／ラウンド結果／結果、クリック・タップ・Space、Escape、blur/hiddenで自動休憩）
  - 個別ビルド設定と、ビルド成功の確認
- incomplete:
  - ブラウザ実操作の確認（この環境にChromiumが無く未実施）
  - 正式なポータル復帰ヘッダー（`arcade-game-header` / `arcade-portal-return` と `public/arcade-navigation.*`）。現状は素のリンクのみ
  - 最良スコア（BEST）と保存、音、計測、記録共有。**試験中は意図的に未実装・外部送信なし**
  - デザイン・Visual/Feel/QA・44CSSpx等の全幅確認・本人試遊
  - 統合（Catalog / Vite / Portal / サムネイル台帳 / route検証 / CURRENT_STATUS）
- known_failures: none observed。未検証をPASSとしない
- open_decisions（仕様に明記が無く、仮に決めた箇所。Codexまたはユーザーが確定）:
  1. 各ラウンド開始時のマーカーは「0から右向き」にリセット（前ラウンドの位置は引き継がない）
  2. 「不正なdt」は 非有限・負・`MAX_FRAME_DT`(0.5秒)超。UIは不正dtを検知すると休憩（pause）にする。dt=0は受理して何も動かさない
  3. 練習モードは同じモデルで3つの目標を循環し、スコアは表示のみで合計・結果・完了に影響しない
  4. リトライ時の入力持ち越し防止は、状態を作り直す＋Spaceの`repeat`無視＋ボタン経由では停止入力にならない構造。ブラウザ実操作では未検証
- next_3_actions:
  1. 新しいworktreeで対象branchをcheckoutし、`npm ci` → `npx vitest run tests/unit/game036*.test.ts`（10件）、`npx tsc --noEmit`、`GAME036_BUILD_DIR=<出力先> npx vite build --config tests/game036/vite.config.mjs` を再現する
  2. 実ブラウザ（通常のクリック／Space／タップ、休憩、blur、リトライ）で `main.ts` を確認し、上記open_decisionsを確定する
  3. 残り（ポータル復帰ヘッダー、デザイン、Visual/Feel/QA、必要なら保存・BEST）をCodexが実装し、公式の統合は通常工程で行う。パイロット段階では公開を強制しない
- integration_requests: 現時点なし（パイロット範囲では共有ファイルの変更を必要としていない）。正式採用する場合のみ、Catalog / Vite入力 / Portal / サムネイル台帳 / route検証 / CURRENT_STATUS をCodexが統合する
- blockers:
  - この実行環境にChromium（`/usr/bin/chromium`）が無く、ブラウザ検証が不可
  - 実行環境のNodeは v22.22.0（Node 24推奨。Viteの要件は満たす）
  - 実行前の通知で「このセッションからのpushは権限不足で拒否される可能性」が示されていた。remote先端で実際の到達を確認すること
- rollback_ref: `9e96d557779c5de099fe54c51731ceb131e591a1`

## 再現環境
- node_version: v22.22.0（npm 10.9.4、vitest 3.2.7、vite 7.3.6）
- dependencies: `npm ci`（lockfile通り）
- command_to_check: `npx vitest run tests/unit/game036*.test.ts`
- command_to_preview: 未実行（想定: `npx vite --config tests/game036/vite.config.mjs` を起動し `/game036.html` を開く）
- command_to_run_qa: 未実装
- exact_files_tested: commit `498edcc2c3bed1740f22336b0fad06e2cbf6485d` の `src/games/game036/**`、`game036.html`、`tests/game036/vite.config.mjs`、`tests/unit/game036-model.test.ts`
- observed_results（実際に実行したものだけ）:
  - `npx vitest run tests/unit/game036*.test.ts`：1ファイル・10件PASS（commit前の作業ツリーと、commit後に再実行した結果が同じ）
  - `npx tsc --noEmit`：exit 0（tsconfigの対象は `src` のみ。テストファイルは型チェック対象外、vitest実行のみ）
  - `GAME036_BUILD_DIR=<scratch> npx vite build --config tests/game036/vite.config.mjs`：成功（5 modules。html 1.78 kB、css 1.26 kB、js 4.38 kB）
  - `git diff --name-only 2db2a4e HEAD`：game036関連の7ファイルのみ。base（`9e96d55`）→HEADの差分は、Codexが作成した ASSIGNMENT.md / HANDOFF.md と、この7ファイルのみ
- not_run（未実施。PASSとして扱わない）:
  - ブラウザでの実操作、PC/touch/実機確認
  - `/context`・`/permissions` による読込と編集拒否の確認、および拒否ルールの安全な編集試験（共有ファイルを編集しない指示のため行っていない）
  - `npm run test` 全体、`npm run build` 全体、Playwright系
- device_limits: Claudeでの実機確認なし
- cost_usage: null（取得元なし）
- actor: Claude Code（Claude Sonnet 5.5 / `claude-sonnet-5-5`）、クラウドセッション。時間・token・費用は直接取得できないため未記録

## 必要な素材
- committed_assets: なし（素材は不要な骨組み）
- uncommitted_assets: なし
- image_generation: 未実施（不要）
- unavailable_tools: Chromium（ブラウザ検証用）。画像生成は使用していない

## Codex引き継ぎ確認
- [ ] Claudeの途中成果のコミットがremote branchに存在
- [ ] branch先端のHANDOFFが最新で取得できる
- [ ] 共有ファイル・他ゲームへの許可外変更なし
- [ ] CodexがClaudeの会話・未pushデータ無しで限定テストを再現可能
- [ ] Codexが未完成作業を引き継ぎ可能
