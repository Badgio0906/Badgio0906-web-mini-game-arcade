# Game015 怪鳥・移動床・ルート増加 revision04

2026-10-15 JST。第2工程の実装。独立QA／Visual／Feel／本番公開／本人試遊は統合担当が固定sourceで別途記録する。

既存6パターンへ、中央湾・左連続・右連続・短い連続段・移動橋・怪鳥迂回の6パターンを追加。全12種に通常の安全4段と深いsoft catchを維持する。中央一辺倒・左右交互一辺倒の両方を避け、最終狭い石床は引き続き次の判断を要求する。

左右移動床は一部100m以降限定から通常生成へ増加。移動橋は序盤から、stairs／中央湾／左右連続は12m以降に混在。振幅8／12／16px、周期5.2／7／9秒で短長・遅速を用意。足場全振幅と前床振幅を到達性計算へ含める。既存の相対速度／床の変位継承を再利用し、乗っただけで滑落しない。

怪鳥は12m以降の十分な縦間隔を持つ最初の隙間で巡回。既存birdの予告1秒・接触sweep・ドット絵・向きを再利用。幅18×高さ10、振幅56→76px、周期2.2〜2.8秒で、sin巡回から瞬間移動しない。黄色い進行矢印／予告の!／鳴き声を表示。両端の待機床は全身の衝突箱から離れ、短い次の通過機会を待てる。画面上へ去った鳥は既存のカメラ範囲pruneで除去する。

ジャンプなし、落下重力／慣性／逆方向ブレーキ、6/9mと9/12mの落下距離境界、NICE、ホールドDROPとsoft catch、王冠／髭／マントのドット絵と既存音を維持。

## 記録統合

ルール／表示 `04`。旧 `best` は読み取り表示のみ、新 `bestR04` へ保存。旧深度と新版深度を比較しない。recordDefinitions／local reader／gameVersionsの統合と新boardはroot担当。旧結果は再送しない。

## 検証

既存36件PASS（モデル27・練習9）。64seed×350m、1seed5000m／2seed1200mを、巡回鳥を予測しながら通常DROP／左右／ブレーキだけで継続。700chunk／80seed×20chunkの全身着地湾と安全なリンクを確認。

追加game015-routes-r04 2件PASS。32seed×40chunkの全12ルート、位相最悪時の到達余裕、怪鳥上下の全身待機余白と連続速度境界、100m未満の移動床、全3振幅／全3周期を確認。3種類の移動床に12秒間無入力で乗り続け、王と床の相対位置不変・ポーズ相当無step不変を確認。

新しい画像生成なし。既存native pixel素材を維持した。全体check/build、固定ブラウザ4画面、独立Visual／Feel、公開照合、本人／物理実機／音の評価は後続工程。現時点で「面白くなった」「公開済み」と判定しない。

## 新要素の固定通常QA準備

通常DROP／自然死だけの基本QAと区別し、`tests/game015/routes-r04-native.mjs` を作成した（構文確認済み、未実行）。固定DEV候補のreadonly inspectionを読み、通常のキー／タッチ左右・DROP・逆方向ブレーキのみで180mを目指す。4px余白を含む実相対sweepの予測で怪鳥の通過窓を選ぶ。コードをbrowserへ注入せず、時計・位置・得点・足場・結果を変更しない。

出現予告→active巡回→通常DROPで通過→上へ去ってprune、移動床への実着地→0.35秒以上の無入力継承→pause完全停止→fresh resumeを実証する。moving／bird両方とpauseが揃うまで生存を要求し、失敗はそのまま記録する。既存6段練習は基本QAで済んだため、このcollectorのtutorialCompletedだけは初期fixture。RNGは既定で自然乱数、必要なら `GAME015_SEED` の初期乱数fixtureを明示して再現できる。全非GET遮断・consent denied・source前後hashを記録する。

```sh
GAME015_BASE=http://127.0.0.1:4935/ GAME015_SOURCE_ROOT=/workspace/arcade-stage2-next GAME015_REPORT=docs/game015/revision-04/QA/routes-fixed-01 node tests/game015/routes-r04-native.mjs
```

既定1440×900と390×844、`GAME015_WIDTHS=1440,390,320,844` も対応。`GAME015_DEPTH`は既定180m、通常入力は各幅最大180秒。固定candidateとブラウザ枠の割当後に実行する。未実施時点で新要素の通常到達を合格扱いしない。

## 固定a526 通常の新要素到達QA

固定commit `a52677d22911f423769cb2b206704b08f2a87b68`、DEV4172、全source前後hash一致、pageerror0／POST0。実行者は015実装者。独立Visual／人間Feelとは区別する。controllerやモデルの書換えを使わず、通常キー／native touch左右・DROP・逆方向ブレーキで取得した。

- PC1440×900: [初回report case0](QA/routes-a526-native-01/REPORT.json) は **183m到達PASS**。鳥7回安全通過／6退場、移動床1.1998pxの実変位に対して王の相対ずれ0.0384px、完全pause／fresh resume、通常quit／帰還を確認。
- Phone390×844: [最後の限定report](QA/routes-a526-native-03/REPORT.json) は **84.2m到達PASS**（80mの限定目標）。鳥2回安全通過／1退場、移動床1.7795px変位に相対ずれ0.1779px、完全pause／fresh resume、通常quit／帰還を確認。予告・active巡回・安全通過の実画像と連続巡回の速度上限も記録した。
- 実動作画像: 各report directoryの `moving-carry`→`moving-paused`、`bird-warning`／`bird-active`／`bird-safe-passage`。時系列と王／床の座標はreportへ保持した。

失敗原本も保持する。初回phone22.7mは、native touch解放前のsnapshotから静止と推測して測り始めたため、残留慣性を床継承の誤差へ混ぜ、1.5px閾値に対し2.1077pxでFAILした。[2回目](QA/routes-a526-native-02/REPORT.json) で実解放後vx=-24.4488→自然に減衰して-2.21794を観測し、静止待ち後に測ると床6.7344px／相対0.1752pxでPASS。製品の慣性は変更しない。

その2回目は、任意延長180mを目指す途中98.26mで鳥との正規接触により自然終了した。そこまでに鳥2通過・1退場・移動床・pause復帰は成功しており、その証拠を無効にしない。自然死亡を未実装／製品不具合と呼ばず、延長目標未達としてFAIL原本を保持する。QA予測へsnapshotからnative tapまでの短い遅延幅を含め、rootの指示どおり80m限定再検証を1回だけ行った。通常の人間反応・無期限生存を証明するものではない。

以上の2 findingをJevへ各1回実HTTP200で記録し、回答を読まずに上記調査・判断をannotateした。[ログ](QA/JEV_SHADOW.jsonl)／[集計](QA/JEV_SUMMARY.json)。source変更なし。実機スマホ／聴感／本人の面白さは引き続き未実施。


## 一括改修の最終統合・公開状態（2026-10-16 JST追補）

今回のcanonical runtimeは `57dce24977e4d3c7dfd42e99315c67fa07bb0243`。12作品×4画面のcompiled48組とPortal27作品のroot/subpath150項目を確認した。固有の通常RUNと後追い限定差分は [source chain](../../catalog-reorganization/QA/FINAL_SOURCE_CHAIN.json) に分離し、過去の失敗原本を保持する。最新の公式workflow・公開commit・配信SHA・実公開操作は [公開記録](../../catalog-reorganization/PUBLICATION.md)、ゲーム別結果と本人/実機/聴感の未実施範囲は [最終報告](../../catalog-reorganization/FINAL_REPORT.md) を正本とする。以前の「準備中」は各記録時点の履歴。
