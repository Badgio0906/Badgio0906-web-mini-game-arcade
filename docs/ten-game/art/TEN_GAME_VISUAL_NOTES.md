# 10ゲーム開発・Art Director記録

今回の基準は`docs/ten-game/IMPLEMENTATION_SPEC.md`。新しいゲーム仕様は、以前のVisual Redesignの「ゲーム性を変えない」制限より優先する。Art Director自身はゲームモデル・操作・公開処理を変更しない。画像生成→素材確認→実装→実画面→独立Visual Reviewを区別する。

2026-10-04全10本ソース凍結時の照合。002/003/005/006〜010の実装ソースと採用素材を確認した。全10本のbuildとunit 115件PASSはMainの技術報告。ここでのソース確認はブラウザ動作や人間の面白さの確認ではない。今回の独立Feel/Visualは002/003/005/006〜010が完了。006〜010のcandidate QAは完了。全10本productionのfunctional/fresh-first-loadもPASS。人間プレイ、実端末FPS、公開承認は別の未実施Gateとして分ける。001/004の既存評価は今回の新しい評価とは数えない。

## 新しい見た目の領域

| Game | Art Mode / 見た目 | 画面の組み立て | 画像とコードの境界 |
| --- | --- | --- | --- |
| 002改修 | 既存COMIC URBANを継承 | 静かな3レーン街路、道脇の弊社とバイク、切符風の選択 | 会社/車体/乗員は生成。弊社の文字、選択、警告、位置はコード |
| 006 | 明るい都市型駐車場・HYBRID | 真上の広い駐車場＋下の角度/Powerコンソール | 車は生成。区画、物理矩形、計器、軌道はコード |
| 007 | 少し古いオフィスElevator・HYBRID | 縦のかご＋乗降名簿、重量と次客を優先 | 人/荷物は生成。容量、重量、行先、扉、判断はコード |
| 008 | 朝の一人称Coffee Walk・HYBRID | 街の奥行き＋手前の1〜3杯、液体を主役に | 街は生成。杯のclip、実慣性の液面/量/こぼれはコード |
| 009 | 温かい散らかった机・ASSET DRIVEN | 机全体の個別配置、紙の指示、実際のhit対象 | 印鑑と道具を個別生成。机、指示、配置、形の補強、hitはコード |
| 010 | 企業会議室と控えめな風刺・HYBRID | 目線高さの上司＋手前の仕事机、一つのToggle | 上司pose/同僚は生成。予兆の文字、状態、机、操作はコード |

同じ左宣伝列＋中央カードを色替えして増やさない。006は正確な地図、007はかごの資源、008は前景液体、009は手触りのある探索面、010は人の注意へ視線を誘導する。

## 実際に確認した生成素材

| Game | Art Directorが実際に見たもの | 素材承認 / 容量 | 完成画面・独立Gate |
| --- | --- | --- | --- |
| 002 | 3物体の生成原本、最適化会社と搭乗バイク | 承認。会社/駐車バイク/搭乗バイク合計40,072bytes | 新しい独立Visual Reviewは86/PASS。確認範囲は下表 |
| 006 | 3台の生成原本、最適化小型車 | 承認。3台合計52,134bytes | 独立Feel PASS /Visual82 F13/H12。技術修正は別記録 |
| 007 | 7人物/荷物の生成原本、最適化会社員と台車 | 承認。7個合計88,394bytes。全足/車輪・透過を確認 | 独立Feel PASS /Visual85 F12/H13。技術修正は別記録 |
| 008 | 朝の街路生成原本、最適化768×512画像 | 承認。67,398bytes、元の3:2を維持 | 独立Feel PASS /Visual83 F13/H12。candidate QA完了 |
| 009 | 4印鑑と7文具の生成原本、staging最適化赤丸/青四角 | 承認。11個合計149,816bytes。独立した色/形と木の台座を確認。Mainが開いた書込みwindowで同じ採用画像をpublicへ配置済み | 独立Feel PASS /Visual85 F14/H13。candidate QA完了 |
| 010 | 同一上司3poseと同僚3人の生成原本、staging最適化glance/question | 承認。6枚合計92,040bytes。共通canvas/seat-anchorと顔・手の差を確認。Mainが開いた書込みwindowで同じ採用画像をpublicへ配置済み | 独立Feel PASS /Visual83 F14/H13。candidate QA完了 |

素材の承認は、完成ゲームの80点や面白さを宣言するものではない。使った第一者画像生成ツールの実出力を確認した。利用可能でない「skillを読んだ/実行した」とは記録しない。実プロンプト・出力ID・bbox・最適化の詳細は[IMAGEGEN_LOG](IMAGEGEN_LOG.md)と各asset-indexへ記録されている。新しい採用WebP31枚は合計489,854bytes。既存25枚は保存した。未使用原本や試行画像をproductionへ入れない。

## 実装と見た目の対応

002は既存の街路絵を残し、コードの『弊社』を付けた会社、路肩の駐車バイク、プレイヤー位置の搭乗バイクを加えた。1000mの出社終了/旅、旅の2000mの終了/徒歩/バイクは到達後に提示する。バイクは移動を速め、既存のプレイヤー表示範囲へ収める。旅の新しい地名は既存の街素材を再利用しているため、新しい郊外一式を制作したとは扱わない。

003は既存の全幅建物ファサード・街/空・クレーンを継承する。高さが15mを超えたときの許可証風選択とCモード表示が追加された。Cモードは吊り荷の揺れ2倍と以後のPERFECT加点3倍であり、建物の物理矩形・落下・支持を絵で変えていない。主スコアの階数と二次BONUSを分ける。

005は日本語を既定とし、保存されるEN切替を実装した。現在Rule、左右の行先、説明、結果を同じ言語で読み直せる。Ruleを大きくし、切替操作は44pxを保つ。分類モデルや生成製品の形/明暗/大小/記号は変更していない。言語改修は独立再確認を経て88/F14/H13でPASS。EN練習の残る日本語フッターと320px結果カードのはみ出しを修正し、実画面を再確認した。今回は以前のVisual Redesignの88点を流用せず、別のレビュー記録を根拠にする。

006はPhaserの600×600駐車場と下部の角度/Power計器、駐車券風の得点表示。実モデルの**6状態**は`angle → power → driving → parked`と、特殊選択の`choice`、終了の`ended`。これは駐車場の種類数ではない。経路は**7種類**で、直進、左右25度、狭い左右40度、左右90度の縦列。成功数で候補を段階的に増やす。42×70の車の四隅が区画に入る必要があり、生成車はその矩形内に表示する。角度とPowerを一回ずつ止める2段階の精度を、旋回軌道・着地点・区画線のコード表示が説明する。10成功後の禁断の枠は50×82、以後の得点2倍。車の絵柄変更は性能差ではない。物理モデル・unitの確認と、実画面の読みやすさ/人間の止めやすさは別の検証である。

006の初期レビューでは、3回目の曲線区画で角度は収まる値なのにPowerが弱く手前で停止し、結果が『角度』を理由にした。走行距離で最終方向も変わるため、角度だけを先に比較した帰属が誤っていた。修正ソースは選んだsteeringが必要距離を走れば全車が収まるかを確認して、短い場合は『強さが足りず、枠に届きませんでした。』とする。物理/成否/gradeは変更していない。同じ実モバイルの2成功→弱Power失敗で正しい理由を独立再確認した。CREDIT0結果、10成功選択、禁断/NEW BEST結果の技術的なはみ出しも修正・確認済み。透明playing overlayのstage touch遮断は表示と別のinput不具合で、native touchがCANVASへ届いて1Perfect/200点を得る再確認をした。最終Visualは82/F13/H12のPASS、art iteration1。CSS/失敗説明/hit修正をreskin回数や加点へ変換しない。

007はDOMのwine/brassの古いかご、開閉扉、荷重計、クリーム色の乗降名簿で構成する。かごの絵を大きく見せるだけでなく、450kgの容量、今回客のkg/行先/届けた場合の点、**実際の次客のNEXT**、直近の降車で減るkg、乗車中の名簿を優先する。NEXTは次の階でそのまま現在客になり、推奨や正解ラベルを出さない。005の属性分類と違い、乗る客を断って次客の余地を残す判断がある。画像はデスクトップで先頭6個、モバイルで先頭3個と残数、全体は名簿で確認できる。20Fの業務用高速は将来の得点1.5倍。450kgちょうどは合法、超過は入力時に終了し、650msの警告は演出時間。model unit 7件に加え、独立実プレイとcandidate native QAを実施した。独立の資源予約ルートでは3Fの箱を断り4Fの305kg組を運び、6Fで実降車した。20F→高速→29Fの自然超過と3回の失敗→Stubも観測。実305 kgの単位が切れる問題を個別のnative1〜4Fルートで直し、PC高さ/横画面footerも再確認した。最終Feel PASS /Visual85 F12/H13で、名簿・小型かご・脚注の小ささは限界として残す。人間の資源判断のしやすさは未測定。

006は幾何と2段階Timing、007は将来の荷重と配達価値を読む。両者の画面を同じ色違いカードに揃える必要はない。この差は今後の企画比較に使うが、共通SceneやテンプレートSDKを抽出する根拠にはしない。

照合元：[ParkingRun](../../../src/games/game006/ParkingRun.ts)・[ParkingScene](../../../src/games/game006/ParkingScene.ts)・[Parking contracts](../../../src/games/game006/contracts.ts)、[ElevatorRun](../../../src/games/game007/ElevatorRun.ts)・[ElevatorBoard](../../../src/games/game007/ElevatorBoard.ts)、[007のcandidate QA](../QA/GAME007_QA.md)。006の入力周期修正は[DESIGN_DECISIONS](../DESIGN_DECISIONS.md)へ記録されている。

008は生成街路を背景に、コードの杯・手・液面・滴を前景へ描くCanvas＋native左右操作。右への加速が液体を左へ動かし、各杯は異なるfrequency/dampingを持つ。各124×82液面windowは実残量と相対傾斜をclipして描き、杯数が増えても全windowを残す。500mで部長の分を受諾すると将来距離点1.5倍、2杯で1000mに到達した場合だけ会長の分/2倍の選択。追加を断っても終了せず同じ杯数で歩く。どれか一杯が空になると終了し、原因の杯をResultに出す。人/段差/急停止/ドア/電車は1.4秒予告を持つコード表現で、新しい生成街5種類を用意したという記録にはしない。独立実画面で500m/1000m到達、異なる2/3杯液面と自然な空杯終了を確認し、最終Feel PASS /Visual83 F13/H12。codeの人/ドア/電車が簡素なこと、portraitの余白、短いlandscapeの杯/脚注が小さいことは評価上の限界。実端末の最大傾き読取は人間Jへ残す。

009は個別生成印鑑/道具を、木目CSSの机へnative buttonで配置する。hit矩形は回転せず、絵だけ±6度回す。最小64×72CSSpx、desktop80×96で、机は隠れた重なりではなく、少しずれた行配置。要求と同じ赤/青・丸/四角の印が複数あればすべて正解。紙の指示と色/形見本を常時出し、失敗時には押した物と正解を表示する。5成功ごとの片付けはClutterを6減らして将来倍率を1へ、続行はClutterを3増やし倍率+0.25、最大3。Clutterは24で制限され、紙のstackも実在する個別対象内の層。無限に小さくなる対象や不透明な背景画像のhidden hotspotではない。

010は生成上司3pose/同僚をコードの目線高さの会議室へ配置し、手前のPC・手が実内職時間に従うCanvas＋一つのnative Toggle。本質問の文とquestion pose、資料確認の文とglance poseを分ける。予兆は姿勢だけに頼らずDOM文字に残す。聞く間は安全だが0点、内職は実秒10点、役員会は以後20点。会議時計300秒は実simulation60秒で、予定超過カードに終了/CREDIT消費なしと役員会を提示する。役員会は聞く状態で再開し、既存cueの残り時間を消さない。参加者増加は同僚3素材を繰り返し配置するコード表現で、全員固有の生成人物とは扱わない。

009の独立実プレイは23正解と最大Clutter24まで進み、片付けで実際の文具/紙層が減る前後を確認した。最大表示30 partsは30個のnative hit対象という意味ではない。机の行配置とdesktop余白が見た目の限界で、85/F14/H13以上に豊かな乱雑構図とは主張しない。010は開いた手/問いかけと組んだ手/資料確認を実playで観測した。room/coworkerは静かで、pose swapとtypingが中心。中心上司が大き過ぎる構図、foregroundの簡素さ、portrait余白、short-landscape小字を反映した83/F14/H13である。

008の状態読取は液面、009は目の前の物を探索、010は上司の時間的予兆へ注意を戻す。どれも日常/仕事を題材にするが、foregroundの意味、操作の保持/個体選択/Toggle、失敗原因が異なる。照合元：[CoffeeRun](../../../src/games/game008/CoffeeRun.ts)・[CoffeeBoard](../../../src/games/game008/CoffeeBoard.ts)、[StampRun](../../../src/games/game009/StampRun.ts)・[StampBoard](../../../src/games/game009/StampBoard.ts)、[MeetingRun](../../../src/games/game010/MeetingRun.ts)・[MeetingBoard](../../../src/games/game010/MeetingBoard.ts)。008/009/010はソース照合に加えて独立実画面評価を別途記録した。どの記録も人間の面白さの測定ではない。

## 完了した独立実画面Gate

| Game | 独立評価 | 実画面で確認された範囲 | 残る限界 |
| --- | --- | --- | --- |
| 002改修 | [Iteration1 PASS・86/100、F14/H13](../reviews/GAME002_EXPANSION_VISUAL.md) | 1920×1080で会社→旅→バイク→自然な衝突結果。390×844で会社への接近/選択→出社終了 | モバイルのバイクプレイは未観測。街素材の再利用、控えめな既存bob/演出。実端末性能と人間の笑いは未評価 |
| 003改修 | [Iteration1 PASS・85/100、F13/H13](../reviews/GAME003_EXPANSION_VISUAL.md) | 1920×1080で15m選択→Cモード→26階の最上部落下。390×844で15m選択→通常継続→25階の全体倒壊 | モバイルの二次BONUS/フッターは小さめ。実端末の読み心地と人間の新モード評価は未実施 |
| 005改修 | [Revision3 PASS・88/100、F14/H13](../reviews/GAME005_LOCALIZATION_VISUAL.md) | 1920/390でJA/ENのRule・反転・練習/結果。修正後320×568のEN40/JA1の実結果とpendingカードを再確認 | EN練習フッターと小型結果のはみ出しを修正済み。静的機械の絵を動く工場とは呼ばない。実端末読取と人間の言語理解は未評価 |
| 006 | [最終PASS・82/100、F13/H12](../reviews/GAME006_VISUAL.md) / [Feel PASS](../reviews/GAME006_FEEL.md) | desktop10成功→禁断の将来+800/+300→12成功4600の接触結果。phone2成功後の弱Power修正理由、自然3失敗/Stubとnative stage touchを再確認 | 駐車場の描込みは控えめ、phoneの軌道/小字は細い。phoneの10成功禁断プレイを独立実行したとは言わない。最終4300の短画面はDOM-only証拠を別記録 |
| 007 | [最終PASS・85/100、F12/H13](../reviews/GAME007_VISUAL.md) / [Feel PASS](../reviews/GAME007_FEEL.md) | desktop/phoneで容量予約→20F/高速→29F自然超過。phone4002と実3失敗/Stub。修正305 kgの4画面とnative初客landscapeを再確認 | 名簿・脚注・短画面かごは小さい。最後のfooter確認は実65kg、先の305kg確認とは別。同じ20Fを毎修正で再実行したと扱わない |
| 008 | [最終PASS・83/100、F13/H12](../reviews/GAME008_VISUAL.md) / [Feel PASS](../reviews/GAME008_FEEL.md) | desktop/phoneの500m/1000m→実3杯。phone1280m/1810の自然終了と実3失敗/Stub。新しいnative空杯192mで0%/redを再確認 | 街は一素材、hazardは簡素。phone警告とlandscape杯は小さい。16結果レイアウトはidle canvasのDOM-only。最終QAの正確な1250点証拠とは別 |
| 009 | [最終PASS・85/100、F14/H13](../reviews/GAME009_VISUAL.md) / [Feel PASS](../reviews/GAME009_FEEL.md) | desktop/phoneの続行/片付け4選択→23正解の自然誤選択。phone timeout、実3失敗/Stub。新native5正解でearned choice/PLAYINGを修正再確認 | 構図は規則的な行、desktopに余白、演出は控えめ。上書きされた中間recheck画像を保存済みFAIL写真とは呼ばない。pending Stub確認はsaved-zero別証拠 |
| 010 | [最終PASS・83/100、F14/H13](../reviews/GAME010_VISUAL.md) / [Feel PASS](../reviews/GAME010_FEEL.md) | phone実60秒478→役員会で既得点維持、5→7人、実1秒+20→75.8568秒714の自然caught。66ms Retryと2回の8秒死→0/Stub3/BEST714。実choice/resultの16画像を再確認 | desktop初期706と4layout FAILを保持。最終16画像はphone自身の478/714で、DOM fixtureや新desktop長runではない。safe exitはこの独立routeで未実行だが別QAで確認。初期FAIL、最終phone、QAを区別 |

上表は凍結された候補の実プレイと明示された修正証拠を独立Reviewerが評価したもの。Art Directorの素材承認点ではない。006〜010はart iteration1で、別の技術CSS・表示・hit修正を経た最終受入れ。数値のart点を上げる追加reskinではない。010はnative QAとsaved-zero responsive再確認も閉じた。旧版のスコアは旧版の記録として残す。

## QAと描画確認を混同しない

| Game | 現時点のQA証拠 | 使える結論と境界 |
| --- | --- | --- |
| 006 | [candidate複合QA PASS](../QA/GAME006_QA.md)：8 pure・5 distinct native PASS、実10Perfect3500→禁断4300の+800、8 earned choice、別native終端/Retry、8 exact-result semantic fixtures | 最初の長いPlaywright実行は結果layoutでFAILのまま保持。後のDOM-only4300は1行・caption/metrics/44pxの確認で、idle HUD/CREDIT3を実4300状態とは呼ばない。domain/描画/別native bridgeの組合せとして受入れ |
| 007 | [candidate QA PASS](../QA/GAME007_QA.md)：7 pure・6 distinct native PASS、8 persisted-zero menu fixtures。実20F freeze/高速、future1.5、実3超過/Stub、BEST/reset等 | 旧layout FAILとlocator auto-waitの2件harness FAILを保存。8メニューは保存CREDIT0からのnative Stub検証で、earned deathsの証拠ではない。production全10本は別Gate |
| 008 | [candidate QA PASS](../QA/GAME008_QA.md)：9 pure・5 distinct native PASS、8 storage-zero menu、16 DOM結果fixtures。新しい実500m500点→1000m1250点→3杯/将来2倍→1172m1594点終了と正常Retry | 前の1000m1249点のFAILを保持。厳密な距離segment anchorの修正後にnative再検証。16描画はidle100%canvasで自然プレイ/16 nativeではない。実3死/Stub等の変わらない証拠は別に保持 |
| 009 | [candidate QA PASS](../QA/GAME009_QA.md)：7 pure・6 distinct native、8 saved-zero title/pending fixtures。実45正解/9choices/13318点、未来倍率3→片付け1、native wrong/timeout/Stubとreset | ResizeObserver中のlocator detachedは保持したharness FAIL。idle storage-zeroと実depletionを分ける。portrait pending StubがhiddenになったCSSを同じ8probeで修正再確認、27/27 candidate一致 |
| 010 | [candidate QA PASS](../QA/GAME010_QA.md)：7 pure・5 distinct native PASS/4 duplicate skips・8 saved-zero title/pending、22/22 candidate一致。実60秒478の2branchで無課金safe exitとboard未来20点/実秒、実3死/Stub/BEST/reset | 独立phone714とQAのsafe478/board588は別run。追加568TITLE357.281px FAILを保持し、狭いTITLEだけCSS修正。最終8fixture/独立画像でtitle303.281/fullStub299.281/pending271.781・44px・errors[]・run effectsなし。productionは別Gate |

008の0%修正はphysical lossでなくdrawing cache。最小正残量と正確な0が同じ小数signatureになり、実空杯が画面1%のままだった。最終native held-input deathが0%/empty/赤と実原因を一致させた。結果の矩形が収まるだけでなく、006の4300や008の1810が一行で読め、SCORE captionが列内に入り、TIME/CREDIT等と重ならないことも別に確認した。以前のFAIL画像を最終PASS画像へ読み替えない。006〜010のcandidate QA完了は上記の範囲。全10本productionの完了証拠は次節へ分ける。人間A〜N完了、実端末FPS保証、公開承認は宣言しない。

## 最終production確認

[QA ledger](../QA/README.md)に全10本functional production 10/10 PASS（1.7分）を記録。[fresh-first-load audit](../QA/PRODUCTION_FIRST_LOAD_AUDIT.json)は2026-10-04 09:23:26 UTCの新しいcontextで10/10 PASS。HTTPリソースは200、errorsは0、DEV hooksはfalse、nativeゲームはPhaserをrequestしない。script bodyはnative20,758〜34,056bytes、Phaser route1,237,133〜1,245,921bytes。日本語local fontは002〜010で各148,684bytes、001はなし。これは初回ロードの検証で、real-device FPSや人間の読取速度を測ったものではない。

最初の監査はPhaser画像をXHRで取得してblob表示する経路の分類を誤った。[初期resource-classification記録](../QA/PRODUCTION_INITIAL_RESOURCE_CLASSIFICATION_FINDING.json)を保持し、実HTTP画像をMIMEで分類してbody/encoded/decodedの計上を一致させた。ゲームの欠落画像やruntimeエラーを直した記録ではなく、監査方法の修正である。素材31枚の容量、実際のroute初回ロード量、圧縮後transfer量を同じ指標として扱わない。公開承認と人間A〜Nは引き続き未実施。

## 評価の約束

完成後のcanonicalはDesktop1920×1080とMobile390×844。小さい/横長画面はQAで別途確認。タイトル、通常プレイ、失敗/終了、特殊選択と受諾後の実画面を取得する。独立Visual ReviewerがA〜Hを実画面から採点し、80以上・Gameplay Readability12/15以上・Production Value12/15以上でPASS。最大3回後も不合格なら`HUMAN ART REVIEW REQUIRED`。

重要テキスト・数字・正確なGrid/物理矩形・動的液面・入力領域はコード。44px操作を保ち、生成画像の装飾が意味や当たり範囲を変えない。新ゲームの最適化目標は各Briefに記録している。ロード/FPSは別QAの実測が必要で、画像が軽いことだけで60FPSを保証しない。

各新ゲームの人間A〜N（面白さ、先への興味、特殊選択、ネタが邪魔しないか）は未実施。自動oracle操作で特殊地点へ到達しても、人間の記憶・判断・反射や再挑戦したさの証拠にしない。素材生成とこの文書だけで公開を完了したとは扱わない。
