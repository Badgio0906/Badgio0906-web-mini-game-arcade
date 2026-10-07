# Game020 実装・検証・公開報告

正式名：**すっきり牌合わせ ～PAIR TILE～**。ID `game020`、公開URL `https://game100garage.com/game020.html`。候補表シート1・行22／No21の1本のみを対象とした。次候補・Sheet A22は変更していない。

基準main `fd1d09a293cd8da1b9dbfeb73dc3e68e27ad7bcc` から隔離branch `codex/game020-pair-tile` を作成。後で明示承認された018 revision03と020 Worker登録だけを追加統合した。元018worktreeは182file・status／branch／HEADを保全。[指示読込](QA/INSTRUCTION_READS.jsonl)／[保全確認](QA/ORIGINAL_WORKTREE_FINAL_CHECK.json)。過去の未公開記録を公開確認へ流用しない。

## 変更と互換

独自幾何学牌と24／48枚の多層盤面。上が空き左右片側が空いた同柄2枚を取る古典ルールを維持し、制限時間・ミス罰・強制特殊モードを入れない。ヒント／1手戻す／解法検証付き残牌並べ替え／元盤面のやり直し／任意の次盤面。マウス、Tab・矢印・Enter・Space、タップに対応。開始3択と専用8枚練習は初回から任意。練習はBEST・クリア数・本番RUNに混ぜない。

初期の任意自由ペア生成は一部seedで開始例外になった。失敗原本を保存し、bounded route retry＋元配置の偶数行保証fallbackで解法を持たせた。24枚／48枚の各2000 seedに加え、独立別範囲各1000 seedで全除去witnessを検証。途中の合法選択で詰まる例、戻す・並べ替えで続く例も確認。[生成記録](QA/generation-after-final.json)／[独立モデル](QA/independent/model.json)。

020固有prefixのBESTペア数・クリア盤面数・盤面種・mute・練習完了だけを保存。途中盤面の位置を保存しない境界を明記。他ゲームの保存キー／route／ID／BEST／退役010は維持。新規Catalog・tag・manifest・build入力・実画面サムネイル・Jev profile・既存イベントへ最小登録した。

018は既存少年の全身と足への連続性、値連動SPIN、足首／靴座標からのANGLE矢印・弧、cos/sinの射出描画を採用した。飛距離・基礎物理・靴性能・宇宙／レア・膝・保存・広告・CREDITは不変。[018公開統合追補](../game018/revision03/PUBLICATION_INTEGRATION.md)。

020のWorker登録は後の明示許可で追加。集計列挙20歴史ID／19active、詳細route020、既存specific_game_eventsのtile_pair/hint/undo/reshuffleを使う。認証分離／権限／Secret／query／origin／method／schema／migration／設定は不変。[Worker検証](QA/WORKER_REGISTRATION_RESULT.json)。旧環境では `wrangler whoami` 未認証とCloudflare API許可先不足で本番deployが止まったが、新環境の既存認証／許可で本番反映を完了。[解消済みblocker履歴](QA/WORKER_DEPLOY_BLOCKER.json)／[反映証拠](QA/WORKER_PRODUCTION_DEPLOY_20261007.json)。Pagesの公開とWorker本番反映は別に扱う。

## テストとレビュー

- root `npm run check`／`npm test` **386件・45file**／`npm run build` 成功。既存の2件のCSS構文警告・Phaser大chunk警告は今回変更しない。[単体](QA/tests-release.txt)／[check](QA/check-consent.txt)／[build](QA/build-consent.txt)。
- Worker typecheck、対象22件、実workerd／ローカルD1 **23確認** 成功。synthetic fixtureのみ、8イベント保存、020の4行動・admin/Codex匿名詳細・summary・未来021拒否と既存019回帰。生の本番D1を読まない。
- 25件のoffline Jev helper contractテスト成功。[結果](QA/jev-offline-tests.txt)。
- compiled実操作：1365×900／390×844 touch／320×740 touch／844×390 touch。24／48枚全消去、選択・塞ぎ・無効操作、練習、ヒント／戻す／並べ替え、pause／help、確認cancel、restart、次盤面、保存reload、resize、Portal19掲載、touch cancelを確認。[4画面最終](QA/compiled-consent-final/report.json)。通常の表示と入力を使い、答えを状態へ書き込まない。
- 別のcompiled検証でSpace／repeat／double click、画面外focusのscroll、pause board inert、storage拒否時のmemory play、debug hook不在を確認。[追加QA](QA/extra-input-storage.json)。ストレージ拒否・repeat注入は明示したfixtureで、本人の実機体験ではない。
- 独立Gameplay／Visualは実画像と通常操作を別担当がレビュー。Visual84/100、F13／H13。初回reviewで未網羅だったmodal帰還と遠いkeyboard focusはroot QAで発見し、限定修正後に独立再確認した。後の同意UIのtop-layer干渉もGame020ローカルdialogだけを修正し、共通同意仕様を維持。[Gameplay](GAME_FEEL_REVIEW.md)／[Visual](VISUAL_REVIEW.md)。
- 018固定compiledでPC2RUNとphone相当2RUNをANGLE→SPIN→POWER→結果→retryまで確認。28実画像、pageerror0、レビュー時のruntime hash一致。[018今回QA](../game018/revision03/QA/integration-native/report.json)。
- 既存19active routeと退役010、AdSense script保持・同意設定ボタンをcompiled HTTP／ブラウザで確認。[route](QA/routes/report.json)。旧公開ページの本文／selector期待の修正と外部広告proxy拒否は機械的な検証条件として原本・理由を残した。広告コード／設定は不変。クラウド外部広告配信はstubし、実広告表示成功とは主張しない。

## Jev実利用と素材

9件で実API送信・HTTP200・resolved model・有効な4回答を各行で確認した。finding当時の観測を1問題ごとの4問へ送信し、回答を見ない独立判断と採った方法を後でannotateした。[実API証跡](QA/JEV_API_EVIDENCE.json)／[Shadow原本](QA/JEV_SHADOW.jsonl)／[集計](QA/JEV_SUMMARY.json)。Jevは公開・面白さ・画像評価を代行せず、PASSのために呼ばない。旧018の5件は当時の履歴をオフライン照合し、今回コピー・PASSのための再呼出はしない。小標本の一致率を一般的な有効性や作業節約率へ広げない。[対象外理由](QA/JEV_EXCLUSIONS.json)。

素材は独自 `icons.ts` のコードSVG、システム字体、控えめなAudioService合成音、実プレイ画面のcrop／WebP thumbnail。ImageGen0、他サイト素材流用0。名称検索と米著作権局のルール／具体的表現の区別を参考にし、日本法・商標のクリアランス／権利ゼロは保証しない。[RIGHTS_NOTE](RIGHTS_NOTE.md)／[台帳](../../assets/portal/thumbnails/asset-index.json)。

## 公開と残課題

初回runtime commit `9e3c66de26d017bd85177e4cdffdf1e444292461` をmainへpushし、公式 [Build and deploy arcade run37625676913](https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/actions/runs/37625676913) のbuild／deploy成功を確認した。Game020と追加承認されたGame018 revision03は公開済み。[公開記録](QA/PUBLICATION.json)／[CI実測](QA/pages-runtime-ci.json)。

公開HTTPSで020はPC・390px・320px・横長844pxの4画面を操作し、24／48枚全消去、任意練習、入力・戻す・並べ替え・保存・resize・Portal19掲載を成功した。Analytics同意拒否・送信先遮断を先行し、外向き解析送信の試行も0。[公開4画面](QA/public-final/report.json)。018はPC2RUN／phone相当2RUNの全フェーズ→結果→retryを成功、全28capture不透明比1・pageerror0。[018公開QA](../game018/revision03/QA/public-revision03/report.json)。19activeと退役010の公開routeを確認、AdSense scriptと既存同意UIは維持。[公開route](QA/public-routes/report.json)。

公開後の初回比較では既存CIのAnalytics endpoint環境値を省いたローカルbuildとasset名が異なった。公開済みの非秘密値だけを隔離buildへ再現し、同一runtime commitの35配信fileはSHA256一致した。公開設定・ゲームソースは変えていない。[配信一致](QA/public-assets-final/report.json)／[独立原因確認](QA/independent/public-judgments.json)。初回PC Space不一致はresize未安定の間にキー押下とDOM再描画が重なるdriver条件で2/20再現し、安定後20回と通常Enter／Space10回は成功。testの待機だけを修正し、初回失敗・traceも保存した。

本番に既存Analytics endpointが含まれることと、新作020をWorkerが受理できることは別である。初回公開確認時のWorker本番deployは未認証／許可先不足で未実施だった。後続工程で020登録を本番反映し、Codex集計取得を確認した（末尾追補参照）。

本人の主観試遊、実機スマホ、音・FPS・長時間の快適さは未実施。ユーザーは本人未プレイ公開を明示承認済み。[試遊方法](HUMAN_PLAYTEST.md)。Worker本番登録と020の匿名集計取得は完了。広告・GA4・CREDIT・新権限・次候補・Sheet編集は行わない。再現は [HANDOFF](HANDOFF.md)。

### 公開記録commit後の照合追補

公開証拠commit `96d6e9e765bad4d91af784542e7cc87a9020bb5c` の公式Pages run37628004882もbuild／deploy成功。[実CI](QA/pages-evidence-ci.json)。同じruntimeを再照合するcollectorで、遅延読込画像のresponse.body取得前に次entryへ移動しCDP resourceが失われる例外が出た。per-page Promise.allの初回修正もlate response登録を待ち切れず失敗したため、その原本と当時の観測を保存した。最終collectorはentryごとのPageを生かし、動的なbody取得待ちを終えてから閉じる。対象collectorの実行で**37fileのHTTP200・SHA256一致、pageerror0**を確認した。[最終照合](QA/public-after-evidence-ci/report.json)／[当時の観測](QA/PUBLIC_RESPONSE_BODY_FINDING.json)／[初回調整失敗](QA/PUBLIC_RESPONSE_BODY_FOLLOWUP.json)。製品コード・公開環境変数・Worker設定は追加変更せず、検証処理と記録だけを修正した。同一findingのJev送信は1回の4問、後続の失敗／独立追補は再送せず保全した。

## 2026-10-07 Analytics Worker本番反映追補

既存Worker `game100-analytics`を13:30:18 UTCに反映し、13:31:21 UTCに読み取り検証を完了。version `16ad6d54-bf8d-4f39-be0f-f2176a83e57f`は100%配信。deployment checkoutは`96d6e9e765bad4d91af784542e7cc87a9020bb5c`、Workerソースは登録commit `9e3c66de26d017bd85177e4cdffdf1e444292461`および終了時remote main `7677a57211a16faf2625a597ed16a7dfa2d49293`と同一。元checkout、ゲームfrontend、main、Pagesは編集／commit／push／deployしていない。

health／game020詳細／summaryはHTTP200、game019は互換、game010退役扱いを維持、game021は404。020は登録済み・activeで観測RUN0。実利用が未観測なら0が正常であり、収集不具合や利用者数の結論にはしない。本番確認はGETのみで、qa／synthetic／production test eventは作成していない。

公式既存手順 `npm --prefix analytics-worker run deploy -- --keep-vars`で既存変数とSecret bindingを保持。反映前後のCloudflare API読み取りによりCustom Domain `analytics.game100garage.com`、Cron `17 3 * * *`、D1 ID／binding、保持期間、互換日、Secret名・存在、workers.dev／preview無効が同じことを確認。Secret値を読み取り・比較せず、同じCodex credentialで正常取得、adminへの流用401も確認。live admin credentialの正常取得、Cron実行は未実施。認証・権限・ネットワーク許可は変更せず、remote D1 migrationも実行していない。

取得CLIの許可IDが019までで020をHTTP前に拒否していたため、隔離checkoutで020を1箇所追加し、021拒否と020実HTTP取得の回帰を追加。Worker／root typecheck、対象4file38テスト、実ローカルD1の24確認、Worker dry-run bundle成功。初回のnpm cache／Wrangler registry書込み先不備は許可済みworkspace／一時ディレクトリへ限定して回復。既存固定Wranglerのlocal runtimeは互換日2025-10-01へfallbackするため、その限界を記録した。本番互換日は2026-10-06のまま。

[操作・設定・HTTP証拠](QA/WORKER_PRODUCTION_DEPLOY_20261007.json)。追加承認により本追補・CLI・回帰テストを最新remote mainへ統合する。既存Workerは登録ソースと同一なので再deployしない。旧blockerの観測原本を保持し、解消日時と現行状態を追記した。

CLI統合checkoutで対象38テスト、Worker／root check、build、実ローカルD1の24確認を再実行して成功。buildの既存CSS2件／chunk警告は維持。13:42 UTCに修正済みCLIの本番game020取得も成功、health／game019互換／設定維持を再確認した。[統合検証](QA/ANALYTICS_CLI_INTEGRATION_20261007.json)。この統合commitは既存main pushの公式Pages workflowで確認する。CI結果はpush後に確定させ、未完了を成功扱いしない。
