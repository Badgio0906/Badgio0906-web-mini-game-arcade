# 独立レビュー — 2026-10-05 統合改修

実装担当とは別の reviewer が、今回の [依頼原文](REQUEST.txt)、現行コード、実画面、通常入力による検証を照合する。公開成功・モデルの到達・自動操作・人間の面白さは別の判定とする。Jev API は利用していない。

**最終独立判定：確認した技術／Visual 範囲 PASS。** 015は実画像83/F13/H13、018は86/F13/H13、019は81/F12/H12。019の2回の横画面不具合は失敗原本を保持して限定修正・再検証で閉じた。正式配信とAdSense独立PRの公開確認は root が別に担当し、このレビューで未実施の公開を成功扱いしない。

## ソースレビューで指摘した差分

| 対象 | 指摘と影響 | 対応／再確認 |
|---|---|---|
| 019 練習の大ジャンプ | 説明は直進だが、高い足場は右側 x216..304。指示通りの操作で練習を完了できない。 | 説明を右方向へ修正。4profileの指示通りの実着地を確認。解消。 |
| 019 ヘッダーのキーボード操作 | ヘッダーの button / anchor に focus がある時も Space ジャンプ処理が走る。 | shortcut の button / anchor focus と修飾キーを除外。mute focus の Space でジャンプしないことを確認。解消。 |
| 018 SPIN の説明 | PC／390px／320px の実 capture で、パネル最下段の説明が枠に隠れていた。 | canvas 内の説明 baseline を上げ、4profileの新画像で全文を確認。解消。 |
| 018 計測 | BEST 更新、lock／kick の具体的イベントが未記録。 | 旧 BEST と比較する更新イベント、実際に確定した入力イベントを追加。4profileの実runに best_update／kick と1回の run_end を確認。練習はコード上の除外条件を照合。 |
| 015 リスク表示 | 通常床の9mと柔床の12mの違いに対し、メーターは常に9mで赤くなる。 | 説明・side panel・canvas に STONE 9M / SOFT 12M が追加され、実画像で確認。警告は通常床基準。解消。 |
| Analytics | 中断して restart した run が completedRunCount に含まれる。過去のquitが同sessionの後のpage_exitも消す。 | quit／restartを完了数から除外。近いnavigation quitだけdedupし、新run／practice等の間の活動を保持。実UI stateとopen training dialogからexit phaseを取る。限定単体結果はroot担当。最終コードを独立照合。 |
| 019 横画面のtouch | statusの透明boxが練習の方向buttonを遮る。 | controlsとstatusを別rowへ。初回失敗原本を保持。最終通常touch4lesson合格。 |
| 019 横画面のviewport | 最初のCSS修正でcanvasのintrinsic sizeがdocument988pxへ拡大し、390px内に蛙が見えない。 | canvasを絶対配置、2行の44pxcontrolsを96pxへ固定。strong viewport assertを追加し、最終4lesson／well／sky／resultが390pxに収まることを確認。 |
| 018 蹴りのcaption | impact poseでPCの靴や320pxの顔をbubbleが覆った。 | bubbleを上の空へ移し、実impact4captureで顔・裸足・蹴りが分離。320では飛び出す靴の一部が右端へ出るが、次のflightで追尾される。 |

## 最終019・018の固定実行

[script](../../tests/game019/review.mjs)、[初回記録](../game019/QA/independent-native/report.json)、[最初の再実行](../game019/QA/independent-retest/report.json)と[独立viewport FAIL](../game019/QA/independent-retest/VIEWPORT_REVIEW.json)、[最終記録](../game019/QA/independent-final/report.json)を分けて保存。019 PC／phone／320は32回の通常キー／touchジャンプで転落回復、100m海、200m宇宙へ到達。最終landscapeも32回で達成。4lessonの隔離、pause、header focus、BEST保存／reload、retry0を確認した。初回3profileの保存geometryも全playing／practiceがviewport内であることを後から照合した。

最終runは2026-10-05T14:46:20.579Z〜14:48:24.347Z。19／18／Telemetryの15sourceを固定し、SHA集合hash `0b86db1f28d5cbe63500e1b2dac776add269148adb92158774ba04bcf22a4be7` が前後一致。[計算法と一致記録](../game019/QA/independent-final/SOURCE_SUMMARY.json)／reportのsource一覧を参照。対象subsetのhashであり、repo全ファイルのhashと混同しない。browser／全contextを閉じてrootへ返却。

人間の反応・楽しさ、実機の親指操作、音、FPSは自動検証から合格扱いしない。019の [Feel](../game019/GAME_FEEL_REVIEW.md)／[Visual](../game019/VISUAL_REVIEW.md) に狭い練習の見やすさを残した。短い横画面ではtitle／result menuや説明をscrollする。主要プレイ操作と蛙はviewport内に置く。

## 015 改訂03の実画像確認

[固定 candidate 記録](../game015/revision-03/QA/candidate-source.sha256)に対する [native-final](../game015/revision-03/QA/native-final/) の desktop-deep-fall、phone-soft-catch、narrow-hold-practice、landscape-deep-fall を reviewer が実 view。撮影は gameplay worker の通常キー／touch 操作であり、reviewer 自身のブラウザ実行ではない。

A–H rubric は **A13 / B14 / C7 / D8 / E8 / F13 / G7 / H13、合計83/100**。F／Hとも12以上。冠・白ひげ・紫衣装・赤マントが暗い縦坑から浮き、中央／端のトゲ、幅や間隔の違う床、緑の SOFT CATCH、迫る赤い天井、ホールド状態と9m／12m境界を同時に読める。PCとphoneの主要操作は明瞭。320pxの練習canvas、short landscapeの補助HUDが小さいことと、反復背景を上限として残す。実機の滑らかさや楽しさは採点対象外。

コードでは普通／moving床の通過中に fallStartY を更新せず、柔床／crumbleへの実着地のみ距離をリセットする。つまりホールドが衝撃無効化にはならない。6種類の短／中の安全段と10m超の柔床 shortcut は、追走と「刻む／欲張る」の操作上の差を作る。全生成 seed の公平性や人間の判断難度を実画像だけで保証せず、モデル27＋練習9と4profileの gameplay worker 記録を別の根拠として参照する。

## 018 改訂の実画像・通常操作

最終4profileでANGLE→SPIN→POWER→実impact KICK→flight→resultを通常click／tapで実行。PC／phone／320／landscapeすべてPASS、44px／viewport／ancestor clipを既存018 geometry helperでも確認。全5靴／特殊routeの新たな網羅検証ではなく、今回はsneakerの距離routeと改訂したart／spin説明／kickcaptionを確認した。物理signの保持はsource・単体検証を別に参照する。

実viewは最終 desktop／320／landscape の impact、phone SPIN、先の修正版4profile SPIN、title／phone result。旧SPIN captionのclip、旧kick bubbleの顔／靴の重なりと新画像を比較した。最終desktopでは茶髪と大きな目、赤shirt、blue shorts、裸足の伸びた蹴りと独立した飛ぶ靴がclear。phoneの大きい左右回転アイコン、反時計／時計の文、足首アップ、実軌道preview、強さの意味を読める。320の補助字と動く靴の右端、横画面のletterboxを上限とする。

A–Hは **A14 / B14 / C8 / D8 / E8 / F13 / G8 / H13 =86/100**。F／H各12以上。実際にphaseProgress0.58〜0.8のkickを撮影し、MAX overlayをkick原本と混同しなかった。[最終desktop原本](../game019/QA/independent-final/shoe-desktop-actual-kick.png)をthumbnail担当へ渡した。人間が蹴りを気持ちよいと感じた判定ではない。

## 共通・タグ・データの照合範囲

19catalog entriesのID／routeを保ち、012／013は番号例の逆転を採用せず実タイトルへtagsを対応。安定tag ID／日本語label、内部全tagと主要card tag、future filter helperを確認した。全ゲーム3択の [78case記録](../start-choices/IMPLEMENTATION_REPORT.md)は共通workerの実行で、reviewer自身が19本を全部再プレイした記録ではない。019／018の初回skipはこのreviewでも実操作済み。

Telemetryはdevice内の400eventに限定され、missing値はunknown、旧Godotのloop未計測はshell-onlyと明記。export／集計はglobal player数ではない。Jev profile／schema／fixtureを将来相談用の資料として扱い、実API評価・自動改修／公開判定は起動していない。AdSenseは別task／commit／PRが対象で、今回のruntime改修へ広告SDKを接続していない。
