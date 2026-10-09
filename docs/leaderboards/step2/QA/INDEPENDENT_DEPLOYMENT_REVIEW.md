# STEP2 独立デプロイ安全性レビュー

2026-10-09 21:23 JST。担当 `/root/step2_review`。基準 commit `c0851605fbc8da6833b3e320a1007979a804e8a3`、作業 branch `codex/leaderboards-step2`。

アップロード済み STEP2 指示、AGENTS／GAME_DEVELOPMENT_RULES、現行 migration／Worker／wrangler／Pages workflow を独立確認した。レビュー担当は本番 API・認証値・管理 Secret を取得しておらず、本番変更・ブラウザ起動・runtime/config の編集を行っていない。実施したテストはローカル・合成データ限定。

## 結果とデプロイ条件

**ローカル移行／認証境界の確認は PASS。** STEP2 の実行前に以下の条件を root が満たす必要がある。本報告の PASS は本番 backup、権限、移行、deploy、公開の成功を代用しない。

| 項目 | 独立確認 | 実行時に必要な証拠 |
|---|---|---|
| Worker・DB・route・cron | 設定の Worker `game100-analytics`、DB binding `DB`、D1 `122c6f47-1f9e-4863-9b3d-54b066f17cc7`、公開 custom domain、cron `17 3 * * *` 一致 | remote の同じ対象と binding、公開 vars、secret 名の前後一致 |
| Analytics 設定 | ENVIRONMENT production、raw90日／aggregate13か月の設定が現状維持 | Dashboard にしか存在しない設定も保持 |
| 0002／0003 | records 専用加算。0003 は派生集計 trigger 2件の置換。events／daily_aggregates／投稿台帳の DROP/DELETE なし | 台帳が0001適用済み、pendingが0002／0003だけ、Time Travel／private backup確認後に順序適用 |
| 認証 | Admin と Codex の token は別経路、Codex token で records/admin または Analytics admin へ昇格不可 | 本番境界のHTTP確認。失敗応答・資格付き応答は no-store |
| OFF → ON | OFFでは公開GET／登録POSTとも DBを触らず503。管理APIはフラグより先に認証 | 最初の更新は明示false、検証後に明示true。最終configとremote一致 |
| Pages 変数 | 既存 GA4／Telemetry 行を維持する変更が必要 | records backend正常化後のみ endpointをbuild envへ追加し、公式build/deployと実配信JS確認 |

## Wrangler の設定保持

同梱 Wrangler **4.42.0** の実装では `keep_vars`／`--keep-vars` が upload metadata の `keep_bindings` に `plain_text`／`json` と `secret_text`／`secret_key` を加える（`wrangler-dist/cli.js` の `createWorkerUploadForm`、deployで `keepSecrets: keepVars`）。現行configは `keep_vars` 未設定。既存 Dashboard 専用設定がある今回の更新では、**`keep_vars: true` または全deployの `--keep-vars` で明示的に保持**し、`RECORDS_ENABLED` は config の明示false→trueで変更する方式を推奨した。defaultのサーバー側Secret保持挙動を未確認のまま安全根拠にしない。remote settingの型・名前を前後比較し、Secret値の出力や再登録は不要。

## GitHub Variables API が403の場合

rootから報告された Variables API 403は変数管理権限の不足であり、Variablesが存在しない証明ではない。公開URLは秘密値ではない。既存Variables優先の次のfallbackなら、本番正常化後にフロント接続を実行できる。

```yaml
VITE_RECORDS_ENDPOINT: ${{ vars.VITE_RECORDS_ENDPOINT || 'https://analytics.game100garage.com' }}
```

ただし既存Variablesが非空の誤URLならそれが優先する。**最終配信JS／公開画面の実際の接続先が正しいかを確認**する必要がある。公式Workflow成功だけでは接続先確認を代用できない。Variables APIを設定できなかった事実とfallback採用は最終報告に明記する。rollbackでendpointを無効にする場合はfallbackを残したまま変数を空にしても無効にならないため、workflowの行を空／削除へ戻すかWorkerのrecordsをfalseにする。

## 実行した意味のあるローカル検証

Node24 SQLite のメモリDBに合成events／daily_aggregatesを各1行だけ作成し、0001→0002→0003をtransaction内で適用。各migration後に全列snapshotが同一、`PRAGMA foreign_key_check` 0件、`integrity_check=ok`、records用9table存在を確認した。本番D1データのfixtureは使っていない。

実際の `src/index.ts` を esbuild でメモリ向けbundleし、DBを呼ぶと失敗するstubで以下10ケースを実行。すべて所定HTTP/error/no-store、認証前DB呼び出し0件。

- OFFの BEST／TOP10／許可Origin登録POST：503 `records_preparing`。
- 管理認証なし／Codex tokenでrecords管理／Codex tokenでAnalytics管理：401。
- Admin tokenでCodex集計：401、CodexへのPOST：405。
- 不正Origin公開GET：403、公開GETに管理Authorization：401。

許可Originのsubmission OPTIONSは204、公開Origin一致、許可headerは `Content-Type, X-Record-Credential`。これらはNode実行であり、Cloudflare workerd／本番の実行成功とは区別する。

| 固定したソース | SHA256 |
|---|---|
| index.ts | `30774282e65c381c6e2ba49a1112dde083743e5e030e77f2e70027b73ff3ae07` |
| records.ts | `af501ec7d333323202536c144b759d092f45564919734ce9d62a5e75033b9461` |
| wrangler.jsonc（変更前） | `b7e626b982deed6f66af7ac7ccab0130ad026551e8fc007ba63353103d6785dc` |
| pages.yml（変更前） | `28f19de0061b7c16432f0c11fa190a480583e67ba255c752cd67698183d1eaea` |
| 0001 | `21cd3545e9b051dc36f96c2ccc65a58fc9c73abd5644f9c53814aaa40cfaf219` |
| 0002 | `7b4efac95c3ef7f1a0c3382d97e5f0d8faef32a3cc9f19bd83127eb7a679ce80` |
| 0003 | `ec811bd7ee747649d739f92b6def1465ee9616ad93bfe58d8f727d1927c2221f` |

実スコアの真正性、通常プレイの本番受信、実機音／操作の人間評価は未実施。実スコアはユーザー本人の通常プレイで確認する。

## 追加レビュー：本番migrationの incomplete input

同日 root の実操作で `wrangler d1 migrations apply DB --remote` の0002が `incomplete input`／SQLite7500となり、0003／Worker更新／ONを停止した。本番失敗後に schemaと台帳が変更なしであること、REST query arrayが400で未対応、BEGIN TRANSACTIONも未対応であることは **rootからの報告**であり、本レビュー担当の本番観測ではない。

独立コード調査では、Wranglerのlocal経路が `splitSqlQuery`→D1 batchなのに対し、remote migrations applyは元SQL＋台帳INSERTを単一 `{sql:全文}` の `/query` に送信することを確認した。remote D1内部のparser実装は確認できず、原因を特定のserverコードへ断定しない。

実際の同梱Wrangler splitterを抽出すると、compound開始が `/\s(BEGIN|CASE)\s$/`、終了が `/\sEND[;\s]$/` である。そのためCASEの開始 `=CASE`／`(CASE`／`,CASE` と終端 `END,`／`END)` でcompound検出が崩れる。元migrationを編集することなく、**文字列・quoted identifier・commentを保護したtransport-onlyのCASE／END周囲空白補完**は狭い対処案として妥当。単純END後方のみの空白補完は独立検証で失敗し、CASE前方のcommaまで考慮して初めて正しいstatementに分割できた。

独立ローカル検証結果：

- Python標準 `sqlite3.complete_statement` で元0002は11、元0003は18の完全statement。
- 今回の元SQLだけに対し `([=(,])CASE`前方と`END(?=[,)])`後方へ空白を追加すると、Wrangler実splitterも11／18、台帳INSERT込み12／19となった。各CREATE TRIGGERは完全なENDまで1statement。
- 元SQLをSQLite全体execするDBと、transport SQLをWrangler split後に個別execするDBで、sqlite_master全type/name/table/SQL（空白除去）のsnapshotが一致。Analytics合成行保持、台帳3件、integrity正常。
- 故意の末尾失敗を含むNodeSQLite transactionではschemaと台帳が全部rollback。
- 直接Miniflareでの追加batch確認はDB取得前に起動停止し、担当自身のprocessを終了した。**この追加workerd実行は未完了**。rootの既存runnerで確認する。NodeSQLiteのtransaction成功をremote REST atomicityの証明へ読み替えない。

本番用helperは original migration hash、DB／config OFF、private backup／Time Travel、台帳期待値・対象schemaをgateし、最小transport差分で元SQL＋台帳を同じqueryへ送る。1件ずつ成功応答と実schema／ledgerを確認し、失敗時は先へ進めず再確認する。ソースmigration編集・array対応の憶測・BEGIN付き再実行は行わない。

Jev独立判断に関する制約：コード／SQLite調査後にenumの確認中、誤って実Jev回答を読み取ったため、この担当の最終分類を**盲検レビューとは呼ばない**。回答を読む前のコード／テスト証拠は上記どおり保存した。remote失敗時点の原因はUNKNOWN、Codex調査必要=true、次の証拠はCODE_INSPECTION、未解決ON接続のrelease risk=trueという判断をrootへ伝えた。

## 実装helperの追加確認

`analytics-worker/scripts/apply-records-migrations.mjs` と `tests/records-migration-transport.mjs` をレビューした。単一REST SQLにmigrationとledgerを含める方針、target/config OFF／backup時刻・bookmark／remoteDB名・ID／既知pending順のgate、失敗で後続migrationを止める動作は妥当。local workerd試験は故意の末尾失敗後にschemaと台帳を確認するため、単にSQL成功だけを見ていない。

helperの `normalizeTransport` 実関数を用い、single quoteのescaped quote、double quote、backtick、line／block commentの6ケースがbyte不変、CASE開始3境界に必要なspaceを加えることを実行確認。元migration3本は `git show c085160:...` とbyte一致。helper自身のlocal検証は元0001/0002/0003 statement8/11/18にPASS。本番アクセスなし。

runtime設定差分は `keep_vars:true` と `RECORDS_ENABLED:false` の追加だけで、既存のvars、DB、route、cron、development設定保持を確認した。運用helperへの最小推奨として、元SQLの既知SHA256をassertし、local schema比較にSQL本文の空白正規化比較を加え、reportの出力可能性／既存path拒否を本番変更前に確認することをrootへ伝えた。これらはrootが既に確認しているmigration不変・schema・一意の報告先をhelper内でも保証する改善であり、無関係な追加開発を要求していない。

## 最終接続設定と実行証跡のレビュー

rootの最終設定を再比較した。wranglerの基準configに対し追加は `keep_vars:true` と `RECORDS_ENABLED:true` のみで、それらを取り除いたJSON全体が元configと一致。DB、route、cron、retention、development設定が維持される。helperは既知3SHAのassert、SQL本文までの同等性検証、remote変更前の一意report予約を採用済み。local-only実行を再確認しPASS。

Pages workflowは既存GA4／Telemetryの行がbyte一致。endpoint検証とbuildに**同一のVariables優先fallback**を渡し、検証stepがproductionの正確なoriginに一致しなければbuild前に停止するため、既存非空の誤Variablesへ接続した版の公開を防ぐ。Variables API403に対する限定fallbackとして妥当。Variables権限不足とfallback使用は最終報告へ残す。Variablesを空にするだけでは接続停止にならないというrollback条件は引き続き有効。

rootが保存した安全な実行証跡 `WORKER_OFF_API.json`／`WORKER_ON_API.json` とsetting前後を読み、OFF21／ON143項目PASS、既存管理とCodexの境界・CORS・no-store、20空board、既存secret名・DB binding・cron保持、100%versionがOFF `934688c2-b99f-4335-b035-d5729c17e03b` → ON `cbf37eec-37b8-4efd-8ecf-aa1062f6227e` の記録が一致することを確認した。migration・本番操作はroot実施であり、独立担当は本番呼び出しを追加していない。8474events／59daily aggregates保持、投稿／参加者0件の記録があり、空ランキングの成功と実プレイヤー投稿受信は明確に区別する。

**最終ソース設定に追加の阻害findingなし。** このレビュー時点で公式Pages workflow／実配信JS・公開画面の検証はrootの後続工程であり、設定レビューだけで公開成功とは記載しない。
