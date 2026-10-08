# 共有記録管理

既存の [`analytics-admin.html`](../../analytics-admin.html) の「共有記録管理」だけを追加した。Analytics集計と記録審査は別のAPI・表示であり、記録候補を集計JSONへ出力しない。

## 接続と認証

- `VITE_RECORDS_ENDPOINT` が空なら「準備中」と表示し、取得・更新を無効にする。Telemetry接続先の設定だけでは記録管理を有効にしない。
- 接続先はHTTPSのorigin、または同じoriginの `/v1/records`。ローカル検証のlocalhost HTTPだけ例外。URL内の資格情報・query・fragmentを拒否する。
- 上の管理トークン欄を再利用する。`ANALYTICS_ADMIN_TOKEN` は操作者が入力し、メモリ以外へ保存しない。Codex tokenは利用不可。入力値変更、消去ボタン、pagehideで記録表示と進行中のfetchを消去／中断する。
- 管理GET/POSTのみBearer header。公開BEST GETには認証headerを送らない。すべて `cache: no-store`、`credentials: omit`、`referrerPolicy: no-referrer`、redirect拒否。
- token、撤回receipt、生Analytics識別子をURL・ログ・JSON保存へ出さない。UIに表示する内部IDは記録候補のIDであり、本人のbrowser/session/run IDではない。

## 操作

1. 管理トークンを入力し「共有記録を取得」。現在のBESTと最近100候補までを表示する。board、状態で絞り込み後、再取得する。
2. 確認中は「承認」「拒否」、受付済みは「取消」。取消済み／拒否は「再審査へ戻す」で **pendingへ戻す**。即acceptedへ復元しない。本人撤回済みの候補には復元操作を出さない。
3. 操作確認ダイアログで候補ID・board・単位付きの値・保存整数・状態を確認し、1〜240文字、改行なしの理由を入力して実行する。理由に秘密や個人情報を書かない。任意のスコアを新設する入力欄はない。
4. boardを選択すると「選択boardのBEST再計算」を使用できる。同じ確認と理由を必須にし、受付済み候補からだけ再計算する。
5. 処理中は取得・更新をdisableし、二重クリックによる重複送信を防ぐ。操作ごとにUUIDの `operation_key` を発行する。成功後は候補とBESTをGETし直す。公開側の短時間キャッシュには最大60秒程度の反映差がある。

通信の中断／timeoutはサーバー側操作の取消を保証しない。結果不明なら自動再送せず、まず再取得する。画面の「消去」は表示と入力を消す操作であり、投稿や運営履歴の削除ではない。

画面は `textContent` で値・条件・検査理由を描画し、HTMLを評価しない。受信したmetadataはmode/assistance/duration/outcomeの表示だけに限定する。018/019等の保存整数は定義のscaleでmへ換算し、候補表では保存整数も併記する。

## 使用経路

- `GET /v1/records/public/bests` — 認証なしの現在BEST。
- `GET /v1/records/admin/submissions` — 任意 `board_id`、`status`、`limit=100`。
- `POST /v1/records/admin/submissions/:id/review` — `{operation_key, decision, reason}`。
- `POST /v1/records/admin/boards/:board_id/recalculate` — `{operation_key, reason}`。

既存 `/v1/admin/*` と `/v1/codex/*` のmethodや権限は広げない。D1を画面から直接問い合わせない。

## 検証の再現

```sh
npx vitest run tests/unit/records-admin.test.ts tests/unit/analytics-admin.test.ts
VITE_RECORDS_ENDPOINT=http://127.0.0.1:8798 npm run dev -- --port 4328
RECORDS_ADMIN_BASE_URL=http://127.0.0.1:4328 RECORDS_ADMIN_QA_DIR=docs/records/QA/admin-fixture-new node tests/analytics/records-admin-ui.mjs
```

別serverで `VITE_RECORDS_ENDPOINT=''`、別出力先に `RECORDS_ADMIN_PREPARING=true` を指定すれば、未設定時の全操作disableを検証できる。

上のブラウザ検証はPlaywrightで合成APIをmockし、PC1365×900／390×844／320×568／844×390でクリック・Enter・理由確認・承認／拒否／取消／再審査／再計算・二重クリック・中断・HTML非評価・非永続保存を確認する。実Cloudflare配備、実管理トークン、実プレイヤー候補を使った本番審査の証明ではない。結果は [admin-fixture-03](QA/admin-fixture-03/REPORT.json)、未設定画面は [admin-preparing-01](QA/admin-preparing-01/REPORT.json)。[修正前の確認画面](QA/admin-fixture-02/confirmation-320x568.png)とfindingを保全し、最終版では単位付き123.4 mと保存整数1234の一致を確認する。

今回の環境では既存Cloudflare認証が不足するため本番管理は準備中のままとする。新たなSecret／認証権限は作成しない。本番配備と審査運用開始は全体報告の状態と区別して確認する。
