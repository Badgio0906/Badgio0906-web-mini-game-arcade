# Game031 再開・公開手順

**現在の表示改修:** [textures-a-v1再現/最新状態](textures-a/v1/HANDOFF.md)／[報告](textures-a/v1/IMPLEMENTATION_REPORT.md)。提供8素材512/256、DataArrayTexture、標準Lambert/軽量Basic。世界/保存版1と物理を維持。以下は初版の引継ぎと公開履歴。

正式game_idはgame031。ユーザー発案「掘って、置くだけ。 / DIG & PLACE」、候補表の実装へ数えない。026〜030と退役010のIDを維持。新作統合後Catalogはactive30/historical31、次032は未着手。

読む順序：AGENTS→PROJECT_CONTEXT/CURRENT_STATUS→GAME_DEVELOPMENT_RULES→JEV_REVIEW_RULES→IMPLEMENTATION_SPEC/REPORT→TECHNICAL_QA/各REPORT→ANALYTICS_STATUS。開始時に現在HEAD/branch/statusとremote mainを調べ、他作業treeを保全する。元Game018 revision03を含む15worktreeのbaseline比較はtests/game031/check-protection.py、初期証拠はQA/BASELINE.json。

## 再現

Node24、npm ci、npm run check、npm test、npm run build。単体はtests/unit/game031-{model,save,input,integration}.test.ts。Workerはanalytics-workerでnpm ci/typecheck/testとtests/local-d1.mjs（fixture専用、production送信しない）。

開発ブラウザ：npm run dev -- --host 0.0.0.0 --port 4311。tests/game031/*.mjsへ毎回新しいGAME031_QA_OUTを渡す。extendedはGAME031_MINES=100/GAME031_PLACES=50、正規入力＋読み取りDDA候補計画。caveは元生成データのAIRを読み取り比較して天然空洞到達を判定。mobileはCDPtrusted複数指、input-platformは明示PointerLock/contextloss/画質。native-save/storage-browserは保存のfixture試験。失敗の画面・状態・時刻を残してから原因を切り分け、実findingだけ当時の観測でJev4問。

本番相当buildはqa診断APIが存在しないことを確認。public-mobileはGAME031_DEVICE=desktop|phone、GAME031_PUBLIC_URL指定可、GAME031_EXPECTED_COMMITと専用出力。公式バックアップをメモリで読んで地形/所持hashを比較し、rawバックアップやseed/world_idをレポートや解析へ保存しない。解析同意拒否、外部ingestをabortし、本番の架空RUNを作らない。

## 保持する境界

Three.js0.186.1は031pageのみ、正規データ128X/64Y/128Z、Block/schema/generator1、IndexedDB worlds/current。保存版を無断再生成しない。練習12X/8Y/12Zを本番保存へ混ぜない。手/人物/道具モデルは作らない。既存ゲーム本体/save/BEST、広告/GA4/CREDIT/認証/D1schemaは変更しない。

本番Worker認証が現環境にはないため031の外部収集はOFF。既存権限の環境でコード登録を公開→031匿名集計と認証を確認→031の停止だけ解除する。021〜030のpendingを根拠なく解除しない。本人/物理スマホ未試遊はHUMAN_PLAYTEST.mdのまま、AI技術QAから人間合格を作らない。

公開commit/公式CI/配信照合/実操作はIMPLEMENTATION_REPORTとQA/PUBLICATIONで確認。新しい公開時は最新mainと公式workflowを再確認し、秘密値を表示しない。

## 現在の公開状態

Game031はruntime aead0cf／公式Pages37709128212で公開済み。13配信file一致後、PC11採掘5配置／phone12採掘5配置・保存reloadhash・Portal30確認。本番送信OFF、本人/実機未試遊。公開証拠QA/PUBLICATION.json。環境で再検証するときは設定済みproxyが必要ならNode24にNODE_USE_ENV_PROXY=1、公開PlaywrightrunnerにはGAME031_USE_PROXY=1（既存環境proxyを読んでcredentialを表示/保存しない）。独自proxy/新権限を作らない。
