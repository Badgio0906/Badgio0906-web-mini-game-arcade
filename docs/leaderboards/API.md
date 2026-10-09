# 公開ランキング・参加者API

既存Worker `game100-analytics` の `/v1/records/*`。`RECORDS_ENABLED="true"`のみ動作。既存Origin許可、8KiB UTF-8 JSON／5秒body制限、管理Bearer分離を維持。

|経路|認証・用途|
|---|---|
|GET /v1/records/public/bests|既存一括公開BEST、query不可、個人認証なし|
|GET /v1/records/public/leaderboard?board_id=…|board_id一つだけ、既知public board、固定TOP10|
|POST /v1/records/participants|許可Origin、本文 `{schema_version:1,credential:"hex64"}`|
|POST /v1/records/submissions|既存schema1本文、追加 `X-Record-Credential` headerで所有者認証|
|POST /v1/records/submissions/withdraw|既存submission_key＋withdrawal_receiptのみ|
|既存admin submissions/review/recalculate|既存ANALYTICS_ADMIN_TOKENのみ、Codex token不可|

登録は同じcredential hashでidempotent、active参加者の `{schema_version:1,public_label}`のみ返す。サーバーがUUIDと公開名を発行する。認証headerは小文字hex64限定、未知／disabledは401。任意participant_id／public_label／owner_id追加fieldは400。表示名から投稿・削除はできない。raw credentialは公開GET／withdraw／管理経路へ送らず、headerを付けた公開GETは拒否する。

資格情報なしの旧投稿は従来検証・再送・receipt撤回を保ちNULL所有者として受け付けるが、新公開ランキング／BESTへ含めない。新クライアントは明示共有直前に登録を行い必ずheaderを送る。再送では同key／同RUNを維持し、資格情報を失った待機RUNを別参加者へ付け替えない。投稿hashに確認済みownerを含め、同keyを他人のtokenで再送しても409となる。

正常公開GETは `public,max-age=60,must-revalidate`、Vary Origin。失敗／登録／投稿／管理はno-store。Authorizationは公開と投稿に使用しない。CORSのX-Record-Credentialは投稿専用で、Origin自体を本人確認と扱わない。

## TOP10応答

schema_version=1、board_id、game_id、metric_label、mode_label、ruleset_id、direction、unit、generated_at、revision、cache_ttl_seconds=60、entries。

entriesは `{rank,public_label,value,received_at}`だけ。rank1〜件数（最大10）、valueは定義の基準整数（018/019はdm）。0とnullを区別し、受付0件ならentries=[]。表示はstorageScale／displayPrecisionで変換する。内部投稿ID・参加者ID・hash・credential・receipt・IP・審査理由は返さない。

未知board404、不正／重複／余計query400、POSTなど不許可method405、準備中503。失敗応答を正常cacheにしない。revisionは同じboardの一括BESTとTOP10で一致するtransaction版。別取得時点・最大60秒のcache差はあり得るが、フロントは既知新revisionより古い一覧を正しい現在値として併記しない。

これはクライアント改ざんスコアの完全防止ではない。既存board／mode／rules／数値／確定結果／pending／取消検査と運用を併用する。
