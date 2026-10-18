# 一覧014 / 内部Game017 revision03 — 独立Visual移設差分レビュー

**限定レビュー PASS。対象は移設後の作品識別、旧/新BEST表示、4幅の画面収容。新しいA–H総合点は付けない。** 過去の誤分類Game038の81点を、この候補の採点や合格根拠へ転記していない。

実装者とは別のArt Director担当が、今回の実PNGを`view_image`で直接確認した。ブラウザ操作、製品編集、画像生成、外部API、push/PR/CIはこの担当では実行していない。実画像のSHA256と確認範囲は[JSON記録](VISUAL_MIGRATION_REVIEW.json)に保存した。

## 対象と固定版

- 対象は一覧表示014＝内部`game017`「RAINSHIFT」の改良候補。新作038ではない。候補ページは`game017-revision03.html`。
- 初回固定版`1e55d97f3239e0645f8647b128f4fd7d6060122e`は320pxで後述のclipを観測。
- 最終確認版`3b8adf81ef40ac2201445aa47ea6d8aeb10796a2`は識別ラベルだけを短縮した修正版。[新しいnative実行記録](QA/browser-label-fix/RESULTS.json)は4幅、source-before/after一致、89check PASSを記録している。native操作は主担当の実行で、この担当の独立手動プレイとは扱わない。
- 内部`game014`「指ハートチャレンジ」（一覧表示011）は別作品で変更対象外。`public/games/finger-heart-challenge/`の基準`2a6e36a`からのGit差分は空、保護記録の12ファイルの現物SHA256一致を読み取り確認した。このレビューで旧014を操作/編集していない。

## 初回の実観測と修正後の確認

初回`QA/browser-fixed/narrow-title.png`を直接見て、長い`014 · RAINSHIFT / UMBRELLA REVISION`が320pxで2行になり、音ON/休憩も縦折返し、主要な3ラインbuttonの下部がviewport端で切れることを独立観測した。初回native記録も49check時点のFAILと、button下端574px / viewport高さ568pxを保持している。初回画像・失敗記録は修正版と分けて残す。

修正版の`014 · RAINSHIFT 改良候補`は、実際に見た4幅すべてで1行に収まる。修正後320pxのtitle/lost/play/practice-clear/pause画像で、音ON/休憩と3ラインbuttonが画面内へ戻ったことを確認した。初回clipは修復済みとして扱える。

## 修正後に実際に見た画像

すべて`QA/browser-label-fix/`の新しいPNG。初回画像や誤分類時の画像を代用していない。

| 画面 | viewport | 実viewした状態 |
|---|---|---|
| desktop |1280×800|title、home|
| phone |390×844|title、home|
| narrow |320×568|title、lost、play、practice-clear、pause|
| landscape |844×390|title、lost、play、practice-clear、pause|
| 保存拒否phone |390×844|denied-storage|

今回の修正後実viewは15枚。全PNG/全フレームを見たとは扱わない。

## 判定

| 確認点 | 限定判定 | 今回の実画像から確認したこと |
|---|---|---|
| 対象識別 |PASS|4幅に`014 · RAINSHIFT 改良候補`が表示され、移設先を識別できる。|
| 旧/新BESTの可読性 |PASS|4幅のtitleに「改良版BEST —／旧雨宿りBEST 4242」が欠けず表示される。390pxでは4242が単独行になるが、旧BESTに属することを文脈から読める。合算/同一記録の表示にはなっていない。|
| 主要操作の画面収容 |PASS・初回修復後|320/844を含め実viewした修正後の状態で主要操作のclipを観測しなかった。narrow練習完了の3つ目buttonは次行に収まる。|
| 新assetpathの表示上の成立 |限定確認|実viewしたplay/homeに人物・背景・家が描画され、欠落画像の表示は観測しなかった。全14assetの網羅的HTTP検査ではない。|
| 保存拒否の表示 |PASS|保存できないときはページ内記録となる注記と、旧/新BEST各「—」が読める。保存処理自体の保証は別QA。|

新たな移設差分の視認性blockerは残っていない。既存の長い日本語見出しの不均等な改行、密な人物重なり、arrival modalによる家の一部遮蔽は残るが、今回の識別/BEST/画面収容の判定を妨げる欠けではない。

## 限界と未実施

この結果は移設差分の静的Visual限定PASSであり、A–H全体の再採点、ゲーム性/面白さ、公開判定ではない。model/style/14画像の同一性は別[INVARIANTS](QA/INVARIANTS.json)の証拠で、同一bytesという理由で新Visual点を付けていない。

今回この担当は連続動画・動きの滑らかさ・FPS・実音・人間の理解速度・実機safe-area/親指操作を評価していない。旧/新BESTの表示を確認しても、保存namespaceの非破壊性を静止画だけで証明したとは扱わない。該当の人間/実機項目は未検証のまま。使用model/token/costは直接取得できず`null`。外部API禁止の担当境界に従いJev呼出しも実行していない。
