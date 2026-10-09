# STEP 1再開・本番接続

2026-10-09 JST STEP2追補：本番0002／0003適用・Workerrecords ONまで確認済み。現行状態・停止・残確認は [STEP2報告](step2/IMPLEMENTATION_REPORT.md)／[接続後手順](step2/HANDOFF.md)。下のSTEP1のOFF／未適用記述は当時の履歴。

実装／QA／Pages公開／Worker稼働／実投稿受信は [IMPLEMENTATION_REPORT](IMPLEMENTATION_REPORT.md) で別々に確認する。検証fixtureを本番へ投稿しない。秘密キーをチャットへ貼らない。認証は既存CloudflareアカウントのSecret管理または既存CLI認証を使う。

## 確認済みの接続状態

2026-10-09読み取り：既存 `game100-analytics` version `16ad6d54-bf8d-4f39-be0f-f2176a83e57f` が100%配信、health200。`DB` は `game100garage-production`／`122c6f47-1f9e-4863-9b3d-54b066f17cc7` と一致。既存管理Secretあり。D1には0001_events.sqlだけ適用済み、recordsテーブルなし。BEST／TOP10は404、RECORDS_ENABLEDはOFF。今回はCloud Environmentの既存Cloudflare認証が読み取りに使えた。[安全な証跡](QA/PRODUCTION_READINESS.json)。本番migration／Worker更新／フラグON／架空投稿はSTEP1で行っていない。

この状態は将来の保証ではない。実行直前に最新main、Cloudflare対象アカウント、DB binding／ID、migration履歴を再確認する。

## ローカル再現

```sh
npm ci
npm run check
npm test
npm run build
cd analytics-worker
npm ci
npm run check
RECORDS_TEST_REPORT="$PWD/.wrangler/recheck-records.json" node tests/records-local-d1.mjs
LEADERBOARD_TEST_REPORT="$PWD/.wrangler/recheck-leaderboards.json" node tests/leaderboards-local-d1.mjs
npm test
```

追加ブラウザと独立QAの正確なコマンド／環境変数は [QA/README](QA/README.md)。結果先は新しい一意pathを指定し過去失敗を上書きしない。localテストには合成・隔離D1だけを使う。

## 本番有効化の順番

1. Cloudflare Dashboardで既存アカウントの **Workers & Pages → game100-analytics → Settings → Bindings** と **Storage & Databases → D1 → game100garage-production** を確認。認証が使えなければ既存アカウントで認証してから続ける。新アカウント／DB／広い権限を作らない。
2. 最新mainの0001〜0003と台帳を照合、Time Travel／backupの復帰可能時点をprivate運用記録へ保存。必要ならprivateディレクトリへexportしGitへ入れない。

```sh
cd analytics-worker
npx wrangler d1 migrations list DB --remote
npx wrangler d1 time-travel info DB --json
npx wrangler d1 export DB --remote --output /private/backup/game100garage-before-leaderboards.sql
```

3. 未適用が **0002_records.sqlと0003_leaderboards.sqlだけ**（または0002適用済みで0003だけ）と確認できたときに限り通常のmigration applyを使う。無関係なpendingがあれば一括applyを止め、対象ファイルだけの別migration_dir設定をprivateの作業設定へ用意し、台帳名と対象DBを保ったまま選択適用する。0001が未適用／対象不一致ならその原因を確認する。

```sh
npx wrangler d1 migrations apply DB --remote
npx wrangler d1 migrations list DB --remote
```

4. `analytics-worker/wrangler.jsonc` の本番varsでは **RECORDS_ENABLED未設定／false** のまま最新Workerをdeploy。既存Analytics ingest／Codex／管理認証境界を確認し、記録GETが503 records_preparingであることを確認。管理Secretの値を表示／変更しない。最新mainの既存Analytics登録差分は別に確認し、一般解析送信OFFを解除しない。

```sh
npx wrangler deploy
curl --fail https://analytics.game100garage.com/v1/health
```

5. Cloudflare Workerの **Settings → Variables and Secrets → RECORDS_ENABLED** を文字列trueにし、再deploy時も維持するよう本番configのvarsへ同じ設定を反映する（Dashboardだけの値が次deployで消えないようにする）。公開GETの正常schema／20board／空null／TOP10空／revisionを確認。legacy投稿がある場合は所有者NULLを保持し公開集合から除外する影響を確認。管理GETは既存管理UIで確認し、secretをコマンド引数・URLへ置かない。

```sh
curl --fail https://analytics.game100garage.com/v1/records/public/bests
curl --fail 'https://analytics.game100garage.com/v1/records/public/leaderboard?board_id=game001.score.r1.all'
```

6. GitHubの当該repository **Settings → Secrets and variables → Actions → Variables** で公開URL `VITE_RECORDS_ENDPOINT=https://analytics.game100garage.com` を設定し、`.github/workflows/pages.yml` のbuild envへ `VITE_RECORDS_ENDPOINT: ${{ vars.VITE_RECORDS_ENDPOINT }}` を追加。管理token／credentialをGitHub公開変数や配信JSへ入れない。STEP1の公式workflowはendpoint接続なしのままなので、単に変数を作っても有効にはならない。
7. 公式 **Build and deploy arcade** の対象commit build/deploy成功と公開HTML／JS／CSS配信版を確認し、PC／スマホでTOP10を開く。別同意のまま解析OFF＋共有ON、解析ON＋共有OFFを確認する。
8. ユーザー自身の実プレイで新しい通常RUNだけ共有し、自動「ガレージ住人」表示名、同ブラウザ再RUN1枠、全体BEST＝TOP1、receipt撤回後の次点復帰を確認。既存個人BESTを新RUNとして投稿しない。実投稿受信はこの実確認を完了して初めて報告する。

## 停止・復旧と禁止操作

障害時はRECORDS_ENABLED=falseとフロントendpoint無効で共有を停止。Analytics／GA4／広告／CREDITと別に扱う。0002／0003の書換え、records／events／daily_aggregatesのDROP/DELETE、所有者推測補完、撤回済み行の復活、本番への合成スコアは禁止。取消は既存review監査、restoreはpending再審査、recalculateは実accepted候補だけを使う。Time Travelの復旧は他の本番書込みへの影響を確認してから実施する。
