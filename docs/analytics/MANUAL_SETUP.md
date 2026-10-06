# 本番設定の残作業

現時点ではGA4 Measurement IDと本番Telemetry endpointの未設定時、外部解析はdisabled。アダプター・Worker・D1 migration・管理画面のコード完成と、本番収集開始は別に扱う。本番設定と実送信確認を行うまで「導入完了」「本番データ収集済み」と記載しない。実行結果は統合QA・CURRENT_STATUSが正本。

## GA4

1. Google AnalyticsでGA4 propertyを作り、`https://game100garage.com`のWeb data streamを作成する。
2. `G-...`のMeasurement IDを取得する。
3. GitHub repositoryのActions Variables（非秘密）に`VITE_GA4_MEASUREMENT_ID`を設定する。Pages build時に同名環境変数を渡す。ローカル確認は同名の環境変数でViteを起動する。
4. Pagesを再deployする。未知/拒否ではGoogle tagをロードせず、許可後だけロードすることをブラウザのNetworkで確認する。
5. GA4 Realtimeで同意後の訪問・ゲーム開始を確認する。同意拒否時にイベントが送られないことも確認する。GA4保持期間・運営権限等はGoogle管理画面で設定する。

## Cloudflare Worker / D1

Cloudflareログイン/API権限がある運営環境で実行する。秘密の実値をコマンド引数、チャット、ドキュメント、Vite環境変数へ書かない。API tokenは環境メモリまたはCloudflare公式の認証手段で扱う。

```sh
npm --prefix analytics-worker ci
cd analytics-worker
npx wrangler d1 create game100-analytics
```

取得した非秘密のdatabase IDを`analytics-worker/wrangler.jsonc`の本番`d1_databases[].database_id`へ設定する。binding名は`DB`。開発用DBは本番から分離する。

```sh
npm run migrate:remote
npx wrangler secret put ANALYTICS_ADMIN_TOKEN
npm run deploy
```

管理トークンはsecret putの対話入力で登録する。WorkerのCustom Domainとして運営のanalytics用ドメイン（例：`analytics.game100garage.com`）をCloudflare管理画面/Worker設定に登録し、HTTPSで稼働することを確認する。許可originは公開サイトと必要な運営環境だけに制限する。

- `GET /v1/health`の正常応答を確認する。
- 認証なしの`GET /v1/admin/summary`が401/403となることを確認する。
- 正しいBearer tokenで集計取得、別origin拒否、件数/サイズ/スキーマ拒否を確認する。トークンをURLに入れない。
- Cronによる保持期限処理が実行されることを確認する。raw90日とIDを含まない日次集計13か月を混同しない。

GitHub Actions Variables（非秘密）に`VITE_TELEMETRY_ENDPOINT=https://analytics.game100garage.com/v1/events`を設定し、Pages buildへ渡して再deployする。未設定ならuploadはdisabled。管理画面も同じendpointからWorker baseを導く。本番のsecretやCloudflare API tokenはWorker deploy専用であり、Pages bundleに含めない。

最後に公開サイトで、同意前送信0・許可後送信・拒否後停止・オフラインでも遊べること・productionの管理集計・GA4との分離を検証する。QAイベントは`qa`、fixtureは`synthetic`、開発は`development`へ分離し、本番データに混ぜない。

## 管理画面とexport

直接`https://game100garage.com/analytics-admin.html`を開く。ポータルから一般ユーザーへリンクしない。管理者が実行時にtokenを入力し、集計を取得する。期間、環境、退役表示を確認し、利用後は「トークン・表示を消去」する。ブラウザの保存・exportに管理トークンがないことを確認する。

[ADMIN_DASHBOARD](ADMIN_DASHBOARD.md)に分母・欠測・日別履歴の制約、[UTM_RULES](UTM_RULES.md)にSNSリンクの命名を記載。集計exportはJev APIを呼ばず、改善分析のためのJSONだけを作る。
