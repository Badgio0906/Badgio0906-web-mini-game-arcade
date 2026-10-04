# Game002〜005 — Visual Redesign Report

この報告は基準commit `ad261f9e0cdc6e12b98047d30a30a45f347d62b1` のVisual Redesign結果です。その後のタイトル・UI・得点要素の変更は[最新の改修報告](TITLE_AND_UI_REVISION_REPORT.md)を参照してください。以下の比較・採点・同一性確認は当時の範囲です。

更新：2026-10-04 UTC。対象はアート・UI・描画・演出です。4本とも独立Visual Reviewの初回で必須条件を満たしました。最終回帰QAも完了しました。

## 実施範囲と制作工程

既存の実画面を1440×900と390×844で保存 → Art Directorが確認 → 4本のVisual Brief → 実際の画像生成7回 → 最適化・素材承認 → ゲームへの統合 → 実入力によるPC・スマホ撮影 → 独立Visual Review → 回帰QAの順で進めました。

採用ゲーム用WebPは25点、401,502 bytesです。生成原本・コンセプトは`assets/`に保存し、配信しません。Game004は生成した装置コンセプトをコードで再現しました。実際のプロンプト・出力・採用判断・寸法は[IMAGEGEN_LOG](visual/IMAGEGEN_LOG.md)、各方向は[VISUAL_LIBRARY](VISUAL_LIBRARY.md)に記録しています。

比較画像は同じ画面サイズの実ゲーム画面です。ランダムな人物・荷物・列の一致を装った比較ではありません。撮影用の操作も通常のキー・タップを使用し、読み取り専用の開発診断で状態を確認しました。

## Game002 — WORKDAY DODGE

- **Before Problem:** 単純な人物と建物の反復で、通勤の世界観と登場人物の個性が弱い。
- **Art Direction:** COMIC URBAN。朝の紙面、仕事用チケット、紺のスーツと鞄、暖かい日本の街並み。
- **ImageGen Usage:** 人物アトラスと4地区の背景を2回生成。主人公1人・通行人5人・地区の左右8枚を採用。14 WebP、254,412 bytes。
- **Implementation:** 人物画像は既存位置・サイズに合わせ、外見は既存IDから決定。静かな中央道路・車線・予告はコード。距離を主役にしたHUDと紙面UI。3レーン、250mごとの地区境界、移動・出現・衝突・得点を維持。
- **Visual Review Score:** Iteration 1、**PASS 82/100**。A14 / B12 / C8 / D8 / E8 / F14 / G6 / H12。[独立レビュー](visual/GAME002_VISUAL_REVIEW.md)。
- **Remaining Issues:** 街のタイル反復と、人物が単一姿勢・微小な上下動中心のアニメーションは磨く余地あり。必須修正なし。人間によるアート・操作感の評価待ち。

| 比較 | Before | After |
|---|---|---|
| Desktop | [実画面](visual/before/game002-desktop.png) | [実画面](visual/after/game002-desktop.png) |
| Mobile | [実画面](visual/before/game002-mobile.png) | [実画面](visual/after/game002-mobile.png) |

## Game003 — DROP TOWER

- **Before Problem:** 木箱の積み重ねが中心で、建物を作り空へ伸ばす体験の視覚的な魅力が弱い。
- **Art Direction:** ILLUSTRATED INDUSTRIAL。街の上にカフェ・住宅・オフィスの階を積み、静かな空と建築目盛りを背景にする。
- **ImageGen Usage:** 5種類の階ファサードと低い街・空を2回生成。中央4:1の部分を切り出し、6 WebP、57,098 bytesを採用。
- **Implementation:** 画像は既存荷物の全幅・全高の矩形内に配置。クレーン・投影・質量・支持・重心の表示はコード。高さと既存カメラから背景を描画。木箱の切取りや物理変更なし。既存着地演出の共有乱数消費も維持。
- **Visual Review Score:** Iteration 1、**PASS 85/100**。A14 / B13 / C8 / D9 / E8 / F13 / G7 / H13。[独立レビュー](visual/GAME003_VISUAL_REVIEW.md)。
- **Remaining Issues:** 細い投影・目盛りと雲の反復は今後の磨き候補。必須修正なし。人間によるアート・精密な落下判断の評価待ち。

| 比較 | Before | After |
|---|---|---|
| Desktop | [実画面](visual/before/game003-desktop.png) | [実画面](visual/after/game003-desktop.png) |
| Mobile | [実画面](visual/before/game003-mobile.png) | [実画面](visual/after/game003-mobile.png) |

## Game004 — ECHO GRID

- **Before Problem:** 平坦な暗い電子パネルで、装置としての素材・奥行き・背景の文脈が弱い。
- **Art Direction:** RETRO DEVICE。研究室の記憶実験装置、グラファイトの筐体、真鍮、象牙色のキー、琥珀色の光。
- **ImageGen Usage:** 装置コンセプトを1回生成し、材質と構成の参考として採用。コンセプト画像を配信せず、ゲーム用画像は0 bytes。
- **Implementation:** 幅のある実験装置UIをHTML/CSSで再現。9個のnative button・番号・重要な表示はコード。光は既存クラスの即時切替を維持し、消灯区間に残光を足さない。入力範囲・点灯時間・記憶列・RECALLの期限なしを維持。
- **Visual Review Score:** Iteration 1、**PASS 85/100**。A13 / B13 / C6 / D9 / E9 / F14 / G8 / H13。[独立レビュー](visual/GAME004_VISUAL_REVIEW.md)。
- **Remaining Issues:** 背景の材質反復と研究室としての奥行きは控えめで、Cは6/10。必須修正なし。人間による記憶への集中と装置表現の評価待ち。

| 比較 | Before | After |
|---|---|---|
| Desktop | [実画面](visual/before/game004-desktop.png) | [実画面](visual/after/game004-desktop.png) |
| Mobile | [実画面](visual/before/game004-mobile.png) | [実画面](visual/after/game004-mobile.png) |

## Game005 — SORT SHIFT

- **Before Problem:** 明るい物流台と単純な荷物が中心で、工場と製品の統一された個性が弱い。
- **Art Direction:** COLORFUL FACTORY。紫の輪郭、クリーム・珊瑚・黄・青緑の機械、触れられそうな製品、強いRULE看板。
- **ImageGen Usage:** 丸/角×明/暗の4製品と工場の周辺背景を2回生成。5 WebP、89,992 bytesを採用。
- **Implementation:** 素材は既存の丸・角、大小の形の内側に配置。○/×、RULE、左右、残り時間はコード。背景の機械を周辺に置き、現在の荷物を明確にする。逆転・到着・発送・変更予告・判断時間と入力受付条件を維持。
- **Visual Review Score:** Iteration 1、**PASS 88/100**。A14 / B14 / C8 / D9 / E9 / F14 / G7 / H13。[独立レビュー](visual/GAME005_VISUAL_REVIEW.md)。
- **Remaining Issues:** 背景の腕・ベルトは静止しており、機械の二次動作は今後の磨き候補。実入力での製品搬出は確認済み。必須修正なし。人間による4属性の瞬間認識と工場表現の評価待ち。

| 比較 | Before | After |
|---|---|---|
| Desktop | [実画面](visual/before/game005-desktop.png) | [実画面](visual/after/game005-desktop.png) |
| Mobile | [実画面](visual/before/game005-mobile.png) | [実画面](visual/after/game005-mobile.png) |

## 独立Visual Gate・QA

採点基準はA Identity15 / B Objects15 / C Background10 / D UI10 / E Composition10 / F Readability15 / G Motion10 / H Production15。合計80以上、F・Hそれぞれ12以上を必須とします。最大3回。不合格が残る場合は`HUMAN ART REVIEW REQUIRED`を明示します。

| Game | A/15 | B/15 | C/10 | D/10 | E/10 | F/15 | G/10 | H/15 | 合計 | 判定 | 反復 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|---|
| 002 | 14 | 12 | 8 | 8 | 8 | 14 | 6 | 12 | 82 | PASS | 1/3 |
| 003 | 14 | 13 | 8 | 9 | 8 | 13 | 7 | 13 | 85 | PASS | 1/3 |
| 004 | 13 | 13 | 6 | 9 | 9 | 14 | 8 | 13 | 85 | PASS | 1/3 |
| 005 | 14 | 14 | 8 | 9 | 9 | 14 | 7 | 13 | 88 | PASS | 1/3 |

全4本が合計・F・Hの条件を初回で満たしました。必須修正所見なし、3回制限を超えたゲームなし。サムネイルは合格した実画面から等比縮小したものです。[制作記録](visual/THUMBNAILS.md)。

| 回帰・確認 | 実行結果 |
|---|---|
| 保護対象のソース | モデル・共通処理・Game001等20ファイルのSHA-256一致。4manifestは`visual_identity`のみ更新し、その他の項目は一致 |
| 描画・mainの差分 | 9ファイルを全差分レビュー。抽出した操作・進行・タイマー・乱数等の保護AST領域は変更0件 |
| TypeScript / 最終ビルド | PASS、5ページ生成、Vite 5.01秒 |
| Unit | 53/53 PASS |
| 既存ブラウザ回帰 | 51/51 PASS、57件は従来どおりproject条件で意図的skip。11.7分。既存の期待値・セレクタは未変更 |
| 追加レスポンシブ確認 | 4ゲーム×8画面サイズの32組でCREDIT 0タイトル・補充待ち・ポーズ、44px以上の操作、中央の被覆なし、時間停止を確認 |
| ECHOの点灯・消灯・再生 | PC/小型スマホ2ケースPASS。残光transition 0秒、点灯と再生の文字コントラスト約5.93:1 |
| 最終静的配信 | 全5ページPASS、40.0秒。入力・保存・開発hook除去・既存JS容量基準を維持 |
| Before / After成果物 | 必須48 PNGの存在と1440×900 / 390×844を確認。追加の予告・高さ・点灯・反転・搬出画像も保存 |

[VISUAL_QA](visual/VISUAL_QA.md)とJSON記録が実行証跡です。ソース監査スクリプトの再実行には、比較元commitを含むGit履歴が必要です。

### 画像容量と残る性能確認

| Game | 配信に同梱するWebP | 同梱合計 bytes | 実起動時の取得画像 / bytes | 取得画像のRGBA換算 bytes |
|---|---:|---:|---:|---:|
| 002 | 14 | 254,412 | 14 / 254,412 | 2,949,120 |
| 003 | 6 | 57,098 | 6 / 57,098 | 1,691,648 |
| 004 | 0 | 0 | 0 / 0 | 0 |
| 005 | 5 | 89,992 | 2 / 54,490 | 1,589,248 |

[実取得記録](visual/LOADED_ASSET_AUDIT.json)では画像・HTTP・console・pageエラー0件。005の後続属性画像は必要時に読み込むため、起動時の取得と同梱合計を分けています。最大画像辺768px。原本とサムネイルは配信対象外です。RGBA値は画像寸法からの算術で、GPUやヒープの実測ではありません。

Workdayは人物16・背景6、Towerは階26・街1の固定Imageプールを再利用します。Phaserの既存約1.21 MB共有chunkのサイズ注意は残り、実機スマホFPS・低速回線のロードは未測定です。

[GAMEPLAY_AUDIT](visual/GAMEPLAY_AUDIT.json)には元SHAと現在SHA、許可した外観メタデータ例外を記録しています。エージェントの点数と自動テストは人間の面白さ・公開合格・実機スマホFPSの証明ではありません。

## 人間プレイテストで残す確認

- Game002：スマホで主人公・通行人・進路変更の予告を瞬時に区別できるか。見た目と接触した理由が一致するか。
- Game003：荷物の全幅、支持する端、質量を読み取れるか。塔が高くなっても落とす判断を妨げないか。
- Game004：連続して同じキーが光る区切り、消灯、回答時の状態が明確か。実機でキーとフォーカスが読みやすいか。
- Game005：形・明暗・大小・○/×と現在のRULEを一瞬で読めるか。背景の機械や発送演出で判断が遅れないか。

物理スマートフォンで初回ロード、タッチ、音、滑らかさを確認し、アートの好みと再挑戦したさは人間の評価として追記してください。既存の人間向けA〜J記録は各`GAME00N_LESSONS.md`に残しています。
