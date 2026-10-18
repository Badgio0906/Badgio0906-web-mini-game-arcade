# HANDOFF — game037-claude-full-build-20261018

## 状態と参照
- task_id: `game037-claude-full-build-20261018`
- game_id: `game037`（暫定予約・正式採用/公開なし）
- current_status: `assigned`（Claude Codeの制作は**未開始**）
- current_owner: `claude-code`
- upstream_base_sha: `9e96d557779c5de099fe54c51731ceb131e591a1`
- branch: `claude/game037-bento-full-build-20261018`
- remote_head: 後任が `git fetch origin && git rev-parse origin/claude/game037-bento-full-build-20261018` で実測。**HANDOFF自身を含むcommit SHAをここへ自己埋込しない。**
- last_verified_source_commit: null（まだゲームソース・テスト無し）
- pr_url: https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/pull/9（Draft・未マージ）
- handoff_updated_at: `2026-10-18T02:23:04Z`
- base_to_head_changed_files: 初期はASSIGNMENT.mdとHANDOFF.mdのみ。以後、毎回commitと `git diff --name-only <base>...HEAD` で確認。

## 仕様と完成条件
- spec_refs: `docs/agent-tasks/game037-claude-full-build-20261018/ASSIGNMENT.md`、`docs/AGENT_COLLABORATION.md`、`docs/GAME_DEVELOPMENT_RULES.md`
- original_decisions: Game036パイロットとの衝突回避のため仮Game037、4×4テトロミノ型弁当箱6面、オリジナルSVG主体、独立静的プレビュー、無料試作、正式統合無し。仕様変更はASSIGNMENTをCodexが改訂した場合のみ。
- protected_invariants: Game001〜035のソース、保存、BEST、Portal、ゲーム番号、画像台帳、Analytics/Cloudflare/D1/Ads/CREDIT/Secret、main/Pagesを変更しない。
- acceptance_checklist:
  - [ ] Claudeによる仕様読込と環境/権限の実測
  - [ ] 6面の解検証・pure model・12件以上の意味あるunit PASS
  - [ ] 実ブラウザPC/タッチ/キーボード、入力持越し無し、完走
  - [ ] 説明・練習・本番・休憩・結果・BEST/音・retry
  - [ ] 原本・配信用オリジナル素材と来歴、実スクリーンショット
  - [ ] Visual/Feel/QA実施。レビューの実担当を明記
  - [ ] 独立Vite build、型チェック、実行コマンド証拠
  - [ ] 共有変更無しでbranch pushし、再開可能なHANDOFF
- user_playtest: NOT_RUN

## 進行と再開
- done: Codexが固定割当を作成し、Claude専用branchへ配置。
- incomplete: **ゲーム実装全体**。Claudeはまだ開始していない。後任はASSIGNMENTから仕様・許可pathを回収できる。
- known_failures: null（未試験であり、PASSでもFAILでもない）
- open_decisions: 正式採用するかどうか、ゲーム番号の最終確定、正式なCatalog/記録/公開、作者の完成判断はCodex/ユーザーが後で決める。
- next_3_actions:
  1. Claude Codeが `AGENTS.md` / `CLAUDE.md` / `docs/AGENT_COLLABORATION.md` / このASSIGNMENTを読み、指定branchの隔離checkout・allowed path・Node/npm/browser/必要な制作手段を確認。
  2. 純モデル→6面solver/unit→最小起動→SVG原画/配信素材→全画面UI/操作/保存・ブラウザQAの順で完成させ、各節目にHANDOFF更新+commit/push。
  3. QA/Visual/Feel/未確認事項を根拠付きで固定し、`ready_for_integration`または`blocked`へ更新。Draft PRを維持して停止し、Codexへ完了報告。main統合・Pages公開はしない。
- integration_requests: 現時点無し。正式採用時のCatalog/Vite/Portal/正式サムネイル/記録設定/CURRENT_STATUSの変更はCodex責任。
- blockers: Claudeの実作業開始待ち（環境・ImageGen/ブラウザ/権限は未確認であり、利用可能と仮定しない）
- rollback_ref: `9e96d557779c5de099fe54c51731ceb131e591a1`

## 再現環境
- node_version: null（未実測。Node 24推奨）
- dependencies: `npm ci`（未実施）
- command_to_check: `npx vitest run tests/unit/game037*.test.ts`、`npx tsc --noEmit`（実装後に実行）
- command_to_preview: `tests/game037/vite.config.mjs` を作成後に確定、未実装
- command_to_run_qa: `tests/game037/**` に作成後に確定、未実装
- exact_files_tested: null
- observed_results: NOT_RUN
- device_limits: 物理PC・スマホの作者試遊/独立画面レビュー未実施
- cost_usage: { "model": null, "input_tokens": null, "cached_tokens": null, "output_tokens": null, "wall_time_seconds": null, "cost": null, "source": null }

## 必要な素材
- committed_assets: なし（これからClaudeが制作）
- uncommitted_assets: なし
- image_generation: NOT_RUN。手作りのオリジナルSVGを第一候補。画像生成を利用した場合だけ実使用toolを記録
- unavailable_tools: 未確認

## Codex引き継ぎ確認
- [x] ASSIGNMENTが許可範囲と完成条件を固定した
- [ ] Claudeの途中成果がremote branchへpushされた
- [ ] branchの最新commitにHANDOFF・ゲームソース・必要素材が含まれる
- [ ] 共有・他ゲームへの変更がない
- [ ] Claudeの会話や未push資産なしで復元可能
- [ ] Codexが独立した実ブラウザQAで検証可能
- [ ] 本番操作・公開をしていない
