# Game038「6万分の1」独立Visual / Feelレビュー

2026-10-21 UTC、担当 `/root/game015_ui_review`。**最終Visual gateは82/100、F12/15・H13/15でPASS。短い通常操作の範囲で体験の基本ループを確認。実iPhone・音・人間の面白さ／継続意欲は未評価。** 初回に発見したlandscapeの帰還リンク隠れは、親の限定CSS修正後に独立再確認した。

## 1. 対象と独立性

対象は `/workspace/arcade-game036-release` のGame036/038公開候補。`IMPLEMENTATION_SPEC.md`、`game.manifest.json`、HTML・CSS・mainを読んだ。名前と志望ジャンルを選び、ランダムな所属・本業・同期から始まり、月ごとの重点・決断・方向性変化と活動記録を体験の中心として評価した。

レビュアーの書込みは本書と `QA/independent-review/` のみ。製品・Git・API・有料サービス・公開を操作していない。各RUNで親からブラウザ枠を受領し、固定compiled `http://127.0.0.1:4981/game038.html` を使用、終了後に全context/browserをcloseして枠を返した。

最終読取りhash（実行前後一致）：

|ファイル|SHA256|
|---|---|
|main.ts|`73838911f69d85c8b47bfc9009e076bac793e757718cd7e8bb5d041a266a5dde`|
|style.css（修正後）|`d791ffb76fc9bdcb2b9cbc311f31b511feb3792f174694d6493407212762b8ad`|
|save.ts（親の保存修正後）|`f426dfa76a5f07b432223f093d46153cd8782bf6559759d18aa245cd9f5de8ab`|
|model.ts|`1ac2b238876480ba514bd56a725f5fe3a91178963a1a07967d6e1aa2dc15f96c`|
|game038.html|`6bb4eccceea718784152db251309bc3685f0b058e374f339e79766536898c9dd`|

初回styleは `34de89b4f3b8890cee5d7cb7144cadb3fc0b67225b18dbe41a6453d033f32de4`。初回原本を消さず、修正後は別directoryへ保存した。登録数などの共有統合作業をGame038の新しいVisual得点へ加算していない。

## 2. 自身の通常操作と保存した根拠

|実行|対象・内容|結果／原本|
|---|---|---|
|初回|844×390／1440×900／390×844／320×568。title→半年練習→本番名前「星の観測者」・ゲーム志望→2決断→3～4ヶ月目。|[script](QA/independent-review/run.mjs)／[results](QA/independent-review/results.json)。JS例外0。landscape V038-01を発見。|
|修正後|同4幅。title設定実tap／名前Enterでデビュー／最初の決断／2ヶ月目のひとこと／速度stopしてpause。|[script](QA/independent-review/run-final.mjs)／[results](QA/independent-review/final/results.json)。全4幅で設定・2決断・pause成功、JS例外0。|
|帰還待ち補完|同4幅でtitle dialog内帰還、pause dialog内帰還、別再訪でheader帰還を区別。|[script](QA/independent-review/navigation-wait.mjs)／[results](QA/independent-review/navigation-wait/results.json)。**12経路すべて実index.html到着**、JS例外0。|

新規context、初期Analytics同意denied。base originのGET/HEADだけ許可し、その他をすべてabort。モデル・時刻・名前以外の状態・得点を注入しない。修正後の外部GET試行3件（portal到着時のAdSense）は全遮断、非GET試行0。広告クリック・記録投稿・本番Telemetry送信なし。

### collector不足と製品findingを分離

初回の844／1440／390ではmotion採取中に次の決断が自動到来し、pause buttonがdisabled、decideには#menu-portalが未生成という状態でcollectorが狙ってtimeoutした。製品のpause／帰還障害ではない。修正後は速度を止めてからpauseを採取した。

修正後collectorもmobileでtap直後にURLを読むと旧game038.htmlが返り、帰還をfalseとしていた。補完RUNでは`waitForURL`を使い、全12件で到着を確認。mobileは「直後は旧URL、待機後index.html」がrawに残る。原本を改ざんして全PASSへ差し替えず、待ち不足を明示して補完した。

## 3. V038-01：landscapeの重なり → 限定修正後確認

初回844×390 title：menu y26.97～363.03、header y0～52、解析host y326～390。menu内帰還はy302.03～346.03（44px高）で下約20pxがbarへ入った。[初回実画像](QA/independent-review/844x390-title.png)を実viewして親へ即報告した。レビュアー自身はCSSを変更していない。

親はlandscapeだけをheader52／footer64を予約する式へ変更。修正後の独立測定：

- menu y60～318、高さ258、header下端52とhost上端326に各8pxの間隔。
- title menuのclientHeight256／scrollHeight334。最初はmenu内帰還がscroll先にあるが、内scrollTop78で帰還rect y257.06～301.06となり、**44px全体がdialogの中**へ入る。
- [scroll後の実画像](QA/independent-review/final/844x390-title-scrolled-return.png)で帰還と解析barを別々に識別し、実tap→index.htmlへ到達。
- titleから解析設定を実tapし、panelを閉じる操作も4幅成功。
- 長いデビュー説明は内側scrollで開始buttonへ到達。開始と2決断後、停止を確定したpauseからのmenu帰還、header帰還も4幅成功。

短い横画面で全dialog本文を一度に表示する方式ではなく、**header／barを覆わず内側をscrollする方式**。scrollした画像で見出しが上へ隠れることを、データ欠落やviewport clipと混同しない。debut時は長いplayページの解析host自体が文書下へ移るため、titleと同じ固定bar重複条件ではない。実Safariのバー・keyboard表示時は未確認。

## 4. 実viewした最終画像

自分の新規RUN由来：

- [1440通常play](QA/independent-review/final/1440x900-play-stopped.png)。
- [390 setup](QA/independent-review/final/390x844-setup.png)／[390 decision](QA/independent-review/final/390x844-decision.png)。
- [320 title内scroll](QA/independent-review/final/320x568-title-scrolled-return.png)／[320 pause](QA/independent-review/final/320x568-pause.png)。
- [844 title内scroll](QA/independent-review/final/844x390-title-scrolled-return.png)／[844 debut](QA/independent-review/final/844x390-debut.png)。

初回の1440 motion0、390 debut／normal decision、320 title／question、844 title／debutも実viewし比較した。加えて親の[390自然結果](QA/compiled-20261022/390-result.png)と `public/assets/portal/game038.webp` を実view。後者は自身の1440通常プレイのprofile／状態／重点をcropした画面で、別のVTuber絵や豪華な画面を創作したものではない。親の自然結果を自身が全キャリア完走した実績へ読み替えない。

## 5. Visual / Feel所見

### Identityと情報

purpleの夜画面にpink／blue／yellowの差し色、名前先頭文字の色付きavatar、ジャンルemoji、状態bar、月ごとのmap、同期と記録が一貫する。実VTuber画像や人物を描かず、ひとりの活動履歴を読むシミュレーションとして成立する画面。avatarは単純な文字入り円で、キャラクターアートの豊かさは限定されるが、名前・色・ジャンルをprofile／debut／記録へつなぐ識別子になっている。

PCはプロフィール／状態と重点／mapと同期の3列＋下の記録。phoneは1列でscrollし、decisionを大きいbuttonと短いhintで示す。情報量は多いが見出し・card・数字・強い選択色で区別できる。phoneでmap／記録を読むときは上へ戻らないと速度操作が見えなくなるため、時間停止を使う理解と実機scrollの快適性は人間確認が望ましい。今回これを重大障害とする根拠はない。

### 最初の操作と判断

名前の自由入力、ゲーム志望を選んだ強調、Enterデビュー、ランダムな所属・本業・同期を確認して開始する導線を実操作した。志望と現在方向性が別欄にあり、目標どおりになるとは限らないという説明と整合する。

最初の配信の選択、2ヶ月目のひとことを実入力し、直後の記録へ反映される仕組みを確認。速度「次の決断まで」は短く進め、decisionでは読む時間を確保する。停止→1×→pauseと使い分けられ、同じtapが直後のdecisionへ持ち越されないための450ms guardもコードとcollector待機で区別した。

各重点に短い利益／負担hintがあり、状態barと登録者・金銭・順位を見ながら判断する理由はある。これを人間が「面白い」「再訪したい」と評価したという意味ではない。ジャンルdriftや終了理由の幅広さを、自身の短いRUNだけで体験済みとはしない。

### Actual motion

初回の通常RUNで約0.5秒間隔の4フレームを採り、3ヶ月目→4ヶ月目、登録者・mapの色・記録の更新を観察した。例：390では登録者21→22、844では20,787→21,040。これは内部state／時刻の注入ではなく通常速度buttonと時間進行による変化。

主な演出はstatus barの変化、月のmap塗り、記録の追加、decisionへの切替であり、アクションの滑らかさや派手なavatar animationではない。短いmotionは情報更新を読み分けられ、判断待ちでは進行が止まる。実GPUのFPS・音の同期・人間の反応負担は未測定。

## 6. 最終rubric

AGENTS／GAME_DEVELOPMENT_RULES／既存Visual rubricの80/100・F/H各12以上を用いる。自分の実画像と短いactual motionを根拠にする。

|項目|上限|得点|根拠・留保|
|---|---:|---:|---|
|A Visual identity|15|13|夜配信を連想する色、名前avatar、ジャンル、活動地図と履歴の一貫性。|
|B Character/object appeal|15|12|色付き文字avatarとジャンルemojiが識別子になる。人物絵・身体motionの評価ではない。|
|C Background quality|10|8|暗いgradientとcardの分離が情報読解を支える。不要な装飾で文字を覆わない。|
|D UI integration|10|9|setup／debut／play／decision／pause／活動記録で同じ情報と強調を維持。|
|E Composition|10|8|PC3列／phone1列、短横dialogの予約領域と内scroll。長いphoneページの操作負担は留保。|
|F Gameplay readability|15|12|数字・状態・判断button・hintが読め、修正後に帰還44pxと設定を確認。小さな補足・実機keyboard／safe-areaは未確認。|
|G Motion/effects|10|7|通常RUNの月更新、bar／map／logとdecision切替を実観察。音・FPS・長時間のテンポを加点しない。|
|H Production value|15|13|設定・名前Enter・決断・明示pause・3種帰還を4幅で確認、保存の終了経路は親の別QA。人間受入とは別。|
|**合計**|**100**|**82**|**F12／H13、今回のVisual gate PASS。**|

Feelは「基本ループと入力・判断・停止・帰還が短い通常操作で成立」という技術的判定。作者の面白さ・実機快適性・継続意欲は未評価で、数値化や合格認定をしない。

## 7. 検証の限界と公開判断

- 自身は4ヶ月程度の本番と半年練習を実行。自然な全キャリア終了・終了直前reload・結果確定1回・履歴保存・copyは親のcompiled4幅fullflow／保存テストの担当範囲。自分の独立成功数へ加算しない。
- 親は036 compiled12、portal73、038 fullflow4を成功と報告。local-smokeのportal4は当初lazy画像のdecode待ち不足で失敗したが、親からscroll／decode待ちを加えた限定再検証4件も成功と最終連絡を受領した。初期失敗と補完を分け、製品を修正して通したとは表現しない。
- 実iPhone／Android、仮想keyboardでのviewport変化、聴覚・色覚、screen reader、長時間疲労、最高順位分布の現実性は未評価。分布はゲーム上の仮定であり実統計としない。
- 作者由来の画像だけで新評価を確定せず、自身のcompiled通常操作・最終画像で採点した。AdSense合否や人間の面白さを予測しない。
- 同時Pages公開のユーザー承認の確認・push／merge／deployは親の担当。このVisualレビューはそれらの実行記録ではない。

独立RUN終了後、全context／browserをcloseし、親へ枠を返却済み。製品変更は行っていない。
