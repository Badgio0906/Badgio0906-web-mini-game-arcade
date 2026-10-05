# Game018 — Independent Visual Review

2026-10-05。**PASS 85/100、F可読性13/15、H完成感13/15。未解決のVisual blockerなし。** 実装者とは別のVisual reviewerが実画像を確認した。人間の楽しさ、実機操作、音、公開可否の合格ではない。

## 対象と方法

[IMPLEMENTATION_SPEC](IMPLEMENTATION_SPEC.md)、[VISUAL_BRIEF](VISUAL_BRIEF.md)、[開発規則](../GAME_DEVELOPMENT_RULES.md)、[既存A–H rubric](../ten-game/reviews/REVIEW_PROTOCOL.md)を基準に、Root／QAが通常入力で取得した画像を`view_image`で確認した。Reviewer自身のbrowser起動は0回、runtime／public編集・API呼出も0回。CSS・素材の存在・Jev判断から点を生成していない。

初期sourceは[SOURCE_FREEZE_INITIAL](SOURCE_FREEZE_INITIAL.json)、300 files、SHA256 `efeac0ff0da165d659edebb74a2de72952162e5e9aea68b00cb392738ecdbbd8`。初回85点の対象は301 files、SHA256 `3a1603705e78bb6ccc5c7e6a227faded2ab170a729756653503e611dec04d397`で、当時はSKY実イベント画像を未確認だった。後続FeelでC2 findingが発見されたため、この85点を全SKY品質の合格へ読み替えない。修正後の現行[SOURCE_FREEZE](SOURCE_FREEZE.json)は301 runtime/public files、SHA256 `4e491ba21ec7f5b3bcfc86c1b5656e186d7dffc1f22fc94903afc1d19f27bfbd`。以下の補足実画像確認を含め、最終評価を85/F13/H13とした。前のhashは歴史として保持する。

前回の`3a160370…`版では、Rootがstable-native4 profileの検証後、`ShoeBoard`へ発射直後0.9秒未満の出発点に少年を残す描画を追加し、実thumbnailを登録したと報告した。その段階のMain／modelは変更なし。この短いdeparture描画をReviewerが動画や新画像で確認したものではない。今回のC2修正・追加画像からdeparture演出まで合格したことにせず、得点を上げる根拠にしない。

- [initial-native](QA/initial-native/report.json)のPC title／narrow selection／landscape selectionを実viewし、初回の文字重なりと操作の欠落を確認。
- [retest-native](QA/retest-native/report.json)のPC／phone title・練習ANGLE／SPIN／POWER・selection、PC説明・練習完了、narrow／landscapeの対応画面を確認。
- [final-native](QA/final-native/)のPC／phoneの本番ANGLE・MAX／KICK・flight start／middle・result・pause等を確認。途中でcollectorが中断した記録を[FINAL_NATIVE_INTERRUPTION](QA/FINAL_NATIVE_INTERRUPTION.json)に保持しており、画像の存在を一括QA PASSとは解釈しない。
- [stable-native](QA/stable-native/report.json)でPC result、phone ANGLE、narrow title／selection／ANGLE／SPIN／POWER／KICK／flight middle／result、landscape selection／ANGLE／POWER／resultを再view。限定修正の再確認用。
- 後続Feelの[初回SKY finding](GAME_FEEL_REVIEW.md)に対応する旧PC／phone PAPERのplane／UFO画像4枚と、現行[feel-retest](review-artifacts/feel-retest/report.json)の`*hold*.png`10枚を実view。PC／phone各PAPERのplane・UFO・satellite、IRON GETAのplane・UFO。[再検証freeze](review-artifacts/feel-retest/SOURCE_FREEZE.json)とreportのbefore／afterは現行`4e491ba2…`で一致する。
- [Portal WebP](../../public/assets/portal/game018.webp)と[実画面原本](../../assets/portal/thumbnails/game018-actual-source.png)、[capture記録](QA/THUMBNAIL_CAPTURE.json)を確認。

Readonly診断を使ったタイミング自動入力は、人間の認知・反射・難度・楽しさの証拠ではない。自分が全靴／全ルートを実プレイしたとは記載しない。

## 数値評価

|項目|配点|点|実画像での根拠と上限|
|---|---:|---:|---|
|A Visual identity|15|14|少年の大きな片足ポーズ→靴アップ→POWER→靴だけの空中追跡が題材と操作を示す。暖かい公園・coral／turquoiseの靴が雨のルート描画やTV三択と異なる|
|B Character/object appeal|15|14|大きい帽子、表情、腕・曲げた脚、厚い輪郭がPC／phoneで読める。紙の折り目、草履のY鼻緒、sneakerの紐、革靴の踵、鉄下駄の歯がselectionで区別できる|
|C Background quality|10|8|turquoise空・淡い街・砂色の地面が前景を引き立てる。追加画像で青い上空→indigoの星空・曲がった地球を確認。反復する建物、広い単色空、単純な背景形状が品質上限|
|D UI integration|10|8|cream／navy／goldで統一。各phaseの一つの操作、選択中の靴、記録、結果の分解とRetryが明確。小さいsecondary text、PC結果のbutton改行が上限|
|E Composition|10|8|PCの大きい少年／靴、phoneの縦領域、SPINの明確な寄りが成立。小画面selection／resultはartを省いて操作を優先。Short landscapeの左右余白、狭いPOWERと顔の重なりは残る|
|F Gameplay readability|15|13|ANGLEの脚・弧・発射方向矢印、SPINの大きい靴と回転矢印、POWER右端MAXが読める。飛行靴のivory keylineは背景から浮き、C2再確認ではcaptionと靴／実イベント物体が分離。320pxの補助文やkick bubble右端の余裕は上限|
|G Motion/effects|10|7|実画像でzoom、MAXの星／wash、flightの速度線、comic impact、ポスッ着地、追加plane／UFO／satelliteの演出状態を区別できる。リアルタイム再生／SE／550ms holdの体感を自分では確認せず、全特殊演出を網羅していない|
|H Production value|15|13|統一された少年／5靴／足元zoom／実飛行／結果と正直なthumbnailを統合。初回clip・文字重なりの改修を実画像で確認。背景の簡素さ、狭い画面の補助要素が上限|
|**Total**|**100**|**85**|**gate80以上、F/H各12以上を満たす**|

## 実画面の観測

**タイトル／説明／靴。** 修正後の[PC title](QA/retest-native/desktop-title.png)と[phone title](QA/retest-native/phone-title.png)では少年の顔へ大きなtitle文字を重ねず、headerとcream cardへタイトルを置く。簡単な「角度、回転、パワー。3回止めたら、とんでもない旅へ。」と主要操作が読める。[PC selection](QA/retest-native/desktop-selection.png)は5つの靴のsilhouetteと短いキャッチコピーを縦に並べ、phoneは2列と全幅の鉄下駄。選択中のgold背景と濃いoutlineは色だけに依存しない。実飛行中に全5靴の識別を確認した評価ではない。

**ANGLE。** [PC ANGLE](QA/final-native/desktop-angle.png)は固定した腰・接地脚と、持ち上げた脚・靴・dotted arc・coral発射方向矢印を同時に見せる。発射方向は矢印で補足され、靴が後ろへある瞬間を「後ろへ飛ばす」と誤読しにくい。最終[narrow ANGLE](QA/stable-native/narrow-practice-angle.png)は靴の踵がCanvas内に残る。脚の連続運動が気持ちよいか、不気味に見えないかは静止画だけで合格にしない。

**SPIN／POWER。** [phone SPIN](QA/retest-native/phone-practice-spin.png)と[stable narrow SPIN](QA/stable-native/narrow-practice-spin.png)は足元へ大きく寄り、紐・sole・回転矢印と「足首をひねって、SPIN」を見せる。上で脚がcutされるのはclose-upとして自然で、靴だけが突然別sceneへ飛んだようには見えない。POWERは広いbar、needle、右端のcoral MAX、下の一つの操作。狭い画面ではbarが少年の顔へ重なるが、主役がmeterへ移ったことは分かる。MAXの猶予・人間の狙いやすさはFeel／QAの別項目。

**MAX／KICK／flight。** [PC MAX](QA/final-native/desktop-kick-or-max.png)と[phone MAX](QA/final-native/phone-kick-or-max.png)で星、少年の目の輝き、wash、大きいJUST MAX!!が見える。[stable narrow KICK](QA/stable-native/narrow-kick-or-max.png)は普通のPOWERのkickで、MAX成功の画像と混同しない。飛行では少年が消え、靴が主役となる。[phone flight middle](QA/final-native/phone-flight-middle.png)のsneakerはcoral／turquoise／ivoryの輪郭を保ち、空に埋もれない。速度線・背景移動後の空の変化は静止画で確認したが、追尾の滑らかさや全極端弾道の見失いを自分が動画確認したものではない。

**着地／結果。** [stable PC result](QA/stable-native/desktop-result.png)はcomic truck impactと地面の靴、ポスッ、右側の距離・最高高度・break/combo・spin/power・bonus subtotal・TOTAL・BESTが読める。[phone result](QA/final-native/phone-result.png)は縦に収まり、[stable narrow result](QA/stable-native/narrow-result.png)と[landscape result](QA/stable-native/landscape-result.png)ではsceneを隠して結果cardを優先する。靴変更とPortalへ戻る操作も欠けない。各数値の計算の正しさはモデル／QAが所有する。

## Findingと再確認

1. **V01：Canvas titleが少年を横切る。** [初回PC title](QA/initial-native/desktop-title.png)と[初回landscape selection](QA/initial-native/landscape-selection.png)を実viewした。Rootがduplicate Canvas titleを除去し、retestの同画面で少年と文字が分離した。CLOSED。
2. **V02：narrow／landscape selectionの開始操作が画面下へ欠ける。** [初回narrow selection](QA/initial-native/narrow-selection.png)、[初回landscape selection](QA/initial-native/landscape-selection.png)で確認。Retestで操作は現れたがnarrowではcream card下辺からbuttonがはみ出したためRootへ追加観測を通知。最終[stable narrow selection](QA/stable-native/narrow-selection.png)／[landscape selection](QA/stable-native/landscape-selection.png)で5靴・短文・開始／タイトルがcard内に収まることを確認。CLOSED。
3. **V03：narrow ANGLEの上げた靴の踵がCanvas左へ欠ける。** [retest narrow ANGLE](QA/retest-native/narrow-practice-angle.png)で観測をRootへ通知。最終[stable画像](QA/stable-native/narrow-practice-angle.png)で主人公／arcが内側へ寄り、靴全体が見える。CLOSED。
4. **V04：short landscape練習の下の補助文が切れる。** Retest ANGLE／POWERでは最後の日本語がviewport下へかかった。Rootへ通知し、最終[stable ANGLE](QA/stable-native/landscape-practice-angle.png)／[POWER](QA/stable-native/landscape-practice-power.png)で全文が読める。CLOSED。
5. **V05：着地結果の補助文がJUST MAXのまま。** [元PC result](QA/final-native/desktop-result.png)は結果cardが正しい一方、下の補助文は初速の説明を残す。Rootへ通知し、[stable PC result](QA/stable-native/desktop-result.png)で「着地！ 次は別の角度・回転・靴で飛ばそう。」へ変わることを確認。CLOSED。
6. **C2／V06：SKY captionが追尾靴を覆い、plane／UFO実物が画面外へ流れる。** 初回85点では未評価だったSKYを、後続独立Feelが実プレイして発見。Reviewerも旧[PC plane](review-artifacts/feel/desktop-paper-sky-just-event-AIRPLANE-BREAK.png)／[UFO](review-artifacts/feel/desktop-paper-sky-just-event-UFO-INCIDENT.png)、旧[phone plane](review-artifacts/feel/phone-paper-sky-just-event-AIRPLANE-BREAK.png)／[UFO](review-artifacts/feel/phone-paper-sky-just-event-UFO-INCIDENT.png)を実viewし、薄い靴が大きいcaptionに隠れ、実物が欠けることを確認した。[当時の観測](QA/C2_STATE.json)を残す。Rootのcaption小型化／靴と反対側への配置／実イベント座標550ms hold後、現行10枚で靴のoutlineと実物が同じ画面に見え、captionに覆われないことを確認。画像scopeでCLOSED。初回findingを元から合格だったことにせず、物理の到達と実演出の判読を分ける。

## C2補足実画像で確認した範囲

[PC PAPER plane](review-artifacts/feel-retest/desktop-paper-sky-just-hold-AIRPLANE-BREAK.png)と[phone PAPER plane](review-artifacts/feel-retest/phone-paper-sky-just-hold-AIRPLANE-BREAK.png)はcream胴体・coral翼のコミカルな飛行機、前景の紙靴、離れたcaptionを同時に見せる。[PC IRON plane](review-artifacts/feel-retest/desktop-iron-sky-just-hold-AIRPLANE-BREAK.png)と[phone IRON plane](review-artifacts/feel-retest/phone-iron-sky-just-hold-AIRPLANE-BREAK.png)は黄色い鼻緒／2本の歯を持つ鉄下駄が見える。靴が実物の中央の一部を覆うが、翼と機体の全体形をcaptionが隠さない。

[PC PAPER UFO](review-artifacts/feel-retest/desktop-paper-sky-just-hold-UFO-INCIDENT.png)／[phone PAPER UFO](review-artifacts/feel-retest/phone-paper-sky-just-hold-UFO-INCIDENT.png)、[PC IRON UFO](review-artifacts/feel-retest/desktop-iron-sky-just-hold-UFO-INCIDENT.png)／[phone IRON UFO](review-artifacts/feel-retest/phone-iron-sky-just-hold-UFO-INCIDENT.png)では円盤・green dome・黄色い小灯と`!?`が見える。captionは下、靴とUFOは中ほどで分離する。[PC satellite](review-artifacts/feel-retest/desktop-paper-sky-just-hold-ORBITAL-SHOE.png)／[phone satellite](review-artifacts/feel-retest/phone-paper-sky-just-hold-ORBITAL-SHOE.png)はblueのsolar panel、紙靴、indigoの星空、曲がった地球の上縁を見せ、ただイベント名だけを出す画面ではない。

ここで確認したのは実hold中の画像における物体の存在・靴の判別・captionの分離・高高度背景。550msが気持ちよいか、実際の貫通の連続動作、音の同期、物理座標／飛距離／時間の正確さは画像だけで合格にせず、独立Feel／QAの記録を参照する。より広い画像scopeになったが、以前の未評価領域の問題を解消した補足であり、数値を自動加点せず最終85/F13/H13を維持する。

残る任意改善はnarrow POWERの顔との重なり、narrow KICK bubble右端の余裕、PC結果buttonの改行、小さいsecondary text、単純な背景。主操作を隠す未解決問題とは扱わず、得点の上限へ反映した。Reviewerは修正そのものを実施していない。

## 実Portal thumbnailと限界

[原本](../../assets/portal/thumbnails/game018-actual-source.png)は1440×900で、native初回練習後の革靴・低角度・高SPIN・JUST MAXの実GROUND flight。HIGHWAY STARのcaption、keyline付き革靴、speed streak、comic impactが同時に見える。少年はカメラを離れた後で、別phaseから少年を合成していない。C2改修後に更新した640×360／11,022 bytesの[WebP](../../public/assets/portal/game018.webp)と更新原本を再viewし、よりcompactなcaption、靴と衝突star・HIGHWAY STARを確認。以前の12,440 bytes版は初回確認の歴史で、現行assetのサイズではない。Header／補助文字は小さい。台帳は[asset index](../../assets/portal/thumbnails/asset-index.json)、入力と実stateは[capture記録](QA/THUMBNAIL_CAPTURE.json)。架空の豪華なゲーム画面ではない。

Visual reviewerはbrowserや動画再生を使わず、音を聴かず、実機／FPSを測っていない。追加画像でplane／UFO／orbitalと紙靴／鉄下駄のSKY中の判別を確認した。まだ未確認なのは全5靴の飛行中の網羅、全特殊combo、re-entry炎、鉄下駄専用の発射衝撃のリアルタイム演出。コードに存在するという理由でこれらを実view済みにしない。後続Feel／QAが追加の実画像を取得すれば補足評価できる。

人間の初見理解、脚の動きの自然さ、JUST MAXの難度、靴種差の体感、飛行の長さ、破壊の笑い、組合せ探索／Retry欲求、実機tap／音は[HUMAN_PLAYTEST](HUMAN_PLAYTEST.md)へ残す。85点から独立Feel・入力／物理QA・本番配信・人間の楽しさを自動合格にしない。
