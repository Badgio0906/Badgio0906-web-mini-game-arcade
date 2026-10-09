# STEP 2 本番接続後の再開・確認

最新状態と実行済み証拠は [IMPLEMENTATION_REPORT](IMPLEMENTATION_REPORT.md)。STEP1の未稼働記述は当時の履歴。秘密キーをチャットへ貼らない。

## 現在の本番

既存Worker `game100-analytics`、D1 `game100garage-production`／`122c6f47-1f9e-4863-9b3d-54b066f17cc7`、DB bindingを維持。0001〜0003適用済み。Worker version `cbf37eec-37b8-4efd-8ecf-aa1062f6227e`、records ON。本番の公開BEST／全20TOP10は正常で、接続前の記録は0件。Pagesの最終接続証拠は報告を参照。

## 本人の通常プレイで残る確認

1. [100ガレ](https://game100garage.com/)で対象ゲームのTOP10を開く。初期0件は正常。
2. 記録共有は初期OFF。解析の許可とは別に、本人が任意で共有を選ぶ。
3. 新しい通常RUNで結果の「この記録を共有」を押し確認画面へ同意。過去BESTを新RUNとして送らない。
4. 自動のガレージ住人名、同ブラウザ再RUNで1枠、BEST＝TOP1、個人BEST保持を確認。
5. ポータルの共有設定にある当該投稿の撤回で、次の有効記録へ更新されることを確認。反映cacheは最大約60秒。

PCとスマホ／データ削除後は別参加者になり得る。自動QA／架空のscore／テスト参加者を本番へ作らない。実受信確認を終えるまでは、稼働と実受信を別々に報告する。

## GitHubの任意の管理整理

この環境のintegrationはActions Variables管理に403。workflowはVariables優先・未設定時だけ公開originを使い、別originではbuildを止める。機能接続のための追加手作業は不要な方式だが、管理方針を揃える場合はrepository **Settings → Secrets and variables → Actions → Variables** で `VITE_RECORDS_ENDPOINT=https://analytics.game100garage.com` を登録する。これは公開URLでありtokenではない。既存GA4／Telemetry値を変更しない。Variableの空設定だけではfallbackはOFFにならない。

## 機能停止・復旧

通常の停止は `analytics-worker/wrangler.jsonc` の本番varsで `RECORDS_ENABLED="false"` とし、既存認証／対象DB／keep_varsを確認して反映する。

```sh
cd analytics-worker
npx wrangler deploy --keep-vars --env=""
```

公開GETは503準備中になる。フロントも止める場合は `.github/workflows/pages.yml` のrecords envとorigin検証stepを無効化して公式Pagesへ反映する。空のVariablesだけでは停止しない。既存GA4／Telemetryは維持する。

安全なOFF版は `934688c2-b99f-4335-b035-d5729c17e03b`、作業前Workerは `16ad6d54-bf8d-4f39-be0f-f2176a83e57f`。rollbackはDB／Analytics後続書込みを削除しないが、versionのbinding／Secret／flagも再確認する。

Time Travel復旧点はprivate `/workspace/private-leaderboards-step2/backup-recovery.json`、本番変更前の21:21 JST以降に記録。bookmarkは公開docsへ置いていない。このCloud領域の存続を仮定せず、Dashboard **D1 → game100garage-production → Time Travel** またはCLIで復旧可能な時点を確認する。DB復元は以後のAnalyticsや実投稿も巻き戻すため、影響を先に確認し、通常停止目的には使わない。

```sh
npx wrangler d1 time-travel info DB --json
# 復旧が必要で影響を確認した場合だけ
npx wrangler d1 time-travel restore DB --bookmark='<private-confirmed-bookmark>'
```

本番にmigrationを再applyしない。元0002／0003を書き換えず、records／events／daily_aggregatesのDROP/DELETE、DB切替、Secret上書きも行わない。

## 同じCLI解析問題が未適用環境で起きた場合

元migrationを保存し、失敗後schema／台帳／件数を確認する。対象・Time Travel・OFF・0001〜0003の既知SHAと予定台帳に一致する場合だけ、限定transport補正helperを利用できる。デフォルトはlocal検証のみで、本番では明示flagとprivate復旧記録・一意reportを必要とする。

```sh
cd analytics-worker
node scripts/apply-records-migrations.mjs
RECORDS_TRANSPORT_REPORT=/tmp/new-transport-qa.json node tests/records-migration-transport.mjs
# 新しい未適用環境で事前確認を完了した場合だけ（現本番は適用済み）
node --use-env-proxy scripts/apply-records-migrations.mjs --remote --backup /private/confirmed-backup.json --report /private/new-migration-audit.json
```
