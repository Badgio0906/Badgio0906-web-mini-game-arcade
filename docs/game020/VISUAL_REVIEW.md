# Game020 独立 Visual review

**84/100、F（可読性）13/15、H（完成感）13/15、Visual gate PASS。** `pair020_review`が実装担当とは独立に通常ブラウザ操作で撮影し、実PNGを`view_image`で見て採点した。Jev回答、CSSの存在、生成回数から点を作っていない。作者の主観評価・実機評価ではない。

基準commit `fd1d09a293cd8da1b9dbfeb73dc3e68e27ad7bcc`。対象5fileのSHA256、凍結一致、viewport、DOM計測、pageerrorは [browser evidence](QA/independent/browser.json)。画像は [independent directory](QA/independent/) に保存し、再現scriptは [independent-review.mjs](QA/independent-review.mjs)。

## 実画像と操作の観察

PC1365×900、phone390×844、small320×740、landscape844×390のtitle／24枚盤面／選択／全消去／48枚盤面を撮影。実viewでPC-24、phone-48、phone-selected-hint、small-24、landscape-48、phone／small／landscape title、phone／small clearを確認した。

淡い緑の卓とクリーム色の牌が穏やかに統一される。輪・三角・星・ひし形・四角・六角と内部の点／線／輪で判別でき、色を失っても識別の核が残る。影と上層の位置ずれが積み重なりを示し、裏の牌と上の牌を区別する。重なりの表現は薄めで、自由な牌の明暗・下の点を併用する。

選べない牌は低彩度、自由な牌は明るい、選択中は金色の枠。ヒントは青い点線、keyboard focusは青い実線で別の意味を持つ。実操作で除去がすぐ盤面へ反映され、派手な点滅や勝手な人物を加えない。

牌はPC／phone／landscapeで68px、320pxで64.5px。主要盤面controlは46px以上。4幅は全画面で水平overflowなし。48枚やshort landscapeでは縦scrollが必要だが、盤面・control・modalの内容を順に読める。タイムプレッシャーがないため、このサイズを縮めて一画面へ押し込む必要はない。native dialogは短い高さで内部scrollになり、タイトルの補足が最初から全部見えるとは主張しない。

## A–H採点

|項目|最大|点|実画像・操作による根拠|
|---|---:|---:|---|
|A. Identity|15|13|実在の幾何学牌と穏やかな卓を一貫させ、牌合わせの内容が先に伝わる。|
|B. Objects|15|14|形・内模様・明確な枠・軽い厚みを保ち、64.5pxでも内容が読める。|
|C. Background|10|8|卓と空白が牌を引き立てる。意図した静けさだが装飾は簡素。|
|D. UI integration|10|9|残り数、操作、説明、記録、native modalが同じpaletteと語調。|
|E. Composition|10|8|PCは右に説明、phoneは盤面中心。縦scrollと控えめな積層表現が上限。|
|F. Readability|15|13|明暗＋点、選択枠、形＋内模様、十分なタップ寸法、水平clipなし。|
|G. Motion / effects|10|6|通常入力で即時選択／除去と控えめな色変化を確認。大きな演出や連続motionは使わない。|
|H. Production value|15|13|title／練習／盤面／結果に完成した同じ卓の見た目と十分な文字サイズを統合。実機・音聴感は未確認。|
|合計|100|84|80以上、F/H各12以上を満たす。|

Visual PASSは本人の楽しさ、ゲームの合法性、CI／配信の成功と別の結果。実機の画面明度・日本語font差・色覚の個人評価・音量聴感は未確認。これらをAIスクリーンショット評価で補った扱いにしない。

## 最終版での限定再view

root QAで見つかったmodal Portal link欠落とshort landscape keyboard focusの画面外移動を修正した後、main SHA256 `baf7a8690810fc5ad3a3dee95679b01d5f736118d079599937720aa7a1d47612`で再操作した。[corrections.json](QA/independent/corrections.json)は6context、modal帰還5、keyboard可視1、pageerror0とソース凍結一致を記録する。main以外の4対象fileは初回画像と同一。

追加実view：phone-title-portal-final、phone-result-portal-final、phone-explanation-portal-final、landscape-keyboard-final、phone-48-clear。新Portal linkはmodalの静かな文字linkに統合され、通常tapで帰還できる。長い説明はnative dialog内をscrollして末尾へ進む。keyboardの青いfocus枠は最終landscape画像のviewport内に見える。初回のVisual採点を人間合格に変えず、最終版も84／F13／H13と判定する。48枚全消去画像は修正前mainのfollow-upであり、Portal linkの追加確認は`*-portal-final`画像を使う。

## 最終nonmodal dialogの限定再view

さらに初回同意panelの操作問題をroot QAが見つけたため、Game020内だけでnonmodal dialogと固定中央CSSへ変更。その最終main `d4e0b153fe66e2163e065fc0e46e93d932a6de9a3ccc8427cf602e49b4c0584d`／style `9afb04f3f67bc816c3d9e77d80cbe4026f21c446e7b16aefaefc1e1e7039ecb5`を凍結してPC／phoneを再操作した。[最終記録](QA/independent/consent.json)。

実viewした画像：consent-desktop-unknown、consent-phone-unknown、consent-desktop-title-final、consent-phone-title-final、consent-phone-help-final、consent-phone-result-final。初回unknownでは既存同意panelが前にあり、拒否／保留／許可を通常操作できる。選択後はタイトルcardが中央へ安定し、実盤面・記録・controlの配置は保持。以前の背景dimmingはnonmodalでは使われず、タイトル／結果の背後も通常の淡緑となる。説明は縦scrollするcard、結果はひと組ずつ片付けた静かな表現を維持する。

この限定再viewでも84／F13／H13。同意を選ぶ間に背後のタイトル文が一部覆われるのは既存panelの意図した優先表示で、選択後には消える。共有AnalyticsのUI／CSSを作り替えた評価ではない。320px／short landscapeの最終版全工程はrootのcompiled再QAへ委ね、この追加agent RUNで再実行したとしない。
