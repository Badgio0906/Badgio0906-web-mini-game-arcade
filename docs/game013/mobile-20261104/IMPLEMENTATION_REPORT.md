# Game013 スマホ改修報告

2026-11-04 JST。公開URLを維持して、元のキャラクター・譜面・タスク音を使う縦画面UIと1ステージ制を実装した。4入力は390pxで約112px高、320pxでも約90px高。手動補正と音合わせ測定、ステージ別結果・BEST、独立練習、明示的な停止／再開を追加した。

元リポジトリの取得はHTTP404で実施できず、環境のGodot4.6.3は従来の固定4.5.1と異なるため、旧PCKの改変や異なるcompilerでの再exportは行っていない。既存PCKから、変更しないRIFF WebP payload・JSONを抽出した。抽出の再現は `python3 tests/game013-mobile/recover-assets.py`。元PCKのSHAと新配信ファイルのSHAは [SOURCE_RECEIPT](SOURCE_RECEIPT.json)。原Godotエンジン・PCK・保存は残っている。新native版は元の音源とパターンを再構成するため、旧Godotの3ステージ通算とは別の比較条件である。

検証：

- `npm test -- tests/unit/game013-mobile.test.ts tests/unit/game014-mobile.test.ts`：2ファイル8テスト成功。原譜面26ノートの最大点、重複／誤入力／見送り、補正・中央値・窓、指ハート採点を確認。
- `node tests/game013-mobile-probe.mjs`：013/014各390×844、320×720、844×390、1280×900。横・縦のoverflowなし、JS例外なし。開始・停止・明示再開成功。[数値](QA/layout-and-pause.json)。解析同意は通常操作で拒否してから実行した。
- `node tests/game013-mobile/gameplay.mjs`：通常の1〜4キーでSTAGE1を最後まで入力。+100ms補正を適用し2600点、26PERFECT、Sランク、ステージ別／全体BEST保存を確認。[結果](QA/gameplay.json)。自動化は画面の時間表示から入力しており、人間のリズム認知や楽しさの証拠ではない。
- 解析設定のフッターはプレイ中のみpartを非表示、停止／タイトルで復帰。同意ダイアログを抑制しない。

独立レビューは統合担当の別reviewerが実施し、013の調整画面から実装番号の露出を除去した。校正も実プレイと同じpointerdown／イベント時刻で測るようにした。レビューの原票・最終公開のCI／URL確認は統合担当の成果物を参照する。本担当は共有設定・Git push・公開を行っていない。

Windows／iOS／Androidの実音遅延、タッチ感、聴感、面白さは未実施。 [人間確認](HUMAN_PLAYTEST.md)。

最終pagehide修正後、`node tests/game013-mobile/lifecycle.mjs` で両ゲームのpagehide→明示再開と、実際のabout:blankへの移動→履歴復帰を確認した。この環境では履歴復帰はタイトルから再開し、active表示で固まる状態はなかった。[記録](QA/lifecycle.json)。
