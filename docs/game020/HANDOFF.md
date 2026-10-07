# 再開と再現

正本は `IMPLEMENTATION_SPEC.md`／`IMPLEMENTATION_REPORT.md`、コード `src/games/game020/`、登録 `src/data/gameCatalog.ts`、`game020.html`。旧作・候補表は編集しない。本人試遊は `HUMAN_PLAYTEST.md` を参照。

再現：`npm ci` → `npm run check` → `npm test` → `npm run build`。ブラウザ確認はChromiumがある環境で `npm run preview -- --port 5520`、別端末で `GAME020_URL=http://127.0.0.1:5520/ GAME020_REPORT=docs/game020/QA/new-run node tests/game020/probe.mjs`。旧QAファイルを上書きしない。`GAME020_PROFILES=desktop,phone` で対象を限定可能。実公開先には `GAME020_URL=https://game100garage.com/` を指定でき、scriptは同意拒否＋解析ドメイン遮断を先に設定する。合成ブラウザを本人評価と呼ばない。

Jevはfinding時のみ4問Shadow、game020の `QA/JEV_SHADOW.jsonl` と独立判断・action証拠。build／PASSのためのAPI呼出なし。productionへJevを接続しない。Workerの020 ID／既存イベント登録は別途明示承認されコード・テストを完了した。旧環境の認証／許可先不足は解消済み。既存Worker version `16ad6d54-bf8d-4f39-be0f-f2176a83e57f`の020登録を本番反映し、health／Codex game020／既存019を確認。[本番反映証拠](QA/WORKER_PRODUCTION_DEPLOY_20261007.json)。Cloud SecretをGitへ保存しない。

今回の公開範囲はGame020と後で明示承認されたGame018 revision03。元の018worktreeを消さず、統合時の証拠は018 `PUBLICATION_INTEGRATION.md`。次候補への着手・Sheet A22更新は行わない。

公開runtimeは `9e3c66de26d017bd85177e4cdffdf1e444292461`、公式Pages run37625676913成功。公開QAは `QA/public-final/`／`QA/public-assets-final/` と018 `QA/public-revision03/`。asset比較は既存公開設定を再現したbuildが必要：`VITE_TELEMETRY_ENDPOINT=https://analytics.game100garage.com/v1/events VITE_GA4_MEASUREMENT_ID='' npm run build -- --outDir /tmp/game020-public-build` → `GAME020_ASSET_DIST=/tmp/game020-public-build GAME020_URL=https://game100garage.com/ GAME020_ASSET_REPORT=docs/game020/QA/new-asset-check GAME020_EXPECTED_COMMIT=9e3c66de26d017bd85177e4cdffdf1e444292461 node tests/game020/verify-assets.mjs`。これは既存の公開非秘密値の照合で、リポジトリ／本番環境変数の変更ではない。新しい確認は新しい出力先へ保存する。

Analytics再現：既存Secretと許可先を利用し、`node --use-env-proxy scripts/fetch-analytics-context.mjs --days 7 --game game020`。stdoutには匿名集計だけが返る。020観測RUN0は正常な空集計。取得結果・生ID・Secret値をGitへ保存せず、qa／syntheticの本番送信も行わない。Worker単体は `npm --prefix analytics-worker run check`、実ローカルD1は `npm --prefix analytics-worker test`。制限付き環境でcache／registryの書込み先が必要な場合は、既存npm cacheや一時的な`XDG_CONFIG_HOME`を許可済みディレクトリへ限定し、local testは実Cloudflare／Analytics credentialを渡さず`NODE_ENV=test`を使う。認証・ネットワーク制約を迂回しない。
