# Web Mini Game Arcade
# Game002〜Game005 連続開発指示書

## 0. このタスクの位置付け

Game001「ORBIT SHIFT」は人間によるプレイテストを完了し、以下の項目すべてで問題なしと評価された。

- 操作が直感的に理解できる
- 初回死亡までの時間が適切
- 死亡理由が理解できる
- 操作感が気持ちいい
- 理不尽な配置がない
- ベストスコアを更新したくなる
- 3 CREDITを使い切った後も遊びたくなる
- 広告視聴で+3 CREDITなら続けたいと思える
- PCで問題なく動作する
- 実機スマートフォンで操作・表示・音・滑らかさに問題がない

Game001で得た成功要素を参考にしつつ、Game002〜005では異なるゲーム体験を検証する。

目的は4本のゲームを単に追加することではない。

最終的に100種類以上のゲームをCodex中心で継続開発するため、

**「何を共通仕様にすべきか」**
**「何をゲームごとに変えるべきか」**

を発見することが目的である。

---

# 1. 開発順序

以下の順番で開発する。

1. Game002
2. Game003
3. Game004
4. Game005

原則として1本ずつ、

Implementation
↓
Automated Test
↓
Game Feel Review
↓
QA Review
↓
Revision
↓
再テスト

まで完了させてから次へ進む。

4本を一度に雑に実装しない。

---

# 2. サブエージェント構成

既存プロジェクト企画書に従う。

利用可能なら、

## Main Agent / Lead Developer

全体統括。

## Gameplay Engineer

ゲーム本体実装。

## Game Feel Reviewer

ゲームとしての面白さ・テンポ・リトライ性を独立評価。

## QA / Code Reviewer

技術品質・バグ・レスポンシブ・保存・パフォーマンス確認。

を使用する。

Game Feel ReviewerとQA Reviewerは、Gameplay Engineerの実装をそのまま承認する役割ではない。

問題があれば明確に指摘する。

---

# 3. Game001から再利用してよいもの

以下について、Game001ですでに十分な実装が存在する場合は積極的に再利用する。

- CreditService
- StorageService
- AudioService
- TelemetryService
- Rewarded Ad Stub
- responsive関連処理
- mute処理
- LocalStorage
- 共通UIの一部
- lifecycle
- input abstraction

ただしGame001固有のゲームロジックは流用しない。

また、

「Game001に存在するから」

という理由だけで共通化しない。

002〜005で実際に再利用価値が確認できたものだけを共通基盤候補とする。

---

# 4. 既存Game001を壊さないこと

Game002〜005追加によって、

Game001 ORBIT SHIFT

の動作を破壊してはいけない。

必要に応じて共通コードをリファクタリングしてよいが、Game001についても回帰テストを行う。

---

# 5. 共通CREDIT仕様

全ゲーム共通：

初期

3 CREDIT

Game Over：

-1 CREDIT

0 CREDIT：

Rewarded Ad Stubを表示。

Stub成功：

+3 CREDIT

本番広告はまだ実装しない。

---

# 6. ゲームごとのCREDITについて

CREDITは「1 RUN」に対して1消費する。

つまりゲームを開始しただけでは消費せず、

RUNがGame Overになった際に1消費する現在の方式を基本とする。

ただし今後の実測結果を見て変更可能。

---

# 7. 共通ゲーム哲学

各ゲームは以下を目指す。

### 説明

5〜10秒以内で理解可能。

### 入力

必要最小限。

### 初回プレイ

意味が分からないまま即死させない。

### Game Over

理由が理解できる。

### Retry

非常に速い。

### Skill

遊ぶほど少し上達できる。

### Score

結果を一目で理解できる。

### Replay

「もう1回」が自然に生まれる。

---

# 8. Game metadata

Game002以降、各ゲームには機械可読なmetadataを作成する。

例：

`game.manifest.json`

最低限：

```json
{
  "id": "game002",
  "title": "...",
  "genre": [],
  "core_mechanic": [],
  "primary_input": [],
  "skill_axes": [],
  "expected_run_seconds": {
    "beginner": 0,
    "experienced": 0
  }
}
```

これは将来、

Analytics
↓
Data Analyst Agent
↓
Concept Designer

が、

「どんなゲーム設計が実際に人気なのか」

を分析できるようにするためである。

ゲームの実績値はここには保存しない。

metadataはゲーム特性だけを記述する。

---

# GAME002
# ぶつからず出社せよ！
# WORKDAY DODGE

## 9. Game002の目的

Game001では、

「いつ軌道を切り替えるか」

というTiming Skillを検証した。

Game002では、

**前方を見ながら安全なレーンを判断する**

Prediction / Lane Selection Skillを検証する。

---

# 10. ゲーム概要

主人公はサラリーマン。

自宅からオフィスへ徒歩で出勤している。

しかし前方から次々と歩行者がやってくる。

通称、

**ぶつかりおじさん**

である。

主人公は左右へ移動して衝突を避けながらオフィスを目指す。

---

# 11. 視点

縦方向に進行する3レーン方式。

プレイヤー：

画面下部。

道路：

上方向へ流れる。

相手：

画面上部からプレイヤー方向へ接近してくる。

実際には背景スクロール等で前進感を表現してよい。

---

# 12. 操作

3レーン：

LEFT
CENTER
RIGHT

PC：

← / A
→ / D

スマートフォン：

画面左側タップ → 左

画面右側タップ → 右

1回入力につき1レーン移動。

2レーンを瞬時に飛び越えない。

---

# 13. レーン移動

完全な瞬間移動ではなく、

短いTween

を入れる。

ただし操作レスポンスを損なわない。

連続入力も自然に受け付ける。

---

# 14. スコア

最重要表示：

**歩行距離**

単位：

m

例：

`438 m`

これをメインスコアとする。

抽象的なpoint表示をメインにしない。

---

# 15. 最終目標

オフィスまで：

1000m

とする。

1000mに到達した場合、

**出社成功！**

としてRUN CLEAR。

初回クリア自体を大きな達成として扱う。

クリア後の追加スコアモードはGame002初版では不要。

---

# 16. 自己ベスト

未クリア：

最高到達距離。

クリア済み：

CLEAR記録に加えて最速到達時間を保存してよい。

ただしUIを複雑にしすぎない。

---

# 17. 敵タイプ

### TYPE A：通常

1レーンを直進。

序盤はほぼこれだけ。

### TYPE B：レーン変更

接近途中で1レーンだけ移動する。

移動開始前に、

身体の向き
小さな予備動作

などで予測可能にする。

### TYPE C：フェイント

わずかに横へ動いてから戻る。

ただし頻発させない。

### TYPE D：2人組

2レーンを同時に塞ぐ。

必ず1レーンは安全。

---

# 18. 公平性

3レーンすべてを同時に封鎖しない。

理論上避けられるだけでは不十分。

人間の反応時間を考慮した安全マージンを持たせる。

完全ランダムではなく、

安全確認済みPatternを使用する。

---

# 19. 難易度

目安：

0〜150m：
チュートリアル

150〜400m：
Easy

400〜700m：
Normal

700〜1000m：
Hard

距離に応じて、

- スクロール速度
- 人数
- レーン変更率
- Pattern複雑性

を増加。

---

# 20. 背景変化

距離に応じて軽く景色を変える。

0〜250m：
住宅街

250〜500m：
商店街

500〜750m：
駅周辺

750〜1000m：
オフィス街

凝った素材は不要。

色・建物シルエット・道路装飾等で十分。

---

# 21. Game Feel

安全なギリギリ回避では、

小さな、

`NICE DODGE`

程度の演出を入れてよい。

衝突：

- short hit stop
- slight shake
- SE
- 主人公のリアクション

Game Over：

「出勤失敗……」

程度の軽いユーモアを入れてよい。

---

# 22. 想定RUN

初心者：

30〜70秒

慣れた人：

60〜120秒

---

# 23. Game002 metadata例

```json
{
  "id": "game002",
  "title": "WORKDAY DODGE",
  "genre": ["arcade", "dodge", "endless-runner-like"],
  "core_mechanic": ["three-lane movement", "prediction"],
  "primary_input": ["left", "right"],
  "skill_axes": ["reaction", "prediction", "lane-selection"],
  "expected_run_seconds": {
    "beginner": 45,
    "experienced": 100
  }
}
```

---

# GAME003
# DROP TOWER

## 24. Game003の目的

Game001・002は移動・回避ゲーム。

Game003では、

**静かな緊張感**
**タイミング**
**物理的な積み上げ**

を検証する。

ゲームテンポを意図的に変える。

---

# 25. ゲーム概要

画面上部から荷物が吊られている。

荷物は左右へ揺れている。

プレイヤーはタイミングよく荷物を落とし、

下に積み上げていく。

積み上げた高さを競う。

---

# 26. 操作

PC：

Space / Enter / Click

スマートフォン：

Tap

入力は、

**DROP**

のみ。

---

# 27. 荷物

毎回、

- 幅
- 高さ
- 重さ

に多少違いを持たせてよい。

ただし極端なランダムは避ける。

---

# 28. 物理

落下した荷物は既存の塔に着地する。

多少の、

- 傾き
- ズレ
- 揺れ

を許容する。

ただし本格的なシミュレーターにしない。

遊びやすさを優先する。

Phaser Matter等を使う場合も挙動が暴れすぎないよう調整する。

---

# 29. Game Over

荷物が塔から完全に落下した場合。

または塔全体が崩壊した場合。

1個の小さな揺れだけで即終了しない。

---

# 30. スコア

基本：

積み上げた個数。

例：

`27 FLOORS`

追加表示：

高さ

`18.4 m`

どちらをメインスコアにするかGame Feel Reviewで決定してよい。

---

# 31. PERFECT

荷物の中心が非常によく合った場合：

`PERFECT`

連続：

PERFECT x2
x3
x4

連続Perfect時は、

- 音程上昇
- 小演出
- score bonus

を付ける。

---

# 32. 難易度

序盤：

ゆっくり。

次第に、

- 横移動速度上昇
- 振り幅変化
- 荷物形状変化
- 風のような軽い外乱

を導入。

ただし、

ランダムな理不尽物理

は避ける。

---

# 33. カメラ

塔が高くなるにつれて自然に上へスクロール。

地面が見えなくなっても、

高さが増している感覚

が得られるようにする。

---

# 34. Game Feel

DROP：

小さなrelease SE。

着地：

重量感のあるSE。

Perfect：

明るい音。

危険な傾き：

視覚的に分かる。

崩壊：

短いSlow MotionまたはHit Stopを検討。

---

# 35. 想定RUN

初心者：

30〜70秒。

慣れた人：

60〜150秒。

---

# 36. Game003で検証したいもの

Game001/002のような高速操作ではなくても、

「もう1個だけ積みたい」

という欲求だけで再プレイが成立するか。

---

# 37. Game003 metadata例

```json
{
  "id": "game003",
  "title": "DROP TOWER",
  "genre": ["arcade", "physics", "timing"],
  "core_mechanic": ["drop timing", "stacking"],
  "primary_input": ["single-action"],
  "skill_axes": ["timing", "spatial-estimation", "risk-management"],
  "expected_run_seconds": {
    "beginner": 50,
    "experienced": 110
  }
}
```

---

# GAME004
# ECHO GRID

## 38. Game004の目的

初めて反射神経中心ではないゲームを試す。

Game004では、

**短期記憶**
**集中**
**パターン認識**

を中心にする。

---

# 39. ゲーム概要

画面中央に、

3×3

の9マスGridを表示。

複数のマスが順番に光る。

プレイヤーはその順番を覚え、

同じ順番でタップする。

成功すると次LEVEL。

---

# 40. 操作

PC：

Mouse click

スマートフォン：

Tap

キーボード専用操作は必須ではない。

---

# 41. 初期LEVEL

LEVEL 1：

2〜3個程度。

表示速度もゆっくり。

---

# 42. 難易度

進むにつれて、

- sequence length増加
- flash時間短縮
- interval短縮

を行う。

途中から、

同じマスが連続する

なども導入可能。

---

# 43. 絶対に避けること

序盤から、

10個以上の長いsequence

を出さない。

「人間には覚えられない」

方向へ単純に難しくしない。

---

# 44. コンボ的成長

連続正解で、

LEVEL

が上昇。

例：

LEVEL 7

SEQUENCE 8

のように現在難易度を明確に見せる。

---

# 45. スコア

メイン：

到達LEVEL。

副：

正解した総入力数。

例：

LEVEL 12
BEST 14

非常に分かりやすくする。

---

# 46. ミス

誤ったマスを押した瞬間、

正解sequenceを一瞬だけ再表示。

これにより、

「なぜ間違えたか」

を理解できるようにする。

---

# 47. Game Over

1回の誤入力でRUN終了。

ただし初期LEVELで厳しすぎる場合はGame Feel Reviewerが、

1 MISS allowance

を提案してよい。

初期実装は1ミス終了でよい。

---

# 48. Fake difficultyは禁止

例えば、

- 見えにくい色
- 小さすぎるマス
- 意図的な入力遅延
- 突然UIを動かす

などで難しくしない。

難しさは記憶自体から生じさせる。

---

# 49. Game Feel

Flash：

心地よい短音。

正解入力：

同じ音を少し明るく。

LEVEL CLEAR：

短い上昇音。

ミス：

明確だが不快すぎない音。

高LEVELでは少し緊張感を増やしてよい。

---

# 50. 想定RUN

初心者：

30〜60秒。

慣れた人：

60〜180秒。

---

# 51. Game004で検証したいもの

「高速アクションでなくても、自己ベスト更新だけで再挑戦が成立するか」。

また、

プレイヤーが、

「次はもう1LEVEL行ける」

と感じる設計になっているか。

---

# 52. Game004 metadata例

```json
{
  "id": "game004",
  "title": "ECHO GRID",
  "genre": ["memory", "puzzle", "score-attack"],
  "core_mechanic": ["sequence-memory", "recall"],
  "primary_input": ["grid-tap"],
  "skill_axes": ["short-term-memory", "concentration", "pattern-recognition"],
  "expected_run_seconds": {
    "beginner": 45,
    "experienced": 120
  }
}
```

---

# GAME005
# SORT SHIFT

## 53. Game005の目的

Game005では、

**瞬間判断**
＋
**途中でルールが変わる**

という認知的な面白さを検証する。

単純反射とも記憶とも違うゲームにする。

---

# 54. ゲーム概要

画面中央から、

1つずつオブジェクトが流れてくる。

プレイヤーは現在表示されているRULEに従って、

LEFT

または

RIGHT

へ仕分けする。

---

# 55. 操作

PC：

← / A
→ / D

スマートフォン：

左半分タップ
右半分タップ

---

# 56. 基本RULE例

### RULE A

ROUND → LEFT
ANGULAR → RIGHT

### RULE B

LIGHT → LEFT
DARK → RIGHT

### RULE C

SMALL → LEFT
LARGE → RIGHT

### RULE D

SYMBOL ○ → LEFT
SYMBOL × → RIGHT

など。

---

# 57. RULE表示

画面上部に常時表示。

一瞬見ただけで理解できる。

例：

`ROUND ← | → ANGULAR`

長文は禁止。

---

# 58. ルール切替

一定数正解すると、

`RULE CHANGE!`

を表示。

0.8〜1.2秒程度の短い間を入れて、

新RULEを明確に表示する。

突然無通知で切り替えない。

---

# 59. 難易度

序盤：

1種類のRULE。

中盤：

複数RULEから切替。

後半：

オブジェクト到着速度上昇。

さらに、

直前RULEの癖を利用した引っかけ

を自然に発生させる。

例：

長時間、

ROUND=LEFT

だった後、

RULE変更によって、

ROUND=RIGHT

相当になる。

ただしUI上は必ず明確に告知する。

---

# 60. スコア

正解数。

例：

`42 SORTED`

Combo：

連続正解数。

例：

`COMBO 17`

自己ベスト：

`BEST 63`

---

# 61. Game Over

誤った方向へ仕分けした場合。

または制限時間内に判断しなかった場合。

最初は判断時間を長く。

進行に応じて短縮する。

---

# 62. Game Feel

正解：

軽いPop音。

高速Combo：

音程やエフェクトが少し上昇。

Rule Change：

明確な短い演出。

ミス：

正しい方向を一瞬表示。

これにより、

「ルールを間違えた」

のか

「入力を間違えた」

のか分かるようにする。

---

# 63. 想定RUN

初心者：

30〜60秒。

慣れた人：

60〜120秒。

---

# 64. Game005で検証したいもの

「同じ2ボタン操作でも、

身体的反射ではなく、

脳内ルール切替

を要求することで別ジャンルとして成立するか」。

---

# 65. Game005 metadata例

```json
{
  "id": "game005",
  "title": "SORT SHIFT",
  "genre": ["arcade", "reaction", "cognitive"],
  "core_mechanic": ["binary-sorting", "rule-switching"],
  "primary_input": ["left", "right"],
  "skill_axes": ["decision-speed", "cognitive-flexibility", "attention"],
  "expected_run_seconds": {
    "beginner": 45,
    "experienced": 100
  }
}
```

---

# 66. 共通Telemetry

Game002〜005でも以下を記録する。

最低限：

`game_open`

`run_start`

`run_end`

`score`

`run_duration`

`credit_used`

`credit_zero`

`reward_offer_shown`

`reward_requested`

`reward_granted`

`retry`

`quit`

追加で、

`game_id`

を必ず記録する。

---

# 67. ゲーム固有Telemetry

必要であれば、

Game002：

`distance_reached`
`office_clear`

Game003：

`tower_height`
`perfect_count`

Game004：

`memory_level`
`sequence_length`

Game005：

`sorted_count`
`rule_change_count`

などを追加してよい。

ただしAnalytics実装を過剰に複雑化しない。

---

# 68. 将来のデータ分析を意識する

将来、

Data Analyst Agent

が以下を比較可能にしたい。

例えば：

ORBIT SHIFT
vs
WORKDAY DODGE
vs
DROP TOWER
vs
ECHO GRID
vs
SORT SHIFT

について、

- 平均RUN時間
- RETRY率
- 3 CREDIT消費率
- CREDIT 0到達率
- Reward選択率
- BEST更新率
- ゲーム退出率

等を比較する。

そのためgame_idと基本Telemetry形式を統一する。

---

# 69. Game Over画面

ゲームごとに世界観は変えてよい。

ただし最低限、

SCORE
BEST
CREDIT
RETRY

がすぐ分かる。

Reward Stubも同じ考え方にする。

---

# 70. UI共通化について

002〜005の制作過程で、

「4ゲーム以上で完全に同じ」

と確認できたUIについてのみ、

共通UIコンポーネント化を検討する。

Game001の見た目を全ゲームへコピーしない。

ゲームごとに視覚的個性を持たせる。

---

# 71. アート

Game002〜005でも原則として、

外部画像素材への依存を最小化する。

可能な限り、

- Phaser Graphics
- CSS
- simple SVG
- primitive shape
- generated particle

で構築。

ただし「無機質な技術デモ」に見えないよう、

それぞれに明確なアート方向を付ける。

---

# 72. 視覚方向

### Game002

軽いコミカルな通勤風景。

### Game003

シンプルな工業・建築系。

### Game004

暗めで集中できる電子パネル風。

### Game005

明るく高速な物流・仕分けセンター風。

4ゲームが一覧に並んだ時に、

同じゲームの色違い

に見えないようにする。

---

# 73. PC / Mobile

全ゲームで、

PC
スマートフォン

両対応。

特にスマートフォンで、

- scroll発生
- zoom発生
- text selection
- accidental double tap
- browser gesture interference

等を抑える。

---

# 74. パフォーマンス

一般的なスマートフォンで60fpsを目標。

Game003の物理演算について特に負荷確認する。

---

# 75. 自動テスト

各ゲーム最低限：

- 起動
- run_start
- Game Over
- CREDIT減少
- Retry
- CREDIT 0
- Reward Stub
- +3 CREDIT
- Best保存
- Reload後の保存

を確認。

可能ならPlaywright smoke test。

---

# 76. Game Feel Review

各ゲームについてGame Feel Reviewerは最低限、

### A
5〜10秒以内にルールが分かるか。

### B
初心者が意味不明なまま即死しないか。

### C
失敗理由が理解できるか。

### D
操作自体が気持ちいいか。

### E
理不尽さがないか。

### F
自己ベストを更新したくなるか。

### G
3回遊んだ後でも再挑戦したくなるか。

### H
+3 CREDITならRewardを選択したくなるゲームになっているか。

を評価する。

Game Feel Reviewer自身が実際にブラウザプレイできない場合、

推測で合格にしない。

Human Playtest Required

として残す。

---

# 77. QA

各ゲーム：

- TypeScript error 0
- build successful
- console error確認
- resize確認
- mobile viewport
- PC input
- touch input
- mute
- storage
- restart
- CREDIT
- performance

を確認。

---

# 78. 人間プレイテスト

Game002〜005完成後、ユーザーが実際にプレイする。

Game001と同じく、

A〜J形式

で評価できるよう、Codex側からゲーム別確認ポイントも提示する。

---

# 79. LESSONS

各ゲーム終了時、

`docs/GAME002_LESSONS.md`

`docs/GAME003_LESSONS.md`

`docs/GAME004_LESSONS.md`

`docs/GAME005_LESSONS.md`

を作成。

最低限：

- Game001との差
- 面白さの核
- 再利用可能部分
- 固有部分
- 開発上の問題
- Game Feel上の問題
- QA上の問題
- 共通仕様候補

を記録。

---

# 80. 5ゲーム完成後

Game001〜Game005が完成した時点で、

`docs/FIVE_GAME_REVIEW.md`

を新規作成する。

ただし、人間によるプレイテスト結果がまだない項目について結論を決めつけない。

---

# 81. FIVE_GAME_REVIEW.mdで比較する内容

少なくとも、

| Game | 主技能 | 入力 | テンポ | RUN時間 | Replay要因 |
|---|---|---|---|---|---|

の形式で比較。

さらに、

### 全5ゲームで有効だったもの

### 4/5ゲームで有効だったもの

### ジャンル固有だったもの

### 共通化すると逆にゲーム性を損なうもの

に分類する。

---

# 82. GAME_COMMON_SPEC v0.1候補

5ゲーム完成後、

`GAME_COMMON_SPEC.md`

のDraftを作成してよい。

ただし、

Game001だけで決めたルール

をそのまま全ゲーム共通仕様にしない。

5ゲームの経験を基にする。

人間のプレイテスト前は、

`DRAFT`

扱い。

---

# 83. 今後のConcept Agent用資料

さらに、

`docs/GAME_DESIGN_DATASET.md`

を作成。

各ゲームについて、

- Core Loop
- Primary Skill
- Inputs
- Typical Run
- Difficulty method
- Replay Driver
- Risk/Reward
- Failure Type
- Visual Identity

を記録する。

これは将来、

Concept Designer Agent

が既存ゲームとの重複を避けながら新規企画を作るための資料とする。

---

# 84. 重要：似たゲームを量産しない

成功したゲームの表面的コピーを作らない。

今回の5ゲームは、

## Game001 ORBIT SHIFT

Timing / Avoidance

## Game002 WORKDAY DODGE

Prediction / Lane Selection

## Game003 DROP TOWER

Physics / Timing

## Game004 ECHO GRID

Memory / Concentration

## Game005 SORT SHIFT

Decision / Cognitive Switching

という異なる体験を持つ。

この違いを保つ。

---

# 85. 今回まだ実装しないもの

- 本番広告
- Online Ranking
- 人気ランキング
- Login
- User Account
- Server
- Analytics Backend
- 自律Concept生成
- 自動公開
- 課金

これらは5ゲームの面白さ検証後に進める。

---

# 86. 最終完成条件

Game002〜005についてそれぞれ、

1. 実際にブラウザで遊べる
2. PC対応
3. mobile対応
4. CREDIT機能
5. Reward Stub
6. Score
7. Best保存
8. Retry高速
9. Game Feel Review済
10. QA済
11. Build成功
12. LESSONS作成済
13. Metadata作成済

を満たす。

さらに全4ゲーム完成後、

`FIVE_GAME_REVIEW.md`

`GAME_DESIGN_DATASET.md`

を作成する。

---

# 87. Main Agentへの最終指示

仕様上判断可能な軽微な内容について、逐一ユーザーへ確認を求めない。

Main Agentが合理的に判断して進める。

ただしゲーム性へ大きく影響する変更を行った場合、

最終報告に記載する。

各ゲームは、

「技術的に動く」

ではなく、

**人間がもう一度遊びたくなる可能性が高い状態**

まで改善する。

Game002から順番に開発を開始すること。