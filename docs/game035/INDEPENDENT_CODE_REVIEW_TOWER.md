# Game035 独立コードレビュー

2026-10-15 JST、レビュアーはGame003/034実装担当。Game035コードは編集せず、Jev回答は独立判断まで読まず。

対象: `src/games/game035/model.ts/main.ts/save.ts/style.css`、固有model unit。通常ブラウザ/Visual/音の実機レビューとは別。

確認:
- dragの逆方向/強さ、12px未満取消、明示space投球、移動中の追投拒否、3投/3endをモデルとUIで照合。
- 等質量/同摩擦の全石、接触分離と反発、中心からの実距離score、相手排除/guard/unused/連続endボーナスが状態へ結びつく。
- 保存は全石/速度/score ledger/報告状態をvalidate。練習を本番保存・BEST・runイベントへ入れず、完成save再読込から以前のRUNを再送しない。
- pause/help/blurでframe accumulatorとdrag captureを破棄し、resumeのfresh inputを保持。readonly診断hookはDEVのみ。
- `npx vitest run tests/unit/game035-model.test.ts --reporter=verbose` 11/11成功、100全9投match含む。証拠`QA/independent-tower/unit.log`。

Finding: persisted pagehideでAudioContextを閉じると、BFCache復帰後のunlockではclosed contextを再生成できず音が再開できない。実装担当へ指摘し、非persisted時だけdestroy＋once除去へ限定修正を確認。`QA/independent-tower/FINDING-bfcache-audio.json` とJev/独立注釈を保持。実BFCache/物理ブラウザの音聴感は未確認。

現時点で上記のコード上の修正を確認。独立通常ブラウザ/Visual承認をこのレビューから主張しない。authorの4viewport実行証拠とは別のcode/modelレビュー。

追補: 実装担当は旧固定productionでsynthetic PageTransitionEventを使ったAudioContext閉鎖再現をFAIL原本として保全し、修正後は初回/2回目persistedでclose0、pageshow後明示gestureからoscillator生成、nonpersistedでclose1を確認。`tests/game035/audio-lifecycle.mjs`、`docs/game035/QA/AUDIO_PERSISTED_BEFORE.json`、`docs/game035/QA/AUDIO_PERSISTED_FIXED.json`。これは合成lifecycle fixtureで実BFCache navigation/聴感とは区別。Jev注釈後に到着した実装担当の追加証拠であり、最初の独立観測を書き換えない。

## 固定統合production smoke追補

43deb6c:4174のGame035固有source/asset9点はauthor `QA/SOURCE_FIXED.json`のSHAと全一致（`QA/independent-tower/AUTHOR_STAGE4_SOURCE_PARITY.json`）。4画面1440×900/390×844/320×568/844×390で、通常説明→実練習Space→本番各1投から早期採点して全3end→結果→retry→飛行中pause/reload/保存再開→実帰還を実施。これはauthor専用buildの全9投QAとは別の共通登録/記録統合smoke。モデル注入なし、全profile source不変/pageerror0/localHTTPerror0/非GET書込み試行0。全browser/contextを終了。証拠 `QA/independent-tower/stage4-smoke/report.json`、collector `tests/game035/integrated-smoke.mjs`。

G用の実移動証拠: 通常投球motion-a/bを実view。毎frame保存しないため、通常pauseでsnapshotAを保存/read-only取得→resume→250ms待機と画像取得→通常pauseでsnapshotBを保存/read-only取得。実physics差0.4416667秒（capture/操作overhead込み）、赤id10が(240,523.56)から(240,395.266875)へ128.293125px移動。画像2点と`MOTION_G.json`をArtへ引渡し済み。pauseを挟んだ実通常動作であり、モデル注入/合成位置/単体9投結果をGへ代用していない。

後続の標準event-only main差分は別の独立VM証拠とroot最終candidate軽smokeへ分離する。この固定43deb証拠をその後のソースで再実行したとしない。実機BFCache/聴感/本人の面白さは未確認。
