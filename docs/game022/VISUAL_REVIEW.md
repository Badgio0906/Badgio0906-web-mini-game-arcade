# Game022 — 独立Visual review

**83/100、F可読性13/15、H完成感13/15、Visual gate PASS。** `classic_review`が実PNGをview_imageで読み、root compiled通常入力を実施して独立採点。Jev文章、CSSや素材の存在だけから点を作っていない。

実view: 最終1365×900、390×844、320×740、844×390各playing。1365-title、390-practice-complete、320-pause、844-explanation、844-practice-complete、1365×1000の実通常midrun thumbnail。実画像・SHA・UTCは[最終review](QA/compiled/independent-final-review.json)と[REVIEW_READS](../classic-five/QA/REVIEW_READS.jsonl)。Gameplay判定は[別report](GAME_FEEL_REVIEW.md)。

アイボリーの背景、深い青緑の文字、穏やかな緑のテーブルを、独自の小さな植物backと組み合わせる。表札は赤／深緑のスート、cornerの数字と記号、中央記号で区別。山札、捨て札、4組札、7列がPCで一目に読める。実midrunのK空列、A組札、4→3のstackも判読でき、カード52枚の遊びとして成立する見た目。

390／320pxは426px盤の内部横scrollを使い、初期viewでは右列・組札が出ない。320pxは補助の下段へpage縦scrollも必要。844pxの盤面は内部縦scrollで下札へ届く。全機能が初期viewportに同時に入るとはしない。実操作で右列と下部へ到達し、ページの横overflowは無し。短画面の説明dialogは内部scrollされ、撮影では見出し・前半や下段buttonが画面外の状態がある。実continue／帰還操作は成功し、pauseと練習成功の主要操作は画像で読める。

|項目|最大|点|実画像・実操作の根拠|
|---|---:|---:|---|
|A Identity|15|13|緑table、植物back、紙色、静かな語調がカードの休憩を伝える。|
|B Objects|15|14|rank／suit／赤黒、背面、空列K、組札、stackが明確。|
|C Background|10|8|紙色と穏やかな緑、薄い影。装飾は簡潔。|
|D UI integration|10|9|HUD、補助、選択、hint、pause、練習dialogの配色が統一。|
|E Composition|10|7|PCの余白は整う。phone横scroll／short-height内部scrollの負担が上限。|
|F Readability|15|13|実44px露出stack、rankとスート、44px補助、4画面での到達を確認。|
|G Motion/effects|10|6|カード移動、drag ghost、即時状態反映は控えめ。連続motion/FPS未評価。|
|H Production value|15|13|実通常盤／title／練習成功／pause／説明が一貫し、未処理placeholder無し。|
|合計|100|83|80以上、F/H各12以上。|

初回preliminaryは修正前32px露出・DEV既知配札画像で82/F12/H13。最終は実通常画像と44px実測・到達操作によりFを13とした。DEV fixtureは通常randomの完成・難易度を保証しない。

元参考画像自体はこの担当に渡されていない。REQUESTとroot引継ぎの配色・余白方針との照合であり、元画像を直接比較したとはしない。カードbackはsourceの独自SVG、rank／suitは一般記号。外部card素材・公式説明文の複製を見つけたとはしない。日本法の権利クリアランスを意味しない。

本人の面白さ、物理iPhone／Safari、音量、FPSは未確認。Visual PASSはGameplay成立・公開配信成功と別。
