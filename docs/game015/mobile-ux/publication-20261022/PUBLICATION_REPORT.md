# Game015 正式公開記録

2026-10-22（日本時間）。現在は公開前確認済み・GitHub push/CI/merge/Pages結果待ち。

## 承認と保全

候補 `d9514c3d4b58049b151dd76077fbad0c717246cd` を保全し文書のみ追加。main `b419041a3702f1afceed11f912b73543c8904652` とremote PR11 `dbdf915a696b326f1247dd41c9f6cbf8765e9c56` の両方を祖先に持つ。PR11へ通常fast-forward push可能。既存の文書競合は両履歴を保持して解消済み。他worktreeの未push7fe1d9dを取り込まない。[事前照合](PREFLIGHT.json)。

縦専用・横案内・長押し解除・DROP・回転pause/明示resume・練習状態・PC・保存互換とsetSuspendedを維持。PR18 `[open]` CSSはmainとbyte一致。consentUIは既存PR11のpart属性追加だけで同意/撤回/送信を変えない。

公開28/完成9/試遊19、Game012横専用、Game031保留、削除026/028/029/030、036/038を維持。物理/得点/難易度/保存形式/records/広告/CMP/解析意味/Worker/D1/workflowに変更なし。

## 検証と公開

[固定候補のローカル検証](../main-integration-20261022/IMPLEMENTATION_REPORT.md)：check、1041 tests/108 files、build、Offline Jev25、DEV224・compiled80・長押し115・共有001/00516・Game03319ほか成功。[作者実iPhone SE3・8項目合格](HUMAN_PLAYTEST.md)は別証拠。今回の追記は文書のみで製品再実装なし。

最新PR CI成功後Ready化・通常merge、main更新1回で既存Pages公開1回。失敗や重大な競合なら停止し、CI/再deployを無条件に繰り返さない。公開後ブラウザ検証は外部広告/解析/記録送信を遮断する。

## 継続課題

他機種・実機10秒・多指は未確認。Windows npm ciのaudit4件（moderate1/high1/critical2）は詳細/到達可能性未調査、audit fix等の依存関係変更なし。今回の実機試遊で不具合は報告されていない。

AdSense管理画面・Search Console・地域別CMP運用は本タスク対象外/未確認。審査承認は保証せず、AdSense再審査申請なし。
