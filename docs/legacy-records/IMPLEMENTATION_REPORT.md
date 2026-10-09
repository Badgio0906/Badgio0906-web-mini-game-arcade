# Godot012–014 共通記録連携 — 実装・QA・公開報告

2026-10-09。作業base488916c、専用worktree/branch `codex/legacy-godot-records`。依頼正本は [REQUEST](REQUEST.md)、既存作業保全は [BASELINE](QA/BASELINE.json)、読込時刻/commit/hashは [READ_RECORD](QA/READ_RECORD.json)。公開結果は最後の [PUBLICATION](QA/PUBLICATION.json) と配信版照合を参照。公開前の段階では完了と断定しない。

## 変更と互換

|作品|今回の代表記録・条件|保存と旧データ|
|---|---|---|
|012 お前の仕事は俺の仕事|元の確定整数score、通常/rules1|元high_score.cfg・途中保存を保持。実際に旧exportで得た400をnativeが読み、新結果0より個人最大400を保持。過去BESTは新RUNの投稿候補にしない|
|013 タスク天国|元3stage合計0〜11400点、RUN全体OJTなし/rules1|元task_heaven.cfgのBEST/設定を保持。旧混合BESTは条件不明、新通常/OJTは版付きConfigFileで分離。ON→OFFでもOJT扱い、stage0/途中stage/debug除外|
|014 指ハートチャレンジ|元の成功数0〜25回、通常/rules1|元永続BESTなしをsourceで確認。版付き小型ConfigFileを追加、元成功判定・5段階・間隔・失敗条件を維持|

原本3repoはpin/dirty状態を保全し、別archiveで正規Godot4.5.1 export。既存タイトル変更もsource overlayで再現。PCK resource単位のscoreバイナリ移植、Engine内部・WASM・FSの読取り、元ゲーム本体の全面移植は行っていない。[native調査](SOURCE_AUDIT_013_014.md)、[保存](NATIVE_RECORD_SAVE.md)、[official API](GODOT_BRIDGE.md)、[export/import再現](GODOT_EXPORT.md)。ゲームroutes/ID/releaseOrder/保存キーを維持し、他ゲームcode/物理/素材、広告/CREDIT OFF/GA4/一般Analytics schema・送信制御/認証を変更しない。

固定child interface→公式 `JavaScriptBridge.get_interface`→primitive parent通知。親は同一origin、実iframe source、launchごとのsession、game/rules/mode/型/許可fieldを検証する。native start/resultを一度だけ対応付け、retry/menu/nativeTITLE/離脱でscopeを解除。小型IDB mirrorはatomic最大値だけで、native保存の代行ではない。PortalはEngineを起動しない。未プレイ/有効0/旧条件/保存拒否を区別。旧nativeBESTを読み込むには一度そのゲームを起動する必要がある。

既存RecordSharing/PublicBests/API定義を再利用し、3通常boardを登録。初期自動共有OFF。旧作品はRUN開始時ONかつ同一permission epochのときだけ自動候補にし、OFF時代の結果を後から一括送信しない。任意手動確認は既存方式。Analytics IDは記録payloadに混ぜない。設定済みAPIはローカル合成fixtureだけで検証し、本番API/D1/Secret/Worker設定・migration・deployは実施しない。Cloud環境にはCloudflare認証がなく、既存公開records endpointも未設定なので本番は「みんなのBEST／記録共有：準備中」、外部共有無効を維持する。

## QAと実画像

- root check・全872tests/77files成功、Worker typecheck・記録29checks/20boards・既存Analytics37checks成功。[REGRESSION](QA/REGRESSION.json)。Workerの全値はローカル合成fixture。Jev offline25成功。
- 元/native追加:012 60+14=74、013 154+25=179、014 12156+68=12224。原本headless回帰と追加保存/橋テストを別に記録。[012](QA/final012-01/REPORT.json)、[013/014](QA/NATIVE_013_014_SOURCE.json)。25回全clearは技術fixture、実プレイヤー25成功とは扱わない。
- 実入力: [012最終](QA/final012-browser-01/REPORT.json)10checks（旧400/new0/max400、retry、native/Portal reload）、[013最終](QA/prototype013-05/REPORT.json)20checks（PC/横スマホ通常/OJT ON→OFF/結果/TITLE/reload）、[014最終](QA/prototype014-03/REPORT.json)30checks（PC・390/320縦・844横、成功1/失敗/再挑戦/native保存/Portal）。合成protocol16checksと実ゲーム試遊は分ける。[protocol](QA/protocol-02/REPORT.json)。すべて自動操作の隔離保存、production POSTなし。
- 012はprototype012-01の実100→Portal/再読込を確認してから013へ展開。013作業中に未検証014 draftが存在したが、014 export/統合/QAは01304の20check後に開始した。推奨順の運用はこの実際のdraft/QA順を記録し、完全逐次制作とは称さない。
- 厳密resource照合3export/42file、runtimeJS/WASM/worklets/人物/手/音/scene/stageJSONは維持。012の全元resourceに意図しない変更なし。013icon3種にRGB最大1/255の10/8pixel、014は各3pixelの限定再import差、alpha不変・sourceSVG不変。正確な数値原因UNKNOWN、透過/高品質保証には読み替えない。014非配信editorPNG UID差は元preset除外・両PCK/remap非存在を確認したもののみ列挙許容。[resource audit](QA/RESOURCE_AUDIT_02.json)、[判定修正](QA/RESOURCE_AUDIT_REVIEW_02.json)。他asset差は拒否。
- importerは現在overlay/hash/pin/managed shellを全3本検査してから書く。再実行後wrapper/bridge/開始導線/保存接続がbyte一致、古い無引数/不一致exportは書込み前に拒否。[guard](QA/importer-guard-01/REPORT.json)。

- 説明/任意練習/戻る共通導線107checks、Portal30カード4viewport86checks、既存8作品16PC/phoneRUN96checks成功。[safety](QA/safety-02/REPORT.json)、[Portal](QA/portal-final-01/REPORT.json)、[既存](QA/native-regression-01/REPORT.json)。013元stage0練習でPC/phone各400点を得ても本番記録/共有へ入らず、本番stage1からfreshRUN開始する10checks成功。[元練習](QA/native-practice013-01/REPORT.json)。
- 012同phase比較は [capture012](QA/capture012-01/REPORT.json)。PC/390縦/320縦/844横の元title実pixelはbefore/after同一、phoneの右側/上側の切れは元exportでも確認。記録strip差18pxとPortal表示0点を分離。初期独立レビュアーの「黒title」はPNG実ファイルのhash/pixel/OCR再確認で誤観測と撤回、旧記述・当時API送信を保持し現在の訂正を明記。[Visual訂正](QA/VISUAL_012.md)。黒titleを修正したという実績にはしない。

- [任意橋/保存拒否/サブパス](QA/optional-02/REPORT.json)14checks成功。3作のsubpath起動/戻り、012の橋なしでも元結果/再挑戦、parent mirror拒否でも元native結果を維持しPortal「取得できません」を確認。初期fake HTTPS試験の音声workletがroute差し替え対象外だったため失敗を保全し、実ローカル配信で10worklet HTTP200/JS MIME・例外0を再確認。これはfixture修正でありゲーム音声変更ではない。[独立調査](QA/OPTIONAL_WORKLET_REVIEW.json)。

独立code/Visualは [012](QA/REVIEW_012_CODE.md)、[013](QA/REVIEW_013_CODE_VISUAL.md)、[014](QA/REVIEW_014_CODE.md)/[実画像](QA/VISUAL_014.md)。013の大型準備中stripは実画像でfindingとなり、旧3作品だけ18px1行へ限定修正、phone canvas199→256。PC84/F13/H12・phone81/F12/H12。014はPC85/F13/H13、390縦84/F13/H12、320縦81/F12/H12。横14は元からnative文字とretryが小さいことを修正前後実画像で確認し、元UI維持の今回範囲で評価。全端末新作Gateやnative44px達成とは報告しない。

失敗した013座標/resize/splash、014旧版入力timing/瞬間hidden assertion、旧audit条件を捨てず保存し、正しい成功だけを元の失敗に遡及して差し替えていない。初回014入力時状態は未計測なので正確な遅れ原因未確定、現probeは入力直前準備/実入力状態を記録。本人・実機iPhone/Android・聴覚/音の気持ちよさ・人間の面白さは未実施。自動試遊は本人試遊の代用ではない。

## Jevと残課題

Jevは観測finding19件だけ、実API19/HTTP200、resolved model `typesafe/jev-1.13-20260917`、型/choice確率/noulを検証した4回答×19。独立判断と実対応は [JEV_SHADOW](QA/JEV_SHADOW.jsonl)、[集計](QA/JEV_SUMMARY.json)、judgmentsに保存。PRIMARY一致12/19、NEXT10/19、Codex追加作業TP19/TN0、risk見逃し2。黒titleの当時の誤観測と後続撤回も含む。実API/有効回答は [呼出監査](QA/JEV_INVOCATION_AUDIT_02.json)で個別確認。小標本・全件findingであり一般的有効性/開発節約率を断定しない。公開判定・画像採点・Human楽しさ評価はJevへ委託しない。本番ゲーム・CIはJev APIを呼ばない。

本人試遊と物理端末/音評価、012元phone切れ/014横画面の旧native小文字、共有API本番有効化（既存認証・migration/Worker/endpointの別作業）が残る。本番共有無効は不具合を隠すための架空成功ではなく依頼の許容代替。作者未試遊の試作公開はユーザー承認済み。
