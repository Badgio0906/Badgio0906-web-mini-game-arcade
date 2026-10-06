# Game003 独立 Visual / Game Feel 技術レビュー

担当: seven_parking（Game003実装担当ではない）。2026-10-06 UTC。対象は凍結された port 5205 の実装。製品コードの編集は行っていない。

**判定: 技術レビューPASS。Visual 83/100、F=12/15、H=13/15。人間による面白さの評価は未実施。**

## 実際に確認した証拠

- [独立PC/phone native実行](native/report.json)、[前後ソースhash・browser終了](native/SOURCE_SUMMARY.json)。両方PASS、console/page/HTTP errorなし、source前後一致。main `bb8ed030…`、model `17586e30…`、Scene `53c015f6…`、Training `f644762a…` は作者の最終hashと一致する。
- 1440×900のSpace、390×844のnative tapでそれぞれ、3実着地の任意練習、中央→右張り出し→左へ戻す本番の芸術組、pause凍結、中央3回から危険な実DROP→Result、retry、title、保存／mute再読込まで再実行した。readonly診断で入力時刻を選ぶ。stateや得点は書き換えていない。再現collectorは作者の通常入力collectorを独立ディレクトリへ写し、全3幅／逆方向ずれ／全3支持面の追加assertionを加えたもの。
- 自分の実画面をviewした: [PC張り出し](native/desktop-overhang.png)、[PC芸術確定](native/desktop-art-pair.png)、[phone芸術確定](native/phone-art-pair.png)、[phone練習完了](native/phone-practice-2.png)、[phone結果](native/phone-result.png)。単にファイルの存在を数えた判定ではない。
- 改修前 [PC](../../QA/before/003-desktop-play.png)、作者の改修後 [320練習](../../game003/QA/native-revised/narrow-practice-2.png)、[横画面](../../game003/QA/native-revised/landscape-overhang.png)、[最終phoneタイトル](../../game003/QA/title-final/phone.png)、[実C国芸術](../../game003/QA/mode-native-retest/C-art.png) もviewした。320／横画面／15mからのC国は作者の実行証拠であり、自分がその全RUNを再実行したとは扱わない。
- モデル／Scene／練習実装と18テストのassertionを読む独立監査。作者の単体・scoped TS・build合格は別証拠として参照し、本レビューで再実行していない。

## 全幅・支持・芸術の独立判断

本番の確定3階は176 / 172 / 168pxを保持し、切断されない。実画面の出っ張りとinspectionの横位置が一致する。PCの芸術319点、phone317点は中心入力の左右順へ加点したものではなく、実着地した2階の20〜46%逆向き横ずれと、弱い継ぎ目余裕または基礎偏りの3px以上改善に対する1回の加点である。中央PERFECTは同時に増えず、芸術と精度の内訳が分かれる。

`evaluateTowerStability` は最上階から全質量を積算し、各実接触区間に対してその上の合成重心を検査する。基礎だけを見る方式ではない。実PC芸術時の支持余裕は下から81.52 / 58.45 / 29.93px、phoneでは82.48 / 59.77 / 32.62pxで全て安定。Sceneの確定階は水平の判定矩形と一致し、三角印はその時点の最も危険な支持面、下の黄色い印は別の基礎合成重心を示す。既存4pxの支持graceは明示された近似モデルで、剛体物理を完全再現したという主張にはしない。

失敗時は実支持を外した荷物が落下し、その原因をResultで読めた。同じ側へ寄せ続ける下層破綻も全支持モデル／作者のテストで拒否する。芸術受賞済みの荷物IDは再利用不可。C国の既得点を維持し、将来の精度・芸術へ3倍を一度だけ適用することをコードと作者の実C国1026点証拠で照合した。

## Game Feel 技術判断

1入力でDROPする従来の単純さを保ち、初手PERFECT、張り出し、次の反対側への回復が別の判断になった。今回の独立実行でも、中央PERFECT→非PERFECTの張り出し→釣り合い確定を通常操作だけで成立させた。最初の3階は可動幅が広がり、芸術を狙う窓が数pxだけに固定されない。

金色の結線と短い芸術popupが成功を示し、PERFECTと芸術を別に読むことができる。落下と着地待ちが入力を受け付けず、押しっぱなしで複数DROPにならない。危険な実DROPではRUNが終わり、即retryできた。任意練習は別TowerRunによる3実着地で、本番階数0／新BEST0を維持した。

中央コンボが長く続けば強い得点になる価値を残したうえで、初期2PERFECT=300に対し今回の芸術1組=317／319だった。芸術を毎回選ぶ方が人間に楽しいか、リスクと報酬の好みが妥当かは未評価である。技術的に選択とその結果が成立するところを合格とする。

## Visual rubric

| 軸 | 点 | 実画面からの理由 |
|---|---:|---|
| A identity | 13/15 | クレーン、建物ファサード、街並み、階数により建築ゲームと即識別できる。 |
| B object appeal | 13/15 | 既存の細かい建物素材を保持し、張り出した全幅が主役になる。 |
| C background | 8/10 | 空と街の奥行きを維持し、足元と荷物を区別できる。 |
| D UI | 8/10 | 大きな階数、DROP、任意3開始、内訳、旧記録の区別が読み取れる。 |
| E composition | 8/10 | PC／portraitではプレイ領域と操作を優先。横画面は短い高さに収めるため余白と小さなstageが残る。 |
| F readability | 12/15 | 操作と主要階数はPC／phoneで明瞭。phone／短い横画面の支持三角印・細かな内訳は小さいため満点にしない。 |
| G motion | 8/10 | native実DROP、settle、落下→Resultを確認。確定物が不必要に傾かず判定と対応する。実機FPSは未測定。 |
| H production | 13/15 | 通常／芸術／練習／失敗／保存まで完成した実画面。文字や操作のclipなし。音と実機の触感は未確認。 |
| 合計 | **83/100** | **PASS（≥80、F/H≥12）** |

公開を止める製品不具合はこの独立確認では見つからなかった。支持印の細かさ、短い横画面での小さなstageは今後の可読性改善候補だが、主要な荷物位置・階数・DROPは読め、当落の一致を壊さない。人間試遊、実機スマートフォン、音、実機FPS、公開サイトの配信結果は本レビュー対象外。統合build／デプロイ判断はMain担当。
