# 内部Game012：スマートフォン横向き専用版（2026-10-21 JST）

**PR #13のDraft候補。main未統合・本番未公開。作者の実iPhone試遊と公開判断を待つ。** 対象は「お前の仕事は俺の仕事」 `/games/yokodori-days/index.html`。表示番号012「落下キング」＝内部Game015/PR11とは別作品。

元PR13 HEAD `689165e0884eaab0a913066688aba341170b12ba` のcontain対応を保持し、公開済みPR14/15のmain `ac5304fa81361f592942c472c7fa04f668d3b4bc` を通常mergeした `60e8b28164cad38556a645fa2cbe940023229185` を基準に改訂した。既存履歴・元worktreeは破棄していない。[前版の原因・検証](MOBILE_VISIBILITY_FIX_20261020.md)は履歴として保持するが、そこで保留したC「横専用」を今回は作者指示で正式採用した。

## 方式と適用範囲

primary `pointer:coarse` かつ `hover:none`、**screen短辺600CSSpx未満**をphone相当として扱う。その範囲のportraitだけを制限する。向きはscreen.orientation.type→旧window.orientation→orientation mediaの順に取得し、orientationchange・resize・primary inputの変化で更新する。起動・練習の直前にも確認する。

|方式|利点・リスク|採否|
|---|---|---|
|横長viewportだけで判定|小さいPCやsplit tabletを誤制限し、Safariバー/keyboardでも切替わり得る|不採用|
|coarse/hover＋physical screen短辺＋向き|狭いfine PCと600以上tablet/split viewportを維持。端末種別の完全判定ではない|採用|
|orientation lock/強制fullscreen/PWA|通常Safariタブで可用性が異なり、追加の権限/UIを要する|使わない|

1440PCに加え390幅のfine PC、768 tablet、390幅のtablet split、600境界を確認した。小型tablet・折畳み端末・外付けポインター・OSのscreen値にはheuristicの不確実性が残る。実iPhone Safariでの向きイベント・browser UI開閉は未検証で、全端末識別を保証しない。

## 縦向き案内・横向き起動

縦初期は「横向きで遊んでください」「このゲームはスマートフォン横向き専用です。端末を横にすると、ゲーム画面をすべて表示できます。」を表示。「ゲーム一覧へ戻る」「遊び方を見る」、既存の解析設定・プライバシーを利用できる。説明は閲覧できるが、本編とshell練習のbuttonをdisabledにする。縦初期にnative HTML/WASMを取得しない。

横に戻るだけでは起動しない。明示的な開始操作でのみnative iframeをロードする。直リンク `game.html` はengine起動前にcanonical `index.html` へreplaceしてreturnするため、案内を迂回しない。PCの直リンクも同じ入口へ戻るが、通常開始できる。

元960×540、canvasResizePolicy=0、16:9実DOM矩形のcontain・入力座標を維持。今回、ゲーム物理・人物/HUD・フォント・難易度・得点・Godotバイナリを再設計していない。

## 回転時の状態・記録

安全なGodot pause/resume APIは確認できなかった。iframeをCSSで隠すだけでは本編と時計が進むため不採用。**現在のセッションを中断してアンロードする**方式を採用した。これは一時停止・続きからの復帰ではない。

1. 本編ロード中/プレイ中のportrait移行は、同じiframeをhiddenにして既存record受理gateを閉じる。
2. 同iframeをDOMからremoveし、子browsing contextを破棄してsrcを外す。方向/touch/keyを持つ古いengineも破棄される。
3. 案内に「縦向きになったため、今回のプレイを中断しました。保存済みのBESTはそのままです。横向きで『もう一度遊ぶ』を押すと、最初から遊べます。」を表示。
4. 横へ戻ってもsrcを作らず待つ。「もう一度遊ぶ」の新しい操作だけで、共有listenerが捕捉した**同じiframe要素**を再接続し、新WindowProxy・新records_session UUIDで起動する。

初期のblank iframeはmoduleの捕捉が済むまでDOMに残す。既存bridge/source/nonce/start-result検査は変更せず、回転をfake result/clearとして送らない。正当に確定したBESTを消さず、中断した未完RUNの継続・未flush進捗の保存は保証しない。説明DOMは保持して開始可否だけ切替え、shell練習は中止して案内へ戻す（練習はBESTへ影響しない）。

独立レビューが、説明buttonでdown→縦→横→遅延clickという旧gestureの受理を発見した。実Chromiumのpointer/touchで修正前に各1回の意図しないnative URL起動を再現。回転/起動時にgesture epochを消さず古い値を保持する限定修正で拒否し、次のfresh tap/Space/Enterを維持した。Space/Enterは修正前から当該症状を再現していない。これは起動境界のstub HTML試験で、本編プレイは別のnative検証で確認した。

## ローカル検証

ソースは長いbrowser実行中に固定した。[固定hash・生成/保護監査](landscape-only-20261021/QA/GAME012_SOURCE_AUDIT.json)、[独立設計](landscape-only-20261021/QA/design-review.md)、[独立コードレビュー/修正追補](landscape-only-20261021/QA/code-review.md)、[コマンド記録](landscape-only-20261021/QA/GAME012_FINAL_COMMANDS.json)。

|検証|結果・限界|
|---|---|
|npm run check|成功|
|npm test -- --maxWorkers=1 --minWorkers=1|**101 files / 976件成功**。時間制限・期待値を変更していない|
|npm run build|成功。既存navigation public CSS解決・500kB chunk警告あり。警告を隠す設定変更なし|
|offline Jev helper|25件成功。**有料Jev/OpenRouter APIはユーザー禁止に従いNOT_CALLED**。通常の独立レビューを実施|
|DEV matrix|13件成功（gesture限定修正前）。最終修正後の全matrixはcompiledで再検証|
|compiled matrix|指定7サイズ＋fine PC/tablet等4境界＋runtime直リンク2、**13/13成功**。縦未起動、how、consent/privacy、横/PCの実native touch/Enter、自然な結果/retry、一覧帰還|
|回転gesture|実browserの旧pointer/touchがRED→最終DEV/compiledのpointer/touch/Space/Enter **4/4成功**。古い操作拒否、新しい操作は開始可能|
|DPR3 lifecycle|DEV/compiled成功。独立shell練習2成功、本物のnative start/result/retry、指を押したままportrait→実Window.closed、横戻り未起動→明示新context/nonce。旧source/sessionの**合成遅延message fixture**を拒否|
|BEST/保存|新規隔離profileの自然な0点結果がmirror→portal→reloadで維持。回転後と合成777点拒否後も0。別localStorage fixture保持。WASM/PCK/bridge/形式不変のコード監査と区別し、実本人の高得点save互換実機確認は未実施|
|Game012/013/014回帰|DEV/compiledとも3作品×4サイズ **12/12成功**。012の縦だけ案内、013既存の縦案内、014の通常開始/一覧を保持。013の音同期・自然な全stage結果は実機票へ残す|
|生成/manifest|managed shell2copy完全一致、runtime42＋shell6＝48行hash/bytesとruntime合計一致。mainの旧HTML→同helperで現行HTML完全再現、再適用冪等、壊れた適用2例拒否。013/014のmanifest不変|
|完全な元export照合|**未実施**。pinned元export/ソースがない。既存配信を正本にした変換再現と同じ意味にしない|
|実iPhone Safari/音/面白さ|**未実施・作者確認待ち**。Chromium/画像から合格を推定しない|

[compiled実行日時](landscape-only-20261021/QA/GAME012_COMPILED_RUNS.json)、[matrix生データ](landscape-only-20261021/QA/compiled-matrix/REPORT.json)、[回転入力](landscape-only-20261021/QA/compiled-gesture/REPORT.json)、[中断/保存](landscape-only-20261021/QA/compiled-lifecycle/REPORT.json)、[3作品回帰](landscape-only-20261021/QA/compiled-cross/REPORT.json)。結果はfresh context・外部送信遮断による。時計/モデル/得点を注入せず、合成message試験はnative記録と明示的に分離した。

初回gesture collectorにはabortしたiframeでのinitScript storage例外と重複h2 selector不備があった。テスト基盤を直してstub HTMLで起動URLだけを観測し、製品変更前にpointer/touchのREDを再確認した。初回/訂正RED/最終GREENのJSONを別々に保持した。過去PR13の失敗ログ・成果物は削除していない。Git保存用ログは末尾の空行のみ正規化し、一時auditディレクトリの原本を保持した。

## 同一viewport比較と画像

beforeは元PR13 689165eのcompiled版、afterは今回のcompiled固定候補。縦3サイズは作者の仕様変更により本編から案内へ置換。横とPCはcanvas寸法を変えず全体表示を保持した。CSS pxの実測で、物理Safariのバー開閉とは別。

|viewport|before Canvas CSS寸法|after|
|---|---|---|
|390x844|390.000×219.375|縦向き案内・本編未ロード|
|375x667|375.000×210.938|縦向き案内・本編未ロード|
|320x568|320.000×180.000|縦向き案内・本編未ロード|
|844x390|487.109×274.000|487.109×274.000|
|932x430|558.219×314.000|558.219×314.000|
|667x375|460.438×259.000|460.438×259.000|
|1440x900|1393.766×784.000|1393.766×784.000|

|画面|修正前|修正後|
|---|---|---|
|390×844|[本編](landscape-only-20261021/QA/before/390x844.png)|[縦案内](landscape-only-20261021/QA/compiled-matrix/390x844-guide.png)|
|320×568|[本編](landscape-only-20261021/QA/before/320x568.png)|[縦案内](landscape-only-20261021/QA/compiled-matrix/320x568-guide.png)|
|844×390|[本編](landscape-only-20261021/QA/before/844x390.png)|[横プレイ](landscape-only-20261021/QA/compiled-matrix/844x390-play.png)|
|667×375|[本編](landscape-only-20261021/QA/before/667x375.png)|[横プレイ](landscape-only-20261021/QA/compiled-matrix/667x375-play.png)|
|1440×900|[本編](landscape-only-20261021/QA/before/1440x900.png)|[PC](landscape-only-20261021/QA/compiled-matrix/1440x900-play.png)|

[縦回転直後の中断](landscape-only-20261021/QA/compiled-lifecycle/portrait-interrupted.png)／[横へ戻した明示retry待ち](landscape-only-20261021/QA/compiled-lifecycle/landscape-explicit-retry.png)。[独立Visual](landscape-only-20261021/QA/visual-review.md)は実画像で3人物・対象・HUD・下部操作帯と案内導線を確認。横nativeの小文字の実機判読性を留保し、画面に収まったことを人間の快適性・面白さ合格とはしない。

## 変更範囲・非変更

製品差分はpublicの012 index.html/portal-return.css/game.htmlとexport-manifestだけ。managed shell2copy、012専用adapter、厳密監査の許可変更ラベル、012 QA collector、報告を同期した。既存importerは同じadapterを呼ぶので再importで消えない。

mainとの `src/`・Worker/D1・.github・Vite・package・広告/同意/Telemetry/Analytics・portal・013/014・native record bridgeは空差分。WASM/PCK/index.js・ゲームルール・物理・保存形式・CREDIT・公開数26/完成9/試遊17・031保留は不変。PCK SHA256 `46a9ae5df324babdea9833427da0aeeb80813cf99fd3b787636032335f21f412`、WASM `6498359ba889796a0d95a2f71113ac184badc0f2d84cf28f4103c7e399d2d547`。

小容量環境のため、build後のignored distにあるpublicと完全一致するコピー267件のみhash照合してhardlink化した。製品byte変更・素材圧縮ではない。publicは編集前にlinkを切って他worktreeを保護した。今後そのdist/publicを編集する場合もlinkを切り、他treeへ書き込まないこと。

## 作者試遊と引継ぎ

[実iPhone手順](HUMAN_PLAYTEST_20261021.md)を使う。本番はまだPR13未反映で、必ずPR13最新HEADのローカル候補で確認する。作業場所 `/workspace/arcade-game012-visibility`、branch `codex/game012-mobile-visibility-fix`。PRは [#13](https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/pull/13)。この報告を含むHEADと自動CI結果はPR最新欄と最終回答を参照。main merge・Pages公開・自動mergeは実行しない。

再実行は同branchで依存を準備後 `npm run check` / `npm test -- --maxWorkers=1 --minWorkers=1` / `npm run build`。`python3 tests/catalog-quality/serve.py --directory dist --port 4973` を別terminalで起動し、`QA_BASE=http://127.0.0.1:4973/ QA_OUT=/tmp/game012-new-matrix node tests/game012/landscape-only.mjs` 等を実行する。QA_OUTは新規の保存先を毎回指定し、過去証拠を上書きしない。Chromiumはこの環境の/usr/bin/chromiumを使用する。
