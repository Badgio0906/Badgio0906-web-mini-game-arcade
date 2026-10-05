# WEBミニゲーセン — 新Cloudタスクへの統合引き継ぎ

作成・照合：2026-10-05T21:43:14.603227+09:00（日本時間）。版：**v1.0／3情報源の統合版**。

**①本チャット、②「公開Portalで017・018を確認」の添付引き継ぎ、③「ミニゲーセンサイト運営」のユーザー提供GAME100 GARAGEメモ、Git／Jevの記録を統合した。** 他チャット全文の取得機能はこのCloud環境では利用できないため、②③は提供された引き継ぎ資料を根拠とする。設定の完了報告と、今回の直接確認／未実施の確認を分けて記録する。

## 1. 次の担当者が最初に把握する状態

ユーザーは、タスクが分岐して開発・公開・ドメイン／AdSenseの情報が散ったため、これを一本の引き継ぎ書にまとめ、新タスクで読み込ませて再びゲーム開発を進めたい。本書はそのための記録。今回の統合ではゲーム実装・設定・DNS・AdSense・公開を変更せず、Jev APIの追加呼出しも行っていない。添付文書の過去の実行指示を、この文書統合作業の実行依頼とは扱わなかった。

| 項目 | 統合した現在の状態 |
|---|---|
| Repository | `Badgio0906/Badgio0906-web-mini-game-arcade`、GitHub Pages |
| main | `1ab4fcf5a35637b15554d7942d944763e79920c9`、017まで17本 |
| 017 | main反映済み、Pages build/deploy成功。公開DOM・実公開プレイは未確認 |
| 018 | 実装・ローカル技術QA完了、**main未反映・未公開** |
| 018候補ブランチ | `codex/game018-shoe-fly-high` |
| 照合時のremote候補HEAD | `2426659ddea5a3eddcee77ec201476e66eba946a`。以後に引き継ぎ文書commitが加わり得るため再fetch |
| 018ソース採用commit | `90c8c68c64e36f761c8ad06a575778608b377c98` |
| 独自ドメイン | Cloudflare Registrarで`game100garage.com`取得、Pages custom domain・DNS check successful・HTTPS完了（③のユーザー提供記録） |
| 正式公開URL | **https://game100garage.com**。旧Pages URLは履歴・転送確認用 |
| AdSense | 登録開始済み。「サイトをAdSenseにリンク」が未完了、次は画面の「開始」で所有確認方法・snippet取得。Repositoryの設置コード一致なし |
| CREDIT／Reward | CREDIT OFF、無料・無制限。RewardServiceは開発stub。本番広告・本番rewardは未接続 |
| Jev | OpenRouter Decisionsの開発用Shadowのみ。単独で修正・レビュー省略・公開判断をしない |
| 人間の体験評価 | 017／018の楽しさ、初見理解、実機の親指・音・FPS・酔いなど未実施 |

後続担当者は、最新のユーザー依頼とRepositoryのAGENTSを優先する。本書の手順案はゲーム開発や広告設置を自動的に開始する指示ではない。新作の仕様・番号は次タスクのユーザー依頼で確定する（018の次は番号上019候補だが、企画は未指示）。

## 2. 情報源と食い違いの扱い

| 情報源 | 取得範囲 | 優先して使う内容／未取得 |
|---|---|---|
| ①本チャット | 利用可能な会話履歴と実装記録 | 017／018仕様・開発、公開前保存、Jev要求・実測・現行ルール |
| ②「公開Portalで017・018を確認」 | ユーザー添付PUBLICATION_HANDOFF.md、候補branchのPUBLICATION／publication-qa | 新環境の再検証、独自ドメインへの転送、公開ブロック、最新引き継ぎ。全文会話そのものは未取得 |
| ③「ミニゲーセンサイト運営」 | 今回ユーザーが提供したGAME100 GARAGE引き継ぎメモ | Cloudflare取得、DNS、HTTPS、AdSenseの現在の画面・次操作、ドメインとTXT保持方針。全文chat取得ではない |
| 今回の直接照合 | remote refs、Git差分、301file hash、コード検索、現在のnetwork policy・実HTTP | 最新のmain／候補、保存済みQAとの境界、現環境接続、AdSense設置のRepository内一致有無 |

取得した添付原本は`docs/handoff/sources/PUBLICATION_HANDOFF_UPLOADED_2026-10-05.md`にそのまま保持。①でのfd852a7や添付の6ad8793は過去HEAD、今回のremote候補は2426659。③の「mainより3commit先行」は当時のsnapshot、今回の照合は5commit先行（本統合文書commit前）。差分は公開再検証・引き継ぎ資料で、runtime freeze301ファイルは全一致。古いローカル`work` branchはfd852a7に留まるため、そのまま新作開発の基準にしない。

017の初期IMPLEMENTATION_REPORTには「未公開」が残るが、それは当時の記録。最新のmainの1ab4fcfと`docs/game017/PUBLICATION.md`のCI deploy成功を現在の状態として扱う。②のrevision10と今回のrevision11は、それぞれの環境観測であり、数字が増えれば許可ホストも増えるという意味ではない。

## 3. 開発環境とRepository構造

既存のWEBミニゲーセンCloud Environmentを使用。確認時Node **24.19.0**、npm **11.9.0**、Chromium `/usr/bin/chromium`。TypeScript／Viteの静的MPA、HTML/CSS、Canvas／DOM／必要なゲームのみPhaser。PlaywrightとVitestを使用、CIはNode24。`base:'./'`、native物理HTML、Vite inputは001〜011・015〜018。package／core／依存を018で追加変更していない。

| path | 所有する情報／責任 |
|---|---|
| `AGENTS.md` | 毎回の最小指示。次にPROJECT_CONTEXT／CURRENT_STATUS |
| `docs/PROJECT_CONTEXT.md` | 目的・構造・文書の読み分け |
| `docs/CURRENT_STATUS.md` | 現行ゲーム一覧、公開・候補・残課題 |
| `docs/GAME_DEVELOPMENT_RULES.md` | 実装・独立Feel／Visual／QA・検証・引き継ぎ |
| `GAME_COMMON_SPEC.md` | 保存、音、CREDIT、入力、計測、配信の現行境界 |
| `src/data/gameCatalog.ts` | title／route／thumbnail／releaseOrderの正本 |
| `src/core/` | StorageService、AudioService、CreditService、RewardService、TelemetryService |
| `src/arcade/` | Feature Flag、初回導線、練習、Portal帰還 |
| `src/game/`＋`src/main.ts` | Game001の既存構造。改名しない |
| `src/games/gameNNN/` | 002〜011・015〜018の固有モデル／描画／UI／manifest |
| `public/games/` | 012〜014の固定Godot export＋帰還shell。編集・再ビルドしない |
| `public/assets/portal/` | 実プレイ由来thumbnail640×360 |
| `assets/` | 原本・台帳・ローカルfontとライセンス |
| `tests/`、`docs/gameNNN/QA/` | 意味のある境界テスト、native実入力、配信監査、失敗／再テスト原本 |
| `tools/jev-shadow.py` | 開発専用Decisions logger。ブラウザ／CIへimportしない |

新環境へ依存、server、Chromium、dist、環境変数が引き継がれると仮定しない。過去のnpm testや保存済み画像を新タスクで再実行した証拠にしない。今回は文書・Git・hashの照合のみで、全ゲームtests/build/browserは再実行していない。

### 現行カタログ

mainは001〜017、018候補は下記18本。012〜014だけrouteがGodot shell。

| ID | 正式ゲーム名（日本語／英語） | route |
|---|---|---|
| 001 | 軌道をズラせ！ ～ORBIT SHIFT～ | game001.html |
| 002 | ゆううつな月曜日 ～WORKDAY DODGE～ | game002.html |
| 003 | 我が国の建築は世界一ぃ！ ～DROP TOWER～ | game003.html |
| 004 | あなたの短期記憶、無事ですか？ ～ECHO GRID～ | game004.html |
| 005 | 右往左往の仕分け術 ～SORT SHIFT～ | game005.html |
| 006 | ギリギリ駐車 ～PARK IT!～ | game006.html |
| 007 | まだ乗れます ～ELEVATOR OVERLOAD～ | game007.html |
| 008 | コーヒーこぼすな ～COFFEE WALK～ | game008.html |
| 009 | 印鑑どこですか ～STAMP HUNT～ | game009.html |
| 010 | 会議、聞いてます？ ～MEETING SURVIVAL～ | game010.html |
| 011 | ウンコかウコンかゲーム ～UNKO or UKON～ | game011.html |
| 012 | 澤野さんの横取りデイズ | games/yokodori-days/index.html |
| 013 | 立花さんのタスク天国 | games/tachibana-task-heaven/index.html |
| 014 | 畑島さんの指ハートチャレンジ | games/finger-heart-challenge/index.html |
| 015 | 落下キング ～FALL KING～ | game015.html |
| 016 | 負けじゃんけん ～LOSE TO WIN～ | game016.html |
| 017 | 雨って避けたら濡れないよね ～RAINSHIFT～ | game017.html |
| 018 | 靴とばそ ～SHOE FLY HIGH!～ | game018.html |

### 保持する共通境界と例外

CREDIT `creditsEnabled:false`。残高0でも練習／PLAY／Retry可、OFF時は消費・補充・広告adapterを動かさない。将来ON時は016〜018のみ本番開始時1回消費、001〜010・015は既存終了時消費、011 mainは無料専用で財布未接続。広告導入という言葉だけでCREDITをONへしない。

Storageはゲーム別namespace、BEST／mute保存、保存拒否でもmemory fallback。練習はscore／BEST／CREDIT／本番run_start・run_endから独立。001〜011・015は共通onboarding、016は固有固定3問、017は経路描画、018は4段階実練習。旧Godotへ新UIや練習を強制しない。Telemetryはゲーム内イベントで、Codex使用量を取得する機構ではない。バックエンド、オンラインランキング、永続Analytics、本番rewardは未接続。

011：1〜20問2秒100点、21〜50問1.5秒200点、以後0.5秒500点、左右毎問独立random、旧BEST保持＋新配点best:v2。015改訂01：24×36キャラ、18×33判定、ジャンプなし、早期トゲ・壁針・鳥、全幅安全床なし。016：グー／チョキ／パー固定、1ミス終了、初期30問2000ms、文章解放後に時計、31以後800ms。

## 4. 017／018の開発・検証・公開

### Game017 RAINSHIFT

雨の到来中に超加速→視点移動後の5秒で線を描く→1.4秒dashでGOALへ。全折れ線と雨の連続衝突、到達可能な経路生成、検証済みfallback、指先ルーペ、4残像、4round以後wind、6以後bigdrop、streak／close-call。練習／Retry／BEST／mute／PC/phoneを固有Canvasで実装。

実装時：219/219単体（01723件）、check/build、native4profiles、入力／保存guard3群、Shift限定再テスト、production4、既存modern28経路PASS。独立Visual **81/F13/H12**、PC/phone各6連続CLEAR、独立QA。既存374files保持。ソースhash `a3025ff2f7c4e3d489a0ebe4b82e535f24b4779d8a7943a4036ffbeeba02536e`（290files）。

main採用1ab4fcf、Pages run **37283475701**、build／deploy success確認。これは公開DOM・実公開の操作確認とは別。②で018候補buildの017production root/subpath×PC/phoneを再実行し4PASS。初回collectorのresponse.body待機不足は検証側の例外、原本保持、runtime変更なし。

### Game018 SHOE FLY HIGH!

title→説明→ANGLE単独／SPIN単独／POWER単独／3操作実飛行の4練習→5靴選択→ANGLE→SPIN→POWER→MAX/KICK→物理飛行・破壊／天空イベント→着地→得点／BEST→Retry／靴変更／Portal。native click/tap／Enter/Space、長押し・phase跨ぎrelease・modifier等のguard、pause／blur／hidden、quit重複防止。

5靴は最初から解放：PAPER軽量・浮遊／高さ、ZORI回転／spin bonus、SNEAKER中角度万能、LEATHER低角度・貫通、IRON GETA通常短距離／精密JUSTだけ大きい初速。ANGLE5〜85°周期2.8秒、SPIN±1周期1.65秒、POWER周期1.36秒、100 plateau100ms、JUST99.5以上で約106msの猶予、PERFECT98以上。spinは飾りではなく安定・drag・lift・回転・貫通へ影響する。

1/30秒のdeterministic疑似物理、地面交点補間、距離・高度と表示を整合。GROUND25°以下／DISTANCE25〜55°／SKY55°以上。comic無人障害物、plane/UFO/衛星、JET STREAM／TORNADO／BUSINESS MISSILE／IRON BREAKER等。scoreはdistance＋height＋groundbreak＋spin＋JUST＋special。flightの全world大量生成を避け、camera付近だけ描く。BEST距離は整数decimeter、全体scoreと5靴別BESTを既存StorageServiceへ保存。

初回独立Feelで、captionが靴を隠し、高速plane/UFOが画面外へ流れる核心findingを検出。captionを小さくして上下分離、実到達座標に550msのholdを追加。1890入力比較で物理samples・距離・高度・得点は不変。追加最大1.65秒、flight最大24.14秒、厳密着地。修正前と修正後証拠を別保存。

実装時：統合**248/248単体（01829件）**、check/build、native1440×900／390×844／320×568／844×390の4PASS、input/storage guard2群。hold後最終独立FeelはPC SKY2投＋phone全5靴7投、2269flight観測点・10実座標hold、エラー0。独立Visual **85/F13/H13**、独立QAで301file hash一致、新findingなし。production0184＋0174＋既存modern28=36PASS。最後のruntime hash **`4e491ba21ec7f5b3bcfc86c1b5656e186d7dffc1f22fc94903afc1d19f27bfbd`**（301files）。今回も個別hash301全一致。

②の新環境でNode24.19.0/npm ci/check/build/248単体、018production4＋017production再テスト4を再実行。これは実装時36件の一括再実行とは区別する。PC/phone初回練習→本番→Result→Retry→Portal18cards、保存reload、font/scripts、thumbnail640×360、CREDIT OFFを確認。**公開上の018deploy・DOM・asset照合は未実施**。

018の実thumbnailはnative革靴の低角度JUST・実貫通原本、640×360・11022bytes、合成なし。font1049文字164428bytes、旧1029字全保持、既存fallback8記号。既存385source/runtime/assets/export不変。Godot3本は今回再プレイしていない。既存Phaser共有chunk500kB警告は継続、018はPhaserなし。

人間確認は017／018とも未実施：初見理解、JUST難度、脚の自然さ、SPIN意味、3入力／flightの長さ、爽快感／破壊の笑い、靴差、再挑戦欲、実機親指／音／FPS／酔い。auto入力／静止画のPASSを人間合格へしない。

## 5. ドメイン・サイト運営・AdSense

### 確定したドメインと公開設定（③のユーザー提供記録）

サイト運営名は引き継ぎメモ上**GAME100 GARAGE**、独自ドメインは`game100garage.com`、取得業者は**Cloudflare Registrar**。GitHub PagesのCustom domain設定済み、GitHub Pages側の**DNS check successful**確認済み、**HTTPS設定完了**。正式公開URLは **https://game100garage.com**。PagesはActionsでdistをdeploy、main pushでbuild/test/deploy、Vite baseは相対`./`。

Cloudflare DNSは以下を設定済み。**初期接続確認時は全てDNS only**。現在も同じproxy設定であることは今回直接再確認していない。

| 種類 | 名前 | 設定値 |
|---|---|---|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | badgio0906.github.io |
| TXT | GitHub Pages所有確認用 | 登録済み・保持。具体的な名前／値は今回メモに含まれない |

**GitHub所有確認用TXTを削除しない。独自ドメイン設定を解除しない。** `www`のDNSがあることと、canonicalがwwwになることは同じではない。正式URLはapexのHTTPS。

②の初期実測では旧URL `https://badgio0906.github.io/Badgio0906-web-mini-game-arcade/index.html`から**HTTPのdomainへ301転送**が出た。その後の③メモはHTTPS完了を明示するため、新タスクでは正式HTTPS URLを基準にし、昔のHTTP転送を現在の完成状態として固定しない。今回のCloudは公開URLへのCONNECT403で、HTTPS・現在のredirect・www動作を直接再検証できていない。設定完了はユーザー提供記録、公開PC/phone検証は未実施と区別する。

③の「旧Pages URL固定記述は見当たらない」は当時の確認scope。docs／READMEには履歴用旧URLが残る。runtime navigationは相対routeを使用し、歴史証拠内URLを一律置換しない。更新する現在の案内には正式domainを使う。

### AdSenseの現在位置と残作業

Google AdSense登録を開始、対象siteは**game100garage.com**。AdSenseホーム画面で**「サイトをAdSenseにリンク」が未完了**。次のユーザー操作は右端カードの**「開始」**。続いてGoogleが提示するサイト所有確認方法からAdSenseコードsnippet等を取得する。snippet／publisher IDはこのメモに提供されていない。**申請送信済み、審査中、承認済み、広告配信済みとは報告しない。**

コードを設置する場合は基本的にHTMLの`<head>`。実際にGoogleが提示した方法と、設置対象pageを確認して必要な範囲へ反映し、既存ゲームの挙動・レイアウトを変えない。サイトが静的MPAであるため、単一SPAへの設置を前提にしない。所有確認だけのsnippetと、実際の広告表示・自動広告・手動枠の有効化を分けて記録する。自動広告／配置・対象pageの方針はまだ提供されていない。

将来ads.txtをdomain直下で配信する想定。Viteでは`public/ads.txt`が候補だが、**Googleの提示する実値を取得してから**置く。推測publisherや架空のレコードを作らない。現在のmain・018候補のHTML／src／publicに`ca-pub-`／`adsbygoogle`／`googlesyndication`の一致なし、追跡CNAME／ads.txtもなし。これはRepository内の設置証拠であり、Pages管理画面のcustom domain／DNS／アカウント登録を否定するものではない。

AdSenseのaccount操作や設置は**今回の統合作業では実行しない**。次のAdSense担当タスクで、画面の進み・提示code・公開branchを再確認する。018候補がmainより新しいため、旧mainからの広告変更で018を失わないよう差分統合する。導入後はHTTPS rootの所有確認・必要ファイル配信と既存ゲームの操作/viewport/読み込みを確認し、AdSense画面の状態も記録する。

`src/core/RewardService.ts`は900msでgranted:trueを返す開発stub。通常のサイト表示広告であるAdSenseと、ゲーム内のreward/CREDITを分ける。AdSense導入予定を根拠にstubを本番reward扱いしたりCREDITを有効にしたりしない。

### 現時点で決まっている運営・保護方針

正式URLはHTTPSのgame100garage.com。既存ゲームの挙動／レイアウトへの不要な変更を避ける。GitHub確認TXTとcustom domainを保持する。OPENROUTER_API_KEYはCloud network secret、JEV_API_KEY不要、Jev直APIではなくOpenRouter。secret実値はコード・log・chat・GitHubへ出さない。設定変更が既存タスクへ反映されなければ新Cloudタスクで再開する。018は作り直さず候補branchの検証済み成果を使う。

メモにない事項は必要時確認：現在のDNS proxy状態・www転送・Enforce HTTPSの詳細、AdSense snippet／publisher ID／所有確認method、申請後の画面・審査結果、auto/manual広告とpage配置、privacy/contact/運営者/規約page、cookie同意・対象地域、Search Console/Analytics、更新頻度・運営費等。**これらを既存の決定事項として創作しない。** これらの未提供事項は、③の情報源が未取得という意味ではない。今回提供された③メモは統合済みである。

## 6. Cloudネットワークと認証の経緯

| 観測元 | 適用状態と実結果 |
|---|---|
| ①の017/018実装時 | enforced revision8、custom jev-ai.org/openrouter.ai＋package_managers。Pages/APIへの通信403、Git認証・push成功 |
| ②の公開確認環境 | 最終enforced revision10、api.github.com/badgio0906.github.io/jev-ai.org/openrouter.ai。game100garage.comなし、旧Pages→domain301、domain HTTP/HTTPS403、Git/API成功 |
| 今回の①環境再確認 | observed/spec revision11、enforced。custom jev-ai.org/openrouter.ai＋package_managers。executor policyにもapi.github.com/badgio0906.github.io/game100garage.comなし。旧Pages URL・domainHTTPS両方CONNECT403。Git fetch/ls-remote成功、OPENROUTER_API_KEY ready |

設定画面の変更と、そのタスクに適用されたpolicyを分ける。次Cloudでenvironment_status、`/etc/codex/network-policy.json`、実通信を確認。公開確認の対象は**game100garage.com**、旧badgio0906.github.io、CI確認用api.github.com、念のため③で推奨された**www.game100garage.com**。実際の転送先も確認する。AdSense関連hostは③の実装内容から必要なものを確認し、根拠なく巨大な許可リストを追加しない。

Git認証の成功、API権限、公開URLの許可、TLSは別の状態。403がproxy CONNECTならGit token交換やコード変更で解決しない。proxyやTLS検証を無効化して回避しない。今回キーはreadyを確認するだけで値を表示・保存せず、疎通リクエストは0回。

## 7. Jev — 現行運用と実測

### API・判断の位置付け

`POST https://openrouter.ai/api/alpha/decisions`。requested **typesafe/jev-1.13**、実測resolved **typesafe/jev-1.13-20260917**。現在のCloud Environmentの`OPENROUTER_API_KEY`を使用、値は表示・保存・Git commitしない。新タスクでreadyとopenrouter.ai許可を確認。別modelへ代替しない、失敗checkpointを自動retryしない。未利用なら使ったことにしない。

Jevは開発側Shadowのみ。ブラウザ・ゲーム・CIの本番ロジックへ接続しない。Jev単独でCodex省略、コード修正、公開許可／停止、Visual／Feel合格、人間確認省略を決めない。開発CLIは`tools/jev-shadow.py`、game別ログは`docs/gameNNN/QA/JEV_SHADOW.jsonl`。

### 4質問の現在のschema

PRIMARY_CAUSEは単一choice：PRODUCT_BUG（製品コード）、TEST_INFRA_BUG（検証側）、CONTENT_OR_SPEC_ISSUE（問題文／内容／仕様）、VISUAL_OR_FEEL_ISSUE（見た目／操作感）、UNKNOWN（情報不足）。原因を3つの独立noulへ戻さない。

CODEX_ACTION_REQUIRED noul＝source／test／specの調査・修正の追加作業。HUMAN_ONLY_JUDGMENT_REQUIRED noul＝code/spec/DOM/座標/logだけでは判断しきれず、実視覚／操作感／楽しさ等を人間が体験しなければならないか。UIであるだけでhuman=trueにはしない。RELEASE_RISK_IF_UNRESOLVED noul＝未解決で公開されたら正常プレイ不能／誤解／重大品質問題になる可能性が高いか。未実行build gateとplayer-facing riskを混ぜない。

stateはその時点の観測、入力・viewport・phase・期待/実際・test/error等のみ。既知の正解、原因確定、修正済み、P1、Ground Truth、Codex判断をpayloadへ混ぜない。独立判断は別JSON。A初回／Btest finding／CVisual・Feel finding／Dretest／E統合直前、意味のある個別findingを追加しても1checkpoint1call、PASSを無意味に反復して呼ばない。timestamp、requested/resolved、各choice確率、各noul、input/output/cost/latency、Codex/human判断（存在する時のみ）、一致を保存。

現行開発プロトコルはCODEX_ACTION<0.45を将来候補として記録し、**その場合も通常Codexレビューを続ける**。human/risk比較は0.5。これは閾値最適化ではない。risk<0.5かつ独立GT risk=trueを最重要Release FALSE PASSとして報告。C<0.45なのに後の通常レビューで問題が出た件数も別に記録。

### 実測済みの017／018（保存ログで確認可能な範囲）

| 対象 | calls | input | output | USDcost | 平均latency秒 | 原因一致 | Codex一致 | human一致 | risk一致 | 全4問一致 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 017 | 9 | 10675 | 1299 | 0.00044835 | 0.487 | 6/9 | 9/9 | 8/9 | 6/9 | 4/9 |
| 018 | 8 | 8510 | 1142 | 0.00035742 | 0.370 | 6/8 | 7/8 | 7/8 | 4/8 | 3/8 |
| この2開発ログのみ合計 | 17 | 19185 | 2441 | 0.00080577 | 0.432（calls加重） | 12/17 | 16/17 | 15/17 | 10/17 | 7/17 |

上の合計は疎通・過去3case等を含む「全Jev利用量」ではない。追加requestのusage原本がないものを足さない。両ゲームでRelease FALSE PASS0。ただし018のGT risk positiveはC2の1件だけで、普遍的な安全性／モデル精度の証明ではない。

017：C<0.45はD/Eの2件、通常レビューで新問題0。Aの最初のrisk GTはcompile gateとplayer harmを混同したため独立QAでfalseへ再評価、旧判断を履歴保持。B3の素Chromium入力問題をJevはPRODUCTと分類、Codexは基盤側。018：C<0.45はA/D/E3件、レビューを省略せずA後にlayoutとSKY問題を発見した候補1件。018のC2は実画像の重大視認問題、Jev risk=.74だが原因をPRODUCT(.42)／VISUAL(.39)で取り違えた。0falsepassでreview省略候補の見逃しを隠さない。

018の混同行列：Codex（0.45）FP0/FN1、human（0.5）FP1/FN0、risk（0.5）FP4/FN0。これらは8開発checkpoint、独立した歴史事例ベンチマークではない。人間の本当の体験評価は未取得、human_final_judgment null。Codex tokens／cached/output／model／reasoning／料金は直接取得不可をnullで残し、コミット数・役割数・待ち時間から推計しない。

### 初期3ケース／第2段階の要求と未確定状態

①の初期要求：Game016遷移中画像body収集失敗（TEST_INFRA）、Game015練習ターゲット到達不能（PRODUCT＋Codex＋release blocking）、Game016問題文が答えを直接示す（SPEC＋Codex）。ユーザー発言上、疎通や先のShadow結果を受けて次段階へ進んでいるが、数値原本・実呼出ログを今回取得できない。`docs/jev/SHADOW_CASES.json`は古い「キー/contract不足・0calls」の準備記録で、全セッションの現在の実測結果ではない。

その後の要求は過去10〜20事例をGit／testlogs／修正記録から抽出し、Jev送信前にGT設定・payloadから分離し、原因choiceとCODEX_ACTION_REQUIRED／HUMAN_VISUAL_FEEL_REQUIRED／RELEASE_BLOCKING_IF_UNRESOLVEDを判定、noul0.5、FP/FN／特にrelease FALSE PASSを集計する方式。この**10〜20歴史ケース検証の完成証拠は未取得**。017/018の17checkpointをこれが完了したものとしない。

歴史benchmarkと現行game開発プロトコルではquestion名・risk定義・Codex比較閾値が異なる。次タスクがbenchmarkを再開するなら、そのユーザー仕様を明示して0.5を使用し、.45候補の開発ログと同じ集計に混ぜない。他taskに数値原本があるか確認してから不足分だけ実行し、同じcaseを重複呼出ししない。②の別途疎通はHTTP200／resolvedモデル確認の記録のみあり、usage原本未取得なので上の合計に含めない。

## 8. 新タスクでの再開順と公開残作業

最初に本書→AGENTS→PROJECT_CONTEXT→CURRENT_STATUS→必要な対象reportを読む。全画像／巨大QAを開始時に読み込まない。最新branch/HEAD/statusを確認し、既存の未commit変更を保護する。mainが進んでいれば今回のshaを固定最新と仮定しない。

```sh
git fetch origin refs/heads/main:refs/remotes/origin/main refs/heads/codex/game018-shoe-fly-high:refs/remotes/origin/codex/game018-shoe-fly-high
git log -4 --oneline refs/remotes/origin/codex/game018-shoe-fly-high
git status --short
git rev-parse HEAD origin/main
```

fresh checkoutで必要なら候補のtracking branchを作る。既存branchがあれば差分を確認して切り替える。old fd852a7へのresetやforce-pushをしない。AdSense作業が別branchで進んでいれば、その最新commitも調べ、018を失わずに統合する。今回提供された③メモには広告用の別branch／commitはない。

優先する未完了事項は、正式公開先へのCloudアクセス、018のmain反映と公開PC/phone確認、AdSenseの「サイトをリンク」・提示snippet取得と設置、人間評価、次の新作開発。これは既存未完了の整理であり、次のユーザーが新作を先に依頼すればその範囲へ進む。

②では「公開先がHTTP200で読めることを確認してからmain反映」の手順を残している。最新ユーザーの方針と照合し、許可が整った環境で正しいHTTP/HTTPS・転送先を確認する。URLは固定せず実際のeffective URLを採用、domainを勝手に解除しない。

Node24で必要時npm ci、code変更時check/test/buildと影響範囲回帰。過去のreport固定pathを上書きせず新しいQA出力先へ。文書だけならリンク・根拠・diff確認のみ。source freeze301fileとの相違があれば差分と再検証を記録。

公開依頼はユーザーから既にある。ただし今回の資料統合ではmain pushを実行していない。公開するタスクでは最新mainを再fetch、祖先関係／差分を確認し、fast-forward可能なら候補を反映、そうでなければ統合する。中間commit ed8a463／6ad8793に[skip ci]があるが照合時HEAD2426659は無し。mainへ反映するHEADのmessageとPages workflowが実際に動いたことを確認する。

```sh
git fetch origin refs/heads/main:refs/remotes/origin/main
git merge-base --is-ancestor origin/main HEAD
git push origin HEAD:refs/heads/main
```

これは条件を確認後の公開手順例。祖先確認が失敗したままpushしない。CIの対象commit／run URL／npm test／build／deploy successを記録。GitHub APIが許可されてもgh認証が使えなければ利用可能な接続済みGitHub toolで確認する。

公開後：PC1440×900/phone390×844で18cards、017/018の正式title・thumb640×360・href、カード起動と直接gameURLreload、HTTP200・404・font/script・console、CREDIT OFFの練習→本番→Result→Retry→Portal帰還を実入力。017は経路描画、018は4練習。公開HTML/JS/CSS/font/両thumbのhashを同じ公開commitのbuildまたはActions artifactと照合し、キャッシュと差分を分ける。

`docs/game018/publication-qa/game018-public.mjs`／`game017-public.mjs`は準備済みだが公開上未実行。PUBLIC_MOUNTは実際のHTTP200配信root、PUBLIC_QA_OUTは未使用dirを指定し、proxyを継承。公開DOM／asset一致／018deploy確認を保存後、PUBLICATION・RELEASE_GATE・CURRENT_STATUS・READMEを整合更新する。

## 9. 今後の新作で継続する開発方式

固有Core Loop／操作／Skill／Score／Failure／Replay理由／実練習条件を作り、題材だけの既存ゲーム複製を避ける。固有モデルと描画／保存／音境界を分け、未実績の汎用SDKを先に作らない。新nativeはgameNNN.html・固有src/manifest・tests・docs、catalog／Vite input／meta件数／thumb ledger／font subsetを同時に整える。

実装者と独立Feel／Visual／QAを分ける。必要なreviewを委任できる場合はRepository規則に従い実施し、小さな文書変更だけで全役割を起動しない。長いnative RUN中はsource hashを固定してHMR編集を停止、browser枠を順に受け渡す。普通のkey／click／tapによる操作、DEVのreadonly観測、純粋simulation、表示fixture、人間体験を別の証拠として記録。

PC／phone／320／short-landscape、44CSSpx操作、祖先clip／viewport、長押し／repeat／release、pause/hidden、保存拒否、BEST/mute reload、production root/subpathを変更に応じ検証。Visual gate80/100・F/H各12/15、実画像でのみ採点。Jev文章判定から点を作らない。thumbnailは実プレイ原本のみ、架空の合成宣伝画面にしない。fontの旧glyph superset・出典／OFLを守る。

実装時のfindingとcollector/CDP失敗を分類し、初回失敗と限定再検証原本を保持。修正済み表示と未修正時点のGTを混同しない。docs/gameNNN/にspec/report/Feel/Visual/HUMAN_PLAYTEST/LESSONS/QA/WORK_LOGを残す。Codex未取得usageはnull、API料金はnative responseの実測だけ、workerの並列時間を足して開発wall時間にしない。

## 10. 新タスクに渡す短い依頼文

> 添付の統合引き継ぎ書を最初に読んでください。WEBミニゲーセンの最新mainと018候補ブランチを確認し、開発・公開・独自ドメインgame100garage.com・AdSense・Jevの現在の状態を引き継いでください。CloudflareのDNS／HTTPS設定完了、AdSenseはサイトリンク未完了という提供メモの状態を引き継ぎ、実際に変化した場合だけ最新情報で更新してください。過去PASSを再実行済みとせず、secretを表示・保存せず、JevはShadowのみで独立reviewを省略しないでください。新作の仕様はこの後に指示します。

## 11. 根拠への地図（Repository取得後に読む）

- 提供原本：`docs/handoff/sources/PUBLICATION_HANDOFF_UPLOADED_2026-10-05.md`／`SITE_OPERATIONS_MEMO_2026-10-05.md`。
- 統合の直接照合：`docs/handoff/INTEGRATION_SOURCE_REGISTER_2026-10-05.json`／`INTEGRATION_OBSERVATIONS_2026-10-05.json`。
- 017：`docs/game017/IMPLEMENTATION_REPORT.md`（実装時）／`PUBLICATION.md`（後の公開）、`QA/VALIDATION_SUMMARY.json`、`VISUAL_REVIEW.md`、`GAME_FEEL_REVIEW.md`、`HUMAN_PLAYTEST.md`。
- 018：`docs/game018/IMPLEMENTATION_SPEC.md`、`IMPLEMENTATION_REPORT.md`、`SOURCE_FREEZE.json`、`QA/VALIDATION_SUMMARY.json`、`QA/RELEASE_GATE.json`、`VISUAL_REVIEW.md`、`GAME_FEEL_REVIEW.md`、`HUMAN_PLAYTEST.md`。
- 公開新環境：`docs/game018/PUBLICATION.md`、`PUBLICATION_HANDOFF.md`、`publication-qa/VALIDATION_SUMMARY.json`、`NETWORK_RECHECK_REVISION10.json`、018／017local/public probe copies。
- Jev：`docs/JEV_REVIEW_RULES.md`、`tools/jev-shadow.py`、017／018の`JEV_SHADOW_REPORT.md`と`QA/JEV_SHADOW.jsonl`／`JEV_SUMMARY.json`、historical `docs/jev/SHADOW_CASES.json`（準備資料）。
- 過去Codex baseline：`docs/development-baseline/BASELINE_2026-10-05.json`、完全usageではなく確認できた下限／取得不可を区別。
- 旧Godot移行：`docs/legacy-games/MIGRATION.md`、`docs/migration/IMPLEMENTATION_REPORT.md`。旧3sites停止は過去API403で未完了、元Repositoryを保持、削除指示へ読み替えない。

GitHub Repository：https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade
017 CI：https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/actions/runs/37283475701
018候補：https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/tree/codex/game018-shoe-fly-high

この1ファイルに次タスクの初動に必要な状態をまとめた。詳細原本はRepositoryの相対pathで再取得できる。③の提供メモも統合済み。提供された完了報告、今回の直接照合、今後の作業を区別し、環境接続の403をDNS／HTTPS設定の未完了と誤診しない。
