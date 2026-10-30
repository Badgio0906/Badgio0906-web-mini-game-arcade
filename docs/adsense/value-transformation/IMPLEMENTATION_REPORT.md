# コンテンツ価値改善の実装・検証

2026-10-31 JST。ブランチ `codex/adsense-content-value-transformation`。**レビュー候補を実装・検証。mainへの統合・本番公開・AdSense再申請は行っていない。**

## 何が変わるか

一覧のPLAYは引き続き直接ゲームを開く。操作や目的を知りたい人は各カードの「遊び方・コツ」から作品固有の説明を読める。比較ガイドは一入力、時間制限のない思考、物理、記録の違いで選べ、初回FAQと全作品説明への一覧を持つ。

公開28作品それぞれに、実画面、目的、PC／スマホ操作、判断が分かれる場面、終了と記録、違いのある関連作品を追加した。028番目の表示作品が内部038であるなど、名前・起動URL・公開状態は既存catalogから取得する。記事数や文字数を品質目標にしていない。

固定viewportを使うゲーム画面へ長い本文を挿入する方式は採らず、読める静的ページへ分離した。ゲームからは既存の一覧帰還を経て説明へ戻れる。新しいゲーム内modal・ヘッダー・入力処理を作っていない。

## Phase 0の確認

- 開始時のbranchは `work`、未コミット変更なし。`git fetch origin main` を実行し最新mainは指定済みの `6211019f64a6946d632a9b3620de24a03505410d` と一致。新しい専用ブランチへ分離した。
- AGENTS、PROJECT_CONTEXT、CURRENT_STATUS、GAME_DEVELOPMENT_RULES、JEV_REVIEW_RULESを確認。about/privacy/index/catalog、全作品の主要実装・説明・既存テストを調査。
- PR10のコンテンツ改善、PR12の作品整理と品質監査、PR14の説明整合、PR15の033同意、PR13の012横専用、PR18の共有練習、PR11の015縦専用をGit履歴と個別報告で照合。旧公開前報告の文章を現行公開状態へ転用しない。
- GitHubのopen PRは8（試験）と9（037候補）を確認。両方を保護し、取込み・書換えなし。031保留、削除4、retired4、036/038公開、037未公開を維持。
- `FINAL_REVIEW_DELTA` は現行treeと取得済み履歴の名前検索で見つからなかった。代わりに[監査の差分表](GAME_VALUE_AUDIT.md)へ現行の根拠を列挙。
- 本番は[HTTP GET baseline](QA/PRODUCTION_BASELINE.json)を取得。トップ/about/privacy/ads.txt/015/033/036/038/012は200、削除4・031・037の本編URLは404。JS・広告クリック・解析送信・記録投稿なし。今回変更の公開結果ではない。

## 成果物と実装

|場所|役割|
|---|---|
|[公式調査](GOOGLE_POLICY_RESEARCH.md)|AdSenseの要件、Searchの指針、独自基準、国別規約本文の取得限界|
|[全作品監査](GAME_VALUE_AUDIT.md)|A13/B14/D1、28作品と13作品以上の深掘り、ソースと実操作の区別|
|[戦略](CONTENT_STRATEGY.md)|採用する説明・比較・FAQ、採らない記事群、編集と更新方法|
|`src/content/gameGuides.ts`|独立担当の根拠レビューを受けた原稿・根拠path|
|`scripts/build-game-guides.mjs`|catalogの公開作品だけを出力。文字escape、根拠path、関連作品、余分な出力、同期を検査|
|`guide.html` / `guides/gameNNN.html`|通常リンクで読める静的な比較・詳細。JavaScriptなしで本文と画像を表示|
|`src/content/style.css`|読み物専用の可変レイアウトと日本語システムフォント|
|`src/portal/main.ts` / `style.css` / `index.html`|既存PLAYを保ち、説明へのリンクと短い初回案内を追加。説明clickを既存launchイベントへ誤分類しない|
|`about.html`|既存運営案内に編集方針とガイドリンクを追加|
|`vite.config.ts` / `package.json`|物理MPA入口と生成同期check。既存相対base、Pages方式を保持|
|[検証collectorと再現手順](../../../tests/value-transformation/README.md)|root/subpath、狭幅、JSなし本文、通常tap、イベント誤計上の回帰|

生成HTMLと編集元は両方Gitに残す。編集は `src/content/gameGuides.ts` → `npm run guides:build`。通常build前の `guides:check` が原稿・catalogとの食い違いを止める。Node.js 24は既存CIと同じ条件。

## 検証結果

|確認|結果と範囲|
|---|---|
|TypeScript|`npm run check` 成功|
|既存単体|`npm test`：108ファイル・1,041件成功。意味のない本文一致テストは増やしていない|
|ビルド|`npm run build` 成功。29ページの同期checkを含む。既存の非module共有ナビ、CSS media構文、500kB超chunkの警告は残る。今回の本文CSSによる警告ではない|
|新規本文・リンク|[browser-fixed/BROWSER.json](QA/browser-fixed/BROWSER.json)：29ページ×4幅＝116条件、計493チェック成功、pageerror0。JSなし本文、画像、横overflow、44px以上の主CTA、全ローカルリンク/fragment、非公開維持|
|通常導線・計測|同collectorでrootと `/phase1/` の一覧→説明→実ゲームへtap。説明でgame_launchなし、直接PLAYでgame_launchとgame_card_clickが各1回。既存イベントschema・payload定義は変更していない|
|ゲーム追試|[current-play/results.json](QA/current-play/results.json)：390pxで001/015は通常入力→自然結果→retry→一覧帰還、033は短時間発射・pause/resume/帰還。3作品ともpageerror0。033の100秒完走は今回未実施|
|独立レビュー|[INDEPENDENT_REVIEW](QA/INDEPENDENT_REVIEW.md)：別担当が差分と実画像を確認、修正必須の新規不具合なし。320pxのsubpathで015のカード→説明→起動を通常tapで確認|
|保全|[PROTECTED](QA/PROTECTED.json)：389ファイルがmainとbyte一致。全既存ゲームHTMLも一致。indexのAdSense scriptも文字列一致を別確認|
|Jev offline|既存helperテスト25件成功。Shadowは次節の2件のみ、公開判定に使っていない|
|差分・リンク|`git diff --check`、報告内リンク、生成同期、全公開作品の出力整合を確認|

### 初回失敗と修正

初回の新規ブラウザ検証は390pxの001ガイドで停止した。[初回BROWSER.json](QA/browser/BROWSER.json)と[画像](QA/browser/game001-390-overflow.png)を保持。画像の `max-width:560px` がモバイルの100%制約を上書きし、gridの最小幅と本文を560pxへ広げていた。`minmax(0,…)`、子の `min-width:0`、画像の `width:100%` で修正し、固定した再buildを全116条件で再検証した。

独立レビュー後の追加差分は、トップの重複する2本の案内を1本に絞り、最初のPLAYまでの高さを抑えたことと、meta descriptionを具体的なゲーム内容へ合わせたこと。ガイド本文・動作は変更せず、最終buildとroot/subpathの限定導線を確認した。追補証拠は `QA/final-navigation/` に保存。

### Shadow記録

036の既存help「↓ゆっくり」の比較対象の曖昧さ、新規ガイドの390px横はみ出しを各1件・4問で送信。回答を確認する前に独立したソース判断を記録した。[raw](QA/JEV_SHADOW.jsonl)と判断JSONを保持。036の元stateに `MochiModel.ts` と誤記した参照は追補判断で実在の `model.ts` へ訂正し、元stateを改ざんしていない。annotate初回のschema不適合はAPI再送なしで修正した。

新規横はみ出しについてJevのriskは低値だったが、Codexは修正必須として解決した（release_risk_miss=true）。回答でレビューや修正を省略していない。036本体は保持し、新ガイドで通常落下より速める操作と明示した。

## 不変の境界と限界

ゲームID、BESTキー、保存形式、RecordSharing、Telemetryイベント仕様、解析同意、Worker/D1、CREDIT、物理・難易度・得点、広告コード、CMP、ads.txt、既存プライバシー開示を保持。新しい説明ページには広告・計測・storage処理を追加していない。

実iPhone/Android、013の音と4領域、スクリーンリーダー、全後半、人間の初見理解・楽しさ・再訪意欲は未評価。過去の作者評価は当時の範囲のまま。国別規約、管理画面の拒否全文、実Googlebot、実際の広告配置/地域別CMPは未確認。今回の技術検証をGoogleの承認予測にしない。

公開・再審査の判断はこの候補のレビュー後の別工程。既存PRの履歴を変更せず、mainへ無断mergeしない。
