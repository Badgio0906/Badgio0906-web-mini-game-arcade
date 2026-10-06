# Codex Cloud: 100ガレ ～GAME100 GARAGE～

- 開始時に [PROJECT_CONTEXT](docs/PROJECT_CONTEXT.md) と [CURRENT_STATUS](docs/CURRENT_STATUS.md) を読む。今回のゲーム・工程に必要な仕様と最新改修報告だけを追加で読む。
- 実装・改修は [GAME_DEVELOPMENT_RULES](docs/GAME_DEVELOPMENT_RULES.md)、finding発生時は [JEV_REVIEW_RULES](docs/JEV_REVIEW_RULES.md) のShadow Reviewに従う。全履歴・画像・巨大なQA JSONを毎回読み込まない。
- 今回のユーザー指示を優先する。過去の仕様・報告を現行状態と混同せず、コード・Git差分・実行証拠で確認する。
- ゲーム固有の操作・得点・保存互換性と移行済みゲームを保つ。将来使えそうという理由だけで共通SDKへ変換しない。
- CREDIT・広告・Jevによる自動修正／公開判定を、依頼なしに有効化しない。認証情報をコード、ログ、報告、チャットに表示・保存しない。
- 実装とFeel／Visual／QAの判定を分離する。レビュー済みソースを固定し、実行した検証と未実施の人間評価を区別する。
- コード変更は対象テストとビルドを確認する。文書だけの変更はリンク・記述・差分を確認し、不要な全ゲーム再実行をしない。
- 終了時に変更・検証・残課題を対象ゲームの報告とCURRENT_STATUSへ残す。新タスクが会話、`/workspace`の一時ログ、稼働中サーバーに依存せず再開できる状態にする。
