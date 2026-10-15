# Game024 revision02 — ランダム盤面

2026-10-15。ユーザーの第2工程要件を実装。20×20、長さ3、餌数得点、4/6/8マス毎秒は維持する。餌3〜7個の間隔を変化のたび独立再抽選し、seededな短い壁区間を再配置する。初期少数から最大28壁へ増え、身体160マス以降は壁をなくして400マスクリアを確保する。背景色の変更だけではなく、描画と衝突が同じ壁配列を参照する。

壁生成は96回の有界試行。身体、餌、直進3マス、合法な隣接方向を保護し、現在の身体を固体としたflood fillで餌へ到達する配置だけを採用する。置けない場合は開けた盤面へ退避する。プレイヤー自身が身体で完全に閉じ込めた状態を救済する機能ではない。

変化中650msは移動時計を停止する。古い方向入力は破棄、演出中の入力も捨てる。演出完了後は新規入力で方向を選べる。端で直進できない場合だけ、合法な初期方向をtransitionExitに保存し、pauseやreloadの入力クリアから分離する。移動のbacklogを溜めず、演出後に1tickの余裕を確保する。白い境界の点滅と琥珀色の壁で組み替えを知らせ、短い音を鳴らす。

保存は`web-mini-arcade:v1:game024:state-shifting-v2`、rules_version 2。身体／壁／餌／seed／残り個数／変化回数／演出残りms／進行先／速度／時計／run ledgerを原子的に保存する。旧`state`キーとそのsnapshot/BESTのbytesは書き換えず、タイトルで旧BESTを別表示する。旧snapshotを新ルールへ自動変換しない。共通recordDefinitions/gameVersionsの新版登録は統合担当の所有。

実行済み：既存Game024 26件＋追加12件PASS。追加は3,4,5,6,7の全閾値、250 seeds×再生成、壁の実衝突、身体/餌/前方保護、到達性、端での入力破棄、長蛇400clear、演出/乱数復元、破損save、旧キー不変。Game027関連既存40件もPASS。`npm run check`は実行時点の別担当Game003作業中エラーで停止し、024/027のエラーは出ていない。統合担当が最終check/build/全体testsを実施する。

Jev：実観測finding 1件、1 API/HTTP200、4回答有効。回答を見ずに実装担当がcode/test判定、注釈比較は一致、false pass/risk miss 0。これは独立workerのレビューではない。最初のannotateはfinal_root_causeのenum形式違反で拒否され、正しいschemaで注釈成功。失敗を追加API送信へ置換していない。QA配下に原本とsummaryを保存。

未実施：固定buildブラウザの通常入力、独立Gameplay/Visualレビュー、実機スマホ、聴感、本人試遊、本番公開。見た目/面白さの合格点をこの文書から付与しない。rootによる固定source/build検証を次の再開点とする。

## 標準イベントの限定追補

既存recordEndのtraining/active/reported guardの内側へ、通常wall/self/clear時scoreを1回、quit/restart時quitを1回追加。run_endは既存1回を維持し、結果再読込/練習へイベントを増やさない。

根拠は`docs/catalog-reorganization/QA/standard-events-024-027-035/`。3mainの変更前後hashと差分を保存。既存対象8file/92testと、実mainの終了関数を抽出・transpileして隔離VMで実行する12testが成功、TypeScript check成功。VMは描画・通常入力・本番通信の試験ではない。desk_rainがJev回答未読で独立readし、追加event文だけを除くと3mainがbefore hashと完全一致すること、練習除外とrun_end重複なしを確認。Jevは各game1件、実3HTTP200/12回答、独立注釈3件成功。既存大型gameplay QAはevent追補前のsourceで継続し、この限定検証を全sourceの同一版QA合格と扱わない。外部POSTは試行せず、remote/同意/登録gateは不変。


## 一括改修の最終統合・公開状態（2026-10-16 JST追補）

今回のcanonical runtimeは `57dce24977e4d3c7dfd42e99315c67fa07bb0243`。12作品×4画面のcompiled48組とPortal27作品のroot/subpath150項目を確認した。固有の通常RUNと後追い限定差分は [source chain](../../catalog-reorganization/QA/FINAL_SOURCE_CHAIN.json) に分離し、過去の失敗原本を保持する。最新の公式workflow・公開commit・配信SHA・実公開操作は [公開記録](../../catalog-reorganization/PUBLICATION.md)、ゲーム別結果と本人/実機/聴感の未実施範囲は [最終報告](../../catalog-reorganization/FINAL_REPORT.md) を正本とする。以前の「準備中」は各記録時点の履歴。
