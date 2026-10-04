# Web Mini Game Arcade
# Game002〜Game005 Visual Redesign 指示書

## 0. 今回のタスク

既に実装済みの以下4ゲームについて、

- Game002 WORKDAY DODGE
- Game003 DROP TOWER
- Game004 ECHO GRID
- Game005 SORT SHIFT

**ゲームロジックを変更せず、ビジュアルデザインのみ全面的に改善する。**

現在、一部ゲームについて、

「ゲームとしては成立しているが、画面がチープで試作品感が強い」

という人間評価が出ている。

今回の目的は、

**ゲームプレイを変えずに、商用Webミニゲームとして公開できる視覚品質へ引き上げること**

である。

---

# 1. 最重要制約

以下は原則として変更禁止。

- ゲームルール
- 操作方法
- CREDIT仕様
- スコア計算
- 難易度
- 敵出現ロジック
- Pattern
- プレイヤー速度
- 衝突判定
- 物理パラメータ
- RUN時間設計
- Telemetry仕様
- LocalStorage仕様
- Reward Stub
- Game Over条件

今回の対象は、

**Visual / Art / UI presentation / Animation / Effects**

のみ。

視覚変更のために技術的調整が必要な場合でも、

ゲームフィールや難易度が変化しないようにする。

---

# 2. Codex Image Generation Skillを積極的に使用する

今回のVisual Redesignでは、

**CodexのImage Generation Skillを正式な制作工程として使用すること。**

「必要なら使う」ではない。

各ゲームについてArt Directorが最初に、

1. 何をコード描画するか
2. 何を画像生成するか
3. 何をHybridにするか

を判断する。

画像生成スキルは、

- キャラクター
- 背景
- 小物
- テクスチャ
- UI装飾
- タイトル画面素材
- サムネイル
- コンセプトアート
- Visual Reference

などに使用してよい。

---

# 3. 画像生成の基本思想

画像生成は、

「とにかく画像を増やす」

ために使わない。

画像生成を使うことで、

**ゲームの個性・世界観・完成度が向上する部分**

に使用する。

逆に、

- 当たり判定
- 精密な位置情報
- 数字
- スコア
- インタラクティブボタン
- 正確なGrid
- 可変テキスト

などはコード側で描画する。

---

# 4. Visual Production Pipeline

各ゲームについて必ず以下の順番で作業する。

```text
Existing Game
      ↓
Current Screenshot Capture
      ↓
Art Director
      ↓
VISUAL BRIEF
      ↓
Image Generation Skill
      ↓
Visual Assets / Concept
      ↓
Gameplay Engineer / UI Engineer
      ↓
Game Integration
      ↓
Desktop Screenshot
      ↓
Mobile Screenshot
      ↓
Visual Reviewer
      ↓
PASS / FAIL
      ↓
必要なら修正
      ↓
最大3 Iterations
```

---

# 5. 最初に現状を保存する

変更前にGame002〜005それぞれについて、

Desktop

および

Mobile

のスクリーンショットを保存する。

例：

```text
docs/visual/before/game002-desktop.png
docs/visual/before/game002-mobile.png
```

以降も同様。

これはBefore / After比較に使用する。

---

# 6. Art Director Agent

今回から、

## Art Director

の役割を明確に追加する。

Art Directorはコード実装を担当しない。

担当：

- ゲーム世界の視覚方向
- キャラクターデザイン
- 背景方向
- 色彩設計
- UI方向
- アニメーション方向
- 画像生成対象選定
- サムネイル方向
- 禁止表現の決定

---

# 7. Asset / Image Generation担当

画像生成スキルを使用し、

Art DirectorのVisual Briefに従って必要アセットを作る。

生成した画像をそのまま無批判に採用しない。

以下を確認する。

- ゲーム中のサイズで読める
- 他アセットと画風が揃っている
- 視認性を損なわない
- 背景とキャラクターが混ざらない
- スマートフォン縮小時にも成立する
- 不自然な文字が入っていない
- 不要な透かしや文字がない
- 必要なら背景透過
- アスペクト比が用途に適切

---

# 8. Visual Reviewer

実装担当とは別の役割として、

## Visual Reviewer

を使用する。

Visual Reviewerは、

「実装されているからOK」

と判断してはいけない。

実際のスクリーンショットを見て評価する。

---

# 9. Visual Reviewer評価項目

各ゲーム100点満点。

### A. Visual Identity 15

一目見てそのゲーム固有の世界観が分かるか。

### B. Character / Object Appeal 15

主人公や主要オブジェクトに魅力があるか。

### C. Background Quality 10

背景に十分な情報量と奥行きがあるか。

### D. UI Integration 10

HUDがゲーム世界から浮いていないか。

### E. Composition 10

画面全体のバランスが良いか。

### F. Gameplay Readability 15

プレイヤー・敵・障害物等が瞬時に認識できるか。

### G. Motion / Effects 10

動きやエフェクトが完成度向上に寄与しているか。

### H. Production Value 15

試作品ではなく完成品に見えるか。

---

# 10. Visual Quality Gate

合格：

**80点以上**

かつ、

Gameplay Readability：

**12 / 15以上**

Production Value：

**12 / 15以上**

とする。

不合格の場合、

Visual Reviewerが具体的理由を記録。

Art Directorが修正方針を作成。

最大3回までVisual Revisionを行う。

3回で基準を満たさない場合：

`HUMAN ART REVIEW REQUIRED`

と記録する。

---

# 11. 全ゲーム共通で避ける表現

以下を安易に使用しない。

- 単なる単色背景
- 安易なグラデーション背景
- 何でもネオンGlow
- 黒背景＋発光図形だけ
- 巨大な角丸カードUI
- SaaSダッシュボード風UI
- 絵文字をゲームキャラクターとして使用
- 丸と四角だけの仮キャラクター
- Phaser primitiveを置いただけの見た目
- デバッグUIのような文字配置
- 画面中央を巨大HUDで占有
- 全ゲームで同じフォント・UIデザイン
- AI生成画像を背景に貼っただけの構成

---

# 12. 画像生成時の重要ルール

画像生成スキルには、

単一アセットだけでなく、

**同一ゲーム内で使用する複数アセットの一貫性**

を意識させる。

必要に応じて最初に、

`visual_reference.png`

または

`concept_sheet.png`

を生成する。

それを基準として、

- キャラクター
- 背景
- オブジェクト
- UI decoration

を展開する。

---

# 13. テキスト入り画像を極力避ける

ゲームタイトル等を除き、

画像生成された画像内に重要テキストを書き込まない。

理由：

- 誤字
- 多言語対応
- Retina対応
- Responsive対応

が困難になるため。

文字はHTML / Canvas / Phaser側で表示する。

---

# 14. Generated Asset管理

生成アセットは整理する。

例：

```text
assets/
  game002/
    concept/
    characters/
    backgrounds/
    props/
    ui/

  game003/
  game004/
  game005/
```

不要になった試行画像をproduction bundleへ含めない。

---

# 15. 最適化

生成画像はWebゲーム用途に最適化する。

必要に応じて、

PNG
WebP

等を使用。

極端に大きな画像をそのまま配信しない。

ゲーム画面上の使用サイズに対して合理的な解像度にする。

---

# GAME002
# WORKDAY DODGE
# 「ぶつからず出社せよ！」

## 16. Visual Mode

**ASSET DRIVEN**

Game002は今回もっとも画像生成を積極的に利用する。

---

# 17. Game002 Art Direction

テーマ：

**コミカルな朝の日本風都市通勤**

ただし、

子供向けすぎない。

企業広告のようにもならない。

少し漫画的で親しみやすく、

「変な状況なのに本人は真剣」

という温度感。

---

# 18. プレイヤー

主人公は、

出勤中のサラリーマン。

特徴：

- スーツ
- ビジネスバッグ
- 少し急いでいる
- シルエットで主人公と分かる
- 上から見ても進行方向が分かる
- 頭身は少しデフォルメ

画像生成スキルを使用して、

キャラクターVisual Referenceを作る。

---

# 19. ぶつかりおじさん

単なる主人公の色違いにしない。

複数Visual Variationを作る。

例：

- 大柄な会社員
- 新聞を見ながら歩く人
- スマホを見ながら歩く人
- 急いでいる人
- 荷物を持っている人

ただしゲーム上の敵TypeとVisual Varietyを混同しない。

ゲームロジックは変更しない。

---

# 20. Game002背景

以下の4エリアを画像生成スキルを活用して制作。

### 0〜250m

住宅街

### 250〜500m

商店街

### 500〜750m

駅前

### 750〜1000m

オフィス街

ただし巨大な1枚絵ではなく、

スクロールゲームとして利用しやすい構成を検討する。

必要なら、

- tiled background
- repeating element
- building layer
- road decoration

へ分割。

---

# 21. Game002 Visual Goal

ゲーム画面を見た瞬間、

「会社へ向かって街中を歩いている」

ことが分かること。

現在の試作品感を大幅に減らす。

---

# 22. Game002 UI

メインHUD：

`438 m`

を最優先。

背景の一部のように自然に配置する。

CREDITは小さく。

巨大な黒いUIパネル等は禁止。

---

# 23. Game002演出

衝突時：

コミカルだが派手すぎない。

- bag swing
- small impact burst
- character recoil

等。

画像アセットとコードエフェクトを組み合わせてよい。

---

# GAME003
# DROP TOWER

## 24. Visual Mode

**HYBRID**

コード物理＋生成アセット。

---

# 25. Game003 Art Direction

テーマ：

**小さな街を積み上げて空へ伸ばす建築アーケード**

単なる、

「茶色い箱を積むゲーム」

にしない。

---

# 26. 積む物体

現在の単純な四角形を、

画像生成スキルで作成した、

小型建築モジュール

へ置き換える。

例：

- office floor
- apartment floor
- cafe floor
- mechanical floor
- rooftop module

ただし当たり判定は既存のまま。

Visual SpriteとPhysics Shapeを分離する。

---

# 27. Game003世界

低い位置：

街並み。

高くなると：

- 遠景
- 空
- 雲
- 夕方
- 高高度

など、

高さを視覚的に感じられる構造にする。

ゲームルールは変更しない。

---

# 28. Game003画像生成対象

推奨：

- Building module set
- ground city background
- sky layers
- cloud layers
- construction crane / hook
- decorative rooftop elements

---

# 29. Game003 UI

工事現場を思わせる、

控えめなIndustrial UI。

ただし、

警告テープだらけ

のような安直な表現は禁止。

---

# 30. Game003 PERFECT演出

Perfect時、

積み上がった階層が一瞬気持ちよく固定されるような、

- snap effect
- small shine
- dust
- sound

を追加してよい。

ゲームロジックは変更しない。

---

# GAME004
# ECHO GRID

## 31. Visual Mode

**HYBRID / UI-FOCUSED**

ECHO GRIDは大量の画像アセットを使用しない。

このゲームは、

「画面の整理された美しさ」

を優先する。

---

# 32. Game004 Art Direction

テーマ：

**謎の記憶装置**

単なる、

「9個の光る四角」

から脱却する。

方向：

- retro electronic instrument
- strange laboratory device
- tactile control panel

の中間。

---

# 33. Image Generation Skillの用途

画像生成スキルで、

まず

**ECHO GRID装置全体のConcept Art**

を作る。

そのConceptを参考にコード側でUIを再構築する。

必要なら、

- panel frame
- small mechanical detail
- background device texture
- indicator decoration

のみ画像アセット化。

---

# 34. 3×3 Grid

最重要ゲーム要素のため、

Gridそのものはコード描画を基本とする。

理由：

- 正確なHit Area
- Responsive
- Flash制御
- animation
- input feedback

を維持するため。

ただしVisual DesignはConcept Artを反映。

---

# 35. Game004 Visual Goal

画面を見たとき、

「ただの記憶ゲーム」

ではなく、

**謎の装置を操作している**

という軽い世界観を感じられること。

---

# 36. 光表現

Flash時、

単なるOpacity変更だけでなく、

- inner light
- subtle reflection
- panel response
- small indicator

等を使用。

ただしGlow過多は禁止。

---

# 37. Game004背景

完全な黒一色は禁止。

暗い環境でも、

装置が置かれている空間

を感じられる程度の背景を付ける。

画像生成スキルを使用してよい。

---

# GAME005
# SORT SHIFT

## 38. Visual Mode

**HYBRID**

---

# 39. Game005 Art Direction

テーマ：

**奇妙な未来型仕分け工場**

ただし、

典型的な青いSFホログラム

にはしない。

もっと、

- color
- machinery
- conveyor
- mechanical motion

を感じられる、

明るいアーケードゲーム方向。

---

# 40. 仕分け対象

現在の単純図形だけでなく、

画像生成スキルで、

統一されたデザイン言語を持つ

**奇妙な配送物 / 製品**

を作る。

例：

- capsule
- package
- toy-like machine part
- strange food container
- mechanical object

ただしRULE判定に必要な、

ROUND
ANGULAR
LIGHT
DARK
SMALL
LARGE

等が視覚的に明確であること。

---

# 41. 最重要注意

デザインを凝った結果、

「丸いか角張っているか分からない」

等になってはいけない。

Gameplay Readabilityを最優先する。

---

# 42. Game005背景

仕分け工場。

- conveyor belts
- machine arms
- warning lights
- moving background mechanisms

等を使用してよい。

背景側の動きは操作対象を邪魔しない。

---

# 43. Image Generation Skill用途

推奨：

- conveyor environment concept
- package/object visual set
- machinery decoration
- background layers
- title art

---

# 44. Game005 UI

Rule表示は最重要。

画像背景に埋もれさせない。

例：

`ROUND ←  → ANGULAR`

等のRuleは、

非常に高い視認性を維持。

UI装飾よりルール理解を優先。

---

# 45. ゲームごとのVisual Identityを明確に分ける

4ゲームをゲーム一覧に並べたとき、

同一開発者によるテンプレート違い

に見せない。

---

## Game002

COMIC URBAN

Morning / Human / Street

---

## Game003

ILLUSTRATED INDUSTRIAL

Building / Height / Sky

---

## Game004

RETRO DEVICE

Memory / Machine / Concentration

---

## Game005

COLORFUL FACTORY

Sorting / Motion / Mechanical Pop

---

# 46. サムネイルも作る

各ゲームについて、

ゲーム一覧用Thumbnailを作成する。

画像生成スキルを利用してよい。

ただし、

実際のゲーム画面とかけ離れた宣伝画像

にはしない。

ゲームの内容が正しく伝わること。

---

# 47. Visual Library

以下を新規作成。

`docs/VISUAL_LIBRARY.md`

各ゲームについて記録：

- Art Mode
- Visual Keywords
- Main Palette
- Character Style
- Background Style
- UI Style
- Generated Asset List
- Avoid List

Game001 ORBIT SHIFTも既存Visualとして記録してよい。

今後Concept Designer / Art Directorが参照する。

目的：

100ゲームが同じ見た目になることを防ぐ。

---

# 48. Visual Brief

各ゲームについて以下を作る。

```text
docs/visual/GAME002_VISUAL_BRIEF.md
docs/visual/GAME003_VISUAL_BRIEF.md
docs/visual/GAME004_VISUAL_BRIEF.md
docs/visual/GAME005_VISUAL_BRIEF.md
```

最低限：

- Design Goal
- Mood
- Composition
- Character/Object Design
- Background
- UI
- Animation
- ImageGen Plan
- Avoid List

を記録。

---

# 49. Image Generation Log

各ゲームについて、

どの目的で画像生成を使用したか記録する。

例：

```text
GAME002

Generated:
- player character sheet
- obstacle character sheet
- residential background
- station background

Not Generated:
- score text
- buttons
- distance meter
```

これを、

`docs/visual/IMAGEGEN_LOG.md`

にまとめる。

---

# 50. Visual Screenshot Review

完成後、

各ゲームについて最低限：

### Desktop

1440×900相当

### Mobile portrait

390×844相当

のスクリーンショットを取得。

可能なら、

Title
Gameplay
Game Over

の3状態。

---

# 51. Visual Reviewerは画像を実際に見る

コードだけ読んで評価してはいけない。

取得したスクリーンショットを確認して、

Visual Quality Gateを採点する。

---

# 52. Before / After

各ゲームについて、

Before
After

を残す。

さらに、

`docs/VISUAL_REDESIGN_REPORT.md`

を作成。

---

# 53. VISUAL_REDESIGN_REPORT内容

各ゲームについて、

### Before Problem

何がチープだったか。

### Art Direction

どの方向へ変更したか。

### ImageGen Usage

何を画像生成したか。

### Implementation

どうゲームへ組み込んだか。

### Visual Review Score

各項目点数。

### Remaining Issues

残っている問題。

を記録。

---

# 54. 回帰テスト

今回ゲーム性を変更しないため、

変更前後で、

- Player speed
- Collision
- Score
- CREDIT
- Game Over
- Retry
- Difficulty
- Pattern
- Timing

等が変わっていないことを確認。

---

# 55. スマートフォン実機を意識する

高解像度画像を入れた結果、

- ロード増大
- FPS低下
- メモリ増大

が発生しないようにする。

画像サイズ・数を最適化。

---

# 56. 重要な判断基準

「画像を使ったから豪華」

ではない。

最終的な画面が、

**統一された一つのゲームとして見えるか**

で判断する。

生成画像とコード描画が別々の作品のように見えないようにする。

---

# 57. 禁止

今回、

Gameplayそのものを「ついでに改善」しない。

例えば、

- Game002に新しい敵を追加
- Game003の物理を変更
- Game004のsequence length変更
- Game005のRule追加

等は禁止。

必要だと感じた場合は、

`FUTURE_GAMEPLAY_SUGGESTIONS.md`

に記録するだけにする。

---

# 58. 画像生成スキルが使用可能なら必ず使用する

今回のタスクでは、

画像生成スキルが利用可能な環境なら、

Game002〜005のすべてで少なくとも一度は使用する。

ただし、

「生成画像を必ず本番採用する」

という意味ではない。

例えばGame004では、

Concept Artとして画像生成
↓
コードで再現

という使い方も正しい。

---

# 59. 画像生成スキルを単なる素材工場にしない

画像生成スキルは、

**Visual Exploration**

にも使用する。

必要なら最初に複数方向を生成し、

Art Directorが最も適した方向を選ぶ。

その後Asset Productionへ進む。

---

# 60. 自律判断

今回ユーザーへ細かなデザイン確認を逐一求めない。

Art Directorがゲーム内容を理解し、

最も適切と思われる方向を選択する。

ただし判断内容をVisual Briefへ記録する。

---

# 61. 今後への学習

今回のVisual Redesignは、

002〜005を直すことだけが目的ではない。

今後、

Concept
↓
Art Direction
↓
Image Generation
↓
Implementation
↓
Visual Review

をCodexだけで実行するための、

**Visual Production Pipelineの実証実験**

でもある。

---

# 62. 完成条件

Game002〜005について、

1. Gameplayが変更されていない
2. 明確なVisual Identityがある
3. Image Generation Skillを適切に利用している
4. Desktopで高品質
5. Mobileで高品質
6. Gameplay Readabilityを維持
7. 既存より明確に試作品感が減っている
8. Visual Quality Gate 80以上
9. Production Value 12/15以上
10. Gameplay Readability 12/15以上
11. Build成功
12. 回帰テスト成功
13. Before / After screenshot作成
14. VISUAL_REDESIGN_REPORT作成
15. VISUAL_LIBRARY作成
16. IMAGEGEN_LOG作成

を満たす。

---

# 63. Main Agentへの最終指示

今回のタスクは、

**Visual Redesignのみ**

である。

ゲームロジックを壊さない。

まず現在のGame002〜005の画面を実際に確認する。

その後、

Art Director
↓
Image Generation Skill
↓
Implementation
↓
Screenshot
↓
Visual Reviewer
↓
Revision

の順で進める。

特に、

「コードだけで描けば速い」

という理由で画像生成スキルを避けないこと。

同時に、

「画像生成できるから全部画像にする」

こともしない。

各ゲームの魅力を最大化するため、

Generated Assets
Procedural Graphics
UI Code
Animation
Effects

を適切に組み合わせる。

最終成果物は、

**既存のGame002〜005とゲーム内容は同じだが、見た瞬間の完成度は明確に一段以上高い状態**

とする。

作業を開始すること。