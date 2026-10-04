# Eleven-game Implementation Report — 途中草案

2026-10-04 / baseline `ffa433c3bd3e475235f3cc235bf9bf29292e7aaf`。[実装指示書](IMPLEMENTATION_SPEC.md)0〜119に対する現状整理。**153unit・候補build/check・45/47 distinct native・176 pause/result観測はPASS。009practice clipと011終了時countdown harnessの2再検証待ち。独立Feel/Visual・production・公開は未判定**。この草案は完成報告ではない。Rootが最終候補と実測を後から追記する。

## 目的と現状

11本を一覧から選び、短い説明と実操作練習で遊び始める静的Web試作版を制作している。CREDITによる制限と広告は今回無効。既存ゲーム固有の操作・得点・任意の特殊展開を残し、発見内容を練習で説明しない。

|Scope|実装方針・現在の証拠|最終確認|
|---|---|---|
|Portal|WEBミニゲーセン/WEB MINI GAME ARCADE、11件のcatalog、邦題/英題/tagline/PLAY、11枚のfinal actual thumb採用済み|最終PC/mobile・遷移・帰還・Refresh/サブパスは未判定|
|全11 Onboarding|初回説明→実操作→成功→本番。ゲーム別`tutorialCompleted`、再訪の直接開始/再練習。独立PracticeSessionを使用|desktop/portrait全11native flows PASS。clip-aware352観測は009最小幅practice修正の再判定待ち|
|Prototype CREDIT|`src/arcade/config.ts`の`creditsEnabled:false`。既存サービスを将来用に保持|全11 stored-zero/3回native終了・自由retry PASS。練習分離と最終productionは別証拠|
|007|UI担当のsource統合済み：現在/MAX/残枠、今回の対象kg、raw乗車合計、見送る/乗せる、下車階/−kg、今の対象と区別したNEXTを同じgame領域へ|実表示・足算・下車・キー/タッチ・長い数値を最終検証|
|008|UI担当のsource統合済み：worst-risk cupの実液面左右方向/meter、距離m、全杯残量をgame領域内へ。距離CSS desktop46/mobile30px、杯残量28/21pxはsource値|液面と矢印の一致、慣性時の補正、実font/各cup/端末表示を最終検証。source値を実画面判読PASSとしない|
|010|既存人物に合う生成LISTEN/WORK前景を2枚採用、同じ机/視点/自然な手|統合後state差・face/cue遮蔽・mobile/performance・独立美術は未判定|
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

**Arcade統合sourceのpush/deployはまだ行っていない**。RootがCLI pushの認証環境を調整中で、QA/Feel gateの後に配信工程へ進む。公開先・README更新・Pages設定を、URLの稼働/配信PASSと混同しない。rootとrepository subpath配信、HTTP200、fresh load、console errors、直接Refresh、11往復、remote実URLの最終確認は追記欄へ残す。

## QA・独立評価と未完了項目

[QA ledger](QA/README.md)が実行結果の責任ある出典。[保護baseline](QA/GAMEPLAY_BASELINE.json)と[実source audit](QA/GAMEPLAY_AUDIT.json)は既存モデル19ファイルと契約hashを扱い、browser証拠ではない。[design risk review](reviews/DESIGN_RISK_REVIEW.md)は初回理解・007方向・008液面・011入力/可視時間の事前所見。

現ledgerにはモデル011 9/9、services/disabled-wallet22/22、最新practice24/24、future-enabled wallet fixture修正後Game002 8/8の実targeted PASSが記録されている。Rootから全153unit PASSと候補build/check PASSの実行報告を受領した。[EXECUTION_LEDGER](QA/EXECUTION_LEDGER.json)には担当とcheckpointを保存する。初回152PASS/1fixture failureは履歴として残し、partial8件からfull成功を推定しない。

Frozen DEVの最初の13 distinct desktop native PASSは履歴として保持。最新の有効なnative45/47件は、明示source bridgeで保持した15 functional＋desktop16＋portrait14の別sliceから成立している。全11desktop/portraitのpractice分離/完了保存/reload/再練習、全11保存0で3回自然終了/自由retry、portal往復、007/008/010改修、両011 FINAL到達（各5500点/streak12）と8サイズ実結果を含む。52 project duplicate skipsは実playに数えず、landscape nativeプレイとdesktop resize観測を区別する。1回の無傷な47件連続実行とは記載しない。

初回Responsive352観測の64FAIL（title34/practice24/modal6）は[INITIAL audit](QA/INITIAL_ONBOARDING_LAYOUT_AUDIT.json)に保持した。修正後のviewport-only352観測PASSから、hidden-window clippingも確認する強化collectorへ進めた。[clip-aware audit](QA/INITIAL_CLIP_ONBOARDING_LAYOUT_AUDIT.json)は009practice320幅で右columnが隠しwindowの292px境界を越え311pxに出る1件の真の不具合を記録。個別practice grid CSSだけを修正し、再検証待ち。最初のGame007 PAUSE1920 overflowも[元のfinding](QA/findings/GAME007_PAUSED_OVERFLOW.json)と画像を保持し、限定修正後[176実pause/result観測](QA/ACTUAL_PAUSE_RESULT_LAYOUT_AUDIT.json)は全PASS。

もう1件の再検証は011終了時`remaining:null`を想定していなかったharness。製品の締切を変えず、`deadline:1`/`answerElapsed:1`/timeout run_end一度/score100保持/late native answer拒否を厳密に確認するtestへ修正した。これを製品不具合や既済PASSへ読み替えず、native再検証結果を待つ。修正・fixture・元の失敗を保存し、CSS技術修正をart iterationや独立点に転用しない。

ここで新しいtest/browserを走らせておらず、上記候補checkpointを修正後の最終native/production/公開PASSへ拡張しない。旧ten-game115unit/production成績も新portal/CREDIT-off候補の成績に流用しない。

|Final gate|今回の最終結果|
|---|---|
|Source freeze / protected models / asset audit|初回19strict match/契約変更0、asset89PASS。[native source bridge](QA/RETAINED_NATIVE_SOURCE_BRIDGE.json)と修正候補freezeを保持。最終auditは追記待ち|
|npm install / build / 全unit regression|Root報告：153unitと候補build/check PASS。修正後の最終checkpointは追記待ち|
|全11説明・実practice・成功・本番・再訪・再練習|desktop/portrait各11PASS。009最小幅clipを含む最終collector再判定待ち|
|全11CREDIT-off・既存BEST・入力/telemetry分離|全11practice分離とstored-zero三回終了/自由retry PASS。productionは未判定|
|Portal11画像/route/戻る/refresh/root/subpath|11 final actual画像採用済み。動線/配信の最終証拠待ち|
|007/008/010/011の指定QA|functional native PASS群に含む。011終了時countdownのharness再検証待ち。独立評価は未判定|
|Desktop/mobile独立Feel/Visual（80以上、F/H各12以上）|今回候補の数値は未判定|
|各viewport title/explanation/practice/success/result等|176pause/result PASS。clip-aware352の009practice1件を修正後再検証待ち。初回64FAIL保持|
|Production first-load / resource / error / no debug hooks|未判定|
|GitHub Pages公開先・実公開確認|repository/URL/Actions設定＋remote README更新済み。Arcade source push/deployとremote配信確認は未実施|
|人間A〜J・新K〜N・実機FPS・楽しさ・公開判断|全11未実施|

Art iterationと限定CSS/文字/入力の技術修正checkpointは別に記録し、元の不具合証拠を保存する。最終数値は独立reportが揃ってから追記する。[人間フォーム](HUMAN_PLAYTEST.md)、[次期仕様候補](COMMON_SPEC_NEXT_DRAFT.md)は実測待ちの資料であり、採用済みの全genre SDKではない。

## 最終受入時に記録する内容

全47 distinct QAの閉鎖結果・source bridge/限定再検証、24 fresh production context（rootとrepository subpath各portal＋11games）のroute/assets/errors/resource量/debug hooks、独立Feelとnumeric Visualのreport/score、最終build/source/asset監査、deploy commit/Actions run/実URL応答を、**完了した順に実証リンク付きで追記**する。production24が成功してもremote Pages配信とは別欄。実機FPSと初見の新K〜N/面白さは自動結果と別欄の未実施を維持する。

技術的なplaytest候補の受入と、人間の楽しさによる公開合格を分ける。未実施を「問題なし」に変更せず、公開URLだけ提示して全11人間合格を暗示しない。011固有の時計/gesture/decode/RNGの学びは[GAME011_LESSONS](../GAME011_LESSONS.md)、全gameのpractice/情報配置の学びは次期草案へ反映する。
