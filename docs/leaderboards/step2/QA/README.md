# STEP2 QA証拠と再現

本番スコア／参加者fixtureは0件。公開APIの実scoreや集計payloadをfixtureとしてGitへ保存しない。private Time Travel bookmark／バックアップはGit外。

|証拠|確認範囲|
|---|---|
|START_STATE／PREFLIGHT|最新main、対象Worker／DB／台帳／件数／設定名|
|BACKUP|復旧bookmark取得成功、privateのみ保存、raw export未実施|
|MIGRATION_FIRST_ATTEMPT／POST_FAILURE|remote0002解析失敗、schema／台帳／件数無変更|
|D1_ARRAY_READ_PROBE／READ_PARSE_PROBES|読み取りだけのAPI能力確認、array／BEGIN非対応|
|LOCAL_STATEMENT_PARSING|SQLite完全statement11/18、元SQLの各statement実行|
|MIGRATION_TRANSPORT_LOCAL_*|local引数／PRAGMA失敗を別保存、最終workerd/D1 success＋rollback5項目|
|MIGRATION_APPLIED|原migrationSHA保持、送信用CASE/END空白補正、remote台帳0001〜0003とAnalytics件数保持|
|WORKER_OFF_*／ON_*|OFF21、ON143項目・20board、既存vars／Secret名／DB／cron保持|
|GITHUB_VARIABLES|read/set403、Variables優先fallback、指定originのprebuild検査|
|ROOT_QA／local regression|root887／check／build、既存records・Analyticsの実localD1|
|INDEPENDENT_DEPLOYMENT_REVIEW|独立source／SQLite／lexer／設定レビュー。非盲検制約も記載|
|JEV_SHADOW／SUMMARY|実finding1件、HTTP200。公開／数値／SQL判定は委任しない|
|SOURCE_PRESERVATION|STEP1基準からsrc/public/Worker src/旧migrationほかbyte不変|
|native-enabled-01|固定endpoint有効build・8作品×PC/phone16ケースPASS、全POST遮断|
|CANDIDATE_BUILD_MANIFEST|endpoint ONの固定candidate配信hash、ブラウザ中編集なし|

```sh
npm run check
npm test
VITE_GA4_MEASUREMENT_ID= VITE_TELEMETRY_ENDPOINT=https://analytics.game100garage.com/v1/events VITE_RECORDS_ENDPOINT=https://analytics.game100garage.com npm run build
# unique out、候補build固定、全POSTを遮断。ゲーム8作品PC/phone16ケース
RECORDS_QA_OUT=/tmp/new-native-enabled RECORDS_SITE_DIST=dist node tests/leaderboards/native-enabled-browser.mjs
# 公開GET／認証境界のみ、scoreや参加者は作らない
node --use-env-proxy tests/leaderboards/production-connection.mjs on /tmp/new-public-api.json
LEADERBOARDS_QA_OUT=/tmp/new-public-ui RECORDS_EXPECTED_COMMIT=<40hex> node tests/leaderboards/production-browser.mjs
node --use-env-proxy tests/leaderboards/verify-public.mjs <40hex> <official-run-id> /tmp/new-published-hashes
cd analytics-worker
npm run check
RECORDS_TEST_REPORT=/tmp/new-records-local.json node tests/records-local-d1.mjs
npm test
RECORDS_TRANSPORT_REPORT=/tmp/new-transport.json node tests/records-migration-transport.mjs
```

Node24／Chromiumが必要。報告先は一意の新path。既存records runnerは絶対pathで指定する。migration原本変更・本番scorePOSTは不要。追加roleはレビューだけで本番アクセス無し。人間／物理端末／音の評価と自動QAを分ける。
