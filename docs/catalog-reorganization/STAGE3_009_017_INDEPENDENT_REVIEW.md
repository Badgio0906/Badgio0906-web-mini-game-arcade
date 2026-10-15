# 第3工程 009／017 独立コード・要求レビュー

2026-10-15 JST。runner_fall担当。009／017の実装には参加していない。ユーザー37〜43章、固有仕様・モデル・入力／描画／保存・対象単体を照合し、Jev回答は読まず判断した。自作002／015／033は本書の独立評価に含めない。

009は要求された2〜3段階と12固有問題、017は雨宿りの待機／移動／dashの構造を持つ。保存の新版分離と単体の到達性は確認できた。下記2件の入力／可視判定不一致を検出し、rootがJev記録と限定修正後、コードで再確認した。実ブラウザ／Visual／Feel／人間試遊の合格とは別である。

| 対象 | 独立に確認した内容 | 通常操作で残る確認 |
|---|---|---|
| 009 | paper→penとdrawer→box→stampなど12種の前提操作を定義し、隠れた正解は前提完了まで選べない。`requires`／一回だけの操作／feedback中の重複加点防止、ヒント−30と誤答−2秒、90秒終局一回を確認。練習は紙と小箱の2問、時間無制限・score0・competitive resultなし。新bestRules3、旧best／bestRules2は読取表示だけ。 | 目に見える手掛かりと操作物の対応、発見アニメーション、320pxのscrollと44px対象、キー／touchの画面遷移、90秒本番、practiceと記録の除外。次のactionが常に一つだけ見えるため、手掛かりを読む工夫が生まれるかはFeel／本人試遊で判断し、モデル解存在だけで面白さを保証しない。 |
| 017 | 横視点、5種の屋根、11地点ゴール、雨量／風向きの周期と変化予告1秒、屋根回復／濡れ100失敗、0.48秒dashと1.7秒再使用制限。前進の最深位置だけの距離点と初屋根／乾いた連続到達で、放置・往復の稼ぎを防ぐ。新bestRelayV2／旧best読取表示、練習score0・結果なし。 | 小雨の窓を選ぶ判断、dashと左右の同時touch、pause後fresh press、風で動く緑枠の境界、forecastの読みやすさ、通常11屋根完走と濡れ失敗、実機操作。 |

## 初回findingと再確認

1. `stage3-rain-held-repeat-after-pause`: 元の方向keydownはrepeatでもheldへ追加。pause→resumeでclearInputした後、押したままのOS repeatが方向を再登録し、fresh press前に動く可能性。rootはhandled keyでrepeatをreturnする限定修正を実施。再読でheld.add前のguardを確認。ブラウザの実キー保持→pause→resume→解放→fresh pressは最終固定QAで確認する。[独立判断JSON](QA/STAGE3_017_REPEAT_JUDGMENT.json)。
2. `stage3-rain-shelter-wind-bounds`: 元の描画緑枠left+12に対し、風のmodelはleft+20で、見える安全枠の左8pxが濡れる。rootが`RelayRun.shelterBounds`を共用し、shelterAt／緑塗り・破線／雨の透過すべてで同じ境界を使用するよう限定修正。再読で同じhelper参照を確認。実画面と境界接触は固定QAへ残す。[独立判断JSON](QA/STAGE3_017_WIND_BOUNDS_JUDGMENT.json)。

追加の要求照合として、両mainの標準score／best_update／retry／quit、および017 pause／resumeのTelemetryイベント不足をrootへ報告した。現行はscore/BEST保存とrecordSessionはあり、run_endに結果／quitはある。desk担当が別findingをJevへ記録後に限定修正し、独立再読でscore一回／strictなbest改善のみ／resultからretry／標準RUN quit／017の標準pause・resumeと009のpractice除外を確認した。各QAへ `game009-standard-events-judgment.json`／`game017-standard-events-judgment.json` を保存した。ブラウザイベント数は未測定。

## 独立検証

`npx vitest run tests/unit/game009.test.ts tests/unit/game017-relay.test.ts tests/unit/game017.test.ts`: **3ファイル38件PASS**。009は12開始offset×12問題の解、017は100seedの屋根間距離と3seed通常wait/move/dash方策で全11屋根完走。旧017モデル23件も保持。

モデルの方策は技術的な攻略可能性の証拠で、反応の自然さ／人間の面白さの合格ではない。ソース再確認はrootの同時統合中に行い、固定した長いブラウザRUNは実施していない。人間評価・物理スマホ・聴感は未実施。

## 固定通常ブラウザQAの準備

`tests/catalog-reorganization/stage3-independent-009-017.mjs` を作成（構文確認済み、まだ実行していない）。対象固定sourceは `/workspace/arcade-stage3`、commit `c057d2f06d931911011a6f202c131140634794b7`。ゲームソースは変更しない。実行例：

```sh
STAGE3_BASE=http://127.0.0.1:4935/ STAGE3_ROOT=/workspace/arcade-stage3 STAGE3_OUT=docs/catalog-reorganization/QA/stage3-009-017-fixed-01 node tests/catalog-reorganization/stage3-independent-009-017.mjs
```

4画面は1440×900／390×844／320×720／844×390。009は説明→実練習2問→本番4問→通常誤答の−2秒で実timeout→結果／retry。12問全探索は単体の証拠と区別する。017は説明→通常左右／dashで実練習→本番、readonly DEV診断があればそれを読み、productionでは可視距離／濡れ／予報／屋根数と固定sourceの屋根位置から方策を選ぶ。状態・位置・得点・時計の書換えは行わない。11屋根到達を目指し、結果が到達でない場合はそのまま失敗として残す。

旧BEST777／009旧v2は888／新版23というQA保存fixtureを未保存時だけ投入。practice除外、標準score・best_update一回、pause／resume、retry／quit、mute・保存reload、帰還とbrowser back、44px／横overflow、source前後hashを確認する。consent denied fixture、全非GET遮断と広告／Analytics GET offline fixtureを使い、実本番へ投稿しない。ブラウザ枠の割当後に実行する。

## 固定a323の独立通常ブラウザQA — 完了

2026-10-15 UTC、source `a32344b8185e8ffb4eb80e92f2a687ecca294f6c`、固定DEV4176。`stage3-independent-009-017.mjs` を実行し、**4画面×2作品=8case／644check PASS**。source前後hash一致、pageerror0、非GET／POST試行0。全context／browserを閉じた。

[実report](QA/stage3-009-017-a323-native-01/REPORT.json)／[実行ログ](QA/stage3-009-017-a323-native-01/collector.log)。画面は1440×900、390×844、320×720、844×390。4画面とも次を通常操作で確認した。

- 009: 説明、実練習2問、練習のBEST／競争イベント除外、本番の異なる4問題、実ヒント、pauseの時計／score停止、通常誤答の−2秒で実timeout、結果、score／best_update一回、retry、旧best777／旧v2=888の保持、新版BEST、mute・保存reload、quit／帰還・browser back。
- 017: 説明、通常左右／dashの実練習、練習の競争記録除外、pause中の位置／濡れ／天候停止、押したままのrepeat拒否と解放後fresh key、本番全11屋根への通常到達、結果、score／best_update一回、pause／resume／retry／quitイベント、旧best777と新BEST分離、mute・保存reload、帰還・browser back。

017の方策はreadonly DEV診断で次の屋根・雨・濡れを見て、PCキーまたはnative touch方向ボタンとdashだけを使った。状態／時計／score／位置は注入していない。009の12問全体は単体の証拠であり、今回browserの4問／幅と混同しない。

実動作画像は同report directory。009 `*-found-motion-a.png`→`b.png` は通常発見時、017 `*-walk-motion-a.png`→`b.png` は通常歩行の前後。説明／練習／本番／pause／結果の全画面も保存。独立Art Directorの実画像評価へ引き渡した。物理端末／実音／本人の面白さは未実施。
