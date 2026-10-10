# Game032 revision01 — 独立Visual / Feelレビュー

最終判定は **PASS — 85/100、F13/15、H13/15**。初回はPENDINGとして問題を報告し、修正後の固定candidate03を実画像と操作証拠で再確認した。以下の初回問題・失敗記録も保持する。

担当は実装・素材制作と別の `/root/revision01_visual`。基準commitは `e3d7338c8fa0f073e0e3ad7ba419375eed3ad0cd`。AGENTS、PROJECT_CONTEXT、CURRENT_STATUS、GAME_DEVELOPMENT_RULESとrevision01仕様をこのレビュー開始後に読んだ。読込時刻を実装開始時へ遡って記載しない。実view画像SHAと固定ソースSHAは [JSON](QA/INDEPENDENT_VISUAL.json)。

## 実画像で確認した点

少年6姿勢のanchor sheet、実写風水槽、1280×900 / 390×844 / 320×740 / 844×390の餌・ルアーの投げ先、アタリ、取り込み画面を確認した。帽子・体型・衣服は一貫し、青緑／生成りシャツ・砂色短パン・巻き毛・麦わら帽子は添付参考の赤Tシャツ／魚印／網／籠を再現していない。権利のゼロ保証はしない。

少年の足は川岸に固定され、投げ先変更で横歩きせず向きだけ変わる。手とコード描画の竿は確認したbite／land／idle姿勢で接続しており、靴や身体が魚の着水位置へ移動しない。既存背景bytesはasset-indexと元commitを照合する必要があるが、実画面の清流美術は維持されている。

写真調の水槽には実取り込み後の魚が入り、390／320でも1匹と2匹が見える。小画面の魚は細かい斑紋の判別には小さいが、魚が増えたことと水槽内の輪郭は識別できる。実写撮影素材とは扱わない。動画は未確認。QAの通常時計におけるcanvas hash変化、pause中不変、resume後変化は技術的な泳ぎの証拠で、人間の印象とは別。

## 未解決finding

1. `QA/independent-browser-01/landscape-aim-left-far.png`：scene-labelは約x24–268/y94–135、投げ先の川面帯は約y111–133となり、左の照準が不透明な説明カードで隠れる。previewは実canvas上にあってもユーザーに見えない。横長のみ説明を岸側へ移す等の限定修正と左右／近遠再撮影が必要。
2. `QA/independent-browser-01/pc-lure-bite.png`：ルアーを選び琥珀色ルアーが見えているのに「ウキが沈んだら、合わせよう」と表示する。方法別の本アタリ表現が必要。

両findingは修正前に親へ送った。Jev回答を原因の正解として使っていない。Jevログ／当該finding回答は読んでいない。その後読んだMODEL.md末尾の過去待機テスト注釈は、文言を再確認すると「Jev回答を見ない独立判断」と明記された別Codexの分類で、API回答原文ではなかった。最初の保守的な曝露メモをこの確認で訂正する。

## 操作感と確認範囲

餌は待つ、ルアーは1回ずつ引く、掛かったら巻く／緩めるという説明と画面のprimary buttonは分かれる。全位置に気配機会があるコード、固定足位置と照準／着水の共通projection、ルアー無操作で自動釣果なしはソース／独立QAの証拠で評価し、人間が楽しいと確認したとはしない。

独立QAの普通時計4viewケースは成功しているが、REPORT全体は別virtual-clock deadline fixtureで失敗した。212全項目合格とは転記しない。主要操作44px／viewport内の数値はあるが、clip祖先とcenter-hitの追加証拠、実キャスト／構え姿勢の再確認が残る。物理端末、作者本人、音の聴感、発熱、法的clearanceは未評価。

## Candidate02再確認

横長4照準のscene-labelは岸の右下へ移り、左照準の遮蔽は解消。全4画面のルアー本アタリが「ルアーに食いついた！いま合わせよう」に変更された実画像を確認した。水槽魚を最小28pxにした画像では320pxでも2匹の形・体色差が判別でき、ガラス内に収まる。これら3点は実viewで修正確認した。

ただしriver-panorama原画像を追加viewし、左手前のtargetがworld y.67付近の葉・草に置かれる新たな問題を確認。`QA/independent-browser-02/landscape-aim-left-near.png`の白丸は約x134/y129の草の上。元画像約x303/y660の植生と一致する。直近label修正とは別のprojection findingであり、親へ修正前に報告した。実際の水域へ範囲を狭める場合、横長cropのsyとwaterFar/waterNearの単調性を同時確認する必要がある。新finding解消までgateはPENDING。

`*-ready.png`はゲーム開始ready状態のファイル名で、少年の構えposeを撮影したものではない。`*-bait-cast-landed.png`は着水後waitingであり、空中cast poseの画像証拠に転用しない。

## 最終candidate03 — 独立QA04で再確認

[固定通常browser](QA/independent-browser-04/REPORT.json)は154/154成功、ソースSHA不変、実時計のPC／CDPタップによる4画面の左右・近遠4cornerと中央を確認した。今回reviewでそのcorner画像、PCと320pxの構え／空中cast、全4画面の魚入り水槽を実際に見た。少年は姿勢を変えても足元固定で、帽子・腕・竿の接続が保たれる。castとchargingは実際の該当phase画像であり、前回のready/waiting画像を使い回していない。

川面のglobalnearを.58へ、短横画面cropを上へ制約した後は、左手前white markerも浅い水の上にある。横長4cornerと中央すべてに白い照準が見え、scene-labelは岸の右下で投げ先を覆わない。背景ファイルのSHAは元版と同じ `f5a465ffe91acbc7c1c083d117f0cc7770e33139daa21fe3688c69b505c19d5d`。背景素材変更とviewport crop補正を区別する。

ルアーは「ルアーに食いついた！いま合わせよう」となり、浮き沈みを待つ説明との混同を解消。最小28pxの水槽魚は320pxでも2匹の輪郭・魚体の模様を見分けられ、水面／砂／フレームの外に出ていない。actual canvas hashは実時計で変化しPauseでは不変、Resumeでは変化する。静止画から滑らかな泳ぎや気持ちよさを保証せず、動画／人間鑑賞は未実施とする。

主要2方式button／actionは44px以上で、viewport・clip祖先・center-hitの独立証拠がある。[candidate02](QA/independent-browser-02/REPORT.json)158項目には明示virtualclockの5分完了／既存BEST保存／reload／retry／result下部Portal到達が含まれる。PC・320・844のresult画像も実viewした。candidate03は描画／照準の限定修正で、その保存やdeadline契約を変更していない。初回browser01のdeadline fixture失敗、browser03の厳密corner選択失敗は別の原本として残り、全試行が成功したとは記載しない。

最終サムネイル `public/assets/portal/game032.webp` を実viewし、少年・実川背景・写真調水槽2匹が実ゲームと一致することを確認した。

| 評価 | 点数 | 実画像・証拠に基づく判断 |
| --- | --- | --- |
| A. 固有性 |14/15|清流と独自麦わら少年、釣行内水槽という今回の視覚体験が明確。|
| B. 人物・物体 |13/15|少年6姿勢が一貫し竿が手に接続。魚体が透明水槽内で見える。|
| C. 背景 |9/10|既存の透明な清流・光・岩・草を維持。|
| D. UI統一 |8/10|cream／tealで方式・指示・操作が整合。portrait余白や長い説明文はまだ簡潔化余地。|
| E. 構図 |8/10|川面と隣の水槽が4画面で共存。320では川が細く、横長では少年が小さい制約あり。|
| F. 可読性 |13/15|修正した照準・アタリ・方式別指示と44px以上操作を確認。細い糸／白照準の明るい水上contrastは改善余地。|
| G. 動き・効果 |7/10|構え／投げ／合わせ／取り込みの実姿勢、通常時計の水槽変化を確認。少数poseで、動画frame pacingや人間の泳ぎ印象は未確認。|
| H. 仕上がり |13/15|本番／練習／釣果／既存BEST／水槽／thumbの試作presentationが整合。本人・実機・音の未確認を保持。|
| 合計 |85/100|80以上、F/H各12以上を満たす独立AI Visual gate。人間面白さ・公開許可の代行ではない。|

独立したFeel評価として、固定足元から水面を選び、餌は待ち、ルアーはクリックで引くという操作の役割差はコードと通常実操作で成立している。どこでも魚の機会を作るモデルと無駄な自動撤収の廃止は今回目的に一致。本人が静かな釣りを楽しいと感じたこと、実機のタップ精度、音を聞いた評価は未実施。

レビュアーはAPIを呼ばずJev回答ログも見ていない。4findingの独立判断を親へ先に送り、修正後画像を確認した。実装・素材・tests・commit・push・deployはこのレビュアーは行っていない。

通信境界：独立QAのJSpageerrorは0、POSTは0。Cloud環境でbackend／広告通信を意図的に停止しており、ERR_FAILED／ERR_ABORTED等がconsoleに出ることと、ゲームJavaScriptの新規エラーを区別する。「console全0」「本番API確認済み」とは評価しない。
