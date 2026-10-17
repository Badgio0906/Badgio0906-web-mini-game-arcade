# 100ガレ ～GAME100 GARAGE～ — 共通エージェント入口

- 開始時に [PROJECT_CONTEXT](docs/PROJECT_CONTEXT.md) と [CURRENT_STATUS](docs/CURRENT_STATUS.md) を読む。今回のゲーム・工程に必要な仕様と最新改修報告だけを追加で読む。
- 実装・改修は [GAME_DEVELOPMENT_RULES](docs/GAME_DEVELOPMENT_RULES.md)、finding発生時は [JEV_REVIEW_RULES](docs/JEV_REVIEW_RULES.md) のShadow Reviewに従う。全履歴・画像・巨大なQA JSONを毎回読み込まない。
- Claude Code等の補助開発者を使う場合は [AGENT_COLLABORATION](docs/AGENT_COLLABORATION.md) と対象の割当・HANDOFFを読む。使わない場合もCodexだけで全工程を継続できること。共有ファイル・本番統合・公開はCodex側が担当する。
- 今回のユーザー指示を優先する。過去の仕様・報告を現行状態と混同せず、コード・Git差分・実行証拠で確認する。
- ゲーム固有の操作・得点・保存互換性と移行済みゲームを保つ。将来使えそうという理由だけで共通SDKへ変換しない。
- CREDIT・広告・Jevによる自動修正／公開判定を、依頼なしに有効化しない。認証情報をコード、ログ、報告、チャットに表示・保存しない。
- 実装とFeel／Visual／QAの判定を分離する。レビュー済みソースを固定し、実行した検証と未実施の人間評価を区別する。
- コード変更は対象テストとビルドを確認する。文書だけの変更はリンク・記述・差分を確認し、不要な全ゲーム再実行をしない。
- 終了時は変更・検証・残課題をGit管理下の担当成果物に残す。Codex統合担当は対象ゲームの報告と `docs/CURRENT_STATUS.md` を更新する。Claude Code担当は許可された `docs/gameNNN/` とタスクの `HANDOFF.md` に記録し、`CURRENT_STATUS.md` を直接編集しない。会話・一時ログ・稼働中サーバーに依存せずCodex単独で再開できること。

## Codex担当：本番Analytics（Phase 1）

- 実績・利用状況・継続率・離脱・ランキング・プレイ傾向など、本番データに基づく判断を求められたら、推測せず `scripts/fetch-analytics-context.mjs` で必要なゲーム・期間だけ最新集計を取得する。通常の実装タスクで毎回取得しない。設定不足・取得失敗は明示し、データを推測で補わない。
- Analyticsだけを根拠にゲームコードを自動変更しない。ユーザー指示または明確な改修タスクが必要。「少数」／`sample_size_small`や欠測を断定材料にせず、同意した観測対象だけの集計であることを扱う。
- D1を直接問い合わせずCodex用集計APIを使う。`ANALYTICS_CODEX_TOKEN`を表示・保存・commitしない。admin tokenは使わない。取得結果は原則stdoutのみで、本番snapshotをGitへ保存しない。設定・制約は [CODEX_ANALYTICS_ACCESS](docs/analytics/CODEX_ANALYTICS_ACCESS.md) を参照する。
