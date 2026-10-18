# 表示014／内部Game017 改良候補・独立移設レビュー

2026-10-18 UTC。独立reviewer subagentによる製品読取監査。固定候補`3b8adf81ef40ac2201445aa47ea6d8aeb10796a2`、移設commit`1e55d97`、移設前基準`2a6e36a`。[詳細JSON](INDEPENDENT_MIGRATION_REVIEW.json)にhash・実測値・証拠範囲を記録した。

**ローカル改良候補の番号対応・保存分離・移設はPASS。** 本人の完成判断、既存公開版の置換、main反映・公開を承認する判定ではない。

- Catalogの実モジュールを独立に読み、表示014＝内部game017/RAINSHIFT/`game017.html`、表示011＝内部game014/指ハートを確認。新038の扱いは撤回され、正式一覧は28作品のまま。旧017正式HTML・rules2 source、内部014 Godot、背景、Catalog/recordDefinitions/gameVersions/Analytics/CI等42保護ファイルを基準Git blobとSHAで再計算し不一致0。旧017公開boardは`game017.score.r2.all`のまま。
- モデル・style・配信WebP14個の計16移設ファイルを旧pathのGit blobと比較して全て同一。renderの画像path、HTML/DEV識別、保存prefix・旧BEST表示だけを目的に沿って訂正し、移設後の製品HTML/source/assets/testsを017/revision03へ集約。038製品の追跡fileは現treeにない。履歴docsとraw QAは撤回表示付きで保持し、追加画像生成は行っていない。
- 独立Map backend probeで旧BEST313、雨宿りBEST4242、誤った038試遊BEST777をseedした。新BESTは初期null、練習/失敗のwrite0、完走1910点とlearned/muteだけが`web-mini-arcade:v1:game017:umbrella-r3:`以下へ保存され、旧3値は不変。038キーを読んで新BESTへ取り込まない。旧2種類はreadonly、画面は旧雨宿りBESTと改良版BESTを別表示する。値はQA fixtureであり実プレイヤーの本番記録ではない。
- 移設後のcoordinator実行logはcheck、1127単体/107files、限定buildが成功。新しい[通常入力89checks](QA/browser-label-fix/RESULTS.json)と[compiled24checks](QA/compiled/RESULTS.json)を生JSON/collectorから独立に読んだ。前者のsourceBefore/After/current hashは全一致。旧038名義の77/20成功を今回の実行数へ足していない。

新identityの通常入力はPC1280×800とtouch390×844で実90秒/180mを完走、各1910点・27乗換え、濡れは約0.0089秒/0秒。完走BEST、新旧保存不変、全4幅の9秒練習3乗換え/0点、濡れ失敗、pause/retry、learned/mute再読込を確認する証拠がある。320/844の本番は約6.71/6.73秒でpauseまで。compiledは全4幅の正しい識別、DEV hook不在、overflowなし、3秒失敗/retry、HTTP/pageerror/外部request/POSTなしを確認し、compiled90秒完走とはしていない。

初回移設RUNは[49checksでFAIL](QA/browser-fixed/RESULTS.json)。320の長い番号見出しが折り返し、操作3ボタンの下端574pxが画面568pxを6px超えた。失敗PNGを実viewしcoordinatorへ報告した。修正はHTMLの見出し短縮だけで、model/styleは不変。新RUNは89checks全成功、320のボタン下端562px。修正後の[title](QA/browser-label-fix/narrow-title.png)／[play](QA/browser-label-fix/narrow-play.png)を実viewして、014識別と旧BESTの別表示、操作欄が画面内に収まることを確認した。原FAILと修正後PASSを別保存している。素材prompt参照先と相対ASSET_INDEXリンクの指摘も解消した。

本担当はブラウザを実行せず、提供されたLinux headless Chromiumの実入力証拠を独立に照合した。readonly DEV観測で案内傘を選ぶ自動操作は人間のFeelではない。公式帰還はhrefだけで実到着未確認。物理端末/Safari/聴感/連続FPS、人間の面白さ、正式採否・公開は未評価。API/画像生成/push/PR/Actions/merge/deploy/設定操作は本担当から実施していない。
