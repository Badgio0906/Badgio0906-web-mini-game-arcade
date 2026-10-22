# 共有練習dialog残留P1：修正・回帰記録（2026-10-22 UTC）

## 対象・保存状態

- repo: `Badgio0906/Badgio0906-web-mini-game-arcade`
- 基準main: `9f01aa1ffb99a85cbc30106ee1ed251b457aab7d`。開始時のlive main / fetch後origin/mainが一致。
- 作業: `/workspace/arcade-shared-practice-dialog`、`codex/fix-shared-practice-dialog-visibility`。
- 既存worktree・未push文書・PR11のローカル候補は保全。mainへのcommit/push、merge、Pages公開、AdSense操作は行わない。
- Game012/PR13は公開済み。今回再実装しない。公開28作品・完成9/試遊19、031保留、削除4作品を維持。

## 根本原因と最小修正

実ブラウザで `dialog.close()` 後に `open=false`、共有練習の `active=false` になっていても、短い横画面のauthor CSSが `data-phase=practice` だけを条件として `display:grid` を指定していた。閉じたdialogのブラウザ既定 `display:none` を上書きする。閉じる処理は練習phaseを消さないため、閉じた後の回転でも再表示された。

製品差分は `src/arcade/onboarding.css` の1行だけ：

```diff
-  #arcade-training[data-phase='practice'] {
+  #arcade-training[open][data-phase='practice'] {
```

横向きのgrid親に `[open]` を要求する。閉じたdialogにdisplay指定が適用されなくなり、既定の非表示へ戻る。グローバルな `!important` やclosed上書き、JS変更、DOM作り直しは不要。開いたdialogの2列定義・子要素配置は維持する。JSの入力解除・RAF停止・focus復帰・練習完了保存は変更しない。

## RED：修正前の実測

[RED全16条件](shared-practice-dialog-20261022/red/results.json) / [開始タップの追加再現](shared-practice-dialog-20261022/red-start/results.json)。どちらも未修正CSSのSHA256を記録。初回16条件は8成功・8失敗。失敗を成功扱いせず保存した。

| 条件 | Game001 | Game005 |
|---|---|---|
| 縦画面で× / Escape | 非表示、開始可 | 非表示、開始可 |
| 横画面で開く→× | 閉じてもgrid残留 | 閉じてもgrid残留 |
| 縦で練習→844×390へ回転→× | grid残留 | grid残留 |
| 縦で閉じる→横へ回転 | gridが再出現 | gridが再出現 |
| 横画面でEscape | grid残留 | grid残留 |
| 練習成功→タイトル / その後開始 | 元から成功 | 元から成功 |

844×390の×終了後は両作品とも `open=false / display=grid`、DOMRect **x=12, y=51.125, width=820, height=287.75**。`elementsFromPoint()` を開始ボタン中央で実行し要素列をJSONに保存した。

- Game001：開始ボタン中央はdialog外で、実タップで `playing` へ進めるが、練習画面が残留する。
- Game005：開始ボタン中央の先頭要素はdialog内。開始タップが1.8秒でtimeoutし、状態は `title` のまま。
- 成功画面は `data-phase=success` のため、修正前からこのgrid規則の対象外。この経路を同じ不具合とは扱わない。

## GREEN・検証方法

ローカルChromium `/usr/bin/chromium` + Playwright。実入力はtap・キー・ポインターで行い、モデルsetter・時間短縮・強制clickは使わない。DEV debugは読み取りのみ。compiled版はdebugに依存せず開始状態・HUDで確認する。ブラウザはGET/HEADのローカル配信だけを許可し、広告/解析/記録APIへの外部通信は遮断、解析同意はテスト用localStorageでdenied。本番アクセス・本番Telemetry送信なし。

- [DEV GREEN16条件](shared-practice-dialog-20261022/green/results.json)：16/16。
- [compiled GREEN16条件](shared-practice-dialog-20261022/green-compiled/results.json)：16/16。×、Escape、回転前後、再練習、成功→タイトル→通常開始、focus復帰、開始後の入力、一覧帰還。
- [横画面成功からの追加4条件](shared-practice-dialog-20261022/green-landscape-success/results.json)：Game001/005各2、4/4。Game001は本番HUD `#lane-value` の入力前後変化をassert。Game005は本番 `sorting` でArrowLeftを入れ、0.8秒以内のphase変化をassert。
- [共有回帰・追加幅](shared-practice-dialog-20261022/shared-compiled/results.json)：現行共有利用作品002/011/015と同じCSSを使う003の縦390×844/横844×390、001/005の320×568・667×375・1440×900。015は練習の右入力をポインターで保持したまま別指で×、解除後に開始を確認。
- 閉じたdialogは `open=false / display=none / DOMRect幅高=0`。Game005開始点にdialogがなく、実タップで本番へ移れる。開いている横向き練習は2列gridを保持。
- DEVの終了→開始間では練習clockも停止（再練習で新sessionを作る2条件を除いた14条件でelapsed一致）。JS例外は結果JSONの `errors` を参照。
- 現行UIの成功ボタンは「タイトルへ戻る」。その後「すぐ遊ぶ」で本番へ進む。利用できないcallback付き「本番へ」をテストしたとは主張しない。

画像例：[修正前005残留](shared-practice-dialog-20261022/red/game005-rotate-close.png) / [修正後005終了](shared-practice-dialog-20261022/green-compiled/game005-rotate-close.png) / [開いた2列練習](shared-practice-dialog-20261022/green-compiled/game005-open-landscape.png)。001および縦画面も同階層に保存。

実行用collector：`tests/onboarding/dialog-visibility.mjs`、`dialog-shared-regression.mjs`。固定したDEV/preview serverを別途起動して実行する。

```sh
AUDIT_PHASE=red node tests/onboarding/dialog-visibility.mjs
# 修正後・build済み preview :5186
AUDIT_PHASE=green-compiled AUDIT_URL=http://127.0.0.1:5186 node tests/onboarding/dialog-visibility.mjs
AUDIT_PHASE=green-landscape-success AUDIT_EXTENDED=1 AUDIT_URL=http://127.0.0.1:5186 node tests/onboarding/dialog-visibility.mjs
node tests/onboarding/dialog-shared-regression.mjs
```

最初の共有回帰collectorは006にも同じdialogを想定しており、006の独自説明UIで `#tutorial-practice-button` が見つからずtimeoutした。これは006のゲーム障害とは判定しない。残りの不要な実行を停止し、現行importを確認して対象を訂正。初回ログも保存する。006/008/009は独自onboarding、004は退役ページなので今回の共有dialog操作対象から除外した。

## check / test / build

- `npm run check`：成功。
- `npm test`：**106 files / 1,013 tests成功**。
- 初回unitはsparse worktreeの既存fixture省略により2 suitesがimport失敗（1,007 tests成功）。Git追跡済みの保存manifestと006 baseline2ファイルを元の内容で復元し、全件成功を確認。製品不具合として隠さずログを保存。
- `npm run build`：成功。既存の非module script警告・runtime CSS解決警告・500kB超chunk警告あり。今回の製品差分はCSS1セレクターのみで、配信設定を変更しない。
- CIと同じoffline helper `python3 -m unittest discover -s tests/jev -p 'test_*.py' -v`：25成功、API呼出なし。
- Jev有料API：**NOT_CALLED**。ユーザーの有料API禁止を優先する。実行した独立レビューと取り違えない。

## PR11との整合・独立レビュー

実施者 `/root/game015_ui_review` が固定CSS・RED/GREEN・collector・PR11をread-onlyレビュー。コード上blockerなし。最初のcollectorの001 debug名/005入力assert不足を指摘され、追加4条件でHUDと本番phaseの明示assertを実施した。

- GitHub PR11 remote HEAD `dbdf915a696b326f1247dd41c9f6cbf8765e9c56`：Draft/open、mainに競合あり。PR11自体を変更していない。
- 保存済みlocal候補 `3f199c3521c4a34564b1d022d6af2fa91ed940a3` の共有CSSは今回の修正後とファイル全体が一致する。
- PR11の `setSuspended` はphaseを保持してnative `dialog.close()` するため、今回の `[open]` 条件と整合する。再表示の `show()` / `showModal()` はopen属性を持ち、開いた練習のgridが維持される。
- 今回共有TS/API・Game015・保存・入力機能を変更しない。将来PR11統合時はそのsuspension/input処理を保持する。同一CSS修正を重複移植しない。実際のPR11統合テストを済ませたという意味ではない。

## GitHub保存・費用確認

PUBLICと標準 `ubuntu-latest` を実確認。ブランチpushだけではPagesは起動せず、Draft PR作成で既存 `Pull request validation (no deploy)` が1回起動する。再利用workflow・matrix・workflow_runの連鎖なし。チェックはJSON契約、npm ci/check/test、offline helper、build。paid API・外部deploy処理なし。設定変更・手動CI再実行は行わない。

現在のnpm cacheは **97,333,639 bytes / 2 caches**。ただしWebhook一覧とbilling usageはAPI権限不足403。Webhookの外部連動費用と保存容量課金の契約条件は **UNKNOWN**。過去の費用不明点了承は別タスク/PR13公開に限定されており、この新規PRへ流用しない。今回「既存無料CI」の許可はあるが、不明な連動を無料と断言できないため、以前の「必要な費用条件不明なら停止」の指示に従い **commitまで、未push・Draft PR未作成** とする。PR本文案を [PR_DESCRIPTION.md](shared-practice-dialog-20261022/PR_DESCRIPTION.md) に保存し、今回分の了承後に通常pushとDraft作成へ進められる状態にする。

## 非変更・未確認

- 製品変更は共有CSS1行のみ。ゲームルール/物理・保存/BEST・カタログ・広告/CMP・Telemetry/Analytics・Worker/D1・公開設定を変更していない。
- 本番には未反映なので、本番のP1を解決済みとはしない。作者承認後の別途merge/Pages公開が必要。
- 実iPhone Safari、作者の操作感、OS回転やブラウザバーによる挙動は未確認。Playwright viewport変更と実機を区別する。
- 実機票：001/005で練習→横回転→×/Escape相当の閉じる操作、残留なし・開始・入力・一覧帰還、練習成功後の終了と再練習を確認。
