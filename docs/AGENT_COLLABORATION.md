# エージェント併用・離脱時の継続運用（100ガレ）

**目的：Claude Codeを途中で使用しなくなっても、Codex単独で開発・テスト・公開を継続できること。** Claude Codeは任意の増員であり、製品の依存関係でも必須の実装工程でもない。100ガレの正本はGitHubの採用済みmainと、引き継ぎ可能なGitのcommit/branch/PR・対象の仕様・テスト・素材である。Claudeの会話、auto memory、セッションID、ローカルの未commit差分、個別Skill、マシン内の一時フォルダは正本にしない。

## 優先順位と入口

- 新規担当は `AGENTS.md` → `docs/PROJECT_CONTEXT.md` → `docs/CURRENT_STATUS.md` → 対象仕様 → この規約 → 割当 `ASSIGNMENT.md` を読み、最新main/HEAD/未commit差分と作業範囲を確認する。
- 作品数、次ID、公開状態、比較ルール、手動で確定した完成版指定は**実行時の最新main**を使い、この規約や古い相談メモに数値を固定しない。
- `GAME_COMMON_SPEC.md`、`docs/GAME_DEVELOPMENT_RULES.md`、`docs/JEV_REVIEW_RULES.md` の現行規則を維持。ユーザーによる最新の明示指示が優先。
- Claudeが未導入・利用停止・ネット接続不可でも既存Codex Cloudの手順と成果物が成立しなければならない。

## 役割とファイル所有

| 担当 | 可能な作業 | 原則として変更しないもの |
|---|---|---|
| Codex（統合責任者） | 企画の確定、内部ID予約、割当作成、共通Catalog／Vite／Portal／記録／Analytics／広告／公開、統合QA、`CURRENT_STATUS.md`・公式公開報告更新 | 作業中の別担当の固有ファイルや未commit作業を無断上書きしない |
| Claude Code（任意、ゲーム単位の実装担当） | 割当済み`gameNNN`のモデル、入力、演出、保存、固有HTML／manifest、対応テスト、同番号の画像・音素材、`docs/gameNNN/`、タスクのHANDOFF | `main`、共有設定・共通ソース・記録DB/Worker、`CURRENT_STATUS.md`、CI／公開、他ゲーム、秘密情報 |
| Claude Code（任意、独立レビュー） | 割当ゲームのコード・画像・操作・QAのレビュー。findingsと再現条件をレビュー成果物へ記録 | 同じレビューで実装者の修正を勝手に混在させない。公開合否や人間の面白さ判断を代行しない |
| Codex単独フォールバック | Claudeに割り当てた全作業を、最後のpush済みcommitとHANDOFFから継承する | Claude固有のツールや会話への依存を新設しない |

「＋α」は**同じgameNNNに閉じる**テスト、画像・音の作成と最適化、仕様文書・レビューに限定。複数ゲーム横断の共通リファクタや管理API変更はCodexで扱う。必要ならClaudeは変更提案のみ残す。担当は番号を基本単位とし、ジャンル／操作／美術制作量は割り当て判断の情報に用いる。

## 新ゲームの割当（Codex側）

1. 最新`CURRENT_STATUS.md`とCatalog/HTMLを調べ、未使用の安定`gameNNN`を確定。既存IDは詰め直さない。別タスクとIDが衝突しないか確認。
2. `docs/agent-tasks/<task-id>/ASSIGNMENT.md`を[テンプレート](templates/AGENT_TASK_ASSIGNMENT.md)で作成し、`owner`、`game_id`、`base_sha`、allowed/forbidden paths、記録と保存のルール、仕様正本、プレビュー/テスト方式、採否条件を確定してcommitする。暫定の担当は作品のリリースを意味しない。
3. Claudeはそのcommitから固有ブランチ（例 `claude/game036-physics`）または隔離worktreeを作成する。**mainは編集・直接pushしない。**
4. Claudeは共有ファイルを変更せず、ゲームを独立ビルドする場合は`tests/gameNNN/`の限定Vite設定などを使う。統合に必要な変更は[HANDOFF](templates/AGENT_TASK_HANDOFF.md)の`integration_requests`へ書く。`gameNNN.html`の正式ルートや一覧は統合前のローカル検証として区別。
5. Claudeのbranch/PRとHANDOFFをCodexがレビューし、必要な共通登録を**Codex自身が**行い、テスト/実ブラウザ/公式Pagesの公開証拠まで管理する。本人試遊は別。

## 途中停止に強いチェックポイント

- `ASSIGNMENT.md`はCodexが作成・変更する正本、`HANDOFF.md`は担当実装者が更新する作業状態。どちらもGit管理下へ置く。
- 作業開始時に`HANDOFF.md`を作り、`assigned → in_progress → ready_for_integration / blocked / abandoned → integrated → published`を明記。`integrated/published`への変更・`CURRENT_STATUS.md`更新はCodexが行う。
- **仕様固め、最初に動くゲーム、素材採用、QA前、最終QA後、作業中断前**に、固有ファイルとHANDOFFをcommitしてbranchへpushする。長い開発が突然止まった場合、最後にpushされた状態まで復元できる。**未push作業は保証不能**であり成功と記録しない。
- HANDOFFにはGit remote/branch/base SHA/最新commit、実装済み・未実装・既知の問題、再現コマンド、検証レベル、必要な画像/ライセンス/採用台帳、結果/保存互換・旧比較版、次の3手、統合依頼、再開不能要因を入れる。
- `/workspace`や`C:\...`など絶対パス、実行中server、Claudeのローカル自動メモリ、独自MCP、未共有の画像生成結果を必須前提にしない。必要な素材はGit管理、非公開が必要ならCodexから再取得可能な**秘密値を含まない**外部参照と承認を引き継ぐ。
- 画像が必要なのに生成ツールや許諾に不足があれば`blocked_art`等として止め、CSS図形で代替して画像生成済みとはしない。画像生成のモデル版・採用/不採用・ハッシュ・生成元を記録する。

## Codex単独への復帰手順（Claudeが辞めた/使えないとき）

1. Codexが最新mainと未統合の `docs/agent-tasks/` 割当、PR/branchを列挙し、対象game IDと状態を照合。
2. `HANDOFF.md`の`last_pushed_commit`を実Git refと照合。未公開の成果は**mainにあると仮定しない**。
3. Codexの新しいworktreeに対象branchをcheckout。秘密・`node_modules`・`dist`・`/tmp`は引き継がず、Nodeバージョンと`npm ci`等で再構築する。
4. 差分をallowed pathsに照合。共有ファイル・他ゲームの変更、エクスポートに秘密があれば隔離し、採用しない。旧保存、ruleset/record board、Portalリンク、CREDIT/Ads/GA4、退役/hiddenを点検。
5. 記録されたテスト・モデル・実操作を再現。不足は**Codex自身が**実装し、必要なら独立レビューを別のCodex役割へ委任する（独立実施を偽らない）。
6. CodexがCatalog、Vite、Portal、サムネイル台帳、記録/Analyticsの実際の登録範囲、共通QAと公式Pages公開を最終統合。`CURRENT_STATUS.md`とHANDOFFを更新する。
7. Claude無しで進められない事象は「必要な入力/素材/権限」を具体化。Claude固有の仕組みを必須化して対処しない。

## 共有ファイルの保護

- `src/data/*`、`src/portal/*`、`src/records/*`、`src/analytics/*`、`src/arcade/*`、`analytics-worker/*`、`vite.config.ts`、`index.html`、`.github/*`、`AGENTS.md`、`CLAUDE.md`、`docs/CURRENT_STATUS.md`はCodex統合担当が所有する。
- Claude側`.claude/settings.json`の編集拒否ルールは**一部のファイル操作の誤編集を防ぐ補助策**。Bash/外部MCP経由での書き込みやGitHubのmerge制限まで保証しない。
- 実運用では隔離worktree、Claudeの専用PR、Codexによる`git diff --name-only <base>...<head>`と許可path検査、PRレビューを必須とする。GitHubのmain保護・必須レビュー等を設定できる場合は併用する。設定済みとは断言しない。
- PRのCI成功は本番完成と別。ブランチで検証可能な固有コードのみ先に作り、共通登録は統合時にする。複数人が`CURRENT_STATUS.md`を同時編集しない。

## 作業記録・モデル比較

- `docs/templates/WORK_LOG_ENTRY.json`が同一フォーマット。`actor_role`はGameplay/QA/Visual等の役割、`agent_tool`は`codex-cloud`/`codex-local`/`claude-code`/`human`等を分けて記録。旧行に項目がなくても読み取れるようschema1互換を保つ。
- 費用/入力・cache・出力token、モデルは実際に取得できた場合だけ記録し、不明はnull。時間は人間の待ちや再試行を含め実観測を分ける。公開だけのテストやJev回答を面白さ合格にしない。
- 最初の比較は**同じ仕様と基準commit・同じ素材/環境・同じ受入基準**の小さな実装課題を隔離ブランチで試す。品質（通常操作・回帰・Visual・Feel/人間試遊）、時間、token/費用、修正回数、統合手戻りで比較し、優劣は計測結果で決める。最初からジャンルで担当を永久固定しない。
- Claude側のみのSkill/自動メモリを採用結果の依存先にしない。汎用コマンドと製品ソースで再現可能な成果だけ統合する。

## Secret・本番・費用

- `ANALYTICS_CODEX_TOKEN`、Cloudflare管理Secret、D1本番資格情報はCodex統合側だけに保持し、Claude Codeへ渡すことを標準にしない。通常のゲーム開発と独立レビューは本番集計を必要としない。
- Claude環境では本番POST、DB migration、Worker deploy、GitHub Pages mainへのpushを行わない。テストはローカルfixture/モック。匿名集計が必要ならCodexが最小の**集計済み・秘密無し**資料を渡す。
- Claude側の実環境で`node --version`、`npm ci`、`npm run check`、`npm test`、`npm run build`、ブラウザの有無を初回だけ確認。環境にない`/usr/bin/chromium`などは実行不能と記録し、環境を書換えて成功したふりをしない。
