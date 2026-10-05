# Game018 — 独立Feelレビュー

**最終判定：機械的な遊びの成立と、修正後の高高度イベント視認性はPASS。人間の楽しさ・実機の指／音／酔いは未評価。** 初回findingと修正後の検証を以下に分けて保持する。

## 初回判定：NEEDS REVISION

実装担当とは別のFeel workerが、固定ソースを読み、native入力でブラウザを操作し、保存した実画像を見て判定した。初回は機械的なループが成立した一方、**高高度イベントで追尾する靴が大きなcaptionに隠れ、飛行機／UFOの実物が画面外へ流れるfinding**を発見した。Jevの判定をFeel合格の根拠にしていない。

対象[freeze原本](review-artifacts/feel/SOURCE_FREEZE.json)は `3a1603705e78bb6ccc5c7e6a227faded2ab170a729756653503e611dec04d397`。実行前後301ファイル一致、変更0。[初回report](review-artifacts/feel/report.json)／[初回実行log](review-artifacts/feel-run.log)／[native script](review-artifacts/feel-native.mjs)。Runtime／publicファイルはFeel workerが編集していない。

PC1440×900では初回4段階練習→5種を用いた7投→Retry→Enter／Spaceによる再投入力→pause→titleを完了。実際に止めた入力をreadonly純粋simulationへ渡した結果と、全7投のゲーム結果が完全一致した。native mouse／phone390×844 native tapだけでゲームを進め、モデル／clock／phaseへの書き込みとtutorial localStorage shortcutは0。純粋simulationによる同一入力の5靴比較は別記録であり、nativeプレイへ注入していない。

| PCの実入力例 | 距離 | 観測した結果 |
|---|---:|---|
| SNEAKER 中角度・通常POWER | 6.94km | 距離ルート、通常着地 |
| PAPER 高角度・JUST MAX | 2.24km | JET STREAM／雲／飛行機／UFO／人工衛星のイベント到達 |
| ZORI 中角度・強SPIN | 5.05km | TORNADO ZORI |
| LEATHER 低角度・JUST MAX | 4.36km | BUSINESS MISSILE／壁／連続貫通 |
| IRON GETA 低角度・通常POWER | 0.883km | 通常は短い距離、壁破壊 |
| IRON GETA 低角度・JUST MAX | 52.09km | IRON BREAKER／壁／連続貫通 |
| IRON GETA 高角度・JUST MAX | 41.68km | 最大高度22.31km、雲／飛行機／UFO |

各投のANGLE／SPIN／POWERはnativeタイミング操作の実測値で、上の例は入力を完全に揃えた比較ではない。靴固有の定量的比較にはreportの別項目 `pureComparisons` を用いる。

phoneは4段階練習、SNEAKERとPAPERの2投を完了。ZORI飛行中に、既知のsky findingを修正するためMainの指示でこのworkerのChromiumだけを終了した。Node collectorは終了させずcatch/finallyでreportを保存した。phoneのraw `FAIL: Target page, context or browser has been closed` はこの意図的なレビュー中断であり、製品不具合の判定ではない。全browser／contextは終了済み。

## 実画像のfinding

- [PC飛行機](review-artifacts/feel/desktop-paper-sky-just-event-AIRPLANE-BREAK.png)：AIRPLANE BREAKのcaptionは読めるが、飛行機の実物が見えない。紙の靴がcaptionの上に重なって淡くなり、追尾対象を判別しづらい。
- [PC UFO](review-artifacts/feel/desktop-paper-sky-just-event-UFO-INCIDENT.png)：UFOのcaptionのみ、靴の輪郭はcaptionの背後。実物のUFOが画面内に残っていない。
- [phone飛行機](review-artifacts/feel/phone-paper-sky-just-event-AIRPLANE-BREAK.png)：同様に靴をcaptionが覆い、飛行機を見られない。
- [phone UFO](review-artifacts/feel/phone-paper-sky-just-event-UFO-INCIDENT.png)：靴がcaptionに重なり、UFOはcanvas下端に一部だけ見える。
- [PC地上破壊](review-artifacts/feel/desktop-leather-ground-just-event-BREAK-.png)：靴、壊れた物体、破片／穴が同じ実画像にあり、地上では行為と結果を読める。

物理のイベント到達自体は成立している。速い高高度移動の実画像では「靴が飛行機／UFOを抜ける」体験と靴の追尾判読が不足するため、初回全体をFeel合格とはしない。通常のPlaywright assertionだけのPC `PASS` と、この画像に基づく `NEEDS REVISION` を分ける。

修正後は元の実行を残して、PCのPAPER／IRON GETA SKYとphoneの全5種／7投をnative入力で再検証する。最終freeze・実画像・結果を下に追記する。

## 人間評価の境界

実機の指、音を聴く確認、認知的なタイミング難度、JUST MAXを自分で狙う気持ちよさ、爽快感、楽しさ、視点移動での酔いは未評価。readonly値を待って入力する自動操作を、人間の反応時間・楽しさの合格に転用しない。

## 修正後判定：PASS（技術・実画像の確認範囲）

再検証実行：2026-10-05 08:48:17.896〜08:52:22.082 UTC（244.186秒）。最終freezeは `4e491ba21ec7f5b3bcfc86c1b5656e186d7dffc1f22fc94903afc1d19f27bfbd`。[freeze原本](review-artifacts/feel-retest/SOURCE_FREEZE.json)の301ファイルを実行前後に照合し、変更0。[再検証report](review-artifacts/feel-retest/report.json)／[log](review-artifacts/feel-retest-run.log)。全context／Chromiumを閉じてMainへブラウザ枠を返した。

再現コマンド：

```sh
GAME018_FEEL_MODE=targeted-retest GAME018_FEEL_DIR=docs/game018/review-artifacts/feel-retest node docs/game018/review-artifacts/feel-native.mjs
```

PCはPAPER／IRON GETAのSKYを2投、phoneは全5種を7投、いずれも新規contextの初回4段階練習から通常入力だけで完了。tutorial localStorageを事前に設定していない。初回の完了9投と最終候補の完了9投を別hashで保持する。PCの地上／中距離を最終候補で再実行したという主張ではない。

全9投について、実際にnative入力で止めたANGLE／SPIN／POWERの値を純粋simulateへ渡した結果と、ゲームの最終resultが完全一致。合計2269点のreadonly flight位置／camera projectionを観察し、靴がcanvas内に存在することを確認した。pageerror、console error、HTTP400以上はPC／phoneとも0。Retryで同じ靴のANGLEへ戻り、PCはEnter／Space／Enterによる3入力も行った。最後のpause→titleもnative操作で成功した。

### 実物・caption・hit-stopの再検証

実際の軌道上に0.55秒のholdを入れる修正により、高速移動でも異常な物体へ靴が当たる瞬間が画面内に残った。readonly `activeHold` から実際のAIRPLANE BREAK／UFO INCIDENT／ORBITAL SHOEを計10hold観測し、靴の実位置とholdのevent座標が一致することを検証した。モデル値だけでなく、次の画像を実viewして判定した。

- [PC飛行機](review-artifacts/feel-retest/desktop-paper-sky-just-hold-AIRPLANE-BREAK.png)：高さ2.20kmで飛行機と靴を同じ画面に表示。captionは上、対象は中央。
- [PC UFO](review-artifacts/feel-retest/desktop-paper-sky-just-hold-UFO-INCIDENT.png)：高さ6.50kmでUFOと靴が見え、captionは下へ移る。
- [PC人工衛星](review-artifacts/feel-retest/desktop-paper-sky-just-hold-ORBITAL-SHOE.png)：高さ25.0km、衛星／地球／紙の靴を表示。
- [PC鉄下駄と飛行機](review-artifacts/feel-retest/desktop-iron-sky-just-hold-AIRPLANE-BREAK.png)／[UFO](review-artifacts/feel-retest/desktop-iron-sky-just-hold-UFO-INCIDENT.png)：別の靴でも対象とcaptionが分離する。
- [phone飛行機](review-artifacts/feel-retest/phone-paper-sky-just-hold-AIRPLANE-BREAK.png)／[UFO](review-artifacts/feel-retest/phone-paper-sky-just-hold-UFO-INCIDENT.png)／[衛星](review-artifacts/feel-retest/phone-paper-sky-just-hold-ORBITAL-SHOE.png)：portraitで実物を見失わず、靴をcaptionが覆わない。
- [phone鉄下駄と飛行機](review-artifacts/feel-retest/phone-iron-sky-just-hold-AIRPLANE-BREAK.png)／[UFO](review-artifacts/feel-retest/phone-iron-sky-just-hold-UFO-INCIDENT.png)：重い靴の別軌道でも実物が中央に残る。

初回の「物理上は到達するが物体が画面外／captionで靴を隠す」findingは、この実入力と実画像の範囲で解消した。0.55秒の演出停止が人間に気持ちよいかは未確認だが、初回より行為と結果を見て理解できる状態になった。

### phone実投の差とテンポ

| native選択と止めた入力 | 距離 | 高度 | BREAK | 実結果 |
|---|---:|---:|---:|---|
| SNEAKER 48.1°／SPIN0.66／POWER93.1 | 7.54km | 2.12km | 0 | DISTANCE、通常POWER |
| PAPER 82.3°／SPIN0.75／POWER100 | 1.95km | 26.17km | 0 | JUST、JET STREAM、衛星まで到達 |
| ZORI 46.7°／SPIN1.00／POWER93.0 | 5.58km | 1.52km | 0 | TORNADO ZORI、GREAT SPIN |
| LEATHER 7.8°／SPIN0.94／POWER100 | 4.04km | 103m | 12 | BUSINESS MISSILE／壁／連続貫通 |
| IRON GETA 22.6°／SPIN0.89／POWER92.9 | 1.13km | 74m | 3 | 通常は短距離 |
| IRON GETA 22.7°／SPIN0.89／POWER100 | 55.93km | 5.03km | 8 | IRON BREAKER、JUSTの異常な初速 |
| IRON GETA 62.5°／SPIN0.88／POWER100 | 38.93km | 23.38km | 1 | IRON GETA EVENT／飛行機／UFO |

自動入力で一投を始めてresultをcaptureするまでの壁時計は17.0〜28.7秒。最高記録を無限に待つことはなく、着地→結果→Retry／靴変更を繰り返せた。normal投は仕様の20〜40秒目安より短い例もあった。これらは撮影待ちとreadonly値を待った入力を含み、人間の平均プレイ時間ではない。

[phone草履の飛行](review-artifacts/feel-retest/phone-zori-distance-spin-flight-1.png)、[革靴の破壊](review-artifacts/feel-retest/phone-leather-ground-just-event-BREAK-.png)、[スニーカーの飛行](review-artifacts/feel-retest/phone-sneaker-distance-normal-flight-1.png)、上の紙／鉄下駄の画像を実viewした。種類ごとの輪郭が大きく、靴が主人公を離れて主役へ移ることを読める。[POWER](review-artifacts/feel-retest/phone-paper-sky-just-power-gauge.png)と[JUST MAX](review-artifacts/feel-retest/phone-paper-sky-just-just-max.png)も実viewし、ゲージ→停止→強い演出の差を確認した。

### 同一入力の性能比較（native投と区別）

readonly純粋simulationの比較は同一ANGLE20°／SPIN0.8／POWER85。実ゲームへ結果や物理状態を注入していない。

| 靴 | 距離 | 高度 | BREAK | SPIN BONUS |
|---|---:|---:|---:|---:|
| PAPER | 5564.7m | 639.4m | 0 | 1587 |
| ZORI | 3431.2m | 290.9m | 0 | 3951 |
| SNEAKER | 4956.1m | 385.2m | 1 | 1890 |
| LEATHER | 3789.9m | 232.5m | 5 | 1436 |
| IRON GETA | 882.1m | 51.5m | 3 | 550 |

紙の軽さ、草履の回転BONUS、革靴の貫通、通常鉄下駄の重さを数値上でも区別できる。同じANGLE20°／SPIN0.8で鉄下駄のPOWERだけ100へ変えた純粋比較は51451.1m／高度4013.2m／BREAK11。万能スニーカーは中角度45°／SPIN0.45／POWER85の同一入力比較で6589.4m、5種中最長だった。20個の同一入力比較を各contextで2回計算し、再現性も一致した。

## 最終的な未実施項目

技術的な操作・表示・結果整合はPASS。人間による「3回止めたら結果がとんでもなくなる」落差の楽しさ、靴を変えて実験したい気持ち、初見の説明理解、JUST MAXの狙いやすさ、実機の指／音／FPS／酔いは未実施のまま。[人間評価フォーム](HUMAN_PLAYTEST.md)へ渡す。Jev、native自動入力、純粋simulationの一致から人間合格や公開許可を生成していない。
