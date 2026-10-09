# 共有記録の運用・有効化

2026-10-09 JST STEP2：本番0001〜0003適用、Workerrecords ON、既存Analytics／Secret／DB保持。最新の [本番接続報告](../leaderboards/step2/IMPLEMENTATION_REPORT.md) と [停止／再開](../leaderboards/step2/HANDOFF.md) を優先する。以下の未適用手順は当時の履歴。

2026-10-09 STEP1追補：TOP10・参加者識別の現行仕様と本番順序は [leaderboards/HANDOFF](../leaderboards/HANDOFF.md)。今回の既存Cloudflare認証は読み取り成功、対象D1には0001だけ、recordsは未適用／OFF。0002だけを適用する以下の旧手順は履歴であり、今後は0002＋0003の対象限定・Time Travel確認を行う。旧未識別submissionを保持し、新公開BESTとTOP10は同じ確認済み所有者の集合から取得する。

## 今回の環境

2026-10-08の作業開始時、承認済みのCloudflare認証は利用できなかった（rootによる既存wrangler認証確認）。新規login、アカウント、広い権限、Secret、remote migration、Worker deploy、productionフラグ変更は行っていない。コードと加算型migrationは完成・ローカル検証対象、本番の「みんなのBEST」稼働とは区別する。

対象既存Worker: `game100-analytics`。既存D1 binding: `DB`、database: `game100garage-production`。本番設定ファイル・認証・Analytics一般送信停止は変更しない。記録機能のフラグ `RECORDS_ENABLED` は未設定が安全なOFF。フロントのrecords endpoint/enable設定は、バックエンド確認後に有効化する。

## 後続の認証済み運用

1. 最新mainの対象commit、既存D1とmigration履歴を確認する。新規D1を作らない。
2. D1 Time Travel／既存backupの利用範囲を確認し、戻せる時点を記録する。必要なexportを作る場合は、解析個人IDを含むためGit・公開docs・公開ログへ保存しない。
3. 隔離local D1で `0001_events.sql`＋`0002_records.sql` を適用しtestsを通す。
4. remote未適用migrationをlistし、今回の`0002_records.sql`だけが対象であることを確認する。無関係なpending migrationがあれば一括applyしない。`0001`が既に適用済みで今回だけpendingの場合に限り通常の`wrangler d1 migrations apply DB --remote`を利用する。
5. migrationは5つのrecords表・索引・triggerの追加のみ。既存events/daily_aggregatesのDROP/DELETE/再生成はしない。
6. 既存Workerを記録フラグOFFでdeployする。既存ingest/admin/codexの回帰とdisabled503を確認。
7. 既存管理Secretが設定され管理認証が有効であることを秘密値を出さず確認。Codex tokenは管理へ使えない。
8. recordsフラグを明示ONにし公開GET（初期はempty/null）と管理GETを確認する。架空記録や自動QAをproductionへ投稿しない。
9. バックエンドの期待版を確認後、公式Pages workflowへ限定 `VITE_RECORDS_ENDPOINT: ${{ vars.VITE_RECORDS_ENDPOINT }}` を追加し、既存GitHub管理権限でその公開URL変数を設定して公式Pagesで公開。今回workflowにこの変数を接続せず、コンパイル時endpointは空の安全状態。解析同意や一般Analytics送信制御は別のまま。
10. 機能公開済み・実プレイヤー投稿受信済み・人間評価済みは別状態で報告する。

本番token・receiptはコマンド引数、URL、報告、公開JS、localStorage管理キーに含めない。管理画面は既存メモリ入力の管理tokenを必要な管理経路だけへ送る。公開GETに認証は付けない。

## 停止・復旧

問題時はrecordsフラグOFFとフロント投稿OFFで停止する。既存Analyticsを停止／有効化する操作と混同しない。テーブルや候補台帳はDROPしない。accepted最高値を取り消すと次のaccepted候補へ戻る。pendingは保留確認、誤取消はrestore→pending→再確認で扱う。withdrawnは運営restore不可。

BEST再計算は実投稿候補からのみ。管理者が数字を直接入力して記録を作るAPIはない。公開GETの正常キャッシュは60秒、失敗と管理応答はno-store。全拠点の即時無効化とは説明しない。

acceptedは長期候補保持、pendingは2000件/7日、最小dedup/撤回台帳は保持する。D1容量・pending件数・429・運営処理を監視する。service全体120新規投稿/分は利用者別制限ではなく、悪意ある占有を防ぐ完全な対策ではない。容量削減が必要な場合は次候補や再送抑止を失う影響を先に評価する。

## ローカル再現

```sh
cd analytics-worker
npm ci
npm run check
RECORDS_TEST_REPORT="$PWD/../docs/records/QA/backend-local-unique-run.json" node tests/records-local-d1.mjs
npm test
```

fixturesはローカル専用tokenと隔離 `.wrangler/records-<UUID>` D1を使う。test wrapperはtests用configだけから読み、production configは `src/index.ts` のまま。wrapperのrollback/retention/flag fixture経路をproductionへ配信しない。新しい出力先を指定し過去失敗/成功を上書きしない。通常の`npm test`は元Analytics local D1回帰。test成果に実プレイヤー記録や秘密値を保存しない。

新作の登録は `recordDefinitions`、既存保存adapter、最小の結果通知、Worker登録/整数比較/モード/版/補助条件テストを追加する。未使用IDを範囲regexだけで受け付けない。
