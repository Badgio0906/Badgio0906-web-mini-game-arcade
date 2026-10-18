# Game037 正式採用・統合準備 — 2026-10-18 JST

ユーザーの明示指定により正式採用。完成版宣言とは区別し、カタログのdevelopmentStatusはtrialを維持する。採用基準はPR #9最終先端`6123b39ba724e0603c91429a29e1569e8961c4a1`、製品検証基準`4057766503f9051a9b5a0ba6c2a99d9ee648e48c`。既存[独立レビュー](INDEPENDENT_REVIEW.md)の技術評価を継承し、今回の統合候補を別に検証する。PR #9/そのmain/Pagesは変更しない。

## 差分と接続

基準main`9e96d557779c5de099fe54c51731ceb131e591a1`からのPR差分92ファイルは割当allowed paths内。一時的な`tests/unit/game037-codex-verify.test.ts`は削除済み。恒久unitにbrowser subprocessを残していない。

今回許可された共有更新は`src/data/gameCatalog.ts`（037のroute/title/タグ/難度、003完成指定）、`vite.config.ts`（037のみ入力追加）、`index.html`（28件meta/fallback）、`src/portal/main.ts`（037カードのみ外部計測イベントを発生させない。既存Analyticsコード/許可先は不変）、正式thumbnail/台帳、ローカルBESTのみのrecord定義/読取、生成Jev catalog（ローカルJSONのみ）、関連する登録数/番号穴/完成指定のunit期待値、CURRENT_STATUS。036のPR #8は取り込まず、安定IDの穴を保持する。新active28/complete10/hidden4/retired4/historical36、表示001〜028。037は表示028/内部037。

037の保存は既存固有2キーのまま。オンラインBEST/Analytics/広告/CREDITの接続は今回行わず、本番サービスは変更しない。037の既存BEST JSONを一覧から読取る定義だけを追加（publicEnabled=false、0〜6000）し、TOP10/外部POSTを有効化しない。帰還リンクは既存共通ヘッダーを維持する。

## 検証

実行結果はQA/local-adoption/へ追記。過去の失敗・独立レビュー・画像は上書きしない。今回のhuman/物理スマホ/Safari/実音/実FPSは未実施。

## 費用・公開

対象はPUBLIC、標準ubuntu-latestのみ、pushはmainにPages build/deploy、PRはvalidateにnpm cache。再利用workflow/matrix/workflow_runなし。今回の作業branch単独pushは既知workflowに非該当。Webhook APIが403のため外部連動・追加費用条件はUNKNOWN。無料と断言せず、push/PR作成/CI起動/merge/deployは保留。必要な情報はWebhook・GitHub Appsの外部build/deploy設定と、保存量/各契約の課金条件。workflow・予算・runner設定は変更しない。

初回local全体unitは5件失敗（生成catalog未更新と037未接続record定義）。続く検査は1件失敗（新規テストが既存default-open登録helperをfalseと誤認）。原logはQA/local-adoptionへ保持。外部送信はrecordのpublicEnabled=falseと037カードのイベント未発火で閉じ、既存登録helperやAnalyticsファイルを変更しない。

今回の全体型検査・1110tests/105files成功。その後に独立reviewで見つかった037BESTの32byte制限整合をRED→GREEN（対象7件）で修正し、型検査を含むbuild成功。browser・一覧実導線は次の固定commitで検査して追補する。

## 固定候補cab8befのブラウザ結果

`GAME037_REPORT=docs/game037/QA/local-adoption/browser node tests/game037/browser.mjs`は575/575成功（mouse/touch/keyboard、4幅、保存拒否）。統合版の`node tests/game037/adoption-browser.mjs`は4幅36checks成功（28card、003完成ラベル、037BEST5558、TOP10無し、実thumb、PLAYで037到着、一覧帰還、横overflow無し、pageerror/POST0、source不変）。既存indexのAdSensescript読取試行8件はブラウザrouteで外部通信前に遮断した。既存タグそのものは変更していない。新しい037ゲーム/カードの外部送信を有効化していない。

初回一覧probeはlazy画像のdecode待ち不足で1assert失敗。次は既存広告scriptまで0外部と期待して末尾assert失敗（導線checksは成功）。元結果はportal/とportal-image-wait/へ保持、collectorだけを修正しportal-baseline-ad/で既存baselineタグに限定して成功。製品コードをこれらの失敗で変更していない。共通fontで「詰」はsubset外でsystem fallbackを使用（文字列/実画面を確認）、既存font/OFLは変更なし。

[今回の独立source監査](ADOPTION_INDEPENDENT_REVIEW.md)はPASS。人間の楽しさ、物理端末、実音、Safari、実FPSは未実施。GitHub CIは今回は起動せず、過去PRのCI結果とローカル結果を区別する。main統合とPages公開は未実施。mainへ反映すると既存Pagesworkflowが公開を起動するため、将来の反映は公開可否も含めて別判断が必要。
