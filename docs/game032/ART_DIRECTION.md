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

## 追加指示に対する能力・モデル確認（事後監査）

最初の生成より前に、本agentの実tool履歴で`ALL_TOOLS`を検索し、組込みOpenAI画像生成`image_gen__imagegen`（契約名`image_gen.imagegen`）の利用可能性を確認した。その後、背景・釣り人atlas・魚atlasの順で3回を実行し、すべて実画像と保存済みPNGを得た。初回tool結果のkeyは`image_url`と`output_hint`。モデルを指定するパラメーターはこのtool契約に存在しない。最初のdiscoveryの時刻そのものは記録しておらず、先後関係は実tool履歴で確認できる。

追加指示後の2026-10-10に、現tool一覧・cloud/executorのskill一覧を再確認した。一般の専用ImageGen Skillは当該一覧に存在せず、Work Pets専用skillは対象外。**このskill一覧確認を生成開始前に実施したとは主張しない。** 現在公開されている組込み生成経路を選んだことと、全世界で最新の特定モデル版を選択・比較できたことは区別する。

原本PNGのC2PA assertionを読み、CBORの`softwareAgent`をparseした。3点すべてが`name=ChatGPT`、`version=gpt-image`、claim generatorに`OpenAI Media Service API`を含む。原本に記録されたcreated時刻は背景06:51:31.094421705Z／釣り人06:52:57.259376596Z／魚06:54:08.926310281Z（日本時間15時台）。これはmetadataの時刻であって、tool呼出開始・終了の独自計測値ではない。metadataの読み取りは確認済みだが、C2PA証明書・署名chainの暗号学的検証は未実施。

確認できるのはOpenAI GPT Image**系統表記**まで。正確なresolved model revisionはtoolにも原本にも露出していないため`null`を保持し、**GPT Image 2.5使用済み・全体最新モデル確認済みとは書かない。** 利用したOpenAI生成tool、3回の実生成、正確なprompt、原本・派生18点のSHA256を[provenance](../../assets/game032/provenance.json)に記録した。API keyを表示・保存していない。

## Art Directorによる統合画面比較

追加指示後に保存済み実ゲーム画像`QA/release-candidate/ordinary-browser-01/`のPC bite／land、390px phone bite／land、320px land、横画面landを`view_image`で実viewした。さらに配信の`public/assets/portal/game032.webp`をviewし、生成原本と比較。各画面のSHA256をprovenanceに記録した。

原本の透明な水・苔岩・木々の密度は実ゲームにも保持され、主な絵がSVG/CSS仮図形に置き換わっていない。人物の帽子・服・手足・ブーツは自然な輪郭のまま、手の位置へ竿が接続される。PC釣果カードではオイカワの尾・ひれを含む生成魚が表示され、320px画面の釣果はアマゴの模様が読める。穏やかな紙色と青緑UIは背景と調和し、キャラを切断した説明カードへ置き換えない。phoneは岸・人物・水面・ウキを残すcrop、short landscapeは上下の狭い範囲と小さい人物となる。実thumbnailも実canvasからの景色と人物・竿で、架空の豪華画面を合成していない。

**素材担当の判断：採用済み美術を維持。これらの実画像では再生成を必要とする具体的な素材品質問題を認めなかった。** 新しい生成API呼出は0、runtime／配信画像の変更は0。川・人物・魚が主要生成素材、竿・糸・水面波紋・HUDはゲームの可変表示としてコードで補う。

この比較は素材作者／Art Directorの確認。独立Visualレビュー、実ブラウザ入力QA、本人の面白さ確認、実機の触感・発熱・音質とは別であり、それらを追加実施した扱いにしない。単一のsaved screenshotからすべての中間アニメーションや生物学的正確性が合格したとも主張しない。
