# 全体BEST＋歴代TOP10 STEP 1実装報告

2026-10-09 UTC。開始main `f8b8444dc1d942aba56f23199498226caa38fd22`、branch `codex/leaderboards-step1`。開始時dirtyなし、同環境worktree1件。GitHub mainとlocalHEAD一致を確認し、過去報告の他環境21treeがこの環境に存在すると推測していない。[開始](QA/START_STATE.json)／[正本読取](QA/READ_RECORD.json)。

## 実装

20public boardに「TOP10を見る」、非競争10に追加なし、Game010退役。カードをarticle＋リンクとランキングbuttonの兄弟要素へ分割し、カードtap・keyboardゲーム起動・impression／launchを保つ。native dialogを1つ再利用し見出しfocus、Esc／閉じる、元buttonfocus、背景inert／scroll停止、safe-areaと320／390／844横／1300PCを実装。ゲーム名・記録条件・順位・独立匿名名・単位付きスコア・未共有の個人BESTを表示する。個人値から全体順位を推測しない。

共有時だけ32byteランダム資格情報を専用保存へ生成。Web Locksでタブ初回生成を直列化。lock非対応では新生成を停止して説明、既存資格情報は継続可。解析ID・氏名・IP・fingerprintから作らない。サーバーはhashを照合し内部UUIDと所有者を関連付け、独立乱数12桁「ガレージ住人」名を発行。ブラウザ単位1枠で、本人のPC／スマホや保存削除後は別参加者になり得る。自由入力名・ログインなし、初期自動共有OFF、過去BEST遡及投稿なし。登録中OFF／資格情報喪失の待機RUN／旧キューを勝手に別所有者へ付け替えない。receipt撤回を維持。

既存投稿schema1と本文／RUNdedupを保ち、追加header X-Record-Credentialで認証。POST participantsとGET public/leaderboardを追加し、公開GETは資格情報・個人BEST・cookieなし。全体BESTとTOP1を同じactive所有者accepted集合・revisionで取得する。TOP10は開いたboardだけ、正常60秒cacheと同時GET共有。取得時点の差は新revision優先で整合し、既知新BESTより古い一覧は正常表示しない。

## DBと旧記録

加算 `0003_leaderboards.sql`、0001／0002不変。既存5表を再利用し、参加者、board＋参加者BEST派生、空board含むrevision、固定登録ratecounterを追加。NULL ownerはlegacy_unattributedとして保持し名前／所有者を推測しない。旧未識別だけのboardは新公開集合でempty/nullになるため、旧BESTとTOP1を違う集合のまま併記しない。既存BEST行／receipt／events／daily_aggregatesは移行時保持。

B方式の派生参加者BESTを採用。全履歴を毎GETでwindow集計するAは履歴量に比例するため、投稿時に変更参加者だけ再計算し公開10人を索引で取得。正本submissionからadmin recalculateで再構築可能。status変更trigger／D1transactionにより取消・撤回・保留・再承認・同時投稿／参加者disabledを反映。withdrawnは管理復活不可。SQL比較directionと同点受付日時／IDは両公開APIで共通。[DB](DATABASE.md)／[API](API.md)。

## QA

- root TypeScript／build成功、887tests／79files、Jev offline25成功。追加独立frontend5tests、独立NodeSQLite＋actual handler15groups成功。
- 実workerd＋隔離local D1：既存records29項目／20board、新ranking24項目、既存Analytics37項目成功。C600/A500/B400/D200、15参加者、本人100RUN、同点、0、別board／mode／rules、lower、pending／取消／撤回／復元、RUN偽装／owner／label／資格／receipt、同時登録／投稿と取消、rollbackを確認。
- 0002後0003移行で既存submission／BEST／receipt／events／daily_aggregates保持、台帳二重apply no-op、直接再実行拒否、途中失敗rollbackを検証。
- 合成500／5000／50000履歴：TOP10実D1rows_read31／rows_written0、SQL0〜1ms。全履歴集計は1／6／64ms、索引plan使用。ローカル値で本番SLO保証ではない。[性能](QA/backend-d1-performance.json)。
- 最終portal118項目・4viewport、共有transport103項目、準備中実HTTP18項目成功。初期OFF・解析OFF＋共有ON／逆設定・閲覧だけ無資格・登録中OFF・資格喪失・同時タブ・共有拒否を確認。上位10人／長い数値／同点／0／empty／failure／503／loading／前回cache／focus／scroll／lateclose／game誤起動なしを確認。
- 固定source282件とenabledbuild156件のhashを独立照合。最終8画像の静的UI独立合格、可読性14/15・完成感13/15。全ゲーム動きの100点評価・人間Feelとしては報告しない。
- 既存7作品（001/004/018/019/024/029/031）PC／phone14通常ケースPASS。015旧BEST500保持・新RUN／rules03個人marker／Portal／retryを2画面14項目確認。012〜014固定export・bridge・元保存／通常modeはsource不変、別ローカル実HTTP6RUN・36項目回帰に合格。
- 元1106fontglyphを保持し必要な「専」1glyphだけ追加。ゲーム得点／Catalog／ID／Godotexport／Analytics sender／GA4／AdSense／CREDIT OFF／031世界保存／既存migration不変。[保全](QA/PRESERVATION.json)。

根拠・正確な再現commandは [QA/README](QA/README.md)。初回TabfocusはChromiumのscrollable内容へ移ったもので、sole-close testoracleを修正。大きいdmの浮動小数表示を整数quotient/remainderへ修正。個人BESTasync読み込みをランキングrefreshが無効化する問題を独立testで検出しlifecycle分離。失敗原本と最終成功を別保存。root最終fixtureURL誤設定と旧nativeprobeURL置換誤りも製品変更と混同せず保存する。

Jev実finding3件だけHTTP200・4問、独立判断／実対応を記録。コード・SQL・数値・認証・合否・公開判断を委任しない。helper注釈の初回schema拒否（root causeの自由文をenumへ訂正）を実API失敗へ混同しない。小標本で削減効果を主張しない。

## 本番・公開状態

コード実装済み、ローカル検証済み。公式Pages公開はこの報告の後続証拠で確定する。

本番読み取りは今回既存Cloudflare認証で成功。対象Worker／D1／DBbinding一致、adminSecretあり。D1適用履歴は0001だけ、records表なし。既存Analytics Worker version16ad6d54は稼働、recordsBEST／TOP10は404、RECORDS_ENABLED OFF、公式Pages workflowにrecords endpoint未接続。STEP1では本番D1migration／Workerdeploy／フラグON／synthetic投稿を行っていない。Workerランキング本番稼働済み／実プレイヤー記録受信済みではない。[読み取り証跡](QA/PRODUCTION_READINESS.json)。

次は [HANDOFF](HANDOFF.md) の既存認証再確認→正しいD1／台帳／TimeTravel確認→0002/0003だけ適用→WorkerOFF更新→既存Analytics回帰→records有効化→Pagesendpoint接続→公開BEST/TOP1→実プレイ共有／撤回の順。今回環境の認証は使えたため認証不足をblockerと報告しない。秘密値をチャットへ要求しない。

実機iPhone／Android・人間Feel／音・実screen-reader発話・実BFCache・本番投稿は未確認。viewportと自動通常操作を本人試遊へ読み替えない。完全な不正防止／厳密な1人1枠を保証しない。
