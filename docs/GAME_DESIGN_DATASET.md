> 001〜005の企画比較を保持した履歴資料。新規企画は[CURRENT_STATUS](CURRENT_STATUS.md)の全カタログと各manifestで重複確認する。

# GAME DESIGN DATASET — Game001〜005

> 初期5本の履歴です。今回の改修・新作を含む最新比較は [TEN_GAME_REVIEW.md](TEN_GAME_REVIEW.md)、企画の学習資料は [CONCEPT_DESIGNER_LEARNING.md](ten-game/CONCEPT_DESIGNER_LEARNING.md) を参照してください。

更新：2026-10-04（日本時間）。将来の Concept Designer が、色や題材だけを変えた重複企画を避けるための設計記録。全ゲームの実装と独立実行レビューは完了。Game001 の人間 A〜J は合格、Game002〜005 は未実施。

外観は [VISUAL_REDESIGN_REPORT](VISUAL_REDESIGN_REPORT.md) の2026-10-04改修を反映。追加仕様・日本語タイトル・初見導線は [TITLE_AND_UI_REVISION_REPORT](TITLE_AND_UI_REVISION_REPORT.md) を反映。旧プレイ時間観察は元の測定記録として残します。

Typical Run は manifest の設計目標。人間の平均値ではない。自動操作の観察は [FIVE_GAME_REVIEW](FIVE_GAME_REVIEW.md) と個別レビューに分け、ユーザーの反応時間・記憶・判断力の代替データにしない。

## Game001 — ORBIT SHIFT

| 属性 | 記録 |
|---|---|
| Core Loop | 自動で円軌道を進む → 内外を切り替えて障害を避ける → SHARD と Near Miss で点数を伸ばす → 衝突 → Best と retry |
| Primary Skill | 切替のタイミング、危険との距離、risk management |
| Inputs | Space / Enter / 盤面クリック・タップの 1 アクション。140ms 補間中の追加入力を無視 |
| Typical Run | 初心者 40 秒 / 経験者 90 秒の目標。最初の障害は約 5.9 ゲーム秒。人間の秒数は未収集 |
| Difficulty method | 速度を上限 1.62 rad/s まで上げ、10 / 30 / 60 / 90 秒で安全条件を満たす障害パターンを増やす |
| Replay Driver | 安全に生存するだけでも更新できる点数と、近接回避 COMBO を狙う任意の挑戦 |
| Risk/Reward | 通常回避の安全と、障害の近くで実際に回避を成功させた Near Miss の追加得点 |
| Failure Type | 補間中を含む実際の障害との衝突。一度だけ CREDIT 消費 |
| Visual Identity | 暗いネオン、円形の 2 軌道、機体、赤い × と金色 SHARD |

Manifest：[`src/game/game.manifest.json`](../src/game/game.manifest.json)。既存のフォルダと保存 namespace を保持。人間合格は面白さの継続改善を不要にする宣言ではない。

## Game002 — ゆううつな月曜日 ～WORKDAY DODGE～

| 属性 | 記録 |
|---|---|
| Core Loop | 自動で通勤 → 相手の予告を読む → 左右へ 1 レーンずつ移動 → 距離と直前回避の段階ボーナス / 1000m 出社 → retry |
| Primary Skill | 予測、空いているレーンの選択、連続する交通への対応 |
| Inputs | ← → / A D / 盤面の左半分・右半分タップ。130ms の移動中は追加 1 回だけ予約 |
| Typical Run | 初心者 45 秒 / 経験者 96 秒の目標。自動の安全入力で CLEAR 95.896 ゲーム秒、人間は未実施 |
| Difficulty method | 4 地区で景色と交通を変化。直進、予告付き車線変更、小さなフェイント、2 人組を追加。全 3 レーン封鎖を作らない |
| Replay Driver | 出社成功、距離とSCOREの更新、NICE回数で次の倍率を狙う。人間の再プレイ意欲は未測定 |
| Risk/Reward | 危険なレーンを先読みで避ける。NICEは実際の危険な進路からの直前回避が必要。回数により距離×100/110/125/145/170%の段階ボーナス、finite goalは維持 |
| Failure Type | 移動中も接触判定。衝突は CREDIT −1、CLEAR は無料で成功として終了 |
| Visual Identity | 暖かいコミックの通勤者6人、住宅・店・駅・オフィスの描き込んだ街、紙面と切符風UI |

Manifest：[`src/games/game002/game.manifest.json`](../src/games/game002/game.manifest.json)。速度を自分で上げるゲームではないため、CLEAR 記録は「最速」でなく「到達時間」。無限スコアモードを足して他の runner に寄せていない。

## Game003 — 我が国の建築は世界一ぃ！ ～DROP TOWER～

| 属性 | 記録 |
|---|---|
| Core Loop | 吊り荷の揺れと影を見る → DROP → 落下・着地 → 箱全体の支持と上荷重を確認 → 次の 1 箱 → fall / collapse |
| Primary Skill | 落下タイミング、空間推定、累積した偏りと質量の判断 |
| Inputs | Space / Enter / 盤面クリック・タップ。落下中・着地待ちの入力を無視し、次の荷物へ予約しない |
| Typical Run | 初心者 50 秒 / 経験者 110 秒の目標。実入力 Feel の 14 箱は 77.446 ゲーム秒、人間は未実施 |
| Difficulty method | 最初の 3 箱は広い支持・小さい揺れ。箱の幅・高さ・質量、揺れ、8 箱以降の小さい風と積み重ねた重心が難度を作る。速度・振幅を無限に増やさない |
| Replay Driver | もう 1 FLOORS、塔の高さ、Perfect の精度と次の称号。主スコアを実際に受理した箱数に固定 |
| Risk/Reward | 端への配置で上荷重の支持を失う危険と、中心 6px 内の Perfect / COMBO / 別枠 bonus。箱幅を切り取る得点処理なし |
| Failure Type | 到着箱だけの支持失敗は傾いて横へ full fall。既存の支持接点の失敗は上部 tower collapse。失敗箱は受理数に加えない |
| Visual Identity | 全幅矩形のカフェ・住宅・オフィス階、低い街と静かな空、建築台帳・kg・クレーン・目盛り |

Manifest：[`src/games/game003/game.manifest.json`](../src/games/game003/game.manifest.json)。ゲーム向け toy physics。箱全幅と質量を保持し、着地時に各接点の累積上荷重重心を判定する。汎用物理エンジンや現実の物理の再現を主張しない。

## Game004 — あなたの短期記憶、無事ですか？ ～ECHO GRID～

| 属性 | 記録 |
|---|---|
| Core Loop | WATCH で光の順番を見る → RECALL で同じマスを入力 → 正解なら次の LEVEL → 誤入力で終了 → 正解列を見て retry |
| Primary Skill | 短期記憶、集中、同じマスを含むパターンの区切り |
| Inputs | 固定 3×3 native button のクリック・タップ。Tab + Enter / Space、1〜9 は補助。WATCH の早押しは無視 |
| Typical Run | 初心者 45 秒 / 経験者 120 秒の目標。列を読む自動操作で LEVEL 16 は 85.907 ゲーム秒。RECALL は期限なし、人間は未実施 |
| Difficulty method | 長さ 2 → 最大 9、点灯 0.6 → 最低 0.28 秒、消灯 0.18 → 最低 0.12 秒。LEVEL 4 以降に同じマスの 2 連続、3 連続以上を避ける |
| Replay Driver | 「次はもう 1 LEVEL」、間違えた順番を確認して覚え直す。主スコアは到達 LEVEL、completed level と区別。結果に家庭調べのジョークコメント |
| Risk/Reward | 回答を急ぐ得点報酬はない。集中を維持して正解列を伸ばす。記憶だけの体験が再挑戦を生むかは人間評価待ち |
| Failure Type | 1 回の誤入力で終了。押したマス・次の正解・全 sequence を表示し、盤面を残して短く replay |
| Visual Identity | グラファイトと真鍮の記憶実験装置、象牙色の固定9キーと即時切替の琥珀色の光 |

Manifest：[`src/games/game004/game.manifest.json`](../src/games/game004/game.manifest.json)。DOM / CSS で Phaser を読み込まない。思い出す時間を奪う期限や、結果で全マスを覆う共通 UI は目的と合わない。

## Game005 — 右往左往の仕分け術 ～SORT SHIFT～

| 属性 | 記録 |
|---|---|
| Core Loop | PLAYで説明・任意の2問無料練習 → 常時表示された RULE を見る → 1 荷物の該当属性を左右に分類 → 発送 → 次の荷物 → 8 正解で規則を変更 → 誤方向 / 時間切れ |
| Primary Skill | 視覚的分類、現在の判定軸へ切り替える認知的柔軟性、判断速度 |
| Inputs | ← → / A D / 盤面半分の primary pointerdown。native LEFT / RIGHT のクリック・Enter・Space。発送・変更中は入力を無視 |
| Typical Run | 初心者 45 秒 / 経験者 100 秒の目標。読み取り planner の 65 個は 26.421 ゲーム秒。無入力の最初は 4.8 秒、人間は未実施 |
| Difficulty method | 形 → 明暗 → 大きさ → 記号を 8 正解ごとの固定順で進め、32 から左右反転、64 で通常へ戻る。属性は独立乱数。判断時間 4.8 − 0.06×正解数、下限 1.3 秒 |
| Replay Driver | 前の対応の癖を抑え、次の 1 個を正しく仕分ける。SORTED と同数の連続 COMBO、音程は上限あり |
| Risk/Reward | すばやさと正確な分類の両立。速く入力しても追加点はなく、deadline 内の正解 1 個 = 1 SORTED |
| Failure Type | 誤方向または荷物ごとの時間切れで即終了。選んだ方向 / 未入力、正しい方向、対象属性と現行 RULE を示す |
| Visual Identity | 紫の輪郭と黄・珊瑚・青緑の工場、丸・角と明暗の製品、RULE看板・左右スイッチ・搬出の動き |

Manifest：[`src/games/game005/game.manifest.json`](../src/games/game005/game.manifest.json)。発送 0.23 秒、変更告知 0.95 秒。変更中は新しい対応だけを見せ、次の荷物を出してから締切を始める。形の ○ と印刷記号 ○ は、現行の dimension label と属性の caption で区別する。DOM / CSS で Phaser を読み込まない。

## 次の Concept の重複確認

1 アクションの回避、3 レーン予測、落下積み上げ、光の列の再現、左右の分類切替は既にある。新しい題材だけで同じ Core Loop・Primary Skill・Failure Type を再利用する案は重複候補とする。

次の企画は、例えば探索、計画、ターン制、空間パズル、経済的選択など、この 5 本にない判断を具体的に提案する。タイトルだけでなく Core Loop / 操作 / 時間 / skill / score / failure / replay / 独自性を比較し、人間プレイテストで見つかった弱点を反映する。今回それらの新ゲームや自律 Concept 生成は実装していない。
