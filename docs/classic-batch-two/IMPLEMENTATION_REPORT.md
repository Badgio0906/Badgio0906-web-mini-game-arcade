# 第2バッチ 実装・公開状況

対象は026〜030のみ。ユーザー個別・追加指示を優先し、前バッチの時間制限・煽り・別モードを流用しない。本人未試遊公開は明示承認済み。

| ID | 名称 | 状態 | 公開・候補表 |
|---|---|---|---|
|026|出世すごろく ～UP & DOWN～|実装・単体27／root575・check/build・4画面通常操作・PC/phone通常完走、独立Visual81|公式Pages37669966367成功／runtime cd6d7ad／公開4画面・通常PC89/phone61turns完走・Portal25確認／A33済・読戻し確認|
|027|ひと息ビリヤード ～EIGHT BALL～|統合40対象／root617、4画面native任意導線・通常PC22/phone23shots終局、独立Visual81|公式Pages37675920015成功／runtime ff369e5／公開4・PC22/phone23終局・Portal26／A47済・読戻し|
|028|ぽんぽん卓球 ～TABLE TENNIS～|統合47対象／root666・check/build、128nativechecks、独立Visual81/F12/H12|公式Pages37680233126成功／runtime4310be3／公開指定4画面125check・通常終局再挑戦保存／Portal27／A11済読戻し|
|029|給湯室の落としもの釣り ～LOST & FOUND～|統合27対象／root695・check/build、指定4画面通常結果・再挑戦、独立Visual81/F12/H12|公式Pages37681354491成功／runtime8d3ac39／公開指定4画面通常結果・再挑戦保存／Portal28／A42済読戻し|
|030|コンセントどこ？ ～PLUG ROUTE～|統合39対象／最終root737（67file）・check/build、20面1260変位route検証・PC/phone全20面再挑戦、独立Visual82/F13/H12|修正後公式Pages37682943758成功／runtimebd0d293／公開指定4画面78check・PC/phone各21clear／Portal29／A49済読戻し|

## 026統合

100蛇行マス・独自8昇進／8異動・CPUまたは同一端末2〜4人・公平1〜6・100ちょうど・超過停止・1イベント非連鎖・順位を維持。pending出目を保存してpause/restoreで振り直さない。新名前空間で既存save/BEST不変。実通常画面から640×360サムネイル、独自コード/SVG/説明/SEを使用。

root検証は[release-boundary](QA/integration026/release-boundary)、実ブラウザは[026報告](../game026/IMPLEMENTATION_REPORT.md)。独立Visualは実画面81点／F13／H12、AI技術評価であり人間の楽しさ・実機評価ではない。描画レビュー後の統合差分は[固定記録](../game026/SOURCE_FREEZE_INTEGRATED.json)：production練習の自動page_exit等を除外する任意observer predicate、対象026の呼び出しだけ。既存各ゲームの呼び出しと仕様は変えない。

## 基盤と保全

WorkerのゲームID／安全な集計イベント値登録・ローカルD1テストは追加承認範囲。本番Workerは現在Cloudflare未認証・API許可先不足で未反映。新作はクライアントremoteCollectionEnabled:falseと中央pending gateを維持、021〜025も解除しない。[登録状態](QA/WORKER_REGISTRATION_STATUS.json)。D1 schema/migration・Secret・認証・広告・GA4・CREDITは変更しない。

既存9作業treeの開始branch/HEAD/statusとファイルSHAは[BASELINE](QA/BASELINE.json)、変更保全を公開前に再照合。Game018未commit182fileを新作公開へ混ぜない。main由来の専用worktreeで作業し、次候補031は開始しない。

Jevはfinding時に1問題4問の実Shadow、PASS/build用途には使わない。独立判断と採否を別記。026は4実呼び出しのうち、reviewerの既知JSONフィールド誤認に対する1回が対象外だった手順違反である。ログを隠さず、正式監査で実HTTP200/有効4回答と除外を区別する。029必須Result項目の実装途中補完で事前Shadow・完全before freezeが抜けたことも最終報告に記す。証拠のない人間評価・時短効果を主張しない。

## 完了時点の確認と再現性

5作品の実装・技術QA・公開・候補表更新を完了。最終配信ゲームソースは `bd0d293479848786f31974a2a3d6ed44c7db63d9`、公式Pages [37682943758](https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/actions/runs/37682943758) のbuild/deploy成功。公開一覧は29本、履歴ID30／010退役、031未着手。各ゲームの `QA/PUBLICATION.json` が期待commit・CI・配信SHA・公開操作・Portal・Sheet読戻しを結び付ける。最終全体737単体／67file、check/build、Jev helper offline25、Worker typecheck／実ローカルD1 38events／12RUN成功。

030の初回 `e973cf9` はCI成功でも物理HTMLの登録漏れがあった。公開版照合のENOENTで停止し、実Vite設定から全catalog routeを確認する修正前FAIL→修正後PASSの回帰を追加し、Vite登録だけを `bd0d293` で修正。失敗を成功扱いせず[当時の観測](QA/integration030/build-entry-correction/OBSERVATION.json)を保全してから公開通常操作とA49更新を行った。030公開collectorの絶対パスpreflight失敗も別出力へ保存し、ブラウザ起動前のテスト経路修正として区別した。既存ゲームの物理・save・BEST・routeは不変。

配信版は期待commitの公式CIに列挙されたhash付きJS/CSSと、同公開設定の再現buildに対する各13file SHA一致で確認。55MiB公式artifact ZIPは転送上限32MiBとredirect許可先の制約で直接取得できなかったため、直接artifact比較を実施したとは記載しない。公開QAは同意拒否／qa環境／Analytics・広告request遮断で実利用集計への混入を避けた。

Sheetは対象A33/A47/A11/A42/A49の値だけを「済」に更新し、各回B:N不変を読戻しで確認。最終[5行読戻し](QA/FINAL_SHEET_READBACK.json)も済。No・タイトル確認を行い他の候補は編集しない。

本番Worker反映だけは未完。[既存認証の最終確認](QA/WORKER_FINAL_AUTH_CHECK.json)でも未認証で、新規Secret・権限・ネットワーク変更を行っていない。コード上の026〜030登録とローカル検証は完了、production収集021〜030のpending gate／remote OFFを維持。Pages公開とWorker本番反映は別の状態として報告する。

素材は独自Canvas/SVG・独自盤面／20面・説明・簡易SE、サムネイルは実ゲーム画面のcrop/resize。名前・競技ルールの限定検索と具体的表現をコピーしない判断は[RIGHTS_NOTE](RIGHTS_NOTE.md)と各ゲームのRIGHTS_NOTE、素材indexに記録。権利のゼロ保証・日本の法的クリアランス完了は主張しない。

独立Visualは026〜029各81、030は82（F/H最低値を個別記録）、Gameplayの技術確認と本人の面白さ・物理スマートフォン評価は区別。本人未プレイ公開は今回承認済みだが、各 `HUMAN_PLAYTEST.md` は未実施。Jev実API28件の全HTTP200・有効4回答・resolved model・独立判断／実作業を[利用報告](JEV_USAGE_REPORT.md)で監査。不要1呼出し・029のShadow前修正・初回証跡欠測等も明記し、性能や工数削減を保証しない。

旧9作業tree（018未commit182fileを含む）を開始時のbranch/HEAD/status/SHAと照合して保全。広告・CREDIT・GA4・Worker/D1設定／schema・Secret・認証は変更しない。共通変更は登録と対象ゲーム練習由来production observer除外の任意predicateだけで、既存呼出しは既定挙動を保持する。
