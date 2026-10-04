# Game005 SORT SHIFT — Visual Review

独立担当: Visual Reviewer。Iteration **1 / 3**。結論: **PASS — 88 / 100**（F **14 / 15**、H **13 / 15**）。人間による美術／公開判断は別途必要。

## 実際に見たもの

Before と After を画像ツールで実際に確認。After は Chromium の Desktop **1440×900**、Mobile portrait **390×844**。タイトル、全4属性、32個後の反転告知と新条件、終了を取得した。初期の荷物の到着から **300ms** 待って安定した不透明度の画面を評価している。

読み取り専用の期待方向を参照し、ネイティブ LEFT／RIGHT ボタンの通常クリック／タッチで **33 SORTED**へ進み、34個目を通常の誤方向入力で終了。Desktop **15.116ゲーム秒**、Mobile **15.143ゲーム秒**。状態・スコア・時刻の書換え、強制終了なし。分類の成功は人間の判断能力や楽しさの証拠ではない。

別の短い Mobile 実行で、正解入力の前／搬出直後／搬出後半を実画面で確認した。濃い丸型製品が左へ滑りながら傾き、NEXT PARCEL と一時無効の操作が見える。表示 transform は中心の `translate(-50,-50)` から、搬出後半に x約−119px／小さい回転へ変わった。工場背景・ベルトの装飾は静止しており、実行していない機械アニメーションを採点根拠にしない。

## A〜H 採点

| 項目 | 点数 | 実画面からの判断 |
| --- | ---: | --- |
| A Visual Identity | 14 / 15 | 珊瑚色の機械腕、管と検査ランプ、ベルト、紫のインクと黄／ミントの操作盤が、明るい奇妙な仕分け工場を伝える。青いホログラムに依存しない。 |
| B Character / Object Appeal | 14 / 15 | 丸カプセル／角形容器の外縁・継ぎ目・留め具が同じ製造品の表現。単純な仮図形より魅力があり、大きい中央面へコードの記号を置く余地も保つ。 |
| C Background Quality | 8 / 10 | 腕・管・ランプ・ローラーの奥行きと素材がある。中央の検査面は静かで、製品と競合する背景の荷物がない。背景機械は静止したフレームで、動く工場全体にはしていない。 |
| D UI Integration | 9 / 10 | 高コントラストの routing sign、矩形の左右スイッチ、検査票の結果、紫／黄／珊瑚の色が素材と一体化。RULE が装飾より優先される。 |
| E Composition | 9 / 10 | Desktop は一つの工場操作盤にスコア、仕分け窓、検査票を配置。Mobile は RULE→製品→締切→左右キーを保ち、結果も製品と訂正を覆わない。 |
| F Gameplay Readability | 14 / 15 | ROUND は円、ANGULAR は直角の四辺、LIGHT は明るい面、DARK は濃い紫の面。大小は実サイズで異なり、○／× は中央の高コントラストなコード文字。反転時の条件と告知も両サイズで読める。詳細を増やして分類を曖昧にしていない。 |
| G Motion / Effects | 7 / 10 | 実入力の搬出フレームで製品の移動／小さい傾き／消えていく動作を確認。RULE CHANGE の黄色い告知は盤面を一時的に整理し、次の製品と古い条件を混ぜない。背景の腕／ベルトは静止なので動きの豊かさには余地。 |
| H Production Value | 13 / 15 | 生成された製品と工場、コードの記号・ベルト・看板、平たい操作盤／検査票が一つのゲームとしてまとまる。画像だけを UI の後ろへ置いた構成に留まらず、製品のサイズ・形と実操作に統合されている。 |
| **合計** | **88 / 100** | **80以上、F12以上、H12以上を満たす**。 |

## Before / After と残る点

Before は単純な丸／角形と薄い緑の UI ベルト。After は同じ属性と入力を保持し、素材を持つ製品、機械に囲まれた検査窓、routing sign の関係に変わった。明暗の製品は色相だけでなく明るさが異なり、記号を画像生成へ任せないことで、判定の表示が安定している。

必須の修正所見なし。背景機械の控えめな二次動作には磨き余地があるが、現在の静止背景は判断を邪魔しない。見た目のために RULE／締切／入力方法を変える必要はない。実機 FPS、短い判断時間での読み取り、人間の美的好みは未測定。七サイズ・44px・入力境界／RULE／スコア／CREDIT 等の不変性は別担当 QA の検証範囲で、画面採点だけで証明しない。

## 証跡

- Before: `before/game005-desktop.png`、`before/game005-mobile.png`（到着後の安定した画面）。
- After canonical: `after/game005-desktop.png`、`after/game005-mobile.png`。
- 両画面の `-title.png`、`-shape-normal.png`、`-size-normal.png`、`-symbol-normal.png`、`-reverse-change.png`、`-shape-reverse.png`、`-over.png` を実際に確認。
- Motion: `after/game005-mobile-motion-before.png`、`after/game005-mobile-dispatch.png`、`after/game005-mobile-motion-after.png`、`after/game005-MOTION_RECORD.json`。
- 状態・通常入力・画面サイズの記録: `after/game005-CAPTURE_RECORD.json`。取得スクリプト: `capture-after.mjs`、`capture-motion-005.mjs`。
