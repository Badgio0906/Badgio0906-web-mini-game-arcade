# Q01 / Q03 / Q04 独立コードレビュー

2026-10-20。実装担当と別に、下記3作業treeのコード差分と周辺実装を読み取った。全て HEAD / main 基点は `619adc35a4339dc5d6f1ddc4e357d5f7eccde991`、製品変更は未commit時点。参照設計は同ディレクトリの `design-independent-review.md`。対象製品・テスト・Gitへの書込み、ブラウザ、外部API、公開操作は実施していない。後述の短い照合は read-only の Python 実行によるもの。

**判定：現在の差分に blocking finding はない。** ユーザー指示の最小範囲に収まり、保存・ルール・計測の保護境界を維持している。これはコードレビューの判定であり、未完了のブラウザ検証、元export監査、人間実機評価、公開の合格を代替しない。

## 共通保護境界

基準tree `/workspace/arcade-catalog-cleanup` と各treeで、`public/games`、`src/analytics`、`src/core`、`src/records`、`src/data`、`.github/workflows`、`analytics-worker`（存在するもの）、`vite.config.ts`、`src/arcade/config.ts`、Game033 model/renderer の計127ファイルを SHA256 比較した。Q01 の予定された `public/games/yokodori-days/game.html` と `public/games/export-manifest.json` を除き一致。Q03/Q04は127件全て一致した。tracked diffにもこれら以外の共有境界変更はない。

したがってこのレビュー対象には catalog、旧保存処理、record version/board、Worker/D1/API、Analytics/Consent/GA4/CMP/AdSense、CREDIT設定、workflow/build entry、他作品公開状態の変更は含まれない。PR11/main/deploy操作はレビューしておらず、実行していない。各treeの `node_modules` は一時項目で、製品成果物として含めない。

## Q01 `/workspace/arcade-game012-visibility`

差分は012配信HTML、manifestの012 HTML bytes/SHAと集計bytes、専用helper、importerと既存厳密監査、および別途の対象collectorに限定される。

- canvas の内部属性960×540と `canvasResizePolicy:0` を起動前に設定。CSSは canvas要素そのものの width/height を iframe viewport に対する16:9 containへ変更し、grid中央配置する。入力座標変換が参照する実rectと描画比率が一致する。body/iframeの既存shellやheaderは変更していない。
- `tools/game012_canvas_fit.py` は旧テンプレート、canvas数、元policyを検査する。importerは `game=='game012'`、厳密監査は `entry.id==='yokodori-days'` のときだけ同じhelperを適用する。013/014のHTML許可やバイナリ監査を緩めていない。
- 元の配信HTMLにhelperを適用した結果が現行配信HTMLと完全一致し、再適用も同一になることを独立照合した。これにより、単なる公開HTMLの手修正として再import時に失われる状態は避けている。
- manifestの元 `sourceSha256` を維持。HTMLは5595→6138 bytes（+543）、012 runtimeBytesと全体totalRuntimeBytesも各+543。3作品の runtimeFiles 全42行について実ファイルのbytes/SHAが一致し、各作品/全体の合計も一致した。
- `public/games` の012/013/014のPCK/WASM/engine JS/画像/音/ライセンス、shell、native-record bridgeは基準と同一。012 PCK SHA256は `46a9ae5df324babdea9833427da0aeeb80813cf99fd3b787636032335f21f412`、WASMは `6498359ba889796a0d95a2f71113ac184badc0f2d84cf28f4103c7e399d2d547`。前回原本解析時のhashとも一致する。

**残る検証境界：** この環境には importer が要求する pinned source/export実物がない。したがって3本の完全な元exportを入力した import / authorizedSourceRebuild 監査を実行したとは主張しない。今回確認できたのは、既存配信を基準とする完全再現、helperと両経路のコード整合、配信バイナリ不変、manifest整合である。helper/監査/collector等の新規ファイルは最終成果物に含める必要がある。

containにより portrait の表示文字/操作は小さくなる。4幅で全sceneが入ることと、実際の判読性・操作可能性は別に判定する。向き変更、native本番/結果/retry、shell練習、header/一覧帰還、touch座標、内部属性960×540、safe-area、fullscreenは固定ソースのブラウザ証拠で確認する。

## Q03 `/workspace/arcade-content-accuracy`

差分は `game002.html`、`game003.html`、`src/games/game035/main.ts` の3件、表示文だけ。

- Game002: helpから「衝突でCREDIT消費/Reward Stub +3」を除き、衝突終了・無料再挑戦と記載。`creditsEnabled:false`、`CreditService.canPlay` とdisabled時のconsume無処理に整合する。既存の dormant Reward/CREDIT経路、サービス、計測を変更していない。
- Game003: 位置・回転・重心の紹介へ修正。案内の ←→/R/Space は現在のkeydown処理と一致し、画面の移動/回転/DROPボタンにも対応する。UI ID、イベント、物理・得点・旧ルールBESTを変更していない。初期drop-statusはruntimeでも既存の「位置と向きを決めて、DROP」へ更新され、矛盾しない。
- Game035: 完了結果の見出し「9投」を「3エンド」に置き換えた1箇所だけ。`finishEnd` は投球1回以上から終了可能で、3エンド目にcompleteとなるため、早期終了を含めて記述が正しくなる。score/保存/eventsの式は不変。

追加日本語と長くなった003操作文の折返し・clip・font fallbackはブラウザで確認する。今回の修正は有料機能・広告有効化やゲーム内容変更を含まない。

## Q04 `/workspace/arcade-game033-consent`

差分は `src/games/game033/main.ts` のdialog表示と、`style.css` のtitle専用dialog配置およびtitle時の設定host配置。後述の限定再レビューを含む。

- `showDialog` は既存の cancelInput/state/disabled設定を維持し、open時にcloseした後、titleをshow、その他をshowModalにする。modelessからmodalへの不正遷移を避け、title→helpが非モーダルのまま残ることも防ぐ。
- `data-presentation` を各遷移で更新。title専用selectorはfixed・中央配置・z100で、同意hostのz10000より下。他modalのtop layerと既存backdrop/layoutには適用しない。
- 限定再レビューで追加された `#app[data-state="title"] ~ #analytics-settings-host{position:fixed;left:0;right:0;bottom:0}` は、タイトル時だけ設定hostをviewport下端へ配置する。実際のHTMLではhostがbodyへappendされ、appと兄弟になるためselectorに一致する。host内のshadow panelは元からfixed、z10000の設定も維持する。本番・練習・help・pause・resultではapp stateがtitleでなくなり、この追加指定は外れる。共有ConsentUIやnavigationのコードは変更していない。
- charge取消、menu.open/stateによる射出gate、pointer/keyup cleanup、実行/練習/時計/score/BEST/record/Telemetry呼出しは元のまま。closeイベントに独自のrun操作を結び付ける処理もない。
- ConsentUIとruntimeを変更せず、grant/deny/later/privacy/revokeの意味や送信イベントは不変。初期titleではinertを解消する。help/pause/resultが外部設定を従来どおりinertにする制約までは解消していない。

コード上の問題は見つからない。追加配置は、初回同意を閉じた後もスクロールなしで設定へ戻れるようにする局所修正として妥当。`public/arcade-navigation.js` はmodeless dialogがopenでheaderが画面外の場合、scrollイベントからheaderへscrollIntoViewする。初期実行の844×390 grant行では、設定ボタンへtapする途中でapp内showがpointerを遮り失敗しており、報告された原因と整合する。タイトル用の下側余白と組み合わせ、設定hostを画面内へ保持する方が、共有navigation/consent構造の変更より影響が狭い。

モデルレス化後のtitleの最大高・safe-area・短い横画面でのclip、consentと重なる時のfocus/keyboard操作はCSSだけでは合格判定できない。以下のDEV生結果は確認したが、compiled検証、通常100秒完走/result/retry、人間実機評価の代替とはしない。

## 実行証拠の扱い

実装担当rootからの報告として、Q03 check・976 unit tests・build成功、Q01 DEV native 3作品×4幅12件成功を受け取った。この2件は本レビューが独自実行/生結果確認した合格ではない。

Q04限定再レビューでは、collectorソースと `q04-browser-dev/REPORT.json`（18/19、844×390 grant後の設定再アクセス失敗）、`q04-browser-dev-final/REPORT.json`（19/19、pageerror 0）を実際に読んだ。初期失敗は保存し、最終結果へ置換していない。最終REPORT SHA256は `e6c07296a723fcf9ca07273e4f878cabad1616b2d55872bedc5f8afcac1efc0c`。4幅のfresh grant/deny/later/privacy、390幅の既存granted/denied/保存拒否を含む。privacy以外の各行ではtitle非modal、grant後の設定再表示/deny、title↔help、練習、実ジェスチャー、本番開始、pause時計停止/resume、一覧到着をcollectorがassertする。1440 grantはEnter操作、それ以外はclick/tap。各行の同意選択直後に自動開始しないことも確認されている。

この最終REPORTには `normalRunWaitMs` / `retry` の記録がなく、通常100秒完走/result/retryを試したとは主張しない。ブロックされた外部リクエストは既存AdSenseのGETだけで、許可していない外部POSTは記録されていない。これはrootが実行したDEV結果の提供証拠レビューであり、本レビュー自身のlive browser実行ではない。

再レビュー時に末尾表の10製品/監査ファイルのhashを再照合し、Q04 style.css以外の変更がないことを確認した。Game033 main.tsは前回hashと一致、ConsentUI/runtime/model/rendererは基準と一致。Q01の元export完全監査未実施、compiled検証/最終browser状態、人間の面白さ・実機評価は最終HANDOFFで明示する。ここから製品ソースが変わった場合は該当差分と影響検証を再レビューする。

## 読み取った候補の SHA256

| tree | file | SHA256 |
|---|---|---|
| Q01 | public/games/yokodori-days/game.html | `60e43504fe125cf1771f8a10273139757d6b17a6e930f3dd6935b4f9c3c2bec8` |
| Q01 | public/games/export-manifest.json | `76df2d55b90f155e76b537cb3bae7443c0fd81773b0fa2372b5031515f3b8ab5` |
| Q01 | tools/game012_canvas_fit.py | `4c193d5139681ffdf053c917adb2bed88fdbd9b0c2f6e7b80173f451329e2de0` |
| Q01 | tools/legacy-records-import.py | `28815c0caca4e8872af0cd67a7db0d033921aacd97ae1eb2b7152044f4989176` |
| Q01 | tests/fourteen-game/audit-legacy-migration.mjs | `56a880bfc10164128c4c194ca91a38c9b18234c01f52aba781b85afe0a6823fc` |
| Q03 | game002.html | `e1e55df61436e34af131226d79d6068cdadc762662ef44ac4b9773f109b551c1` |
| Q03 | game003.html | `5d74bef2b53acaa428916f88cc6c40c86fc1ead47b488a28de93100b3d7bf91e` |
| Q03 | src/games/game035/main.ts | `81544a7f415c0beeb21fe60a09339ef8b0d86b044d76b4224c44fb295a78002a` |
| Q04 | src/games/game033/main.ts | `6ebb8f6f5a16c06252d8dccc0f6037f5845548a9c967a018a2d4f4dc0737f227` |
| Q04 | src/games/game033/style.css | `b7ff8e895beab7948de59811addf390f5b57f44c87266ddd90ad440cda6331bd` |
