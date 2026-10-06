# 棒バランス独立レビュー

2026-10-06 / reviewer: independent Codex worker `review_stick`。実装は編集していない。既存Game008・公開一覧・共通進捗資料は対象外。

## 対象固定版

- ベースHEAD: `c0c294120bc5a5a6e228819dc9b5120eeff64d84`
- branch: `codex/stick-balance-prototype`
- SHA256 main.ts: `4913c080433b5cf3d85fdc130d1f85218d733c7be15416755a275411fb59f508`
- SHA256 model.ts: `cab8d67532aa560ef7b8ba42ffc652cf8adb57a3ff4ab79aa333ac34bc887505`
- SHA256 style.css: `2362239b0fc2c5bdd3e8d303053762adb776ce03a149b1e7d6e383796fd9b3e8`

## 確認方法

AGENTS、PROJECT_CONTEXT、CURRENT_STATUS、GAME_DEVELOPMENT_RULES、JEV_REVIEW_RULES、REVIEW_PROTOCOLを確認。3ソースを読解し、実装担当が撮影した [PC](QA/desktop-play.png)、[390×844](QA/phone-play.png)、[320×568](QA/small-play.png)、[844×390](QA/landscape-play.png) を画像ツールで目視。独立Chromiumセッションで390×844の開始、左右キーを交互に100ms前後入力、離す、自然落下、retry、Escape pauseを実行した。状態変更hook・時計変更は使っていない。[移動中の追加画像](QA/reviewer-moving.png) も目視。browser/contextは終了済み。

`node tests/prototypes/stick-control.mjs` を独立再実行。これはモデル内の自動制御・測定であり、人間の上達や面白さの証拠ではない。

## Findingと判断

1. **修正推奨: 長時間移動後に手の左右移動が見えなくなる。** `palmX=300+tanh(x/1.8)*72` が絶対座標に依存する。65秒生存のモデル実行は x=8.046m。描画感度は開始40 SVG px/mから約0.021 px/mとなり、入力による手移動がほぼ消える。画面外・見えない壁の問題は避けられているが、主要操作の視覚フィードバックを失う。手の相対移動を残す追従cameraへ変更し、左右入力中と停止時を再撮影する。これはコードと到達可能なモデル軌跡の測定に基づくfindingで、65秒の独立人間プレイではない。
2. **未検証: 各短縮段階の実際の動き。** コードは角度・角速度を保持しsmoothstepで2.4秒短縮、2秒予告。上段セグメントを下から残して上端を下げるため、下段へ収納する解釈は成立する。ただしこのworkerは短縮へ自然到達していない。急に消える印象がないか、実装担当の段階動画／連続画像と人間試遊で確認する。現時点で確定バグとはしない。
3. **試遊調整点: 初動の余裕。** 無入力失敗は長い棒で3.64秒。説明を読んでから開始でき、わずかなキー操作で応答の向きも分かるが、初心者が最初の数秒で学べるかは未実測。独立の短い交互入力では3.975秒で失敗。これを人間の難しさ評価へ読み替えない。最初の一回の人間操作で確認する。

Finding 1は実装担当へ即時通知した。Jev記録は実装担当側の `QA/JEV_SHADOW.jsonl` を参照し、このworkerは重複API送信を行っていない。Jev回答をVisual点の根拠にはしていない。

## Visual gate（上記固定版）

| 項目 | 点 | 実画像に基づく理由 |
|---|---:|---|
| A identity |12/15|余白・紙色・緑の袖と暖色の棒が一貫。静かな集中という題材が明確。|
| B character/object |12/15|親指と4指、袖口が読める。手の厚みは簡略化されているが不自然な骨折形状はない。|
| C background |8/10|背景が低コントラストで棒の輪郭を妨げない。|
| D UI |9/10|秒数・段階・入力が分離し、指は棒を覆わない。|
| E composition |9/10|4画面で長棒と手が収まり、操作が安全領域内。小画面では絵が小さくなる。|
| F readability |11/15|静止画像の傾き・接触は明瞭。ただし長時間後の手移動の飽和が主要操作を曖昧にする。|
| G motion/effects |6/10|短い実操作で手首の控えめな動きと倒れる挙動を確認。短縮・成功エフェクトの連続動作は未評価。|
| H production value |12/15|色・線幅・接触影・ボタンが仕上がっておりdebug図形列ではない。|
| 合計 |79/100|F不足、camera修正後に差分再レビュー。|

この版の独立Visual gateは **HOLD**（80以上、F/H各12以上が必要）。全体を作り直す判定ではなく、主要操作の可読性を修正する限定指摘。

## 物理・入力・ライフサイクル

モデルは1/120秒刻み、重力・手加速度とも長さの逆数で角加速度へ反映。長さ3/2.5/2/1.55/1.15で無入力失敗3.64/3.27/2.88/2.50/2.12秒を再確認。短いほど応答が速いという主張を裏付けるが、難しさ全体の人間評価ではない。初期角度・角速度が非ゼロ、retryごとに方向が反転し、完全静止の放置成立を避ける。

実入力で左右の角速度が変わり、入力を離すと減速することを状態ログで確認。左右の入力は同じモデル値、同時押しは0、pointer captureとcancel/release処理がある。押下領域は手の下にあり主要操作は44px以上。固定壁がなく画面端で物理的に即死する設計ではない。

失敗後のretryは0.2秒時点で新規state、input=0。Escapeでpauseしtimeが保持される。blur/visibility/resizeのpause経路はコードで確認したのみ。このworkerではタッチ実入力、複数指、タブ復帰、連続retry、音、スクロール、低FPSを実機測定していない。frame側でdtを50msに制限するため20fps未満は実時間よりscoreが遅くなる。低FPS時に難度を補償する設計として許容するかは本体統合前に明記する。

## 引き継ぎ境界

本報告は独立試作の候補評価であり、Game008差替え、本番公開、人間合格を意味しない。camera修正後の独立差分確認と、自然な親指操作・初回理解・短縮の見た目・再挑戦したさの人間試遊が残る。共通広告／CREDIT／計測／ランキングへ接続する判断は本体担当へ戻してから行う。

## 追補1: camera修正・最短段階（2026-10-06）

main.ts SHA256 `f0611414468bbd63c98ee46e9120aaf795eaaae0e2f42f084179ef4752c7c1ac`。model/styleは初回と同じ。`cameraX`をdt依存の指数追従で更新し、手描画に`x-cameraX`を使用する差分を確認。beginで0へ戻り、playing中だけ進む。絶対移動量による永久的な描画飽和は解消しており、Finding 1はコード上解決。最大速度2.8m/s・追従率1.8/sでは定速時の追従差は約1.56mに収束するため、長距離移動後も初版のx=8mで生じた感度消失にはならない。

更新した4画面playと[PC最短段階](QA/desktop-stage-5.png)、[phone最短段階](QA/phone-stage-5.png)、[phone第3段階](QA/phone-stage-3.png)を独立目視。段階画像は実装担当のnative keyboard＋virtual clock・読み取り予測controllerによる到達であり、このworkerの自然プレイではない。stage5は2色・約104 SVG pxへ短縮し、初期270pxとの差が一目で分かる。手/接触の位置を保ち、短くなっても棒の暗い輪郭が背景から読める。短縮中の連続motionの人間評価は依然未実施。

**追加Finding: 通常PC高さで操作ボタンがviewport下へはみ出す。** 最短段階の1366×900画像で発見。独立Chromiumで通常ロードしてDOM測定した結果、1366×900ではcontrols bottom=916.125px、1366×768では824.297px。ページscrollで到達はできるが、ゲーム中の操作を初期viewportに収める要件を満たさない。初回の1366×1000画像では見えなかった高さ依存の問題。desktopの幅算出からHUD・操作・ページ上部の高さを差し引き直し、900/768高さでcontrols bottom≤innerHeightを確認することを推奨。phone/small/short-landscapeの目視では新たなclipなし。

camera改善でF=13/15、PC clipを反映しE=8/10、他は初回と同じ。暫定Visual合計80/100、F13/H12で数値gateには到達したが、**UI安全領域のQAはHOLD**。統合前にPC高さの限定修正・再確認が必要。実装は編集せず、独立ブラウザは終了済み。

## 追補2: 最終限定修正の確認（2026-10-06）

固定source SHA256:

- main.ts: `f0611414468bbd63c98ee46e9120aaf795eaaae0e2f42f084179ef4752c7c1ac`
- model.ts: `8e05cdddcdb22f6b460bb512499e44c14ab8ff1a567765f0e6e3ec170abbc4ca`
- style.css: `ddb9c188a02e12fe3cc8f5d812bc726a121e07f2166e57f406c25a5f245c1eab`

desktop幅はheight-390のclampへ変更。独立Chromiumの通常ロードで1366×900のcontrols bottom=856.109px、1366×768では724.109pxを確認し、両方のviewport内へ収まった。更新された[PC最短段階](QA/desktop-stage-5.png)でも左右ボタンの底まで見える。phone最短段階も再目視し接触とシルエットが保持されている。追加FindingのPC clipはこの2サイズで解消。

maxSpeed=6.4、加速5.4・ブレーキ7.2は維持する差分を確認した。実装担当の`RECOVERY.json`、`stick-recovery.mjs`、[右方向回復](QA/recovery-0-saved.png)、[左方向回復](QA/recovery-1-saved.png)をレビュー。±約0.57radからA/Dの通常入力で±約0.18radへ回復し、画像上も控えめな接触周辺の線と短い文字による成功演出が読める。読み取りmodel予測controllerとvirtual clockを使った技術確認であり、人間が同じ精度で復帰できると断定しない。高い移動速度からの停止距離・切り返しの感触は本人試遊項目として残す。

最終Visualは **81/100、F13/15、H12/15でPASS**。内訳はA12/B12/C8/D9/E9/F13/G6/H12。初版からの変更はcameraによる可読性F+2、追補1からはPCの構図E+1。未観測の連続motionへ加点していない。今回見つけた描画飽和・900/768px高さのclipは解消を確認した。新たなブロッカーはない。これは独立試作を人間試遊へ渡すVisual・限定QA判断であり、本体統合・公開・人間の面白さの合格ではない。ブラウザは終了済み、実装ソース変更なし。
