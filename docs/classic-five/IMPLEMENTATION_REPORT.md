# 定番5作品バッチ — 実装・技術QA・試作公開

正本は[REQUEST](REQUEST.md)と[AMENDMENTS](AMENDMENTS.md)。開始mainは`af2edf70cdf8fe46175f4fcf38fec607dda997d0`、隔離worktree／branchは`codex/classic-five`。今回個別指示を共通旧仕様より優先し、制限時間・自動加速・宇宙／裏モード・職場ギミックを追加しなかった。作者本人未試遊の試作公開はユーザー承認済み。第6作には着手していない。

| 候補No. / Sheet | 公開ゲーム | 保持した基本ルールと補助機能 | runtime commit / Pages |
|---|---|---|---|
|28 / A29|[021 ならべて4つ](https://game100garage.com/game021.html)|7列6段・縦横斜め4連、CPU3難度・先後・端末2人、任意ヒント／待った|a4555f27d05accbfaa1ab8846609db480604d34e / [37644262587](https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/actions/runs/37644262587)|
|25 / A26|[022 ひと息ソリティア](https://game100garage.com/game022.html)|52枚Klondike、1枚／3枚めくり、random／JST daily、tap＋drag選択、戻す／ヒント／証明できる整理|cc7f8514ac9d2bce1af35c78cb7528d2dd4dd01d / [37649806664](https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/actions/runs/37649806664)|
|30 / A31|[023 伏字ことば](https://game100garage.com/game023.html)|独自180語／6カテゴリ、全かな3タブ、誤答8回、ヒント／次問、絞首刑画像なし|de5327d780bb783d2dc5402454f15b6ae91d3412 / [37651114868](https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/actions/runs/37651114868)|
|47 / A48|[024 ひとマススネーク](https://game100garage.com/game024.html)|20×20・長さ3、一定4／6／8Hz、入力queue2、逆走禁止、餌／成長／壁・自身体衝突／全面クリア|c7fde202b7df3ef0d33c4410835e4dcf7d49299c / [37653078771](https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/actions/runs/37653078771)|
|71 / A72|[025 こつこつマインスイーパー](https://game100garage.com/game025.html)|9×9／10・16×16／40、初手周囲安全、初級の推測不要証明、旗／周囲開封／見える情報だけのヒント|9e0249432688a3a5f8c03612993ef255d0c2e567 / [37655713679](https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/actions/runs/37655713679)|

各期待commitの公式Build and deploy arcadeがsuccessになってから、公開URLのPC／phone通常操作とPortal掲載／thumbnail配信SHA一致を確認し、該当Aセルのみ「済」へ更新・読戻し検証する。025のpushはGitHub内部エラーで2回拒否され、main不変を確認後に同じcommitの3回目送信が成功。認証設定や保護設定を迂回していない。公開証明／Sheet結果は各作品QA/PUBLICATION.jsonとQA/SHEET_UPDATE.jsonを正本とする。

## 技術検証と修正

最終root `npm run check`、**545テスト／56ファイル**、`npm run build`成功。Jev helperのオフライン25テストも成功。Workerの`npm --prefix analytics-worker run check`と実ローカルD1テスト成功（23イベント／7RUN、全5新作・既存019／020・ingest・admin／Codex・取得CLI・匿名集計の回帰）。旧ゲームの単体テストも全体実行に含む。

全5作品でcompiledと公開URLの1365×900、390×844、320×740、844×390を通常入力で確認。任意説明／練習、再挑戦、途中保存・明示再開、ミュート、Portal往復、入力cancelの範囲を各報告に記録。公開自動操作は同意拒否、webdriverのQA環境、Analytics／GA／広告のrequest遮断を使用し、本番利用実績へ架空RUNを送っていない。広告scriptの存在はPortalで確認し、広告表示／審査結果を検証済みとはしない。

021: CPU設定全6組、全列・キーボード選択、practice中断・保存RUN復元。022: 52枚／suffix／山札再循環／daily重複抑止／全消去fixture、touch implicit captureとOFF時pan競合を当ゲーム内で修正。023: 全かな／NFC／重複／wrong8、mixed入力と横向きresult scroll。024: 30／60／120Hzの一定速度、空くtail移動、入力queue、全面400、terminal backlog保存とPortal/pagehide復活を修正。025: 初級全81初手fallbackを公開数字だけの独立solverで証明、中級は初手安全を保証し全盤面推測不要とはしない。null observer保存、storage拒否時のmemory切替、生成中背景化、旧tapが新menuへ届くcompatibility clickを修正。スマホ44pxセルとnative pan4ケースを実測。fixtureと通常操作の区別は各実行JSONを参照。

VisualとGameplayの判断は別担当・別文書。5作品ともVisual83点、F13以上／H13、技術Gameplayの確認を実施。点数は実画像とコード／操作レビューの限定評価で、作者本人が面白さを確認した証拠ではない。headlessの自然な別タブfocus lossが生じずDOM blur fixtureを使った024や、blocked Worker／document.hiddenをfixtureとして与えた025は明示している。実機iPhone／Android、実際の指の感触、音声聴取、fun／継続率は未確認。

## 統合・保存・Analytics

最終active24／historical25、010退役を維持、次未使用026は未着手。Portal／catalog／既存tag／version／MPA route／新作profileに接続。新作だけのnamespaceとrules_version1／presentation_version prototype-1で保存し、各盤面と統計を検証して復元する。練習はBEST／通常統計／production RUNから分離。

共通TelemetryServiceへ任意remote flagと既存UUID復元を最小追加し、従来呼出のdefaultは維持。既存Analytics runtimeの同意・環境・認証を保持し、game-specific eventの安全なprimitiveを既存schemaで許可。旧numeric completedもbooleanも受ける。ゲームID登録はWorker受信／admin／Codex集計／取得CLI／exportまで021〜025を追加した。毎frame送信・地雷／隠れ札／単語正解・local resultId送信は追加していない。

**本番Worker登録deployは未完了。** 現環境の`wrangler whoami`が未認証なので停止し、login・新権限・secret・remote migrationを行っていない。[blocker](QA/WORKER_DEPLOY_BLOCKER.json)を保持。base時点のGame020本番登録とversion16ad6d54…は維持。021〜025は自ページとPortalのselected-game gateで外部送信を止め、未登録データを送らない。ゲーム公開と集計登録を別状態として報告する。一般の既存001〜020計測と同意UIは回帰テストで保持を確認。

## 権利・素材・保全

[限定調査](RIGHTS_NOTE.md)のURL／取得範囲を保持。旧案「のびのびスネーク」の既存作品内同名を回避してユーザー選択の「ひとマススネーク」を採用。その後の命名はユーザーに委任された。古典ルールを独自コード・盤面・色／形・かな問題・説明文・WebAudio音で表現し、他サイトの素材／コード／配置／音は転用しない。人物や画像生成は不要、外部画像／新規ライブラリなし。サムネイルは全5本とも本ゲームの通常実画面を比例crop／fitし、出典・SHA・変換をasset-indexと個別QAに記録。商標の網羅的調査や日本法の個別クリアランス、権利ゼロは保証しない。

元Game018未commit作業182file、020・AdSense worktreeのHEAD／branch／status／filehashを開始と終了で比較し保全。既存ゲーム001〜020の固有ソース／route／save／BEST、CREDIT OFF、AdSense／GA4／auth／WorkerD1設定・schema・Cronを変更しなかった。変更は新作5本、その統合・計測登録と証拠／引継ぎのみ。[最終保全・範囲監査](QA/FINAL_SCOPE_AND_PRESERVATION.json)を参照。

Jev実利用21件と評価・見逃し・証拠欠落・手順逸脱は[JEV_USAGE_REPORT](JEV_USAGE_REPORT.md)に整理。Jevを公開・面白さの代理判断にしなかった。継承は[HANDOFF](HANDOFF.md)から行う。
