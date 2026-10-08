# 共有記録 API と検査

対象は既存 Analytics Worker に追加した `/v1/records/*` のみ。`/v1/events`、`/v1/admin/*`、`/v1/codex/*` の認証・集計・保持仕様を変更しない。正本の board は [recordDefinitions](../../src/data/recordDefinitions.ts)。現在の本番 Worker は未更新、`RECORDS_ENABLED` は未設定であり、下記はローカル D1 で検証した実装仕様。

## 経路

| 経路 | 認証・応答 |
|---|---|
| `GET /v1/records/public/bests` | 公開、一括取得。query 不可、Authorization を送らない。正常応答だけ `public, max-age=60, must-revalidate` |
| `POST /v1/records/submissions` | 利用者が明示共有した新しい確定結果。許可 Origin が必須、Authorization 不可 |
| `POST /v1/records/submissions/withdraw` | 投稿のランダム receipt を検証して撤回。許可 Origin 必須 |
| `GET /v1/records/admin/submissions` | 既存 `ANALYTICS_ADMIN_TOKEN` の Bearer 認証のみ。`board_id`、`status`、`limit`（1～100、既定50）だけ受け付ける |
| `POST /v1/records/admin/submissions/:id/review` | 同じ管理認証。保留承認／拒否、受付取消、再審査 |
| `POST /v1/records/admin/boards/:board_id/recalculate` | 同じ管理認証。実際の accepted 候補から再計算。任意の記録値を作らない |

管理・投稿・エラー応答は `no-store`。Codex token は管理・投稿へ利用できない。管理 token 未設定は503。機能フラグは `RECORDS_ENABLED="true"` のときだけ動作し、未設定・false は503 `records_preparing`。Origin は既存 Worker の許可関数を再利用し、production は `https://game100garage.com` と `https://www.game100garage.com`、development だけ localhost を許可する。許可外 Origin は403。

## 値と公開応答

整数の基準単位を送信・保存する。`storageScale=10` なら `value=1234` は123.4mであり、表示時に定義の scale で割る。単位・大小方向・scale をクライアントが変更する field は受け付けない。0 は有効値、欠測はnull。

```json
{
  "schema_version": 1,
  "definition_version": "1",
  "generated_at": "server ISO timestamp",
  "cache_ttl_seconds": 60,
  "boards": [{
    "game_id": "game018",
    "board_id": "game018.distance.r1.all-shoes",
    "metric_id": "distance",
    "value": null,
    "unit": "m",
    "mode_label": "全靴",
    "ruleset_id": "1",
    "status": "empty",
    "collected_since": "server first board registration timestamp",
    "revision": 0
  }]
}
```

上記 board 文字列は形を示す例であり、実際の条件・ID は定義ファイルを参照。公開応答には投稿 ID、RUN結果 ID、receipt、そのハッシュ、検査理由、結果メタデータ、送信者情報を返さない。名前・順位一覧もない。未知 query を拒否しキャッシュの増殖を防ぐ。取消後はサーバー再計算が同じ transaction で反映され、ブラウザの正常キャッシュは最大60秒。Cloudflare 全拠点の即時 purge は実装・主張しない。

## 投稿

必須 field（未知 field は拒否）:

- `schema_version: 1`
- `submission_key`、`run_result_id`: 結果ごとに一度作る UUID。通信再送で作り直さない。
- `game_id`、`board_id`、`ruleset_id`: 公開定義との完全一致。
- `game_build`: ASCII英数、`_ . -` の1～80文字。比較条件の ruleset とは別。
- `environment: "production"`: practice／qa／synthetic／development 結果は拒否。自己申告だけで真正プレイは保証しない。
- `value`: 非負 safe integer、ゲーム別 maxValue 以下。
- `withdrawal_receipt`: 投稿ごとに暗号乱数32bytesを生成した小文字hex64文字。ブラウザだけが元値を保持し、サーバーはSHA-256 hashを保存。URLには含めない。
- `allowed_result_metadata`: 下記5fieldだけ。

```json
{"finalized":true,"mode_id":"registered mode","assistance":"none","duration_ms":2000,"outcome":"complete"}
```

`assistance` はnone／allowed（boardがnoneを要求するときはnoneだけ）、`duration_ms` は0～86,400,000の整数、`outcome` はcomplete／quit／milestoneだけ。文字列数値、NaN相当、Infinity相当、負数・小数、不明版／モード、不正 metadata を拒否。body は8KiBまで、UTF-8 JSONのみ、読み取りtimeout5秒。描画値や過去BEST保存だけを新しい結果として送らない。

通常は201 accepted、大きい疑義値は202 pending。閾値は前の世界BESTに依存しない。endless作品のmaxはsafe integerであり、review閾値は不可能値の証明ではない。送信済み同内容の再送は200、同keyで内容を変えた場合と別keyで同boardのrun_result_idを再利用した場合は409。

応答: `{submission_key,status,received_at,duplicate}`。receipt は応答へ再掲しない。

撤回 body は `{submission_key,withdrawal_receipt}` のみ。間違ったreceipt／未知keyは404。成功は200 `{status:"withdrawn"}`。ローカルBESTは変更しない。撤回後の同投稿再送はwithdrawnを返し、復活させない。撤回状態を管理者のrestoreで戻すこともできない。

## 運営処理・原子性

review body: `{operation_key:UUID,decision:"accept"|"reject"|"revoke"|"restore",reason:string}`。reasonは1～240文字、制御文字不可。操作は pending→accepted/rejected、accepted→revoked、revoked/rejected→pending に限定。復元は再審査であり即acceptedではない。operation_keyの同内容再送は安全に200、別内容は409。監査台帳に旧／新状態・理由・時刻を残す。recalculateは`{operation_key,reason}`。

SQLite trigger が INSERT とstatus更新ごとにaccepted候補を選び直す。higherは数値降順、lowerは数値昇順、同点はserver受付日時・内部IDで安定選択。投稿・候補更新・revisionはD1 transaction内で一致する。最高値だけ保存せず次候補を残す。検証はD1.batchの途中失敗で投稿/BESTともrollbackすることを確認する。

## 受付量・保持

既存RATE_LIMITER bindingがあればrecords専用global keyを併用。bindingなしでも、D1の固定1行カウンター＋INSERT triggerが新規投稿をservice全体で120件／UTC分までに制限する。複数Worker isolateで共有される永続制限であり、メモリMapではない。利用者別の公平性・強いDoS防御は保証しない。過剰時429＋Retry-After:60（Access-Control-Expose-Headersでブラウザから読めるようにする）。生IPもIP hashも新しく保存しない。

pendingは全体2000件まで、7日でrejectedへ移しoptional metadataを空にする。期限の掃除はrecords経路が呼ばれた際に行い、アクセスが無い間の期限切れ行は次アクセスまで残る。accepted候補は解析90日保持に巻き込まない。withdrawn/revoked/rejectedには再送防止の最小台帳を残す。恒久receipt tombstoneやaccepted保持も無制限の無料容量とは扱わず、運用でD1容量と受付量を監視し、停止フラグで保全する。

この検査はブラウザ改ざん・Origin偽装・結果ID偽造を完全に防ぐものではない。管理による保留・取消を含む初期の検査範囲にとどまる。
