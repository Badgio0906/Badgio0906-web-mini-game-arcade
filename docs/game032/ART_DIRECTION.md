# Game032 Art Direction — 川辺で、ひとやすみ。

## Visual brief

静かな清流の空気を主役にする。透明な青緑の水、苔の灰青色の石、初秋の柔らかい黄金の木漏れ日、奥の林。イラスト調の細部を持つ背景へ、落ち着いた服の自然な釣り人と同じ方向性の魚を重ねる。目立つ人物、奇怪な人体、棒人間、架空の豪華UIは使用しない。

背景は実ImageGenで制作した1536×1024の1枚。左から浅い流れ・岩陰・木陰の深み・流れ込みを読める構成。実際の水面は原本y=.38〜.72、歩ける近岸はy=.78〜.91。2:1画面では例として原本y=.17〜.92を使い、元絵を縦横別倍率で変形せずcropする。スマホは現在位置の周辺を切り出し、岸・水面・ウキを残す。

釣り人はベージュの帽子、セージ色上着、茶色ズボンの右向き横姿。背景の主役感を奪わず顔や手を拡大しない。生成済み8ポーズはidle・walk-left・walk-right・ready・cast・hook・reel・land。各動作に1枚、歩行に2枚の異なる素材を持つ。フレーム枚数を水増しして連続アニメーション制作済みとしない。コード側の軽い補間と竿・糸・波紋で動作を補う。

## Integration geometry

- 配信背景：`public/assets/game032/river-panorama.webp`。
- 釣り人：`public/assets/game032/angler-{pose}.webp`、192×256、透明。共通足元anchor=(96,239)。原本のブーツ位置だけ揃え、体の縦横比を変えていない。
- 竿は生成絵に含まない。ポーズごとに観察した手の座標`rod_hand`へ必ず接続する。[asset-index](../../assets/game032/asset-index.json)に各ポーズの値を記録。
- 魚：`public/assets/game032/fish-{species}.webp`、384×192、透明、右向き。オイカワ／ウグイ／ヤマメ／アマゴ／イワナ／ニジマス。
- 魚は図鑑・釣果のイラスト。原寸の尾と背びれを切らず、表示時も`contain`相当で比率を保つ。原本は鑑別図鑑の正確性を保証するものではない。
- UIは象牙色の紙と深い青緑、文字の十分なコントラスト。画像にUIの字を焼き込まない。短い釣り状態、操作の名前、現在のテンションを優先し、景色を大きな説明カードで隠さない。

## Assets and verification

3回の実ImageGenで背景1・釣り人atlas1・魚atlas1を制作し、原本3点を保全。全3点を画像で実viewし、透過alphaも実確認。採用素材をPillowで抽出・WebP最適化し、明るい背景のcontact sheetで再viewした。配信15点の合計は1,180,616 bytes。原本は配信しない。

正確なprompt・生成tool・原本パス・採用理由は[provenance](../../assets/game032/provenance.json)。全原本／派生のSHA256と寸法は[asset-index](../../assets/game032/asset-index.json)。再生成ではなく派生の再現は`python3 assets/game032/optimize.py`（Pillow）を使う。

contact sheetは素材確認用であり実ゲーム画面でもPortal thumbnailでもない。サムネイルは統合後の本物のゲーム画面から別工程で作る。

この文書の確認は素材作者の実画像確認であり、独立した統合Visual合格や人間の面白さを意味しない。PC／390／320／横画面で岸・人物・竿・糸・ウキの実位置、手への接合、キャストから取り込みまでの連続性、UIの読みやすさを別途実画面で確認する。

## Rights

[素材のRIGHTS_NOTE](../../assets/game032/RIGHTS_NOTE.md)。外部ゲーム素材や既成キャラクターを参照・流用していない。権利リスクのゼロ保証は行わない。
