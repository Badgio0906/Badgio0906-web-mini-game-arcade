# Eleven-game Implementation Report — 実装・QA・独立レビュー受入済み

2026-10-04 / baseline `ffa433c3bd3e475235f3cc235bf9bf29292e7aaf`。[実装指示書](IMPLEMENTATION_SPEC.md)0〜119に対する現状整理。**実装・技術QA・独立Feel/Visual受入済み：51 distinct native、352clip-aware title/training、176actual pause/result、24distinct local root/subpath production PASS。独立Visual全11本82〜89、Portal88、F/H各12以上。全browser閉鎖済み。main/Pages実公開・人間評価は未完了**。

## 目的と現状

11本を一覧から選び、短い説明と実操作練習で遊び始める静的Web試作版を制作している。CREDITによる制限と広告は今回無効。既存ゲーム固有の操作・得点・任意の特殊展開を残し、発見内容を練習で説明しない。

|Scope|実装方針・現在の証拠|最終確認|
|---|---|---|
|Portal|WEBミニゲーセン/WEB MINI GAME ARCADE、11件のcatalog、邦題/英題/tagline/PLAY、11枚のfinal actual thumb採用済み|native PC/portrait往復・local root/subpath PASS、独立Visual88。remote確認待ち|
|全11 Onboarding|初回説明→実操作→成功→本番。ゲーム別`tutorialCompleted`、再訪の直接開始/再練習。独立PracticeSessionを使用|desktop/portrait全11native flowsとclip-aware352観測PASS。人間の理解/長さは未評価|
|Prototype CREDIT|`src/arcade/config.ts`の`creditsEnabled:false`。既存サービスを将来用に保持|全11 stored-zero/3回native終了・自由retry PASS。production22game contextsも保存0/練習済でPLAY/帰還PASS|
|007|現在/MAX/残枠、今回の対象kg、raw乗車合計、見送る/乗せる、下車階/−kg、今の対象と区別したNEXTを同じgame領域へ|native下車/330+305=635・185kg超過の実表示/自然失敗PASS、独立Feel PASS/Visual87|
|008|worst-risk cupの実液面左右方向/meter、距離m、全杯残量をgame領域内へ。距離CSS desktop46/mobile30px、杯残量28/21px|native慣性補正/3杯/0%/TIME-only自然結果PASS、独立Feel PASS/Visual85。実機の操作感は未評価|
|010|既存人物に合う生成LISTEN/WORK前景を2枚採用、同じ机/視点/自然な手|実WORK/true question/feint/自然失敗を両端末で確認、独立Feel PASS/Visual86|
|011|20生成アイコン、画像10問→文章10問→0.5秒FINAL、独立ランダム左右、同じボタン、score/BEST|モデル試験とnativeの操作/可視締切/READY guard/各phase/結果を区別して記録|

## 全11練習の契約

通常成功を約5〜20秒で体験する目安。放置・説明ボタンだけで完了させない。失敗しても練習を継続でき、成功後に本番開始を明示する。練習専用の表示点は本番score/BESTへ保存しない。

|Game|実際に練習すること|
|---|---|
|001|内側障害のタイミングを見て軌道切替・回避|
|002|CENTER開始から2回の人物回避|
|003|遅いブロックを広い土台へDROP|
|004|WATCH後に左上→中央、cell0→4|
|005|丸い→LEFT、角ばった→RIGHT、規則変更の短い通知。日本語/英語|
|006|ANGLE→POWERの2入力、車の移動と広い枠への駐車|
|007|RIGHTで200+60=260/450、その後LEFTで410+80=490/450を見送る|
|008|正の`surfaceTilt`で左液面が高い状態をRIGHT補正、押す/離すで中央へ|
|009|少数の個別机上物から赤い印鑑を探す|
|010|WORK→上司の予兆→LISTEN。練習得点の例は本番と分離|
|011|実アイコンとランダム左右の二択を時間制限なしで回答|

## Game011 固有仕様

20枚（ウンコ10/ウコン10）をshuffleしRUNごと10枚、画像の重複なし。最初の画像は5秒、正解後の停止説明を挟み、画像2〜10は1秒。文章は20問poolから重複なし10問、読む時間は無制限。準備完了後に選択肢を出した時から0.8秒。準備入力を回答へ使い回さず、release/新input epochを設ける。FINAL選択は無制限、選んだカテゴリを0.5秒で選ぶendless。各phase左右は毎回独立randomで、固定交互にしない。1ミス/時間切れで終了。

基礎点は画像100、文章150、FINAL250。結果にはSCORE、画像x/10、文章x/10、FINAL MODE、FINAL STREAK、BESTを表示する。20アイコンはポップで判別明瞭、回答ボタンは色/形/サイズ/fontを揃える。画像cache/decode、締切時計、pause/背景化、focus/held/burst入力はnativeQAが必要で、モデルPASSのみで保証しない。

## 美術制作と採用

Art brief→実第一者ImageGen→原本/optimized実view→素材採用を実施した。[実3回のpromptとoutput](art/IMAGEGEN_LOG.md)、[採用pipeline](art/ASSET_PIPELINE_DECISIONS.md)、[asset audit](art/ASSET_AUDIT.json)へ根拠を保存。011は20×256²RGBA/224,332B、010は2×1200×300RGBA/68,680B、計22枚293,012B。既存56画像のhash保持はProducerのaudit証拠。素材採用は完成gameのVisual点ではない。

契約：[Portal](art/PORTAL_VISUAL_BRIEF.md)、[011](art/GAME011_VISUAL_BRIEF.md)、[010前景](art/GAME010_FOREGROUND_BRIEF.md)、[007/008判読](art/READABILITY_GAME007_008.md)。Portal runtimeは`public/assets/portal/game001.webp`〜`game011.webp`。中間001〜010の134,790Bから、今回のRoot actual pre-QA captureで007/008/010を更新・011を追加し、最終11枚143,896Bを採用した。011は実1問＋2choiceで、両categoryの架空同時表示を合成しない。source/crop/hashは`assets/portal/thumbnails/asset-index.json`へ保存。

最終asset auditは89WebP PASS（既存56hash保持＋20icons＋2foreground＋11thumbs）、全WebP計1,328,264B、新規33枚436,908B。これは画像/出典の採用とhash監査であり、game/portalの独立Visual80点gateや画面配置のPASSではない。豪華な生成posterを実gameplayとして使わない。

## 最初のRoot preview：中間証拠

Rootが取得した[portal-first-desktop.png](screenshots/portal-first-desktop.png)と[practice001-first-desktop.png](screenshots/practice001-first-desktop.png)をArt Directorも実viewした。前者はcream/inkの4列・11cardの一覧で、**取得時には011thumbが未設置で画像欠落**、007/008/010は旧実画面の仮thumb。後者は001練習の軌道・障害・切替controlの表示状態である。

これらは初回native previewの保存記録であり、011thumb完了、全11練習成功、入力分離、mobile、最終Visual/QAのPASS証拠ではない。修正後に旧欠落画像を差し替えて履歴を消さず、別の最終証拠を追加する。

## 静的構成と配信

MPAでportalは`index.html`、ゲームは`game001.html`〜`game011.html`。Vite `base:'./'`で12物理HTML entryをbuild対象にし、直接Refresh可能な構成を選んだ。catalogは`src/data/gameCatalog.ts`の一箇所。リンク/画像/font等はBASE_URL/相対pathでrepository subpathへ対応する方針。機能の存在と実配信検証は別である。

公開先はユーザー作成のpublic repository [Badgio0906/Badgio0906-web-mini-game-arcade](https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade)。予定公開URLは[https://badgio0906.github.io/Badgio0906-web-mini-game-arcade/](https://badgio0906.github.io/Badgio0906-web-mini-game-arcade/)。RootがPagesの`build_type:workflow`（GitHub Actions設定）を確認した。

GitHub接続後、RootはリポジトリREADMEの更新成功を報告した（remote commit `5fdaa861…`）。ユーザーが見たpublic/mainの初期README画面は、GitHub repositoryの正常な初期表示であり、ゲームサイトが配信された画面ではない。READMEの反映とArcade配信を分ける。

GitHub RESTによる初期review-source転送は完了、commit `e76f28a896da02d73f77fa7de54560c7c1f16da0` / tree `31429e51369d036aabdc1ed420428bd2a98cba21`。[remote tree audit](QA/GITHUB_REVIEW_SOURCE_AUDIT.json)で1252files/12HTML/89publicWebP/workflowとnot-truncatedを確認した。これは後述の独立レビュー最終focus/copy修正前のreview snapshotで、最終freezeと同一だとは扱わない。

**mainへの最終Arcade反映/deploy・remote実URL確認はまだ行っていない**。review用source準備とmain/Pages配信を分ける。独立gateは完了したが、公開先・README更新・review branch・Pages設定をURLの稼働/配信PASSと混同しない。local root/subpath24distinct routesは下記の通り完了。

## QA・独立評価と未完了項目

[QA ledger](QA/README.md)が実行結果の責任ある出典。[保護baseline](QA/GAMEPLAY_BASELINE.json)と[実source audit](QA/GAMEPLAY_AUDIT.json)は既存モデル19ファイルと契約hashを扱い、browser証拠ではない。[design risk review](reviews/DESIGN_RISK_REVIEW.md)は初回理解・007方向・008液面・011入力/可視時間の事前所見。

現ledgerにはモデル011 9/9、services/disabled-wallet22/22、最新practice24/24、future-enabled wallet fixture修正後Game002 8/8の実targeted PASSが記録されている。Rootから全153unit PASSと候補build/check PASSの実行報告を受領した。[EXECUTION_LEDGER](QA/EXECUTION_LEDGER.json)には担当とcheckpointを保存する。初回152PASS/1fixture failureは履歴として残し、partial8件からfull成功を推定しない。

Frozen DEVの最初の13 distinct desktop native PASSと途中47件の閉鎖は履歴として保持。最終**51distinct native PASS＝42unaffected source-bridged cases＋最新9実行**。全11desktop/portraitのpractice分離/保存/reload/再練習、保存0で3回自然終了/自由retry、portal往復、007/008/010改修、両011 FINAL到達（各5500点/streak12）と8サイズ実結果を含む。最新9件は011全8case＋008の3終了/2retry・pause/result。54distinct configured skips（retarget込みskip実行72）は実playに数えず、landscape nativeプレイとdesktop resize観測を区別する。1回の無傷な51件連続実行とは記載しない。

初回Responsive352観測の64FAIL（title34/practice24/modal6）は[INITIAL audit](QA/INITIAL_ONBOARDING_LAYOUT_AUDIT.json)に保持した。修正後のviewport-only352観測PASSから、hidden-window clippingも確認する強化collectorへ進めた。[clip-aware initial audit](QA/INITIAL_CLIP_ONBOARDING_LAYOUT_AUDIT.json)は009practice320幅で右columnが隠しwindowの292px境界を越え311pxに出る1件の真の不具合を記録。個別practice grid CSSだけを修正し、009desktop/phoneと[最終352 clip-aware観測](QA/FINAL_ONBOARDING_LAYOUT_AUDIT.json)がPASS。最初のGame007 PAUSE1920 overflowも[元のfinding](QA/findings/GAME007_PAUSED_OVERFLOW.json)と画像を保持し、限定修正後[176実pause/result観測](QA/ACTUAL_PAUSE_RESULT_LAYOUT_AUDIT.json)は全PASS。

011終了時`remaining:null`を想定していなかったharnessも、製品の締切を変えず、`deadline:1`/`answerElapsed:1`/timeout run_end一度/score100保持/late native answer拒否を厳密に確認するtestへ修正し、[native再検証PASS](QA/ACTUAL_QUIZ_DEADLINE_AUDIT.json)。これを製品不具合へ読み替えず、修正・fixture・元の失敗を保存する。CSS技術修正をart iterationや独立点に転用しない。

独立レビューで011の2つのfocus不具合を追加発見した。RESUME直後に隠れたresume buttonがfocusを保持し最初のArrowを無視、次にMODE選択直後も隠れたfinalChoicesで同様の無視が起きた。原本の3500/final4結果とunpaused mode失敗journalを[011 Feel report](reviews/GAME011_FEEL.md)に保持する。main overlayとBoard finalChoicesのそれぞれが非表示へ変わる時、内部focusだけを同期blurする限定修正。締切・guard・clock/model/素材は変更せず、入力猶予も追加しない。[focus bridge](QA/FOCUS_REPAIR_SOURCE_BRIDGE.json)と[mode/copy bridge](QA/MODE_REPAIR_SOURCE_BRIDGE.json)が差分を限定する。

008のinactive `TIME / CREDIT`/3/3表示はprototype OFF時だけTIME/時間単独へ修正し、将来enabled分岐を保持。QAは自然終了3receiptで無wallet/rewardと実TIME-onlyを確認、独立phoneも211m/211点/20.7秒の自然終了で再確認した。これは表示修正で、physics/scoreを変えない。

最終freezeは[197runtime file manifest](QA/FINAL_MODE_RUNTIME_SOURCE_FREEZE.json)、SHA256 `ca8c62219c2840d1b87c99f8f001bebb83ef229f3b6e7a1fc2ec6d7c9d143683`。最終auditでも保護19byte一致/contract変更0、freeze197一致。153unit18files・7.32秒はモデル検証済checkpointとして保持し、focus/copy修正後の最終check1.89秒/12entry build5.35秒/art89-dist PASSを分ける。純model/core変更がない限定修正で全unitを再実行したとは言わない。ここで新test/browserは走らせず、担当の実証を引用する。旧ten-game115unit/production成績を今回へ流用しない。

## Production：local root/subpath実証完了

[初回修正後production audit](QA/PRODUCTION_ROOT_SUBPATH_AUDIT.json)は2026-10-04 12:39:57 UTC、rootと`/repo/`各portal＋11games、計24 fresh contexts PASS。011focusの4affected retargetを経て、最終は**18unaffected retained routes＋portal/008/011の6fresh retarget＝24distinct production routes PASS**、HTTP/runtime error0、production diagnostic hook0。[final6 audit](QA/PRODUCTION_MODE_RETARGET_AUDIT.json)を別に保存し、通算の追加contextsをroute数へ加算しない。ゲーム22routesは保存CREDIT0/練習済の明示fixtureから普通のPLAY→pause→refresh→11card portal帰還を実行し、assetsは指定mount内でロードする。

初回collectorは機能assertionを終えた後、戻りportalのresponse-body取得jobとcontext終了が競合した。[初回race audit](QA/INITIAL_PRODUCTION_COLLECTOR_SHUTDOWN_AUDIT.json)を保存し、network idleとjob drainを待つcollectorだけを修正して再実行した。runtime sourceは変えていない。最終errors配列の後付け変更もない。

[resource summary](QA/PRODUCTION_RESOURCE_SUMMARY.json)はroot/subpathで一致。HTTP script bodyはportal3,842B、native44,107〜57,159B、Phaser001/002/003/006は1,260,597〜1,269,304Bで既存300KB/2MB限度内。最新011は48,178B。native/portalはPhaserを取得しない。fontは001が0、他routeが154,856B。011の初回20画像は224,332B、portal11画像は143,896B。gzip/画像/fontのunique bodyとencoded/decodedは原本を参照し、refresh/帰還の累計を初回へ混ぜない。Local実証はremote GitHub Pagesの公開証拠でも実機FPSでもない。

## 独立Feel / Visual：全11とPortal受入完了

[Onboarding Feel](reviews/ONBOARDING_FEEL.md)は全11のPC/phone計22実practice→fresh本番と再訪/再練習/portal帰還を普通のnative入力で確認しPASS。操作を知る担当のmechanical成功時間は人間の平均5〜20秒学習時間ではない。既存001〜006/009は今回の統合・練習・fresh main観測で、再度の全long-run milestone reviewとは扱わない。

[007/008判読](reviews/GAME007_008_READABILITY.md)、[010 Feel/Visual](reviews/GAME010_VISUAL.md)、[011 Feel](reviews/GAME011_FEEL.md)、[011 Visual](reviews/GAME011_VISUAL.md)、[Portal](reviews/PORTAL_VISUAL.md)の最終native/実画像判定はすべてPASS。011最終unpaused MODE→Arrowは9.4ms、BODYへ届き+250一度、5問の各正解で3750/final5→自然timeout/retry。pauseして撮った0.5秒画面をlive速度証拠に使わない。008最終TIME-onlyは自然phone211m/211点/20.7秒。readonly答えoracleは普通の入力を計画しただけで、人間の反射・楽しさを保証しない。

[独立numeric scorecard](reviews/FINAL_VISUAL_SCORECARD.md)は1440×900/390×844 actual capturesとnative動作から採点し、全80以上/F・H各12以上。[最終独立受入manifest](reviews/FINAL_INDEPENDENT_ACCEPTANCE.json)に7reportsとfinal fingerprintのPASSを保存。素材概念・source inspectionだけの採点ではない。

|対象|Visual点|判定|
|---|---:|---|
|001|84|PASS|
|002|88|PASS|
|003|88|PASS|
|004|87|PASS|
|005|89|PASS|
|006|82|PASS|
|007|87|PASS|
|008|85|PASS|
|009|87|PASS|
|010|86|PASS|
|011|86|PASS|
|Portal|88|PASS|

Gmotionは007/008が6、009が5、011背景Cが6など、静的な探索・控えめなpose/phase動作・small phone detailの限界を正直に採点した。初回art iterationの合格点を限定focus/copy/CSSの技術修正で増やさず、元findingを合格へ書き換えない。全browser閉鎖済み。人間の面白さ/新K〜N/実機FPS/公開判断は別の未実施項目。

|Final gate|今回の最終結果|
|---|---|
|Source freeze / protected models / asset audit|最終19strict match/契約変更0、freeze197一致、asset89-dist PASS。[native source bridge](QA/RETAINED_NATIVE_SOURCE_BRIDGE.json)保持|
|npm install / build / 全unit regression|153unitモデルcheckpoint保持、最終focus/copy後check1.89秒/build5.35秒 PASS|
|全11説明・実practice・成功・本番・再訪・再練習|desktop/portrait各11とaffected009再検証PASS|
|全11CREDIT-off・既存BEST・入力/telemetry分離|全11practice分離/stored-zero三回終了・自由retry PASS。local production22game contexts PASS|
|Portal11画像/route/戻る/refresh/root/subpath|11actual画像採用、native往復、local root/subpath24contexts PASS|
|007/008/010/011の指定QA|51distinct native（42retained＋最新9）PASS。deadline/focus2修正/008TIME-only自然3receiptも確認|
|Desktop/mobile独立Feel/Visual（80以上、F/H各12以上）|全11Feel PASS、Visual82〜89、Portal88/FH各12以上 PASS|
|各viewport title/explanation/practice/success/result等|352clip-aware title/training＋176actual pause/result PASS。初回64FAIL/clip1件等保持|
|Production first-load / resource / error / no debug hooks|24fresh local root/subpath PASS、error0/hooks0、resource限度内。collector race原本保持|
|GitHub Pages公開先・実公開確認|repository/URL/Actions設定＋README/初期review-source e76転送済み。最終main/deployとremote配信確認は未実施|
|人間A〜J・新K〜N・実機FPS・楽しさ・公開判断|全11未実施|

Art iterationと限定CSS/文字/入力の技術修正checkpointは別に記録し、元の不具合証拠を保存する。最終数値は独立reportが揃ってから追記する。[人間フォーム](HUMAN_PLAYTEST.md)、[次期仕様候補](COMMON_SPEC_NEXT_DRAFT.md)は実測待ちの資料であり、採用済みの全genre SDKではない。

## 最終受入時に記録する内容

51distinct QAの閉鎖・source bridges、24distinct local production routes、独立Feel/numeric Visual、最終build/source/asset監査は上記へ追記済み。残る最終main commit/Actions run/実URL応答を実証リンク付きでRootが追記する。Local24が成功してもremote Pages配信とは別欄。実機FPSと初見の新K〜N/面白さは自動結果と別欄の未実施を維持する。

技術的なplaytest候補の受入と、人間の楽しさによる公開合格を分ける。未実施を「問題なし」に変更せず、公開URLだけ提示して全11人間合格を暗示しない。011固有の時計/gesture/decode/RNGの学びは[GAME011_LESSONS](../GAME011_LESSONS.md)、全gameのpractice/情報配置の学びは次期草案へ反映する。
