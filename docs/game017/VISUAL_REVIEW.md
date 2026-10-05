# Game017 — Independent Visual Review

2026-10-05。**PASS 81/100、F可読性13/15、H完成感12/15。未解決のVisual blockerなし。** 実装者とは別のVisual reviewerが実画面画像を確認した。人間の楽しさ、実機操作、視点移動の快適さ、公開可否の合格ではない。

## 対象と方法

基準は[実装仕様](IMPLEMENTATION_SPEC.md)、[開発規則](../GAME_DEVELOPMENT_RULES.md)、[既存A–H rubric](../ten-game/reviews/REVIEW_PROTOCOL.md)。初回レビュー対象は290 runtime/public files、SHA256 `ad08b9bdbe89c5c55586521ab2ae66257ad2964e6f30eab2b41df771da2862d2`。限定修正後の現行[SOURCE_FREEZE](SOURCE_FREEZE.json)は290 files、SHA256 `2c5ea3d79bac4b844706453be58c9c8dd28788522ecca1783728cd5731767433`。Rootがこの間のruntime差分を結果の補助文、Portal metadata／fallback件数へ限定し、art／projectionの変更なしと確認した。stable補足画像は現行freezeに属する。ソースの内容やJevの確率から点を生成せず、以下を`view_image`で確認した。

- [final-native](QA/final-native/report.json)：PC1440×900、touch-emulated phone390×844、narrow320×568、short landscape844×390の各9画像、合計36枚。各title／explanation／practice-plan／practice-complete／main-rain／main-plan／dash／clear／result。
- [final-stable-native](QA/final-stable-native/report.json)のPC／phone explanationとresult：2 RAFとfont readyを待つ補足画像。初回画像に見えた空canvasと結果補助文の再確認用。
- [実Portal WebP](../../public/assets/portal/game017.webp)、[実画面原本](../../assets/portal/thumbnails/game017-actual-source.png)、[変換台帳](QA/THUMBNAIL_AUDIT.json)。

画像取得者はRoot／QAで、Visual reviewerがこれらのRUNを操作したものではない。readonly routeを参照した自動入力の成功を、人間が雨を認知して避けた証拠にしない。Visual用browser起動は0回、runtime／public変更は0件。初期・中間画像は現行採点に使わず、履歴を保持する。

## 数値評価

静止画で分かる描画・情報設計・feedbackを採点した。Gのmotion部分は自分のリアルタイム再生では未確認で、その制約を点と下記の限界へ反映した。

|項目|配点|点|実画像での根拠と上限|
|---|---:|---:|---|
|A Visual identity|15|14|雨雲／黄色いレインコート／道路と、WORLD STOPの見下ろし盤面＋黄色い自由線がゲーム固有の体験を示す。既存の落下／TV三択の色替えではない|
|B Character/object appeal|15|12|黄色い帽子・コートとnavy輪郭で主人公を識別でき、濡れた青い服との違いも見える。雲・建物・雨は単純な形で、phone表情や残像の細部は弱い|
|C Background quality|10|8|通常の青灰色の雨空と、静止中の低彩度グリッドを区別できる。主人公・危険地点を邪魔しない。建物／雲の反復と広い無地領域が品質上限|
|D UI integration|10|8|navy文字／creamカード／lime主要操作が統一。説明、練習から本番、score・round・streak、結果の原因とRetryが読める。PC結果の短いbutton改行、disabled加速ラベルの残存は小さな粗さ|
|E Composition|10|8|PCは広い盤面、phoneは縦の計画領域を確保し、主人公とGOALが同時に見える。320px menuではsceneが小さな中央inset、short landscape本番は広い左右余白となる|
|F Gameplay readability|15|13|赤い実危険地点と薄い雨を区別でき、輪郭付き黄色ルートはgridに埋もれない。外側の5.0sと操作説明が明確。phoneのcanvas内補助文・成功字幕、landscapeの小さい細部は上限|
|G Motion/effects|10|6|rain／WORLD STOP／dash／DRY CLEAR／wet resultの画面変化と、dash画像の薄い残像・描いた線が見える。静止画のみではcamera補間、flashの強さ、3〜5残像の時間変化、音の同期を確認できない|
|H Production value|15|12|主人公・実盤面・入力UI・説明／練習／結果・正直なgameplay thumbnailが統合。壊れた素材や操作を隠すoverlayは見当たらない。小画面のmenu art縮小、簡素な背景・表情・演出が完成感の上限|
|**Total**|**100**|**81**|**gate80以上、F/H各12以上を満たす**|

## 実画面の観測

**タイトル／説明。** [PC title](QA/final-native/desktop-title.png)は左の実streetと大きなRAINSHIFT、右の説明cardと二つの明確な操作。Phoneはsceneとcardを縦に積み、音・一時停止・帰還が見える。[stable phone explanation](QA/final-stable-native/phone-explanation.png)は「雨が来たらタップ→黄色い主人公からドラッグ→赤を避けてGOAL、計画5秒」を読める。320pxではsceneの文字や主人公は小さいが、主要操作と説明は省略されない。

**雨→計画。** [PC rain](QA/final-native/desktop-main-rain.png)と[phone rain](QA/final-native/phone-main-rain.png)では青灰色の空と多数の明るい雨線。計画では彩度を落とし、道路がgridになる。赤い地点に濃い縁、薄い雨に淡い青の縁を使い、同じ危険度へ見せない。[phone plan](QA/final-native/phone-main-plan.png)の円形の世界上の領域は縦長の楕円へ見えるが、主人公とGOALは分離し、赤の回避対象として読める。細いGOALや赤地点の親指での実操作容易性は画像だけで合格にしない。

**ルート／dash／成功。** 実thumbnail原本のyellow pathはnavy輪郭があり、赤地点と建物に埋もれない。自由線の先端を丸く示し、完成済みでない経路を完成画面へ合成していない。[PC dash](QA/final-native/desktop-dash.png)では元の横道路へ戻り、黄色線と主人公の後方の薄い残像が同じ場に見える。[phone clear](QA/final-native/phone-clear.png)は1000／streak1とDRY CLEARで成功を区別する。canvas内English／日本語は小さいため、下のDOM statusの同じ意味の文字も確認した。5秒の描き心地や移動との厳密一致はFeel／QAが所有する。

**練習完了／失敗。** [phone practice complete](QA/final-native/phone-practice-complete.png)はDRY CLEAR、「本番へ」と、練習がSCORE・BEST・CREDITへ影響しない表示がある。[stable phone result](QA/final-stable-native/phone-result.png)は青く濡れた主人公、GAME OVER、雨に触れた日本語説明、取得score／round／streak／BEST、もう一回／タイトル／ゲームセンターが画面内に収まる。失敗原因は小さい雨の描画だけに依存しない。

**小画面。** 320×568の[plan](QA/final-native/narrow-main-plan.png)、[result](QA/final-native/narrow-result.png)、844×390の[plan](QA/final-native/landscape-main-plan.png)、[result](QA/final-native/landscape-result.png)も確認した。主操作・タイマー・結果cardが欠けない。幾何44px／ancestor clip検証を画像レビューで再実行したとは記載しない。

## Findingと限定再確認

1. **V01：phone explanationの空canvas画像。** [元画像](QA/final-native/phone-explanation.png)は青い空白のみで、安定状態のrenderか撮影タイミングかを区別できなかった。Rootへ観測として通知し、2 RAF＋fonts ready後の[stable画像](QA/final-stable-native/phone-explanation.png)を再viewした。街・雨・主人公・タイトルが表示されるため、持続する製品不具合とは判定しない。画像取得タイミングによる証拠findingとしてCLOSED。
2. **V02：PC結果の補助文が視点遷移の説明のまま。** [元PC result](QA/final-native/desktop-result.png)は正しい結果cardの下に「視点が移る間、計画の時計は止まります。」を残す。Rootへ通知し、限定文言修正後の[stable PC result](QA/final-stable-native/desktop-result.png)で「赤い雨の着地点に触れました。」となることを確認した。誤った補助文はCLOSED。モデル・入力・collision変更を求めたfindingではない。

任意の次回改善候補は、menu中の小画面sceneを広く見せる構成、短いlandscapeでの盤面占有率、phone字幕の大きさ、主人公の表情や残像の訴求。今回の主操作を壊す問題と混同せず、81点の上限へ反映した。Visual reviewerによる修正・ImageGen呼出・素材の合成は行っていない。

## Portalと限界

640×360 WebPは16,424 bytes。原本1440×900の実plan画面から比例crop／resizeと単色余白だけで作られ、[台帳](QA/THUMBNAIL_AUDIT.json)にsource／採用hash・cropがある。小さいchromeの文字は読みにくいが、黄色い主人公→曲がる黄色線→赤い危険地点→GOALの意味は残る。架空の豪華な画面／別phase合成ではない。Portal全17 cardの実遷移確認はRoot／QAの別工程。

自分ではcamera animationを再生せず、音を聴かず、実機を操作せず、FPSを測っていない。Image evidenceはemulated viewportで、人間の面白さ／5秒計画の難度／避けた満足／視点移動の酔い／親指の遮蔽感を合格にしない。これらは[HUMAN_PLAYTEST](HUMAN_PLAYTEST.md)で人間評価が必要。独立Feel／通常QA／production・公開はこのVisual点から自動合格にしない。

## 最終freezeへの限定継承

最終[SOURCE_FREEZE](SOURCE_FREEZE.json)は290 files、SHA256 `a3025ff2f7c4e3d489a0ebe4b82e535f24b4779d8a7943a4036ffbeeba02536e`。Rootの差分確認によると、前述の`2c5ea3d…`からの変更は`main.ts`のcanvas pointerdownがShift付き入力を拒否するfilterのみで、art／Canvas描画／styles／可視文言は変更なし。Rootが独立QA findingに対するnative MODIFIER_RETEST成功を報告した。この入力修正の再プレイや新画像確認をVisual reviewer自身が行ったとは記載しない。実view済み画像に基づく81/F13/H12のVisual評価は維持し、入力再検証はRoot／QAの記録へ委ねる。
