# Codex Analytics Access — Phase 1

100ガレの改善・分析タスクで、Codexが必要な最新の匿名集計を既存Worker APIから取得する経路。D1への直接アクセスやMCP Serverは導入しない。今回の実装はローカル検証のみで、本番Secret設定・Worker deploy・Codex CloudへのSecret登録・本番API取得は未実施。

## API

| GET専用経路 | 内容 |
|---|---|
| `/v1/codex/summary` | サイト全体とゲーム別の集計 |
| `/v1/codex/game/:game_id` | 指定ゲームの集計（現行001〜019、010は退役） |

`Authorization: Bearer <ANALYTICS_CODEX_TOKEN>`で認証する。adminとは別の値を設定する。Codex tokenは上記2経路だけで利用可能で、`/v1/admin/*`は引き続き`ANALYTICS_ADMIN_TOKEN`のみ。逆方向の流用も不可。Codex経路のPOST／PUT／PATCH／DELETE／HEAD／OPTIONSは405。未設定503、認証なし・誤token401、不正game_id404。Codex用経路はサーバーからの取得用で、ブラウザー向けCORSを追加しない。

既存adminと同じ`from`／`to`（終了時刻は含まない）、`environment`、`include_retired=1`、`game_version`／`rules_version`／`presentation_version`の検証と集計処理を共用。既定は直近7日、production、退役除外。browser／visit／session／run／eventの生ID、IP、User-Agentは返さない。

## 取得スクリプト

Node.js 24（リポジトリのCIと同じ）で実行する。

```sh
node scripts/fetch-analytics-context.mjs --days 7
node scripts/fetch-analytics-context.mjs --days 30 --game game019
node scripts/fetch-analytics-context.mjs --days 7 --environment production --include-retired
```

- 必須：`ANALYTICS_CODEX_TOKEN`。後でCloudflare WorkerのSecretとCodex CloudのSecretへ同じ専用値を設定する。admin tokenはCodexへ渡さない。
- 任意：`ANALYTICS_BASE_URL`。既定`https://analytics.game100garage.com`。HTTPS originのみ（ローカルfixture検証ではloopback HTTP可）。URLの認証情報・query・fragment・追加pathは拒否する。
- `--days`は1〜90、既定7。`--game`省略時は全体、`--environment`既定production（development／qa／syntheticも明示可）。退役は`--include-retired`指定時のみ一覧へ含める。game010を個別指定すると退役集計を取得できる。

JSONをstdoutへ出す。形式は`{ "source": "GAME100 Analytics", "fetched_at": "...", "period": { "from": "...", "to": "..." }, "data": { ... } }`。失敗時は非0終了コードと固定JSONエラーをstderrへ出す。tokenはBearer headerだけに送信し、応答本文・例外内容・URLをエラーログへ出さない。redirectは拒否、timeoutは30秒、生ID fieldやtoken反射を含む成功応答も拒否する。

Secretはコード・URL・ログ・ファイル名・Gitへ保存しない。取得スクリプトに保存機能はない。通常はstdoutだけを解析し、一時保存が必要ならGit管理外のOS一時ディレクトリを使い削除する。本番snapshotをリポジトリへ永続保存・commitしない。

## 集計の制約

同意済み・観測済みイベントのみで、全訪問者の実数ではない。`sample_size_small`（分母20未満）、欠測、打ち切られたRUNを断定材料にしない。raw既定90日、日次集計13か月。20,000イベント／10,000日次行を超える要求は422なので期間を狭める。日次distinct数を足して期間distinct数にしない。部分UTC日の履歴は要求期間の正確な合計ではない。継続・再訪率は観測範囲と追跡期間の制約を持ち、離脱イベントの欠測を「飽きた」と読まない。Analyticsだけを根拠に自動でゲームを改修しない。

MCPは現時点では未導入。
