# Game036「もちっと連鎖 ～MOCHI DROP～」公開準備（2026-10-21 JST）

**2026-10-21時点の準備履歴。2026-10-22のユーザー明示承認により、Game038と同時公開の工程へ移行。最新状態は [同時公開報告](../game038/PUBLICATION_20261022.md) を参照。**

以下は費用確認で停止した当時の記録であり、現在の承認待ちを意味しない。 ユーザーからサイト公開の指示は受領したが、以前の「追加費用の必要条件が不明ならpush前に停止」の指定が継続している。今回のWebhook一覧・課金使用量APIも403のため、今回分の費用不明点の判断を待つ。過去のPR14/15/13限定了承を流用しない。

## 採用元と安全性

- main：`ac5304fa81361f592942c472c7fa04f668d3b4bc`。PR14/15公開済み状態を基準とする。
- [Draft PR16](https://github.com/Badgio0906/Badgio0906-web-mini-game-arcade/pull/16)：`claude/game036-mochi-drop`、受領HEAD `9560283ce9b6a39f30263cbdbbdd625c90dd2441`。元差分はゲーム固有24ファイルで、Catalog等は未登録だった。元HEADのPR CIは成功、**今回の統合候補のCIは未実施**。
- 独立worktree `/workspace/arcade-game036-release`、ローカルbranch `release/game036-mochi-drop-20261021`。元branch、旧worktreeと他タスクのcommit/dirty状態は破棄しない。force push/reset/cleanなし。
- 作者指定により正式IDをgame036と確定。過去PR8の未採用pilotは取り込まない。PR9の037候補・PR11/13は未変更・未統合で、次のcatalog ID37は既存候補の予約と混同しない。

## サイト統合

- 新作を**試遊版**としてCatalogに追加。公開候補27作品、完成9/試遊18、表示番号**027**、内部ID036・releaseOrder36。既存表示001〜026と完成指定9作品を維持。
- ViteはCatalogのpublicationStateからgame036.htmlを正式build対象へ含める。Vite自体の設定は変更しない。
- `index.html` のmeta/fallback件数を27へ同期。既存タグ「パズル・落下・チル・スコアアタック」を再利用。
- 個人BESTをゲームの専用saveから**完了RUNのmetadataだけ**読み取る。未完の最初のRUNは記録なし、正当な完了0点は0点。既存ゲームのadapter/定義/versionsは新登録部分を除き旧bytesを保護。
- 036のrecord定義はpublicEnabled=false。全体比較/TOP10/投稿は未接続、UIは「全体比較なし」。Analyticsもpending gate＋ゲーム自身のremoteCollectionEnabled=falseで閉じる。Worker/D1の登録・migration/deploy・本番データ変更なし。
- 正式640×360 WebPサムネイルを実際の通常プレイ画像からcrop/resize/paddingのみで作成。原本・crop・hashを`assets/portal/thumbnails/asset-index.json`へ記録。架空のゲーム画面・画像生成・外部画像なし。
- ローカルJev profile/catalog metadataを選択生成（APIなし）。選択IDの出力時に他のretired profileを動かさないようhelperを限定し、既存profileは元path/bytesで保持した。

## 公開前に修正した問題

[独立コードレビュー](INDEPENDENT_CODE_REVIEW.md)に元候補のhash・REDと修正追補を保存。

1. 不正な未完snapshotで妥当なBEST/最大連鎖/回数まで0へ戻る経路を修正。同ゲーム/同rulesで妥当な確定metadataだけを回復し、不正進行・run IDは破棄する。他作品や不正metadataは受理しない。
2. 落下組の相方セルのbounds/既存もちとの衝突検査を追加。旧候補では78セルの盤面を79へ拡張できた。正常な回転snapshotは受理し、ゲームルールは変更しない。
3. 左/回転などのpadにfocusしてSpace/Enterを押すと一律hard dropになる不一致を修正。各button固有のnative activationへ委ね、盤面focusのSpace/Enterは従来のhard dropを維持。
4. 画像/DOM確認でportrait盤面左寄りとbodyの16〜33px overflowを確認。portrait中央配置、mobileで重複するbrand footerだけを省略、余白とcanvas高さ予算を調整した。**解析設定・privacyの64px領域は維持**。旧状態でもscroll後に設定は開けたため「永久に操作不能だった」とは扱わない。

通常モデルは変更していない。独立30seed/1575配置でpreviewと実解決の一致を確認した。こんぺいとうは32個に到達すると単一chargeを得てゲージ0に戻す現行仕様であり、超過分の剰余繰越へ変更していない。

## 検証結果

|項目|結果・境界|
|---|---|
|npm run check|成功|
|npm test -- --maxWorkers=1 --minWorkers=1|**103ファイル・994件成功**。テストの時間制限を変更していない|
|npm run build|通常設定成功。さらにPagesと同じVITE_RECORDS_ENDPOINT=https://analytics.game100garage.comの設定で成功。既存public CSS/chunk警告は保持|
|offline Jev helper|25件成功。Jev/OpenRouter等の有料APIは呼んでいない|
|DEV通常入力|4画面で練習2連鎖、本番の自然な終了/retry、pause/reload/resumeを確認（mobile配置修正前）|
|compiled本番設定|**12/12成功**：7サイズ、練習/keyboard/save/result/portal、初回許可/拒否/後で/privacy。DEV model hookがbuildにないことも確認|
|個人BEST|通常入力の自然な0点と40点を別RUNで確認し、一覧表示/reload一致。練習はBEST/runsに入らない。個人記録の実本人データを変更していない|
|Portal回帰|4幅・**73チェック成功**。27掲載、完成9、trial18、OR/AND・favorite・旧BEST・広告tag・about/privacy/adsを確認。外部record GETは匿名ローカルfixture|
|HTTP/dist|036・管理/案内ページ200、削除026/028/029/030と保留031は404、retired4は案内200、ads指定行、全public→distのbytes一致|
|保護|既存ゲームsource全件・Worker/D1・広告/CMP/同意処理・RecordSharing・既存Godot・Vite/depsの空差分、旧thumbnail台帳項目の完全一致|
|独立レビュー|コード3件修正済み、重大未解決要求なし。実画像＋通常2連鎖motionでVisual **84/100、F12/H13 PASS**。音/実機/人間爽快感は別|
|実機/主観|**実iPhone Safari、Windows実GPU、聴感、作者の面白さ/快適性は未実施**。試遊版を完成版へ認定しない|

[最終コマンド](QA/codex-final/COMMANDS.json)、[本番設定build](QA/codex-final/BUILD_PRODUCTION_CONFIG.json)、[最終12ケース](QA/codex-production-config/RESULTS.json)、[Portal](QA/codex-portal-final/portal.json)、[source/範囲/hash](QA/codex-final/SOURCE_AND_SCOPE.json)、[HTTP/dist](QA/codex-final/HTTP_AND_DIST.json)。ブラウザは新規隔離contextだけを使用し、外部通信をblock/mockして本番Telemetry/記録投稿/実広告クリックを行っていない。初回同意の許可/拒否はローカルfixtureで、実際の利用者の同意を書き換えない。

### 表示寸法（本番設定compiled、CSS px）

全ケースで横overflowなし、document高はviewportと一致し、5操作buttonは44×44以上、解析設定buttonも画面内に全体表示・実click可能。

|viewport|盤面外枠 幅×高さ|document高|設定button下端|
|---|---|---|---|
|390x844|260.16×533.31|844|834|
|375x667|175.19×356.30|667|657|
|320x568|127.67×257.31|568|558|
|844x390|139.19×281.30|390|380|
|932x430|158.39×321.31|430|420|
|667x375|132.00×266.33|375|365|
|1440x900|300.00×612.00|900|890|

### 実画像

[390縦](QA/codex-production-config/390x844-play.png)／[320縦](QA/codex-production-config/320x568-play.png)／[844横](QA/codex-production-config/844x390-play.png)／[667横](QA/codex-production-config/667x375-play.png)／[PC](QA/codex-production-config/1440x900-play.png)。[実練習フレーム](QA/codex-compiled-flow/actual-practice-frame.png)／[自然な40点結果](QA/codex-compiled-flow/actual-result.png)。[独立Visual/motion](INDEPENDENT_VISUAL_REVIEW.md)は実画像と通常操作の範囲で判断し、人間の面白さ・聴感・Safari互換性を代行しない。

### 初回失敗の区別

- saveの追加RED2件は製品不具合で、元ログと修正後14モデルtestを保存。
- sparse checkoutで既存032のasset JSONと006のbaseline modelが欠けた検証環境不備を、Gitの元ファイルをmaterializeして解消。
- 初回fullは7 assertion FAIL＋1 suite未読込。catalog件数・次IDとローカルexportが旧26/35のままだったため、27/36/次37へ同期。既存ゲームの動作ロジックに対するFAILではない。修正後は994件成功。
- 初回browserの練習statusには表示されない文言を待ったselectorと、許可buttonのID allow→実際grantの取り違えをcollector側で修正。旧trial17の期待も18へ更新。製品を変えず対象だけを再確認し、その後、本番設定buildで12ケース全件とPortal73を再検証。失敗の原本は別QA directoryに保持。Git保存用logは末尾空行のみ正規化し、raw版を今回のローカルauditへ保持。

## 公開待ちと費用確認

PUBLICと全jobの標準ubuntu-latest、既存2 workflow（PR検証、mainのPages build/deploy）を実際に読んだ。再利用workflow・matrix・有料Runner・Worker/外部deploy・有料API呼出し・Packages/LFS publishは今回の経路にない。しかしWebhook一覧とbilling usageが403で、外部連動処理とartifact/cacheの追加保存容量課金はUNKNOWN。課金プラン・予算・runner・workflowを変更していない。

**必要な判断：今回の不明点を了承してPR16更新push・自動PR検証・main統合・Pages公開を進めるか。** 公開自体の承認は受領済みで、費用不明点の了承だけが不足している。commitはローカル保存でありGitHubへのバックアップではない。

了承後の手順：

1. 最新mainとPR16先端を再取得し、main ac5304f/元PR169560283から未知の変更がないか照合。未知の変更があれば上書きせず再評価。
2. この候補のcommitを既存PR16 branchへ通常push（force禁止）、PR本文・タイトル・HANDOFFを統合済み方針へ更新。自動PR CI初回を確認し、無条件に再実行しない。
3. 成功・競合なし・差分一致を確認してReady→通常merge。Pages既存build/deployの成功を確認。
4. `https://game100garage.com/game036.html` とトップの027を実取得し、対応JS/CSS/WebP、通常入力・練習/結果/retry/一覧・同意導線を確認。外部送信・広告クリック・実利用者データ変更を避ける。
5. main SHA/Pages URL/本番結果を追記し、作者へ報告。AdSense再申請は行わない。

## 再現

当該branchで依存を準備後check/test/build。compiledは`python3 tests/catalog-quality/serve.py --directory dist --port 4981`を別terminalで起動し、`GAME036_BASE=http://127.0.0.1:4981 GAME036_REPORT=<新しい出力先> node tests/game036/integration-browser.mjs`。`GAME036_SECTION=layout|flow|consent`で限定検証できる。既存QAを上書きしない。固定候補の通常入力であり、score/model/timeの注入は行わない。

[作者確認票](HUMAN_PLAYTEST.md)に実機・バー開閉・長押し/回転・音・連鎖の快適性の結果を後で記入する。全工程をClaude固有環境・一時serverに依存させず、source/画像/QA/引継ぎをGitへ保存する。
