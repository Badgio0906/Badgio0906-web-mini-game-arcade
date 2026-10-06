# 集客開始前の分析・長押し・010退役改修

2026-10-06日本時間。基準main `b766232ba9997d3b4eeb415c848f334bc98e0480`。ユーザーの最新統合指示を適用。公開の記録は本報告末尾・QA/PUBLICATION.jsonを正本とする。

## 実装

- Game010：本人試遊「抜本改修後も面白くない」による企画判断でretired。active Catalog18、ID/releaseOrder維持、次は020。`game010.html`は軽量noindex/nofollow退役ページ、ゲーム本体を起動しない。元コード・素材・資料・旧Telemetryを保持。旧profileをbyte不変でretired_game_profilesへ移動。local集計も歴史010をretiredとして扱う。
- 共通TouchGuard：操作部品・Canvas・SVG desk・動的練習・旧Godot iframeだけにuser-select/callout/drag抑制とcontextmenu/selectstart/dragstart取消。プレイCanvas/長押しtouch-action:none、通常menu manipulation。ポータルスクロール、説明・privacyの文字選択は維持。既存pointercancel/lostcaptureの解除を通常入力で確認。
- ConsentService：unknown/granted/denied、許可と拒否同サイズ、任意保留、全activeページ＋privacyに常設設定。別タブも撤回に追従。production未知/拒否は識別ID/外部通信/新しいlocal履歴保存なし。同意前memoryの後付け保存と旧400件uploadなし。
- Upload：外部schema2、三版・browser/visit/page-session/RUN/event IDの区別、環境・device/input、許可されたUTMとprimitiveのみ。25件/32KiB batch、200件/24時間、5回までbackoff、ack＋D1 dedupe、pagehide keepalive。撤回でID/queue削除とfetch中断。ゲームフレームはawaitしない。
- GA4：同意後だけlazy-load、coarse events、queryのないpageview、sanitized campaign/referrer。再許可時も初期化。設定なしdisabled。
- Worker/D1：独立プロジェクト、64KiB/50件、strict allowlist、finite/string/date/Origin/CORS、UUID dedupe、productionのみwrite、Bearer集計、90日raw/13か月IDなしUTC日別archive。retired/version/coverage/欠測を区別。
- 管理画面：noindex/nofollow、ポータルリンクなし、tokenメモリのみ、JST期間、分母付き率、18作品・retired切替、015/018/019funnel、再挑戦・移動・再訪、版・device/source・エラー、保持不足/UTC日次の注意。その他native作品の初期funnelはRUN開始→終了、固有primitiveはD1に保存して後段集計へ使う。
- Jev：後段の集計JSON exportのみ、個別ID/raw/tokenなし。runtime API判断は追加しない。
- Game018計測補足：実render後のrare_effect_shownとrun_endのmax_height/landing_type。eligible/won/shownを分離。物理/抽選/描画/得点不変。Game019は共通observerでsamplingと大落下後最初の継続を計測、固有ソースbyte不変。

## 検証と修正

作者と判定を分離。[独立client](QA/INDEPENDENT_CLIENT_REVIEW.md)、[独立admin](QA/INDEPENDENT_ADMIN_REVIEW.md)、[独立Worker](QA/INDEPENDENT_WORKER_REVIEW.md)。同意前localbackfill、GA再許可/初期pageview/UTM漏れ、管理日付400・320px overflow・exportの欠測説明、集計のcross-game/版/visit平均/落下損失/履歴境界/二乗計算を検出し、限定修正後に再検証。初回collectorの仮想pointer capture誤り・Viteclient script誤カウント・Wrangler出力prefixも元記録を保持しテスト側だけ修正。

- root単体・TypeScript・buildの最終結果はQA/VERIFICATION.json。
- Worker単体11件、型検査、実Wrangler/workerd＋local D1の12項目PASS：[実D1](../../analytics-worker/QA/LOCAL_D1.json)。合成ローカルデータのみ。
- Touch：PC/390/320/844横画面各27項目、全18route、3Godot iframe、019cancel/lostcapture/1release1jump、015DROP/左右、008左右解除。1/2/3秒fixture6件：[集計](QA/touch-summary.json)。
- compiled全18×4＋portal/retired/privacyの84ページPASS、通常mouse/key入力・ゲーム起動、pageerror0：[最終](QA/compiled-regression.json)。スマホのnative CDP hold/cancelは独立Touch検証で別に実施。
- 同意前通信/保存0、future-only、撤回/別タブabort、visit/page/RUN、019同RUNとsampling/continuation、50%1秒impression、設定keyboard分離、4画面バナーを模擬通信で実測。GAはvendor stubでありGoogle実通信の保証ではない。
- admin作者/独立PC390/320、実Worker handler+fakeDB CORS、実localD1合成summaryとのUI/export契約PASS。
- 保護78file差分0、015/019全sourcebyte不変、旧Godot本体不変、AdSense script exact、CREDIT OFF：[監査](QA/protected-scope.json)。

## 本番と残設定

Cloud runtimeでCloudflare token/DB binding/GA Measurement IDの準備なし。API許可も既存GitHub/site/OpenRouter中心。Worker本番未deploy、D1本番未作成/未migration、custom domain/admin secret未設定。GA adapterは完成、Measurement ID未設定。GitHub Variables一覧はintegration403で直接読めないため、公開bundle/通信の実測を公開QAで照合する。鍵の要求で作業を停止しない。

[一度きりの設定](MANUAL_SETUP.md)。Worker/D1のコード・実ローカル検証完成を本番収集開始へ読み替えない。Google/Cloudflare本番収集・cron・CF負荷、実機iPhoneのSafari callout/音/FPSは未確認。raw欠測・同意拒否・旧Godotの内部・page_exit欠測を推定しない。本人の015/019好評価を維持し、今回の自動操作を新たな人間合格にしない。

## 公開結果

**2026-10-06日本時間、正式HTTPSへ公開済み。** [サイト](https://game100garage.com/)・[PR #5](https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/pull/5)・[Pages実行](https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/actions/runs/37456340150)。runtime `4608ac86756bbc0866bbca5fec55f12ce5550e6f`。単体・build・deployすべて成功。

公開PC1365、phone390、narrow320、landscape844の4画面で、全18作品の開始と通常入力、portal18・010退役・privacyの計84経路、pageerror0を確認：[PUBLIC_REGRESSION](QA/PUBLIC_REGRESSION.json)。同意前/拒否時の外部解析通信0、許可でID作成、撤回でID/queue削除、privacy文字選択を確認：[PUBLIC_BROWSER](QA/PUBLIC_BROWSER.json)。自動ブラウザはqa扱いであり、本番同意処理は独立client試験でも別途検証。公開bundleとCI同条件のbuildは70配信fileのSHA-256が一致。旧engineバイナリの公開再ダウンロードは省略し、保護file監査とcompiled旧shell検証を併用した。

初回hash照合はローカルでVITE設定を省略し、CIでは空文字を渡していたため不一致：[原記録](QA/PUBLIC_BROWSER_INITIAL.json)。両変数を空文字にした同条件buildで70/70一致し、product修正なし。公開管理画面はHTTP200、noindex/nofollow、320px overflowなし、「Telemetry endpoint未設定」を正しく表示：[PUBLIC_ADMIN](QA/PUBLIC_ADMIN.json)。

公開の正本は[PUBLICATION](QA/PUBLICATION.json)。**サイト機能は公開済みだが、外部Telemetryはcode ready＋local D1検証済み、Cloudflare本番未deploy。GA4もMeasurement ID未設定・実送信未確認。** 本番D1/migration、endpoint/custom domain/admin secretは未設定。公開bundleも空の設定値と一致し、外部解析はinactive。
