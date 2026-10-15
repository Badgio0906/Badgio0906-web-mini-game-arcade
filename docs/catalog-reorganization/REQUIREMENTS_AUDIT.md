# 全要求の最終候補監査

2026-10-15 UTC。正本 [REQUEST.txt](REQUEST.txt) 第0～75章と、working runtime／登録／固有仕様／実行証拠を照合したread-only監査。desk_rain担当。009/017の実装参加者であり、この2作品の独立Feel／Visual判定は担当していない。002003005006の標準イベント4行と005CSSは監査後にMainから限定追補を依頼されて実装し、Mainの独立再確認対象とした。それ以外の監査対象sourceは変更していない。CURRENT_STATUS／最終報告はMain所有。

照合基準は開始main `4b32be51d8673906347cf69a3175d79ff5ed1c3c`、監査時HEAD `4ab395b` と今回のworking差分。固定候補c057等の過去QA、workingでの限定修正、最終統合候補のQA、正式配信を区別する。古い固有報告の「未実施」を、後段証拠が存在する場合に未実装へ読み替えない。

判定用語：**実装確認**＝source／定義に要求がある。**検証待ち**＝実装はあり、最終候補での独立画像／通常入力等が未完了。**公開待ち**＝正式workflow／配信照合が未完了。**人間未評価**＝本人試遊、物理スマホ、実機聴感等。実装確認だけで完成版／面白さ／公開合格とはしない。

## 先に報告した不足と処置

1. 第60章：002/003/005/006はscore内newBest flagのみで独立best_updateがなかった。Main指示で各mainに既存の厳密な改善境界と同じ条件の1行だけ追加。check／対象35test／diffcheck合格。[4行限定差分と前後SHA](QA/BEST_UPDATE_LIMITED_DIFF.json)。実装者による自己承認は行わずMainの独立判定へ渡した。
2. 同章：024のquit/score、027と035のquitがなかった。別担当がmainのみ追補し、当監査者がJev回答を読まず独立に既存training／active／reported／current guardと一度だけの終局を確認。追加event文を除くと3ファイルとも記録済みbefore SHAに完全一致。[独立source確認](QA/standard-events-024-027-035/INDEPENDENT_SOURCE_READ.json)。runtime event数は担当の限定probeと分離。
3. 005実画像：844横画面で固定heightと中央揃えによりboardがscorebarへ重なる、390/844の結果共有がgridの狭い1列へ入る。Art Directorが別々のD findingを担当。Main指示で005style.cssのみを自然高さ／上揃えと共有全幅へ修正した。**修正後a32344bで390/844の通常FEVER→結果を再取得し、rect非重複／共有全幅を確認**。[限定再検証](STAGE3_005_006_FINAL_RETEST.md)。独立Visual得点はArt Directorの実見判断へ。初回475assertionの機能QAをVisual合格へ読み替えない。

これらを除き、監査で新たな主要ゲーム機能の未実装は検出しなかった。以下の検証待ち／公開待ち／納品待ちは、完了扱いにしない。

## 第1工程・保護範囲（0～8、67、70章）

| 要求 | source／証拠 | 判定 |
|---|---|---|
| 最新main・branch・worktree・公開数・画像生成／レビュー利用可否の記録、他作業保全 | IMPLEMENTATION_REPORTの開始記録、各固定候補source、ImageGen原本／prompt／hashと担当の実利用記録 | 記録あり。最終branch/commit/PRはMainで確定する。 |
| 本人認定の完成9作だけcomplete | gameCatalogの001/016/018/019/020/022/023/025/032のみoverride | 実装確認。他はtrial。 |
| 004/007/021 retired、010継続retired | publicationStatus、元URLのnoindex退役HTML、旧HTML保管 | 実装確認。第1工程公式配信と直接URL操作の証拠あり。 |
| 026/028/029/030 hidden、旧URLのプレイ／保存／操作維持 | hidden独立集合、元HTML/runtime維持 | 実装確認、第1工程で旧URL確認済み。 |
| 008を残す、完成9作・対象外ゲーム・Godot／031世界／032水槽を不要変更しない | 開始mainから対象のsrc／HTML／public/gamesのgit diffは空。008はactive、表示006 | 保護を確認。共通recordsの追加は対象ゲームの得点・保存を変更しない。 |
| activeだけ元releaseOrder順に001～027、内部ID/route/releaseOrder維持 | displayNumbersFor／gameDisplayNumbers、DISPLAY_NUMBER_MATRIX | 実装確認。active27／hidden4／retired4／historical35。 |
| filter/favoriteで番号不変、hiddenを再掲載しない、hidden favorite自体は削除しない | portalはactive catalogだけ表示し全historical IDでfavorite保存検証、番号は全activeから先に導出 | 実装と第1工程QAあり。最終27件統合は再確認する。 |

## 9作品の改修（9～43、63、65、68章）

| 対象／章 | 確認した必須機能と公平性 | 記録／証拠と残る判定 |
|---|---|---|
| 002／9～12 | 乗車距離基準1000mごとの2→4上限加速、区間積分による加点・遡及掛け直しなし、NICEを二重掛けしない。roadTime最大2.6、波間隔／隣接移動／予兆、sweep判定。元通勤区間を実質等速維持。 | bestScoreV2/bestDistanceV2、rules2／旧r1保持。単体12000mの通常入力方策。通常browser初期／上限域はstage2固定候補の報告で最終確定。 |
| 003／13～18 | 10種類の実rectangle union compound、密度／重心、重力・回転・摩擦・滑り・再接触・崩壊。左右／回転／DROP。芸術点は接触と実重心回復・静止条件、交互配置だけでは不可。120試行。ImageGen背景／facade。 | rules3:best/bonus、旧best/rules2保全。phantom demoはtitleModeへ限定済み。独立CODE review、最終小画面／横画面は追加CSS版の画像で確定する。 |
| 015／19～22 | 連続sine巡回鳥・予兆・方向、通常経路の移動床8/12/16振幅と5.2/7/9period、床差分による位置継承、12経路（中央／同側／短い落下／橋／鳥／深いsoft）。実物理の64seed/長距離攻略方策。 | bestR04／rules04、旧best／r03保全。モデル成立と、鳥・移動床を通常browserで実際に経由した証拠は分ける。 |
| 024／23～28 | 開始時／毎変化3～7新抽選、実障害物配置、96試行上限、安全な身体／餌／直進／隣接予約とflood fill、650ms停止とqueue破棄、縁で安全出口。長さ160から壁撤去、400マスclear。 | state-shifting-v2、旧state不変、rules2／旧r1保持。壁・餌・身体・残数・seed・方向・速度・score・演出msを保存。全閾値／復元／長蛇／clear単体あり。 |
| 027／29～30 | 正本match／phaseから大きなturn banner、human/CPU/2人/球移動/白球配置/休憩/勝者、CPU思考後350ms予兆、世代tokenとtimer取消。 | 物理・CPU精度・勝敗・記録rules1不変。非競争の対局数なのでscore/BEST更新イベントの適用外は説明可能。横画面の最新aim文字／操作列は追加CSS版で確認。 |
| 005／31～33 | 3ミス、combo倍率、8正解で6秒fever・倍点・テンポ、終了して再充填。rule変更0.95秒、表示と判定を同一ruleで導出、fever途中終了でparcel期限は変えない。 | best-rules-v2、score.rules2／旧sorted.r1保持。独立native4画面fever／ミス／結果／BEST確認済。上記Visual2件はa323の390/844で技術再確認済み、独立Visual判定はArt Directorへ。 |
| 006／34～36 | RUN一回C／専用button、連続したposeから反対曲率の実軌道。予測／衝突／有限brake／包含／採点は同じpiecewise path。切返し自体の無料加点なし、無使用成功も可能。 | best-rules-v3、旧v1/v2保持。通常Cの実駐車と結果／BESTを4画面確認。切返しbutton操作は初回使用まで、物理スマホ操作は未評価。静的BEST V2ラベルはV3へ修正しa323全4幅画像で確認、公式配信の版照合はMainへ。 |
| 009／37～39 | 12固有問題に目的・見えるclue・操作列・正解・hint。紙／書類／引き出し／小箱／memo等を調べて2～3段階で発見。全開始offset×全問題を自動解検証、hidden target直選択不可、native44px以上。発見animation。 | bestRules3、旧best/bestRules2保持。練習は紙→ペンと引き出し→小箱→印鑑の実2問、時間無制限・記録除外。認知の手応えと単純連打感は本人／独立Feelへ。 |
| 017／40～43 | 横視点2D、5種安全地帯、左右/Space/専用dash、0.48秒dashと1.7秒recharge、小雨→大雨→突風と1秒予告、濡れ0～100・屋根回復・MAX失敗、前進距離と初到達のみ加点。 | bestRelayV2、旧best保持、rules2／旧r1保持。通常モデル攻略で11地点、repeat入力防止と境界配置を追補。旧描線モデルも比較用に保管。最終通常browser・Visualは独立担当へ。 |

上記各作品はTECHの成立と、人が工夫したくなるかを分けている。ユーザー63章の「面白くなった」は当監査で断定しない。

## 新作（44～57、61、69章）

| 要求 | 確認した実装 | 判定／残り |
|---|---|---|
| 033 一ボタン長押し・離す高度、目標・combo・重なる開花・特別花、90～120秒／無制限練習、retry/BEST | 100秒と最後の飛行中開花、誤差採点・1.8秒/205px連鎖・4連続二重輪、最大900粒子/6rocket、煙・残光・反射・音、ImageGen夜景。満タンが万能でない単体。 | 実装確認。focus修正はstart/resumeのlaunch.focus。通常100秒完了・最終Visual／実画面thumbは統合QA／納品待ちとして扱う。 |
| 034 8種以上・最大3選択・実物理崩壊・目標／小屋／少数操作／難度採点・練習/BEST | 8個のtoy、実部品除去、Matter120Hz、8秒の質量・低下・接触採点、slow、8現場合計の完了BEST、練習world分離。 | 実装確認。独立全cut列挙で発見した最終面clean不能はtank25px移動のみで修正、全25選択再列挙でclean解1通りを確認。通常8現場完走・最終Visual／実画面thumbは検証／納品待ち。 |
| 035 drag方向/強さ・予測/準備状態・摩擦/衝突・3end程度・相手配置・guard/寄せ/排除・独自採点説明 | 3end各最大3投、全色共通摩擦と等質量円衝突、反射/氷/実ImageGen石、少投球・連続好配置を含む説明、保存／途中復元。 | 実装確認。個別prod4画面drag練習、native9投4853点、結果reload/BEST/再試行の証拠あり。音BFCache限定修正と最終統合版の証拠は版を区別。 |
| 3本を同じtemplate/engineへ無理に統一しない | 033粒子Canvas、034Matter toy物理、035円衝突氷上モデル。共通Storage/Audio/Telemetry/recordsのみ利用 | 実装確認。 |
| Art Director、実ImageGen、原本/prompt/hash、WebP、実view、図形は動的描画へ | 各ART_DIRECTION、assets/reorganization-2026-10-15/asset-indexと各game provenance | 実利用記録あり。素材生成成功を最終Visualへ読み替えない。 |
| HTML／src／manifest／入力／練習／結果／BEST／音／Catalog/tag/番号/status／Vite／記録／版／Analytics／tests/docs | 033～035全登録、Vite regex03[0-5]、新recordDefinitionsとgameVersions、Analytics pendingを維持 | 実装確認。最終dist/HTTP照合は統合QAで確認。 |
| サムネイルは実画面由来 | 035はactual-source／crop/hash／640×360採用済み | 監査時033/034のpublic/assets/portal画像と採用台帳はまだない。通常実画面採取後の納品待ち、架空画像で埋めない。 |

## 共通UX・保存・サービス（58～60、70～72章）

| 要求 | 照合結果 |
|---|---|
| 左上通常一覧帰還、説明／練習／すぐ遊ぶ、PLAYカード、favorite、tags、complete状態 | 既存portal/navigationを保ち固有game UIへ接続。最終12作品4画面・pause/result/inert modal・backは各固定候補QAで確認して最終一覧へ集約する。 |
| 44px、長押し対策、mute、pause、retry、PC/phone | native button/min-size、共通touch guard、pagevisibility/blur pause。実机／横小画面は見た目別に検証し、今回005Visual修正後も画像再確認する。 |
| 旧BEST・旧候補・旧boardを残し、新版へ混ぜない／過去を新RUNとして再送しない | 8改修の旧scalar/JSONキー保全、新版キー別、historicalRecordBoards8本、queueはboardごとのsafeSubmission、revised eligibilityをrules別へ。個人記録はreadonly adapter、共有は新startRunの確定結果だけ。 |
| 027は表示だけでrules変更なし | rules1維持、presentation_versionのみturn-banner-2。 |
| 旧ランキングを壊さず新8＋新作3board追加 | [WORKER_PUBLICATION.json](QA/WORKER_PUBLICATION.json)：既存20board default維持、要求queryで32board、改修8＋新3のTOP10 GET200を記録。既存D1初期化／migration再適用／架空player投稿は行わない運用を記録。 |
| Analytics同意とrecords共有を分離、pending一括解除しない | Analytics021～035 pending維持、新3はremoteCollectionEnabled:false。records登録確認は別gate、新11boardは確認後のみ解除、032records pending維持。 |
| 最低共通events | 009/017先の追補、4作best_update追補、024/027/035追補を含めsource上適用対象へ存在。027非競争のscore/bestは適用外。送信はframeごとでなく疎な境界。実件数は最終event probeで検証。 |
| AdSense/CREDIT/報酬広告/GA4同意/対象外ゲーム不変 | arcadeConfig.creditsEnabled:false維持、当該設定／GA4同意／広告の監査対象差分なし。Godot全面移植／031世界／032図鑑水槽のsource差分なし。 |

## 検証・公開・納品の残り（62～75章）

- 最終workingへ上記標準events／005CSSを統合した後、source固定、必要な対象test＋全体check/test/build、独立Visual／通常入力の限定再検証を行う。旧候補での成功と追加修正後の成功を同一版としない。
- 第1工程は公式Pages run38749424619／公開配信110ファイルSHA一致と通常操作の証拠がある。**第2～第4工程の最終公式workflow・公開URL・配信版照合は監査時点で公開待ち**。Worker登録成功をPagesゲーム配信成功へ読み替えない。
- 033/034の通常最後まで、実画面由来サムネイル、最終12作品のVisual/Feelと4画面各状態、追加events、最終ポータル27件・hidden旧URL/retired案内・root/subpath・back・保存拒否／reloadの検証台帳をMain最終報告へ接続する。
- 各対象の固有仕様／改修報告／QA／引継ぎ、新作3本のART_DIRECTION／SPEC／REPORT／QA／HANDOFFは存在する。初稿の「未実施」は後段の実証へリンクして更新する。CURRENT_STATUS、最終A～F（変更/操作/score/版/保存/通常QA/Visual/公開/人間）の取りまとめはMainが確定する。
- 本人未試遊、物理スマホ、音の実機聴感は未評価のまま明記する。AI技術QAでcompleteを増やさず、宣言済みの9本だけを完成版として保つ。

現時点の未完了は主に最終候補の検証、033/034実画面サムネイルと報告反映、工程2～4の正式配信である。未完了を成功と記載せず、重大findingが残る作品は独立に保留する。

## 監査後の統合追補

上記は監査時点の未完了を保存した記録。現在の固有通常QA、12実画面thumbnail、独立Visual、compiled48組、Portal27件のroot/subpath150項目は完了した。source差分・初回collector failureを [FINAL_SOURCE_CHAIN](QA/FINAL_SOURCE_CHAIN.json) と [最終報告](FINAL_REPORT.md) へ接続。各工程の正式公開結果は [PUBLICATION](PUBLICATION.md) を優先する。人間評価は引き続き未実施。

最終追補：第1～第4工程の公式公開と公開後確認が完了。第4工程9f655a98／Pages38767797394成功、固定1090tests/102files・check/build、配信177file一致、公開48組/2714checksと一覧122checks成功。監査時点の残りは解消し、本人/物理端末/実機聴感/連続FPSだけを未評価として残す。
