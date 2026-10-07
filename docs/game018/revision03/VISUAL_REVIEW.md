# Game018 改訂03 — 独立Visualレビュー

2026-10-07（日本時間）。実装担当とは別の `/root/shoe018_review` がソースと実PNGを確認した。Jevの回答・ログは読まず、runtimeの編集、browserの操作、公開作業は行っていない。

**今回のANGLE/SPIN・確定後表示のVisual gateはPASS：88/100、F可読性13/15、H完成感13/15。** この点数は確認したsetup画面の評価であり、全演出・人間の面白さ・実機・公開の合格へ拡張しない。

|項目|max|点|
|---|---:|---:|
|A Identity|15|13|
|B Composition|10|9|
|C Asset clarity|10|9|
|D Palette|10|9|
|E Feedback|10|9|
|F Readability|15|13|
|G Small-screen usability|15|13|
|H Finish|15|13|

## 実画像の確認

- [before](QA/before/) と [after](QA/after/) のdesktop/phoneそれぞれ、ANGLE 5°/45°/85°、SPIN +1/0/-1、spin-lock、power、kick-releaseを同名画像で比較した。これらの正確な同値画像は描画fixtureであり、本番でその値を操作して得た証拠とは区別する。
- ANGLEの矢印と弧は実際に描画された靴の黄色点へ接続する。旧85°で根元が靴から上に離れた問題が解消し、5°は浅い上向き、45°は斜め、85°はほぼ上向きに読める。脚を85°まで不自然に持ち上げる変更はしていない。
- SPINでも赤Tシャツ・短パンの少年の全身が残る。同じ足首に点とリーダー線を付け、カード内の拡大が本人の足であることが分かる。左右最大・中立で足首位置は維持され、つま先の傾き、方向の文章、強さの矢印が対応する。
- SPIN LOCKは選んだ方向と強さを表示し、POWERでも同じ少年・足の向きとSPIN LOCK値が残る。切断したすね靴だけへの全面切替がなくなった。
- kick-releaseの静止画像はPC/phoneとも少年、裸足、離れた靴1足を識別できる。単一の静止画像だけで離脱→飛行の全フレームの滑らかさを合格にはしていない。
- [compiled-native](QA/compiled-native/) は通常時計・no debug/no fixtureによる実操作画像。phone-run0-power、phone-run1-power、desktop-run0-powerを実viewし、人物・POWERメーター・確定SPIN表示が描かれていることを確認した。同reportのPC click／Space+Enter+click、phone tap各2runの全工程とretry、pageerror0は実装担当の実行証拠であり、このreviewer自身の実操作とは称さない。

## 初回指摘と再確認

1. 初回 [after-preliminary/phone-spinright.png](QA/after-preliminary/phone-spinright.png) で靴のつま先と「つま先」、leftで踵と「固定支点」が重なった。位置・倍率・ラベル余白の限定修正後、最終phone±1/0・spin-lockを再viewし、靴と両ラベルが分離した。PCの余白も維持。初回原本を消して合格に読み替えていない。
2. [after/phone-native-power.png](QA/after/phone-native-power.png) は人物もメーターもない単色Canvasであり、初回reportのphase PASSだけから描画を合格にしなかった。仮想時計停止中の撮影・Canvas resizeを候補として通常時計再実行を依頼。compiled-nativeのphone POWER2枚では実画像も正常で、reportは各captureの実phaseとopaqueRatio=1を記録している。現証拠では通常時計の継続的な製品不具合は再現しておらず、旧仮想時計画像はcollectorの描画待機不足として扱う。仮想時計collectorの限定再確認はMain側のQA記録を参照する。

## コード観察（実画面観察と別）

`kickPose.ts`の前膝分枝・固定骨長と支持脚を変えていない。`shoePose.ts`の足首共通transform内で足と靴中心offsetを回し、ANGLE矢印・弧もその靴中心を使う。SPINの人体傾きは中立から±0.4radで、膝・すね全体は回していない。±spinの回転方向は既存canvas符号と同じ。

離脱後は`.63`時の共通アンカーを固定し、設定角度のcos/sin方向へ靴とtrailを描画する。以後の膝運動に靴を引っ張らせない。これは描画上の整合であり、飛距離・回転物理・宇宙／レア条件を変更する理由にはしない。モデルの不変・42対象単体の成功はMainのテスト記録で確認し、このreviewerが再実行したとはしない。

レビュー時runtime SHA256：

- `ShoeBoard.ts`: `8f7ce2dd966f765e49511da09dc8380876d784eb4a94d1e55635ec1c71ca1f76`
- `shoePose.ts`: `a573248ca282fc02f48f73d1c9cb66543ca5c456f76d3f430990d843834ac06d`
- `main.ts`: `ea77c3218bbdb96e1b57b2b87517369f2b83aa5059b571b6d0447fc60eeb74d5`

## 未確認と残る限界

PC POWERゲージは髪の一部を覆うが、同名before画像でも同じ既存表示である。操作、顔の識別、確定値は見えるため今回の変更によるblockerにはしない。スマホの補助文字は小さく、実機での読解・親指の快適さは未評価。

このreviewerは録画の全フレーム、音、実機スマホ、FPS、人間の初見理解・楽しさを評価していない。全5靴・全宇宙／レア演出の実画像網羅、320px／横画面、公開版の今回変更反映も本レビューの対象外。main push／本番deployはしない。
