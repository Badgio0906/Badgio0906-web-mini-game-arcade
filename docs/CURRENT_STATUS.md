# CURRENT_STATUS — 現行状態と再開地点

2026-10-10（日本時間）：**PLAY優先・全30作品の帰還ナビゲーションを実装、公式公開前。** 黄色48px PLAYをBEST直下、cream TOP10を紹介・タグ下へ。全作品を左上44px「← ゲーム一覧へ」へ統一し、native modal代理・入力隔離・既存quit/save hookを保持。012〜014外側shell/templateだけ変更、runtime実byte不変。031PC/touch6保存退出case、ranking118、portal root/subpath1,234、単体887/79・check/build・offlineJev25合格。長い説明menuの022/023/024/028重なりを修正し独立56case再確認合格、最終30作品×4幅120画面・修正4作品のcompiled48caseも合格。viewportはnative26HTMLをcontainへ統一。物理端末／音／誤押下率／全終局完走は未評価、001320px既存clipはbaseline比較済み。Worker／D1／得点／保存format／広告／GA4／CREDIT不変。[実装報告](navigation/IMPLEMENTATION_REPORT.md)／[再開](navigation/HANDOFF.md)。

2026-10-09 JST：**全体BEST＋TOP10 STEP2本番D1／Worker接続・公式Pages公開確認済み。** 既存DB/Worker/binding/cron/Secret名を保持しTime Travel復旧点確認後に0002/0003適用。標準CLI解析エラーはDB無変更を確認し、原SQL不変の送信時CASE/END空白補正で解決、実localD1成功/rollback5。events8474/daily59保持、record参加者・投稿0。OFF21→ON143・全20board空ランキングとBEST/TOP1/revision確認、Worker cbf37eec稼働/RECORDS_ENABLED true。Github Variables管理403、Variables優先＋指定公開URLfallbackとorigin検査でPages接続実装。接続commit8eb3024／公式37933537264 build/deploy成功、配信164file SHA一致・公開4画面132項目・全20TOP10 PASS、共有初期OFF／全POST0・PC/phone通常001個人BEST一致。root887/79・records local29・Analytics37・8作品PC/phone16ケース96項目。一般Analytics/GA4/広告/CREDIT/ゲーム/旧migration不変。実プレイヤー受信／人間評価未確認。[報告](leaderboards/step2/IMPLEMENTATION_REPORT.md)／[次の操作](leaderboards/step2/HANDOFF.md)。

2026-10-09 UTC：**全体BEST＋歴代TOP10 STEP1を実装・ローカル検証・公式Pages公開済み。** 20board／ブラウザ資格単位1枠・独立ガレージ住人名、加算0003／既存台帳保持・取消次点、GET TOP10、4viewport modal。root887/79・workerd D1 records29/ranking24/Analytics37・性能500/5k/50k読む31行・固定UI118/共有103/準備18・独立SQL15/frontend5。ゲーム本体／012–014固定export／Analytics・広告・CREDIT・ID・旧migration不変。今回Cloudflare既存認証は読み取り成功、正しいD1は0001のみ・records未有効・API404。STEP1本番DB/Worker書込みと架空投稿なし。runtime b63c819／公式37924667044 build/deploy成功・配信164file SHA一致・公開4画面34項目PASS。Pagesは準備中UI公開済み、ランキングWorker本番稼働／実投稿受信は未完了、実機人間評価とは区別。[報告](leaderboards/IMPLEMENTATION_REPORT.md)／[本番接続](leaderboards/HANDOFF.md)。

2026-10-09 UTC：**Godot012–014の個人記録連携を試作公開確認済み。** runtime48d8003／公式Pages37878543797 build/deploy成功、公開164file SHA一致。PC/phone3作6RUN36checks＋Portal4画面/30cards/既存001結果36checks。012旧400/new0最大保持・初回0の元cfg欠存とconfirmed mirror0区別、013OJT全RUN/練習分離、014元成功0〜25、新版ConfigFileと小型mirror。root872/77・check/build・Worker記録29/20board＋既存Analytics37・native74/179/12224成功、strictaudit/importer保全。Jev21実HTTP200/84有効回答、独立比較・誤観測/注釈数の明示訂正を保存。本人/実機/音未確認、012元phone切れ・014元横小文字制約。共有本番準備中・無効、Worker/D1/Secret/広告/CREDIT/GA4/他ゲーム不変、21旧tree/018未commit保全。active30/historical31/次032未着手。[報告](legacy-records/IMPLEMENTATION_REPORT.md)／[再開](legacy-records/HANDOFF.md)／[公開状態](legacy-records/QA/PUBLICATION.json)。

2026-10-09（日本時間）：**ポータル「あなたのBEST」を本番公開済み、「みんなのBEST」は準備中・共有無効。** runtime `9b9d3f9`、公式Pages37806261132 build/deploy成功、公開110配信file SHA一致・4画面36項目/30カード/通常Game001結果→Portal BEST一致。本番Cloudflare未認証で記録D1 migration/Worker反映は未実行、承認済み代替の個人表示のみ公開。27作品の個人BEST/進捗、競争17の全体board設計、非競争10、技術未対応012–014を区別。root861tests/check/build・Worker24＋既存37・4画面Portal/共有・7作品14通常操作成功、独立Visual84/F13/H12。Jev16実API/HTTP200/有効4回答/独立判断、risk見逃し4を記録。元BEST/031世界/物理/素材/広告/CREDIT/GA4/一般Analytics送信制御、17旧作業treeを保持。実機/本人/実BFCache/本番投稿は未確認、Ads通信はCloud環境で拒否。active30/historical31/次032未着手。[実装・公開報告](records/IMPLEMENTATION_REPORT.md)／[全作品表](records/GAME_RECORD_MATRIX.md)／[後続運用](records/OPERATIONS.md)。

2026-10-08 UTC：**Game031 A案・提供8テクスチャを本番公開確認済み。** runtime `b891ceae429a9df0bd87b43c04a520ae214114ff`、公式Pages37729093975 build/deploy成功。標準512/軽量256の全16WebP＋manifest17配信SHA/decode一致、HTML/JS/CSS/thumbnail13file＋公式CI名一致、公開両品質の実8表面を確認。公開PC旧保存3/1継続＋11/5追加→14/6、phone相当12/5・多指/cancel・390/844/320・保存reload一致、Portal30/Ads script/同意UI維持。check・831tests/72files・build・offline25、通常ローカル104/50、独立Visual84/F14/H12、Jev実API7/HTTP200/有効28回答＋独立判断。softwareGPU中央値標準23.6→27.8ms/軽量22.35→24.2ms、実機/本人の主観未確認。X128/Y64/Z128・gen/save/block/rules1・世界/所持/物理、旧203game source・15worktree/018未commit・広告/GA4/CREDIT/同意/Workerと本番送信停止を維持。active30/historical31/次032未着手。Cloud許可先外のGoogle Ads通信エラーは広告配信未確認として記録。[報告](game031/textures-a/v1/IMPLEMENTATION_REPORT.md)／[公開証拠](game031/textures-a/v1/QA/PUBLICATION.json)／[再現](game031/textures-a/v1/HANDOFF.md)。下の素材未受領記録はZIP受領前の履歴。

2026-10-08（日本時間）：**Game031 A案テクスチャ改修は素材受領待ち。** 最新main2d74511から専用枝codex/game031-textures-aへ隔離。指定Windowsフォルダ／Windowsマウントなし、添付は指示書のみで8画像未受領。現行32px atlas／UV／filter／paletteを調査し、[受領記録・再開計画](game031/textures-a/v1/ASSET_INTAKE.md)へ保存。今回は文書準備のみ、ゲーム／保存／広告／CREDIT／Analytics・公開版不変、commit/push/deployなし。8画像またはZIPの受領後に実素材導入・QA・公開へ進む。

2026-10-08 UTC：**Game031「掘って、置くだけ。」を技術QA済み試作公開済み。active30/historical31、010退役、次032未着手。** runtime aead0cf、公式Pages37709128212 build/deploy成功、期待公開13file SHA一致。X128/Y64/Z128一人称、人物/手/道具なし、掘る/置く/衝突/IndexedDB/backup/任意練習。通常103採掘50配置＋天然空洞、公開PC11/5・phone相当12/5と地形/所持の保存reload・Portal30/640thumb/Ads/同意UI維持。check・816tests/71files・build・offlineJev25、WorkerlocalD142events13RUN、独立Visual82/F13/H12。15旧tree/018未commit保全。031本番Worker認証不足・externalOFF、021〜030pending維持、既存広告/GA4/CREDIT/D1schema/認証/旧ゲーム本体不変。本人/物理端末の主観未試遊は公開承認と区別。Jev16実HTTP200/64有効回答＋独立判断、失敗記録保全。[報告](game031/IMPLEMENTATION_REPORT.md)／[公開証拠](game031/QA/PUBLICATION.json)／[再開](game031/HANDOFF.md)。

2026-10-08（日本時間）：**第2バッチ026〜030の5作品を試作公開・候補表更新済み。active29/historical30、010退役維持、031未着手。** 030最終runtime `bd0d293`、公式Pages37682943758 build/deploy成功。指定4画面78check・PC/phone全20面＋再挑戦21clearずつ、Portal29/Ads/640thumb/13file配信SHA確認。Sheet A33/A47/A11/A42/A49のみ済、各読戻しで他列不変。最終root737tests/67file・check/build、Jev offline25、Worker実ローカルD138events12RUN成功。Jev実API28/HTTP200/有効4回答を監査、schema-only不要1件・029のShadow前修正などの不備は[利用報告](classic-batch-two/JEV_USAGE_REPORT.md)。初回030 Vite登録漏れは配信照合で検出・修正し、失敗証跡/実config回帰を保全。旧9tree/018未commit182file保全、ゲーム固有旧source/save・広告/CREDIT/GA4/D1 schema/Secret不変。**本番Workerは再確認でも未認証、021〜030の外部収集停止とpendingを維持。** 本人/物理スマホ主観未試遊は公開承認と区別。[全公開証拠](classic-batch-two/IMPLEMENTATION_REPORT.md)／[再開方法](classic-batch-two/HANDOFF.md)。

2026-10-08（日本時間）：**030公開確認を停止しビルド登録を修正。** e973cf9の公式CIは成功したが、Vite列挙のgame030接頭辞欠けにより物理HTML/assetが未出力。配信版照合でENOENTを検出し、実ブラウザ/Sheet済の前に停止。game030だけの登録式を修正し、実Vite設定から全catalog physicalrouteを確認する回帰テストが修正前FAIL→修正後PASS、全737tests/67file・check/build成功。030本体/保存/物理不変、Worker38events12RUNの変更なし。修正commit公式CI/配信版/通常操作/A49は未完、026〜029公開済。

2026-10-08（日本時間）：**Game029「給湯室の落としもの釣り」を試作公開済み。runtime8d3ac39／公式Pages37681354491成功。** 公開指定4画面の通常投→回収→結果/再挑戦/保存/練習、Portal28/640thumb/Ads維持、13file配信SHA＋CIasset確認、SheetA42だけ済/他列不変読戻し。最後の030は固定20面・独立解法1260route・39対象/root736（66file）/check/build・WorkerlocalD138events12RUN、独立Visual82/F13/H12とPC/phone全20面を完了して公開前。active29/historical30、026〜029公開済、030公式CI/公開/A49待ち、031未着手。Worker既存auth再確認でも未認証、新作externalOFF/中央pending維持。本人/実機主観未実施・旧9tree保全。

2026-10-08（日本時間）：**Game028「ぽんぽん卓球」を試作公開済み。runtime4310be3／公式Pages37680233126成功。** 公開指定4画面125check・通常5点試合終局/再挑戦/保存、Portal27/thumbnail/Ads維持、13file配信SHA＋CIhash-namedasset確認、SheetA11だけ済/読戻し。他ゲームsave不変、root666/64/check/build・WorkerlocalD132events10RUN。続く029はsource06/27対象/root695/65・check/build/Worker35events11RUN、指定4画面通常結果/再挑戦・独立Visual81/F12/H12を完了して公開前。active28/historical29は次commit統合予定、030未公開・031未着手。本番新作AnalyticsOFF/Workerblocker、本人/実機未試遊を継続。

2026-10-08（日本時間）：**Game028「ぽんぽん卓球」を統合検証し公開前。** 疑似2.5D球高/反発・11点deuce/任意5点・CPU3難度・任意無得点練習・保存復帰。47対象/root666（64file）・check/build、Worker実ローカルD132events10RUN PASS、作者128nativechecks・独立PC900/phone実操作とVisual81/F12/H12。旧作者desktop1000と今回要求900は区別し、公開通常完走900を予定。active27/historical28、026/027公開済、028公式CI/公開/SheetA11待ち、029/030未公開、031未着手。旧9作業tree・018保全、外部新作AnalyticsOFF・本番Workerblocker継続、本人/実機未試遊。

2026-10-08（日本時間）：**Game027「ひと息ビリヤード」を試作公開済み。runtime ff369e5、公式Pages37675920015のbuild/deploy成功。** 公開4画面native・通常PC22/phone23shotsのlegal8終局、結果/再挑戦/保存、Portal26/thumbnail確認。期待CI hash-named JS/CSS＋同公開設定再現buildとの13fileSHA一致（artifact直取得不可の制約を明記）。候補表A47だけ済／他列不変・読戻し。[公開証拠](game027/QA/PUBLICATION.json)。root617/62・40対象・check/build、WorkerlocalD129events9RUN。独立Visual81/F12/H12、本人/実機主観は未実施。active26/historical27、026/027公開済、028〜030は未公開・031未着手。新作Analytics送信停止、本番Worker認証blocker継続。

2026-10-08（日本時間）：**Game027「ひと息ビリヤード」を統合検証し公開前。** 16球・6ポケット・8ボールhouse rules、CPU3難度/同端末2人、任意練習、固定時間step物理・全shot一括裁定・inflight保存/pause。40対象・root617/62・check/build、Worker実ローカルD129events9RUN、4画面nativeと通常PC22/phone23shotsでlegal8終局・結果/再挑戦/保存を確認。独立Visual81/F12/H12。[027報告](game027/IMPLEMENTATION_REPORT.md)。active26/historical27、旧save/BESTと010退役不変。026公開済・A33済、027の公式CI/公開/Portal/A47はこの時点では未完。028〜030未公開、031未着手。新作外部AnalyticsOFFと本番Worker認証blocker維持、本人/実機未試遊。

2026-10-08（日本時間）：**Game026「出世すごろく」を正式URLへ試作公開済み。runtime cd6d7ad、公式Pages37669966367のbuild/deploy成功。** 公開4画面44項目・PC89turns/phone61turns通常完走、結果・再挑戦・保存/入力・Portal25/サムネイルを確認。期待commitの公式CI一覧と同じhash-named JS/CSS、公開13fileのSHAを同公開設定の再現buildと照合（artifact55MiBの転送上限により直接ZIP照合は不可、手法を明示）。候補表A33のみ済／他列不変・読戻し確認。[公開証拠](game026/QA/PUBLICATION.json)。root575/check/build、27対象、独立Visual81/F13/H12。作者本人・実機試遊未実施、新作Analytics外部OFFと本番Worker認証blockerを維持。027〜030は検証中・未公開、次031未着手。

2026-10-08（日本時間）：**第2バッチ026〜030の実装・検証中。026「出世すごろく」は統合検証575 tests／check／build、27対象、4画面実操作とPC/phone通常完走、独立Visual81を完了し公式公開前。** active25／historical26、010退役維持。027〜030は別作業枝で検証中・未公開、次031未着手。結果までの通常操作・期待CI/配信版・Portal掲載を確認してから対象Sheet A33/A47/A11/A42/A49を順次更新する。[報告](classic-batch-two/IMPLEMENTATION_REPORT.md)／[引継ぎ](classic-batch-two/HANDOFF.md)。旧9作業tree・018未commit182fileは保全。Workerコード登録とローカルD1は許可範囲、本番認証不足で新作の外部収集停止を維持。広告／GA4／CREDIT／Secret／D1 schema不変。本人・実機未試遊公開は承認済みだが主観評価は未実施。

2026-10-07 UTC：**定番5作品021〜025の試作公開・候補表更新が完了。** 最新runtime `9e02494`、公式Pages37655713679成功。025公開4画面通常操作／Portal24／配信thumbnail SHA一致、A72だけ済／読戻し確認。全545テスト／56ファイル、check／build、Jev helper25テスト、WorkerローカルD123イベント7RUN成功。各公開SHA・URL・Sheet結果は[バッチ報告](classic-five/IMPLEMENTATION_REPORT.md)。active24／historical25、010退役維持、次026は未着手で今回バッチ終了。Jev21実API／HTTP200／有効4回答を独立監査、risk見逃し3件と手順・証拠の不備は[利用報告](classic-five/JEV_USAGE_REPORT.md)に明示。新作本番Analytics登録は現環境の未認証で保留・外部送信停止、既存020登録保持。作者本人／実機の主観試遊は未実施。元018未commit182file保全、広告／CREDIT／GA4／既存ゲーム固有ソース不変。再開は[HANDOFF](classic-five/HANDOFF.md)。

2026-10-07 UTC：**Game024「ひとマススネーク」試作版を公式公開済み（runtime c7fde20、Pages37653078771成功）。** fixed4/6/8・20×20・queue2・任意練習・速度別BEST／保存。root514tests/check/build、Worker20events6RUN、公開4画面58項目／Portal23／配信thumbnail SHA一致。候補表A48だけ済／読戻し確認。[公開証明](game024/QA/PUBLICATION.json)。headless focusfixture・失われた一部の隔離最終画像は記録を区別。本人／実機未試遊、新作外部収集停止・本番Worker認証blocker継続。active23／historical24、次025。

2026-10-07 UTC：**Game023「伏字ことば」試作版を公式公開済み（runtime de5327d、Pages37651114868成功）。** 独自180語／6カテゴリ／全かな3タブ、wrong8・hint・次問、任意説明／2語練習。root486tests/check/buildとWorkerローカルD117events5RUN、compiled4画面・統合4画面成功、Visual83/F14/H13。混合入力・横向き答えscrollを当ゲーム内で修正。active22／historical23、次024。公開4画面・Portal22・配信thumb SHA一致、候補表A31だけ済／読戻し成功。[公開証明](game023/QA/PUBLICATION.json)。新作外部Analytics停止・本番登録blocker継続。

2026-10-07 UTC：**Game022「ひと息ソリティア」試作版を公式公開済み（runtime cc7f851、Pages37649806664成功）。** 52枚Klondike／1枚・3枚／random・JST daily、説明・6枚練習任意、hint／undo／単札assist／可証明の全整理。root457テスト・check・build、独立fixture全消去4画面、compiled通常操作4画面成功。保存上書き・touch capture・OFFスクロールCSS競合を当ゲーム内で修正。実通常配りからthumbnail、Visual／Feelは別記録。active21／historical22、次023、既存ゲーム不変。公開4画面操作、Portal21、thumbnail配信SHA一致を確認。候補表A26だけ済／読戻し成功。[公開証明](game022/QA/PUBLICATION.json)。新作Analytics本番登録は未認証で保留・外部送信停止、既存020登録保持。

2026-10-07 UTC：**Game021「ならべて4つ」試作版を公式公開済み（runtime a4555f2、Pages37644262587成功）。PC／phoneを含む4画面の公開操作、Portal20掲載、実プレイthumb配信hash一致を確認し、候補表A29だけ「済」へ更新・読戻し確認。** 7列6段の古典四目並べ、CPU3難度／先後／同じ端末2人、任意hint／待った／説明／練習、途中保存と明示再開。active20／historical21、010退役維持、次ID022。4画面compiledと独立CPU全6設定・入力・保存の確認、Visual83/F13/H13。[報告](game021/IMPLEMENTATION_REPORT.md)。新作Workerのコード登録とローカルD1確認済み、本番deployは現環境の未認証で停止。既存020登録は完了済みで保持。新作IDはPortalを含め外部送信停止中。[残作業](classic-five/QA/WORKER_DEPLOY_BLOCKER.json)。広告／GA4／CREDIT／認証／D1 schema不変。今回5作品の順次公開以外は着手しない。本人／実機の主観試遊未実施はユーザー許可済みの試作公開と区別。

2026-10-07 13:31 UTC：**Game020の既存Analytics Worker本番登録を完了。** `game100-analytics` version `16ad6d54-bf8d-4f39-be0f-f2176a83e57f`を100%配信。health／Codex game020／summaryはHTTP200、game019互換、game021拒否、未認証／Codex tokenのadmin拒否を確認。020観測RUN0は正常な空集計。Custom Domain、Cron `17 3 * * *`、D1 binding、既存Secret登録、保持期間、workers.dev／preview無効は維持。新認証・権限・ネットワーク変更、remote D1 migration、test event送信、Pages操作なし。[本番反映証拠](game020/QA/WORKER_PRODUCTION_DEPLOY_20261007.json)。以前の未認証／許可先外blockerは旧環境の履歴として保持。取得CLIの020許可漏れを隔離checkoutで最小修正し、対象38テスト／実ローカルD1の24確認成功。追加承認により取得CLI・回帰テスト・記録を最新mainへ統合する。公式Pages CIはこの統合commitのpushで確認し、Workerの再deployは行わない。

2026-10-07 UTC：**Game020「すっきり牌合わせ ～PAIR TILE～」を公開済み、追加承認されたGame018 revision03も安全に統合・公開済み。** 新作は24／48枚の古典牌合わせ、独自幾何学牌、時間制限・ミス罰なし、任意説明／8枚練習、ヒント／戻す／解ける残牌並べ替え。active19／historical20、010退役維持、次ID021は未着手。[020報告](game020/IMPLEMENTATION_REPORT.md)／[018統合追補](game018/revision03/PUBLICATION_INTEGRATION.md)。018は少年の全身・足首接合・選択値連動SPIN・ANGLE／射出方向の描画だけを採用し、物理／保存互換は不変。元018未commit作業は182fileとstatus／HEAD／branchを保全。本人未試遊の公開はユーザー明示承認済み、実機・主観評価は未実施。runtime `9e3c66d`、公式Pages run37625676913のbuild／deploy成功。公開020の4画面・018のPC／phone各2RUN・初回35／追補37配信fileの一致・Portal19掲載を確認。詳細は上記報告と020 QA/PUBLICATION.json。

**020 Analytics Worker登録も後で許可され、typecheck／実ローカルD1の23確認を完了。** 020 ingest・匿名admin/Codex詳細・summary、021拒否を確認。認証／Secret／権限／D1 schema／広告／GA4／CREDIT設定は不変。旧環境では`wrangler whoami`未認証・Cloudflare API許可先外でdeployが止まったが、既存設定を利用できる新環境で13:30 UTCに本番反映済み。[Worker登録記録](game020/QA/WORKER_REGISTRATION_RESULT.json)／[解消済みblockerの履歴](game020/QA/WORKER_DEPLOY_BLOCKER.json)。Pages公開とWorker本番登録完了は別。候補表A22は編集しない。

2026-10-07（日本時間）：**Codex Analytics取得スクリプトのネットワークシークレット対応を修正。** 非空tokenの独自文字種チェックと不要なエラーコードを削除し、プロキシ置換前のプレースホルダーをBearer値としてfetchへ渡す。Secret非表示・URL制約・redirect拒否・30秒timeout・応答の反射／生ID拒否は維持。実Secretを使わないfetch／ローカルHTTPテストを追加し、対象15件／root check／build成功（既存CSS・chunk警告あり）。[変更・検証記録](analytics/CODEX_ANALYTICS_ACCESS.md#2026-10-07-プレースホルダー対応の検証)。本番Analytics取得とゲーム・Worker・D1変更は今回未実施。

2026-10-07（日本時間）：**Codex本番Analytics取得 Phase 1を実装。** 専用`ANALYTICS_CODEX_TOKEN`でGET `/v1/codex/summary`／`/v1/codex/game/:game_id`だけを読み取り、adminの認証を分離したまま匿名集計ロジック・query検証を共用。`scripts/fetch-analytics-context.mjs`は必要な期間・ゲームのJSONをstdoutへ取得し、秘密値・生ID・redirect・エラー本文の出力を拒否。[仕様・使い方・制約](analytics/CODEX_ANALYTICS_ACCESS.md)。本番Secret設定、Worker deploy、Codex Cloud Secret登録、本番APIへの取得は今回未実施。ゲーム・広告・GA4・CREDIT・D1／event schema・本番設定は変更しない。Worker typecheck／実ローカルD1の19確認／root361単体（42file）／check／build成功。D1検証はsynthetic fixtureのみ。初回テストのrun1部分一致をUUID fixtureへ修正し再検証済み。取得結果はGitに保存しない。

2026-10-06：サイト正式名称を **100ガレ ～GAME100 GARAGE～** に統一。略称 **100ガレ**、英字 **GAME100 GARAGE**、ドメイン`game100garage.com`。変更は公開表示・title・description・現行文書と旧ページ生成templateの名称のみ。Game001はユーザー許可済みのfooter文字列1箇所だけを差し替え、ゲーム処理・015/019・広告・解析・Cloudflare・保存互換・URLは変更しない。旧称を記録した過去資料・ログは履歴として保持する。 check／345単体／build成功。compiled PC・390px・320pxで新名称・18作品link・AdSense保持・同意UI・pageerror0を確認。

2026-10-06：**Jev運用をrouting層として正式整理。** OpenRouter／`typesafe/jev-1.13`固定、schema v2のPRIMARY_CAUSE・CODEX_ACTION_REQUIRED・NEXT_EVIDENCE・RELEASE_RISK_IF_UNRESOLVED、Shadow Mode。0.45未満でも独立Codexレビュー継続、両見逃しを別記録、自動Gateなし。新規findingは[正本ルール](JEV_REVIEW_RULES.md)を適用。[評価・検証履歴](jev/JEV_EVALUATION_HISTORY.md)。ゲーム／Portal／公開runtimeは変更なし。

2026-10-06（日本時間）：**集客前の分析基盤・共通長押し対策・Game010退役を正式HTTPSへ公開済み。active18、次は020。** Game010 retired after human playtest：抜本改修後も本人試遊で面白くないため、AIテストの合否とは別の企画判断で退役。ID010/releaseOrder/過去コード/資料/Telemetry/profileを保持し、軽量noindex退役routeへ変更。Game015/019固有ソースと現在の本人好評価を維持。広告/CREDIT OFFも不変。[最新報告](analytics/REPORT.md)、[本番外部設定](analytics/MANUAL_SETUP.md)。Consent/GA/upload/Worker/D1/管理集計/集計exportまで実装・ローカル検証。本番Worker/D1/GA4は未設定・inactive。PR #5／runtime4608ac8、Pages37456340150のtest/build/deploy成功。公開全18作品×4画面＋portal/退役/privacyの84経路と70配信hash一致。公開状態と最終検証は最新報告・QA/PUBLICATION.jsonを参照。

以下は各公開時点の歴史。過去のportal19は当時の本数であり、現行active18へ全文置換しない。

2026-10-06（日本時間）：**対象7本（018／003／006／007／008／009／010）の改訂02を正式HTTPSへ公開済み。** [ゲームセンター](https://game100garage.com/)／[統合報告](seven-games-2026-10-06/REPORT.md)／[公開記録](seven-games-2026-10-06/QA/PUBLICATION.json)。PR #4はmainへmerge、runtime58718f9、Pages run37413280501のtest／build／deploy成功。315単体、compiled7×4画面＋7prefix、公開7画面の通常操作と保存再読込、39配信fileのhash一致、portal19を確認。対象外12作品は217保護fileとprofile／Catalog／thumb entry不変。今回7本の本人試遊・実機音/FPSは未実施。Game015とGame019は本人から「とても面白くなっていた。イイ感じ」の最新評価を受けた。両作品は今回変更していない。この好評価を全機能・全端末の詳細検証へ広げない。

以下は過去の公開時点の記録。015／019の現在の本人評価は上記を優先する。

2026-10-06（日本時間）：**Game019改訂02を正式HTTPSへ公開済み。** [ゲーム](https://game100garage.com/game019.html)／[最新報告](game019/revision-02/IMPLEMENTATION_REPORT.md)／[公開記録](game019/revision-02/PUBLICATION.json)。溜めて離すジャンプ、空中操作0、井戸12＋空12の手作り区間、地形による落下復帰、固定予告風、7練習へ再設計。294単体／check／build、4画面200m、compiled root／subpath各4画面20m PASS。他18本と共通303fileは不変。runtime `1a533e9d92114029086835bfc6f915848db49b47`、Pages run37385472480 build/deploy成功。公開4画面native20m・保存再読込とbrowser経路の配信hash一致、portal19cardを確認。最初のNode配信照合DNS失敗原本は保持。019 Jev profileと端末内記録を更新し、外部送信はない。旧版の方向×小中大や旧試作記録を現行仕様へ流用しない。人間評価は未実施。以下は前回公開版と歴史記録。

2026-10-06（日本時間）：**019を含む全19本を正式HTTPSへ公開済み。** 最新作業の正本は[統合報告](integration-2026-10-05/IMPLEMENTATION_REPORT.md)。今回は015改訂03、018少年／回転表示、全19本の開始3択とタグ、端末内400件JSON記録、019「井の中の蛙、大海を目指す」を追加。最終runtimeは`d6f6f6b9b193562a933e1cc728b739e770c478ed`、Pages run37330051749の284unit／build／deploy成功。公開PC／phone各19routeと27配信file hash一致。初回PCの単発503は全route再実行とHTTP200で復旧を確認。AdSenseは[独立PR #1](https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/pull/1)、root headのscript2行だけで公開済み。Google側の所有確認／審査と実機の人間試遊は未確認。

新しい継承境界：019は `game019.html`／[仕様](game019/IMPLEMENTATION_SPEC.md)、方向×小中大、転落復帰、100m海／鳥→風の空→200m宇宙。CREDIT未接続、位置saveなし、BESTだけ0.1m単位。012〜014は元engine／保存／説明を保ち、任意のshell補助練習を追加。013の強制help解除はgdc1resource。データの正本は[タグ／profile／端末内記録](data/JEV_PREPARATION.md)、外部Jev送信なし。

以下は前回の公開18本版と歴史記録。今回の最新状態は上記統合報告を優先する。

2026-10-05（日本時間）。**018を含む18本を正式HTTPSへ公開済み。** 012〜014改名、015縦スクロール改訂02を同時反映。[最新の実装・公開報告](game015/revision-02/IMPLEMENTATION_REPORT.md)を再開地点とする。以前の[統合引き継ぎ書](handoff/WEB_MINI_GAME_ARCADE_HANDOFF_2026-10-05.md)は今回作業前の状態を記録した資料。

## 2026-10-05 改名・落下キング改訂02・018公開作業

今回の最新ユーザー依頼を実施。018候補HEAD482e458を採用し、018固有runtimeは変更しない。012「お前の仕事は俺の仕事」／013「タスク天国」／014「指ハートチャレンジ」へ、Catalog・HTML・Godot内部・必要なサムネイルまで統一。[改名報告](legacy-games/title-revision/IMPLEMENTATION_REPORT.md)。

015は中央を含む6種のランダム足場、到達可能な安全なルート、自動縦スクロール18→36px/s、遅れると上端死亡、王冠／白ひげ／紫衣装／赤マントの新nativeドット絵、タイトル・練習・実playサムネイル。[改訂02仕様](game015/revision-02/IMPLEMENTATION_SPEC.md)／[報告](game015/revision-02/IMPLEMENTATION_REPORT.md)。初動約2.85秒、停止しても進む。旧改訂01の待機・練習仕様は現行に適用しない。

check・全単体・build PASS、015モデル22／練習8、native PC／phone／320／横画面4PASS。独立モデル追加32seed各500m PASS。Runtime release803a884、Pages run37315859362 build/deploy成功。018・015公開PC/phone各2PASS、18card・新名・公開assetのbuild hash一致。最終production015／018各4、既存native26経路、旧Godot6lifecycleもPASS。詳細は改訂02報告。正式HTTPS、Pages custom domainとhttps_enforcedを直接確認済み。DNS・AdSense・CREDITは変更しない。

以下は今回作業前の引き継ぎ状態を保存した記録。最新状態は上記改訂02報告を優先する。

正式公開URLは **https://game100garage.com**。Cloudflare Registrar取得、Pages Custom domain、DNS check successful、HTTPS設定完了（運営メモによる）。AdSenseは登録開始済みだが「サイトをAdSenseにリンク」が未完了。次は画面の「開始」で所有確認method／snippetを取得する。CREDIT OFF・Reward開発stubは維持。GitHub所有確認TXTは削除しない。

mainは017までの17本、`1ab4fcf5a35637b15554d7942d944763e79920c9`。017のPages run37283475701はbuild／deploy成功。018は実装・技術検証済みでmain未反映・未公開、`codex/game018-shoe-fly-high`に保存。統合前の最新HEADは`2426659ddea5a3eddcee77ec201476e66eba946a`（mainより5commit先行）、以後の文書commitも最新remoteから取得する。018は作り直さない。

②の公開再検証は248/248単体・check/build、freeze301一致、018／017各4local production PASS。018公開DOM／asset一致／deployは未実施。今回の①Cloud再確認はenforced revision11だがcustom許可はjev-ai.org/openrouter.ai＋package_managersのまま、Pages／domainHTTPSはCONNECT403。DNS／HTTPSの未完了と混同しない。新Cloudでgame100garage.com・www.game100garage.com・badgio0906.github.io・api.github.comの実許可を確認し、正式URLで公開残工程を進める。[個別公開手順](game018/PUBLICATION_HANDOFF.md)。

登録の正本は[gameCatalog](../src/data/gameCatalog.ts)。以下は18本候補の一覧。mainは017まで。

| ID | ゲーム | route | 再開時の固有資料 |
|---|---|---|---|
| 001 | 軌道をズラせ！ ～ORBIT SHIFT～ | `game001.html` | [仕様](GAME001_SPEC.md)／[LESSONS](GAME001_LESSONS.md) |
| 002 | ゆううつな月曜日 ～WORKDAY DODGE～ | `game002.html` | [仕様](GAME002_TO_005_SPEC.md)／[旅・倍率改修](ten-game/IMPLEMENTATION_SPEC.md) |
| 003 | 我が国の建築は世界一ぃ！ ～DROP TOWER～ | `game003.html` | [仕様](GAME002_TO_005_SPEC.md)／[C国改修](ten-game/IMPLEMENTATION_SPEC.md) |
| 004 | あなたの短期記憶、無事ですか？ ～ECHO GRID～ | `game004.html` | [仕様](GAME002_TO_005_SPEC.md)／[タイトル改修](revisions/TITLE_UI_SPEC.md) |
| 005 | 右往左往の仕分け術 ～SORT SHIFT～ | `game005.html` | [仕様](GAME002_TO_005_SPEC.md)／[英語改修](ten-game/IMPLEMENTATION_SPEC.md) |
| 006 | ギリギリ駐車 ～PARK IT!～ | `game006.html` | [仕様](ten-game/IMPLEMENTATION_SPEC.md)／[LESSONS](GAME006_LESSONS.md) |
| 007 | まだ乗れます ～ELEVATOR OVERLOAD～ | `game007.html` | [仕様](ten-game/IMPLEMENTATION_SPEC.md)／[判読改善](eleven-game/IMPLEMENTATION_REPORT.md) |
| 008 | コーヒーこぼすな ～COFFEE WALK～ | `game008.html` | [仕様](ten-game/IMPLEMENTATION_SPEC.md)／[液面・距離改善](eleven-game/IMPLEMENTATION_REPORT.md) |
| 009 | 印鑑どこですか ～STAMP HUNT～ | `game009.html` | [仕様](ten-game/IMPLEMENTATION_SPEC.md)／[LESSONS](GAME009_LESSONS.md) |
| 010 | 会議、聞いてます？ ～MEETING SURVIVAL～ | `game010.html` | [仕様](ten-game/IMPLEMENTATION_SPEC.md)／[前景改善](eleven-game/IMPLEMENTATION_REPORT.md) |
| 011 | ウンコかウコンかゲーム ～UNKO or UKON～ | `game011.html` | [初版仕様](eleven-game/IMPLEMENTATION_SPEC.md)／[最新時間・配点改修](migration/IMPLEMENTATION_REPORT.md) |
| 012 | お前の仕事は俺の仕事 | `games/yokodori-days/index.html` | [移行構造](legacy-games/MIGRATION.md)／[移行報告](migration/IMPLEMENTATION_REPORT.md) |
| 013 | タスク天国 | `games/tachibana-task-heaven/index.html` | 同じ移行資料。元UIの横向き案内を維持 |
| 014 | 指ハートチャレンジ | `games/finger-heart-challenge/index.html` | 同じ移行資料。元の25回チャレンジを維持 |
| 015 | 落下キング ～FALL KING～ | `game015.html` | [初版仕様](game015/IMPLEMENTATION_SPEC.md)／[改訂01依頼](game015/revision-01/REQUEST.md)／[最新報告](game015/revision-02/IMPLEMENTATION_REPORT.md) |
| 016 | 負けじゃんけん ～LOSE TO WIN～ | `game016.html` | [仕様](game016/IMPLEMENTATION_SPEC.md)／[実装・公開報告](game016/IMPLEMENTATION_REPORT.md) |
| 017 | 雨って避けたら濡れないよね ～RAINSHIFT～ | `game017.html` | [報告](game017/IMPLEMENTATION_REPORT.md)／[公開記録](game017/PUBLICATION.md) |
| 018 | 靴とばそ ～SHOE FLY HIGH!～ | `game018.html` | [報告](game018/IMPLEMENTATION_REPORT.md)／[公開前引き継ぎ](game018/PUBLICATION_HANDOFF.md) |

## 現行境界

CREDITは[config](../src/arcade/config.ts)でOFF。残高0で練習／本番／retry可能。将来ON時は016〜018のみ開始1回消費、001〜010・015は既存終了時消費、011 mainは無料専用。広告は開発stubのみ、本番広告・オンラインランキング・永続Analyticsは未実装。

001〜011・015は共通onboarding、016は固有3問、017は経路描画練習、018はANGLE／SPIN／POWER／連続飛行の4段階。012〜014は元のUI・exportを保持。物理HTMLとViteの相対baseを使用し、入力regexは001〜011・015〜018。固有仕様を全ゲームへ一律適用しない。[共通仕様](../GAME_COMMON_SPEC.md)。

011は20問まで2秒100点、21〜50は1.5秒200点、以後0.5秒500点、配置独立ランダム、旧BEST保持。015改訂01は24×36キャラ、18×33判定、ジャンプなし。016はグー／チョキ／パー固定、1ミス終了、31以後800ms。

## 検証と残工程

017：単体219/219、native4、production4、既存modern28経路PASS。Visual81/F13/H12、PC/phone各6連続CLEAR、独立QA。Jev9 callsの実測は[結果](game017/JEV_SHADOW_REPORT.md)。CI deploy成功と公開DOM確認を区別する。

018：最新統合単体248/248、TypeScript／build成功。ブラウザ・独立Visual／Feel／QA・Jevの最終記録は[報告](game018/IMPLEMENTATION_REPORT.md)。初回失敗や修正前の画像は保持。font1049文字、旧1029全保持、既存385ファイル保持。旧Godot3本は今回再プレイしていない。

人間の面白さ、実機FPS／音／親指操作、酔い、JUST難度の体験評価は未実施。[017フォーム](game017/HUMAN_PLAYTEST.md)／[018フォーム](game018/HUMAN_PLAYTEST.md)。自動入力の成功を人間合格へ変換しない。旧3サイト停止は過去API403で未完了、元Repository保持：[停止監査](migration/PAGES_RETIREMENT_AUDIT.json)。

当時のJevはOpenRouter Decisionsの開発CLIのみ、原因choice＋独立3noul。現行は本書冒頭のschema v2を参照。runtime／CIへの自動判断接続なし。歴史的3ケース・10〜20件ベンチマークを今回の開発checkpointとして完了扱いしない。[ルール](JEV_REVIEW_RULES.md)。Codexのtokens／料金は取得不可、nullで記録する。[過去baseline](development-baseline/BASELINE_2026-10-05.json)。

再開時はbranch／HEAD／git statusとremote mainを確認し、他の未コミット変更を保つ。source hash、検証範囲、公開確認、人間評価を対象報告から読む。起動server／認証情報／distが次タスクにも残ると仮定しない。
