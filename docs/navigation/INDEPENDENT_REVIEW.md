# ポータルPLAY・共通帰還 UI 独立レビュー

2026-10-10 JST。担当：独立 navigation_review サブエージェント。実装者とは別にソースと実ブラウザ画像を確認した。runtime は編集していない。

## 対象と固定ソース

基準 commit は `cf06ae936b97fec591123bbf51bb6ff4817e349a`、branch は `codex/portal-play-navigation`。最初の固定候補について [FINAL_SOURCE_MANIFEST](QA/FINAL_SOURCE_MANIFEST.json) の529 fileのSHA-256を独立に照合し、差異0を確認した。その後のpointer修正は別checkpointとして下記に記録する。manifest の file 数はレビューした画面数ではない。

pointer修正後の最終manifestも独立に再照合し、差異0。最終 `public/arcade-navigation.js` のSHA-256は `7affda5b331f8da426dd28f629b5889ccca0da1f036987c00be3ee690943e9d0`。

依頼書、AGENTS、PROJECT_CONTEXT、CURRENT_STATUS、GAME_DEVELOPMENT_RULES、JEV_REVIEW_RULES を読んだ。共有ナビ、001〜009、011、012〜014 wrapper、015、018、019、031 の帰還・入力・保存境界を重点確認し、ポータルのリンク・ランキングボタン構造も確認した。

## コード判定

初回のソースレビューで見逃したmouse／tap帰還 blockerが実操作QAで観測された。release伝播sourceの [interaction-release](QA/interaction-release/REPORT.json) はdesktop234 checksが成功し、026／031の通常開始後の実帰還成功を確認した。[save031-release](QA/save031-release/REPORT.json) も6scenario PASS。**観測されたpointer blockerはこれらの再検証範囲で解消済み。** 後続のmobile／独立narrow reviewで022／028／023／024説明panelによるheader被覆を観測し、追加checkpointに分けた。最終独立56caseでは全件成功した。現在のsourceに追加のblocking findingはない。実機cutoutの評価は未実施。

- `public/arcade-navigation.js` は各 entrypoint より前にロードされる。keydownはwindow captureで分離し、Enterのnative anchor activationとTabの既定操作を残す。Enter repeatは抑止する。pointerの初版window captureは026のgesture gate、031のmenuPressにfresh pressを渡さず、通常のmouse／tap clickを拒否させた。最終修正ではpointerdown／mousedown／touchstartだけをdocument bubbleで停止し、document／appのcapture validatorとtarget handlerを先に通す。releaseは伝播させる。026／031だけでなく015／016／017／018／023／025／027／029／030のpointer検証箇所も追加で読んだ。
- 031 の帰還は従来の async `leave()` を保つ。保存完了を待ち、失敗時は recovery UI を出す。019 の `finish('quit')`、018 の anchor delegation、015 の class-based quit/audio 停止、既存 pagehide 処理も保つ。
- modal 時だけ、現在の header anchor と同じ位置に top-layer 内の proxy を出す。通常の primary click を元 anchor の `.click()` に委譲し、modifier click は native link に残す。dialog 内容更新・close・resize・scroll に追随する。全ゲームの playfield へ固定 overlay を常設する方式ではない。
- PLAY、タイトルのリンク、TOP10 button は siblings。card handler は button を除外し、余白 click から PLAY への forwarding 後に即 return する。この inspected flow では1操作を二重に game_launch／game_card_click として記録しない。TOP10 からゲームを起動する経路もない。
- 012〜014 は wrapper と対応 tool template の変更であり、Godot engine payload／ゲーム内部の操作・保存を変更していない。

初回レビューで指摘した003の動的旧ラベル／class、009のheader帰還欠落、007／008／011のbrand後配置、006のresponsive max-width衝突は修正後のソースと画像で再確認した。002のroot `/` footerも相対URLへ修正されている。追加のsource懸念として、header上のpointerup停止が006のwindow release cleanupを遮ることを伝えた。006のstageはpointer captureを取らない。最終ソースはreleaseを止めないため、既存cleanupへ届くことをソース上で再確認した。

## 実画像による限定 Visual 判定

**確認した共通帰還 control と desktop／phone portal の優先度は PASS。** スクリーンショットで文字、輪郭、cream背景、44px領域、header内の位置を確認した。明暗の異なるゲームでも帰還の意味を同じ形で識別でき、確認した画像では操作UIと重ならない。desktop／390px phone portalでは黄色のPLAYがBESTの直後にあり、紹介・タグの下のcream色TOP10より明確に強い。phoneのPLAY文言は1行で収まり、紹介・タグ・TOP10にも明確な余白がある。

実際に開いて確認した画像：

- [001 320](QA/layout-final/game001-320.png)、[003 390](QA/layout-final/game003-390.png)、[006 390](QA/layout-final/game006-390.png)、[008 390](QA/layout-final/game008-390.png)、[009 390](QA/layout-final/game009-390.png)、[011 390](QA/layout-final/game011-390.png)。
- [012 320](QA/layout-final/game012-320.png)、[015 landscape](QA/layout-final/game015-844.png)、[018 landscape](QA/layout-final/game018-844.png)、[019 landscape](QA/layout-final/game019-844.png)、[031 320](QA/layout-final/game031-320.png)。
- [001 modal practice](QA/interaction-first/practice-game001-1300.png)、[003 modal practice](QA/interaction-first/practice-game003-1300.png)。proxy が header の reserved位置に見え、modal内の実練習と重ならない。
- [Portal desktop](QA/portal/portal-root-1300.png)、最終candidateの [Portal phone 390](QA/portal-release/portal-root-390.png)。

これは限定UI改修の画像レビューであり、ゲームのmotion／面白さを再評価した全体A〜H scoreは付けていない。画像存在やCSS変更だけからVisual点を作っていない。ここまでの15枚に加え、後段のlong explanation画像8枚も開いた。

## QA証拠と制約

[layout-final report](QA/layout-final/REPORT.json) は30 active games ×4 viewport＝120測定、errors0。このreportを読み、header帰還のlabel／href／位置／44px高さ／hit／overflow／overlapの確認範囲と照合した。titleのlayout測定成功を全ゲーム全phaseの実play成功へ拡張しない。

[ranking-final report](QA/ranking-final/REPORT.json) はPASS／118 checksである。これは別担当が実行した結果をレビューしたもので、本担当が同じbrowser操作を独立再実行したという意味ではない。portalの初回reportには026帰還navigation timeoutがあり、PASSとして扱っていない。後続検証は実装報告の最新結果を参照する。

その後の [portal-release](QA/portal-release/REPORT.json) は271 checks／false0／errors0／posts0を確認した。reportの通常pointer帰還と各linkの実launchを確認し、初回failure原本とは別の修正後証拠として扱う。後続のphone／subpath拡張結果は実装報告にある最終aggregateを参照する。

追加観測：001の320px title画像では、既存のsquare playfield／overflow境界に「練習する」の下部がclipされている。帰還controlは明確に見える。[BASELINE001](QA/BASELINE001.json) は旧版／候補の同じgeometryを測定し、双方のclip量29.078125px、候補の全体Y移動+9pxを示す。title／stage sizing sourceも今回変更されていない。これは既存UI制約として継承し、今回のナビregressionに分類しない。

[save031-final](QA/save031-final/REPORT.json) は通常のPC／touch採掘・設置の後、遅延IndexedDB完了を待つ帰還、reload／surface、保存失敗の回復とkeyboard帰還の計6scenario PASS。遅延・保存失敗の注入はsynthetic、世界での操作は通常入力であり、区別がreportに記録されている。初回の[save031 failure](QA/save031/REPORT.json) は別原本として保持する。

releaseイベントを伝播させた最終candidateの [save031-release](QA/save031-release/REPORT.json) でも同じ6scenarioがPASS。desktop [interaction-release](QA/interaction-release/REPORT.json) の145 state観測には、021のmain-start-selector未到達がlimitとして残る。この点を全state到達済みとは扱わない。

## 追加checkpoint：022 phone説明panel

最初のmobile interaction拡張は、desktop234／mobile157の成功後に022説明panelで失敗した。[finding](QA/navigation-menu-022.json) と [failure画像](QA/interaction-release/failure.png) を独立に確認した。390pxのreturnは右側、説明panelは画面上端から始まり、returnを隠していた。これはrequired header帰還の実hit-testing blocker。

`src/games/game022/style.css` の修正では、既存mobile `order:1` をspecificityの高い `order:-1` で上書きし、dialog位置とmax-heightをheader／consent footerの間に制限する。修正後の [022 practice 390](QA/interaction-mobile-completion/practice-game022-390.png) を開き、左上return・brand・mute／pauseが分離して見えることを確認した。その後の独立long explanation suiteで022の4viewportについてhit／44px高さ／通常tapまたはEnterの実帰還が成功した。compiled候補の別確認は統合QAを参照する。

8件目の独立判断 [navigation-menu-022](QA/independent-judgments/navigation-menu-022.json) をJev回答を読まずに記録した。前の7判断fileは変更していない。

## 独立browser検証：long explanation narrow suite

実装担当からの追加依頼により、この担当自身が `/usr/bin/chromium` を起動し、全27 active native gamesの説明を320×720と844×390で確認、022には1300×900／390×844も追加した。独立browser検証は計56case。通常の説明button clickを用い、既存001 title clip等でclickできない場合は説明controlの通常Enterへfallbackした。fixtureによるgame model操作はない。contextは使い捨て、analytics同意denied、POSTと外部requestをblockした。

初回 [explanation-narrow report](QA/explanation-narrow/REPORT.json) はCOMPLETE／54PASS／2FAIL。023／024の320px long explanationがreturn中心を覆った。実画像とelementFromPointの観測を保存し、回数やsourceを修正後と混同していない。[別のheader geometry](QA/explanation-narrow/AFTER_CORRECTION_HEADER_GEOMETRY.json) はCSS修正がliveになった後の観測と明示してあり、初回failureのboundsではない。

修正後は新しい出力先で全56caseを再実行した。[explanation-narrow-accepted report](QA/explanation-narrow-accepted/REPORT.json) は **status COMPLETE／completed true／56PASS／0FAIL／page errors0／POST0**。固定した529source fileを開始前・終了後に照合し、双方mismatch0。scriptは途中のreportをIN_PROGRESSとし、部分PASSを完成判定にしない。

実際に開いた追加画像は次の8枚。いずれもheader returnが説明panelから分離して見え、通常の実帰還もreportで成功した。

- 022：[320](QA/explanation-narrow-accepted/game022-320-explanation.png)、[390](QA/explanation-narrow-accepted/game022-390-explanation.png)、[844 landscape](QA/explanation-narrow-accepted/game022-844-explanation.png)、[1300 desktop](QA/explanation-narrow-accepted/game022-1300-explanation.png)。
- 023：[320](QA/explanation-narrow-accepted/game023-320-explanation.png)。024：[320](QA/explanation-narrow-accepted/game024-320-explanation.png)。
- 028：[320](QA/explanation-narrow-accepted/game028-320-explanation.png)、[844 landscape](QA/explanation-narrow-accepted/game028-844-explanation.png)。

028の60px、023の72px、024の68px headerと64px consent footerのbudget修正を独立に読んだ。これらの説明return blockerは56case再検証範囲で解消済み。022 short landscapeでは説明が途中のitem3付近から表示されるscroll保持を観測した。上へscroll可能でreturnは覆わないため、navigation blockerには分類しない。sourceの `show()` は内容更新後にscrollTopをresetしていない。この限定観測を説明全文が常に先頭から表示されるという主張に広げない。

9件目 [menu028](QA/independent-judgments/navigation-menu-028.json)、10件目 [narrow explanations](QA/independent-judgments/navigation-narrow-explanations.json) の独立判断を記録した。Jev回答は読んでいない。

## 最後のsource checkpoint：safe area

cover-modeの26 active native HTMLにtop safe-area対応が欠けていたことをsourceで確認した。実機の切れを観測したfindingではない。header marginだけを足すと、固定した100dvh main／canvasが下へ押し出される可能性があるため、実装担当は26ページのviewport-fitをcontainへ変更し、browserのsafe viewport内にlayout／height budgetを収める方式を採用した。011のdefault autoとlegacy shell既存safe-area対応は保つ。共通headerにはnormal-flowのtop inset fallbackを追加し、通常のenv0では値0。

このsource correctionを独立に確認し、11件目 [safe-area-top](QA/independent-judgments/navigation-safe-area-top.json) を記録した。unknownな実機cutoutを重大失敗の実測と扱わず、risk=false／追加source作業required=trueとした。上記56caseはこの最後のviewport meta変更直前の固定candidateである。meta／fallback修正後も新しい529-file manifestと現sourceのmismatch0を独立に再確認した。実機notch、非zero env、および最終compiled候補の実動作は担当側の後続QA／人間評価と区別する。

## Compiled probeのselector分類

最初の [compiled menus report](QA/menus-compiled/REPORT.json) の028 explanation／practice計8timeoutは、既存title sourceの `#explain`／`#practice` に対してtestが `#explain-button`／`#practice-button` を探していた。12件目 [compiled-probe-selectors](QA/independent-judgments/navigation-compiled-probe-selectors.json) は **TEST_INFRA_BUG／追加作業required=true／risk=false** と独立に判断した。Productの帰還失敗やcontrol欠落と混同しない。

修正した `tests/navigation/menus.mjs` は両ID系のaliasを使い、通常click／tap／Enter、48case完了条件、page errorチェックを保つことを独立に読んだ。実runtimeは変更していない。初回40成功／8失敗原本と、修正後の [compiled accepted output](QA/menus-compiled-accepted/) は別に保持する。担当側の最終compiled結果は実装報告を参照する。

本担当の独立判断は計12file。API回答を参照せずに作成し、各findingでsource／browser／testの責任を区別した。最終sourceは529-file manifestと独立に再照合し、mismatch0。最終の通常viewport regression、compiled delivery、実機safe-area／人間評価を別工程として扱う。

7findingについてJevの回答を読まずに独立判断を [independent-judgments](QA/independent-judgments/) へJSONで記録した。判定は実source／browser観測に基づき、Jev scoreから引用したものではない。

本担当による実機、人間Feel／音／酔い、全ゲーム全phase、BFCache、複数modal同時openのtop-layer順序は未確認。source上のsave hook保全を、保存拒否の実ブラウザ試験と混同していない。公開判定はこの限定レビューと別の統合QA／配信確認に従う。

## 公開byte検証の参照build環境

13件目 [public-byte-mismatch](QA/independent-judgments/navigation-public-byte-mismatch.json) は、Jev回答を読まずに **TEST_INFRA_BUG／required=true／next=CODE_INSPECTION／risk=false** と判断した。最初のHTML hash不一致だけではstale deliveryと参照build環境の不一致を区別できない。独立に `.github/workflows/pages.yml` と `src/analytics/config.ts` を読み、CIがGA4／telemetry／records値をcompileに渡すことを確認した。既存公開runtimeから分かるtelemetry endpointとempty GA4を用いて同じ08531b12 sourceを再buildした後の [actual HTTP byte report](QA/public-version-accepted/VERSION.json) は166 file PASS。初回 [failure原本](QA/public-version/FAIL.log) は残す。official artifact ZIPとrepository Variablesを直接取得できたという主張にはしない。

529-file runtime manifestはcommit `08531b12e96457bf0109102fb3d41f3fac1533b8` 後も独立に再照合してmismatch0。blind判断は計13 file。既存12判断は変更していない。

## 独立compiled検証：利用可能なresult／exit state

commit08531b12のproduction参照build完了後、`dist` をimmutableな `/tmp/navigation-result-dist-08531b12` へcopyし、local8814で独立検証した。001／002／004／005／015／016／018／021／023／024／029の11ゲーム×4viewport（1300×900、390×844、320×720、844×390）、計44case。通常PLAY後のidle collision／deadline、018の3回のstop、021の同端末2人の7手、023の通常かな選択、029の1投後の帰宅controlを用いた。game model、local save、時計を注入していない。consent denied、POST／外部requestをblock、contextは使い捨て。

最初の [result-states report](QA/result-states/REPORT.json) は **COMPLETE／36PASS／2FAIL／6UNREACHED** のまま保持する。004の4caseはprobeが存在しないcanvasをfocusしたtimeout。002 mobile2caseは26秒以内にidle collisionを得られず、playingのまま未到達。021／023の844px resultは通常board／kana操作によってdocumentがscrollしており、normal-flow headerのanchorがy=-138／-347、height44で画面外になった。dialogはy73／80、height245／238であり、dialogによるheader遮蔽と混同しない。この初期画面内測定をPASSへ書き換えない。

別の [targeted recovery report](QA/result-states-recovery/REPORT.json) は **COMPLETE／12PASS**。004を正しい通常digit inputへ改めた4viewport、021／023の4viewportを確認した。021／023の844pxでは、dialog外の左端で通常mouse wheelを上へ1回送り、document上端へ戻すとheaderの44px controlがhitし、通常Enterで実portal帰還が成功した。headerは非表示／removeされておらず、要求どおりnormal-flowでscrollとともに移動していた。sticky／fixed overlayを追加するruntime修正は行っていない。

[combined scope summary](QA/result-states/SUMMARY.json) は44unique case中、**42のactual result returnを検証、002 mobile2case未到達**。これは全nativeゲームのクリアclaimではない。残り16nativeゲームのresultは今回未プレイとして明記し、legacy3と031 exit／save-failureは別担当の既存QAと区別する。全27nativeの全result到達済みとは報告しない。初回44・別再検証12の両方で529sourceの開始／終了mismatch0、frozen compiled HTML hashの開始／終了mismatch0、page error0、POST0。

実際に開いたresult画像は001320、004844、005320、015844、018320、029390、021／023844の初期画面外2枚と通常scroll回復後2枚の計10枚。returnの見え方を実画像で確認した。score共有controlは操作せず、全bodyの視覚／Feel評価には広げない。

[remaining native source review](QA/result-states/SOURCE_REVIEW.json) は、未プレイ16ゲームのresult／clear／sandbox exit codeがmenu／overlayを更新しても既存header returnをremove／条件付きhideしないことのsource support。026の2〜4人順位tableと030のstage20を含む短いresultMenuも独立に読んだ。両者はbounded内容とscroll可能なnonmodal dialogを用い、既存header／leave handlerを維持する。実resultのhit／帰還PASSをsourceだけから付与しない。

14件目 [result-header-scroll](QA/independent-judgments/navigation-result-header-scroll.json)、15件目 [result-probe-004](QA/independent-judgments/navigation-result-probe-004.json) をJev回答を読まず記録した。前者は最初のviewport測定と通常帰還可否の切り分け、後者はnative DOMに合わないprobe selectorであり、両者はTEST_INFRA_BUG／required=true／risk=false。original raw findingと最初の失敗reportは保持する。独立判断は計15file、既存判断は変更していない。

## Result header初期位置：最後のsource correctionと実再検証

上記の最初のTEST_INFRA判断は保存する。通常scrollで実帰還できることと、resultを開いた直後に左上returnを確認できる要件は分ける。後者を満たすため、実装担当は共通scriptへ、**native modalなし／nonmodal dialog[open]あり／既存header anchor.top<0** の場合だけnormal-flow headerを即座にscrollIntoViewする小さな補正を加えた。focus、exit hook、native click、ゲームstateは変更せず、sticky／fixed overlayを追加しない。独立にsourceを読み、instant scrollでscroll listenerの再始動loopを避け、正のtopになれば再補正しないことを確認した。

新しいbuild完了後の別immutable snapshot `/tmp/navigation-result-dist-menu-scroll`（local8815）で004／021／023×4widthを再実行した。[final accepted12](QA/result-states-accepted/REPORT.json) は **COMPLETE／12PASS／0FAIL／0UNREACHED**。今回はwheelなどの手動scroll回復を許さず、result初期状態でon-screen／hit／44px以上を要求した。各caseで通常Enterまたはtapの実portal帰還まで成功した。

passive focusin traceは021844のresult retry-buttonをscrollY158、023844のmenu-titleをscrollY366でcaptureし、共通補正後も各ゲームが選んだ同じcontrolのfocusを保った。header anchorはそれぞれy20／y19、44px、hit trueとなった。finalの021／023844実画像2枚も開いて確認した。source529の開始／終了mismatch0、compiled HTMLの開始／終了mismatch0、snapshotと現在distの166file照合mismatch0、page errors0、POST0。

同じfinding_idの [dated follow-up判断](QA/independent-judgments/navigation-result-header-scroll-followup.json) を別filenameで残した。初期viewport位置のlimited PRODUCT_BUG／required=true／next=AUTOMATED_TEST／risk=falseが最終判断。初回TEST_INFRA file、original2FAIL、probe004 timeout、事前の通常scroll回復結果はすべて保持し、silent rewriteしない。manual recovery12はShadow記録より先だったことも明示する。既存13判断は変更していない。

[final checkpoint](QA/result-states/FINAL_CHECKPOINT.json) は最新sourceの実検証12と、旧checkpointの42unique result証拠を区別する。残りnative全resultやphysical notchの実確認を主張しない。この担当の最終result navigation検証範囲に未解決の実帰還blockerはない。
