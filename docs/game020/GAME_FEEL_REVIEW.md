# Game020 独立 Gameplay / Feel review

2026-10-07 UTC、`pair020_review`。実装担当とは別の reviewer がコードと通常ブラウザ操作を確認した。Jev回答・ログは読んでいない。これはAIによる操作成立・設計評価であり、本人の楽しさ・長期継続・実機評価ではない。作者未プレイでも公開する今回のユーザー承認を、人間が面白いと評価した記録へ読み替えない。

基準commit `fd1d09a293cd8da1b9dbfeb73dc3e68e27ad7bcc`、branch `codex/game020-pair-tile`。対象5fileの開始・終了SHA256と凍結一致は [browser.json](QA/independent/browser.json)。指示の実読込と、初回時刻が取得できない境界は [read record](QA/independent-instruction-reads.jsonl)。

## 実操作

Chromium `/usr/bin/chromium`、Vite `127.0.0.1:5420`。1365×900 PC／390×844 touch／320×740 touch／844×390 touchを個別contextで操作。解析同意をdeniedに設定し、localhost以外の通信を遮断。24枚の全消去は各画面でヒントの実UIを読み、通常クリック／タップで達成した。正解fixtureへの状態書換えはしていない。PCはEnter→矢印→Spaceも操作した。

各画面で選択、同柄2枚除去、1手戻す、並べ替え、休憩→復帰、次の盤面確認→取消、48枚盤面表示、8枚練習の全消去を確認。練習前後のBESTとクリア数は不変。pageerror 0、対象ソースは全工程中凍結一致。詳細は [browser evidence](QA/independent/browser.json)。

## 設計評価

- 上が塞がれておらず左右の片側が空いた牌だけを選べる。形＋内部模様が一致する2枚を除去する古典構造を維持し、色だけの判別を要求しない。
- 小さい24枚と48枚だけに留め、期限・ミス罰・宇宙／裏モードを追加していない。詰まっても終了させず、戻す／解ける並べ替えで継続する。全消去後は自分で次の盤面を選ぶ。
- 4枚ずつある同柄からどの2枚を取るかで露出する牌が変わり、単に色を探す以上の選択が成立する。任意ヒントは完全な残り経路の検証を優先する。探索予算切れを解けた証明にしていない。
- 難しさの感覚、長く遊びたいか、飽きにくさは人間未確認。短い自動操作でその価値を断定しない。
- 途中盤面はreloadで保存復帰せず、BEST・クリア数・盤面種・muteだけを保存する。タイトルがその境界を説明する。既存ゲームの保存キーは変更しない。

## 独立モデル確認

[initial generator source](QA/generation-initial/PairBoard.ts.txt) のsmall seed14／regular seed1の例外を独立に再現。元実装は任意の自由牌2枚除去が常に最後まで成立すると誤って仮定していた。残りが上下依存すると1枚だけ自由になり、初期盤面constructorが例外を投げる。独立判断はPRODUCT_BUG、追加調査／修正必要、まずコード確認、未解決で公開すると開始不能の重大リスクあり。

現在の生成は失敗経路を却下するbounded retryと、各行の偶数性を維持するfallbackを使う。別seed範囲23100〜24099について、24枚／48枚各1000盤面の返却witnessを1組ずつ検証し、全2000が合法な同柄・自由牌の全消去を満たした。一般的な任意Mahjong配置すべてを保証したのではなく、本作の元配置と返却witnessに対する確認。元例外・独立判断・現在の検証は [model.json](QA/independent/model.json)。

## 判定と限界

本ユーザー要件に対するゲーム操作／古典ルール／落ち着いた継続設計はAI review PASS。Jev、build成功、Visual点を面白さの代行にしない。実機iOS／Android、音の聴感、アクセシビリティの全認証、長期の本人試遊は未実施。追加の中央管理機能・次候補の実装はしていない。

## 最終main修正への再確認

初回独立RUNは通常盤面と練習を対象とし、開いたmodalからのPortal帰還と、short landscapeで離れた牌まで矢印を反復する確認は含めていなかった。その2つは後のroot QAで観測された実問題であり、初回reviewが発見していたとは記録しない。

旧mainのnative modalには帰還linkがなく、背景header linkはinertとなる。旧矢印handlerは`focus({preventScroll:true})`で画面外にもfocusを送っていた。保存された[旧main](QA/modal-return-main-before.ts.txt)と実測観測を独立に照合した。どちらもPRODUCT_BUG、追加調査／修正必要、重要な帰還／keyboard操作を未解決で公開するリスクありと判断した。Jev回答は見ていない。

修正後main SHA256 `baf7a8690810fc5ad3a3dee95679b01d5f736118d079599937720aa7a1d47612`を再び凍結。390pxのtitle／explanation／pause／confirm／result各modal内のlinkを通常tapし、5つすべてPortalの`index.html`へ到達。844×390・48枚盤面でArrowRightを2回操作するとtile20へ移り、scrollY516、target top161／bottom229／viewport390となりfocusが見える。pageerror 0、開始・終了main hash一致。[再確認](QA/independent/corrections.json)／[盲検独立判断](QA/independent/correction-judgments.json)。

追加のphone48枚全消去、blocked tileの座標native touch、異柄選択、BEST24／クリア1／regularのreload復元は[followup](QA/independent/followup.json)。最初のblocked tile locator.tapはaria-disabledによるPlaywright actionability timeoutで進まなかった[原本](QA/independent/followup-initial-failure.json)。HTMLdisabledではない実ボタンへの通常座標tapでは48枚のまま、selected=null。テストdriverの問題と製品の無効入力仕様を分けた。muteの聴感・実機試遊は未確認のまま。

## 初回同意UIと最終dialog方式の追加確認

初回unknown consent／保存拒否contextは初回独立reviewに含めていなかった。root QAで`showModal()`のtop layerが、変更していない共有Shadow DOMの解析同意panelを操作不能にする問題を観測した。ブラウザのtop layer／document inertと、共有panelの通常z-index10000との違いを旧コードで独立確認。PRODUCT_BUG、追加調査／修正必要、重要な拒否／保留操作を未解決で公開するリスクありと判断した。実送信判断やJev回答を読んだ評価ではない。[独立判断](QA/independent/consent-judgment.json)。

Game020内のnonmodal `dialog.show()`と固定中央CSSへの限定変更後、次のSHA256を凍結して再操作した。

- main：`d4e0b153fe66e2163e065fc0e46e93d932a6de9a3ccc8427cf602e49b4c0584d`
- style：`9afb04f3f67bc816c3d9e77d80cbe4026f21c446e7b16aefaefc1e1e7039ecb5`

PC1365×900／phone390×844各3contextの初回unknownで「許可する／許可しない／今は選ばず閉じる」を通常click／tap。6択すべてpanelが閉じ、title／残り24／BEST0／クリア0を維持した。拒否と許可はそれぞれconsent stateだけを更新し、保留は未設定のまま。localhost以外の通信を全遮断し、本番APIには接続していない。

PC／phoneでtitleとpauseの背景牌がSpace／Enterに反応しないこと、Escでpause→復帰、help→復帰、resultのSpace／Enterでクリア数を重複加算しないこと、resultのPortal linkで正常帰還を確認。24枚全消去も再操作。保存get/setがthrowする第7contextで初回拒否→24枚プレイが成立。pageerror 0、main／styleの開始・終了hash一致。[consent.json](QA/independent/consent.json)。

背景の盤面はstate・`inert`・control disabledで隔離し、同意panelをブラウザtop layerへ移す変更はしていない。休憩中の牌数／BEST／クリア数は実確認した。active timeの休憩除外はコード観察であり、今回の追加RUNでTelemetry秒数を独立に実測したとは記録しない。人間の音聴感・実機・長期継続の未実施は維持する。

## 公開版のresize直後Spaceと配信比較の独立確認

公開runtime `9e3c66de26d017bd85177e4cdffdf1e444292461`について、rootの最初のdesktop probeでresize往復直後のSpace選択が一度期待と異なった。独立reviewerは同意deniedの新contextで、site以外の通信を遮断し、通常Space／Enter、resize event、focus、牌DOMの置換をread-only traceした。trace用window log以外にゲーム状態を書き換えていない。

最初の50回はfocusとSpaceの間にtrace取得のCDP呼出を入れていたため全成功だったが、そのroundtripが待ちを加えることを認識し、[初回記録](QA/independent/public-check-instrumented.json)を保持したまま、critical sequenceにその呼出を入れない別RUNへ進めた。

[最終trace](QA/independent/public-check.json)では、即入力20回中2回を再現。どちらもSpace keydown→resize→focusout→牌DOM置換→新しい同ID牌へfocus→Space keyupとなり、native clickが発生しない。remainingは48、pageerrorは0。resizeの2RAF安定後20回と、通常Enter／Space各5回は全成功。同じ公開artifactのままなので、常時入力不能や公開版だけのソース差を示していない。元の最初の1回にはtraceがないため、過去その瞬間を測定できたとはしない。

独立判断はTEST_INFRA_BUG、追加の検証／driver修正必要、最初の証拠AUTOMATED_TEST、未解決の重大release riskなし。viewport応答直後もresize eventは未処理になり得るため、安定前のキー入力はnative activation途中で対象DOMを失う。ゲームの入力や基礎ルールを変える必要はないと判断した。これはJev回答や公開成功だけからの推定ではなく、2件の再現traceによる限定診断。[独立判断](QA/independent/public-judgments.json)。

公開asset名が初回のdefault-empty local distと異なった件は、既存Pages workflowの公開環境変数注入と`src/analytics/config.ts`のimport.meta.env取得を独立に確認。runtimeの内容hashが変わるとimportするbundle名も連鎖して変わる。rootの既存public非Secret環境を再現したbuild比較は[35asset exact hash PASS](QA/public-assets-final/report.json)。これをSecret・本番API・設定変更の実施と混同しない。独立判断は比較基準のTEST_INFRA_BUG、追加コード／設定確認必要、重大な配信riskなし。prodWorker deploy、D1、Analytics APIアクセスはこのreviewでは行っていない。
