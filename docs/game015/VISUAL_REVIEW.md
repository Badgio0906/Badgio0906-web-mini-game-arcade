# Game015 — Independent Visual Review

2026-10-04。**現行PASS 84/100 · F可読性13/15 · H完成感13/15**。初回正式評価83/F12を保存し、末尾の限定HUD再確認でFのみ+1とした。Rootのexclusive slotでPC1440×900 / portrait phone390×844の全体確認、その後320×568 / 844×390のHUD再確認を実操作・実画像で行った。全browser/context閉鎖済み、両工程のHTTP/page errorsは`[]`。実装・素材author・独立Game Feel・QAとは別の数値評価で、人間の楽しさ/実機FPS/公開合格ではない。

## 対象・方法

初回対象は265runtime/public files、aggregate SHA256 `e29508cfe4fa8ad8287cbc56d83fd11abb9305f35926686a05f101e4c9a3d312`。現行[最終SOURCE_FREEZE](QA/SOURCE_FREEZE.json)との限定差分は末尾に記す。DEV `http://127.0.0.1:5181/game015.html`、Chromium実行、phoneはtouch emulation/deviceScaleFactor1。Seeded storage/score/時間/位置の注入なし、model/courseの書換えなし、force-endなし。Read-only snapshotで進行状態を確認し、普通のkeyboard/mouse/native CDP touchで練習・落下・自然失敗を実行した。実機スマートフォンの性能評価ではない。

[capture-visual.mjs](review-artifacts/capture-visual.mjs)と[PC journal](review-artifacts/visual/desktop-VISUAL_RECORD.json)/[phone journal](review-artifacts/visual/mobile-VISUAL_RECORD.json)が今回の原本。取得後、画像は`view_image`で実viewした。説明→4step Practice→成功→fresh main、実落下の連続2frame、28.6m HARD/NICE、pause、壁側へ普通に移動して自然fatal、retry/title/portal015/再launchを確認。計測中は他担当のbrowserが停止しており、終了後にRootへslotを返した。

深部は独立Feel担当の**普通の入力で獲得した**[100m](review-artifacts/desktop-earned-depth-100.png)/[300m](review-artifacts/desktop-earned-depth-300.png)/[500m](review-artifacts/desktop-earned-depth-500.png)/[600m](review-artifacts/desktop-earned-depth-600.png)/[1000m](review-artifacts/desktop-earned-depth-1000.png)を再viewした。1000.062m/266.494game-sec→1010.432m継続と、その後1036m自然fatalの所有者は[GAME_FEEL_REVIEW](GAME_FEEL_REVIEW.md)。Art Directorがもう一度1000mを到達したとは記載しない。Readonly答えoracleの長RUNは人間の難易度/楽しさの証拠ではない。

[ASSET_PREVIEW](ASSET_PREVIEW.png)は22king frames/32tiles/8platform framesの実authored-data診断sheetで、全pixelをview済み。これは実gameplayや全frameのnative再生確認とは別。[BACKDROP_PREVIEW](BACKDROP_PREVIEW.png)と素材indexはsource構造の根拠、上記earned深部画像は実render採点の根拠。Render-only fixtureで1000m到達を装っていない。

## 数値評価 — 採点1回目

少ない情報量を減点理由にせず、grid/palette/shape/意味のある動作/操作の読みから評価する。合計80以上、F/H各12以上を満たす。

|項目|配点|点|実観測と制約|
|---|---:|---:|---|
|A Identity|15|14|crown king、縦坑、bitmap数値、硬いpixel silhouetteが一貫。illustration縮小やretrofontだけの画面ではない|
|B Objects / Sprites|15|13|16×24の冠/顔/服/capeと16px足場が揃う。softの厚いviolet mat、crumble亀裂、moving gold beamを実深部画像で区別。最小heroの細部は縮小画面で限定的|
|C Background / Palette|10|7|tower/works/cave/strangeを壁材料で区別し、中央を静かな縦坑にした。少色を守るが各世界の明度/色の差は控えめ、側壁の16px motif反復は残る|
|D UI|10|8|DEPTH主体、FALL数値/色/meterと結果の原因が一致。日本語とDROP左右が明確。BEST/FALLの小さいbitmap補助文字とphone practiceの縮小previewは余裕が小さい|
|E Composition|10|9|王様は上寄り、直前の足場と下の複数targetが見える。PCは大きい縦canvas、phone本番はほぼ幅いっぱい。thumbは縦空間が伝わるが王様は小さい|
|F Readability|15|12|cream contact lineとgold crown/cream faceがquiet centerから浮く。主深度/死亡距離/46pxcontrolsが読める。phone FALL/BEST約10pxとpractice canvasは限界として明記|
|G Animation / Motion|10|7|実DROP/fall、空中横姿勢、kneeling HARD、integer-camera下降と短いfeedbackが明瞭。2〜4frame pose中心で控えめ。全22frameを毎回native再生したとの保証はしない|
|H Production|15|13|authored16color/nearest/正確なnativegrid、contact top/width、UI/音の切替、実game thumbが統合。小さい補助文字・反復する壁素材・控えめな演出が上限|
|**Total**|**100**|**83**|**PASS / F12 / H13**|

## 実画面の確認

- [PC title](review-artifacts/visual/desktop-title.png)は王様/縦坑の大きいpreviewと日本語panelが共存。[phone title](review-artifacts/visual/mobile-title.png)はpreviewを縮め、タイトル/初回play/練習の読める操作を優先する。本番canvasをこのpreview寸法で採点しない。
- [phone練習の空中移動](review-artifacts/visual/mobile-practice-steering.png)は同じpixel hero/shaftと実steeringを表示、3つのnative controlsと日本語stepを読む。Canvas内の練習bitmapは小さいので、重要な操作指示はDOM prompt/feedbackで補う。危険ghostは本人の本番終了へ保存しない実flowを完了した。
- [PC actual fall frame1](review-artifacts/visual/desktop-fall-frame1.png)→[frame2](review-artifacts/visual/desktop-fall-frame2.png)は普通のDROP後の連続観測。FALL0.6→1.4m、feet/camera/platform相対位置が変わり、先のplatformは見え続ける。整数draw/nearestでblurやfilter絵の縁は見られない。
- [phone fresh main](review-artifacts/visual/mobile-main.png)はcanvas358×626.5CSSpx、native256×448、smoothing false/image-rendering pixelated。PCは426.84×747CSSpxで900px高の83%をcanvasが占める。Native pixelの整数gridを保持しつつ、CSS倍率は非整数のため端末によって表示pixel幅1〜2pxの差はあり得る。
- [phone HARD/NICE](review-artifacts/visual/mobile-hard-nice.png)は実8.6m survived landing後、kneeling王様とNICE DROP!、日本語の強い着地を表示。FALLが着地で0に戻るので、取得瞬間のmeter0を8.6m未到達の証拠とは扱わない。源snapshotがhard/nice/count1を保持する。
- [PC自然結果](review-artifacts/visual/desktop-natural-result.png)は48m/落下15.6m/9.1秒、[phone自然結果](review-artifacts/visual/mobile-natural-result.png)は47m/落下14.7m/9.5秒。両方NICE1、SPLAT!と日本語の衝撃理由が読み、retryを実操作できた。データは注入していない。Result時の残ったsprite poseはdeath cycleの取得瞬間で、静止画だけで全death sequenceを代表させない。
- PC/phone LEFT/DROP/RIGHTは実46CSSpx高さ、下辺PC877/900・phone786.5/844で操作が収まる。PCdocument scrollHeight901は900より1px多い観測で、primary clippingはなし。全サイズ/最長結果/実機viewportはQA担当が別に確認する。

## 4世界・足場と下方視界

0〜250mはレンガと小窓、300mは工事のbeam/pipe、500/600mは岩と地層、1000mは輪郭の違うglyph/結晶/構造。すべて左右48pxを材料に使い中央160pxを静かなvoidにする。深部の明るい上面/亀裂/soft縫い目/gold moving beamが壁decorと区別でき、次2〜3段の着地候補をheroより下に読める。少色/繰返しはretro意図として成立するが、全部の背景が同じindigo基調なのでC7に留める。

Soft platformの実見た目は100/300/600画像、crumbleは500/1000画像、movingは600/1000画像から確認。今レビューでsoftへ着地して例外の物理を検証したとは言わない。Crumbledの残りframeやmoving実速度、全生成routeの公平性は独立Feel/QAが所有する。1000mの通知は最下部の短いmessageで次targetを隠す大きいmodalにしない。

## 背景の初回findingと限定修正

[初回実screen](review-artifacts/initial-header-focus.png)ではbrickが全columnを16pxごとに埋め、heroと足場より背景模様が目立った。採点前にArt Directorが背景のみの修正をRoot/Artistへ提案し、Root承認で詳細壁を左右48pxへ制限、中央160pxをpalette1のsolid voidに変更した。hero/platform/HUD/palette/physicsは変えない。**これは実pictureから生じた美術finding**であり、単なるsource style好みではない。

今回の実main/deep画像でquiet centerの改善を再確認した。最終正式採点はこの修正後の1回目で83。初回をPASSへ書き換えず、header focus修正という別の技術findingとも混同しない。これ以上のart修正を合格条件として要求するblockerはない。

## Portal015 / Thumbnail

[phone card015](review-artifacts/visual/mobile-portal-card015.png)/[PC portal015](review-artifacts/visual/desktop-portal015.png)を実view。640×360 WebPが実loadし、落下中の王様、上下の足場、縦に長いspaceと同じpixel artで、『落下キング / FALL KING / 上を目指すな。うまく落ちろ。/PLAY』を表示。両端末でnative戻る→015card→gameを実行した。Thumbnailは1396Bのactual falling canvas由来で、pictureを豪華に描き足していない。

長いportraitを正直に収めるためhero/crownはcardサイズで小さくなる。降下する構図は伝わるがcharacter detailの訴求は弱い制約。架空hero拡大・4biome合成・filtered illustrationへ置き換える理由にはしない。Full catalog全15ゲームのクリック/表示をこの限定レビューで再検証したとは言わない。

## 結論と範囲

**初回candidateのindependent Visual gateはPASS83、F12/H13**。現行は次のHUD再確認後PASS84/F13/H13。Blockerなし、全browser閉鎖済み。美術のidentity/grid/palette/着地の視認/actual thumbはplaytest候補として成立する。Source表の62grids/22hero framesをactualplayの証拠へ読み替えず、Feelの深部実到達を自分のnative到達へ数えない。

Phone FALL/BESTやpractice bitmapの小さい文字、同系色biome、少ないanimation frame、thumbの小さい王様は数値へ反映した非blocking限界。PC・phone縦2サイズだけのVisual判定で、8viewport/touch全edgeケース/保存/performance/production/サブパスはRoot/QAの別gate。人間のDROP満足/慣性の覚えやすさ/安全判断/BEST・1000mへの興味、実機FPS/音質/公開判断は[HUMAN_PLAYTEST](HUMAN_PLAYTEST.md)に未実施として残す。

## 限定HUD再確認 — 現行PASS84/F13/H13

対象aggregate SHA256 `f91e2a4137a2ad0057d020ba4f4ad3e148c6dbfcf294d28220560212a280e411`。Root/UIによる表示限定修正は、本番DEPTH/FALL数値2×、BEST1×を右上、状態文字1×と下部meter、練習PRACTICE2×/FALL数値4×。Model/control/hero/platformの位置は変更なし。Inline pixelking faviconも加わった。背景quiet-center修正とは別の、初回F12の具体的な小文字findingへの対応である。

[recheck-hud.mjs](review-artifacts/recheck-hud.mjs)/[HUD_RECHECK journal](review-artifacts/hud-recheck/HUD_RECHECK.json)が原本。Fresh320×568 touch contextで普通のDROP/RIGHT操作による4step練習を完了し、本番DROP後を撮影。同じ本番を844×390へresizeして再びDROPした。Player/score/clock/storageの注入、強制終了、深部到達の再実行はしていない。全画像を実viewし、最終的に全browser/context閉鎖、errors`[]`でRootへQA slotを返した。

- [320練習step1](review-artifacts/hud-recheck/320-practice-step1.png)/[実steering](review-artifacts/hud-recheck/320-practice-steering.png)/[安全落下](review-artifacts/hud-recheck/320-practice-safe-fall.png)/[ghost開始](review-artifacts/hud-recheck/320-practice-ghost.png)：狭いpreviewでもFALL数値0.0/1.5/2.4Mを読め、PRACTICEと独立した行に置かれる。Step/日本語/3操作ボタンも収まる。HUD下端70native、初期hero頭76nativeの間を保持し、冠を隠さない。Ghostの最大11.9Mはjournal内の自然完了値であり、この開始静止画で最大値の表示を確認したとは扱わない。
- [320本番fresh](review-artifacts/hud-recheck/320-live-main.png)/[実fall](review-artifacts/hud-recheck/320-live-fall.png)：FALL0.0→1.5MとDEPTHが従来より大きく、BEST/SAFEは補助文字のまま。HUD下端58native、hero頭88nativeで落下・次足場を妨げない。Canvas221.14×387CSSpx、操作3個はいずれも高さ46px/下端547<568。Document高さ569はviewportより1px長い観測を保存し、全viewportのoverflow QA合格をこの限定確認から推定しない。
- [844横本番](review-artifacts/hud-recheck/844-live-landscape.png)/[実fall](review-artifacts/hud-recheck/844-live-landscape-fall.png)：縦坑/数値/操作/右説明が分離し、HUDにkingや足場が被らない。縮小するBEST/状態文字と小さいportrait画面は引き続き非blocking限界。

現行scoreは **A14/B13/C7/D8/E9/F13/G7/H13 = 84**。重要なFALL数値の実読取改善でFのみ+1とし、source上の倍率変更だけで加点しない。初回表83/F12、実落下/HARD/自然結果/earned4biome、motionの制約はそのまま有効。Artの追加生成や全面再設計のiterationには数えず、当該HUD表示の再確認として区別する。

現行[actual thumbnail](../../public/assets/portal/game015.webp)もローカル実viewした。[thumbnail index](../../assets/portal/thumbnails/asset-index.json)の実256×448落下画像から座標`[0,64,256,424]`でHUDを除いた256×360領域を無拡縮・左右paddingで640×360へ置く1406B lossless WebP。王様/足場/縦坑は元の実pixelで、古いHUD文字や架空美術を含めない。この再確認でPortalを再launchしたとは記載しない。

**現行Visual PASS84/F13/H13、blockerなし。** 最終5サイズQA、production、実機FPS、人間の楽しさ/理解/公開判断は各担当の別gateで、このHUD確認から合格へ更新しない。
