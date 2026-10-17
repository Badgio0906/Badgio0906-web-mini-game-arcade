# Claude Code → Codex 途中引き継ぎパイロット

## 目的と境界

**Claude Codeを利用停止した直後でも、CodexがGitHub上のbranchと担当HANDOFFだけでゲームの残作業を再現・継続できることを検証する。** 本書はテスト計画であり、ゲームの割当・Claudeでの実実装・実際の引継ぎ成功を意味しない。最新mainの空きIDを確認する前にGame036などを予約済みと報告しない。

## 0. 前提（Codex）

1. PR #7の併用ルールがmainに採用済みかを確認。採用前は本パイロットを開始しない。
2. 最新mainのHEAD、NEXT_GAME_NUMBER、他の割当・未統合branch・作業差分を確認し、重複しない安定game IDをCodexが予約する。初回は既存作品の保存・ランキングに触れない**小規模な独立した遊び**を選ぶ。
3. `docs/agent-tasks/<task-id>/ASSIGNMENT.md` と初期 `HANDOFF.md` をCodexが作成。仕様（Core Loop、操作、得点、失敗、練習、映像、1RUN長、テスト）、編集allowed/forbidden、元commit、最小完成基準、モデル/費用記録の測定方法を固定する。
4. 新ゲームをmainのCatalog、Vite、Pagesへ仮掲載しない。担当者は専用branchで個別ビルドし、必要なら `tests/gameNNN/vite.config.*` を編集許可範囲内に作る。
5. 原則、同じ仕様でCodex/Claudeの能力比較をするなら**別branchで同じbase commit・同じ素材・同じテスト**を用いる。パイロットの第一目標は能力比較ではなく、途中停止時の復旧。

## 1. Claude Code 側（最初の一部だけ）

1. 割当済みbranch/worktreeで `CLAUDE.md`、`AGENTS.md` と `ASSIGNMENT.md`を読み、`/context` と `/permissions` で読込と保護ルールを確認する。環境確認は `claude --version` とNode/npm、必要なChromiumのみ。
2. **使い捨ての試験ブランチ上**で、拒否対象の書換え（例 `AGENTS.md`）がEdit/Writeツールで実際に拒否され、割当の `src/games/gameNNN/` と `docs/agent-tasks/<task-id>/HANDOFF.md` は編集できることを試験する。実際に共通ファイルを変えない。権限が機能しない場合は設定修正をCodexへ依頼し作業停止。Bash/任意子プロセスによる回避を試して本番ファイルを壊さない。
3. 最小ゲームモデル、入力、限定テストの一部まで作成し、まだUI/QA/統合に未完了がある時点で**意図的に停止**する。
4. 試験時点のソース、テスト、素材、依存条件とHANDOFF（達成・未達・次の3手・単独プレビュー）をcommit/pushする。実施したテストのみPASSとする。
5. Claude Codeの会話、auto memory、ローカルSkill、秘密情報、未pushファイルをCodexへ渡さない。Codexに伝えるのはremote branch名とtask_idだけ。

## 2. Codex 側（Claudeを利用せず再開）

1. **Claudeのチャットを一切参照せず**、mainの割当からtask_id/branchを特定。`git fetch origin`→`git rev-parse origin/<task-branch>`で先端SHAを取得し、そのcommitのHANDOFFを読む。HANDOFF自身に先端コミットSHAの自己参照は要求しない。
2. 新しいworktreeでcheckoutし、`npm ci`、限定テスト、限定ビルド/通常入力を実施。必要なソース・素材がGitで復元できることを確認し、元の作業結果と差があれば原因を記録。
3. Claudeが明示した未実装をCodexだけで継続し、必要な固有QAを行う。正式なCatalog/Vite/記録/Analytics/サムネイル/Pages変更はCodexの通常統合工程で実施。ただし**パイロット段階では公開を強制しない**。試作公開は品質ゲートとユーザーの本来の作品指示がある場合だけ。
4. 変更したcommit/検証範囲/費用計測/失敗/実機未確認/統合可否を同じHANDOFFと独立レポートへ記録。CLAUDE無しでも再開できるならPASS。

## 3. 合格条件

- 割当がmainまたはCodex共有のGit refで発見でき、作業branchが実際に存在する。
- Claudeが変更したのは許可されたgameNNN関連とHANDOFFだけ。共有ファイル、main、Worker/D1/Secretに無断変更がない。
- Claudeが途中停止しても、remote branchにテスト可能なソース、必要素材、HANDOFFがあり、Codexが新規環境から再現・継続できた。
- HANDOFFの実際の未完了点とコード差分が一致し、次の3手だけで着手できる。
- 完成・レビュー・本番公開・人間の面白さ評価を混同しない。
- 中断時に未pushのソースが失われた場合は、その範囲だけ未回収として扱い、試験自体の失敗と区別する。

## 4. 最初に実行する側の手順

Codexが割当を作成・commitしたら、Claude Codeには **「割当済みタスクのASSIGNMENT/HANDOFFとルールに従い、限定モデル＋対象テストを実装。未完成段階でHANDOFFを更新しcommit/pushしたら停止。mainや共通ファイルを変更しない」** とだけ指示する。その後Codexへ「task_id、remote branch名」のみ伝え、引き継ぐ。

手順の記録には作業日時、使用モデル、直接観測できた時間・料金/token、独立QAなどの証拠を残す。不明な値はnull。未実施項目を合格にしない。
