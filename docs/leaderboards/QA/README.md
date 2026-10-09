# QA証拠と再現

合成データはローカルworkerd/D1、NodeSQLite、完全HTTP interceptだけ。本番POSTなし。初回失敗・設定誤り・修正後成功は別pathで保持する。physical device／人間Feel／実screen-reader発話／実投稿は未確認。

|証拠|範囲|
|---|---|
|START_STATE／READ_RECORD|main・branch・worktree・既存正本|
|PRODUCTION_READINESS|本番の公開GET・Worker設定・D1schema/migration読み取りだけ|
|backend-regression|既存records29項目／20board|
|backend-leaderboards|認証・参加者1枠・15人・100RUN・同点・取消・撤回・同時処理24項目|
|backend-d1-performance|0002→0003保持・二重適用・rollback、500/5000/50000履歴、D1rows_read31|
|INDEPENDENT_SOURCE_*|実装者と別agentのSQL15group、資格／modal5tests、静的実画像|
|sharing-01／sharing-02|旧互換95、最終103項目（OFF・解析分離・資格喪失・タブ・登録中OFF・非対応lock）|
|portal-browser-01|初回Tab oracle失敗を保持|
|portal-browser-02／03|114／118成功、大きいdm丸め観測と限定修正|
|portal-browser-04|root fixture endpoint設定違いで4項目時点FAIL、製品変更なし|
|portal-browser-05|固定最終source・buildで118項目／4viewport|
|FINAL_SOURCE_MANIFEST|build前sourceSHA、run中変更なし、fixture配信fileSHA|
|DEFAULT_BUILD_MANIFEST|公式相当endpoint未設定buildfileSHA|
|preparing-browser-01|実HTTP・backend準備中18項目／4viewport|
|legacy-regression-01／02|旧3作PC/phone6RUN。初回testURL置換の誤りを保存、修正後実HTTP36項目成功|
|game015-regression-01|015の旧BEST／新結果／rules03／保存／Portal／retry|
|native-regression-01|既存7作品×PC/phoneの通常操作・保存・結果回帰|
|FONT_COVERAGE|元1106glyph保持＋必要な専1glyph|
|PRESERVATION|ゲーム本体・固定Godotexport・Analytics・広告/CREDIT・ID・旧migration不変|
|JEV_SHADOW／SUMMARY|実finding3件、HTTP200・4問、独立判断。公開合否の委任なし|

再現コマンド（root）。出力先は一意の新pathに変える。

```sh
npm run check
npm test
npx vitest run --config tests/leaderboards/independent-vitest.config.ts
node tests/leaderboards/independent-sql-auth.mjs
python3 -m unittest discover -s tests/jev -p 'test_*.py'
VITE_RECORDS_ENDPOINT=https://records-fixture.test npm run build -- --outDir /tmp/leaderboards-fixture-new
LEADERBOARDS_FIXTURE_DIST=/tmp/leaderboards-fixture-new LEADERBOARDS_QA_OUT=/tmp/qa-enabled-new node tests/leaderboards/portal-browser.mjs
VITE_RECORDS_ENDPOINT=https://records-fixture.test RECORDS_HARNESS_DIST=/tmp/leaderboards-share-new node --experimental-strip-types tests/records/build-harness.mjs
RECORDS_HARNESS_DIST=/tmp/leaderboards-share-new RECORDS_QA_OUT=/tmp/qa-share-new node tests/leaderboards/sharing-browser.mjs
VITE_TELEMETRY_ENDPOINT=https://analytics.game100garage.com node tests/records/build-public.mjs
# 別terminal：python3 -m http.server 8813 --bind 127.0.0.1 --directory dist
LEADERBOARDS_BASE_URL=http://127.0.0.1:8813 LEADERBOARDS_QA_OUT=/tmp/qa-preparing-new node tests/leaderboards/preparing-browser.mjs
RECORDS_SITE_DIST=dist RECORDS_QA_OUT=/tmp/qa-native-new node tests/records/native-game-browser.mjs
LEADERBOARDS_QA_OUT=/tmp/qa-game015-new RECORDS_SITE_DIST=dist node tests/leaderboards/game015-regression.mjs
LEGACY_QA_OUT=/tmp/qa-legacy-new RECORDS_EXPECTED_COMMIT=<baseline40hex> LEADERBOARDS_BASE_URL=http://127.0.0.1:8813 node tests/leaderboards/legacy-browser.mjs
cd analytics-worker
npm run check
RECORDS_TEST_REPORT=/tmp/qa-records-new.json node tests/records-local-d1.mjs
LEADERBOARD_TEST_REPORT=/tmp/qa-ranking-new.json node tests/leaderboards-local-d1.mjs
LEADERBOARD_PERFORMANCE_REPORT=/tmp/qa-load-new.json node tests/leaderboards-d1-performance.mjs
npm test
```

wranglertestsの8807/8808/8810portは同時に重ねない。Node24とChromium `/usr/bin/chromium`が必要。既存scriptsのdefault結果先を使って過去の証拠を上書きしない。以前のbrowser03はhashmanifestなしだったため最終05で固定buildを補完した。root04の設定誤りはFIXTURE_CONFIGURATION_CORRECTIONを参照。
