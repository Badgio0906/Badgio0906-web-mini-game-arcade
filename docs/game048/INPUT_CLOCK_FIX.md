# 入力到着時刻の整合修正

2026-11-01 UTC、rootの限定再割当。変更はmain.ts、新しいclock.ts、時計unitと048文書/記録のみ。モデル・コース・入力所有権・取得半径・物理係数・goal・ルール・保存は変更していない。

## 観測と範囲

root実施 `QA/native-1793536686220/report.json` は1280幅で練習/cancel/旧release遮断/5retry成功、本番は接続2・miss1・tick1522で落下終了。errors/externalは空。これは原本保持し、モデル解なし、人間操作性不合格、物理破綻とは断定しない。入力列の予定時刻と実入力時刻には差がある。

修正前mainは最後のrAFからの未処理時間があるまま新commandをqueueし、次のrAFでそのcommandを未処理区間の最初のphysics tickへ適用した。この順序では入力が到着前のモデル時刻へさかのぼる。

修正後はpress/release callbackで自然な `performance.now()` まで古いcommandと240Hz固定stepをflushし、その後まだrunなら新commandをqueueする。新commandは次の固定stepで適用する。到着時刻のモデルsetter、入力の予約、自動grab、成功専用分岐はない。rAFも同じ時計を使い、直前の入力flushより古いrAF timestampで時計を戻さない。500ms超のgapは従来同様pause。開始/再開/BFCacheはclock reset、終端flushは残りcatchupを捨て、終端後の新commandをqueueしない。

## 実行した軽量確認

- 対象39unit/6files PASS。時計6unitは到着前step/次stepでのrelease、古いrAFで巻戻しなし、端数時間と二重加算、500/501ms境界、pause reset、terminal停止を検査。
- strict tsc PASS。
- raw：`QA/INPUT_CLOCK_UNIT.log`、`QA/INPUT_CLOCK_TYPES.log`。
- physics/course/game/input/audio/storage/renderer等の既存hash保持は `QA/INPUT_CLOCK_CHECKS.json`。旧freezeは `QA/SOURCE_HASHES_UI_PRE_INPUT_CLOCK.json`、修正後は `QA/SOURCE_HASHES.json`。

通常入力列 `QA/NATIVE_ROUTE.json` とprobeは変更していない。root二回目native前の候補であり、この時刻整合修正がnative full成功を保証するとは記録しない。build/browser/追加探索/性能測定は補助側で未実施。root二回目でも成立しない場合は048公開保留、物理や取得範囲を緩めない。

mainのRAF計測は従来同様update+drawのcallback内時間。入力callbackで行うflushのコストがframe callback計測へすべて含まれるわけではないため、入力負荷込み性能をこのp95だけで認定しない。
