# ランキングDB

`analytics-worker/migrations/0003_leaderboards.sql` は0002適用後の加算migration。0001／0002は変更しない。events、daily_aggregates、既存submission／receipt／moderationを削除しない。

|追加|目的|
|---|---|
|record_participants|非公開UUID、独立公開名、credential_hash、created_at、active/disabled|
|record_submissions.participant_id|nullable所有者FK。NULLはlegacy_unattributed|
|record_participant_bests|board＋participantで1行の再構築可能な派生BEST|
|record_leaderboard_revisions|空boardを含む公開snapshot版|
|record_participant_admission|登録60新規／分の固定サービス全体カウンター|

従来record_admissionの投稿120新規／分、pending2000／7日を維持する。IP・解析IDは追加しない。登録／投稿量制限はサービス全体の上限で、完全なDoS防止や個人公平性を保証しない。

## A/B選定と索引

A（全acceptedから毎GETでwindow集計）とB（参加者BEST派生保持）を比較しBを採用。履歴は投稿ごとに増える一方公開GETは多く、毎回全RUNを読むAは履歴件数へ比例する。Bは1参加者の変更時だけ候補を選び直し、rank_value（higherなら-value、lowerならvalue）の索引から10行を読む。複数WorkerでもD1 triggerが直列transactionとして反映する。

候補索引 `(board_id,participant_id,status,value,received_at,id)`、参加者横断 `(participant_id,board_id,status)`、公開索引 `(board_id,rank_value,received_at,submission_id)`。既存board/status/valueとpending expiry索引も残す。受付日時／内部IDの同点順は参加者内・参加者間で共通。

INSERT/status変更で該当参加者の派生を再計算し、board BESTとrevisionを更新。参加者active/disabled変更では所属boardを再計算。投稿のboard／owner／value／received_at／id変更を禁止するtriggerで後付け所有者の推測を防ぐ。正本はrecord_submissions。管理recalculateはboard限定でROW_NUMBER partition participantにより派生を再構築する。

旧record_bestsはmigration時に保持し、以後の派生maintenanceは新適格条件を使う。公開BESTは旧行をそのまま公開せず新派生から取得するため、TOP10の1位と条件が一致する。NULL所有者の行を新参加者へ自動補完しない。

## 安全適用

D1 migration台帳で二重適用を防ぐ。生SQLの再実行はALTER duplicate column等で失敗するため使用しない。途中失敗はmigration transactionでrollback、適用前Time Travel確認／必要なprivate exportを行う。レコード本文・本番snapshotをGitに保存しない。

合成500／5000／50000件の実D1読み取り行数・SQL時間・queryplan、migration保持／二重適用／rollback結果はQAのbackendレポートを参照。ローカルworkerdの速度を本番レイテンシや無料容量保証へ変換しない。受付候補は次点復帰用に保持するため容量監視が必要。
