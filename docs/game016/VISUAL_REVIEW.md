# Game016 — Independent Visual Review

2026-10-05。**PASS86/100 · F可読性13/15 · H完成感13/15。Blockerなし。** 初回実画像でTV内のsecondary button文字が背景に埋もれるfindingを出し、限定文字色修正後の実PC/phone画像で解消を確認した。素材承認、独立Feel、QAとは別のVisual評価で、人間の楽しさ/実機性能/公開合格を意味しない。Visual用browserは一度も開かず、QAのexclusive slotを使用していない。

## 対象と方法

[VISUAL_BRIEF](VISUAL_BRIEF.md)と[IMPLEMENTATION_SPEC](IMPLEMENTATION_SPEC.md)全文を基準に、Rootと独立Feel担当が通常入力で取得した実PC1440×900 / touch-emulated phone390×844の画像を、Art Directorが`view_image`で独立に確認した。今回はVisual用browserを開かず、Rootの許可slotを直ちにQAへ返した。保存画像の所有者と実行者を区別し、自分が35問を入力したとは記載しない。

初回sourceは280runtime/public files、SHA256 `9033e6f8703153a37dc8c0987f71c7d58f925726b8d43770ba9a4717d54cee27`。独立Feelの普通のkeyboard/mouse/native touch、read-only answer oracleで両端末とも30問5000点→35問7500点を自然に獲得、phase/time/scoreの強制書換えなし。各title/説明/練習/成功/phase1/phase2/文章READ/ANSWER/10・20・30transition/REFLEX/正解feedback/勝つ・あいこ・timeoutの3結果を実viewした。初回画像/recordは[before-menu-contrast history](review-history/before-menu-contrast/desktop-RECORD.json)と[phone history](review-history/before-menu-contrast/mobile-RECORD.json)を保持する。操作/時計/点の検証は[GAME_FEEL_REVIEW](GAME_FEEL_REVIEW.md)とQAが所有する。

現行sourceは280files、SHA256 `6d4a80a454a809537673cd01bf71e8c28f12763b6e5259048c44a547bf9b385a`。Rootが初回との差分をUI文字色1fileだけに限定した後、独立Feelは同じ35正解を両端末で再取得。[final PC record](review-artifacts/desktop-RECORD.json)/[final phone record](review-artifacts/mobile-RECORD.json)は現行hash、35/7500、errors`[]`を保持する。Art Directorはfinalの両title/説明/練習完了/earned結果、文章READの有効buttonを再viewし、さらに両phase1/phase2/文章ANSWER/30transition/REFLEXも確認した。Reviewer全context閉鎖後の画像のみ使用し、深部の自動到達を自分の入力や人間のskill評価として数えない。

## 数値評価 — 正式採点1回目

合計80以上、F/H各12以上を満たす。下表は文字色修正の実確認後の現行candidate。初回blank button findingを元からPASSだったことにしない。

|項目|配点|点|実観測と上限|
|---|---:|---:|---|
|A Identity|15|14|物理TV/番組rule帯/敗北を肯定するcaptionが統一。015 pixelや汎用cardの色替えと区別できる|
|B Objects / Assets|15|14|拳/V/5本指が大小両方で明快。3枚のink/肌/navy袖が揃う。拳のhandednessだけ小さな連続性制約|
|C Background / Palette|10|8|cream/coral/navy/teal/mustardが対戦cueを引き立てる。静かな画面は判断に適切だが筐体/sceneの材質表現は単純|
|D UI|10|8|相手/あなた、固定3位置、READ→ANSWER/transition/結果の役割が明確。Menu文字色を実修正済み。phone長いheading/portalの一部改行は粗さとして残る|
|E Composition|10|9|PC大きいTV、phoneもrule/cue/bar/3padが同時に収まる。中央の余白が手を孤立させる。Thumbの補助文字は小さい|
|F Readability|15|13|3silhouetteと大きいhiragana、太いtimebar、固定同色pad、修正後navy buttonが読める。phone文章/キー/小さいphase labelは余裕が限られる|
|G Animation / Feedback|10|7|負け！/LOSEの肯定と3失敗の区別、次形式へのtransitionが分かる。動作は軽いUIfeedback中心、Visual自身のリアルタイム音/animation評価は未実施|
|H Production|15|13|統一実生成3hands/軽量WebP/codeTV/UI/actual thumbnailを統合。仮emoji/絵一枚の架空gameplayなし。軽微な文字改行/材質/pose continuityが上限|
|**Total**|**100**|**86**|**PASS · F13/H13**|

## 実画面で確認した構成

- **TV番組のidentity**：cream余白、coral筐体、navy輪郭、tealの画面、mustardの大きなルール帯、二つのdial/speakerが一貫する。015のpixel降下/004のlab/011の二択と異なる、広い画面＋固定3回答の番組stage。装飾scanlineは手や文章に掛けない。
- **相手と回答**：上の「相手・問題n」と下の「あなた：負ける手を選ぶ」で役割が分かれ、左グー/中央チョキ/右パーがpracticeからREFLEXまで一致。3padは同じ色/輪郭/サイズ。Skin/背景色による答え誘導がない。
- **IMAGE**：[PC phase1](review-history/before-menu-contrast/desktop-phase1.png)/[phone phase1](review-history/before-menu-contrast/mobile-phase1.png)。拳/V/5本指がquiet teal上で区別でき、下の小さい手にも同じposeを使う。相手を枠装飾の一部へ縮めず、timebarと回答を同時に読める。
- **HIRAGANA**：[PC phase2](review-history/before-menu-contrast/desktop-phase2.png)/[phone phase2](review-history/before-menu-contrast/mobile-phase2.png)。相手が大きい「ちょき」、3padが「ぐー／ちょき／ぱー」へ変わり、画像を薄く残す答え手掛かりがない。境界と位置は同じ。
- **SENTENCE**：[phone READ](review-history/before-menu-contrast/mobile-phase3-read.png)→[ANSWER](review-history/before-menu-contrast/mobile-phase3-answer.png)。文章が相手の手の代わりになり、「読む時間は無制限」と「読めたら進む」から「あなたの番」へ変わる。READのpadは全て同じdisabled色、timebarは減らず、回答時に2.0秒表示。小さいsentence/補助字は後述の限界に残す。
- **REFLEXとpositive failure**：[PC REFLEX](review-history/before-menu-contrast/desktop-reflex.png)/[phone REFLEX](review-history/before-menu-contrast/mobile-reflex.png)で画像へ戻り、位置不変。0.8秒表示/barが読める。[正解feedback](review-history/before-menu-contrast/mobile-positive-feedback.png)はgoldの「負け！」/LOSE!+100を肯定的に示す。短いfeedbackから次問へ進む順序はnative recordの根拠で、静止画だけからSEの心地よさや0.8秒の体感を断定しない。
- **結果**：両端末の勝つ/あいこ/時間切れを実view。7500/35/REFLEX STREAK5のearned結果と0回の結果を区別し、原因の日本語、相手/自分/必要な手を文字で示す。称号/「普通に勝とうとしてませんか？」は理由の下で、正誤説明を隠さない。Phoneの「ゲームセンター」末尾が次行へ回るが意味/クリック領域は残る。

Rootの[PC gameplay metadata](actual-captures/1440x900-gameplay.json)/[phone metadata](actual-captures/390x844-gameplay.json)ではpadはPC各328×100、phone各約117.3×114CSSpx。画像でも3列を維持し、狭い一つだけに押し込む状態はない。これらのRoot captureはpractice-complete/creditsを事前保存した起動fixtureであり、初回練習を完了した証拠には使わない。独立Feelの初回native練習画像と別に扱う。

## 初回findingと限定修正

[PC初回title](review-history/before-menu-contrast/desktop-title.png)/[phone初回title](review-history/before-menu-contrast/mobile-title.png)は、cream secondary『練習する』が無文字の四角に見えた。説明/練習完了/結果の『タイトル』にも同じfindingがある。原本recordにラベルが存在していても、実画面の見えない操作は可読性合格にはしない。Gold primaryのcream文字も低contrastだった。

Art DirectorがRoot/UIへ画像根拠とnavy text案を送り、Root承認でUIが **`.show-card button{color:#243349}`だけ**を追加した。Hand/順序/境界/font/model/timer/scoreは変えない。元findingを消さず、追加生成/別artstyleのiterationとは区別する。修正後の[PC title](review-artifacts/desktop-title.png)/[phone title](review-artifacts/mobile-title.png)、[PC説明](review-artifacts/desktop-explanation.png)/[phone説明](review-artifacts/mobile-explanation.png)、[PC練習完了](review-artifacts/desktop-practice-complete.png)/[phone練習完了](review-artifacts/mobile-practice-complete.png)、[PC earned結果](review-artifacts/desktop-accidental-win-result.png)/[phone earned結果](review-artifacts/mobile-accidental-win-result.png)、[phone READ](review-artifacts/mobile-phase3-read.png)を実view。『練習する』『タイトル』『もう一回』『読めたら進む』がnavyで明瞭となり、findingをCLOSEDとした。正式数値採点はこの実確認後の1回目で86、追加art生成は0回。

## 素材・実thumbnail

生成素材は[IMAGEGEN_LOG](IMAGEGEN_LOG.md)/[asset index](../../assets/game016/asset-index.json)の実ImageGen1回由来3hands、各256²RGBA・合計29,614B。原本、全3optimized、実48px color/gray比較を別途viewし採用済み。拳だけ反対handに見える親指側の連続性を小さな制約として保持し、handednessを正解条件にしない。全指/cuffを含み、腕/手に明暗haloの大きな問題はない。TV/UIはcode、emoji/filtered pixel/image一枚gameplay代替ではない。

現行[Portal016 WebP](../../public/assets/portal/game016.webp)を実view。[thumbnail index](../../assets/portal/thumbnails/asset-index.json)が、Root実PC gameplay1440×900からmainの`[200,70,1240,888]`を比率維持458×360へ縮小、cream paddingで640×360、12,804Bと記録する。相手パー/下の固定3pad/ルール帯/TVが同じ実画面で、別hero拡大やphase合成をしない。縮小後の補助文字は小さいが、TV/大きい手/3択は判別できる。Visual担当がPortal全16cardをbrowserで再クリックしたとは記載しない。

## 限界

今回の実Visual画像は1440×900 /390×844で、320px/short landscape/全viewport最長文章を自分でnative確認していない。字体/文章/disabled状態の確認と、input guard/timer境界/credit/storage/route regressionの合格は分ける。Animationはnative before/feedback/next/transition画像とrecordを根拠に順序を判断し、Visual自身のリアルタイム再生/音視聴/高FPS計測は行っていない。

同じ静かなTV background、軽い短いfeedback、固定3poseの手素材、小さいphone補助文字/文章、結果portal labelの改行は非blockingの品質上限として記録する。人間の認知的混乱/0.8秒の難度/笑い/再挑戦、実機thumb comfort/FPS/音質、公開可否は[HUMAN_PLAYTEST](HUMAN_PLAYTEST.md)とRootの別工程。自動oracle35正解を人間の面白さや到達率に読み替えない。

**現行independent Visual gateはPASS86/F13/H13。** 手/固定配置/各representation/読む・答える状態/結果理由/true thumbnailが成立し、contrast findingは実画像で閉鎖した。Runtime/素材の変更は行わず、Visual担当のbrowserは0context。最終全サイズQA/production/公開と人間playtestをこの数値から自動合格にしない。
