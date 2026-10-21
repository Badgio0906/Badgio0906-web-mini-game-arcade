# 内部Game012：スマホ表示欠けの限定修正（2026-10-20）

> 2026-10-21追補：作者決定によりスマホは横向き専用へ改訂。[最新仕様・検証・画像](LANDSCAPE_ONLY_20261021.md)を正本とし、以下は689165e時点の履歴として保持する。

対象は「お前の仕事は俺の仕事」 `/games/yokodori-days/index.html`。表示番号012「落下キング」＝内部Game015／PR #11とは別作品。公開済みmain `619adc35a4339dc5d6f1ddc4e357d5f7eccde991` から `codex/game012-mobile-visibility-fix` に分離した候補。**main未統合・本番未公開。作者の実機レビュー待ち。**

## 原因と方式比較

PCKのdirectoryから読み取った `project.binary` のECFG値は viewport/window overrideとも960×540、stretch=`canvas_items`、scale_mode=`integer`。既存HTMLの `canvasResizePolicy:2` は小さいiframeとDPRに合わせて描画面自体を書き換え、整数拡大を前提とする既存画面を欠落させる。旧390幅の実画面は右側人物・対象・HUDが欠ける。元Godotソースはこの環境になく、バイナリの改造・再exportは行わない。

|方式|視認性／タッチ|工数・副作用|判断|
|---|---|---|---|
|A 全体contain|全人物・対象・HUD・入力帯を保持。縦では文字が小さくなる。実際のcanvas矩形を16:9にすればengineの入力座標変換と一致する。|HTML/CSSと生成・監査経路の限定変更。向きごとの状態分岐不要。|今回採用。人間の可読性評価を残す。|
|B 縦だけscale|縦以外の表示を維持できるが内部整数stretchとの競合が残る。|policy/CSS切替・回転時の分岐が増え、入力座標と表示のずれを検証する必要。|Aより複雑。|
|C 横専用|横では比較的大きい。縦で遊べなくなる。|案内、回転入力解除、停止／復帰仕様が必要。|Aの実機評価後に作者が再検討。自動保留しない。|

canvas属性を960×540に固定しresize policyを0にする。CSSはiframe自身のviewportに対する16:9の実DOM矩形を中央配置する。`object-fit`だけで全面矩形の内側に余白を作る方式は、engineの `(client-origin)*internal/rect` とずれるため採用しない。100dvh対応、非対応時100vh。ゲームの内部座標・ルール・WASM/PCK・保存形式・native record bridgeは同一。

再importで消えないよう `tools/game012_canvas_fit.py` をimporterと厳密監査の012限定経路から使用する。予期しないtemplate/policyは例外、既適用は冪等。監査の単なる比較緩和はしない。manifestは012 HTMLのbytes/SHA/byteIdenticalとその合計値のみ更新し、source hash・他作品を保持した。

## 固定候補の検証

[QA証拠](mobile-visibility-20261020/QA/REPORT_INDEX.md) の結果と画像を参照。外部通信を遮断した隔離ローカルサイト、Chromium通常キー／タップで実行。本番保存・Telemetryを使用しない。

|検証|結果・限界|
|---|---|
|`npm run check`|成功。|
|`npm test -- --maxWorkers=1 --minWorkers=1`|101ファイル・976件成功。先行並列実行は既存Game015の重い試験1件が20秒timeout。時間制限／テスト内容を変えず直列で成功。|
|`npm run build`|成功。既存の大きなchunk／public navigation CSS解決の警告を区別。|
|Godot3作品×4サイズ|DEV・compiledで012/013/014を確認。012は全画面内16:9・960×540、native start、一覧帰還。013は縦の案内を維持、横／PCで起動。014は全4条件で起動。|
|入力・ライフサイクル追補|`tests/game012/lifecycle.mjs` の実測結果は `QA/lifecycle/REPORT.json`。DPR3、shell練習、自然な失敗結果・retry、縦横リサイズを別途検査。|
|manifest／バイナリ／生成|独立コードレビューで42 runtime fileのmetadataとhash、旧HTML→adapterの完全再現・冪等を確認。PCK/WASM/engine/bridgeと013/014は変更なし。|
|完全な元export監査|**未実施**。pinned source/export実物がこの環境になく、元repoの取得も404。既存配信を基準とする照合とは別。|
|実iPhone Safari・native fullscreen|**未実施**。Chromium viewport検証を実機合格としない。|

実測canvas（DEV。compiledも同じ条件で検査）：

|画面|iframe viewport|canvas CSS寸法|内部解像度|
|---|---|---|---|
|390×844|390×728|390×219.375|960×540|
|320×568|320×452|320×180|960×540|
|844×390|844×274|487.109×274|960×540|
|1440×900|1440×784|1393.766×784|960×540|

独立Visualは人物・対象・HUD全体の可視化改善を確認した。ただし390/320縦のHUD・名前・待つ説明は小さい。**全体可視化は改善、縦の読みやすさは未解消**。画面内に入るだけで快適性・44px操作・面白さ合格とはしない。

## 作者確認と引継ぎ

- [ ] 候補をローカル `npm run dev` 等で実iPhone Safariから開く（本番はまだ旧版）。390相当と小型端末で人物・対象・HUD・操作説明を読めるか記録。
- [ ] 縦／横でタップ位置が一致し、狙ったタイミングで操作できる。Safariバー開閉・回転・fullscreenの有無を記録。
- [ ] 自然な本番結果→retry→一覧、既存BEST・音設定を確認。新規ローカルfixtureの成功と以前の本人データを区別。
- [ ] 縦の可読性が不足する場合はCまたはGodotソース側のresponsive HUD設計を作者が選ぶ。追加保留・再公開判断は自動化しない。

PCK SHA256 `46a9ae5df324babdea9833427da0aeeb80813cf99fd3b787636032335f21f412`、WASM `6498359ba889796a0d95a2f71113ac184badc0f2d84cf28f4103c7e399d2d547` を保持。AdSense・CMP・Analytics・Worker/D1・CREDIT・他ゲーム・カタログ公開状態は不変。原本の既存worktree・PR #11は未変更。

## 変更ファイル

- `public/games/yokodori-days/game.html`、`public/games/export-manifest.json`
- `tools/game012_canvas_fit.py`、`tools/legacy-records-import.py`
- `tests/fourteen-game/audit-legacy-migration.mjs`、`tests/game012/mobile-visibility.mjs`、`tests/game012/lifecycle.mjs`
- 本報告と `mobile-visibility-20261020/QA/` のログ・JSON・実画像。`CURRENT_STATUS` は競合を避け、統合担当の独立Q03報告で一括更新する。

初回compiled収集は一時ディスク不足でbrowser開始前に停止。今回作成したignored distの同一publicコピーだけを元素材と内容照合して省容量化し再実行した。最初のlifecycle追補は存在しないselector、次は練習の描画更新前に次のready判定を通したcollector不備で失敗した。いずれも原本保持、製品を変えず通常UIの新しいready周期を待って修正・成功した。これらをゲーム不具合／試遊合格へ読み替えない。
