# 再開と再現

正本は `IMPLEMENTATION_SPEC.md`／`IMPLEMENTATION_REPORT.md`、コード `src/games/game020/`、登録 `src/data/gameCatalog.ts`、`game020.html`。旧作・候補表は編集しない。本人試遊は `HUMAN_PLAYTEST.md` を参照。

再現：`npm ci` → `npm run check` → `npm test` → `npm run build`。ブラウザ確認はChromiumがある環境で `npm run preview -- --port 5520`、別端末で `GAME020_URL=http://127.0.0.1:5520/ GAME020_REPORT=docs/game020/QA/new-run node tests/game020/probe.mjs`。旧QAファイルを上書きしない。`GAME020_PROFILES=desktop,phone` で対象を限定可能。実公開先には `GAME020_URL=https://game100garage.com/` を指定でき、scriptは同意拒否＋解析ドメイン遮断を先に設定する。合成ブラウザを本人評価と呼ばない。

Jevはfinding時のみ4問Shadow、game020の `QA/JEV_SHADOW.jsonl` と独立判断・action証拠。build／PASSのためのAPI呼出なし。productionへJevを接続しない。Workerの020 ID／既存イベント登録は別途明示承認されコード・テストを完了した。本番deployだけは既存Cloudflare認証と許可先不足で未実施。Cloud SecretをGitへ保存しない。

今回の公開範囲はGame020と後で明示承認されたGame018 revision03。元の018worktreeを消さず、統合時の証拠は018 `PUBLICATION_INTEGRATION.md`。次候補への着手・Sheet A22更新は行わない。

公開runtimeは `9e3c66de26d017bd85177e4cdffdf1e444292461`、公式Pages run37625676913成功。公開QAは `QA/public-final/`／`QA/public-assets-final/` と018 `QA/public-revision03/`。asset比較は既存公開設定を再現したbuildが必要：`VITE_TELEMETRY_ENDPOINT=https://analytics.game100garage.com/v1/events VITE_GA4_MEASUREMENT_ID='' npm run build -- --outDir /tmp/game020-public-build` → `GAME020_ASSET_DIST=/tmp/game020-public-build GAME020_URL=https://game100garage.com/ GAME020_REPORT=docs/game020/QA/new-asset-check node tests/game020/verify-assets.mjs`。これは既存の公開非秘密値の照合で、リポジトリ／本番環境変数の変更ではない。新しい確認は新しい出力先へ保存する。
