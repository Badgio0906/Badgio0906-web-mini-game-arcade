# 集客前の分析基盤 — 2026-10-06

公開ゲーム18本、Game010は退役。次の番号は020。ゲームサイトは既存GitHub Pagesのまま。外部APIの未設定でゲームを止めない。

## 役割とデータ経路

| 系統 | 役割 | 今回の状態 |
|---|---|---|
| device-local TelemetryService | ページ200件／端末400件の確認・JSON出力 | 維持。dev/QAは保存、production未知・拒否は新規の恒久保存なし |
| 独自Telemetry | 同意後のイベント→25件/32KiB batch→Worker→D1 | client/source/migration/実ローカルD1/API検証。認証・endpoint未設定、本番未稼働 |
| GA4 | 流入、ページ閲覧、ゲーム開始・終了・retryなど | 同意後lazy-load adapter。Measurement IDなし、本番未稼働 |
| AdSense | 広告 | 所有確認scriptそのまま。広告同意とは統合しない |
| Jev | 後段の集計に対する改善分析 | 集計JSON exportのみ。ブラウザ／WorkerからJev呼び出しなし |

`ConsentService`はunknown/granted/deniedを保存し、変更と別タブstorageイベントを通知。未知・拒否ではブラウザID生成なし、Google tagロードなし、独自外部送信なし。新しいイベントだけを送る。古い400件を一括uploadしない。

`browser_id`は同意後のランダムUUID、`visit_id`はsessionStorageで30分無活動を訪問境界とする、`session_id`はページ単位、`run_id`は開始ごとのUUID。Game019の落下はRUNを終了しない。Game018は新投射で新RUN。別ブラウザ／端末を同一人と推測しない。識別子は集計APIの返却・Jev exportに含めない。

キューは最大200件／24時間、1要求25件／32KiB、指数backoff最大5回。ackの得られるfetch/keepaliveを使用し、未ack再送は同じevent_idでD1 PRIMARY KEYへdedupe。撤回で未送信queueとIDを削除し、送信中fetchもabort。開始・入力・終了は送信をawaitしない。

環境は公式hostnameだけproduction、webdriverはqa、その他development。合成fixtureはsynthetic。本番Workerはproduction以外を拒否。GA4はproductionだけ有効。ID/endpointは非秘密のGitHub Actions Variablesからbuildへ渡す。Workerの管理secretはViteへ入れない。

## 配信と運用

Workerは独立`analytics-worker/`。POST `/v1/events`、GET `/v1/health`、Bearer付きGET `/v1/admin/summary`／`/v1/admin/game/:gameId`。一般ポータルに管理画面リンクなし、管理トークンは実行時メモリだけ。rawは90日、個別IDを含まないUTC日別集計は13か月。日別distinct数を足して期間distinct数にしない。raw保持を越えた継続率・再訪率は復元できない。

[設定手順](MANUAL_SETUP.md)、[管理画面と母数](ADMIN_DASHBOARD.md)、[イベント](EVENTS.md)、[プライバシー境界](PRIVACY_BOUNDARY.md)。コード完成と本番収集開始は別。実行結果と公開状態は[報告](REPORT.md)を参照。
