# 第2バッチ 実装・公開状況

対象は026〜030のみ。ユーザー個別・追加指示を優先し、前バッチの時間制限・煽り・別モードを流用しない。本人未試遊公開は明示承認済み。

| ID | 名称 | 状態 | 公開・候補表 |
|---|---|---|---|
|026|出世すごろく ～UP & DOWN～|実装・単体27／root575・check/build・4画面通常操作・PC/phone通常完走、独立Visual81|公式Pages37669966367成功／runtime cd6d7ad／公開4画面・通常PC89/phone61turns完走・Portal25確認／A33済・読戻し確認|
|027|ひと息ビリヤード ～EIGHT BALL～|統合40対象／root617、4画面native任意導線・通常PC22/phone23shots終局、独立Visual81|公式CI／公開操作前・A47未更新|
|028|ぽんぽん卓球 ～TABLE TENNIS～|別作業枝で実装・最終操作検証中|未統合・未公開・A11未更新|
|029|給湯室の落としもの釣り ～LOST & FOUND～|別作業枝で実装、phone休憩入力原因未確定・公開保留|未統合・未公開・A42未更新|
|030|コンセントどこ？ ～PLUG ROUTE～|別作業枝で20面設計・独立解法検証、保存修正・操作検証待ち|未統合・未公開・A49未更新|

## 026統合

100蛇行マス・独自8昇進／8異動・CPUまたは同一端末2〜4人・公平1〜6・100ちょうど・超過停止・1イベント非連鎖・順位を維持。pending出目を保存してpause/restoreで振り直さない。新名前空間で既存save/BEST不変。実通常画面から640×360サムネイル、独自コード/SVG/説明/SEを使用。

root検証は[release-boundary](QA/integration026/release-boundary)、実ブラウザは[026報告](../game026/IMPLEMENTATION_REPORT.md)。独立Visualは実画面81点／F13／H12、AI技術評価であり人間の楽しさ・実機評価ではない。描画レビュー後の統合差分は[固定記録](../game026/SOURCE_FREEZE_INTEGRATED.json)：production練習の自動page_exit等を除外する任意observer predicate、対象026の呼び出しだけ。既存各ゲームの呼び出しと仕様は変えない。

## 基盤と保全

WorkerのゲームID／安全な集計イベント値登録・ローカルD1テストは追加承認範囲。本番Workerは現在Cloudflare未認証・API許可先不足で未反映。新作はクライアントremoteCollectionEnabled:falseと中央pending gateを維持、021〜025も解除しない。[登録状態](QA/WORKER_REGISTRATION_STATUS.json)。D1 schema/migration・Secret・認証・広告・GA4・CREDITは変更しない。

既存9作業treeの開始branch/HEAD/statusとファイルSHAは[BASELINE](QA/BASELINE.json)、変更保全を公開前に再照合。Game018未commit182fileを新作公開へ混ぜない。main由来の専用worktreeで作業し、次候補031は開始しない。

Jevはfinding時に1問題4問の実Shadow、PASS/build用途には使わない。独立判断と採否を別記。026は4実呼び出しのうち、reviewerの既知JSONフィールド誤認に対する1回が対象外だった手順違反である。ログを隠さず、正式監査で実HTTP200/有効4回答と除外を区別する。029必須Result項目の実装途中補完で事前Shadow・完全before freezeが抜けたことも最終報告に記す。証拠のない人間評価・時短効果を主張しない。
