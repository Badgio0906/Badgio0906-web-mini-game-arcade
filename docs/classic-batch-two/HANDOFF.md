# 第2バッチ 引継ぎ

対象026〜030の5作品は実装・技術QA・本番Pages試作公開・対象候補表更新を完了。正本は[REQUEST](REQUEST.md)→優先[ADDITIONAL_INSTRUCTIONS](ADDITIONAL_INSTRUCTIONS.md)、結果は[報告](IMPLEMENTATION_REPORT.md)。次031や次バッチは未着手で、今回の権限では開始しない。

| ID | URL | 検証済みruntime | 公式Pages | Sheet済 |
|---|---|---|---|---|
|026|https://game100garage.com/game026.html|cd6d7ad|37669966367|A33|
|027|https://game100garage.com/game027.html|ff369e5|37675920015|A47|
|028|https://game100garage.com/game028.html|4310be3|37680233126|A11|
|029|https://game100garage.com/game029.html|8d3ac39|37681354491|A42|
|030|https://game100garage.com/game030.html|bd0d293|37682943758|A49|

各 `docs/gameNNN/QA/PUBLICATION.json` からsource freeze・CI・配信版・通常PC/phone結果／再挑戦／保存・Portal・Sheet読戻しを辿る。現在active29/historical30、010退役維持、以前のsave/BEST/route互換を保持。029phone pause問題の初期説明と030初回Vite登録漏れは失敗記録を上書きせず後続証拠で修正し、旧pending文は当時の履歴として残す。

## 再現

新環境はAGENTS→PROJECT_CONTEXT/CURRENT_STATUS→GAME_DEVELOPMENT_RULES→JEV_REVIEW_RULES、今回のREQUEST/追加指示を読む。既存branch/HEAD/statusと未commitを確認して保全する。依存はroot/analytics-workerで `npm ci`。rootの `npm run check`、`npm test`、`npm run build`、Workerの `npm run check`／`npm test` が再現コマンド（本番D1は触らない）。最終737tests/67files、offline Jev helper25、実ローカルD138events/12RUN。現在の実Vite設定の全catalog物理route回帰も含む。

独立ゲームだけを作る場合、各 `tests/gameNNN/vite.config.*` と現行sourceからprivate build/previewを準備し、source/build freezeを**新しいQAファイルへ**記録する。各native collectorは `GAME026_BASE` / `GAME027_BASE` / `GAME028_BASE_URL` / `GAME029_BASE` / `GAME030_BASE` 等（正確な変数は該当collector先頭）で接続先、`GAME…FREEZE` と一意のoutputで固定QAを再現する。029は `GAME029_COMPILED_DIR` でその再現buildを指定できる。030のfreezeには `source_files/build_files/root_owned_dependency` が必要で、絶対パスもcollectorが解決する。過去の `/tmp` 配信buildを現在もあると仮定せず、同設定でbuildして**新規freeze**を作る。過去のprivate compiled hashを公開artifact一致と読み替えない。実ブラウザは同時起動せず、最初の新しいsemantic unknownは停止／before源・DOM・状態・trace・画像を保存してfinding Shadowを適用する。

公開QAを再実施する場合は、先に期待commitの公式Pages build/deployと配信ファイルを確認する。`tests/classic-batch-two/verify-public.mjs`、`public-portal.mjs` と各native collectorが使用可能。検証した公開設定はGA4 ID空／既存Telemetry endpointで、設定変更の許可ではない。analytics/ad request遮断、同意拒否、qa/synthetic環境を維持して実利用集計へテストを送らない。

## 残る作業と境界

本番Workerは[最終認証確認](QA/WORKER_FINAL_AUTH_CHECK.json)でも未認証、deployしていない。026〜030のコード登録とローカルD1確認は完了。既存認証・許可先が使える環境で必要な本番反映と匿名API確認が済むまで、021〜030の中央pending／ゲームremoteCollectionEnabled:falseを解除しない。新しいSecret・認証権限・D1 schema/migration・広告・GA4・CREDIT変更は今回実施しない。既存001〜020登録を上書きしない。

本人の面白さ評価・物理スマホ試遊は未実施、ユーザーの未プレイ公開承認と区別する。Jevは[実利用監査](JEV_USAGE_REPORT.md)に全28 API／有効4回答と判断・採否・手順逸脱を記録し、自動Gateや面白さの代行に使わない。本人評価が得られたら元記録を改ざんせず追補する。

旧9tree／018未commit作業は保全した。共有file競合は最新mainで安全に統合し、`git add -A`やreset/cleanで他作業を消したり混ぜたりしない。今後の引継ぎはこのリポジトリのsource・仕様・QAに基づき、一時serverや会話記憶に依存しない。
