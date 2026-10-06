# Game008 独立 Visual Review

**最終84/100、F13/15、H12/15、PASS。** 判定者`seven_elevator`は007の実装者で、008のproductを編集していない。今回[23画像](QA/independent-elevator/VIEWED_IMAGES.json)を`view_image`で実際に確認し、独自のnative入力と段階captureで比較した。人間の面白さ・実機・音・FPSの評価ではない。

[初回独立実行](QA/independent-elevator/report.json)はPC1440×900、phone390×844、320×568、844×390で通常キー／タップ。before/after source SHA一致、HTTP/pageerror0。8つのart画像は作者の描画fixture（PC/phone×neutral/left/right/spill）であり、実RUNのこぼれと混同しない。実RUN画像は別に区別した。

## 初回不合格と限定修正

初回は81/100、F11、H11でgate FAIL。PC/phone/320は陶器・取っ手・リム・コーヒー・トレー・袖と手が読めたが、844×390で1200×900 canvasが約826×244に伸縮し、マグと手が平たく潰れていた。[原本](QA/independent-elevator/landscape-neutral-native.png)を保存し、担当へshort landscapeだけの比例描画を要求した。

008実装者がCSSの`max-height:500px`だけでcanvas `object-fit:contain`と壁色letterboxへ変更。縮まった絵の掌へ中央balance HUDが重なる所見も実装者が検知し、HUDを左letterboxへ移した。独立側は[最終横native](QA/independent-elevator-landscape-final/report.json)で同じ通常入力・pause・三操作44px・比率を確認し、[neutral](QA/independent-elevator-landscape-final/landscape-neutral-native.png)／[左支え](QA/independent-elevator-landscape-final/landscape-left-support-native.png)／[右支え](QA/independent-elevator-landscape-final/landscape-right-support-native.png)を実viewした。マグの高さと取っ手が戻り、掌をHUDが覆わない。新CSS SHAは`5e678a8b15ce73260f56bbe6a35c271268ee49a79e1012964ad8e3cbf8c70801`。physics/input/artは不変、レビュー中編集なし。

|項目|点/配点|実画像・実フレームの根拠|
|---|---:|---|
|A Identity|13/15|大きな陶器と木トレー、カフェ→オフィス廊下がコーヒー配達を示す。クリーム/緑/茶の一貫した画風。|
|B Character/object appeal|13/15|二重リム、暗い液体、二点接続のループ取っ手、影のある陶器。袖/手首/掌/曲げた指は連続。親指は少し図案的で写実ではない。|
|C Background|8/10|一点透視の扉/床が進行を示し、段差の立ち上がり、左角の矢印、継ぎ目の破線が別々に読める。廊下は簡素でランドマークの種類は少ない。|
|D UI integration|9/10|残り距離・時間・液量・左右meterを絵の近くへ配置。三操作は大きく一定の意味。|
|E Composition|8/10|PCで大きな手元、phone/320でもカップと全操作が見える。横は中央の比例artと左右余白になり、画面の使い方に上限。|
|F Gameplay readability|13/15|器・液体・手が区別され、左右の支え/低い縁と警告を実入力で照合。横の潰れを解消し、HUDは掌から分離。|
|G Motion/effects|8/10|左右native入力でトレーと器、遅れる液体の別角度を確認。spill fixtureでは液が内側maskと縁側の流れに分離。物理実機FPS/音は未測定。|
|H Production value|12/15|説明/実練習/配達/2カップ/結果まで同じカフェの見た目。比例問題を放置せず限定再検証。横の余白、簡素な廊下、図案的な手が上限。|
|**合計**|**84/100**|**80以上、F/H各12以上。**|

最終合格は実viewと限定再検証に基づく。新共通font統合はMainの配信/coverage確認で別記録。320pxの支えとpace文字、横の小さな掌、実機親指の使いやすさは人間試遊で確認する。fixtureを本人のplay記録や一般利用者の集計にしない。
