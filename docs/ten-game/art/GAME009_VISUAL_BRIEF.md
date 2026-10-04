# Game009 印鑑どこですか ～STAMP HUNT～ Visual Brief

2026-10-04 / Art Director / ASSET DRIVEN・温かいオフィス机。

## Design Goal / Mood

書類と文房具が増え、机が少しずつ考古学の現場になる。難しさは個数と似た対象の識別で作り、印鑑を極小にしない。蜂蜜色の木#bd936a、紙#faf0d9、墨#514437、朱#c45748、青#496f91、緑#70846a。真上から見た道具に浅い影を付ける。ネオン工場や機械の9マスではない。

## Composition / UI

机が画面の大部分。上に紙クリップ風の指示帯、時計/スコアは角、文具トレイは余白。Desktopに宣伝用左列を置かず、Mobileでも指示と対象が同時に見える。各対象は個別nativebuttonまたは正確な当たり領域、最低44pxの非重複touchbounds。印面は390px幅で30〜36px程度以上、対象全体44px以上を目安にする。規則的な3×3カードにせず、読みやすい散らかりをコードで配置する。

## Character / Object Design

赤い丸・青い丸・赤い四角・青い四角の印鑑。木/ゴムの本体と、明確な色と形の空白印面。重要な文字は生成しない。紙束、ペン、クリップ、メモ、電卓、コーヒー、ホッチキスは個別素材。見かけ上つかめる対象と実際のhit領域を一致させる。正解印鑑を不透明書類の下へ隠さず、飾りが入力を奪わない。

## Background

机の木目・細い板の継ぎ目はコード。生成画像の机全体を背景クリックゲームにしない。Clutterは個別オブジェクトとして増減し、高難度でも対象の境界を読む余地を残す。「片付ける」では実際の道具/紙が減って見え、倍率resetを本物の文字で知らせる。

## Code / Generated / Hybrid

Generatedは4印鑑＋7道具の透過素材。Codeは個別の位置/回転/重なり/hit、印面の正確な形と色の補強、指示・時計・文字・結果。Hybridはコード木机に生成道具を配置し、正確な印面とnative hitを重ねる。道具を勝手に追加の対象ルールにしない。

## ImageGen Plan / Asset Contract

3行×4列、最後は空白。1行目は丸赤/丸青/四角赤/四角青。2行目は紙束/ペン/クリップ/メモ。3行目は電卓/カップ/ホッチキス/空。絶対真上、同じ細い茶墨線、木・紙・朱・青・緑、全物体を分離、背景/影/文字/ロゴなし。

`stamp-round-red.webp`、`stamp-round-blue.webp`、`stamp-square-red.webp`、`stamp-square-blue.webp`は192×192〜256。`desk-paper.webp`、`desk-pen.webp`、`desk-clip.webp`、`desk-memo.webp`、`desk-calculator.webp`、`desk-cup.webp`、`desk-stapler.webp`は128〜192px。実セル/bbox/中心anchorを検査し、生成grid位置を決め打ちしない。目標11個160KB以下、記録した上限220KB。原本`assets/game009/`、配信`public/assets/game009/`。生成物の印面が曖昧なら、その内部材質だけを正確なコード印面へclipする。

## 実素材の確認

生成原本とstaging最適化の赤丸/青四角をArt Directorが実際に見て承認した。色と印面形が明確で、木の台座を全て含む。11個合計149,816bytes。初回素材承認時はMainの長時間ブラウザ確認を妨げないよう`assets/game009/staging/`で待機した。その後Mainが開いた書込みwindowで同じ採用画像をpublicへ配置した。素材承認は完成Visual Gateではない。

## Animation / Error Clarity

正解は印鑑の短い押し込みと小さなコードのインク輪/チェック、次の指示へ。誤入力は選んだ個体に枠を付け、指示を隠さない。紙追加は入力区域を潰さない短い置き動作、片付けは実個体の除去。Reduced Motionは即配置にする。結果の称号・小さな笑いは本物のテキスト。

## Avoid List / Quality Gate

1枚の生成机にクリック座標を置く構成、隠れた正解、小さ過ぎる印鑑、色だけ違って形が曖昧な対象、hitと違う重なり、softwaregrid、読めない生成日本語、遊びと無関係な静物だけの飾りを避ける。実Desktop1920×1080/Mobile390×844で低/高clutter・各対象・誤入力・片付け・結果を確認。独立80以上、F12以上、H12以上、最大3回。その後HUMAN ART REVIEW REQUIRED。人間の初見探索・実機touchは未評価。
