# 継承文書の整理記録

2026-10-05（日本時間）。調査基準は `c793e35f16ea752cc3493558ea6d2a0b7ae38578`。今回の変更は文書・既存証拠の保存だけで、ゲーム・runtime・build設定・CREDIT flag・保存仕様を変更していない。

## 現在の読み込み順

[AGENTS](../AGENTS.md)（10行）→[PROJECT_CONTEXT](PROJECT_CONTEXT.md)→[CURRENT_STATUS](CURRENT_STATUS.md)→今回のゲーム／工程に必要な詳細。全履歴、全画像、巨大なQA JSONは初期必読にしない。

- 開発工程は[GAME_DEVELOPMENT_RULES](GAME_DEVELOPMENT_RULES.md)、技術境界は[GAME_COMMON_SPEC](../GAME_COMMON_SPEC.md)、Jevは[JEV_REVIEW_RULES](JEV_REVIEW_RULES.md)へ分離。
- READMEのゲーム一覧・現行例外・公開履歴・保存説明の重複は対応する正本へ集約した。
- 10本時点の共通DRAFTを[archive](archive/GAME_COMMON_SPEC_2026-10-04.md)へ保存し、元の内容を保って相対リンクだけを調整した。原始企画・5本／10本比較・11本練習草案には履歴の案内を加えた。
- 会話内で作った[baseline JSON](development-baseline/BASELINE_2026-10-05.json)／[CSV](development-baseline/BASELINE_2026-10-05.csv)を保存。37件の根拠参照のうち32個の一時terminal logをbyte一致でRepositoryへコピーし、全参照をRepository相対pathへ変更した。
- [Jev既知ケース](jev/SHADOW_CASES.json)は準備入力のみ、API結果ではない。呼出0回と再開条件を明記。[WORK_LOG template](templates/WORK_LOG_ENTRY.json)は今後の記録用で、実行済みデータではない。

## コード照合で区別した事項

16本と既存Godot移行、無制限prototype、016の将来開始時消費、011のwallet未接続、011の最新時間／配点と旧BEST、015改訂01、Viteの現在の入力番号、旧Pages停止の403、過去001の人間合格と現在の人間評価未実施を区別した。疎通成功の申告はJev Shadow合格ではなく、ゲーム内TelemetryはCodex料金計測ではない。

## この編集の検証

- 変更したMarkdownのローカルリンク・anchorを検査。
- JSONのparseと37件のbaseline根拠hash、Jev入力の既存証拠hashを照合。
- Game016の最終SOURCE_FREEZEにあるruntime280ファイルは全て同じSHA-256。
- 追加資料・ログにAPI key／GitHub tokenのパターンがないことを検査し、編集した文書に`git diff --check`を実行。原本のhashを保つため、そのまま保存したCSVのCRLFとterminal logの末尾空白／空行は書式検査の対象外とした。
- 変更対象はMarkdown／文書用JSON・CSV・保存ログのみ。ゲームの単体・browser・buildは再実行していない。過去のPASSを今回の再実行結果として扱わない。

新しいタスクではCURRENT_STATUSの最新報告へ進み、実装や外部接続の状態が変わったら該当する正本だけを更新する。
