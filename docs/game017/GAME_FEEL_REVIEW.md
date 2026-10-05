# Game017 — 独立Feelレビュー

実装担当とは別のFeel workerが、固定ソースを読み、PCとphoneで実際のブラウザ入力を行い、取得した実画面を見て判定した。**機械的な遊びの成立はPASS。人間の楽しさ・指の操作感・音・視点移動による酔いは未評価。** Jevは呼び出しておらず、この判定の根拠にしていない。

## 対象と実行境界

- 実行：2026-10-05 07:21:51.175〜07:23:29.977 UTC（98.802秒）。
- 固定ソース：[SOURCE_FREEZE](SOURCE_FREEZE.json)、`2c5ea3d79bac4b844706453be58c9c8dd28788522ecca1783728cd5731767433`。前後とも290ファイル一致、変更0。基準commitはfreeze内の `442089a6d10c397eed2a49167ecaa3fb0209f9a2`、レビュー対象はその後の未コミット追加を含む固定candidate。
- 開発配信：`http://127.0.0.1:5181/game017.html`、Chromium、desktop 1440×900のnative mouseとphone 390×844のCDP native touch。contextは順次実行し、終了時にcontextとbrowserを閉じた。
- 入力はクリック／タップ／ドラッグのみ。layout変化後2 RAF待ち、responsive intrinsic canvas高さから座標を計算。touchは2回以上moveする。モデル、時計、phase、score、sceneへの書き込みは0。
- DEVのreadonly inspectionで安全経路を読む自動入力を使用した。人間が雨配置を認知して5秒で解を作れる証拠ではない。
- 再現script：[feel-native.mjs](review-artifacts/feel-native.mjs)。`node docs/game017/review-artifacts/feel-native.mjs`。実行結果：[report.json](review-artifacts/feel/report.json)。各profile49画像、合計98枚を保存。下記代表画像を実viewした。

## 観測した遊びの成立

| 項目 | desktop | phone | 判定の根拠と限界 |
|---|---|---|---|
| 初回説明→実練習 | PASS | PASS | 説明・練習のnative buttonから開始。主人公から線を描く操作を本番でも使用 |
| 練習失敗→その場で回復→成功 | PASS | PASS | 実際に危険地点へ描いて失敗し、retryで計画へ戻った。残り4.955／4.962秒、score0。練習にrun_start／run_endなし |
| 雨予兆→雨→超加速 | PASS | PASS | rain phaseに入ってからボタンで停止。短いflashと「超加速！」の実画面あり。人間の初見タイミング反応は未評価 |
| 横→上→横 | PASS | PASS | 同一背景／雨／主人公の投影変化、計画画面・帰還画面・横視点dashを取得。定義は片道0.55秒。快適さ・酔いは人間確認待ち |
| 計画と連続ドラッグ | PASS | PASS | 各round計画開始の観測残り4.978〜4.995秒。線の中間時点とphoneのloupeを取得。phoneもscrollせず描画してGOALへ到達 |
| 正常なround進行 | PASS | PASS | 本番ROUND1〜6を連続clear、各clearでstreak増加。最終score10000／9900、streak6 |
| 風・大粒 | PASS | PASS | ROUND1〜3のwind0、ROUND4以後非0。着地点の矢印を実view。ROUND6では半径27の大粒7個を各profileで生成、実画面にも大小あり |
| 描いた道とdashの対応 | PASS | PASS | 各round5時点ずつ実位置を読んで実際のroute polylineとの距離を照合。全60点の誤差は最大3.28e-14 world単位。4個の半透明afterimageを実画像で確認 |
| 危険地点→失敗理由→Retry | PASS | PASS | ROUND7でnative入力から危険地点を横断しrain collision。日本語理由・GAME OVER・濡れた主人公の結果画像。Retryでscore0／ROUND1、pause→titleも実操作成功 |
| エラー | 0 | 0 | pageerror、console error、HTTP400以上が0 |

安全経路を用いているため、連続6clearやCLOSE CALL加点を「人間に簡単」「人間が狙って爽快」とは評価しない。雨衝突は表示された危険着地点を避ける保守的なfootprint方式であり、雨粒の着地瞬間だけを通過判定する物理simulationではない。この方式はmanifest／モデルと一致する。

## 実画像からのFeel判定

- [PC超加速](review-artifacts/feel/desktop-round1-rise.png)：短い白flashと主人公の吹き出しがあり、直前の雨から世界停止への変化が分かる。
- [PC ROUND4計画](review-artifacts/feel/desktop-round4-plan.png)：赤い危険、薄い今回非到達の雨、主人公、GOALの位置が区別できる。矢印で落下先のずれを示す。
- [PC ROUND6計画](review-artifacts/feel/desktop-round6-plan.png)：密度と大粒による難化が、突然の不可視障害ではなく表示に表れる。
- [PC dash](review-artifacts/feel/desktop-round5-dash-afterimages.png)：描いた黄色い道の上を主人公と4残像が移動し、横視点帰還後も道を残す。
- [phone途中描画](review-artifacts/feel/phone-round6-mid-route.png)：黄色い線、先端dot、持ち上げた拡大窓が表示され、指周辺の危険を別位置で確認できる。実際の指がどの程度隠すかは未確認。
- [phone dash](review-artifacts/feel/phone-round5-dash-afterimages.png)：小さい画面でも主人公と残像とrouteを区別できる。横視点では奥行きを圧縮するため、計画時に避けた雨との位置関係は上から見た時ほど明瞭ではない。
- [phone失敗](review-artifacts/feel/phone-failure-result.png)：危険接触の理由を文章で示し、score／round／bestとretryを同じ画面に置く。不可解なsilent failureにはならなかった。

今回の実入力と画像から追加の製品修正を要求するfindingは検出しなかった。phoneでは風の矢印が短く、横視点では道路が薄い。これが初見の危険認知や「避けた！」感を妨げるかは、人間評価で重点確認する。新たな人間findingが出た時だけ、該当箇所を改修して再検証する。

## 人間評価へ残す項目

1. 初見で雨の到来と超加速可能なタイミングを理解できるか。
2. 回転0.55秒／dash1.4秒が長すぎず、視点移動で酔わないか。
3. 雨を実際に見て5秒でrouteを決められるか。ROUND4の風、ROUND6の大粒が説明なしでも理解できるか。
4. 実機の親指で先端から自然に描き直せるか。loupe位置とfinger occlusionが有効か。
5. 描いたrouteを高速移動する爽快感、成功時の「避けた！」感、失敗への納得、再挑戦意欲。
6. 実機の音量／SE／muteの聴覚確認と持続FPS。

headless native操作と実画像のレビューでこれらの人間合格を代用していない。音を聞いたという記録やphysical touch、motion sickness合格もない。公開／正式ReleaseGateの判断はMainと人間が別途行う。

## 最終candidateへの限定的な結び付け

この6roundの実入力・実画像証拠は、引き続き実行時の `2c5ea3d79bac4b844706453be58c9c8dd28788522ecca1783728cd5731767433` に結び付く。レビュー開始前後290ファイル一致という記録も、その時点のソースを示す。

その後Mainは `main.ts` のcanvas `pointerdown` にShift修飾入力の拒否を追加した。最終freezeは `a3025ff2f7c4e3d489a0ebe4b82e535f24b4779d8a7943a4036ffbeeba02536e`（290ファイル）。変更はボタン側とcanvas側の修飾入力扱いを揃えるフィルタであり、モデル、Canvas描画／素材、state、時計を変更するものではない。Feel workerは更新された入力条件を読み、Mainの別実行証拠 [MODIFIER_RETEST](QA/MODIFIER_RETEST.json) がShift付きボタン／canvasによる超加速を拒否し、Shift付きdragではrouteを初期1点に保ち、その後の通常入力でclearしたPASS記録であることを確認した。

最終hashで独立Feelの6roundを再実行したとは主張しない。通常入力の6round証拠と、Mainによる限定した入力ガード再検証を分けて引き継ぐ。この追記で追加のブラウザ起動やruntime変更は行っていない。
