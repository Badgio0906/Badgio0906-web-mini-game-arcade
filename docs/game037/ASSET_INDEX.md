# Game037 素材台帳（ASSET_INDEX）

- 制作者：Claude Code（task `game037-claude-full-build-20261018`）がテキストとして**手書きしたオリジナルSVG**。輪郭・ハイライト・陰影・細部（卵焼きの巻き、米粒、衣、タコの足、房、ヘタ等）を意図的にpath設計。
- **画像生成ツールは使用していない**（ImageGen/外部モデル/写真/フォント輪郭の流用なし）。既存ゲーム素材・外部IP・素材サイトの転用なし。テキスト（「お弁当」「できあがり」「○○点」）はHTMLで描画し、SVGへ焼き込んでいない。
- ライセンス：本リポジトリのゲーム素材として作成。外部の権利表示は不要と判断しているが、法的クリアランスの保証ではない。
- 採否：下表13点を**採用**（本番描画に使用）。不採用・別案はなし。作画中の1回目のL（海老フライ）下地は重複pathを含んだため同ファイル内で書き直した（採用版のみ残存）。
- 原本→配信：`node assets/game037/tools/build-assets.mjs`（コメント・余白を除去してコピー）。hash全文は [asset-hashes.json](../../assets/game037/asset-hashes.json)。
- 盤面整合：`bento-box.svg`の黒漆の内枠は440単位中の20〜420で、`.grid { inset: 4.5455% }`（20/440）と一致。食材SVGは1マス=100単位、回転0の形状どおりに描画し、`pieceView.ts`が回転後bboxへ中心回転で配置するためマスと絵がずれない。

|ファイル|用途|原本bytes|原本SHA-256(先頭)|配信bytes|配信SHA-256(先頭)|
|---|---|---:|---|---:|---|
|bento-box.svg|赤漆の弁当箱（盤）、金の梅、黒漆の内枠と点線ガイド|2716|8ea45a71252fc768…|2310|b71f487756f33b78…|
|food-I-tamagoyaki.svg|I：卵焼き4切れ（巻き断面・ねぎ）|2200|6fd8faa9e8b5e05a…|1944|104569c68c372f15…|
|food-O-onigiri.svg|O：笹の葉のおにぎり＋たくあん＋梅干し|3579|20ac8f62fa6f3dc1…|3245|684769ea1c37fee8…|
|food-L-ebifry.svg|L：レタス上の海老フライ（尾が足マス）＋パセリ|3682|2f14d2d16f80d05c…|3302|75a2290336c537e8…|
|food-J-wiener.svg|J：水色紙カップのタコさんウインナー×4|2993|f613ce953e367bed…|2732|421bf4b089377fd7…|
|food-T-karaage.svg|T：レタス上のからあげ×4＋レモン|3262|e0c7a0b192786896…|3003|f931b1ee0c43f35a…|
|food-S-broccoli.svg|S：生成りカップのブロッコリー×4|2930|50483b7c7b4c3f4b…|2695|1b8e4b580f7a5df5…|
|food-Z-tomato.svg|Z：緑バランの上のプチトマト×4|2588|196367aff696a8ce…|2358|0f2ce75e549c0bac…|
|noren.svg|タイトルの藍染のれん（文字はHTML）|2446|7fd0f77d6b31138c…|2209|9b5d85a23a9c754e…|
|seal-stamp.svg|完成時の朱印（中央は生成りの下地、文字はHTML）|833|27f0f97d9ebbf64f…|676|e31246e72246f0c1…|
|sparkle.svg|完成時の山吹の光|464|44205cb1c1badd55…|364|a729f087c609d447…|
|washi-tile.svg|背景：生成りの和紙繊維タイル|1342|ecd1468c2e09bc22…|1156|037c700ae63d4720…|
|wood-tile.svg|おかずトレイ：檜風の木目タイル|875|47e6245e28e63d1c…|734|39d84783f522daa6…|

## 実画面での確認
- 全素材は最終ブラウザQAの実スクリーンショット（[QA/browser-final](QA/browser-final/)）で表示確認。desktop/phone/narrow/landscapeのtitle・練習完成・各面完成・結果・休憩・遊び方。
- サムネイル候補（Codexの採用判断用、未登録）：`QA/browser-final/desktop-stage6-clear.png`（実プレイの完成画面）、`QA/browser-final/desktop-title.png`。正式サムネイル台帳には登録していない。
