# Game015 Art Direction — 落下キング ～FALL KING～

2026-10-04。[実装仕様](IMPLEMENTATION_SPEC.md)0〜71を全文読了。**実素材は低解像度gridへ直接authorするpixel art**。王様の冠、足場の材質、落下の姿勢と下方の視界で『下へ進みたいが、落ちすぎると死ぬ』を読ませる。Art Directorはこの文書のみを所有し、runtime/physics/素材/browserを変更しない。

## 確定した内部解像度と役割

Root・Gameplay・UI・Asset Producerで**256×448 native playfield**に統一。16px/mはGameplayの世界スケール、tile16×16、king16×24。16column×28rowの正確なtile grid、aspect4:7はportrait9:16に近い。初案192×336/先行案180×320は採用しない。既存pixel spritesを新解像度に合わせて拡大し直さず、背景tileの範囲を増やす。

仕様34の256×240/320×180〜240は推奨、54の縦worldと内部解像度は別管理可。256×448を選ぶ理由は、16px/mで3.5〜4.5mの段差を2〜3段先まで見せること。比率だけ合わせて下方視界を削らない。Gameplayのplayer足元screenY約110〜112pxを初期camera targetとし、上には過去の足場が少し、下には次の着地点が十分残る。これはcamera構図の目安で、隠れた安全routeを生成したとみなす条件ではない。

|所有|責任|
|---|---|
|Gameplay|float physics/接触面/生成/camera target/input/state、native rendererの統合|
|Asset Producer|`src/games/game015/art.ts`の意図的pixel arrays/bitmap glyph/frames/tiles、素材indexとpalette記録|
|UI|native canvas256×448、pixelated scaling、説明/結果/44pxcontrols/portal card、responsive配置|
|Art Director|この方向書と、後の独立actual Visual評価。評価browserはRootのexclusive slotまで起動しない|

Simulationのfloat位置・速度・慣性を整数へ丸めない。最終draw座標/camera offsetだけroundし、同じnative canvasへ描く。Canvas image smoothingを切り、CSS `image-rendering:pixelated`。CSS frame/飾りでgameを狭くせず、PCは高さ80〜90%有効利用を目安にし、phone縦は左右＋DROPの明確な≥44CSSpx操作を残す。整数CSS倍率が収まる時は優先、他サイズもnearestで比率維持し、画面外へはみ出して整数倍率を強制しない。

## Pixel language / Palette

細inkの現代illustration、gradient、blur、soft shadow、subpixel回転、antialias輪郭を禁止。16tileの中で大きな面、意図的な1〜2pixelアクセント、短い陰影階段を組む。高解像度絵の縮小/自動posterize/pixel filterで『レトロ』を作らない。NESの実hardware制約を完全再現する必要はないが、一定のpixel densityと色数を守る。

Producer提案の**global16 opaque colors＋透明**を採用：deep indigo outline、cream face/light、gold crown、teal tunic、rose capeがhero共通。背景はbiomeごと8〜10色程度のsubset、hero/UIを含むscene全体はglobal16内。実hex paletteをProducerのindexへ固定し、無断で演出ごとの中間色を増やさない。HUD/heroの明度を背景より高くし、冠と頭が暗い縦坑に埋もれない。Art Directorが別hex tableを重ねて二重の色契約を作らない。

輪郭は1native pixel、深indigoのまとまったshape。草/石/レンガの均一noiseを埋めず、空間の中央は静かにする。detail量の少なさは低品質判定にせず、pixelの位置・silhouette・色の選択に意図があるかで評価する。

## King / Frame contract

小さく間の抜けた王様：3突起のgold crown、creamの顔、tealの服、roseの短いcape。冠の突起間はdark gapで読み、王冠だけ背景と同色にしない。16×24 native frame、bottom-centerの足元anchor（x8/y24）を全stateで共通。生成illustrationではなく全pixelを直接author。Spritesheet PNGを必須にせず、named frame arraysをart.tsからrendererへ渡す。frameの外へcape/冠/手を出さず、collision rectangleと絵の足元を接触時に合わせる。

|State|Frames目安|見える差|
|---|---:|---|
|Idle|2|冠/胴は安定、cape1pixelの小さい揺れ|
|Drop start|2|足を少し引き、腕を上げて床を抜ける|
|Falling|2〜3|脚が開き、capeが上へ、落下方向を示す|
|Left drift|2|左へ傾く体/左向き顔、右側へ流れるcape|
|Right drift|2|反対の体/顔/cape。simply moveだけにしない|
|Landing|2|膝を軽く曲げ、足元が接触面に収まる|
|Hard landing|3|深い膝折れ/冠のずれ、safeより強いdust|
|Death|3〜4|低く潰れた体・転がる冠・pixel stars。流血/肉片なし|

Unused frameやpaddingを自動的に再生せず、有効frame数/anchorをindexに記録。2〜4frame中心、見えるframe cadenceは約6〜10Hzを出発点にし、input/physicsは通常updateで即時反応する。画面の動作をframe cadenceへ落としてinput lagを作らない。Landing絵とhard状態はmodelの実stateで選び、art側が勝手にstun/無敵を足さない。

## Four biomes / Tile contracts

Tile16×16、最低8pattern/biome程度を上限の目安にして、同じ大きな石の色替えだけで済ませない。手前の可着地platformと背景構造を混同させない：backgroundはoutline/明度を抑え、platformの上面は一段明るく連続線を持つ。decorative pipe/beamをheroが乗れる足場に見せない。

|深度|世界/shape|Palette subset・配置|
|---|---|---|
|0〜250m|古い塔/地上施設：大きいレンガ目地、梁、割れた小窓、縦の壁柱|暖brick/ochreとindigo。左右壁の材料が明瞭、中央は暗いshaft。空の窓は少数|
|250〜500m|地下工事：太いbeam、接合plate、pipe elbow、支柱、控えめなstripe|slate/cream/ochre。直角/リベットの人工構造、警告stripeはplatformtypeの色手掛かりへ流用しない|
|500〜1000m|洞窟：大きな角張った岩面、段状の地層、空洞の縁、小さいstalactite|deep indigo/teal/gray。斜面はpixel階段、noise textureで埋めない。洞窟飾りを突然の危険物にしない|
|1000m〜|謎の地底：対称の石積み、奇妙な刻み、静かな結晶、暗い大きなアーチ|violet/mint/indigoの既存subset。広いnegative spaceと人工/自然の矛盾。neon/glow祭りにしない|

遷移はdepthによるtile/paletteの切替、短いdither/境界帯などgridを保つ手段。長い全面flashや半透明crossfadeで色数を増やさない。常時particleを降らせない。初回説明/practice/portalでは全biomeを一覧展示せず、『1000mより下を見たい』余地を残す。1000m通知は短く、modelを終了させる巨大GOAL演出にしない。

## Platform identity / Honest geometry

4typeはcolorに加え、輪郭/素材/短い動作で区別。見える上面のYをmodelのcontact topへ合わせ、端の装飾で立てる範囲を偽装しない。artの16pixel segmentを実widthへtile/clipし、spriteの横stretchでpixelが長方形にならない。collision幅/発生頻度/崩壊時刻/移動速度はGameplay所有。

|Type|Native drawing contract|意味のある動作|
|---|---|---|
|Normal|solid stone16×8 motif、平らなbright top/下のdark row、粗い目地は少数|通常着地のdust2〜4pixel/低い音|
|Soft|丸みは1pixel steps、厚いmat/布の角・縫い目、他より明るい柔らかい上面。石outlineと区別|接触時に上面1pixel沈む2frames→復帰。絵の変化をphysics面の変化にしない|
|Crumble|欠けた下端、中央/端の明瞭な亀裂、solidstoneとの連続上面は維持|着地後の実残り時間に対応し裂け目が増え、数pixel debris。不可視timerだけにしない|
|Moving|metal twin beam/端のリベット/短いrail、normal石や工事背景と区別|実platformと同じ位置に整数draw、codeの小さい左右markはmovementの補助|

Softなら長落下を救えることは、材質と実着地で分かる。FALL meterがfatal色でも空中で即死したと誤解させず、『硬い足場への衝撃』のwarningと実Death原因を一致させる。初版4type以外のenemies/items/能力を絵だけで示唆しない。

## HUD / Feedback / Japanese UI

Canvas HUDは5×7の意図的bitmap glyph、DEPTHの数字/FALL距離など重要値はnative2倍glyphを基本、補助label/BESTは1倍も可。全canvasをfont1native pixelへ落としてmobileで数値が潰れない。上約32〜40native pxのcompact stripを目安に、DEPTH/BEST/FALL meter・状態記号を配置。hero視界と次の足場へ大きいweb cardを被せない。digitの幅を固定し、1000/10000mと小数fall/unitが欠けない実viewportを確認する。

SAFE/HARD/DANGERは明度/segmented meter/mark/短いtextも併用し、緑黄赤だけに依存しない。数値と境界はmodelの調整値を読み、画像に6m/9mを焼き込まない。NICE DROP!はlandingの短いpixel message/counterで、複雑な第二scoreにしない。成功・hard・deathが同じsparkに見えないこと。

Title/説明/Resultは日本語中心、画面の読みやすいDOM fontを使ってよい。日本語を英字bitmapへ無理に縮めない。big heading/数値/solidpixel border/角の段差でretroと揃え、SaaSの丸card/gradientを持ち込まない。Resultは深度m/NICE DROP/BEST、死亡時の連続落下距離と着地衝撃の短い理由を明示。Credit prototype OFF時にinactive CREDIT/広告/残り回数を表示しない。portal帰還/pause/mute/再練習も操作しやすく保つ。

Hard/death screen shakeは1〜3native pixels、短い限定時間、reduced-motionで抑える。dust/starsは1pixel/2pixelの明確なcluster、blurやalpha smearなし。音はDROP/風/normal/hard/NICE/death/milestoneと短いchiptuneが同じfeedbackを補強する。視覚だけ・音だけで重要危険を伝えない。サウンド制作と動作設定は実装owner。

## Onboarding / Practice art

共通短い説明→実Practiceを使い、最初のbiomeと同じhero/material/HUDで教える。①広い足場からDROPして着地、②少しずれた足場へ空中左右入力、③安全落下のFALL値を見て着地、④ghostで長落下→hard fatalを短くdemoし理由を表示。Practiceだけheroを別のベクター人形にしない。ghostは同じspriteの限定色2tone等で本人と区別し、危険demoを本人の本番Death/scoreへ保存しない。4stepsの成功条件/5〜20秒目安の調整はRoot/Gameplay/Feel所有。放置で成功しない、長いchapter紹介はしない。

## Production asset budget / ImageGen decision

今回productionはProducerが直接authorする`art.ts`のpixel arrays/tiles/bitmap font。小さいsourceと再利用tileを優先し、art dataはplain source約48KB以内を目標（全JS/engine量の予算ではない）。frame16×24とtile16の整数寸法/palette/state count/anchor/公開方法をASSET_INDEXへ記録。PNGを使う場合も直接authored同grid・nearest・少色を保持し、atlas寸法/列行/有効cellを明示してsource/publicを分ける。必要がなければruntime画像fileを増やさない。

仕様42のImage Generationは**任意のArt Direction探索**。今回はpixel arraysで直接authorする方針で、ImageGen production画像は要求しない。今後conceptを生成した場合はtool/prompt/source/採否を記録し、その絵を縮小して実spriteに使わない。未実行のImageGen callや存在しない専用skill使用を実績に数えない。

## Truthful portal thumbnail

実プレイでhero落下中、上と下のpixel足場、下へ長い空間が見えるframeを採用。実canvasのinteger pixel rectangleからcropし、nearestでscale/余白調整、aspectを変えない。640×360 WebP/≤45KB程度を目標に、cropped source座標/hash/runtime候補/実stateを記録する。Pixelの王様がthumbで消える場合は全portrait縮小より、実frame内のheroと近い上下足場が残るcropを優先。架空の複数biome合成、巨大hero描き足し、filtered高解像度posterは禁止。まだ保存actual captureがないのでthumbnail完了とは記載しない。

## Independent visual gate — playable候補で実施

Rootがexclusive browser slotを指定した後、PC1440×900相当とphone390×844のactualplayをview。total80/100以上、F読みやすさ/H完成感は各12/15以上。Pixel artは情報量ではなく、下記の実意図で評価する。quality scoreはplayableactualができるまで未採点。

|観点|合格の観測条件|
|---|---|
|Pixel consistency|hero/tile/HUDでnative densityが揃い、camera/motion/scaleにblur/soft輪郭がない|
|Palette/contrast|global少色を保持、冠/顔/foot/各platformが各biomeで読める|
|Sprite/state|8required statesのframe/anchorが正確、drift方向/normal/hard/deathを見分ける|
|Tile/biome|4世界の材料/構図が異なり、繰返しが意図的。背景が足場や新hazardに見えない|
|Platform truth|4typeを形/素材で区別、実contact top/widthと絵が一致。崩れ/移動が実stateに同期|
|Composition|下2〜3段先と少しの過去を見て次landingを選べる。blind drop/狭すぎるPCcanvasなし|
|UI/modern playability|DEPTH/FALL/BEST/原因/日本語説明/44pxcontrolが読め、blur/focus/タッチの誤操作を生まない|
|Production|actualfall/movement/landing/scrollの一貫した8bit表現、true gameplay thumbnail、仮素材感なし|

背景4世界は、普通の到達の証拠と明示render-only palette検査を区別する。Fixtureで1000mを描いたことを自力到達/生成fairness合格にしない。Game Feelの慣性/安全判断/公平なpatternは別担当、Visualは「情報が見えるか」を判定する。最大3art iteration、元findingを保存し、限定technical fixをart点の水増しへ使わない。人間の先を見たい/楽しい/BEST狙い・実機FPSは別の未評価項目。

## 現状

Spec読了、native256×448/16grid/16×24king/limited16paletteを実素材へ採用済み。Filtered生成を使わずProducerがpixel arraysを直接authorした。初回actualの中央brick過密findingは左右48px詳細壁/中央160pxquiet voidへ限定修正し、実画像で改善を確認。Root指定exclusive slotで独立PC/phone actualplay/実画像確認を実施、[VISUAL_REVIEW](VISUAL_REVIEW.md)は初回PASS83/F12/H13、限定HUD修正の320×568練習・本番/844×390本番実確認後は現行PASS84/F13/H13。全browser/context閉鎖済み。実fall由来thumbは初回nativePortalで確認し、現行HUD除外cropをローカル実viewした。人間の面白さ/実機FPS/最終QA・公開判断は別工程で、Art Directorはruntime/素材を変更していない。
