# Game018 ANGLE / SPIN 接合修正 — 未公開ローカル候補

2026-10-07（日本時間）。基準main `fd1d09a293cd8da1b9dbfeb73dc3e68e27ad7bcc`、修正ブランチ `codex/game018-connected-angle-spin`。開始時はclean。最新mainのAnalytics追加修正をfast-forwardで保全してから分岐した。main push、本番deploy、PR作成は実施しない。

## 実画面の観察とコード観察

- ユーザーの公開版PC操作：膝は自然で逆関節は再現せず、2回のANGLE→SPIN→POWER→結果、再挑戦、クリック／Enter／Spaceは正常。これは操作不能ではなく表示対応の問題。ユーザー側モバイル試遊は未実施。
- 今回の公開版PC／390pxスマホ相当のクリック／タップでも、SPINが人物のない大型カードへ切り替わる構図と、ANGLE85度付近の靴から離れた矢印を観察した。[公開版の実操作画像](QA/public-before/) と [記録](QA/public-before/report.json)。同意は拒否し、Analytics集計取得は行っていない。
- 最新コード：SPINの早期returnが全身描画を省く。ANGLE矢印のsin/cos位置は`kickPose().ankle`と別。足首は±.18rad、左右見本は`clock*4*sign`の定速。蹴り出し表示は横travel、縦sin(art angle)*travelで、本飛行のcos/sin角度と異なる。動画で遷移ジャンプを確定したという観察ではない。

## 限定変更

- `src/games/game018/ShoeBoard.ts`：全身の位置・サイズ・赤Tシャツ／短パンの絵を保ち、SPINの大型カードを本人の足へ接続した小さい拡大表示へ変更。黄色の固定支点、つま先、方向／強さ矢印と数値を表示。定速の左右見本を廃止し、選択値に合わせた靴の傾きを示す。ロック値を使いSPIN LOCK→POWERでも本人の足の向きを保持する。
- `src/games/game018/shoePose.ts`：描画専用の共通接合座標。足首の補正は中立から±.4rad（約23度）に制限し、足／靴の+14 offsetを同じ回転内で扱う。骨格は動かさない。ANGLEの矢印と弧は実際の靴中心へ接続。靴が離れる.63の接合点を固定し、射出表示／JUSTのtrailを設定角度のcos/sinへ揃える。離脱後の膝運動で靴を引きずらず、離脱時の位置・向きの段差も除く。
- `src/games/game018/main.ts`：小さい中立域の確定SPINをHUDでも`0`と表記。その他の入力・計測・保存処理は変更しない。
- `tests/unit/game018-shoe-pose.test.ts`：足首固定／靴とつま先の同一transform／安全な補正範囲／離脱時の連続性／5・45・85度の射出ベクトルを検証。
- `tests/game018/connected-preview.mjs`：同じ条件のCanvas比較fixtureと仮想時計のクリック／タップ収集。`tests/game018/connected-native.mjs`：ビルド版の通常時計・実入力・描画画素の確認。文書・QA画像・独立レビューとCURRENT_STATUSを追加。

`physics.ts`、`ShoeRun.ts`、`kickPose.ts`、`rarePresentation.ts`、`spinGuide.ts`、靴性能、型、CSS、HTMLはmainとbyte一致。他ゲーム・Analytics・広告・GA4・CREDIT・共通設定も変更しない。[保護監査](QA/PRESERVATION.json)。飛距離、左右spinの基礎効果、宇宙／レア条件、膝の分枝は維持。

## 検証

- `npm run check`：成功。
- `npx vitest run tests/unit/game018-shoe-pose.test.ts tests/unit/game018.test.ts tests/unit/game018-revision02.test.ts`：42件成功（既存38＋新4）。骨長・前膝、左右spinの物理、プレビューintegrator、レア条件／確率／得点不変を既存テストで確認。
- `npm test`：369件／43ファイル成功。`npm run build`：成功。既存018のCSS minify警告とPhaser大chunk警告は今回変更しない。
- PC1365×900／スマホ390×844：同値のANGLE5・45・85、SPIN左最大+1／中立0／右最大-1、SPIN LOCK、POWER、kick releaseを各9ケース撮影。これは実Canvasの値指定描画fixtureであり、プレイヤー操作で全ての厳密値を止めたという証拠ではない。[修正前](QA/before/)／[最終fixture](QA/after/)。前後で同じ靴（sneaker）・同じ値・viewport・reducedMotion指定。足首の局所補正だけが変わり、膝は保持された。
- ビルド版を通常時計でPC2RUN（click、Space＋Enter＋click）・スマホ相当2RUN（tap）。ANGLE→SPIN→POWER→kick→flight→結果→retry成功。撮影前2RAF待機、Canvas opaqueRatio>.95、pageerror0、production診断hookなし。[通常操作記録](QA/compiled-native/report.json)。これはブラウザーの入力・表示・状態の検証であり、人間の面白さ／実機評価ではない。

## 初回指摘とcollectorの制約

独立画像レビューでスマホの靴と支点／つま先ラベルの接近を発見し、拡大位置・倍率・ラベル余白を限定修正した。[初期候補](QA/after-preliminary/)を保持。最終fixtureと通常時計POWERの実画像は別に確認。

仮想時計を停止した初回`after/phone-native-power.png`はCanvasが単色であり、PASS枚数だけを実画面成功と扱わない。通常時計ではPC／phone計4RUNで描画を確認した。仮想時計側にもRAF待ちと不透明画素のassertを追加した限定再確認はPC／phoneとも成功し、phone POWERは待機前opaqueRatio=0→待機後1、phase=powerのまま再描画された。[限定再確認](QA/frozen-retest/report.json)。この再確認のためのruntime変更はなく、collectorの待機不足を支持する。初回の`native-kick`名画像は実際にはflightで、kick姿勢の証拠には使わない。正しいkickは値指定`kick-release`と通常時計・限定再確認記録の実phaseで確認する。初回collectorは停止時計内でRAFをawaitして停止したため再準備し、既存の縦scrollHeight（viewport+64）はbefore/after同じなので別の画面変更へ拡大しなかった。横overflowはない。

5 findingのJev Shadow routingと独立判断を記録。独立担当はJevの回答を見ずソース・実画像をレビューし、Jevは画像評価や修正／公開許可を代行しない。[独立画像レビュー](VISUAL_REVIEW.md)は対象setup画面PASS、88/100。今回5件では追加確認の要否は5/5一致、原因と次の証拠は各2/5一致。小標本かつ要対応findingのみで、効率・精度の一般評価はできない。[Shadow集計](QA/JEV_SUMMARY.json)。独立判断に関係なく通常QAを実施し、自動Gateは使用しない。

## 画像と再検証方法

主な同値比較：`QA/before/{desktop,phone}-angle{5,45,85}.png`と`QA/after/`同名、`{desktop,phone}-spin{left,neutral,right}.png`、`spin-lock.png`、`power.png`、`kick-release.png`。公開版の実操作は`public-before/`、通常時計の修正版実操作は`compiled-native/`。QAの画像は実際のCanvas／画面のスクリーンショットであり新しいキャラクター原画ではない。

手動試遊はdev server起動後 `http://127.0.0.1:5418/game018.html`。PCはクリックまたはSpace／Enterで各設定を止め、POWER確定後の結果から「もう一度」。タッチ相当は390×844で同じ順にタップする。画像collectorの同値fixtureは手動試遊と区別する。

```sh
npm run dev -- --port 5418
SHOE018_LABEL=local-capture node tests/game018/connected-preview.mjs
npm run build
npm run preview -- --port 5518
node tests/game018/connected-native.mjs
```

Playwrightと`/usr/bin/chromium`を使用。公開版収集はHTTP proxyを使用したread-only操作。候補の公開はしない。現在のsourceで`before`を再実行すると旧版の比較証拠にならないため、再収集は新しいlabelを使う。

## 未確認・残す境界

実機スマホの親指操作・音・FPS、人間の最終Visual／Feel評価、フレーム動画でのkick→本飛行カメラ遷移の全面評価は未実施。PC POWERゲージによる髪の一部遮蔽は旧版にもあり、今回は顔／胴体の全面変更を避けた。物理効果の変更は提案も実装も行わない。本番は旧版のままで、候補を公開済みとは扱わない。
