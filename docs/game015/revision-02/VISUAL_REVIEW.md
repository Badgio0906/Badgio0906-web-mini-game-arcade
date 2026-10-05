# Game015 改訂02 — 独立Visual Review

2026-10-05 日本時間。**PASS 83/100、F13/15、H13/15。確認範囲に未解決のVisual blockerなし。** 実装担当とは別のReviewerが実画像を見て評価した。人間の楽しさ、実機の指操作／音／FPSや公開成功を判定したものではない。

## 対象と実証

[改訂仕様・Visual Brief](IMPLEMENTATION_SPEC.md)、[開発規則](../../GAME_DEVELOPMENT_RULES.md)、[A–H rubric](../../ten-game/reviews/REVIEW_PROTOCOL.md)を参照。[固定source](QA/SOURCE_FREEZE.json)はSHA256 `44cadb4b87b2a0e94e58269bbc1c4b2632336d16cb22b4e923b94ff49371a50a`。Runtime/publicの編集はReviewerが行っていない。

実際に`view_image`で確認したもの：

- [王様8状態×2フレーム一覧](../../../assets/game015/revision-02/king-animation-preview.png)。参照画像の方向性を、ゲーム用の小さいオリジナルspriteへ移した結果。
- [native-final](QA/native-final/)のPC1440×900／phone390×844 title・practice・falling・scroll-result、narrow320×568 falling・practice-success、landscape844×390 title・falling。Rootの通常入力による撮影であり、Reviewer本人の全4profile実プレイとは区別する。
- Reviewer自身の[通常入力実行](feel-native.mjs)によるPC1920×1080 title・右／左練習着地・ghost追走死亡・central-spike死亡・15m落下・85m下降・pause、phone390×844の15m／85m落下・中央トゲ死亡・右へ急いだ死亡も実view。[実行画像・report](review-artifacts/feel/)は診断値を読むだけで、プレイヤーや時計を変更していない。全src/public＋game015.htmlの実行前後hashは`3bc45654281b29ea292e7fe13166102140d646900c12549f1e4bc9dc58f15dcd`一致、変更0。
- [現行実画面サムネイル](../../../public/assets/portal/game015.webp)。45m付近の実落下画面を縦比率のまま縮小して左右に余白を足したもの。架空の足場やキャラクターを合成した評価ではない。

## 得点

|項目|配点|得点|実画像による根拠と上限|
|---|---:|---:|---|
|A Visual identity|15|13|暗い縦坑、red天井・床トゲ、gold冠の王様、DEPTH／FALL表示が落下追走を示す。背景の単調さが上限|
|B Character/object appeal|15|14|三山の金冠・赤宝石、白ひげ、紫衣装、赤マント、太い黒outlineがsprite／実プレイ／titleで共通。冠が飛ぶ死亡はコミカル。24×36のため細かな衣装表現には限界|
|C Background quality|10|7|反復するレンガ・金属柱と暗い中央空間が前景を分離。縦坑の材質は分かるが、今回実view範囲は序盤のtowerで、後半biomeの質まで評価していない|
|D UI integration|10|8|cream／gold／navy、DROPの主要button、title／reason／DEPTH／BESTが統一。PCの補助説明とphoneの大きい操作が読める。補助文字の小ささ、PC死亡titleの折返しが上限|
|E Composition|10|8|PCは縦坑と説明を横並び、phoneは縦坑を大きくし操作を下、短いlandscapeは操作を横へ移す。title／resultはcardを優先。練習Canvasとlandscapeの王様が小さく、thumbnail左右余白も上限|
|F Gameplay readability|15|13|redの尖ったトゲとgrayの平らな足場、紫のsoft床、複数段先の左右中央分岐、明るい王様が見分けられる。中央のトゲも明瞭。320px／landscapeのHUD補助情報は小さくなる|
|G Motion/effects|10|7|nativeの待機→DROP／方向移動→落下→着地と、死亡時の飛ぶ冠／潰れたrobeを画像で区別できる。スクロール前後とpauseの停止を実入力・readonly値で確認。8状態2frameの簡潔な表現で、音・実機frame pacing・連続動画の滑らかさは未評価|
|H Production value|15|13|同じ王様がtitle／練習／live／thumbnailに統合され、reason・retryも一貫。中央危険と天井を実画像で示す。背景反復と小さい練習画面に改善余地|
|**合計**|**100**|**83**|**gate80以上、F／H各12以上を満たす**|

## 具体的な判読

王様は大きい参照画像のコピー貼付ではなく、冠・ひげ・紫・赤・gold装飾を小さい輪郭へ整理している。実PC／phoneで白い顔とひげがnavy背景から浮き、冠と赤マントが王様の識別点になる。narrow／landscapeでは細かい目や装飾は減るが、冠とひげのsilhouetteを読める。Sprite一覧で待機、DROP開始、落下、左右、着地、強い着地、死亡の形があり、実中央トゲ死亡では冠が上へ飛んだ状態を確認した。

Live画面には中央をふさぐredトゲ、左右へ曲がるgray着地点、幅の違う足場が同時に見える。左／右端だけが危険で中央が空いた旧構図ではない。上のred帯は天井の追走脅威、HURRYと「天井に追いつかれました」の結果が因果を補足する。Kingの足が上限を越えるまで死亡しない仕様なので、死亡直前に王様が天井帯へ食い込むこと自体をVisual blockerとは判定しない。

サムネイルは王様が空中にあり、危険床と複数段の着地候補、細長い坑道が読める。横長cardの中央に縦画面を置くため主役は小さめだが、titleの冠／robeと同じ王様であり、実プレイより豪華な架空場面にはなっていない。Titleの拡大王様も新しいspriteに一致する。

## 未実施と継承

今回の実view範囲で修正必須の文字重なり・操作欠落・主人公埋没は見つからなかった。小さい練習Canvas、landscapeでの細字、反復背景、thumbnailでの王様の小ささは得点の上限として記録する。人間が初見でどれだけ速く判断できるか、親指で押し続けながらDROPできるか、後半biome、音や実機の滑らかさは別の人間評価が必要。Visual83点から「面白さ合格」を生成しない。
