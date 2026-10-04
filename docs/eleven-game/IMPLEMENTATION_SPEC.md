Web Mini Game Arcade
Game011実装 ＋ 11ゲーム統合ポータル ＋ 既存ゲームUX/Visual改善
統合実装指示書
0. 今回のタスク概要
現在実装済みのGame001〜Game010に加え、
Game011
ウンコかウコンかゲーム ～UNKO or UKON～
を新規実装する。
同時に、
Game001〜Game011 合計11本
を一覧から選択して遊べる、
Web Mini Game Arcade 試作版
をGitHub上で公開可能なWebページとして実装する。
さらに既存ゲームについて以下を改善する。
Game007
まだ乗れます ～ELEVATOR OVERLOAD～
ルール・重量・判断対象が分かりづらいため、UI/UXを全面改善する。
Game008
コーヒーこぼすな ～COFFEE WALK～
- コーヒーがどちらへ傾いているか分かりづらい
- 距離m表示が見づらい
- 重要情報がゲーム画面外にある
- 文字が小さい
という問題を解消する。
Game010
会議、聞いてます？ ～MEETING SURVIVAL～
プレイヤーの手元グラフィックが同僚キャラクター等と比較してチープなため、Art Direction / Image Generation Skillを利用して作り直す。
さらに、
Game001〜Game011すべて
について、
ゲーム開始時に「簡単な説明＋実際に操作する短い練習」を必ず用意する。
1. 今回の優先順位
優先順位は以下。
1. 全11ゲームが正常に遊べる
2. 初見ユーザーがルールを理解できる
3. 各ゲームの操作を短い練習で体験できる
4. Game011を完成させる
5. Game007 / 008の情報設計を改善する
6. Game010のVisual Qualityを改善する
7. 11ゲームを魅力的に一覧表示する
8. GitHub Pages上で安定して動作する
2. CREDITについて
今回のWeb Mini Game Arcadeは、
試作版 / 人間プレイテスト版
とする。
したがって、
CREDITによるプレイ制限は無効化する。
広告も実装しない。
ユーザーは好きなゲームを好きなだけ遊べる。
既存の、
- CreditService
- Rewarded Ad Stub
- CREDIT関連コード
を将来のために残してよい。
ただし試作版では、
creditsEnabled = false

等のFeature Flagによって無効化すること。
将来簡単に再有効化できる構造にする。
3. 最重要：全11ゲーム共通Onboarding
今回から、
「説明 → 練習 → 本番」
を全ゲーム共通のUX仕様候補として導入する。
ただ文章を読ませるだけではなく、
実際に一度操作して理解させること。
4. 初回プレイ時
各ゲームをブラウザ上で初めて起動した場合、
原則として以下の順。
タイトル
↓
かんたんな説明
↓
PRACTICE / 練習
↓
練習成功
↓
本番スタート

説明だけ見ていきなり本番にはしない。
5. 2回目以降
LocalStorage等で、
tutorialCompleted

を保存。
2回目以降は、
[ すぐ遊ぶ ]

[ 練習する ]

のように、
本番へ直接進めるようにする。
毎回強制チュートリアルを見せない。
6. 練習モード共通ルール
練習中は、
- SCOREに反映しない
- BESTに反映しない
- CREDITを消費しない
- Game Over扱いにしない
- Telemetry上も本番RUNと区別する
こと。
例えば、
tutorial_start
tutorial_step_complete
tutorial_complete
tutorial_skip

等で記録してよい。
7. 練習時間
目安：
5〜20秒
長いTutorialは禁止。
基本操作を一度体験できればよい。
8. 説明文の思想
長文を読ませない。
理想：
避けるだけ。
← → でレーン移動。

程度。
その後、
実際にやらせる。
9. 説明UI
各ゲームの世界観に合わせてよい。
ただし、
- 文字が小さい
- 説明が画面外
- 何を押すか分からない
状態は禁止。
10. Game001練習
軌道をズラせ！ ～ORBIT SHIFT～
説明：
障害物が来たら、
タップ / SPACEで軌道を切り替えよう。

練習：
1. プレイヤーをゆっくり移動
2. INNER軌道に固定障害物
3. 「今！」等を表示
4. 軌道を切り替えさせる
5. 回避成功
表示：
OK！
あとは生き残るだけ。

本番。
11. Game002練習
ゆううつな月曜日 ～WORKDAY DODGE～
説明：
左右へ移動して、
ぶつかりおじさんを避けよう。

練習：
1. CENTERから開始
2. 前方に固定おじさん
3. 左または右へ移動
4. 回避成功
5. もう一体反対側から出す
6. 再度回避
最後：
弊社まで1000m。
無事に着けるでしょうか。

NICE DODGEの説明は必須ではない。
ゲーム中に発見できるBonusとしてよい。
12. Game003練習
我が国の建築は世界一ぃ！ ～DROP TOWER～
説明：
タイミングよく落として、
どんどん積み上げよう。

練習：
- 非常にゆっくり左右移動するBlock
- 幅広の土台
- 1つDROP
- 成功
PERFECTだった場合：
PERFECT！
真ん中ほど高得点。

通常成功でも、
OK！
崩さず積めば大丈夫。

13. Game004練習
あなたの短期記憶、無事ですか？ ～ECHO GRID～
説明：
光った順番を覚えて、
同じ順番で押してください。

練習：
左上
↓
中央

等の2入力Sequence。
正しく入力。
成功：
その調子です。
本番は少しずつ長くなります。

14. Game005練習
右往左往の仕分け術 ～SORT SHIFT～
このゲームは特にTutorialを丁寧にする。
説明：
今のルールに従って
左か右へ仕分けます。

例：
丸い → 左
角ばった → 右

練習1：
丸いObject。
左を押す。
練習2：
角ばったObject。
右を押す。
その後、
途中でルールが変わります。

と表示。
短いRule ChangeのDemoを1回見せてもよい。
15. Game006練習
ギリギリ駐車 ～PARK IT!～
説明：
2回押すだけ。
①角度
②勢い

練習：
非常に広いParking Space。
STEP1：
Angle Gaugeを止める。
STEP2：
Power Gaugeを止める。
車が移動。
成功しやすい設定。
表示：
入りました。
本番はもう少し狭いです。

16. Game007練習
まだ乗れます ～ELEVATOR OVERLOAD～
説明：
最大重量を超えないように、
「乗せる」か「見送る」を選ぼう。

練習：
現在：
200 / 450kg

次：
60kg

乗せた場合：
260 / 450kg

実際に「乗せる」を押す。
次：
現在：
410 / 450kg

次：
80kg

乗せると：
490 / 450kg
40kgオーバー

ここでは、
見送る
を選ばせる。
成功：
OK！
重量を見ながら判断しましょう。

17. Game008練習
コーヒーこぼすな ～COFFEE WALK～
説明：
コーヒーが傾く方向を見て、
左右でバランスを取ろう。

練習：
ゆっくりした固定の揺れを発生。
画面に、
← 左に傾いています

等を大きく表示。
反対方向へ入力させ、
Balance Gaugeが中央へ戻ることを体験。
成功：
OK！
こぼさず運びましょう。

18. Game009練習
印鑑どこですか ～STAMP HUNT～
説明：
指示された物を
机の中から探してタップ。

練習：
少数Objectだけ配置。
例えば、
赤い印鑑を探してください。

正しいObjectを押す。
成功：
発見！
本番では机がもっと散らかります。

19. Game010練習
会議、聞いてます？ ～MEETING SURVIVAL～
説明：
内職するとスコアUP。
でも質問される前に「聞く」に戻ろう。

練習：
STEP1
SIDE WORKへ切替。
Scoreが増える様子を見せる。
STEP2
上司の視線・「ところで…」等の予兆。
画面上に、
あやしい……

程度の補助。
LISTENへ戻す。
質問回避成功。
表示：
バレませんでした。
本番では自分で察してください。

20. Game011練習
ウンコかウコンかゲーム ～UNKO or UKON～
説明：
出てきたものが
ウンコかウコンか答えるだけです。

練習では時間制限なし。
画像1枚表示。
選択肢：
ウンコ
ウコン

左右位置ランダム。
正解。
表示：
簡単ですね。
本番も最初だけは。

その後本番。
21. GitHub / Deploy
現在のGitHub Repositoryを使用。
GitHub Pagesで公開可能な構成にする。
必要なら、
.github/workflows/

へBuild / Deploy Workflowを追加。
Vite等を使用している場合、
https://username.github.io/repository-name/

のSub Pathでも、
- JS
- CSS
- Image
- Generated Assets
- Game Assets
が正常に読み込めるようにする。
22. Routing
GitHub Pagesで直接Refreshして404にならない構成にする。
必要ならHash Routing。
例：
/#/
/#/game/001
/#/game/002
...
/#/game/011

既存構成に合わせて合理的に選択。
23. Web Mini Game Arcade TOP
TOPには、
WEBミニゲーセン
副題：
WEB MINI GAME ARCADE
を表示。
短いコピー：
すぐ遊べて、なぜかもう一回やりたくなる。
ちょっと変なミニゲーム置き場。

文言はArt Director判断で軽く調整してよい。
24. Portal Design
単なるリンク集にしない。
ユーザーが、
次はどれにしよう？

と思える、
ゲームセンターとしての一覧画面
にする。
25. Game Card
各ゲームについて、
- Thumbnail
- 邦題
- English Title
- 短い煽り文句
- PLAY
を表示。
Card全体Clickも可。
26. Desktop
目安：
3〜4列。
ただしThumbnailを小さくしすぎない。
Viewportに応じResponsive。
27. Mobile
1〜2列。
タイトルを潰さない。
Tap Areaを十分大きく。
28. Font
これまでのFeedbackを反映。
- 日本語が読みやすい
- 少しポップ
- 固すぎない
- 安っぽすぎない
統一Fontでもよい。
Title用FontとUI Fontを分けてもよい。
29. Thumbnail
11ゲームすべてにThumbnail。
実際のGame Visualに基づく。
Image Generation Skillを利用してよい。
ただし、
実ゲームより豪華な架空画面を宣伝に使わない。
30. Game Catalog
Portal Dataを一か所へ集約。
例：
src/data/gameCatalog.ts

または、
games.json

各Game：
id
titleJa
titleEn
tagline
thumbnail
route
releaseOrder

等。
将来Game012以降を追加するとき、
Catalog追加だけでCardが増える構造にする。
31. Game001
邦題：
軌道をズラせ！ ～ORBIT SHIFT～
煽り：
押すのは一回。間違うのは一瞬。

32. Game002
ゆううつな月曜日 ～WORKDAY DODGE～
煽り：
弊社まで1000m。出勤するか、人生を変えるか。

33. Game003
我が国の建築は世界一ぃ！ ～DROP TOWER～
煽り：
積め。15mを超えた先は、責任を持てません。

34. Game004
あなたの短期記憶、無事ですか？ ～ECHO GRID～
煽り：
光った順番、覚えてますよね？

35. Game005
右往左往の仕分け術 ～SORT SHIFT～
煽り：
ルールは簡単。途中で変わるまでは。

36. Game006
ギリギリ駐車 ～PARK IT!～
煽り：
あと3cm。たぶん入る。たぶん。

37. Game007
まだ乗れます ～ELEVATOR OVERLOAD～
煽り：
あと82kg。乗せる？見送る？責任はあなたです。

38. Game008
コーヒーこぼすな ～COFFEE WALK～
煽り：
一滴もこぼさず、部長の分まで持っていけ。

39. Game009
印鑑どこですか ～STAMP HUNT～
煽り：
片づけるか、倍率を取るか。印鑑はたぶんそこ。

40. Game010
会議、聞いてます？ ～MEETING SURVIVAL～
煽り：
聞くふりをしながら、仕事を進めろ。

41. Game011
ウンコかウコンかゲーム ～UNKO or UKON～
煽り：
絶対わかる。0.5秒になるまでは。

42. Game画面から戻る
各ゲームに、
← ゲームセンターへ

を配置。
Gameplay中の誤Tapを避ける。
Pause / Result / Headerなど安全な場所を使用。
43. Desktopゲーム画面
以前から、
PCでゲーム画面が小さい
というFeedbackがある。
統合後は、
ゲームがViewportの主役になるようにする。
目安：
Viewport Heightの80〜90%程度
まで有効活用。
余白を取りすぎない。
Game007
まだ乗れます ～ELEVATOR OVERLOAD～
UI/UX全面改善
44. 問題
現在、
- 現在重量
- 最大重量
- 次の対象
- 乗せた結果
- 降りるタイミング
- 操作
が直感的に分かりにくい。
これを解消する。
45. 現在重量
Gameplay領域内に大きく表示。
例：
現在
326 / 450 kg

46. Weight Gauge
視覚化。
例：
326kg        MAX 450kg
██████████████░░░░░

あと124kg

色だけに依存しない。
47. 次の対象
中央付近。
Visual＋Weight。
例：
次の乗客

会社員
82kg

48. 乗せた結果
重要。
現在 326kg
＋     82kg
────────
408 / 450kg

を明確表示。
49. Over時
例えば、
468 / 450kg

18kgオーバー！

と分かる。
ただし色だけで答えを教えすぎない。
50. 操作
曖昧なLEFT / RIGHTだけにしない。
[ 見送る ]    [ 乗せる ]

PC：
← / A
→ / D

Mobile：
Tap。
51. 降車
降車が起きたら明示。
例：
8F

2人降ります
-136kg

↓
Gauge Animation
↓
次の判断。
いつの間にか重量が変わらないこと。
52. Destination
既存Dataとして降車階があるなら、
68kg → 8F

のように表示。
新しい複雑なロジック追加より、
既存情報の可視化を優先。
53. 情報優先順位
1. 現在重量
2. 最大重量
3. 次の重量
4. 乗せた後
5. 乗せる / 見送る
6. Floor
7. Score
8. その他
Game008
コーヒーこぼすな ～COFFEE WALK～
HUD / Gameplay Readability改善
54. 現状問題
現在、
- どちら側へコーヒーが傾いているのか
- どちらへ入力すればよいか
- 現在何m進んでいるのか
が分かりにくい。
理由：
- 重要UIがGameplay Area外にある
- 字が小さい
- Balance情報が直感的でない
今回、
Gameplay HUDを全面的に再設計する。
55. 最重要原則
プレイヤーが操作中に見るべき情報は、
必ずゲーム画面内に表示する。
ゲーム画面外のWeb UIに重要Gameplay情報を置かない。
特に、
- Tilt
- Distance
- Coffee Remaining
はGameplay CanvasまたはGameplay Overlay内。
56. Distance
現在距離：
348 m

を大きく表示。
配置候補：
画面上部中央または左上。
Desktop：
視認できる大きなFont。
目安：
32〜48px相当。
Mobile：
26〜36px相当。
単なる目安なのでResponsiveに調整。
57. Balance Direction
現在、
コーヒーがどちら側へ傾いているのかを、
文字だけではなく図形でも分かるようにする。
例：
←     ●───────|───────○     →
LEFT           CENTER         RIGHT

あるいは、
← 左に傾いています

を大きなArrowと併記。
58. Balance Meter
推奨：
画面中央上部またはPlayer付近。
左            安定             右
←─────────●─────────→

Pointerが現在のCoffee偏りを示す。
中央：
安全。
端：
こぼれやすい。
59. 文字だけに頼らない
日本語を読む余裕がない状況でも、
大きなArrowとGaugeで理解できること。
例えば、
左へ傾いている場合：
← ←

右なら：
→ →

等。
60. Cup Visual
可能なら、
カップ自体・液面の傾きでも現在状態を視覚化。
つまり、
HUDを見なくても、
「今右にこぼれそう」
とある程度理解できる。
HUDは補助。
61. Coffee Meter
Coffee残量：
COFFEE
82%

もGameplay領域内。
Distanceより優先度は低いが、
小さすぎないこと。
62. HUD Priority
Game008：
1. Balance Direction
2. Player / Cup
3. Distance
4. Coffee Remaining
5. Score / Bonus
6. その他
とする。
63. Visual Noise
HUDを増やした結果、
画面がUIだらけにならないこと。
重要情報のみ。
装飾より可読性。
64. Game008練習との連携
Tutorial中、
HUDを実際に使って説明。
例：
今は左へ傾いています
        ←

↓
Right入力
↓
Meter中央へ。
こうして、
HUDの読み方そのものを練習
させる。
65. Game008 QA
確認：
- PCでTilt方向を即判断できる
- Mobileでも即判断できる
- Distanceがプレイ中に常に読める
- Coffee残量が読める
- HUDがGame Area内
- 小さい文字に依存していない
- Game Screen外を見る必要がない
Game010
会議、聞いてます？ ～MEETING SURVIVAL～
Player Hands Visual Redesign
66. 現状問題
ゲーム中の、
プレイヤーの手元
のGraphicsが、
同僚キャラクター等のVisualと比較して、
- 単純
- チープ
- 仮素材感が強い
- 画風のQualityが揃っていない
状態。
67. 改善対象
主として、
- プレイヤーの腕
- 手
- Desk周辺
- PC / Keyboard
- Notebook等
- LISTEN状態
- SIDE WORK状態
のForeground Visual。
68. Art Director
既存Game010の、
- 同僚
- 上司
- 会議室
- Character Style
を確認。
そのArt Qualityに合わせる。
新しい別画風を導入しない。
69. Image Generation Skill
Codex Image Generation Skillを積極使用。
まず、
Player POV / Foreground Concept
を作る。
視点：
プレイヤーから会議室を見る。
Foregroundに、
- Arms
- Hands
- Desk
- Work Item
が存在。
70. LISTEN状態
例えば、
- 手を机に置いている
- Penを持つ
- Notebookを開いている
など、
「会議を聞いている」
Visual。
71. SIDE WORK状態
例えば、
- Keyboardを打つ
- 別資料へ入力
- Mouse操作
など。
LISTENとの違いが一瞬で分かる。
72. Character Consistency
最重要。
Handsだけ、
- Photorealistic
- 3D
- 別画風
にならない。
同僚等と、
- Line
- Shading
- Perspective
- Color
- Stylization
を揃える。
73. Animation
必要なら、
LISTEN
⇔
SIDE WORK
切替時に短いAnimation。
例えば、
手がKeyboardへ移る。
大げさなAnimation不要。
74. Visual Reviewer
修正前後Screenshot比較。
以下を確認：
- 手だけ仮素材に見えない
- 人物と同じArt Quality
- 手の形が不自然でない
- Gameplay Stateが明確
- 画面下部がチープに見えない
Game011
ウンコかウコンかゲーム ～UNKO or UKON～
75. 基本
表示されたものが、
ウンコ
か
ウコン
か判断する。
1ミス：
即Game Over。
76. Phase構成
PHASE 1
画像問題 ×10

↓
PHASE 2
テキスト問題 ×10

↓
FINAL MODE選択

↓
0.5秒エンドレス

77. Image Generation
Codex Image Generation Skillを使用。
ウンコ
10種類。
ウコン
10種類。
計20種類。
78. ウンコVisual
リアル禁止。
グロ禁止。
汚物感を強くしない。
ポップなゲームアイコン風。
10種類にVariation。
79. ウコンVisual
- 黄色〜Orange
- 根茎
- 植物として認識可能
- ポップ
ウンコとは明確に異なる。
難しさを画像の曖昧さから作らない。
80. Image Question 1
回答時間：
5秒
選択：
ウンコ
ウコン

左右：
ランダム。
81. Question 1正解後
一旦停止。
表示：
正解です。
ここから先は1秒です。
考えている暇はありません。

Inputで続行。
82. Image Question 2〜10
回答時間：
1.0秒。
左右配置：
毎問独立Random。
83. Image Pool
20枚Shuffle。
RUNごとに10枚。
同一RUN重複なし。
84. Text Phase開始
10問正解後：
画像では余裕でしたね。
では、文章でいきます。

85. Text Question
最初はQuestion Textのみ。
Choiceはまだ出さない。
読む時間：
無制限。
86. Choice表示
Playerが、
- Tap
- Click
- Space
- Enter
等で準備完了。
その後、
ウンコ
ウコン

表示。
その瞬間から、
0.8秒。
87. Input Guard
Choice表示用Inputが、
回答として流用されないようにする。
keyup待ち等。
88. Question Pool
20問。
RUNごとRandom 10問。
Q01
トイレで出会う可能性が高いのはどっち？
正解：ウンコ
Q02
カレーの香辛料として使われるのはどっち？
正解：ウコン
Q03
犬の散歩中、袋に入れて持ち帰るのはどっち？
正解：ウンコ
Q04
健康食品売り場で見かける可能性が高いのはどっち？
正解：ウコン
Q05
道で踏んだらかなり嫌なのはどっち？
正解：ウンコ
Q06
黄色っぽい植物の根茎なのはどっち？
正解：ウコン
Q07
「ちゃんと流した？」と言われそうなのはどっち？
正解：ウンコ
Q08
粉末になって料理に使われることがあるのはどっち？
正解：ウコン
Q09
トイレットペーパーとの関係が深いのはどっち？
正解：ウンコ
Q10
ショウガの仲間なのはどっち？
正解：ウコン
Q11
検便で提出するものなのはどっち？
正解：ウンコ
Q12
サプリメントの商品名で見かけそうなのはどっち？
正解：ウコン
Q13
公園でうっかり踏みたくないのはどっち？
正解：ウンコ
Q14
畑で育てて収穫できるのはどっち？
正解：ウコン
Q15
水洗トイレのレバーを押す理由になりやすいのはどっち？
正解：ウンコ
Q16
飲み会前のドリンク商品で見かける言葉はどっち？
正解：ウコン
Q17
便器の中にあっても特に不思議ではないのはどっち？
正解：ウンコ
Q18
料理を黄色っぽくする香辛料として使われるのはどっち？
正解：ウコン
Q19
人間のお腹から出てくるのはどっち？
正解：ウンコ
Q20
食材・香辛料として利用されるのはどっち？
正解：ウコン
89. 20問Clear
表示：
20問正解。
もうウンコとウコンを
見間違えることはないでしょう。
たぶん。

90. Final Mode
選択：
ウンコMODE
または
ウコンMODE
選択時間：
無制限。
91. ウンコMODE
毎Round、
ウンコ
ウコン

左右Random。
常に、
ウンコ
を押す。
92. ウコンMODE
同様。
常に、
ウコン
を押す。
93. Final Time
回答時間：
0.5秒。
正解したら即次Round。
無限。
94. 最重要Randomization
Phase1
Phase2
Final
すべて、
Choice Left / Rightを毎回Random。
同じSideが何回か連続してもよい。
固定Patternは禁止。
95. Button Design
ウンコ / ウコンButtonは、
- 同じColor
- 同じShape
- 同じSize
- 同じFont
とする。
色で判別できないこと。
96. Score
Image：
1問 +100。
最大1000。
Text：
1問 +150。
最大1500。
Final：
1問 +250。
さらにReaction Bonusを追加可能。
ランキングではFinal Streakが重要になる設計。
97. Result
最低限：
SCORE

画像問題
x / 10

テキスト問題
x / 10

FINAL MODE

FINAL STREAK

BEST

98. Result Comment
例：
序盤：
まずは落ち着いて見ましょう。

Text：
知識はある。反射が足りない。

Final到達：
ここから先に知識は必要ありません。

Final 30：
判断が速すぎます。

Final 50：
ウンコとウコンに人生を捧げています。

Final 100+：
何のためにここまで？

99. Game011 Visual
方向：
POP / CLEAN / ABSURD
ネタ題材だが、
Visual Qualityは高くする。
雑なネタゲームに見せない。
100. Game011 Thumbnail
ウンコ・ウコン両方が分かる。
二択Gameであることが伝わる。
リアルな排泄物は禁止。
101. Popular Ranking
今回はBackend Rankingをまだ実装しない。
- 人気ランキング
- 急上昇
- 今日の人気
等は将来。
Fake Rankingは禁止。
102. Future Ranking Support
Game Catalogへ将来、
playCount
rating
rank

等を追加できる構造にする。
103. Portal Analytics Stub
必要なら、
portal_open
game_card_click
game_launch
return_to_portal

を trackEvent() 経由で記録。
Server不要。
104. Art / Image Generation
今回、
Game010とGame011では特に、
Codex Image Generation Skillを積極利用する。
Portal Thumbnailにも利用可。
ただし、
Game Asset
+
Code Drawing
+
Animation
+
UI
を統合し、
画像を貼っただけにしない。
105. Visual Review
最低限、
Desktop：
1440×900相当。
Mobile：
390×844相当。
についてScreenshot。
以下を見る。
Portal
- Cardが魅力的か
- Thumbnailが小さくないか
- Fontが固くないか
- 同じTemplateの色違いに見えないか
Game007
- Weight判断が一瞬で可能か
Game008
- Tilt方向が一瞬で分かるか
- m表示が見えるか
Game010
- 手元が他のCharacterに比べてチープではないか
Game011
- 画像がポップか
- Choiceが読みやすいか
106. QA：共通Tutorial
Game001〜011すべてについて、
- 初回Tutorial表示
- 説明
- Practice実行
- Practice成功
- Main Game開始
- Practice中Score変化なし
- Practice中BEST変化なし
- 2回目起動でSkip可能
- 「練習する」で再練習可能
を確認。
107. QA：Portal
- 11 Game Cards
- 11 Thumbnail
- Japanese Title
- English Title
- Tagline
- Game Launch
- Back to Portal
- Desktop
- Mobile
- Refresh
- Asset Paths
- GitHub Pages
108. QA：Game007
- Weight UI
- Current / Max
- Next Weight
- Projected Weight
- Board
- Reject
- Passenger Exit
- Tutorial
- Game Over原因
109. QA：Game008
- DistanceはGame Area内
- Distance Font十分大
- Balance Meterが見える
- Left / Right Tilt判別
- Coffee Remaining見える
- Desktop
- Mobile
- TutorialでHUDを理解できる
- Game Screen外を見る必要なし
110. QA：Game010
- LISTEN Hands
- SIDE WORK Hands
- State Visual差
- CoworkerとのArt Quality差がない
- Perspectiveが自然
- Desktop/Mobile
- Performance
111. QA：Game011
- 20画像
- Image Question 10問
- Q1 5sec
- Q2〜10 1sec
- Text Question Pool 20
- Random 10
- Reading unlimited
- Choice 0.8sec
- Final Mode
- Final 0.5sec
- Random Left/Right
- 1 Mistake End
- Score
- Best
- Tutorial
- PC/Mobile
112. Random Test
Game011について、
数千Round程度をSimulation可能なら実行。
ウンコ / ウコンの左右配置が、
概ね50:50
となっていること。
Hard coded位置がないこと。
113. Build
最低限：
npm install
npm run build

成功。
可能ならPlaywright。
特に、
Portal
↓
Game
↓
Tutorial
↓
Gameplay
↓
Portal

をSmoke Test。
114. README更新
READMEへ、
- Local Run
- Build
- Deploy
- GitHub Pages
- Game追加方法
- Catalog追加方法
- Thumbnail
- Tutorial実装方法
- CREDIT Feature Flag
を記載。
115. 今後のGame追加仕様として残すもの
今回実装する、
Universal Onboarding
Explanation
↓
Interactive Practice
↓
Game

は、
Game012以降の共通仕様候補とする。
新Gameを作成する場合、
必ず、
5〜20秒程度で基本操作を体験できるPractice
を設計する。
ただし、
ゲームの面白い秘密
特殊Mode
隠し要素
までTutorialで説明しない。
教えるのは、
「最低限遊ぶために必要なこと」
だけ。
116. Tutorialでネタバレしない
例えば、
ゆううつな月曜日
「1000mで旅に出られる」
ことはTutorialで説明しない。
DROP TOWER
「15mでC国MODE」
も説明しない。
COFFEE WALK
部長や会長のCoffee追加も説明しない。
これらは、
上手く遊んだ人への発見
として残す。
117. Human Playtest
従来のA〜Jに加え、
全Game共通で、
K
説明を読めばルールを理解できたか。
L
Practiceで操作方法を理解できたか。
M
Practiceが長すぎなかったか。
N
本番開始時に「何をすればよいか」が分かったか。
も確認可能にする。
118. 完成条件
今回のTaskは以下すべてを満たして完了。
Web Mini Game Arcade
- 11ゲーム一覧
- Thumbnail
- Titles
- Taglines
- Responsive
- GitHub Pages
- Game Catalog
Universal Tutorial
- 11ゲーム全部
- Explanation
- Practice
- Skip on repeat
- Replay Practice可能
Game007
- UI全面改善
- Weight情報明確
Game008
- Tilt表示改善
- Distance改善
- Gameplay Area内HUD
- Font大型化
Game010
- Hands / Foreground Redesign
- Image Generation利用
- Art Quality統一
Game011
- 全仕様実装
- Image Generation
- 3 Phases
- Score
- Random Choice
- PC / Mobile
Technical
- Build成功
- Regression Test
- Visual Review
- QA
119. Main Agentへの最終指示
このTaskでは、
単にGame011を追加してリンクを並べるだけではない。
目的は、
「誰かにURLを渡したら、説明なしでも11本全部遊べる状態」
を作ることである。
特に、
「何をすればよいか分からない」
という状態を全ゲームから可能な限り排除する。
ただし、
隠し展開・特殊モード・ネタ要素まで最初に説明して、
ゲームの発見する楽しさを奪ってはいけない。
基本操作だけ説明する。
その後、
実際にプレイヤー自身に発見させる。
また、
Game008ではGameplay中の重要情報を必ずGame Area内へ配置し、
「画面の外を見る必要がある」
状態をなくす。
Game010では、
Foreground Handsを、
同僚等と同等以上のArt Qualityへ改善する。
Codexの、
- Art Director
- Image Generation Skill
- Gameplay Engineer
- UI / Frontend Agent
- Game Feel Reviewer
- Visual Reviewer
- QA
を適切に利用する。
最終的には、
11本のゲームを一覧から選び、数秒の説明と練習だけで誰でも遊び始められる、小さなWebゲームセンター
として完成させること。
以上を理解したうえで実装を開始すること。