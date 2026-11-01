# Game048 起動UI引渡し

補助next10_review。開始観測52c5fc72fb24c77be48d1db1eae2eb0332727e99。専有048 pathのみ、元modelと全失敗/途中データを保護。commit/index/remote/共有metadata操作なし。UI sourceは完成点で固定し、それ以降はroot許可の小さな入力感度unit/tests/docsだけ追加。

## 仕様・重要な証拠区別

core-route-1793375833379のPASSは調整hooks上であり元model上ではない。rootの明示許可により別courseModel.tsへ採用、元model.tsはbyte保持。y間隔を15%圧縮、x補正も15%以内。型/physics関数本体は元sourceとbyte一致、import時のhooks mutationなし。元コースの失敗は未解決のまま。

原本列を調整course開始から再生：15.004166秒/3164点/9接続。最後のsame-tick press/releaseの厳しさを報告し、root許可の有界1,987,765tick検査で最後100/150/200ms保持が通る別列を取得。candidate: 最初7取得まで原本同一、release3948/grab3996/release4032、開始から4222tick=17.591666秒/3219点。入力と軌道はQA/NATIVE_ROUTE.json/BOUNDED_SENSITIVITY.json。native成功/人間操作性の証拠にしない。

UI wrapperはgoal240,2400/R58と落下−100を原本から引継ぐ。時間制限の正本は回収物にないため経過時計のみ、最高高度y−180をscore/配達+1000。練習は次フック1取得。新規保存keyで元コースと分離。この追加UI規則はIMPLEMENTATION_SPECへ明記。

## 実装・検証

game048.html、courseModel/game/input/renderer/audio/storage/main/style、tests/game048/vite.config.mjs/native-probe.mjs/final-sensitivity.ts、対象unit、docs。通常inputは1指またはSpace、開始/再開fresh owner、cancelはpauseでrelease禁止、stale-click menu遮断。カメラは上向き、次hookの140〜300環と可否を表示。4画像のdecode必須/./assets経路一致。個別BEST/音/弱演出、strict破損memory-only、24source複合SE。GAPS元exportなし。

qa modeだけread-only __GAME__：phase/state/ready/art/camera/reach/owner/best/persistent、frame samples/timings/window_ms/p95、audio state/contextsCreated/sources/peakSources/started。mainのupdate+draw計測、短い窓を30秒性能証拠と呼ばない。setter/自動操縦なし。

対象33unit/5files・strict tsc・probe構文が2026-11-01T12:35:13ZまでにすべてPASS。timestamp/exitはQA/CHECKS.json、raw UI_UNIT.log/TYPES.log。元model/proofのhashはQA/PROTECTED.json、固定source hashはQA/SOURCE_HASHES.json。最初のabort閉じ括弧不足を修正しUI_UNIT_DRAFT失敗原本は保持。物理変更は行っていない。

## 未実施・次の3手

build/Chrome/通常入力/4幅/実画像Visual/performance/実機/人間/聴感/正式配布は未実施。rootの4画像は存在確認のみ。起動UI納品であり、公開/作者完成/面白さ認定ではない。nativeで成功しない場合は公開保留。

1. rootで4素材の生成根拠/権利/alpha/実画面採否を追記し、qa buildを固定sourceから作成。
2. rootのheavy枠で練習とcandidate全routeを通常inputで実行。4幅/cancel/blur/旧release/5retry/保存/音の停止、次hook可否とcameraを確認。失敗原本を保存し、physics/goal/radiusを勝手に緩めない。
3. nativeが安定した場合のみproduction診断なし/../../帰還/実30秒performance/作者実機・聴感へ。モデル解だけで公開へ進めず、留保が残れば048を保留。

```sh
./node_modules/.bin/vitest run tests/unit/game048*.test.ts --no-cache
./node_modules/.bin/tsc --noEmit --strict --noUnusedLocals --noUnusedParameters --skipLibCheck --target ES2022 --module ESNext --moduleResolution Bundler --lib ES2022,DOM,DOM.Iterable --types vite/client src/games/game048/*.ts
GAME048_OUT=/tmp/game048-qa ./node_modules/.bin/vite build --config tests/game048/vite.config.mjs --mode qa
GAME048_OUT=/tmp/game048-qa GAME048_FULL=1 node tests/game048/native-probe.mjs
```

probeは未実行。standalone outの一覧はないため帰還はhref属性確認のみ、rootのgalleryへ統合して../../を確認。productionはmode省略、queryでqaにできない。費用/tokens/不明時間はnull。HANDOFF自身SHAは埋めない。

## 入力時計の限定追補

root初回nativeの練習等成功/本番失敗原本を保持。root再割当でmain+小時計のみ時刻整合を修正し、再固定。自然performance.nowまで旧stepをflushしてから新commandをqueue、次stepに適用する。物理/コース/ルール/所有権/route/probe不変。39unit/6files・strict tsc PASS。詳細はINPUT_CLOCK_FIX.md、QA/INPUT_CLOCK_CHECKS.json、現freezeはQA/SOURCE_HASHES.json。旧freezeも保存。root二回目native待ちで成功認定なし。不成立なら公開保留。
