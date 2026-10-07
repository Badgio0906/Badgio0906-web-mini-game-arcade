# Game021 — 独立Visual review

**83/100、F可読性13/15、H完成感13/15、Visual gate PASS。** `classic_review`が実PNGをview_imageで読み、compiled通常入力を実施して採点。Jev文章、CSSや素材の存在だけから点を作っていない。作者の主観評価・実機iPhone評価ではない。

基準commit `af2edf70cdf8fe46175f4fcf38fec607dda997d0`＋凍結working tree。実際のSHA／UTCは[REVIEW_READS](../classic-five/QA/REVIEW_READS.jsonl)、操作は[reviewer-interaction](QA/compiled/reviewer-interaction.json)。

## 実viewと観察

実view: root撮影のPC1365×900、phone390×844、small320×740、landscape844×390各playing。390-practice（専用練習を操作した成功画面）、320-result、1365-pause、844-result。独立担当撮影の1365×1000 [desktop-thumbnail-source](QA/compiled/desktop-thumbnail-source.png)は通常入力で7駒を置いた実play画面。

アイボリー、深い青緑の文字、淡緑の平面盤、青緑／琥珀の駒が一貫。中央の丸／ひし形も所有者を示し、白い空穴、点線ghost、最後の駒の白枠は違う意味が読める。実7駒画像でも両者の形を区別できる。Hasbroロゴや青い立体枠／赤黄駒／脚・開閉機構の外観セットを再現しない。

390／320pxは説明と装飾を減らして盤面中心。320pxでも主タイトル、手番、補助4ボタンが読める。PC900px高では下部controlに縦scrollが必要で、844×390もscrollで遊ぶ。横画像は撮影時scrollでタイトルが上へ出ているが盤面は見える。短画面へ全機能を押し込まず、通常scrollで届くことをroot操作証拠と独立PC操作で確認。320pxと横結果dialogの見出し、retry、帰還は判読できる。

通常入力で駒、手番、候補枠が反映する。大きな点滅、強制zoom、揺れは確認せず。駒落下の連続motionを見たとはしない。控えめな状態変化と結果切替を評価した。

|項目|最大|点|実画像・実操作の根拠|
|---|---:|---:|---|
|A Identity|15|13|平面四目盤、独自paletteと丸／ひし形が遊びを先に伝える。|
|B Objects|15|13|駒、空穴、ghost、最後の手が簡潔に区別できる。|
|C Background|10|8|紙色と薄い盤面影で落ち着く。小装飾は簡素。|
|D UI integration|10|9|手番、hint、undo、練習、結果、pauseが同じ色・語調。|
|E Composition|10|8|PC盤面＋説明、phone盤面中心。大きな盤・横画面の縦scrollが上限。|
|F Readability|15|13|形、手番文字、点線候補、320pxボタン、水平clipなし。|
|G Motion/effects|10|6|即時の着手反映、穏やかな候補と結果。連続motionは簡素。|
|H Production value|15|13|実play／練習成功／結果／pauseが統一された完成UI。|
|合計|100|83|80以上、F/H各12以上。|

参考画像の元データはこの担当に渡されていない。REQUESTとroot引継ぎの配色・余白方針との照合であり、元画像を直接比較したとはしない。Visual PASSは本人の楽しさ、全ルール合法性、公開CI／配信の成功と別。実機font／画面明度、個人の色覚評価、音量聴感は未確認。
