# Q04 Game033：開始前の解析設定を操作可能にする（2026-10-20）

`codex/game033-initial-consent-ux`、基点はPR #12公開済みmain `619adc35a4339dc5d6f1ddc4e357d5f7eccde991`。**独立したレビュー候補。main未統合・本番未公開。** 同意取得をゲーム開始条件にはしない。同意サービス／計測／CMP／AdSenseを変更する作業ではない。

## REDと設計比較

既存タイトルはnative `showModal()`。別shadow hostの解析同意UIはmodal top layerの外側でinertになり、見えても拒否を操作できない。修正前のブラウザ実測は `initial-consent-20261020/QA/red.json` の `actualDenied:false, modal:true`。通常z-indexを上げても解決しない。

|案|利点|リスク・判断|
|---|---|---|
|A 同意操作を先にする|ゲームタイトルと同意表示を時系列に分けられる。|laterは未決定、既存許可／拒否・保存拒否等の分岐と共有API依存が増える。同意を開始gateに見せるおそれ。不採用。|
|B タイトルだけ非モーダル|既存設定UIをそのまま操作できる。ゲーム状態・計測を変えない。|title↔helpのclose→showModalと短画面の位置・focus検証が必要。今回採用。|
|C modal/同意構造を変える|top layer内部へ同意UIを移す等の構造解決。|共有UI・focus・他ゲーム・CMPへの波及が大きい。今回の範囲外。|

`showDialog` は既存open dialogをcloseし、titleなら `show()`、それ以外は `showModal()`。既存cancelInput、launch無効化、state／menu.openによる入力gateとfirst-button focusを維持。既開modelessから直接showModalするInvalidStateErrorを避ける。

CSSはtitleだけをviewport中央へfixed配置、既存同意hostより低いz-index。追加DEV検証で844横の許可→設定再表示1件が失敗した。共有navigationのscroll時ヘッダー復元が、下方footerへ移動するscrollを巻き戻していた。**Game033のtitle時だけ**既存の兄弟 `#analytics-settings-host` をbottom fixedにし、スクロールせず設定へアクセスさせる。shared consent/navigation本体やplaying時の配置は変更しない。

help/pause/resultの外側設定が従来どおりinertになる制約までは変更しない。タイトルに戻れば設定と撤回へ到達できる。全modal中に設定を操作できるようになったとは主張しない。

## 品質結果

|検証|結果|
|---|---|
|型検査 `npm run check`|成功。|
|単体 `npm test -- --maxWorkers=1 --minWorkers=1`|101ファイル／976件成功。初回の並列全群は既存Game010/015の2件がtimeout。timeout値や既存試験を変えず直列成功。|
|`npm run build`|成功。既存chunk/public CSS解決警告と今回のエラーを区別。|
|DEV初回→限定CSS後|18/19→19/19。失敗原本を `initial-consent-20261020/QA/dev-initial.json` として保持。|
|compiled UI|**19/19成功**。1440×900、390×844、320×568、844×390の4条件×初回許可／拒否／後で／privacyの16ケース、既存許可／既存拒否／保存拒否の3ケース。|
|実操作の範囲|許可・拒否・later・開始前privacy、設定再表示・撤回、同意操作で自動RUNを開始しないこと、タイトル↔説明、練習・本番の通常touch/mouse hold、休憩の時計停止、resume、一覧帰還。title modeless、説明／pause/result modalを確認。|
|自然な通常結果／retry|PCのlater選択で通常100秒を進行し、約99.6秒の待機後に結果を確認、retryで新RUN開始。時刻・モデル・stateを注入しない。|
|keyboard追補|shadow内Tab→拒否へEnter、設定をEnterで再表示、Escapeによるタイトル不変、説明modal維持、練習pause/helpからEscape再開。`initial-consent-20261020/QA/keyboard/REPORT.json`。|

ブラウザはローカルcompiled siteに限定。外部リクエストを遮断し、新しいdisposable contextを使用。保存拒否は明示fixture。実iPhone Safari・VoiceOverは未実施で、Chromiumのモバイルviewportを物理実機合格としない。

## 変更範囲・保全

製品は `src/games/game033/main.ts` のdialog表示部分と同 `style.css` のtitle限定CSSだけ。collector2本と本報告・QAを追加。ゲームmodel、射出・得点・時計・BEST形式、RecordSharing、同意サービス、GA4／Telemetry呼出し・送信仕様、AdSense／CMP／Worker/D1／CREDIT、他ゲーム、カタログ公開状態・PR #11は不変。解析同意と広告同意は引き続き別で、広告同意取得済みとはしない。

## 人間確認・再開方法

- [ ] 候補を `npm run dev` 等でiPhone Safariから開き、fresh状態で拒否・later・privacyを開始前に操作できる。
- [ ] 許可後の設定再表示・撤回、縦／短い横でタイトルと設定が読める。Safariバー・safe-area・keyboard focus／VoiceOverを確認。
- [ ] 明示的に本番／練習を始め、hold解除、休憩、説明、自然結果、retry、一覧帰還を確認。
- [ ] 他modalでは外側設定が操作対象外になる従来仕様を確認し、タイトルに戻って撤回できる。

Draft PRのレビューと作者の実機確認後、公開は別承認で行う。Google審査の原因特定・合格保証・再申請を行わない。

変更ファイル一覧：`src/games/game033/main.ts`、`src/games/game033/style.css`、`tests/game033/initial-consent-browser.mjs`、`tests/game033/keyboard-consent.mjs`、本報告と `initial-consent-20261020/QA/` のJSON・ログ・画像。公開状況の共通正本 `CURRENT_STATUS` は独立Q03で統合担当が更新し、本branchに他課題を取り込まない。
