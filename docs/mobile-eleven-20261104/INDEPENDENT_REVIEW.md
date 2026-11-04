# 11作品スマートフォン改修・独立レビュー

2026-11-04 JST。実装担当と別の `mobile_review` sub-agent が、基準 `70e0260edfb1fae89a103748b0e31e36b478d8ee` からの改修差分・最終ソース・実画面を読み取り専用で確認した。製品コードは編集していない。本書のみレビュー担当が作成する。

## 判定の範囲

この担当はブラウザを別途起動せず、ソース・保存境界・提供されたスクリーンショットを独立して確認した。他担当が実行した操作ログはその実行証拠として読み、独立した再実行とは数えていない。全体テスト・ビルド・CI・本番疎通の結果は統合報告が正本。

| 対象 | 確認した内容と証拠 |
| --- | --- |
| 006 | 390px縦と844px横の実プレイ画像、ブレーキ/切り返しのモデル・UI両方での解禁制御、V4 BEST分離。`../game006/mobile-20261104/QA/390-play.png`、`844-play.png`。 |
| 009 | 390/844pxの短い依頼とアイコン、入れ物の大きな操作領域、45秒開始・連続発見加算・最長90秒・誤答減秒、V4保存。`../game009/mobile-20261104/QA/`。 |
| 012 | 844×390と1280×900の実ゲーム画面、縦向き案内、44pxヘッダー、プレイ時フッター非表示とメニューでの復帰、任意Fullscreen/横向き固定の失敗時継続。`QA/game012-844-play.png`、`game012-1280-play.png`、`game012-probe.json`。 |
| 013 | 320/844pxの4領域・表示、Web Audio時計と入力時刻補正、非同期準備/休憩/再開の世代管理、音源停止、ステージ別BEST、練習保存除外。`../game013/mobile-20261104/QA/play-320.png`、`play-844.png`、`result-390.png`、`gameplay.json`。 |
| 014 | 320/844pxのキャラ・操作・結果、100/60点とランク、誤ポーズ終了、練習保存除外、全7ポーズのdecodeと表示後入力開始。`../game014/mobile-20261104/QA/play-320.png`、`play-844.png`、`clear-390.png`、`delayed-pose-loading.png`、`delayed-images.json`。 |
| 020 | 320pxの12牌盤面、任意タイマー、休憩中の時計停止、牌IDによる一度限りの得点、補助操作時のコンボ解除、旧通常クリア数とミニ/タイムアタック記録の分離。`../game020/mobile-20261104/QA/320-mini.png`。 |
| 022 | 320pxで7列目まで表示、札のスートと数字、3分の残り時間・組札最大枚数、補助/戻す制限、チャレンジ中に通常snapshot・日替わりclear ledgerを書き換えないこと。`../game022/mobile-20261104/QA/320-challenge.png`。 |
| 023 | 320×720内で清音46キーとヒント/遊び方に到達、5問得点・連続正解、結果settleの重複防止、追加round項目と既存v1保存互換。`../game023/mobile-20261104/QA/320-playing.png`、`browser.json`。 |
| 025 | 320pxミニ/日替わりと390px初級の盤面表示、500ms長押し、移動/中断/盤面外でのhold破棄、JST日付、難度・モード別の端末内タイム、旧snapshot受入。`../game025/mobile-20261104/QA/320-mini-daily.png`、`390-beginner.png`。 |
| 027 | 320/844pxの照準ドラッグ・パワー・ショット、縦向き座標変換、pointer capture/epoch、10ショット目の静止後終了、スクラッチ処理、通常対局数への混入防止、旧snapshot互換。`../game027/mobile-20261104/QA/play-320.png`、`play-844.png`、`challenge-result.json`。 |
| 051 | 320/844pxの盤面と3入力領域、段階ガイド、録画中の次周ゴースト、連携倍率、旧rules1 BESTと新rules2の分離、音量等の設定移行。`../game051/mobile-20261104/QA/play-320.png`、`play-844.png`、`guide-320.png`。 |

## 指摘と修正確認

| 指摘 | 最終確認 |
| --- | --- |
| 006横画面で角度と強さの数値が重なる | 横画面の操作を右側へ分け、改訂844px画像で重なり解消を確認。 |
| 006拡大したstage内でCanvasが旧208pxのまま | ResizeObserverによる親サイズ反映後、306px Canvasがstageを使う最終画像を確認。 |
| 012 Fullscreen完了がメニュー復帰後に横向きを再固定する可能性 | callbackでplaying状態と捕捉epochを検査する変更を確認。 |
| 012初回の「play」画像がネイティブタイトルだった | Enter開始後の実プレイ画像へ更新されたことを目視確認。 |
| 025マウスを盤面外へ離すとhold timerが残る | pointerleaveとwindow pointerup/pointercancelで破棄する変更を確認。タッチのnative panを維持。 |
| 014未読込ポーズで、見えている指ハートと内部のpeace判定が一致しない | 全7画像をdecodeして保持し、非同期src交換をやめた。遅延読込画像では操作ボタン非表示、最初の操作可能画像ではpeace表示。ログでも遅延中の非表示と誤ポーズ0点終了を確認。 |
| 013補正測定がclick時刻で、本番pointerdownと異なる | 測定をpointerdown＋eventTimeへ変更し、互換clickを除外するソースを確認。keyboardもeventを渡す最終変更を確認。 |
| 013/014 pagehide後、bfcache復帰で動作中に見えるままRAFが停止する | 両作品でpagehide時にpauseし、loadingはtitleへ戻し、非同期世代を無効化する最終ソースを確認。013は予定済み音源を停止せず、AudioContextをsuspendして明示resumeに残す。`../game013/mobile-20261104/QA/lifecycle.json`にはpagehide後の明示再開とhistory復帰時titleの実行記録がある。実端末のbfcache再利用を独立実測したものではない。 |

## 記録・共通境界

`recordDefinitions.ts` の006/009旧r3と013/014旧r1はhistorical boardsへ移して保持されている。新定義は `publicEnabled:false` とし、未登録の新得点を旧公開boardへ送らない。`localRecords.ts` の新キーは各製品実装と一致する。012のルール・エンジン・旧保存連携は変更していない。013/014の旧Godotバイナリ・旧保存を新得点で上書きしない。

020のミニ/タイムアタック、022の3分スコア、025のタイム、027の10ショットBESTは従来記録と分ける。023語彙数上限の拡張を確認。CREDIT全体フラグ、広告、同意、Worker/D1を今回のレビューのために有効化していない。

## 人間確認と限界

実iPhone/Androidの音ズレ、Bluetooth遅延、Safariの実Fullscreen可否、ノッチ・ブラウザバーを含む物理端末、操作の楽しさ・難度・疲労感は未実施。ブラウザ画像の成功を人間評価の合格とはしない。051は縦画面で正方形盤面が幅いっぱいになり、操作下には空白が残る。これは確認した表示上の制約で、未表示操作や進行不能は認めていない。

## レビュー結論

**確認した範囲で公開を妨げる未解決findingなし。独立コード・画像レビューを完了。** 観測した指摘は上表のとおり修正を確認した。公開そのものの承認・CI/配信成否を本書で代行しない。署名：`mobile_review`（実装者と別sub-agent、2026-11-04 JST）。

最終再確認した非同期・記録境界のSHA-256（作業ツリー）：

| ソース | SHA-256 |
| --- | --- |
| `public/games/finger-heart-challenge/mobile.js` | `c11aad6de4be78e6f32bbeff5aa34a4f7c9ceff893390e65d15b113c9038b003` |
| `public/games/tachibana-task-heaven/mobile.js` | `151b9df1b889e4af952d8b25f61ca0a3b61f2cccc7f7ee1e6da9ca62d72b6c59` |
| `public/games/yokodori-days/index.html` | `d8021dff01fc59f2e479c670775228138d243b0da62770cc07ee7a1690dde588` |
| `src/data/recordDefinitions.ts` | `c22c3f4b2eb5791e276a78d4e4c87381c7d6a8e369e7287b090728cc7cb8644b` |
| `src/records/localRecords.ts` | `790b5095e7632cbf071793d741ce70728e9d5be44e7fc45203c7288eb5649c65` |
