# 新作033／034 独立コード／要求レビュー

2026-10-15 UTC。desk_rainが担当。033/034の実装には参加せず、Jevの回答を読まず、ユーザー指示45～51章とソース・単体を照合。実際に確認したコードとモデル計算の範囲だけを記録する。実画像によるVisual・通常ブラウザ入力・本人の面白さ・物理スマホ・実機聴感は別判定。

## Findings（いずれも先にMainへ報告、レビュアーは製品ソース未変更）

**033-resume-space-focus: 再開後のSpaceが充填ではなく再pauseになり得る。** `main.ts` のpauseは#pauseクリックからdialogを開き、resumeはmenu.closeのみで#launch.focusを行わない。dialogの元focus復元で#pauseへ戻ると、Space keydownはlaunch以外のbuttonを除外してreturnし、native button操作がpauseを再発火させる。これはソースとnative dialog動作からの予測で、ブラウザ再現はまだ行っていない。実装者へ通知済み。限定focus修正と実際のpause→resume→Space長押し／離すの確認が必要。[独立judgment](../game033/QA/033-resume-space-focus-judgment.json)。

**NEW034-SITE8-NO-CLEAN: 最終現場にclean結果の到達可能な選択がない。** 実モデルをbundleし、全8現場の全1～3か所の組合せを120Hzで8秒実行。最終現場site7のみclean=trueが0通り（他現場は2～10通り）。最大点の選択はfoot-0／foot-1／beam-right、containment0.7120・demolished0.8398・小屋無事で1240点。全支柱除去は低下1.0でも範囲0.7779かつ小屋接触。cleanの目標（範囲90%以上・低下70%以上・小屋無傷）に達する合法選択がない。ユーザーの「きれいに崩す」を全現場で到達可能にするには最終現場のcontent調整が必要と判定。選択肢／物理／採点を列挙した証拠は [ALL-CUTS.json](QA/independent-034/ALL-CUTS.json)。Mainへ限定調整と全選択再検証を依頼済み。

## それ以外の要求照合

033: 一つのボタンを実長押しし離すとロケットが上昇、充填が開花高度へ直接対応。目標誤差12/32pxでperfect/good、最大充填は低い目標に失敗。100秒＋最後の飛行中花火を採点して一度だけ終局。コンボ・残光1.8秒／距離205px以内の連鎖・4連続の特別な二重リング。900粒子上限、煙・残光・水面反射を動的描画し夜景ImageGen背景を読む。練習は別runで時間無制限、3成功を実入力で目指しBEST／ランキング／本番runに入れない。pointercancel／lostcapture／pauseで充填取消、新gestureまで発射しない。個人BESTは完了本番のみ。

034: 8種の部品・支柱位置・重さ／重心・小屋側・目標範囲、実Matterの矩形部品を同じpose／角度で描く。最大3部品を削除、残部品を動かして8秒後に実質量による収まり・低下・小屋接触・操作箇所数・現場難度で得点。途中やり直しは累計へ重複加算せず、8現場合計完了だけBEST。練習は別world／記録除外。slowは同じfixed physicsへ進める実時間だけを減速する。左支柱のみの得点は現場ごとに異なり毎回最適ではない。最終現場clean未到達は上記finding。

独立実行: `npx vitest run tests/unit/game033.test.ts tests/unit/game034.test.ts` 2ファイル12件PASS。加えて034全合法cut組合せの実物理列挙を独立実行。全選択列挙はルールの到達性の証拠で、人間の推理やブラウザ入力の合格ではない。

## 034限定修正の独立再検証

実装者から最上部タンクx445→420だけを変更した通知を受け、Jev回答を読まず最終現場の全合法25選択を再列挙。clean解は1通りとなり、3支柱の除去でscore1498、範囲1.0・低下1.0・小屋無接触を確認した（正確な数値はJSON）。target／小屋／採点閾値を変えて成功扱いを緩める変更はない。元findingと元全選択の証拠は保持し、再検証は [SITE8-RETEST.json](QA/independent-034/SITE8-RETEST.json) へ別保存。通常ブラウザで同選択を実行することは引き続き必要。
