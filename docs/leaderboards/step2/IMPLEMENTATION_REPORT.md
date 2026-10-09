# 全体BEST＋TOP10 STEP 2 本番接続報告

2026-10-09 JST。基準main `c0851605fbc8da6833b3e320a1007979a804e8a3`、作業branch `codex/leaderboards-step2`。STEP1を巻き戻さず、既存game／records runtime、広告／GA4／CREDIT、一般Analytics送信条件を変更しない。本番fixture投稿・匿名参加者のテスト登録は行っていない。

## 事前確認と復旧点

既存Cloudflare認証で対象Worker `game100-analytics`、D1 `game100garage-production`、ID `122c6f47-1f9e-4863-9b3d-54b066f17cc7`、DB binding、既存管理/Codex Secret名、公開vars、cronを再確認。開始時version `16ad6d54-bf8d-4f39-be0f-f2176a83e57f`、0001のみ適用、予定pendingは0002/0003だけ。events **8,474件**、daily_aggregates **59件**。[事前確認](QA/PREFLIGHT.json)。

D1 Time Travel APIの現在bookmark取得に成功し、本番変更前の復旧点をprivate領域へ保存した。raw SQL exportは実施していない。bookmark値／生Analytics IDはGitや本報告へ保存しない。privateファイルの長期存続は保証せず、再開時はTime Travelの利用可能期間と復旧時点を再確認する。[確認結果](QA/BACKUP.json)。通常の機能停止はrecords OFFで行い、DB復元は後続Analytics書込みへの影響を確認してから判断する。

## 本番D1

0002/0003を順に適用済み。records9table・5索引・7triggerと台帳0001〜0003、FK違反0を確認。既存件数は **8,474／59のまま**、投稿／参加者は0件。元migration3本のbyte／SHA不変、DB切替やデータ削除なし。[適用証拠](QA/MIGRATION_APPLIED.json)。

標準Wrangler4.42のremote applyは0002で `incomplete input` に失敗。直後のschema／台帳／件数がすべて開始状態と同じことを確認し、後続処理を停止した。元ファイルを書き換えず、引用／commentを保護してCASE／ENDトークン周辺だけ空白を補う**送信用SQL**へ変更。固定SHA・対象DB・OFF・復旧点・予定台帳・報告先を確認する限定ツールで、各migrationと台帳INSERTを一つのREST SQL requestで適用した。SQLのschema本文は空白を除き同等、SQLite11/18 statement、実ローカルworkerd/D1で成功／末尾失敗時schema＋台帳rollbackに合格。初回remote失敗のrollbackと最終remote台帳／schema／件数も実測した。内部server parserの実装や、未実行の本番故意失敗を確認済みとは説明しない。[初回失敗](QA/MIGRATION_FIRST_ATTEMPT.json)／[失敗後](QA/MIGRATION_POST_FAILURE.json)／[ローカルD1](QA/MIGRATION_TRANSPORT_LOCAL_D1.json)。

## Worker

`keep_vars:true`／`--keep-vars --env=""` で既存vars／Secretを明示保持。OFF version `934688c2-b99f-4335-b035-d5729c17e03b` でhealth・管理/Codex分離・既存Analytics互換・records準備中21項目を確認後、ON version **`cbf37eec-37b8-4efd-8ecf-aa1062f6227e`** を100%配信。最終config／remoteとも `RECORDS_ENABLED=true`、DB／retention90日/13か月／cron `17 3 * * *`／Secret名を保持。Secret値の取得／再登録はしていない。

ON143項目PASS：health200、BEST200・20board、TOP10全20board200・空配列・BEST null・同revision、公開field限定、最大10、Origin、OPTIONS、資格なし公開GET、管理401、既存Codex tokenで集計200／管理昇格不可。匿名登録経路はOPTIONS／GET405と固定source・localtestで確認し、本番のテスト参加者は生成しない。[OFF API](QA/WORKER_OFF_API.json)／[OFF設定](QA/WORKER_OFF_SETTINGS.json)／[ON API](QA/WORKER_ON_API.json)／[ON設定](QA/WORKER_ON_SETTINGS.json)。

## Pages

既存公式workflowに `VITE_RECORDS_ENDPOINT` を追加。GA4／Telemetry行は維持。GitHub Actions Variablesのread／set APIは実際に403で、変数登録は実行できなかった。値が存在しないとは推測せず、**Variables優先・空時のみ指定公開originを使う式**を採用し、build前にoriginが `https://analytics.game100garage.com` と完全一致することを確認する。公開URLはSecretではない。空のVariableだけではfallbackを停止できないため、停止手順を別途残す。[権限制限](QA/GITHUB_VARIABLES.json)。

**公式Pages公開済み。** 接続commit `8eb302482af5fcb540245ca6067480a9bd5e666d`、[公式workflow37933537264](https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/actions/runs/37933537264) のtest／endpoint検査／build／deploy成功。対象commit source・公開既知envで生成したbuildと配信164ファイルのSHA一致（公式artifact ZIPは未取得）。配信JSへ正しいrecords originが反映され、[公開4viewport132項目PASS](QA/public-browser-01/REPORT.json)：PCで全20TOP10、全30カード／画像・非競争例外・012〜014のboard・010退役、リンクとbutton分離、見出しfocus／Esc戻し／close／再開閉、解析OFFの公開GETだけ、共有初期OFF／資格生成なし、PC／phone通常Game001結果→個人BEST一致。POST試行0／JS例外0。[配信版](QA/publication-01/VERSION.json)／[公開集約](QA/PUBLICATION.json)／[目視の範囲](QA/VISUAL_REVIEW.md)。root check・887tests/79files・endpoint有効buildもPASS。

## QAと未確認

[元runtime／game／Catalog／ID／0001〜0003を保持](QA/SOURCE_PRESERVATION.json)。既存records実localD129項目、Analytics37項目、固定endpoint有効buildで8作品×PC／phone16ケースPASS（自動結果共有対象外・全POST遮断）。[通常操作](QA/native-enabled-01/REPORT.json)。実ローカルD1 transport成功／rollback5項目、独立SQL／lexer／設定レビューを実施。[独立レビュー](QA/INDEPENDENT_DEPLOYMENT_REVIEW.md)／[再現](QA/README.md)。Jevはmigration finding1件のみ実HTTP200、SQL／認証／合否はCodex自身で検証。独立担当が診断後に回答を見たため最終分類を盲検とは表現しない。CLI引数・未許可PRAGMA・結果保存pathの単純なtest設定失敗は別原本で保持。

公開画面検証後も[本番最終状態](QA/FINAL_PRODUCTION_STATE.json)でevents8,474／daily59、参加者0／投稿0とWorker ONを再確認。

**実プレイヤー投稿受信は未確認。** 自動QAの本番スコアは0件。ユーザー本人の新しい通常RUNで共有→同ブラウザ再RUN1枠→BEST=TOP1→receipt撤回を確認する。実機／音／人間Feelの確認とは別。追加のCloudflare認証・DB／Secret設定は今回範囲で完了し、GitHub Variable登録は任意の管理整理として残る。[次の操作](HANDOFF.md)。
