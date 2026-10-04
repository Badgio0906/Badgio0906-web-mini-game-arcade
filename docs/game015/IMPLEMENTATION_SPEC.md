Web Mini Game Arcade
Game015 実装指示書
落下キング ～FALL KING～
0. このタスクの位置づけ
現在Web Mini Game Arcadeには14ゲームが統合されている。
次の新規ゲームとして、
Game015
落下キング ～FALL KING～
を追加する。
本作は、
縦方向へひたすら降り続ける精密アクションゲーム
とする。
コンセプト上の参考イメージは、
「上へ登る高難度アクションゲームの、落下・下降版」
である。
ただし既存作品のステージ・キャラクター・ビジュアル・固有システムをコピーしない。
本作独自の核は、
下へ進みたい。
でも落ちすぎると死ぬ。

という矛盾した目的に置く。
1. タイトル
正式タイトル：
落下キング ～FALL KING～
ポータル用煽り文句：
上を目指すな。うまく落ちろ。

2. ジャンル
- Precision Action
- Vertical Descent
- Arcade
- Score Attack
- Physics / Momentum Control
3. 基本コンセプト
主人公は非常に高い場所から地下へ向かって降りていく。
目的は、
可能な限り深くまで到達すること。
ただし主人公は、
一定以上の距離を連続して落下した後に硬い足場へ着地すると、
落下衝撃でGame Over
になる。
そのため、
落ちる
↓
途中の足場へ着地
↓
衝撃をリセット
↓
さらに下へ落ちる

を繰り返す。
4. 本作の面白さの核
単純に穴を避けるゲームではない。
プレイヤーは、
「もう一段下まで飛ばせるか？」
「安全にこの足場へ着地するか？」
「横へ流されすぎていないか？」
を瞬間的に判断する。
つまり、
下降距離を稼ぎたい欲求
と
安全に着地したい欲求
をぶつける。
5. 操作
極力シンプルにする。
PC
左：
← / A
右：
→ / D
下降：
↓ / S
または
Space
Mobile
画面左：
左移動
画面右：
右移動
中央下部：
DROP
またはSwipe Downでもよい。
ただし誤操作防止のため、基本は明確なDROPボタンを推奨。
6. 主人公の状態
主人公は基本的に、
足場上
または
落下中
のどちらか。
ジャンプはしない。
7. 足場から降りる方法
足場に立っている状態で、
DROP
を押す。
主人公は足場をすり抜けて落下開始。
これが本作における、
「ジャンプボタン」
相当の操作になる。
8. 落下中の左右操作
落下中も左右へ移動可能。
ただし完全な即時移動ではない。
横方向に慣性を持たせる。
例えば、
右を押す
↓
徐々に右速度が増える
↓
離しても少し流れる
↓
反対入力で減速
という感触。
9. 最重要：横慣性
このゲームのGame Feelを大きく左右する。
横移動を、
「左右キーを押した場所へ即移動」
にしてはいけない。
少しだけ、
空中制御のクセ
を持たせる。
ただし理不尽になるほど重くしない。
10. 落下速度
落下時間に応じて、
重力によって落下速度が増加。
ただしゲームとして制御不能にならないよう、
Terminal Velocityを設定する。
11. 落下衝撃システム
本作の最重要メカニクス。
連続落下距離を計測。
例：
FALL
7.4m

一定距離未満なら、
普通に着地可能。
12. 安全落下距離
初期調整案：
0〜6m
安全。
6〜9m
危険。
9m以上
硬い足場へ着地すると死亡。
最終値はGame Feel Reviewで調整可能。
13. 着地結果
SAFE
短い落下。
普通に着地。
HARD LANDING
危険域。
主人公が、
- 膝をつく
- 一瞬動けない
- Dust
等。
ただしGame Overではない。
SPLAT
安全限界超過。
Game Over。
過度な流血表現は不要。
昔のゲーム風に、
グシャッ

程度のコミカルな表現でもよい。
14. 落下Meter
Gameplay中に、
現在どれくらい危険な落下をしているか分かるようにする。
例えば、
FALL

■■■□□

または
落下衝撃
SAFE → DANGER

ただしUIを大きくしすぎない。
15. 重要
プレイヤーが、
「なぜ死んだのか分からない」
状態は禁止。
死亡時：
落下距離 11.3m

着地衝撃に耐えられませんでした

程度を表示。
16. スクロール
縦型。
主人公が一定位置より下へ進むと、
Cameraが下へScroll。
基本的には、
上へ戻らない。
17. ただし少し上は見える
完全に過去の足場を即消去すると判断しづらいため、
画面上部にある程度以前の足場が残る。
18. スコア
メインScore：
DEPTH
単位：
m
例：
深度
428 m

非常に分かりやすくする。
19. BEST
BEST
683 m

LocalStorage保存。
20. Score Bonus
メインは深度。
複雑なPoint計算にしない。
ただしSkill Bonusとして、
LONG DROP
を入れてよい。
例えば安全限界ギリギリの落下に成功すると、
NICE DROP!

を表示。
21. NICE DROP
安全最大落下距離の、
例えば85%以上
かつ、
死亡せず着地
した場合。
Bonus：
Scoreそのものを複雑にせず、
別カウントでよい。
NICE DROP × 7

Resultに表示。
22. Risk / Reward
下に近い足場：
安全。
遠い足場：
大きく深度を稼げる。
ただし、
落下死Riskが上がる。
さらに遠い足場へ行くには、
横慣性制御も必要。
23. 足場種類
初版では少数に限定。
NORMAL PLATFORM
硬い。
通常足場。
SOFT PLATFORM
クッション・マットレス・布等。
多少大きな落下でも安全。
ただし出現率は低い。
Visualで明確に区別。
CRUMBLE PLATFORM
着地後、
約1〜1.5秒で崩れる。
止まり続けられない。
MOVING PLATFORM
左右へゆっくり移動。
深部から出現。
24. 足場を増やしすぎない
Game015初版では、
上記4種類程度。
複雑な能力・敵・Itemは不要。
ゲームの核：
落下・横制御・着地
を最優先。
25. ステージ生成
完全Randomは禁止。
必ず、
人間が回避・着地可能なPattern
を生成する。
26. Pattern方式
複数の下降Patternを用意。
例：
Pattern A
中央
↓
中央
初心者向け。
Pattern B
中央
↓
左
↓
右
Pattern C
左端
↓
中央
↓
右端
Pattern D
短い安全足場
↓
遠いRisk足場
Pattern E
Soft Platformを利用する大落下。
27. 不可能配置禁止
生成時には最低限、
- 水平到達距離
- 最大落下距離
- Platform幅
- Character速度
を考慮する。
物理的に着地不能なPlatformしか存在しない状態を作らない。
28. 難易度Progression
0〜100m
Tutorial / Easy。
- Platform大
- 間隔短
- Normal中心
100〜300m
Platform幅を少し狭める。
横移動増加。
300〜600m
Crumble登場。
600〜1000m
Moving登場。
安全RouteとRisk Routeが明確になる。
1000m以降
Endless。
Patternの組合せが高度化。
29. 1000mイベント
1000mは、
ゲームを終了するGoalにはしない。
到達時、
短い表示：
地上から1000m
まだ底は見えません。

程度。
そのまま継続。
30. Endless
1000m以降も無限生成。
Game Overまで続く。
目標：
- 2000m
- 5000m
- 10000m
等を目指せる。
31. 深部Visual
下降に応じて背景を変える。
0〜250m
古い塔 / 地上施設。
250〜500m
地下工事区画。
500〜1000m
洞窟・地下空間。
1000m〜
謎の地底。
32. 「先を見たい」欲求
背景変化は、
プレイヤーが、
1000mの下には何がある？

と思える程度にする。
最初から全部見せない。
33. Visual Direction
最重要。
昔のファミコン風ドット絵
ただし、
「現代ゲームをPixel Filterで荒くしただけ」
は禁止。
34. Internal Resolution
推奨：
256×240
または
320×180〜240程度
の低解像度Canvas。
最終的にはBrowserにNearest Neighborで拡大。
35. Pixel Rendering
必須：
image-rendering: pixelated;

相当。
Anti-aliasingを避ける。
36. Pixel Grid
Assetは、
- 8×8
- 16×16
- 16×24
- 32×32
等の明確なPixel Gridで作る。
37. Palette
色数を制限。
1 Sceneあたり、
昔の家庭用ゲームを感じる、
少ない色数
で構成。
ただし実際のNESハードウェア制約を完全再現する必要はない。
38. 主人公デザイン
小さな、
王冠をかぶった冒険者
程度。
落下キングなので、
少し間の抜けた王様感を持たせてもよい。
39. 主人公Sprite
最低限：
- Idle
- Drop start
- Falling
- Left drift
- Right drift
- Landing
- Hard landing
- Death
40. Animation
昔のファミコンらしく、
2〜4Frame程度中心。
滑らかすぎる現代Animationにしない。
ただし操作レスポンスは現代的に良くする。
41. Background
Tile Mapベース。
- Brick
- Beam
- Cave
- Pipe
- Rock
- Strange underground structures
等。
42. Image Generation Skill
Codex Image Generation Skillは、
Art Direction探索用
として使用してよい。
例えば、
- Hero concept
- Environment concept
- Famicom-era palette direction
を生成。
ただし実ゲームAssetは、
Pixel Gridに正確に合わせたSprite
へ落とし込むこと。
生成画像を縮小してそのまま使い、
汚い擬似Pixel Art
にしない。
43. UI
ファミコンゲームのような、
シンプルで大きなPixel Font。
Gameplay中：
DEPTH  428m

BEST   683m

程度。
44. 日本語
タイトルや説明は日本語中心。
ゲーム内Gameplay HUDは、
視認性優先なら英字併用可。
45. サウンド
8bit / Chiptune調。
最低限：
- DROP
- Falling wind
- Normal landing
- Hard landing
- NICE DROP
- Death
- Milestone
46. BGM
短いChiptune Loop。
序盤は軽快。
深くなるほど、
少し不穏なVariantに切り替えてもよい。
47. Game Over
落下失敗時、
短いPause。
主人公が潰れる / 星が出る等。
Result：
GAME OVER

深度
742m

NICE DROP
8

BEST
1,024m

48. Result Comment
深度によって少しふざける。
例：
〜100m
まだ地上が見えています。

100〜300m
だいぶ下がってきました。

300〜700m
戻る気はありますか？

700〜1000m
そろそろ電波が入りません。

1000〜2000m
まだ底はありません。

2000m〜
何を目指しているのでしょうか。

5000m〜
落下に人生を捧げています。

49. 説明画面
既存共通Onboardingを使用。
初回：
落下キング
下へ降り続けるゲームです。
← → で空中移動。
DROPで足場から落ちます。
落ちすぎてから着地すると死にます。

長くしすぎない。
50. PRACTICE
本番前に必ず短い練習。
STEP 1
大きなPlatform。
下にも大きなPlatform。
表示：
DROPで下へ降りよう。

プレイヤーがDROP。
安全着地。
STEP 2
下Platformを少し横にずらす。
表示：
落ちながら ← → で移動。

横移動して着地。
STEP 3
少し遠いPlatform。
画面に、
FALL 5.2m
SAFE

等。
安全着地。
STEP 4
危険な高さをDemo。
プレイヤー自身を死なせなくてもよい。
例えばGhost Characterが、
長距離落下
↓
死亡
表示：
落ちすぎると着地に耐えられません。

Practice完了
OK！
なるべく深くまで落ちてください。

本番。
51. Tutorial Repeat
初回終了後はLocalStorageへ保存。
2回目以降：
[ START ]

[ 練習する ]

52. PC Screen Size
既存Feedbackを反映。
ゲームCanvasを小さくしない。
Desktopでは、
Viewportの高さ80〜90%程度を有効活用。
Retro Frame等で狭めすぎない。
53. Mobile
縦型ゲームとの相性が良い。
Portraitを主対応とする。
PCでは中央に縦長Game Areaを大きく表示。
54. Aspect Ratio
Game World自体は、
スマホ縦画面に適した比率。
例：
9:16周辺。
ただしPixel Art内部解像度は別管理してよい。
55. Camera
Camera movementは、
Pixel Artが滲まないよう、
整数Pixel単位にSnapすることを検討。
Subpixel scrollによるBlurを避ける。
56. Screen Shake
Hard Landing / Deathで、
1〜3Pixel程度の小さなShake。
派手すぎない。
57. Game Feel Reviewer
特に以下を確認。
A
DROP操作が気持ちいいか。
B
横空中制御が重すぎないか。
C
慣性を学習できるか。
D
安全落下距離を感覚で理解できるか。
E
死亡理由が分かるか。
F
足場生成が理不尽でないか。
G
次のPlatformを見て、
「ここへ行こう」
という判断があるか。
H
BEST更新を狙いたくなるか。
I
1000mより下を見たくなるか。
58. 最重要調整
このゲームは、
難しい ≠ 操作しづらい
である。
入力遅延や過剰な慣性で難しくしない。
難しさは、
- Platform位置
- Fall distance判断
- Momentum management
- Risk selection
から作る。
59. QA
最低限：
- Desktop起動
- Mobile起動
- Tutorial
- DROP
- Left
- Right
- Landing
- Hard Landing
- Fatal Fall
- Scroll
- Procedural generation
- 1000m milestone
- Endless generation
- Score
- BEST
- Pause
- Return to arcade
- Reload
- Performance
60. Automated Pattern Test
可能なら、
Platform GeneratorについてSimulation。
確認：
- unreachable configuration
- impossible horizontal distance
- no-safe-platform state
- overlapping platform
- screen outside spawn
等がないこと。
61. Web Mini Game Arcade統合
Game015完成後、
既存Game Catalogへ追加。
Catalog Entry
邦題
落下キング
英題
FALL KING
表示タイトル
落下キング ～FALL KING～
Tagline
上を目指すな。うまく落ちろ。

Genre
Precision / Action
62. Thumbnail
ゲームセンター用Thumbnailを作成。
構図：
- 主人公が落下中
- 上下にPixel Platform
- 下方向へ長い空間
- 明確な8bit / Famicom風
一目で、
「下へ落ちていくゲーム」
と分かる。
63. ThumbnailもPixel Art
Portal内でこのGameだけ現代Illustrationにしない。
実ゲームVisualに合わせる。
64. Analytics Metadata
Game015：
{
  "id": "game015",
  "titleJa": "落下キング",
  "titleEn": "FALL KING",
  "genre": [
    "precision-action",
    "vertical-descent",
    "arcade"
  ],
  "core_mechanic": [
    "controlled-falling",
    "platform-landing",
    "momentum"
  ],
  "primary_input": [
    "left",
    "right",
    "drop"
  ],
  "skill_axes": [
    "spatial-estimation",
    "momentum-control",
    "risk-management"
  ],
  "escalation_mechanic": "endless-depth",
  "score_type": "depth-meters"
}

既存Schemaに合わせて調整可。
65. Telemetry
既存共通Eventに加えて、
- depth_reached
- fall_distance
- landing_type
- nice_drop
- platform_type
- milestone_reached
等を記録可能にする。
将来的に、
「何m付近で死ぬ人が多いか」
を分析できるようにする。
66. Visual Quality Gate
既存共通Visual Reviewを実施。
ただしPixel Artなので、
「情報量が少ない＝低品質」
とは評価しない。
評価対象：
- Pixel Art consistency
- Palette
- Sprite readability
- Tile quality
- Animation clarity
- Retro authenticity
- Modern playability
67. 重要な禁止事項
以下は禁止。
1
Retro風Fontを付けただけの現代Vector Game。
2
高解像度IllustrationをPixelated Filterで縮小しただけ。
3
意図のないRandom Platform生成。
4
初見では絶対避けられない配置。
5
過度なInput Lag。
6
画面外のPlatformへBlind Dropさせる。
68. 下方向の視界
非常に重要。
主人公より、
下方向を多めに見せる。
例えば、
Playerを画面中心よりやや上に配置。
これにより次のPlatformを確認可能にする。
69. Blind Drop防止
次Platformが画面外の場合、
落ちる前に何も分からない状態は禁止。
Camera Look Down等を複雑に追加するより、
基本Camera Compositionで、
常に2〜3段先程度を見られる設計を優先。
70. Final Completion Criteria
以下をすべて満たす。
1. Game015がBrowserで遊べる
2. Vertical descent成立
3. DROP操作
4. Air control
5. Momentum
6. Fall distance system
7. Safe / Hard / Fatal landing
8. Depth Score
9. BEST
10. Platform Pattern Generation
11. Endless Mode
12. 1000m milestone
13. Famicom-style Pixel Art
14. Chiptune Audio
15. Tutorial + Practice
16. Desktop
17. Mobile
18. Game Center Catalog追加
19. Thumbnail追加
20. Build成功
21. Game Feel Review
22. Visual Review
23. QA完了
71. Main Agentへの最終指示
Game015の成功条件は、
「ただ下に落ち続けられるゲーム」
ではない。
プレイヤーが、
次はあの足場へ落ちよう
ここならもう一段飛ばせるか
横に流れすぎた
ギリギリ着地できた！

と考えられること。
特に、
「下へ行きたいほど、落ちすぎる危険が増える」
という矛盾をGame Designの中心に置く。
Visualは、
本当に昔のファミコンで遊んでいるようなPixel Art
を目指しつつ、
入力レスポンス・画面視認性・Responsive Designは現代的に高品質にする。
完成後、
Web Mini Game Arcadeの15本目としてCatalogへ統合する。
以上を理解したうえで、
Art Direction
↓
Prototype
↓
Gameplay Implementation
↓
Game Feel Review
↓
Visual Review
↓
QA
↓
Portal Integration
まで完了させること。