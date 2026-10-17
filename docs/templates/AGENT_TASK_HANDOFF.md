# TASK HANDOFF（テンプレート）

> `docs/agent-tasks/<task-id>/HANDOFF.md`へ複製。**進行中から必ず存在**させ、節目と中断前にcommit/pushする。Claudeのローカル会話・auto memory・作業ディレクトリを読まなくても、この文書とGitだけでCodexが再開できることを確認する。

## 状態と参照
- task_id:
- game_id:
- current_status: assigned / in_progress / ready_for_integration / blocked / abandoned / integrated / published
- current_owner:
- upstream_base_sha: （40文字）
- branch:
- remote_head: （Codexが `git fetch` 後に実remote参照から取得する。HANDOFF内で自分自身を含むSHAを固定しない）
- last_verified_source_commit: （**既に存在し検証済みのソースcommit SHA**。未実施ならnull）
- pr_url: （URL、未作成ならnull）
- handoff_updated_at: （offset付き日時。自動採番であってcommit SHAに依存しない）
- base_to_head_changed_files: （git diffの一覧、想定外変更を区別）

## 仕様と完成条件
- spec_refs: （仕様/今回変更範囲のrepo内path）
- original_decisions: （現行仕様に含まれない重要な設計選択と根拠）
- protected_invariants: （旧データ/既存比較条件/変更禁止）
- acceptance_checklist: （項目別にPASS/FAIL/UNTESTED）
- user_playtest: NOT_RUN / 実観測。AIの代行ではない

## 進行と再開
- done: （コミット済みで再現可能な成果）
- incomplete: （コード未完成・素材不足・バグ、優先順位）
- known_failures: （再現手順、失敗証拠、原因の確度）
- next_3_actions: （Codexが最初に行う具体的な3手）
- integration_requests: （Codex所有のCatalog、Vite、記録、Analytics、正式サムネイルの必要差分）
- blockers: （必要な素材・権限・人間判断。Secretの値は書かない）
- rollback_ref: （安全な前commit）

## 再現環境
- node_version:
- dependencies: `npm ci`（その他の正規install手順）
- command_to_check: （実行したTypeScript/単体/ビルド）
- command_to_preview: （単独で動く限定Vite/preview。絶対パスや常駐serverを使わない）
- command_to_run_qa: （通常mouse/key/touch、出力先は新規）
- exact_files_tested: （テスト時点のcommitまたはhash）
- observed_results: （合格件数、実プレイ完走、未検証を区別）
- device_limits: （実機、GPU、音声等）
- cost_usage: （tool/model/tokens/費用/測定元、取得不可はnull）

## 必要な素材
- committed_assets: （repo相対pathとhash、生成元とライセンス）
- uncommitted_assets: （**無しが望ましい**。あれば未引継ぎとしてBLOCKED）
- image_generation: （実使用tool、プロンプトの保管先、採否、最適化）
- unavailable_tools: （今回環境で使えなかったもの）

## Codex引き継ぎ確認
- [ ] 作業コミットがリモートbranchにある
- [ ] リモートの最新commitにHANDOFFが含まれ、内容を取得できる（先端SHAはGitから照合）
- [ ] 共有ファイル・他ゲームに許可外の変更がない
- [ ] Claude固有の実行環境・未commitファイル無しで再現できる
- [ ] 過去の失敗をPASSに書き換えていない
- [ ] 本番環境へ未許可の送信・操作をしていない
- [ ] Codexが単独で続きを実装・統合・公開できる
