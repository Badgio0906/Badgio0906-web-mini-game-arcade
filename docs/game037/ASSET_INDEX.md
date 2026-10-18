# Game037 素材台帳（ASSET_INDEX）

- 制作者：Claude Code（task `game037-claude-full-build-20261018`）がテキストとして**手書きしたオリジナルSVG**。輪郭・ハイライト・陰影・細部を意図的にpath設計。
- **画像生成ツールは使用していない**（ImageGen/外部モデル/写真/フォント輪郭の流用なし）。既存ゲーム素材・外部IP・素材サイトの転用なし。文字（「お弁当」「できあがり」「○○点」）はHTMLで描画し、SVGへ焼き込んでいない。
- ライセンス：本リポジトリのゲーム素材として作成。外部の権利表示は不要と判断しているが、法的クリアランスの保証ではない。
- 原本→配信：`node assets/game037/tools/build-assets.mjs`（`assets/game037/source/*.svg` のコメント・余白を除いて `public/assets/game037/` へ）。hash全文は [asset-hashes.json](../../assets/game037/asset-hashes.json)。

## Rules v2（現行）で配信する7点

|ファイル|用途|原本bytes|原本SHA-256(先頭)|配信bytes|配信SHA-256(先頭)|
|---|---|---:|---|---:|---|
|foods.svg|おかず10種の**1マス分の絵**（symbol `m-tamago` … `m-hamburg`）。実行時に任意形のおかずへ合成|12951|d3c2ed8c1f1ad4e0…|11699|b9217792699578f7…|
|bento-box.svg|赤漆の弁当箱。v1の4×4点線を外し、n×nのガイド線はCSSで描く|2440|bdc270f6bf0be3d7…|2040|1f6b2b6aafe2152b…|
|noren.svg|タイトルの藍染のれん|2446|7fd0f77d6b31138c…|2209|9b5d85a23a9c754e…|
|seal-stamp.svg|完成時の朱印|832|33f9ecba6698a691…|675|c27dc04626c75014…|
|sparkle.svg|完成時の山吹の光|464|44205cb1c1badd55…|364|a729f087c609d447…|
|washi-tile.svg|背景の和紙|1342|ecd1468c2e09bc22…|1156|037c700ae63d4720…|
|wood-tile.svg|トレイ・お品書きの木目|875|47e6245e28e63d1c…|734|39d84783f522daa6…|

### おかずの描き方（v2）
- どんな形のおかずも描けるよう、**1マスごとの食材の絵**（foods.svg）と、**マスの形に沿った角丸の台紙**（実行時に生成）を重ねる（`src/games/game037/pieceView.ts`）。台紙の色と縁は食材ごとに決めた紙・笹・レタス・バラン等（`DISH_STYLE`）。
- 卵焼き・ウインナー・からあげ・ブロッコリー・プチトマトの絵は、v1の1枚絵SVGに含まれていた1マス分のsymbolをそのまま移したもの。おにぎり・海老フライはv1では複数マスにまたがる1枚絵だったので、1マス版を新たに描いた。焼き鮭・枝豆・ハンバーグは新規。
- 回転したおかずは「回転後のマス」で描き直すので、食材の絵は常に上向きのまま。盤面のマスと絵は常に一致する。

## v1の素材（配信から外し、原本のみ保存）
- `assets/game037/source/v1/food-{I,O,L,J,T,S,Z}-*.svg`：v1（4×4テトロミノ専用）の1枚絵7点。rules2では形が自由になったため配信をやめ、`public/assets/game037/` から削除した。履歴とfoods.svgの出典としてのみ保持。
- v1時点の配信hashは `docs/game037/QA/SOURCE_BLOBS.txt`（v1 browser-final時）とgit履歴を参照。

## 実画面での確認
- rules2の全素材は [QA/rules2/browser](QA/rules2/browser/) の実スクリーンショット（4画面幅）で確認。
- サムネイル候補（Codexの採用判断用、未登録）：`QA/rules2/browser/desktop-stage30-clear.png`（8×8の完成画面）、`QA/rules2/browser/desktop-title.png`。
