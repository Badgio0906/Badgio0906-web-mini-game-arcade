# Game032 revision01 — Art Direction / 制作記録

## 方針と参照範囲

今回のユーザー追加指示に従い、既存の川背景を維持し、固定位置の二次元の男の子へ変更する。添付の人物画像は「素朴で親しみやすい手描きの子ども」というテイストだけを参照した。画像自体をImageGen入力へ渡さず、既存人物の顔、衣服の印、赤いTシャツ、網、かご、具体的な輪郭・ポーズの再現を指示していない。

独自デザインは、広めの麦わら帽子、青緑の帽子帯、短い巻き毛、青緑と生成りのシャツ、砂色の短パン、紺の靴。背景の青緑・暖色に合わせ、幼い少年と明確に分かる形にする。川辺の歩行姿は制作せず、idle / ready / cast / hook / reel / land の6種類を使用する。釣り竿と釣り糸は各姿勢の手へ接続して動的描画する。

水槽はImageGenで制作した**実写風の生成画像**であり、現実の水槽を撮影した写真ではない。正面の矩形ガラス水槽、透明な淡青の水、薄い砂と控えめな石・水草を用いる。生成時に魚を入れず、釣った既存魚素材を実行時に泳がせる空間を残した。

## 使用ツールと実行証拠

利用可能ツールのmetadataとschemaを制作前に確認した。使用ツールは OpenAI `image_gen.imagegen`。この環境のtoolはモデル選択欄がなく、返答は `image_url` / `output_hint` のみで、具体的モデル版・使用tokens・料金は未取得。GPT Image 2.5や「全モデル中の最新」を使用したとは断定しない。

実ImageGen **2回**で制作。今回の2回は前版3回とは別実行であり、以前の呼出を今回の呼出として数えていない。開始・完了の実時計、全文prompt、tool出力先、原本の所在は[provenance](../../../assets/game032/revision01/provenance.json)に記録した。toolが表示した生成画像を目視し、さらに切出し後の実配信素材とanchor sheetを`view_image`で確認した。

| 原本 | 採用内容 | 公開素材 |
| --- | --- | --- |
| `assets/game032/revision01/originals/boy-atlas.png` | 同一の少年6ポーズ・透明alpha | `public/assets/game032/boy-{pose}.webp` |
| `assets/game032/revision01/originals/aquarium.png` | 空の実写風水槽 | `public/assets/game032/aquarium.webp` |

## ゲーム用最適化と座標

[optimize.py](../../../assets/game032/revision01/optimize.py)は切出し、低alphaノイズ除去、サイズ縮小、WebP保存のみを行う。新しい人物や背景をPythonで描画していない。原本PNGを保持し、ゲームへは新規7WebP合計 **199,188 bytes**を配信する。

少年は各192×256、共通feet anchor `[96,239]`。姿勢ごとの竿を握る手、原本切出し矩形、translation、SHA256は[asset index](../../../assets/game032/revision01/asset-index.json)に記録した。各ポーズは静止画1枚であり、6動作それぞれに大量のアニメーションframeがあると主張しない。

水槽は512×512。実際の水域はおおむね x `.04–.96` / y `.17–.83`、推奨の広い描画窓は x `.08–.92` / y `.21–.73`。下部の両隅に水草があるため、魚の中心を上寄り `.23–.52` に制限するか、サイズと周回位置を調整し、水槽外・砂床・縁への重なりを避ける。

既存 `public/assets/game032/river-panorama.webp` のSHA256は `f5a465ffe91acbc7c1c083d117f0cc7770e33139daa21fe3688c69b505c19d5d`。最適化scriptはこのファイルを書かず、同一SHAをassertした。既存の6魚素材も変更していない。

## Art Directorによる素材確認

実view対象：生成boy atlas、最適化後boy anchor sheet、水槽原本、512px水槽。6姿勢とも帽子・衣服・体型が一致し、腕2本と脚2本の接続、靴までの全身、右向き、握る手の位置を確認した。透過周囲の茶色RGBはalpha0であり、cream背景への実compositeで茶色の矩形が出ないことを確認した。目立つ余剰肢・切断・帽子欠けは見られず採用。

水槽は魚・人物・文字がなく、水面・ガラス・砂・石・植物が静かな質感で、上中部に泳ぐ領域を保持している。生成画像単体で採用可能だが、実ゲームで魚が泳ぐ統合表示の判読性は別確認とする。

## 権利と未確認事項

原本は今回OpenAI ImageGenで新規生成し、外部ゲーム素材・他社キャラクター・ロゴ・具体的衣装意匠・ソースを流用していない。参照画像を写したものではない。ただし、独自制作という理由だけで権利リスクがゼロとは保証しない。画風自体の参照と特定キャラクターの再現を分ける。

人間によるキャラクターの好み、実機表示、魚の実際の泳ぎの印象は素材制作単体では確認していない。独立Visualレビューはこの素材制作者の判定とは分ける。

## 実ゲームとの統合比較（2026-10-10 17:33 JST）

Art Directorは固定candidate01の実ゲーム画像 **21枚**を`view_image`で確認し、制作時のatlas／水槽と比較した。画像・対象sourceのSHAは `QA/independent-browser-01/ART_SOURCE.json`、browser始終のsource hashは同directoryの `REPORT.json` にある。これは素材制作担当による統合採用確認であり、別担当の独立Visual評価や技術QA合格を代行しない。同reportは閲覧時 `source_unchanged:true` / `success:false` であり、その技術失敗を美術採用判断で隠さない。

閲覧した実ファイル（すべて `docs/game032/revision01/QA/independent-browser-01/` 配下）：

- PC：`pc-bait-land.png` / `pc-lure-land.png` / `pc-aim-left-near.png` / `pc-aim-left-far.png` / `pc-aim-right-near.png` / `pc-aim-right-far.png`。
- 390px phone相当：`phone-bait-land.png` / `phone-lure-land.png` / `phone-lure-bite.png` / `phone-aim-left-near.png` / `phone-aim-right-far.png`。
- 320px small相当：`small-bait-land.png` / `small-lure-land.png` / `small-bait-bite.png` / `small-aim-left-far.png` / `small-aim-right-near.png`。
- 844×390 landscape相当：`landscape-bait-land.png` / `landscape-lure-land.png` / `landscape-bait-bite.png` / `landscape-aim-left-near.png` / `landscape-aim-right-far.png`。

確認結果：麦わら帽子と青緑の服が既存川背景の色に自然に馴染み、参照人物そのものではない子どもの輪郭になった。左右の投げ先画像で立ち位置は維持され、左側へ向く時に人物・手・竿が一緒に反転している。idle／ready／landの見えた姿勢で、手首と竿が分離せず、帽子から足まで欠けていない。背景の美麗な水面がプレイ領域の主役として残る。

水槽は各画面の右側に存在し、砂・水草・ガラスの実写風質感が配信素材から保持されている。餌の最初の1匹、続くルアーの2匹が同じ水槽内へ描画され、魚が縁・砂底・画面外へはみ出していない。PCでは魚種の形が読みやすい。390／320pxでは水槽画像が約90／78px幅となり、魚は約12–18 CSSpx長で細部の識別は弱いが、魚の存在・釣果の増加・隣接する魚種名は確認できる。短い横画面では人物も約50px高に縮むため、詳細より帽子と釣り姿の輪郭で読ませる制約を残す。

この21静止画比較では主素材の採用を維持し、再生成は必要と判断しなかった。ただし全6姿勢の時間的遷移、持続的な泳ぎの動き、実機の触感、人間の美しさ・好みは未確認。静止画で魚が2匹いることを「泳ぎアニメーションを見た」と読み替えない。

## 最終candidate04・独立browser04の再確認（2026-10-10 17:55 JST）

その後、candidate02の実ゲーム6画像でスマホ水槽の魚拡大を確認した。候補01で記録した「12–18pxで細部が弱い」は旧候補の観測であり、最終版へ無条件に適用しない。最終candidate04を動かした `QA/independent-browser-04/` の実画像 **19枚**と、そこから作った実画面サムネイル **1枚**を追加で`view_image`した。原本や素材の追加生成はなく、今回のImageGen実呼出は引き続き **2回**。

最終閲覧対象：

- PC：`pc-charging-bait.png` / `pc-casting-transient-bait.png` / `pc-charging-lure.png` / `pc-casting-transient-lure.png` / `pc-lure-land.png`。
- 390px phone：`phone-charging-bait.png` / `phone-casting-transient-lure.png` / `phone-lure-land.png` / `phone-aim-left-near-corner.png`。
- 320px small：`small-charging-lure.png` / `small-casting-transient-lure.png` / `small-lure-land.png` / `small-aim-left-near-corner.png`。
- 844×390 landscape：`landscape-charging-lure.png` / `landscape-casting-transient-lure.png` / `landscape-aim-left-near-corner.png` / `landscape-aim-right-far-corner.png` / `landscape-lure-land.png` / `landscape-tank-two.png`。
- 実画面サムネイル：`assets/portal/thumbnails/game032-revision01.webp`（640×360、`pc-game-layout-two-fish.png`由来）。

再確認結果：準備で竿を上げ、release中に腕を伸ばす少年の別姿勢をPC／phone／small／landscapeで確認した。手の位置を姿勢別に使用しており、握る手から竿が自然につながる。左右反転でも同様。背景ファイルは不変で、最終横画面のcropは川面の帯を広く示し、少年の足は前景の岸に残る。見た投げ先のringは水面上にあり、草の中へ投げる旧候補の印象を残していない。

スマホ水槽の魚は旧候補より明確に大きくなり、複数匹の尾・体形と増加が読み取りやすい。4画面で実釣果2匹を水槽内に確認し、縁・砂床・水槽外への破綻は見られなかった。実サムネイルには、 維持した川、固定位置の麦わら帽子の少年、右側の実写風水槽と2匹が同時に入り、今回の実ゲーム内容に一致している。未実装の絵や架空の魚を追加した構図ではない。

最終素材とサムネイルの採用を維持し、再生成は不要と判断した。閉じた独立browser04 reportは `success:true` / `source_unchanged:true` / **154チェック合格**を確認したが、この技術結果はQA担当の記録であり、Art担当による全操作の再試験ではない。静止画比較で準備・射出姿勢が読めることと、連続動画の滑らかさ、人間の感想、実機評価は引き続き区別する。
