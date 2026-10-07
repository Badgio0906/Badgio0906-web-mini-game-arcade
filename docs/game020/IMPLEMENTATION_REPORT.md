# Game020 実装・検証・公開報告

正式名：**すっきり牌合わせ ～PAIR TILE～**。ID `game020`、公開予定URL `https://game100garage.com/game020.html`。候補表シート1・行22／No21の1本のみを対象とした。次候補・Sheet A22は変更していない。

基準main `fd1d09a293cd8da1b9dbfeb73dc3e68e27ad7bcc` から隔離branch `codex/game020-pair-tile` を作成。後で明示承認された018 revision03と020 Worker登録だけを追加統合した。元018worktreeは182file・status／branch／HEADを保全。[指示読込](QA/INSTRUCTION_READS.jsonl)／[保全確認](QA/ORIGINAL_WORKTREE_FINAL_CHECK.json)。過去の未公開記録を公開確認へ流用しない。

## 変更と互換

独自幾何学牌と24／48枚の多層盤面。上が空き左右片側が空いた同柄2枚を取る古典ルールを維持し、制限時間・ミス罰・強制特殊モードを入れない。ヒント／1手戻す／解法検証付き残牌並べ替え／元盤面のやり直し／任意の次盤面。マウス、Tab・矢印・Enter・Space、タップに対応。開始3択と専用8枚練習は初回から任意。練習はBEST・クリア数・本番RUNに混ぜない。

初期の任意自由ペア生成は一部seedで開始例外になった。失敗原本を保存し、bounded route retry＋元配置の偶数行保証fallbackで解法を持たせた。24枚／48枚の各2000 seedに加え、独立別範囲各1000 seedで全除去witnessを検証。途中の合法選択で詰まる例、戻す・並べ替えで続く例も確認。[生成記録](QA/generation-after-final.json)／[独立モデル](QA/independent/model.json)。

020固有prefixのBESTペア数・クリア盤面数・盤面種・mute・練習完了だけを保存。途中盤面の位置を保存しない境界を明記。他ゲームの保存キー／route／ID／BEST／退役010は維持。新規Catalog・tag・manifest・build入力・実画面サムネイル・Jev profile・既存イベントへ最小登録した。

018は既存少年の全身と足への連続性、値連動SPIN、足首／靴座標からのANGLE矢印・弧、cos/sinの射出描画を採用した。飛距離・基礎物理・靴性能・宇宙／レア・膝・保存・広告・CREDITは不変。[018公開統合追補](../game018/revision03/PUBLICATION_INTEGRATION.md)。

020のWorker登録は後の明示許可で追加。集計列挙20歴史ID／19active、詳細route020、既存specific_game_eventsのtile_pair/hint/undo/reshuffleを使う。認証分離／権限／Secret／query／origin／method／schema／migration／設定は不変。[Worker検証](QA/WORKER_REGISTRATION_RESULT.json)。本番deployは `wrangler whoami` 未認証とCloudflare API許可先不足により未実施。[blocker](QA/WORKER_DEPLOY_BLOCKER.json)。Pagesの公開とWorker本番反映は別に扱う。

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

6件で実API送信・HTTP200・resolved model・有効な4回答を各行で確認した。finding当時の観測を1問題ごとの4問へ送信し、回答を見ない独立判断と採った方法を後でannotateした。[実API証跡](QA/JEV_API_EVIDENCE.json)／[Shadow原本](QA/JEV_SHADOW.jsonl)／[集計](QA/JEV_SUMMARY.json)。Jevは公開・面白さ・画像評価を代行せず、PASSのために呼ばない。旧018の5件は当時の履歴をオフライン照合し、今回コピー・PASSのための再呼出はしない。小標本の一致率を一般的な有効性や作業節約率へ広げない。[対象外理由](QA/JEV_EXCLUSIONS.json)。

素材は独自 `icons.ts` のコードSVG、システム字体、控えめなAudioService合成音、実プレイ画面のcrop／WebP thumbnail。ImageGen0、他サイト素材流用0。名称検索と米著作権局のルール／具体的表現の区別を参考にし、日本法・商標のクリアランス／権利ゼロは保証しない。[RIGHTS_NOTE](RIGHTS_NOTE.md)／[台帳](../../assets/portal/thumbnails/asset-index.json)。

## 公開と残課題

本報告の初回commit時点ではcommit／Pages CI／公開検証は未確定。実結果は `QA/PUBLICATION.json` と下の公開追補へ保存する。期待commitの公式Build and deploy arcade成功を確認してから公開済みへ更新する。

本人の主観試遊、実機スマホ、音・FPS・長時間の快適さは未実施。ユーザーは本人未プレイ公開を明示承認済み。[試遊方法](HUMAN_PLAYTEST.md)。認証／ネットワークが整うまではWorker本番登録が残る。広告・GA4・CREDIT・新権限・次候補・Sheet編集は行わない。再現は [HANDOFF](HANDOFF.md)。
