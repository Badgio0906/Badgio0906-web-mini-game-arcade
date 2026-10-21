# Q03：Game002/003/035の説明整合（2026-10-20）

公開済みmain `619adc35a4339dc5d6f1ddc4e357d5f7eccde991` から `codex/adsense-content-accuracy-fixes` に分離。**説明のみの候補。main統合／本番公開／再審査は行わない。** 公開結果と他課題は [PR12公開報告](PR12_PUBLICATION_20261020.md)、[統合引継ぎ](INTEGRATION_FOLLOWUP_20261020.md) を参照。

## 最小変更

|ファイル|旧文|新文・理由|
|---|---|---|
|`game002.html` 遊び方|ぶつかると CREDIT を 1 消費。0 になったら開発版 Reward Stub で +3 CREDIT。|**ぶつかるとゲーム終了。無料で何度でも再挑戦できます。** `creditsEnabled:false` と整合。dormant CREDIT/広告補充経路を有効化・削除していない。|
|`game003.html` 紹介|タイミング操作に偏った旧紹介|**位置を決めて、回して、積もう。いびつな建物の釣り合いを見極めよう。** 操作説明も左右・回転・重心へ合わせ、研究ラベルをPhysics & Stackingへ。|
|`src/games/game035/main.ts` 結果見出し1文字列|9投の、小さな駆け引き。|**3エンドの、小さな駆け引き。** 1投後でも「ここで採点」でエンドを終えられる現行仕様と整合。|

003の文面は差分を正本とする。←→／R／Space・画面ボタンの説明は現行handlerと一致。035は3エンド終了で結果を表示するモデルのまま、実投数の算出や結果保存に触れていない。タイトル／description／既存score・BESTの意味は変えていない。

## 検証

- `npm run check` 成功。
- `npm test` **101ファイル・976件成功**。
- `npm run build` 成功。既存のpublic navigation CSS解決と大きなchunkの警告を記録、今回の文字列によるエラーなし。
- compiled PC1440×900／スマホ390×844：002の遊び方を開き無料再挑戦文と旧CREDIT/Reward文の除去、起動を確認。003は回転・左右移動・2回のDROP、pause/resume・一覧帰還を実操作。035は1投ずつ早期採点して3エンドを終え、結果の「3エンド」、retry、pause/resume・一覧帰還を実操作。計6ケース、pageerrorなし。
- 003の全塔終了、通常9投の全組合せ、実iPhone Safari・本人の面白さは今回未実施。通常3エンドと早期終了を通した説明の整合を評価する。
- 新規の鏡写し単体テストは加えない。既存モデル回帰と実表示で文面を検証。collectorは `tests/content-accuracy/browser.mjs` と既存 `tests/catalog-quality/deep-play.mjs`。
- [QA証拠](content-accuracy-20261020/QA/REPORT_INDEX.md) に生結果・ログ・前後画像・source hash・独立レビューを保存。本番へゲーム操作や解析送信は行っていない。新規ローカルfixtureにより本人の保存値を汚染しない。

## 非変更・残課題

製品差分は3ファイルの文章のみ。002のCREDITサービスと無料設定、003の物理・操作・得点・衝突、035のモデル・保存・記録・得点を保持。AdSense／CMP／GA4／Telemetry／Worker/D1／RecordSharing／カタログ公開状態・PR #11を変更しない。`docs/CURRENT_STATUS.md` と同階層の公開／引継ぎ報告は今回の状況記録のみ。

作者は新文面が自分のゲームの意図と合うか、スマホで折返し・文字の判読が妥当かを確認する。候補のmain統合と本番反映には別承認が必要。Googleがこの記述を不承認原因と認定したとは主張せず、確認できた説明と実装の矛盾を解消する。

追加Visual確認で035の3件目内訳の見え方に留保が出たため、compiled390で別の自然3エンドを実操作した。dialog clientHeight/scrollHeight=662/662、END3のrectはdialog内部、3件とも到達可能でretry成功。以前の画像だけを根拠にDOM clipと断定せず、追加実測を保存した。製品変更は追加しない。

変更ファイル一覧：上記製品3ファイル、`tests/content-accuracy/browser.mjs`／`result-overflow.mjs`、本報告、`PR12_PUBLICATION_20261020.md`、`INTEGRATION_FOLLOWUP_20261020.md`、`docs/CURRENT_STATUS.md`、`content-accuracy-20261020/QA/` と `integration-20261020/` の記録・画像。記録の追加を別課題の製品実装と混在させない。
