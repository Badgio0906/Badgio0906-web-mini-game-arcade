# Game042 実装報告
基準6211019f64a6946d632a9b3620de24a03505410d。個別Canvas2D/TS、相対一筆→releaseダッシュ、盾・柱・予兆・8群/48秒ボス/60秒、練習・保存・SE・pause・retry。
モデル6テスト成功、全編モデル経路51.8625秒/HP3/10560点。固定QAブラウザのPC完走55.1秒/HP1/9760点。touch結果はQA/browser-1793365152526。
初回RED/修正後を別フォルダに保持。touchの最初の原因仮説coalescingは未確定で、記録上drawTime1.30秒が上限1秒を超えた事実を確認。時系列を縮めて4幅6体成立。
ImageGen8点、合成SEの多層化/16voice cap/volume/mute/停止cleanup。人間の聴感は未確認。保存は100gare:game042:rules1、正式結果だけ。既存機能・旧保存・外部送信の接続なし。
モデル/入力の検証ソース6913c767、最終描画ソース9efbca26。後差分は方向記号と純粋な描画演出。
起動: node tests/batches/dopa-nine-20261030-a/run-batch.mjs game042 → node tests/batches/dopa-nine-20261030-a/preview.mjs、/games/dash_chain/。main未変更/未push/未公開。

最終描画版30秒操作のp95はQA/browser-1793365271288/report.json（headless実測、実機ではない）。8単体テスト/tsc/個別production build成功。
